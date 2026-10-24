import { NextResponse } from "next/server";
import { listAllBookingsForAdmin } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ bookings: await listAllBookingsForAdmin() });
}
