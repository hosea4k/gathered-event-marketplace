import { NextResponse } from "next/server";
import { z } from "zod";
import { createInquiry } from "@/lib/inquiries";
import { findSpaceByName } from "@/lib/spaces";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  message: z.string().min(1).max(4000),
  spaceName: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please fill in your name, email, and message." }, { status: 400 });
  }
  const space = parsed.data.spaceName ? await findSpaceByName(parsed.data.spaceName) : null;
  const inquiry = await createInquiry({
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
    spaceId: space?.id ?? null,
  });
  return NextResponse.json({ inquiry }, { status: 201 });
}
