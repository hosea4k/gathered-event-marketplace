import { randomUUID } from "node:crypto";
import { query } from "./db";
import type { Inquiry } from "./types";

interface InquiryRow {
  id: string;
  space_id: string | null;
  name: string;
  email: string;
  message: string;
  status: string;
  created_at: string;
}

function rowToInquiry(row: InquiryRow): Inquiry {
  return {
    id: row.id,
    spaceId: row.space_id,
    name: row.name,
    email: row.email,
    message: row.message,
    status: row.status as Inquiry["status"],
    createdAt: row.created_at,
  };
}

export async function createInquiry(input: {
  spaceId?: string | null;
  name: string;
  email: string;
  message: string;
}): Promise<Inquiry> {
  const id = randomUUID();
  await query(
    `INSERT INTO inquiries (id, space_id, name, email, message) VALUES ($1, $2, $3, $4, $5)`,
    [id, input.spaceId ?? null, input.name, input.email, input.message]
  );
  const rows = await query<InquiryRow>(`SELECT * FROM inquiries WHERE id = $1`, [id]);
  return rowToInquiry(rows[0]);
}

export async function listInquiriesForAdmin(): Promise<Inquiry[]> {
  const rows = await query<InquiryRow>(`SELECT * FROM inquiries ORDER BY created_at DESC`);
  return rows.map(rowToInquiry);
}
