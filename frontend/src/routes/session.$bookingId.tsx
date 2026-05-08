import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  TrackToggle,
  useTracks,
  useDataChannel,
  useRoomContext,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import API from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Clock, MessageCircle, X, Send, LogOut,
  AlertCircle, Brain, Star, FileText, Save,
} from "lucide-react";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/session/$bookingId")({
  component: VideoSession,
});

/* ─── Chat message type ─── */
interface ChatMsg { from: string; text: string; ts: number }

/* ─── Countdown formatter ─── */
function fmtTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/* ─── Rating stars ─── */
function StarRating({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex justify-center gap-3">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} onClick={() => onChange(s)} className="transition-transform hover:scale-110">
          <Star className={`size-8 ${s <= value ? "fill-black text-black" : "text-black"}`} />
        </button>
      ))}
    </div>
  );
}

/* ─── Custom Video Grid Layout ─── */
function CustomVideoGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <>
      <RoomAudioRenderer />
      <GridLayout tracks={tracks} style={{ height: "100%", width: "100%" }}>
        <ParticipantTile />
      </GridLayout>
    </>
  );
}

/* ─── Inner room UI (needs room context) ─── */
function RoomUI({
  bookingId, booking, userRole, aiBrief, showBrief, setShowBrief,
}: {
  bookingId: string;
  booking: any;
  userRole: string;
  aiBrief: any;
  showBrief: boolean;
  setShowBrief: (v: boolean) => void;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  /* Auto-hide controls */
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetHide = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    resetHide();
    window.addEventListener("mousemove", resetHide);
    window.addEventListener("touchstart", resetHide);
    return () => {
      window.removeEventListener("mousemove", resetHide);
      window.removeEventListener("touchstart", resetHide);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [resetHide]);

  /* Session countdown */
  const [secsLeft, setSecsLeft] = useState<number | null>(null);
  const fiveMinToasted = useRef(false);

  useEffect(() => {
    if (!booking?.slot) return;
    const end = new Date(booking.slot).getTime() + 60 * 60 * 1000; // 1-hour session
    const tick = () => {
      const remaining = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setSecsLeft(remaining);
      if (remaining <= 300 && !fiveMinToasted.current) {
        fiveMinToasted.current = true;
        toast.warning("5 minutes remaining in your session", { duration: 8000 });
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [booking?.slot]);

  /* LiveKit data channel chat */
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const { send } = useDataChannel("chat", (msg) => {
    try {
      const decoded = new TextDecoder().decode(msg.payload);
      const parsed = JSON.parse(decoded) as ChatMsg;
      setMessages((prev) => [...prev, parsed]);
    } catch {}
  });

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMsg = { from: "Me", text: chatInput.trim(), ts: Date.now() };
    setMessages((prev) => [...prev, msg]);
    send(new TextEncoder().encode(JSON.stringify(msg)), { reliable: true });
    setChatInput("");
  };

  /* Therapist notes */
  const notesKey = `therapist-notes-${bookingId}`;
  const [notes, setNotes] = useState(() => sessionStorage.getItem(notesKey) ?? "");
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);

  const saveNotesMutation = useMutation({
    mutationFn: () =>
      fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8080"}/api/bookings/${bookingId}/notes`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      }).then((r) => r.json()),
    onSuccess: () => toast.success("Notes saved"),
    onError: () => toast.error("Failed to save notes"),
  });

  const autoSaveNotes = useCallback(() => {
    sessionStorage.setItem(notesKey, notes);
  }, [notes, notesKey]);

  useEffect(() => {
    const id = setInterval(autoSaveNotes, 10000);
    return () => clearInterval(id);
  }, [autoSaveNotes]);

  /* Post-session rating */
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");

  const rateMutation = useMutation({
    mutationFn: () => API.booking.rate(bookingId, { rating, feedback }),
    onSuccess: () => {
      toast.success("Thanks for your feedback!");
      navigate({ to: "/dashboard" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleLeave = () => {
    if (userRole === "therapist" && notes.trim()) {
      saveNotesMutation.mutate();
    }
    if (userRole === "user") {
      setShowRating(true);
    } else {
      navigate({ to: "/therapist/dashboard" });
    }
  };

  const isAtLimit = secsLeft === 0;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950">
      {/* LiveKit video tiles */}
      <CustomVideoGrid />

      {/* Countdown timer — always visible */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-mono font-bold backdrop-blur-md shadow-lg ${
          secsLeft !== null && secsLeft <= 300
            ? "bg-red-900/80 text-red-200"
            : "bg-slate-900/60 text-white"
        }`}>
          <Clock className="size-4" />
          {secsLeft !== null ? fmtTime(secsLeft) : "--:--"}
        </div>
      </div>

      {/* AI Brief button for therapist */}
      {userRole === "therapist" && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: controlsVisible ? 1 : 0 }}
          onClick={() => setShowBrief(true)}
          className="absolute top-4 right-4 z-20 flex items-center gap-2 rounded-full bg-teal-600/80 backdrop-blur-md px-4 py-2 text-sm font-semibold text-white shadow-lg hover:bg-teal-600 transition"
        >
          <Brain className="size-4" /> AI Brief
        </motion.button>
      )}

      {/* Bottom control bar — auto-hides */}
      <AnimatePresence>
        {controlsVisible && !isAtLimit && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-slate-900/80 backdrop-blur-md p-2 rounded-full shadow-2xl border border-white/10"
          >
            <div className="flex items-center gap-2 border-r border-white/10 pr-3">
              <TrackToggle source={Track.Source.Microphone} className="!bg-slate-800 !hover:bg-slate-700 !text-white !rounded-full !size-10 !flex !items-center !justify-center" />
              <TrackToggle source={Track.Source.Camera} className="!bg-slate-800 !hover:bg-slate-700 !text-white !rounded-full !size-10 !flex !items-center !justify-center" />
            </div>

            <button
              onClick={() => setChatOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full bg-slate-800/80 backdrop-blur-md px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700/80 transition"
            >
              <MessageCircle className="size-4" />
              Chat
              {messages.length > 0 && (
                <span className="bg-accent rounded-full text-xs px-1.5 py-0.5">{messages.length}</span>
              )}
            </button>

            {userRole === "therapist" && (
              <button
                onClick={() => setNotesPanelOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full bg-slate-800/80 backdrop-blur-md px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700/80 transition"
              >
                <FileText className="size-4" /> Notes
              </button>
            )}

            <button
              onClick={handleLeave}
              className="flex items-center gap-2 rounded-full bg-red-600/90 backdrop-blur-md px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition"
            >
              <LogOut className="size-4" /> Leave
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="absolute right-0 top-0 bottom-0 z-30 w-80 flex flex-col bg-slate-900/95 backdrop-blur-md shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <span className="font-semibold text-white text-sm">Chat</span>
              <button onClick={() => setChatOpen(false)} className="text-slate-400 hover:text-white">
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <p className="text-xs text-slate-500 text-center mt-8">No messages yet</p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === "Me" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                    m.from === "Me" ? "bg-teal-600 text-white" : "bg-slate-700 text-slate-100"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>
            <div className="px-3 py-3 border-t border-slate-700 flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendChat()}
                placeholder="Type a message…"
                className="flex-1 bg-slate-800 text-slate-100 placeholder-slate-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <button onClick={sendChat} className="p-2 bg-teal-600 hover:bg-teal-500 rounded-xl text-white transition">
                <Send className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Therapist notes panel */}
      <AnimatePresence>
        {notesPanelOpen && userRole === "therapist" && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            className="absolute left-0 top-0 bottom-0 z-30 w-80 flex flex-col bg-slate-900/95 backdrop-blur-md shadow-2xl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <span className="font-semibold text-white text-sm">Session Notes</span>
              <div className="flex items-center gap-2">
                <button onClick={() => saveNotesMutation.mutate()}
                  className="flex items-center gap-1 text-xs text-teal-400 hover:text-teal-300">
                  <Save className="size-3" /> Save
                </button>
                <button onClick={() => setNotesPanelOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Clinical notes for this session…&#10;&#10;Auto-saved every 10s and submitted when you leave."
              className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 p-4 text-sm resize-none focus:outline-none"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Brief modal (therapist) */}
      <AnimatePresence>
        {showBrief && aiBrief && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
            onClick={() => setShowBrief(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="size-4 text-teal-400" />
                  <span className="font-bold text-white text-sm">Pre-Session AI Brief</span>
                </div>
                <button onClick={() => setShowBrief(false)} className="text-slate-400 hover:text-white">
                  <X className="size-4" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">Risk:</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                    aiBrief.riskLevel === "high" ? "bg-red-900 text-red-300"
                    : aiBrief.riskLevel === "medium" ? "bg-amber-900 text-amber-300"
                    : "bg-green-900 text-green-300"
                  }`}>{aiBrief.riskLevel}</span>
                  {aiBrief.avgMood && <span className="text-xs text-slate-400">Avg mood: {aiBrief.avgMood}/10</span>}
                </div>
                {aiBrief.groqSummary && (
                  <div className="bg-teal-900/40 border border-teal-700/50 rounded-xl p-4">
                    <p className="text-xs font-bold text-teal-400 mb-2">AI SUMMARY</p>
                    <p className="text-sm text-slate-200 whitespace-pre-line">{aiBrief.groqSummary}</p>
                  </div>
                )}
                {aiBrief.moodChart?.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-400 mb-2">7-DAY MOOD</p>
                    <div className="flex items-end gap-1 h-12">
                      {aiBrief.moodChart.map((m: any, i: number) => (
                        <div key={i} className="flex-1">
                          <div className="w-full rounded-sm bg-teal-500"
                            style={{ height: `${(m.score / 10) * 44}px`, minHeight: 3 }} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post-session rating */}
      <AnimatePresence>
        {showRating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ y: 60 }}
              animate={{ y: 0 }}
              exit={{ y: 60 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-5 mb-4 md:mb-0"
            >
              <h3 className="font-display text-xl font-bold text-center text-slate-900">How was your session?</h3>
              <StarRating value={rating} onChange={setRating} />
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Share your experience (optional)"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm resize-none text-black"
                rows={3}
              />
              <Button
                onClick={() => rateMutation.mutate()}
                disabled={rating === 0 || rateMutation.isPending}
                className="w-full rounded-xl text-black"
              >
                {rateMutation.isPending ? "Submitting…" : "Submit & Leave"}
              </Button>
              <button
                onClick={() => navigate({ to: "/dashboard" })}
                className="w-full text-sm text-black hover:text-slate-900 font-medium"
              >
                Skip
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session ended overlay */}
      {isAtLimit && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white gap-4">
          <Clock className="size-12 text-slate-400" />
          <p className="font-display text-2xl font-bold">Session time is up</p>
          <Button onClick={handleLeave} className="rounded-xl mt-2">
            Leave & Rate
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Outer component — fetches token then mounts LiveKitRoom ─── */
function VideoSession() {
  const { bookingId } = useParams({ from: "/session/$bookingId" });
  const navigate = useNavigate();
  const { user } = useStore();
  const userRole = (user as any)?.role ?? "user";

  const [showBrief, setShowBrief] = useState(false);

  const { data: booking, isLoading: bookingLoading, error: bookingError } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => API.booking.get(bookingId),
  });

  const { data: tokenData, isLoading: tokenLoading, error: tokenError } = useQuery({
    queryKey: ["booking", bookingId, "video-token"],
    queryFn: () => API.booking.getVideoToken(bookingId),
    enabled: !!booking,
    retry: 2,
  });

  const { data: aiBrief } = useQuery({
    queryKey: ["ai-brief", bookingId],
    queryFn: () => API.booking.getAiBrief(bookingId),
    enabled: userRole === "therapist" && !!booking,
  });

  const isLoading = bookingLoading || tokenLoading;
  const error = bookingError || tokenError;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-center space-y-4">
          <div className="size-16 rounded-full bg-teal-600/20 animate-pulse mx-auto flex items-center justify-center">
            <Clock className="size-8 text-teal-400" />
          </div>
          <p className="text-white font-display text-lg">Setting up your session…</p>
        </div>
      </div>
    );
  }

  if (error || !tokenData?.token) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 px-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle className="size-12 text-red-400 mx-auto" />
          <p className="text-white font-display text-lg">Cannot join session</p>
          <p className="text-slate-400 text-sm">
            {(error as Error)?.message ?? "Session not available yet — join within 15 minutes of your slot."}
          </p>
          <Button onClick={() => navigate({ to: "/bookings" })} variant="outline" className="rounded-xl text-white border-slate-600">
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }



  return (
    <LiveKitRoom
      token={tokenData.token}
      serverUrl={tokenData.url}
      connect={true}
      video={true}
      audio={true}
      style={{ height: "100vh" }}
      data-lk-theme="default"
    >
      <RoomUI
        bookingId={bookingId}
        booking={booking}
        userRole={userRole}
        aiBrief={aiBrief}
        showBrief={showBrief}
        setShowBrief={setShowBrief}
      />
    </LiveKitRoom>
  );
}
