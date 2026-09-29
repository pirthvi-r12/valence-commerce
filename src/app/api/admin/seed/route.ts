import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/adminAuth";
import { seedDatabase } from "@/lib/db";

export async function POST() {
  const denied = assertAdmin();
  if (denied) return denied;
  try {
    const result = await seedDatabase();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seed failed";
    return NextResponse.json({ ok: false, reason: message }, { status: 500 });
  }
}
