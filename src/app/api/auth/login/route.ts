import { NextResponse } from "next/server";
import { ADMIN_EMAIL, ADMIN_PASSWORD, hashesMatch, sha256 } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const ok = email === ADMIN_EMAIL && hashesMatch(sha256(password), sha256(ADMIN_PASSWORD));
  if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  const response = NextResponse.json({ ok: true, role: "admin" });
  response.cookies.set("valence_role", "admin", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
