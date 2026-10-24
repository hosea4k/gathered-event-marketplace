import { NextResponse } from "next/server";
import { z } from "zod";
import { createBooking, BookingConflictError, NotFoundError } from "@/lib/bookings";

export const dynamic = "force-dynamic";

const schema = z.object({
  spaceId: z.string().min(1),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  guestCount: z.number().int().positive(),
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email(),
  customerPhone: z.string().max(40).optional(),
  eventType: z.string().max(200).optional(),
  notes: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid booking request.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const booking = await createBooking({ ...parsed.data, source: "web" });
    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    if (err instanceof BookingConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof NotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error("Booking creation failed:", err);
    return NextResponse.json({ error: "Something went wrong creating the booking." }, { status: 500 });
  }
}
