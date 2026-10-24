import { NextRequest, NextResponse } from "next/server";
import { getSpaceById } from "@/lib/spaces";
import { getBookingsForSpaceInRange } from "@/lib/bookings";

export const dynamic = "force-dynamic";

/** GET /api/availability?spaceId=...&month=YYYY-MM — booked time ranges per day for a calendar view. */
export async function GET(request: NextRequest) {
  const spaceId = request.nextUrl.searchParams.get("spaceId");
  const month = request.nextUrl.searchParams.get("month"); // "YYYY-MM"

  if (!spaceId || !month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "spaceId and month=YYYY-MM are required." }, { status: 400 });
  }

  const space = await getSpaceById(spaceId);
  if (!space) return NextResponse.json({ error: "Space not found." }, { status: 404 });

  const [y, m] = month.split("-").map(Number);
  const from = `${month}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${month}-${String(lastDay).padStart(2, "0")}`;

  const bookings = await getBookingsForSpaceInRange(spaceId, from, to);

  const byDate: Record<string, { startTime: string; endTime: string }[]> = {};
  for (const b of bookings) {
    (byDate[b.eventDate] ??= []).push({ startTime: b.startTime, endTime: b.endTime });
  }

  return NextResponse.json({
    spaceId,
    month,
    openTime: space.openTime,
    closeTime: space.closeTime,
    bookingsByDate: byDate,
  });
}
