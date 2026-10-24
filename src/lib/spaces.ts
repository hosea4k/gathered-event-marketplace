import { randomUUID } from "node:crypto";
import { query } from "./db";
import type { Space, SpaceFilters } from "./types";

interface SpaceRow {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  address: string;
  city: string;
  capacity: number;
  price_per_hour: number;
  min_hours: number;
  cleaning_fee: number;
  amenities: string;
  photos: string;
  open_time: string;
  close_time: string;
  is_active: boolean;
  created_at: string;
}

function rowToSpace(row: SpaceRow): Space {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    tagline: row.tagline,
    description: row.description,
    address: row.address,
    city: row.city,
    capacity: row.capacity,
    pricePerHour: Number(row.price_per_hour),
    minHours: row.min_hours,
    cleaningFee: Number(row.cleaning_fee),
    amenities: JSON.parse(row.amenities),
    photos: JSON.parse(row.photos),
    openTime: row.open_time,
    closeTime: row.close_time,
    isActive: !!row.is_active,
    createdAt: row.created_at,
  };
}

export async function listSpaces(filters: SpaceFilters = {}): Promise<Space[]> {
  const rows = await query<SpaceRow>(
    `SELECT * FROM spaces WHERE is_active = TRUE ORDER BY created_at DESC`
  );
  let spaces = rows.map(rowToSpace);

  if (filters.city) {
    const q = filters.city.toLowerCase();
    spaces = spaces.filter((s) => s.city.toLowerCase().includes(q));
  }
  if (filters.minCapacity) {
    spaces = spaces.filter((s) => s.capacity >= filters.minCapacity!);
  }
  if (filters.maxPrice) {
    spaces = spaces.filter((s) => s.pricePerHour <= filters.maxPrice!);
  }
  if (filters.query) {
    const q = filters.query.toLowerCase();
    spaces = spaces.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.tagline.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.amenities.some((a) => a.toLowerCase().includes(q))
    );
  }
  return spaces;
}

export async function getSpaceById(id: string): Promise<Space | null> {
  const rows = await query<SpaceRow>(`SELECT * FROM spaces WHERE id = $1`, [id]);
  return rows[0] ? rowToSpace(rows[0]) : null;
}

export async function getSpaceBySlug(slug: string): Promise<Space | null> {
  const rows = await query<SpaceRow>(`SELECT * FROM spaces WHERE slug = $1`, [slug]);
  return rows[0] ? rowToSpace(rows[0]) : null;
}

export async function findSpaceByName(name: string): Promise<Space | null> {
  const rows = await query<SpaceRow>(
    `SELECT * FROM spaces WHERE is_active = TRUE AND lower(name) LIKE $1 LIMIT 1`,
    [`%${name.toLowerCase()}%`]
  );
  return rows[0] ? rowToSpace(rows[0]) : null;
}

export interface UpsertSpaceInput {
  id?: string;
  name: string;
  tagline: string;
  description: string;
  address: string;
  city: string;
  capacity: number;
  pricePerHour: number;
  minHours: number;
  cleaningFee: number;
  amenities: string[];
  photos: string[];
  openTime: string;
  closeTime: string;
  isActive?: boolean;
}

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") +
    "-" +
    Math.random().toString(36).slice(2, 6)
  );
}

export async function createSpace(input: UpsertSpaceInput): Promise<Space> {
  const id = randomUUID();
  const slug = slugify(input.name);
  await query(
    `INSERT INTO spaces
      (id, name, slug, tagline, description, address, city, capacity, price_per_hour,
       min_hours, cleaning_fee, amenities, photos, open_time, close_time, is_active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
    [
      id,
      input.name,
      slug,
      input.tagline,
      input.description,
      input.address,
      input.city,
      input.capacity,
      input.pricePerHour,
      input.minHours,
      input.cleaningFee,
      JSON.stringify(input.amenities),
      JSON.stringify(input.photos),
      input.openTime,
      input.closeTime,
      input.isActive !== false,
    ]
  );
  return (await getSpaceById(id))!;
}

export async function updateSpace(id: string, input: UpsertSpaceInput): Promise<Space | null> {
  const existing = await getSpaceById(id);
  if (!existing) return null;
  await query(
    `UPDATE spaces SET name=$1, tagline=$2, description=$3, address=$4, city=$5, capacity=$6,
      price_per_hour=$7, min_hours=$8, cleaning_fee=$9, amenities=$10, photos=$11, open_time=$12,
      close_time=$13, is_active=$14 WHERE id=$15`,
    [
      input.name,
      input.tagline,
      input.description,
      input.address,
      input.city,
      input.capacity,
      input.pricePerHour,
      input.minHours,
      input.cleaningFee,
      JSON.stringify(input.amenities),
      JSON.stringify(input.photos),
      input.openTime,
      input.closeTime,
      input.isActive !== false,
      id,
    ]
  );
  return getSpaceById(id);
}

export async function deleteSpace(id: string): Promise<void> {
  // Soft delete so historical bookings keep a valid foreign key.
  await query(`UPDATE spaces SET is_active = FALSE WHERE id = $1`, [id]);
}

export async function listAllSpacesForAdmin(): Promise<Space[]> {
  const rows = await query<SpaceRow>(`SELECT * FROM spaces ORDER BY created_at DESC`);
  return rows.map(rowToSpace);
}
