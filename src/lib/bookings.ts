import { randomUUID } from "node:crypto";
import { query } from "./db";
import type { Booking, CreateBookingInput } from "./types";
import { calcTotalPrice, isSlotAvailable } from "./availability";
import { getSpaceById } from "./spaces";

interface BookingRow {
  id: string;
  space_id: string;
  event_date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  event_type: string | null;
  notes: string | null;
  total_price: number;
  status: string;
  source: string;
  created_at: string;
}

function rowToBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    spaceId: row.space_id,
    eventDate: row.event_date,
    startTime: row.start_time,
    endTime: row.end_time,
    guestCount: row.guest_count,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    eventType: row.event_type,
    notes: row.notes,
    totalPrice: Number(row.total_price),
    status: row.status as Booking["status"],
    source: row.source as Booking["source"],
    createdAt: row.created_at,
  };
}

export async function getBookingsForSpaceOnDate(
  spaceId: string,
  eventDate: string
): Promise<Booking[]> {
  const rows = await query<BookingRow>(
    `SELECT * FROM bookings WHERE space_id = $1 AND event_date = $2 AND status = 'confirmed' ORDER BY start_time`,
    [spaceId, eventDate]
  );
  return rows.map(rowToBooking);
}

export async function getBookingsForSpaceInRange(
  spaceId: string,
  fromDate: string,
  toDate: string
): Promise<Booking[]> {
  const rows = await query<BookingRow>(
    `SELECT * FROM bookings WHERE space_id = $1 AND event_date BETWEEN $2 AND $3 AND status = 'confirmed' ORDER BY event_date, start_time`,
    [spaceId, fromDate, toDate]
  );
  return rows.map(rowToBooking);
}

export class BookingConflictError extends Error {}
export class NotFoundError extends Error {}

export async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const space = await getSpaceById(input.spaceId);
  if (!space) throw new NotFoundError("Space not found.");

  const existing = await getBookingsForSpaceOnDate(input.spaceId, input.eventDate);
  const check = isSlotAvailable(
    input.startTime,
    input.endTime,
    space.openTime,
    space.closeTime,
    existing
  );
  if (!check.available) {
    throw new BookingConflictError(check.reason ?? "That time is not available.");
  }

  const hours = (hhmmToMinutes(input.endTime) - hhmmToMinutes(input.startTime)) / 60;
  if (hours < space.minHours) {
    throw new BookingConflictError(
      `This space requires a minimum booking of ${space.minHours} hours.`
    );
  }
  if (input.guestCount > space.capacity) {
    throw new BookingConflictError(
      `This space's maximum capacity is ${space.capacity} guests.`
    );
  }

  const totalPrice = calcTotalPrice(
    input.startTime,
    input.endTime,
    space.pricePerHour,
    space.cleaningFee
  );

  const id = randomUUID();
  await query(
    `INSERT INTO bookings
      (id, space_id, event_date, start_time, end_time, guest_count, customer_name,
       customer_email, customer_phone, event_type, notes, total_price, status, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'confirmed', $13)`,
    [
      id,
      input.spaceId,
      input.eventDate,
      input.startTime,
      input.endTime,
      input.guestCount,
      input.customerName,
      input.customerEmail,
      input.customerPhone ?? null,
      input.eventType ?? null,
      input.notes ?? null,
      totalPrice,
      input.source ?? "web",
    ]
  );

  const rows = await query<BookingRow>(`SELECT * FROM bookings WHERE id = $1`, [id]);
  return rowToBooking(rows[0]);
}

function hhmmToMinutes(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export async function listAllBookingsForAdmin(): Promise<(Booking & { spaceName: string })[]> {
  const rows = await query<BookingRow & { space_name: string }>(
    `SELECT b.*, s.name as space_name FROM bookings b
     JOIN spaces s ON s.id = b.space_id
     ORDER BY b.event_date DESC, b.start_time DESC`
  );
  return rows.map((r) => ({ ...rowToBooking(r), spaceName: r.space_name }));
}

export async function cancelBooking(id: string): Promise<void> {
  await query(`UPDATE bookings SET status = 'cancelled' WHERE id = $1`, [id]);
}
