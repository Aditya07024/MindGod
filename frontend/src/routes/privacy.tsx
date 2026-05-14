import { createFileRoute, Link } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Lock, EyeOff, Server } from 'lucide-react';
import logoUrl from '@/assets/logo.png';

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
});

function PrivacyPage() {
  const sections = [
    {
      title: "Data We Collect",
      icon: EyeOff,
      content: "We collect minimal information necessary to provide our services, including your basic profile info and encrypted conversation metadata. We do not store raw chat logs in a way that identifies you personally unless explicitly shared for therapy purposes."
    },
    {
      title: "How We Use Data",
      icon: Shield,
      content: "Data is used to personalize Manas AI's responses, track your wellness progress, and facilitate therapist sessions. We never sell your data to third parties for advertising or marketing."
    },
    {
      title: "Security Measures",
      icon: Lock,
      iconColor: "text-blue-500",
      content: "All data is encrypted in transit and at rest. Therapist sessions are conducted over secure, end-to-end encrypted WebRTC channels to ensure total privacy."
    },
    {
      title: "Data Retention",
      icon: Server,
      content: "You have the right to request deletion of your data at any time. We retain data only as long as necessary to fulfill the purposes outlined in this policy."
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-500 shadow-lg overflow-hidden">
              <img src={logoUrl} alt="Logo" className="size-full object-cover" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight">MindGod</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-teal-600 transition">
            <ArrowLeft className="size-4" /> Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
          <h1 className="text-4xl font-display font-bold mb-6">Privacy Policy</h1>
          <p className="text-slate-600">Last updated: May 14, 2026</p>
          <div className="h-1 w-20 bg-teal-500 mt-6 rounded-full" />
        </motion.div>

        <div className="space-y-12">
          {sections.map((s, i) => (
            <motion.section 
              key={s.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`size-12 rounded-2xl bg-slate-50 flex items-center justify-center ${s.iconColor || 'text-teal-600'}`}>
                  <s.icon className="size-6" />
                </div>
                <h2 className="text-2xl font-bold">{s.title}</h2>
              </div>
              <p className="text-slate-600 leading-relaxed pl-16">
                {s.content}
              </p>
            </motion.section>
          ))}
        </div>

        <section className="mt-20 p-8 bg-teal-900 rounded-3xl text-white">
          <h3 className="text-xl font-bold mb-4">Questions about your privacy?</h3>
          <p className="text-teal-100 mb-6">Our dedicated privacy team is here to help you understand how we protect your data.</p>
          <a href="mailto:privacy@mindgod.com" className="inline-block font-bold border-b-2 border-teal-400 hover:text-teal-400 transition">
            Contact Privacy Team →
          </a>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-12 text-center text-sm text-slate-500">
        © 2026 MindGod. All rights reserved.
      </footer>
    </div>
  );
}
