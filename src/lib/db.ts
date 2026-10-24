import { Pool, type QueryResultRow } from "pg";

// Postgres connection pool (Render-hosted in production). Set DATABASE_URL in
// the environment — see .env.example. Render's internal Postgres URLs don't
// need SSL; most other hosted Postgres providers (and Render's *external*
// URL) do, so SSL is on unless explicitly disabled.
declare global {
  var __venuePool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and set it to your Postgres connection string."
    );
  }
  return new Pool({
    connectionString,
    ssl: process.env.PGSSL === "disable" ? false : { rejectUnauthorized: false },
  });
}

// Lazily created: reading DATABASE_URL (and connecting) only happens on the
// first real query, not at module-load time. This matters because this
// module gets imported while Next.js is statically collecting page/route
// data at build time — a build shouldn't require a live DATABASE_URL.
function getPool(): Pool {
  if (!globalThis.__venuePool) globalThis.__venuePool = createPool();
  return globalThis.__venuePool;
}

let schemaReady: Promise<void> | null = null;

/** Idempotent — safe to call on every cold start. Memoized per process. */
export function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = getPool().query(`
      CREATE TABLE IF NOT EXISTS spaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        tagline TEXT NOT NULL,
        description TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        capacity INTEGER NOT NULL,
        price_per_hour REAL NOT NULL,
        min_hours INTEGER NOT NULL DEFAULT 2,
        cleaning_fee REAL NOT NULL DEFAULT 0,
        amenities TEXT NOT NULL,
        photos TEXT NOT NULL,
        open_time TEXT NOT NULL DEFAULT '09:00',
        close_time TEXT NOT NULL DEFAULT '23:00',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id TEXT PRIMARY KEY,
        space_id TEXT NOT NULL REFERENCES spaces(id),
        event_date TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        guest_count INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        customer_phone TEXT,
        event_type TEXT,
        notes TEXT,
        total_price REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'confirmed',
        source TEXT NOT NULL DEFAULT 'web',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_bookings_space_date ON bookings(space_id, event_date);

      CREATE TABLE IF NOT EXISTS inquiries (
        id TEXT PRIMARY KEY,
        space_id TEXT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'new',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
    `).then(() => undefined);
  }
  return schemaReady;
}

/** Ensures the schema exists, then runs a parameterized query ($1, $2, ... placeholders). */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  await ensureSchema();
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

/** For scripts (e.g. seed.ts) that need to let the process exit cleanly. */
export async function closePool(): Promise<void> {
  if (globalThis.__venuePool) {
    await globalThis.__venuePool.end();
    globalThis.__venuePool = undefined;
  }
}
