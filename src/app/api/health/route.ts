import { NextResponse } from "next/server";
import { countProductsInDatabase, isDatabaseConfigured, query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured()) return NextResponse.json({ ok: false, mode: "standby" });
  try {
    await query("SELECT 1 AS ok");
    const products = await countProductsInDatabase();
    return NextResponse.json({ ok: true, mode: "connected", products });
  } catch {
    return NextResponse.json({ ok: false, mode: "unreachable" });
  }
}
