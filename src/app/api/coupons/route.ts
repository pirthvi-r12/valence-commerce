import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/coupons";

export async function POST(request: Request) {
  const body = (await request.json()) as { code?: string };
  const result = validateCoupon(String(body.code ?? ""));
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ coupon: result.coupon });
}
