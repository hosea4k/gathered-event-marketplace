import { NextResponse } from "next/server";
import { z } from "zod";
import { createSpace, listAllSpacesForAdmin } from "@/lib/spaces";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).max(200),
  tagline: z.string().min(1).max(300),
  description: z.string().min(1).max(5000),
  address: z.string().min(1).max(300),
  city: z.string().min(1).max(100),
  capacity: z.number().int().positive(),
  pricePerHour: z.number().nonnegative(),
  minHours: z.number().int().positive(),
  cleaningFee: z.number().nonnegative(),
  amenities: z.array(z.string()).default([]),
  photos: z.array(z.string().url()).default([]),
  openTime: z.string().regex(/^\d{2}:\d{2}$/),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/),
  isActive: z.boolean().optional(),
});

export async function GET() {
  return NextResponse.json({ spaces: await listAllSpacesForAdmin() });
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid space data.", details: parsed.error.flatten() }, { status: 400 });
  }
  const space = await createSpace(parsed.data);
  return NextResponse.json({ space }, { status: 201 });
}
