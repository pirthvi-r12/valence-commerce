import "server-only";
import { createHash, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const ADMIN_EMAIL = "admin@valence.studio";
export const ADMIN_PASSWORD = "valence-admin";

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashesMatch(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function assertAdmin() {
  const role = cookies().get("valence_role")?.value;
  if (role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}
