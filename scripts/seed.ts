/**
 * Seeds the Postgres database with demo event spaces.
 * Run with: npm run seed (requires DATABASE_URL in the environment).
 * Safe to re-run — it clears and re-inserts demo spaces only.
 *
 * If your database isn't reachable from outside Render (free-tier IP
 * allowlist), log in to /admin on the live site and POST to /api/admin/seed
 * instead — that route runs the same data through the app's own (internal)
 * database connection.
 */
import { randomUUID } from "node:crypto";
import { closePool, query } from "../src/lib/db";
import { demoSpaces, slugify } from "../src/lib/demoData";

async function main() {
  const existingRows = await query<{ c: string }>(`SELECT COUNT(*) as c FROM spaces`);
  const existing = Number(existingRows[0]?.c ?? 0);
  if (existing > 0) {
    console.log(`Database already has ${existing} space(s). Clearing demo data before reseeding...`);
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

  console.log(`Seeded ${demoSpaces.length} event spaces.`);
  await closePool();
}

main().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
