"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Mic,
  MicOff,
  Phone,
  Video,
  VideoOff
} from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function SessionRoomPage({ sessionId }: { sessionId: string }) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState<"idle" | "starting" | "live" | "ended">("idle");
  const [notes, setNotes] = useState("");

  // Start local camera/mic
  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch {
      setStatus("idle");
      alert("Could not access camera/microphone. Please allow permissions and try again.");
      return null;
    }
  };

  const startSession = async () => {
    setStatus("starting");

    const stream = await startLocalStream();
    if (!stream) return;

    // Create peer connection (STUN for NAT traversal)
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });
    pcRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setConnected(true);
        setStatus("live");
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "disconnected" || pc.iceConnectionState === "failed") {
        setConnected(false);
        setStatus("ended");
      }
    };

    // In a real app you'd signal via WebSocket here.
    // For demo, we show the local feed and "waiting for peer" state.
    setStatus("live");
  };

  const endSession = () => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    localStreamRef.current = null;
    pcRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setConnected(false);
    setStatus("ended");
  };

  const toggleMic = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    }
  };

  const toggleCam = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCamOn(track.enabled);
    }
  };

  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
    };
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      {/* Video area */}
      <GlassCard className="lg:col-span-8 p-0 overflow-hidden">
        <div className="relative bg-gray-950 min-h-[480px] rounded-[28px] flex flex-col">
          {/* Remote video (full size) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover rounded-[28px]"
          />

          {/* Placeholder when no remote */}
          {!connected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 gap-3">
              {status === "idle" && (
                <>
                  <Video className="h-12 w-12 opacity-30" />
                  <p className="text-sm">Camera and mic ready. Start the session when your client joins.</p>
                </>
              )}
              {status === "starting" && (
                <p className="text-sm animate-pulse">Starting your camera…</p>
              )}
              {status === "live" && (
                <p className="text-sm animate-pulse">Live — waiting for the other participant to join…</p>
              )}
              {status === "ended" && (
                <p className="text-sm text-red-400">Session ended.</p>
              )}
            </div>
          )}

          {/* Local video (picture-in-picture) */}
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="absolute bottom-4 right-4 h-28 w-40 rounded-[16px] border-2 border-white/20 object-cover bg-gray-800"
          />

          {/* Session badge */}
          <div className="absolute top-4 left-4 rounded-full bg-black/40 backdrop-blur px-4 py-2 text-sm text-white font-medium">
            Session {sessionId}
            {status === "live" && (
              <span className="ml-2 inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
            {status === "idle" || status === "ended" ? (
              <button
                onClick={startSession}
                className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-primary/90 transition"
              >
                <Video className="h-4 w-4" />
                {status === "ended" ? "Restart Session" : "Start Session"}
              </button>
            ) : (
              <>
                <button
                  onClick={toggleMic}
                  className={`rounded-full p-3 transition ${micOn ? "bg-white/20 text-white" : "bg-red-500 text-white"}`}
                  title={micOn ? "Mute mic" : "Unmute mic"}
                >
                  {micOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </button>
                <button
                  onClick={toggleCam}
                  className={`rounded-full p-3 transition ${camOn ? "bg-white/20 text-white" : "bg-red-500 text-white"}`}
                  title={camOn ? "Turn off camera" : "Turn on camera"}
                >
                  {camOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </button>
                <button
                  onClick={endSession}
                  className="rounded-full bg-red-600 p-3 text-white hover:bg-red-700 transition"
                  title="End session"
                >
                  <Phone className="h-5 w-5 rotate-[135deg]" />
                </button>
              </>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Side panel */}
      <div className="space-y-6 lg:col-span-4">
        <GlassCard>
          <h2 className="font-heading text-2xl text-primary">Private therapist notes</h2>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-4 min-h-40 w-full rounded-[20px] bg-surface-low p-4 outline-none resize-none text-sm"
            placeholder="Session notes (private, not shared with client)…"
          />
          <Button
            className="mt-3 w-full"
            onClick={() => {
              const blob = new Blob([notes], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `session-${sessionId}-notes.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Save Notes
          </Button>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-heading text-2xl text-primary">AI Brief</h2>
          </div>
          <div className="mt-4 space-y-2">
            {[
              "Risk: low today",
              "Themes: work pressure, self-worth, family expectations",
              "7-day mood avg: 4.8/10",
              "Last session: CBT reframing exercise"
            ].map((item) => (
              <div key={item} className="rounded-[14px] bg-surface-low px-4 py-3 text-sm text-foreground/75">
                {item}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
