import { useState } from "react";
import { Phone, AlertTriangle, X, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const HELPLINES = [
  {
    name: "MANAS",
    display: "14416 / 1800891446",
    href: "tel:+911800891446",
    color: "bg-orange-50 text-orange-700 border-orange-200",
  },
  {
    name: "KIRAN Rehabilitation Helpline",
    display: "18005990019",
    href: "tel:+9118005990019",
    color: "bg-red-50 text-red-700 border-red-200",
  },
  {
    name: "NIMHANS",
    display: "08046110007",
    href: "tel:+918046110007",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
];

/* ─── Controlled overlay — used by chat.tsx ─── */
export function CrisisOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden mb-4 md:mb-0"
          >
            <div className="bg-red-500 p-6 text-center text-white relative">
              <button
                onClick={onClose}
                className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/20"
              >
                <ArrowLeft className="size-4" />
                Back
              </button>
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-red-200 hover:text-white"
              >
                <X className="size-5" />
              </button>
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <AlertTriangle className="size-12 mx-auto" />
              </motion.div>
              <h2 className="mt-3 font-display text-xl font-bold">You're Not Alone</h2>
              <p className="text-red-100 text-sm mt-1">Reach out right now — it helps.</p>
            </div>
            <div className="p-4 space-y-3">
              {HELPLINES.map((h) => (
                <a
                  key={h.name}
                  href={h.href}
                  className={`flex items-center gap-3 rounded-xl border p-3.5 ${h.color} hover:opacity-90 transition`}
                >
                  <Phone className="size-5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-sm">{h.name}</p>
                    <p className="text-sm font-mono">{h.display}</p>
                  </div>
                </a>
              ))}
              <p className="text-center text-xs text-slate-400 pt-1">
                Emergency? Call <strong>112</strong>
              </p>
            </div>
            <div className="px-4 pb-4">
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition"
              >
                I'm safe, close this
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─── Floating SOS button — used by AppShell ─── */
export function CrisisButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 grid size-12 place-items-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600 transition"
        aria-label="Crisis help"
      >
        <span className="text-xs font-black">SOS</span>
      </button>
      <CrisisOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
