import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { query } from "@/lib/db";
import { demoSpaces, slugify } from "@/lib/demoData";

export const dynamic = "force-dynamic";

/**
 * One-time seeding endpoint for deployments where the database isn't
 * reachable from outside Render (free-tier Postgres IP allowlist blocks
 * external connections). The app itself always has access via its internal
 * DATABASE_URL, so logging in as admin and POSTing here seeds the same demo
 * data `npm run seed` would, without needing any direct DB connection.
 *
 * Protected by the same admin-session check as every other /api/admin/*
 * route (see src/proxy.ts) — no separate secret needed.
 */
export async function POST(request: Request) {
  const force = new URL(request.url).searchParams.get("force") === "true";

  const existingRows = await query<{ c: string }>(`SELECT COUNT(*) as c FROM spaces`);
  const existing = Number(existingRows[0]?.c ?? 0);
  if (existing > 0 && !force) {
    return NextResponse.json({
      seeded: false,
      message: `Database already has ${existing} space(s). POST with ?force=true to clear and reseed demo data.`,
    });
  }

  if (existing > 0) {
    await query(`DELETE FROM bookings`);
    await query(`DELETE FROM inquiries`);
    await query(`DELETE FROM spaces`);
  }

  for (const s of demoSpaces) {
    await query(
      `INSERT INTO spaces
        (id, name, slug, tagline, description, address, city, capacity, price_per_hour,
         min_hours, cleaning_fee, amenities, photos, open_time, close_time, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, TRUE)`,
      [
        randomUUID(),
        s.name,
        slugify(s.name),
        s.tagline,
        s.description,
        s.address,
        s.city,
        s.capacity,
        s.pricePerHour,
        s.minHours,
        s.cleaningFee,
        JSON.stringify(s.amenities),
        JSON.stringify(s.photos),
        s.openTime,
        s.closeTime,
      ]
    );
  }

  return NextResponse.json({ seeded: true, count: demoSpaces.length });
}
