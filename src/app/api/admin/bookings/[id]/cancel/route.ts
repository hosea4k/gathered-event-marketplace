import { NextResponse } from "next/server";
import { cancelBooking } from "@/lib/bookings";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await cancelBooking(id);
  return NextResponse.json({ ok: true });
}
