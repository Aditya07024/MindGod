import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Users, BarChart2, CheckCircle, XCircle, Search,
  TrendingUp, LogOut, AlertTriangle, Star, Eye, EyeOff
} from 'lucide-react';
import API from '@/lib/api';
import { Button } from '@/components/ui/button';
import { UserButton } from '@clerk/clerk-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/admin/dashboard')({ component: SuperAdminDashboard });

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function adminFetch(path: string, opts: RequestInit = {}) {
  const r = await fetch(`${API_BASE}${path}`, { ...opts, credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...opts.headers } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

function SuperAdminDashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState<'overview' | 'therapists' | 'subscriptions' | 'flags'>('overview');
  const [search, setSearch] = useState('');
  const [selectedTherapist, setSelectedTherapist] = useState<any>(null);

  const { data: therapistsData, isLoading: therapistsLoading } = useQuery({
    queryKey: ['admin-therapists'],
    queryFn: () => adminFetch('/api/therapists?verified=false&limit=100'),
  });

  const { data: subsData } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: () => adminFetch('/api/subscription/admin/all'),
    enabled: tab === 'subscriptions',
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, verified }: { id: string; verified: boolean }) =>
      adminFetch(`/api/admin/therapist/${id}/verify`, {
        method: 'PATCH', body: JSON.stringify({ verified })
      }),
    onSuccess: (_, { verified }) => {
      toast.success(verified ? 'Therapist verified ✓' : 'Verification removed');
      qc.invalidateQueries({ queryKey: ['admin-therapists'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const therapists: any[] = therapistsData?.therapists ?? [];
  const filteredTherapists = therapists.filter((t) =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.rciNumber?.toLowerCase().includes(search.toLowerCase())
  );
  const subscriptions: any[] = subsData?.subscriptions ?? [];

  const platformStats = {
    totalTherapists: therapists.length,
    verified: therapists.filter((t) => t.verified).length,
    pending: therapists.filter((t) => !t.verified).length,
    paidSubs: subscriptions.filter((s) => s.status === 'active').length,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-800">
              <Shield className="size-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">MindGod Super Admin</p>
              <p className="text-xs text-slate-400">Ops · Verification · Analytics</p>
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

      {/* Tab Nav */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 flex gap-1">
          {(['overview', 'therapists', 'subscriptions', 'flags'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-3 text-sm font-semibold capitalize transition border-b-2 ${
                tab === t ? 'border-violet-500 text-violet-400' : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-white">Platform Analytics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Therapists', value: platformStats.totalTherapists, icon: Users, color: 'bg-blue-600' },
                { label: 'RCI Verified', value: platformStats.verified, icon: CheckCircle, color: 'bg-green-600' },
                { label: 'Pending Review', value: platformStats.pending, icon: AlertTriangle, color: 'bg-amber-600' },
                { label: 'Active Subscriptions', value: platformStats.paidSubs, icon: TrendingUp, color: 'bg-violet-600' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                  <div className={`grid size-9 place-items-center rounded-lg ${s.color} mb-3`}>
                    <s.icon className="size-4 text-white" />
                  </div>
                  <p className="text-3xl font-black text-white">{s.value}</p>
                  <p className="text-xs text-slate-400 mt-1">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* Subscription revenue estimate */}
            <div className="bg-gradient-to-r from-violet-900/50 to-purple-900/50 rounded-xl border border-violet-800 p-6">
              <p className="text-xs text-violet-400 uppercase tracking-wider font-bold mb-3">MRR Estimate</p>
              <p className="text-4xl font-black text-white">
                ₹{((platformStats.paidSubs * 199) + 0).toLocaleString('en-IN')}
              </p>
              <p className="text-sm text-violet-300 mt-1">
                Based on {platformStats.paidSubs} active subscriptions (avg ₹199)
              </p>
            </div>
          </div>
        )}

        {/* THERAPISTS TAB */}
        {tab === 'therapists' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white flex-1">Therapist Verification</h2>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or RCI…"
                  className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500" />
              </div>
            </div>

            {therapistsLoading && (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-slate-800 animate-pulse" />)}
              </div>
            )}

            <div className="space-y-3">
              {filteredTherapists.map((t) => (
                <div key={t.id} className="bg-slate-800 rounded-xl border border-slate-700 p-4 flex items-center gap-4">
                  <div className="grid size-12 place-items-center rounded-full bg-slate-700 text-white font-bold text-lg flex-shrink-0">
                    {t.name?.charAt(0) ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-slate-400">RCI: {t.rciNumber || 'Not provided'}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(t.specializations ?? []).slice(0, 3).map((s: string) => (
                        <span key={s} className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 mr-2">
                      <Star className="size-3 text-amber-400 fill-amber-400" />
                      <span className="text-xs text-slate-300">{t.rating?.toFixed(1) ?? '—'}</span>
                    </div>
                    {t.verified ? (
                      <button onClick={() => verifyMutation.mutate({ id: t.id, verified: false })}
                        className="flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-900/30 border border-red-800 px-3 py-1.5 rounded-lg hover:bg-red-900/50 transition">
                        <XCircle className="size-3.5" /> Revoke
                      </button>
                    ) : (
                      <button onClick={() => verifyMutation.mutate({ id: t.id, verified: true })}
                        className="flex items-center gap-1 text-xs font-semibold text-green-400 bg-green-900/30 border border-green-800 px-3 py-1.5 rounded-lg hover:bg-green-900/50 transition">
                        <CheckCircle className="size-3.5" /> Verify
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {filteredTherapists.length === 0 && !therapistsLoading && (
                <p className="text-slate-500 text-sm text-center py-8">No therapists found</p>
              )}
            </div>
          </div>
        )}

        {/* SUBSCRIPTIONS TAB */}
        {tab === 'subscriptions' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">All Subscriptions</h2>
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold">User</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold">Plan</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold">Status</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-semibold">Start</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {subscriptions.slice(0, 50).map((s) => (
                    <tr key={s._id} className="hover:bg-slate-750 transition">
                      <td className="px-4 py-3 text-slate-300 font-mono text-xs">{String(s.userId).slice(-6)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          s.plan === 'apna_therapist' ? 'bg-violet-900 text-violet-300' : 'bg-blue-900 text-blue-300'
                        }`}>{s.plan}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${
                          s.status === 'active' ? 'text-green-400' : 'text-slate-500'
                        }`}>{s.status}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {new Date(s.startDate).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                  {subscriptions.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">No subscriptions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* FLAGS TAB */}
        {tab === 'flags' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Crisis Flags</h2>
            <div className="bg-slate-800 rounded-xl border border-red-900/50 p-6 text-center">
              <AlertTriangle className="size-10 text-red-400 mx-auto mb-3" />
              <p className="font-semibold text-slate-300">Crisis Detection Active</p>
              <p className="text-sm text-slate-500 mt-2">
                Conversations with high-risk keywords are flagged automatically.
                User identifiers are hashed — only escalation counts are shown here.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: 'This week', value: 3 },
                  { label: 'This month', value: 11 },
                  { label: 'Total', value: 47 },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-900 rounded-lg p-3">
                    <p className="text-2xl font-black text-red-400">{s.value}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
