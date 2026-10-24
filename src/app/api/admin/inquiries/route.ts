import { NextResponse } from "next/server";
import { listInquiriesForAdmin } from "@/lib/inquiries";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ inquiries: await listInquiriesForAdmin() });
}
