"use client";

import { useEffect, useMemo, useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  isSameMonth,
  isBefore,
  startOfDay,
} from "date-fns";
import { calcTotalPrice, isSlotAvailable } from "@/lib/availability";

interface SpaceForBooking {
  id: string;
  name: string;
  pricePerHour: number;
  cleaningFee: number;
  minHours: number;
  capacity: number;
  openTime: string;
  closeTime: string;
}

type BookedMap = Record<string, { startTime: string; endTime: string }[]>;

export default function BookingPanel({ space }: { space: SpaceForBooking }) {
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
  const [bookedByDate, setBookedByDate] = useState<BookedMap>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [startTime, setStartTime] = useState(space.openTime);
  const [endTime, setEndTime] = useState(addHoursToTime(space.openTime, space.minHours));
  const [guestCount, setGuestCount] = useState(Math.min(10, space.capacity));
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [eventType, setEventType] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<null | {
    id: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    totalPrice: number;
  }>(null);

  useEffect(() => {
    const monthKey = format(monthCursor, "yyyy-MM");
    fetch(`/api/availability?spaceId=${space.id}&month=${monthKey}`)
      .then((r) => r.json())
      .then((data) => setBookedByDate(data.bookingsByDate ?? {}))
      .catch(() => setBookedByDate({}));
  }, [monthCursor, space.id]);

  const slotCheck = useMemo(() => {
    if (!selectedDate) return null;
    const existingForDay = bookedByDate[selectedDate] ?? [];
    return isSlotAvailable(startTime, endTime, space.openTime, space.closeTime, existingForDay);
  }, [selectedDate, startTime, endTime, bookedByDate, space.openTime, space.closeTime]);

  const totalPrice = calcTotalPrice(startTime, endTime, space.pricePerHour, space.cleaningFee);
  const hours = hoursBetween(startTime, endTime);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor));
    const end = endOfWeek(endOfMonth(monthCursor));
    return eachDayOfInterval({ start, end });
  }, [monthCursor]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate) {
      setError("Pick a date on the calendar first.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId: space.id,
          eventDate: selectedDate,
          startTime,
          endTime,
          guestCount,
          customerName,
          customerEmail,
          customerPhone: customerPhone || undefined,
          eventType: eventType || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setConfirmation({
        id: data.booking.id.slice(0, 8).toUpperCase(),
        eventDate: data.booking.eventDate,
        startTime: data.booking.startTime,
        endTime: data.booking.endTime,
        totalPrice: data.booking.totalPrice,
      });
      setMonthCursor((c) => startOfMonth(c)); // trigger refetch via effect dep unchanged is fine
      setBookedByDate((prev) => ({
        ...prev,
        [selectedDate]: [...(prev[selectedDate] ?? []), { startTime, endTime }],
      }));
    } catch {
      setError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return (
      <div className="card p-5">
        <p className="badge mb-3">Booking confirmed</p>
        <h3 className="text-lg font-semibold">Confirmation #{confirmation.id}</h3>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {space.name} · {confirmation.eventDate} · {confirmation.startTime}–{confirmation.endTime}
        </p>
        <p className="mt-1 text-sm">
          Total: <span className="font-semibold">${confirmation.totalPrice}</span>
        </p>
        <button className="btn-secondary mt-4 w-full" onClick={() => setConfirmation(null)}>
          Book another slot
        </button>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-semibold">Check availability & book</h3>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button type="button" className="btn-ghost px-2 py-1 text-sm" onClick={() => setMonthCursor((c) => addMonths(c, -1))}>
          ← Prev
        </button>
        <span className="text-sm font-medium">{format(monthCursor, "MMMM yyyy")}</span>
        <button type="button" className="btn-ghost px-2 py-1 text-sm" onClick={() => setMonthCursor((c) => addMonths(c, 1))}>
          Next →
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs text-[var(--muted)]">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, monthCursor);
          const past = isBefore(day, startOfDay(new Date()));
          const hasBookings = (bookedByDate[key]?.length ?? 0) > 0;
          const selected = selectedDate === key;
          return (
            <button
              type="button"
              key={key}
              disabled={past}
              onClick={() => setSelectedDate(key)}
              className={`relative rounded-lg py-1.5 text-sm transition-colors ${
                !inMonth ? "text-[var(--muted)]/50" : ""
              } ${past ? "cursor-not-allowed opacity-40" : "hover:bg-black/5"} ${
                selected ? "bg-[var(--accent)] text-[var(--accent-foreground)]" : ""
              }`}
            >
              {format(day, "d")}
              {hasBookings && !selected && (
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--accent)]" />
              )}
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Start</label>
            <input type="time" className="input" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          </div>
          <div>
            <label className="label">End</label>
            <input type="time" className="input" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Guests</label>
          <input
            type="number"
            min={1}
            max={space.capacity}
            className="input"
            value={guestCount}
            onChange={(e) => setGuestCount(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="label">Your name</label>
          <input className="input" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Phone (optional)</label>
            <input className="input" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Event type (optional)</label>
          <input
            className="input"
            placeholder="Shoot, showcase, launch…"
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Notes for the host (optional)</label>
          <textarea
            className="input min-h-20"
            placeholder="Load-in time, special requests…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {selectedDate && slotCheck && !slotCheck.available && (
          <p className="text-sm text-red-700">{slotCheck.reason}</p>
        )}
        {error && <p className="text-sm text-red-700">{error}</p>}

        <div className="flex items-baseline justify-between border-t border-[var(--border)] pt-3">
          <span className="text-sm text-[var(--muted)]">
            {hours > 0 ? `${hours}h × $${space.pricePerHour} + $${space.cleaningFee} cleaning` : "Pick a valid time range"}
          </span>
          <span className="text-lg font-semibold">${totalPrice}</span>
        </div>

        <button
          type="submit"
          className="btn-primary w-full"
          disabled={submitting || !selectedDate || (slotCheck ? !slotCheck.available : false)}
        >
          {submitting ? "Booking…" : selectedDate ? "Confirm booking" : "Select a date above"}
        </button>
      </form>
    </div>
  );
}

function addHoursToTime(hhmm: string, hours: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + hours * 60;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function hoursBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
}
