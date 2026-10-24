/**
 * Time-slot overlap and operating-hours logic shared by the booking API,
 * the calendar widget, and the chatbot's check_availability tool.
 */

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

export interface ExistingBooking {
  startTime: string;
  endTime: string;
}

/** True if [aStart,aEnd) overlaps [bStart,bEnd). */
export function rangesOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export function isSlotAvailable(
  startTime: string,
  endTime: string,
  openTime: string,
  closeTime: string,
  existingBookings: ExistingBooking[]
): { available: boolean; reason?: string } {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);

  if (end <= start) {
    return { available: false, reason: "End time must be after start time." };
  }
  if (start < timeToMinutes(openTime) || end > timeToMinutes(closeTime)) {
    return {
      available: false,
      reason: `This space is only bookable between ${openTime} and ${closeTime}.`,
    };
  }
  for (const b of existingBookings) {
    if (
      rangesOverlap(start, end, timeToMinutes(b.startTime), timeToMinutes(b.endTime))
    ) {
      return {
        available: false,
        reason: `That overlaps an existing booking from ${b.startTime} to ${b.endTime}.`,
      };
    }
  }
  return { available: true };
}

/** Suggest open slots of `durationHours` for a given day, for the chatbot/UI. */
export function findOpenSlots(
  openTime: string,
  closeTime: string,
  existingBookings: ExistingBooking[],
  durationHours: number,
  stepMinutes = 60
): string[] {
  const open = timeToMinutes(openTime);
  const close = timeToMinutes(closeTime);
  const durationMins = durationHours * 60;
  const slots: string[] = [];

  for (let start = open; start + durationMins <= close; start += stepMinutes) {
    const end = start + durationMins;
    const conflict = existingBookings.some((b) =>
      rangesOverlap(start, end, timeToMinutes(b.startTime), timeToMinutes(b.endTime))
    );
    if (!conflict) slots.push(minutesToTime(start));
  }
  return slots;
}

export function calcTotalPrice(
  startTime: string,
  endTime: string,
  pricePerHour: number,
  cleaningFee: number
): number {
  const hours = (timeToMinutes(endTime) - timeToMinutes(startTime)) / 60;
  return Math.round((hours * pricePerHour + cleaningFee) * 100) / 100;
}
