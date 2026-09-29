import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/adminAuth";
import { getMemory } from "@/lib/serverStore";
import type { OrderStatus } from "@/lib/types";

export async function PATCH(request: Request) {
  const denied = assertAdmin();
  if (denied) return denied;
  const body = (await request.json()) as { id?: string; status?: OrderStatus; trackingCarrier?: string; trackingNumber?: string };
  const order = getMemory().orders.find((item) => item.id === body.id);
  if (order && body.status) {
    order.status = body.status;
    if (body.trackingCarrier !== undefined) order.trackingCarrier = body.trackingCarrier;
    if (body.trackingNumber !== undefined) order.trackingNumber = body.trackingNumber;
  }
  return NextResponse.json({ ok: true });
}
