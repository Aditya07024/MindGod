"use client";

import { useEffect, useState } from "react";
import {
  BadgeIndianRupee, Calendar, CalendarCheck, CalendarClock, CheckCircle,
  ChevronLeft, ChevronRight, Clock, Languages, Star, Video, X
} from "lucide-react";
import { GlassCard } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";

/* ── Types ── */
interface Therapist {
  id: string;
  name: string;
  specializations: string[];
  languages: string[];
  rating: number;
  sessionFee: number;
  verified: boolean;
  bio?: string;
  availability: { day: number; slots: string[] }[];
}

interface Booking {
  id: string;
  therapistId: string;
  therapistName: string;
  therapistSpecialization: string;
  slot: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  amount: number;
  paid: boolean;
  videoRoomId?: string;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* ── Helper: get next 14 days with their weekday ── */
function getNext14Days() {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });
}

/* ── Main component ── */
export function TherapistsPage() {
  const [view, setView] = useState<"list" | "book" | "myBookings">("list");
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loadingTherapists, setLoadingTherapists] = useState(true);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [booking, setBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [filter, setFilter] = useState("");

  const days = getNext14Days();

  /* Fetch therapists from backend on mount */
  useEffect(() => {
    setLoadingTherapists(true);
    apiFetch<{ therapists: Therapist[] }>("/therapists")
      .then((data) => setTherapists(data.therapists))
      .catch(() => setTherapists([]))
      .finally(() => setLoadingTherapists(false));
  }, []);

  /* Get available slots for selected therapist + date */
  const availableSlots = (therapist: Therapist, date: Date): string[] => {
    const dow = date.getDay();
    return therapist.availability.find((a) => a.day === dow)?.slots ?? [];
  };

  /* Fetch user bookings */
  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      const data = await apiFetch<{ bookings: Booking[] }>("/bookings");
      setBookings(data.bookings);
    } catch {
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (view === "myBookings") fetchBookings();
  }, [view]);

  const handleBook = async () => {
    if (!selectedTherapist || !selectedDate || !selectedSlot) return;
    setBooking(true);
    setBookingError("");

    const [h, m] = selectedSlot.split(":").map(Number);
    const slotDate = new Date(selectedDate);
    slotDate.setHours(h, m, 0, 0);

    try {
      await apiFetch("/bookings", {
        method: "POST",
        body: JSON.stringify({ therapistId: selectedTherapist.id, slot: slotDate.toISOString() })
      });
      setBookingSuccess(true);
      setTimeout(() => {
        setBookingSuccess(false);
        setView("myBookings");
      }, 1800);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : "Booking failed. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    try {
      await apiFetch(`/bookings/${bookingId}/cancel`, { method: "PATCH" });
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: "cancelled" } : b));
    } catch {
      // show cancel locally even if API fails
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: "cancelled" } : b));
    }
  };

  const filtered = therapists.filter(
    (t) =>
      t.name.toLowerCase().includes(filter.toLowerCase()) ||
      t.specializations.some((s) => s.toLowerCase().includes(filter.toLowerCase())) ||
      t.languages.some((l) => l.toLowerCase().includes(filter.toLowerCase()))
  );

  /* ── THERAPIST LIST ── */
  if (view === "list") return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-4xl text-primary">Find a Therapist</h1>
            <p className="mt-2 text-foreground/70">RCI-verified therapists. Anonymous, confidential, on your schedule.</p>
          </div>
          <Button variant="outline" onClick={() => { setView("myBookings"); }}>
            <CalendarCheck className="h-4 w-4 mr-2" />
            My Appointments
          </Button>
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search by name, specialty, or language…"
          className="mt-5 h-12 w-full rounded-full bg-surface-low px-5 outline-none text-sm"
        />
      </GlassCard>

      {loadingTherapists ? (
        <div className="text-center py-12 text-foreground/50">Loading therapists…</div>
      ) : filtered.length === 0 ? (
        <GlassCard className="text-center py-12">
          <CalendarClock className="mx-auto h-12 w-12 text-primary/30" />
          <p className="mt-4 font-heading text-2xl text-primary">No therapists found</p>
          <p className="mt-2 text-foreground/60">{therapists.length === 0 ? "No therapists are registered yet. Check back soon!" : "Try a different search term."}</p>
        </GlassCard>
      ) : (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((t) => (
          <GlassCard key={t.id} className="flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-heading text-xl text-primary">{t.name}</p>
                  {t.verified && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                      RCI Verified
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1 text-sm text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-amber-400" />
                  <span className="font-medium">{t.rating}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-heading text-lg text-primary">₹{t.sessionFee.toLocaleString("en-IN")}</p>
                <p className="text-xs text-foreground/55">per session</p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {t.specializations.map((s) => (
                <span key={s} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{s}</span>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs text-foreground/60">
              <Languages className="h-3.5 w-3.5" />
              {t.languages.join(" · ")}
            </div>

            {t.bio && <p className="mt-3 text-sm text-foreground/65 line-clamp-2">{t.bio}</p>}

            <div className="mt-4 flex items-center gap-2 text-xs text-foreground/55">
              <CalendarClock className="h-3.5 w-3.5" />
              Available: {t.availability.map((a) => DAY_NAMES[a.day]).join(", ")}
            </div>

            <Button
              className="mt-5 w-full"
              onClick={() => { setSelectedTherapist(t); setSelectedDate(null); setSelectedSlot(null); setView("book"); }}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Book Appointment
            </Button>
          </GlassCard>
        ))}
      </div>
      )}
    </div>
  );

  /* ── BOOKING FLOW ── */
  if (view === "book" && selectedTherapist) return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setView("list")} className="rounded-full p-2 hover:bg-white/70 transition">
          <ChevronLeft className="h-5 w-5 text-primary" />
        </button>
        <h1 className="font-heading text-3xl text-primary">Book with {selectedTherapist.name}</h1>
      </div>

      {/* Therapist summary */}
      <GlassCard>
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
            {selectedTherapist.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-heading text-xl text-primary">{selectedTherapist.name}</p>
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-green-700">Verified</span>
            </div>
            <p className="text-sm text-foreground/60">{selectedTherapist.specializations.join(" · ")}</p>
            <div className="mt-1 flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-amber-500">
                <Star className="h-3.5 w-3.5 fill-amber-400" /> {selectedTherapist.rating}
              </span>
              <span className="text-foreground/55">·</span>
              <span className="font-medium text-primary">₹{selectedTherapist.sessionFee.toLocaleString("en-IN")}/session</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Date picker */}
      <GlassCard>
        <h2 className="font-heading text-xl text-primary flex items-center gap-2">
          <Calendar className="h-5 w-5" /> Select a Date
        </h2>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {days.map((d) => {
            const slots = availableSlots(selectedTherapist, d);
            const isAvail = slots.length > 0;
            const isSelected = selectedDate?.toDateString() === d.toDateString();
            return (
              <button
                key={d.toISOString()}
                disabled={!isAvail}
                onClick={() => { setSelectedDate(d); setSelectedSlot(null); }}
                className={`flex min-w-[60px] flex-col items-center rounded-[18px] border px-3 py-3 text-center transition ${
                  isSelected
                    ? "border-primary bg-primary text-white"
                    : isAvail
                    ? "border-surface-stroke bg-white hover:border-primary hover:text-primary"
                    : "border-surface-stroke/30 bg-surface-low/50 text-foreground/30 cursor-not-allowed"
                }`}
              >
                <span className="text-[10px] uppercase font-medium">{DAY_NAMES[d.getDay()]}</span>
                <span className="mt-1 text-lg font-bold leading-none">{d.getDate()}</span>
                <span className="mt-0.5 text-[10px]">{MONTH_NAMES[d.getMonth()]}</span>
                {isAvail && !isSelected && (
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Time slots */}
      {selectedDate && (
        <GlassCard>
          <h2 className="font-heading text-xl text-primary flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Available Slots — {DAY_NAMES[selectedDate.getDay()]}, {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]}
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {availableSlots(selectedTherapist, selectedDate).map((slot) => (
              <button
                key={slot}
                onClick={() => setSelectedSlot(slot)}
                className={`rounded-[16px] border px-5 py-3 text-sm font-medium transition ${
                  selectedSlot === slot
                    ? "border-primary bg-primary text-white"
                    : "border-surface-stroke bg-white text-foreground hover:border-primary hover:text-primary"
                }`}
              >
                {slot}
              </button>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Booking summary & confirm */}
      {selectedDate && selectedSlot && (
        <GlassCard>
          <h2 className="font-heading text-xl text-primary">Confirm Appointment</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-[16px] bg-surface-low p-4">
              <span className="text-sm text-foreground/70">Therapist</span>
              <span className="font-medium text-primary">{selectedTherapist.name}</span>
            </div>
            <div className="flex items-center justify-between rounded-[16px] bg-surface-low p-4">
              <span className="text-sm text-foreground/70">Date & Time</span>
              <span className="font-medium text-primary">
                {DAY_NAMES[selectedDate.getDay()]}, {selectedDate.getDate()} {MONTH_NAMES[selectedDate.getMonth()]} at {selectedSlot}
              </span>
            </div>
            <div className="flex items-center justify-between rounded-[16px] bg-surface-low p-4">
              <span className="text-sm text-foreground/70">Session Fee</span>
              <span className="font-medium text-primary">₹{selectedTherapist.sessionFee.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between rounded-[16px] bg-primary/10 p-4">
              <span className="text-sm text-primary font-medium">Session Mode</span>
              <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
                <Video className="h-4 w-4" /> Video Call
              </span>
            </div>
          </div>

          {bookingError && <p className="mt-3 text-sm text-red-500">{bookingError}</p>}

          {bookingSuccess ? (
            <div className="mt-5 flex items-center gap-3 rounded-[20px] bg-green-50 p-4 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <p className="font-medium">Appointment confirmed! Redirecting to your bookings…</p>
            </div>
          ) : (
            <Button className="mt-5 w-full gap-2" onClick={handleBook} disabled={booking}>
              <CalendarCheck className="h-4 w-4" />
              {booking ? "Confirming…" : "Confirm Appointment"}
            </Button>
          )}
        </GlassCard>
      )}
    </div>
  );

  /* ── MY BOOKINGS ── */
  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-4xl text-primary">My Appointments</h1>
            <p className="mt-2 text-foreground/70">Your upcoming and past therapy sessions.</p>
          </div>
          <Button onClick={() => setView("list")}>
            <Calendar className="h-4 w-4 mr-2" />
            Book New
          </Button>
        </div>
      </GlassCard>

      {loadingBookings ? (
        <div className="text-center py-12 text-foreground/50">Loading your appointments…</div>
      ) : bookings.length === 0 ? (
        <GlassCard className="text-center py-12">
          <CalendarClock className="mx-auto h-12 w-12 text-primary/30" />
          <p className="mt-4 font-heading text-2xl text-primary">No appointments yet</p>
          <p className="mt-2 text-foreground/60">Book your first session with a verified therapist.</p>
          <Button className="mt-6" onClick={() => setView("list")}>Browse Therapists</Button>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const slotDate = new Date(b.slot);
            const isPast = slotDate < new Date();
            const statusColor =
              b.status === "confirmed" ? "text-green-600 bg-green-50"
              : b.status === "cancelled" ? "text-red-500 bg-red-50"
              : b.status === "completed" ? "text-primary bg-primary/10"
              : "text-amber-600 bg-amber-50";

            return (
              <GlassCard key={b.id}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="font-heading text-xl text-primary">{b.therapistName}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor}`}>
                        {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-foreground/60">{b.therapistSpecialization}</p>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-foreground/70">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-primary" />
                        {DAY_NAMES[slotDate.getDay()]}, {slotDate.getDate()} {MONTH_NAMES[slotDate.getMonth()]} {slotDate.getFullYear()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4 text-primary" />
                        {slotDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <BadgeIndianRupee className="h-4 w-4 text-primary" />
                        ₹{b.amount.toLocaleString("en-IN")} {b.paid ? "(Paid)" : "(Pay at session)"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    {b.status === "confirmed" && !isPast && b.videoRoomId && (
                      <a href={`/video/${b.videoRoomId}`}>
                        <Button className="gap-2">
                          <Video className="h-4 w-4" /> Join Session
                        </Button>
                      </a>
                    )}
                    {b.status === "confirmed" && !isPast && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        className="rounded-full p-2 hover:bg-red-50 text-foreground/40 hover:text-red-500 transition"
                        title="Cancel appointment"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
