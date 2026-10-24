import { NextRequest, NextResponse } from "next/server";
import { listSpaces } from "@/lib/spaces";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const query = sp.get("query") ?? undefined;
  const city = sp.get("city") ?? undefined;
  const minCapacity = sp.get("minCapacity") ? Number(sp.get("minCapacity")) : undefined;
  const maxPrice = sp.get("maxPrice") ? Number(sp.get("maxPrice")) : undefined;

  const spaces = await listSpaces({ query, city, minCapacity, maxPrice });
  return NextResponse.json({ spaces });
}
