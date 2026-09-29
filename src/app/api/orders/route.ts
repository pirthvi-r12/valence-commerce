import { NextResponse } from "next/server";
import { fetchOrdersFromDatabase, isDatabaseConfigured, persistOrder } from "@/lib/db";
import { readJsonBody } from "@/lib/request-guard";
import { getMemory } from "@/lib/serverStore";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  if (isDatabaseConfigured()) {
    try {
      const orders = await fetchOrdersFromDatabase();
      if (orders.length) return NextResponse.json({ orders, source: "database" });
    } catch {
      // fall through to in-memory orders
    }
  }
  return NextResponse.json({ orders: getMemory().orders, source: "memory" });
}

export async function POST(request: Request) {
  const body = await readJsonBody<{ order?: Order }>(request);
  if (!body) return NextResponse.json({ error: "Payload too large or invalid" }, { status: 413 });
  const order = body.order;
  if (!order?.orderNumber || !order.customerEmail || !Array.isArray(order.items) || order.items.length > 40) {
    return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  }
  getMemory().orders.unshift(order);
  if (isDatabaseConfigured()) {
    try {
      await persistOrder(order);
    } catch {
      // The browser keeps the order if the database is not migrated yet.
    }
  }
  return NextResponse.json({ ok: true, order });
}
