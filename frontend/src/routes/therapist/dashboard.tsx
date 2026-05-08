import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, TrendingUp, Star, Video, Brain, ChevronRight, Plus, Minus, LogOut, MessageCircle } from 'lucide-react';
import API from '@/lib/api';
import { Button } from '@/components/ui/button';
import { UserButton } from '@clerk/clerk-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/therapist/dashboard')({ component: TherapistDashboard });

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DEFAULT_SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

function riskBadge(level: string) {
  const map: Record<string, string> = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-amber-100 text-amber-800',
    high: 'bg-red-100 text-red-800',
    unknown: 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${map[level] ?? map.unknown}`}>
      {level}
    </span>
  );
}

function TherapistDashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'schedule' | 'availability' | 'earnings' | 'profile' | 'subscription'>('schedule');
  const [briefBookingId, setBriefBookingId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<{ day: number; slots: string[] }[]>(
    DAYS.map((_, day) => ({ day, slots: day >= 1 && day <= 5 ? ['10:00', '14:00', '16:00'] : [] }))
  );

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['therapist-stats'],
    queryFn: () => API.therapist.meStats(),
  });

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['therapist-bookings'],
    queryFn: () => API.therapist.meBookings(),
  });

  const { data: briefData, isLoading: briefLoading } = useQuery({
    queryKey: ['ai-brief', briefBookingId],
    queryFn: () => API.booking.getAiBrief(briefBookingId!),
    enabled: !!briefBookingId,
  });

  const availabilityMutation = useMutation({
    mutationFn: () => API.therapist.updateAvailability({ availability }),
    onSuccess: () => toast.success('Availability saved'),
    onError: (e: Error) => toast.error(e.message),
  });

  const profileMutation = useMutation({
    mutationFn: (data: any) => API.therapist.updateProfile(data),
    onSuccess: () => {
      toast.success('Profile updated');
      qc.invalidateQueries({ queryKey: ['therapist-stats'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const profile = statsData?.profile;
  const stats = statsData?.stats;
  const bookings: any[] = bookingsData?.bookings ?? [];

  const [profileForm, setProfileForm] = useState({
    bio: '',
    fee: 1500,
    specializations: '',
    introVideoUrl: '',
  });

  useEffect(() => {
    if (profile) {
      setProfileForm({
        bio: profile.bio || '',
        fee: profile.sessionFee || 1500,
        specializations: profile.specializations?.join(', ') || '',
        introVideoUrl: profile.introVideoUrl || '',
      });
      if (profile.availability && profile.availability.length > 0) {
        setAvailability(profile.availability);
      }
    }
  }, [profile]);

  const today = new Date().toDateString();
  const todayBookings = bookings.filter((b) => new Date(b.slot).toDateString() === today && b.status === 'confirmed');
  const upcomingBookings = bookings.filter((b) => new Date(b.slot) > new Date() && b.status === 'confirmed')
    .sort((a, b) => new Date(a.slot).getTime() - new Date(b.slot).getTime());

  const canJoin = (slot: string) => {
    const diff = new Date(slot).getTime() - Date.now();
    return diff <= 15 * 60 * 1000 && diff > -2 * 60 * 60 * 1000;
  };

  const toggleSlot = (day: number, slot: string) => {
    setAvailability((prev) =>
      prev.map((d) =>
        d.day !== day ? d : {
          ...d,
          slots: d.slots.includes(slot) ? d.slots.filter((s) => s !== slot) : [...d.slots, slot].sort(),
        }
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white font-bold text-xl shadow-md">
              {profile?.name?.charAt(0) ?? 'T'}
            </div>
            <div>
              <p className="font-display font-bold text-lg text-slate-900 tracking-tight">{profile?.name ?? 'Therapist'}</p>
              <div className="flex items-center gap-2">
                <Star className="size-3 text-amber-400 fill-amber-400" />
                <span className="text-xs text-slate-500">{profile?.rating?.toFixed(1) ?? '–'} · {stats?.completedSessions ?? 0} sessions</span>
                {profile?.verified && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">RCI ✓</span>}
              </div>
            </div>
          </div>
          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: { userButtonAvatarBox: "size-8" }
            }}
          />
        </div>
      </header>

      {/* Stats Bar */}
      {!statsLoading && (
        <div className="bg-gradient-to-r from-teal-600 to-teal-800 text-white shadow-inner">
          <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-4 gap-4">
            {[
              { label: "Today's sessions", value: todayBookings.length },
              { label: 'This month', value: stats?.monthBookings ?? 0 },
              { label: 'Month earned', value: `₹${(stats?.monthEarned ?? 0).toLocaleString('en-IN')}` },
              { label: 'Payout (85%)', value: `₹${(stats?.nextPayout ?? 0).toLocaleString('en-IN')}` },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-2xl font-bold">{s.value}</p>
                <p className="text-sm text-teal-100/80 mt-1 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Nav */}
      <div className="sticky top-[73px] z-20 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex gap-2">
          {(['schedule', 'availability', 'earnings', 'profile', 'subscription'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-3.5 text-sm font-bold capitalize border-b-2 transition ${
                tab === t ? 'border-teal-600 text-teal-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* SCHEDULE TAB */}
        {tab === 'schedule' && (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-6">
            {/* Unread messages panel */}
            <div className="bg-gradient-to-r from-teal-50 to-white border border-teal-100 rounded-3xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-2xl text-teal-600 shadow-sm border border-teal-50">
                  <MessageCircle className="size-6" />
                </div>
                <div>
                  <p className="font-display font-bold text-teal-900 text-lg">3 unread messages</p>
                  <p className="text-sm font-medium text-teal-700/80 mt-0.5">from past clients</p>
                </div>
              </div>
              <Button variant="outline" className="text-teal-700 border-teal-200 hover:bg-teal-100 rounded-xl h-10 px-5 font-semibold">View Inbox</Button>
            </div>

            {/* Demo Video Session Button */}
            <div className="bg-gradient-to-r from-indigo-50 to-white border border-indigo-100 rounded-3xl p-5 flex items-center justify-between shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className="bg-white p-3 rounded-2xl text-indigo-600 shadow-sm border border-indigo-50">
                  <Video className="size-6" />
                </div>
                <div>
                  <p className="font-display font-bold text-indigo-900 text-lg">Test Video Session</p>
                  <p className="text-sm font-medium text-indigo-700/80 mt-0.5">Try out the live video room</p>
                </div>
              </div>
              <Link to="/session/demo-room" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md transition">
                Join Demo
              </Link>
            </div>

            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Upcoming Sessions</h2>
            {bookingsLoading && <div className="h-32 rounded-3xl bg-slate-200 animate-pulse border border-slate-100" />}
            {upcomingBookings.length === 0 && !bookingsLoading && (
              <p className="text-slate-500 text-sm font-medium">No upcoming sessions scheduled.</p>
            )}
            {upcomingBookings.slice(0, 10).map((b, i) => (
              <motion.div key={b.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{delay: i*0.05}}
                className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="grid size-12 place-items-center rounded-2xl bg-teal-50 text-teal-700 font-bold border border-teal-100/50">
                      #{b.id?.slice(-3) ?? '?'}
                    </div>
                    <div>
                      <p className="font-display font-bold text-slate-900 text-lg">Client (Anonymous)</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="size-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-500">
                          {new Date(b.slot).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                          {' · '}
                          {new Date(b.slot).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-teal-700">₹{b.fee}</span>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setBriefBookingId(b.id)}
                    className="flex items-center gap-2 text-sm font-bold text-teal-700 bg-teal-50 px-4 py-2.5 rounded-xl hover:bg-teal-100 transition border border-teal-100">
                    <Brain className="size-4" /> AI Brief
                  </button>
                  {canJoin(b.slot) ? (
                    <button onClick={() => navigate({ to: `/session/${b.id}` })}
                      className="flex items-center gap-2 text-sm font-bold text-white bg-teal-600 px-4 py-2.5 rounded-xl hover:bg-teal-700 transition shadow-md">
                      <Video className="size-4" /> Start Session
                    </button>
                  ) : (
                    <span className="text-sm font-medium text-slate-400 py-2.5 bg-slate-50 px-4 rounded-xl border border-slate-100">Available 15 min before</span>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* AVAILABILITY TAB */}
        {tab === 'availability' && (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 flex justify-between items-end">
              <span>Week-View Calendar</span>
              <Button onClick={() => availabilityMutation.mutate()} disabled={availabilityMutation.isPending} className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-10 px-6 font-bold shadow-md">
                {availabilityMutation.isPending ? 'Saving…' : 'Save Availability'}
              </Button>
            </h2>
            <p className="text-sm font-medium text-slate-500">Click a slot to toggle availability. Green slots are open for booking.</p>
            
            <div className="bg-white rounded-3xl border border-slate-200 overflow-x-auto p-6 shadow-sm hover:shadow-md transition">
              <div className="min-w-[600px] grid grid-cols-8 gap-3">
                <div className="space-y-3 pt-10">
                  {DEFAULT_SLOTS.map(s => (
                    <div key={s} className="h-11 flex items-center justify-end pr-3 text-xs font-bold text-slate-400 uppercase tracking-wide">{s}</div>
                  ))}
                </div>
                {DAYS.map((day, i) => (
                  <div key={i} className="space-y-3">
                    <div className="text-center font-display font-bold text-sm text-slate-700 pb-3 border-b border-slate-100 mb-3">{day}</div>
                    {DEFAULT_SLOTS.map((slot) => {
                      const active = availability.find((d) => d.day === i)?.slots.includes(slot);
                      return (
                        <button key={slot} onClick={() => toggleSlot(i, slot)}
                          className={`w-full h-11 rounded-xl text-xs font-bold transition-all shadow-sm ${
                            active ? 'bg-teal-50 text-teal-700 border-2 border-teal-500 shadow-inner' : 'bg-slate-50/50 text-slate-400 border border-slate-200 hover:bg-slate-100'
                          }`}>
                          {active ? 'Available' : '-'}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* EARNINGS TAB */}
        {tab === 'earnings' && (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Earnings Summary</h2>
            <div className="grid grid-cols-2 gap-5">
              {[
                { label: 'Total Earned', value: `₹${(stats?.totalEarned ?? 0).toLocaleString('en-IN')}` },
                { label: 'This Month', value: `₹${(stats?.monthEarned ?? 0).toLocaleString('en-IN')}` },
                { label: 'Next Payout (85%)', value: `₹${(stats?.nextPayout ?? 0).toLocaleString('en-IN')}` },
                { label: 'Total Sessions', value: stats?.completedSessions ?? 0 },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-3xl border border-slate-200 p-6 text-center shadow-sm hover:shadow-md transition">
                  <p className="font-display text-3xl font-bold text-teal-700">{s.value}</p>
                  <p className="text-sm font-medium text-slate-500 mt-2">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-amber-50/50 rounded-2xl border border-amber-200/50 p-5 text-sm font-medium text-amber-800">
              MindGod retains 15% platform fee. Payouts are processed on the 1st of every month via NEFT.
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden mt-8 shadow-sm">
              <div className="px-6 py-4 bg-slate-50/80 border-b border-slate-200 font-display font-bold text-slate-900">Recent Transactions</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50/50 border-b border-slate-200 text-slate-500 uppercase text-xs font-bold tracking-wider">
                    <tr><th className="px-6 py-4">Date</th><th className="px-6 py-4">Session ID</th><th className="px-6 py-4">Gross Amount</th><th className="px-6 py-4">Commission (15%)</th><th className="px-6 py-4">Net Payout</th><th className="px-6 py-4">Status</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookings.slice(0, 10).map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 text-slate-500 font-medium">{new Date(b.slot).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-slate-900 font-bold">#{b.id.slice(-5)}</td>
                        <td className="px-6 py-4 font-medium">₹{b.fee}</td>
                        <td className="px-6 py-4 text-red-500 font-medium">-₹{b.fee * 0.15}</td>
                        <td className="px-6 py-4 font-bold text-teal-700">₹{b.fee * 0.85}</td>
                        <td className="px-6 py-4"><span className="bg-teal-50 border border-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide">PROCESSED</span></td>
                      </tr>
                    ))}
                    {bookings.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center font-medium text-slate-500">No recent transactions.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* PROFILE TAB */}
        {tab === 'profile' && (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Profile Editor</h2>
            <div className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 shadow-sm max-w-2xl">
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Intro Video URL (YouTube/Vimeo)</label>
                <input value={profileForm.introVideoUrl} onChange={e => setProfileForm(p => ({...p, introVideoUrl: e.target.value}))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Session Fee (₹)</label>
                <input type="number" value={profileForm.fee} onChange={e => setProfileForm(p => ({...p, fee: Number(e.target.value)}))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Specialisations (comma separated)</label>
                <input value={profileForm.specializations} onChange={e => setProfileForm(p => ({...p, specializations: e.target.value}))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none transition" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-600 mb-2">Bio & Approach</label>
                <textarea rows={4} value={profileForm.bio} onChange={e => setProfileForm(p => ({...p, bio: e.target.value}))} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none resize-none transition" />
              </div>
              <Button onClick={() => profileMutation.mutate(profileForm)} disabled={profileMutation.isPending} className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-12 font-bold shadow-md">
                {profileMutation.isPending ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </motion.div>
        )}

        {/* SUBSCRIPTION TAB */}
        {tab === 'subscription' && (
          <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="space-y-6">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">Subscription Tiers</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {['Basic', 'Professional', 'Clinic'].map((tier, i) => (
                <div key={tier} className={`rounded-3xl border-2 p-8 flex flex-col shadow-sm transition hover:-translate-y-1 hover:shadow-md bg-white ${i === 1 ? 'border-teal-500 relative' : 'border-slate-200'}`}>
                  {i === 1 && <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-sm">Popular</span>}
                  <h3 className="font-display text-2xl font-bold text-slate-900">{tier}</h3>
                  <div className="mt-3 text-4xl font-bold text-teal-700">₹{[999, 2499, 4999][i]}<span className="text-sm font-bold text-slate-400">/mo</span></div>
                  <ul className="mt-8 mb-10 space-y-4 flex-1 text-sm font-medium text-slate-600">
                    <li className="flex gap-3"><span className="text-teal-500 font-bold">✓</span> Listing in directory</li>
                    <li className="flex gap-3"><span className="text-teal-500 font-bold">✓</span> {[10, 50, 'Unlimited'][i]} bookings/mo</li>
                    {i > 0 && <li className="flex gap-3"><span className="text-teal-500 font-bold">✓</span> AI Session Briefs</li>}
                    {i > 1 && <li className="flex gap-3"><span className="text-teal-500 font-bold">✓</span> Priority support</li>}
                  </ul>
                  <Button variant={i === 1 ? 'default' : 'outline'} className={`w-full rounded-xl h-12 font-bold ${i===1?'bg-teal-600 hover:bg-teal-700 text-white shadow-md':'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                    {i === 0 ? 'Current Plan' : 'Upgrade'}
                  </Button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* AI Brief Modal */}
      <AnimatePresence>
        {briefBookingId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
            onClick={() => setBriefBookingId(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-2">
                  <Brain className="size-5 text-teal-600" />
                  <h3 className="font-bold text-slate-900">AI Pre-Session Brief</h3>
                </div>
                <button onClick={() => setBriefBookingId(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
              </div>

              {briefLoading && (
                <div className="p-6 space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-4 bg-slate-200 rounded animate-pulse" />)}
                </div>
              )}

              {briefData && (
                <div className="p-6 space-y-6">
                  {/* Risk level */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-700">Risk Level:</span>
                    {riskBadge(briefData.riskLevel)}
                    {briefData.avgMood && (
                      <span className="text-sm text-slate-500">Avg mood: {briefData.avgMood}/10</span>
                    )}
                  </div>

                  {/* Groq Summary */}
                  {briefData.groqSummary && (
                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                      <p className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-2">AI Summary</p>
                      <p className="text-sm text-teal-900 whitespace-pre-line">{briefData.groqSummary}</p>
                    </div>
                  )}

                  {/* 7-day mood chart */}
                  {briefData.moodChart?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">7-Day Mood</p>
                      <div className="flex items-end gap-1 h-16">
                        {briefData.moodChart.map((m: any, i: number) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-1">
                            <div className="w-full rounded-sm bg-teal-400"
                              style={{ height: `${(m.score / 10) * 56}px`, minHeight: 4 }} />
                            <span className="text-[9px] text-slate-400">
                              {new Date(m.date).getDate()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent journals */}
                  {briefData.recentJournals?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Recent Journal Excerpts</p>
                      <div className="space-y-2">
                        {briefData.recentJournals.map((j: any, i: number) => (
                          <div key={i} className="bg-slate-50 rounded-lg p-3">
                            <p className="text-xs text-slate-400 mb-1">{new Date(j.date).toLocaleDateString('en-IN')}</p>
                            <p className="text-sm text-slate-700 italic">"{j.excerpt}…"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
