import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Mail, FileText, CheckCircle, ArrowRight } from 'lucide-react';
import API from '@/lib/api';

export const Route = createFileRoute('/org/onboarding')({
  component: OrgOnboarding,
});

function OrgOnboarding() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'company',
    officialEmail: '',
    contactPerson: '',
    phone: '',
    address: '',
    website: '',
    registrationUrl: '',
    accreditationUrl: '',
    governmentIdUrl: '',
  });

  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [debugOtp, setDebugOtp] = useState(''); // For development mode

  useEffect(() => {
    // If the user already has an org and it's verified or pending, redirect
    API.org.me()
      .then((res: any) => {
        const status = res?.organization?.verificationStatus;
        if (status === 'verified') {
          nav({ to: '/org/dashboard', replace: true });
        } else if (status === 'pending') {
          setStep(4);
        }
      })
      .catch(() => {}); // No org found, stay on onboarding
  }, [nav]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const sendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await API.org.sendOtp({ email: formData.officialEmail });
      setOtpSent(true);
      // If in development mode, display the OTP
      if (response?.debug && response?.otp) {
        setDebugOtp(response.otp);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError('');
    try {
      await API.org.verifyOtp({ email: formData.officialEmail, otp });
      setEmailVerified(true);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const submitOnboarding = async () => {
    setLoading(true);
    setError('');
    try {
      await API.org.onboarding(formData);
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="px-6 py-5 bg-white border-b border-slate-200">
        <h1 className="font-display text-2xl font-bold text-slate-900">Organization Onboarding</h1>
        <p className="text-sm text-slate-500 mt-1">Register your organization or college</p>
      </header>

      <main className="mx-auto max-w-lg px-4 mt-8">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 relative px-2">
          <div className="absolute left-6 right-6 top-1/2 h-0.5 bg-slate-200 -z-10 -translate-y-1/2" />
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`size-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= s ? 'bg-blue-600 text-white shadow-md' : 'bg-white border-2 border-slate-200 text-slate-400'
              }`}
            >
              {s === 1 && <Building2 className="size-4.5" />}
              {s === 2 && <Mail className="size-4.5" />}
              {s === 3 && <FileText className="size-4.5" />}
              {s === 4 && <CheckCircle className="size-4.5" />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                <h2 className="font-display text-xl font-bold text-slate-900">Organization Details</h2>
                
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Organization / College Name</label>
                  <input
                    name="name" value={formData.name} onChange={handleChange}
                    className="w-full mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="MindGod University"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Type</label>
                    <select
                      name="type" value={formData.type} onChange={handleChange}
                      className="w-full mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                      <option value="company">Company</option>
                      <option value="college">College / University</option>
                      <option value="ngo">NGO / Trust</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Contact Person</label>
                    <input
                      name="contactPerson" value={formData.contactPerson} onChange={handleChange}
                      className="w-full mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Jane Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Phone Number</label>
                    <input
                      name="phone" value={formData.phone} onChange={handleChange}
                      className="w-full mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Website</label>
                    <input
                      name="website" value={formData.website} onChange={handleChange}
                      className="w-full mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="https://xyz.edu"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Address & Location</label>
                  <textarea
                    name="address" value={formData.address} onChange={handleChange} rows={2}
                    className="w-full mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Full headquarters or campus address"
                  />
                </div>

                <button
                  disabled={!formData.name || !formData.contactPerson || !formData.phone}
                  onClick={() => setStep(2)}
                  className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50 mt-6"
                >
                  Next Step <ArrowRight className="inline size-4 ml-1" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                <h2 className="font-display text-xl font-bold text-slate-900">Domain Email Verification</h2>
                <p className="text-sm text-slate-500 mb-4">Please provide an official domain email (e.g., admin@college.edu). Public emails like Gmail are not accepted.</p>
                
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Official Email Address</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      name="officialEmail" value={formData.officialEmail} onChange={handleChange} disabled={emailVerified || otpSent}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                      placeholder="admin@yourdomain.edu"
                    />
                    {!emailVerified && (
                      <button onClick={sendOtp} disabled={loading || !formData.officialEmail || otpSent}
                        className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                        {otpSent ? 'Sent' : 'Send OTP'}
                      </button>
                    )}
                  </div>
                </div>

                {otpSent && !emailVerified && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-2 space-y-3">
                    {debugOtp && (
                      <div className="bg-amber-50 border border-amber-300 text-amber-900 p-4 rounded-xl">
                        <p className="text-xs font-semibold text-amber-700 uppercase mb-2">Email delivery blocked — fallback OTP</p>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm text-amber-800 mb-1">Use this OTP to continue in development mode.</p>
                            <code className="text-2xl font-bold tracking-widest">{debugOtp}</code>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(debugOtp);
                              setOtp(debugOtp);
                            }}
                            className="rounded-lg bg-amber-200 hover:bg-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-900"
                          >
                            Copy & Fill
                          </button>
                        </div>
                        <p className="text-xs text-amber-700 mt-2">This OTP expires in 10 minutes.</p>
                      </div>
                    )}
                    <label className="text-xs font-semibold text-slate-500 uppercase">Enter OTP</label>
                    <div className="flex gap-2 mt-1">
                      <input
                        value={otp} onChange={(e) => setOtp(e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="123456"
                      />
                      <button onClick={verifyOtp} disabled={loading || !otp}
                        className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                        Verify
                      </button>
                    </div>
                  </motion.div>
                )}

                {emailVerified && (
                  <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl flex items-center gap-2 text-sm font-bold">
                    <CheckCircle className="size-5" /> Email Verified Successfully
                  </div>
                )}

                {error && <div className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-xl border border-red-100">{error}</div>}

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(1)} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
                    Back
                  </button>
                  <button
                    disabled={!emailVerified}
                    onClick={() => { setError(''); setStep(3); }}
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    Next Step
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                <h2 className="font-display text-xl font-bold text-slate-900">Document Verification</h2>
                <p className="text-sm text-slate-500">Provide secure links (e.g. Google Drive) to your organization's official documents.</p>
                
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Registration Certificate</label>
                  <input
                    name="registrationUrl" value={formData.registrationUrl} onChange={handleChange}
                    className="w-full mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="https://drive.google.com/..."
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Trust / Society / Company registration</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Accreditation Proof (If College)</label>
                  <input
                    name="accreditationUrl" value={formData.accreditationUrl} onChange={handleChange}
                    className="w-full mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="https://drive.google.com/..."
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Official ID of Representative</label>
                  <input
                    name="governmentIdUrl" value={formData.governmentIdUrl} onChange={handleChange}
                    className="w-full mt-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="https://drive.google.com/..."
                  />
                </div>

                {error && <div className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-xl border border-red-100">{error}</div>}

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(2)} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
                    Back
                  </button>
                  <button
                    disabled={loading || !formData.registrationUrl || !formData.governmentIdUrl}
                    onClick={submitOnboarding}
                    className="flex-1 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Submitting...' : 'Submit Profile'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl bg-white p-8 shadow-sm border border-slate-200 text-center">
                <div className="grid size-16 place-items-center rounded-full bg-blue-50 text-blue-600">
                  <CheckCircle className="size-8" />
                </div>
                <h2 className="font-display text-2xl font-bold text-slate-900">Application Under Review</h2>
                <p className="text-slate-500 text-sm">
                  Thank you for submitting your organization details. Our admin team will verify your documents and email domain.
                </p>
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mt-4 text-left w-full">
                  <p className="text-sm text-blue-900 font-medium">You will be notified once your organization is marked as <strong>"Verified"</strong>. Until then, your dashboard access is locked.</p>
                </div>
                <button onClick={() => nav({ to: '/org/dashboard' })} className="mt-4 text-sm font-semibold text-blue-600 hover:underline">
                  Return to Dashboard
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
