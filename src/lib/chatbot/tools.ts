import { findSpaceByName, getSpaceById, listSpaces } from "@/lib/spaces";
import { getBookingsForSpaceOnDate, createBooking, BookingConflictError } from "@/lib/bookings";
import { createInquiry } from "@/lib/inquiries";
import { findOpenSlots, isSlotAvailable } from "@/lib/availability";
import type { Space } from "@/lib/types";

/**
 * Tool implementations shared by the rule-based chat engine and the
 * Claude-powered tool-use engine. Keeping them here means both paths behave
 * identically against the same database.
 */

export async function toolSearchSpaces(args: {
  city?: string;
  minCapacity?: number;
  maxPrice?: number;
  query?: string;
}) {
  const spaces = await listSpaces(args);
  return {
    count: spaces.length,
    spaces: spaces.map(summarizeSpace),
  };
}

export async function toolGetSpaceDetails(args: { spaceName: string }) {
  const space = await findSpaceByName(args.spaceName);
  if (!space) return { found: false as const };
  return { found: true as const, space: fullSpace(space) };
}

export async function toolCheckAvailability(args: {
  spaceName: string;
  date: string;
  startTime?: string;
  durationHours?: number;
}) {
  const space = await findSpaceByName(args.spaceName);
  if (!space)
    return { found: false as const, message: `I couldn't find a space called "${args.spaceName}".` };

  const existing = await getBookingsForSpaceOnDate(space.id, args.date);

  if (args.startTime && args.durationHours) {
    const endTime = addHours(args.startTime, args.durationHours);
    const check = isSlotAvailable(args.startTime, endTime, space.openTime, space.closeTime, existing);
    return {
      found: true as const,
      spaceName: space.name,
      date: args.date,
      requestedStart: args.startTime,
      requestedEnd: endTime,
      available: check.available,
      reason: check.reason,
    };
  }

  const openSlots = findOpenSlots(
    space.openTime,
    space.closeTime,
    existing,
    args.durationHours ?? space.minHours
  );
  return {
    found: true as const,
    spaceName: space.name,
    date: args.date,
    openTime: space.openTime,
    closeTime: space.closeTime,
    existingBookings: existing.map((b) => ({ start: b.startTime, end: b.endTime })),
    openSlotsForDuration: openSlots,
    durationHoursChecked: args.durationHours ?? space.minHours,
  };
}

export class ChatBookingError extends Error {}

export async function toolCreateBooking(args: {
  spaceName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  eventType?: string;
  notes?: string;
}) {
  const space = await findSpaceByName(args.spaceName);
  if (!space) {
    throw new ChatBookingError(`I couldn't find a space called "${args.spaceName}".`);
  }
  try {
    const booking = await createBooking({
      spaceId: space.id,
      eventDate: args.eventDate,
      startTime: args.startTime,
      endTime: args.endTime,
      guestCount: args.guestCount,
      customerName: args.customerName,
      customerEmail: args.customerEmail,
      customerPhone: args.customerPhone,
      eventType: args.eventType,
      notes: args.notes,
      source: "chatbot",
    });
    return {
      success: true as const,
      confirmationId: booking.id.slice(0, 8).toUpperCase(),
      spaceName: space.name,
      eventDate: booking.eventDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      totalPrice: booking.totalPrice,
    };
  } catch (err) {
    if (err instanceof BookingConflictError) {
      return { success: false as const, reason: err.message };
    }
    throw err;
  }
}

export async function toolCaptureInquiry(args: {
  name: string;
  email: string;
  message: string;
  spaceName?: string;
}) {
  const space = args.spaceName ? await findSpaceByName(args.spaceName) : null;
  const inquiry = await createInquiry({
    spaceId: space?.id ?? null,
    name: args.name,
    email: args.email,
    message: args.message,
  });
  return { success: true, inquiryId: inquiry.id.slice(0, 8).toUpperCase() };
}

function summarizeSpace(space: Space) {
  return {
    id: space.id,
    name: space.name,
    city: space.city,
    capacity: space.capacity,
    pricePerHour: space.pricePerHour,
    minHours: space.minHours,
    tagline: space.tagline,
  };
}

function fullSpace(space: Space) {
  return {
    ...summarizeSpace(space),
    description: space.description,
    amenities: space.amenities,
    address: space.address,
    openTime: space.openTime,
    closeTime: space.closeTime,
    cleaningFee: space.cleaningFee,
  };
}

export function addHours(hhmm: string, hours: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + hours * 60;
  const hh = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
  const mm = (total % 60).toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export async function getSpaceByIdForChat(id: string) {
  return getSpaceById(id);
}
