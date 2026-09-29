"use client";

import Link from "next/link";
import { downloadInvoice, formatOrderMoney } from "@/lib/invoice";
import { useCommerce } from "@/context/CommerceProvider";
import type { Order } from "@/lib/types";

const STEPS = ["Order Placed", "Processing", "Dispatched", "In Transit", "Delivered"];

function activeStep(order: Order) {
  if (order.status === "Pending") return 0;
  if (order.status === "Processing") return 1;
  if (order.status === "Shipped") return order.trackingNumber ? 3 : 2;
  return 4;
}

export function OrderDetail({ id }: { id: string }) {
  const { state } = useCommerce();
  const order = state.orders.find((item) => item.id === id);
  if (!order) {
    return (
      <div className="shell py-20">
        <h1 className="font-display text-5xl">Order not on this device.</h1>
        <Link href="/account/orders" className="btn-lime mt-6">All orders</Link>
      </div>
    );
  }
  if (state.user && state.user.role !== "admin" && state.user.email !== order.customerEmail) {
    return <div className="shell py-20 font-display text-4xl">This shipment belongs to another profile.</div>;
  }
  const current = activeStep(order);
  const money = (cents: number) => formatOrderMoney(cents, order.currency, order.fxRate);
  return (
    <div className="shell py-12">
      <p className="eyebrow">Shipment</p>
      <h1 className="mt-3 font-display text-5xl tracking-[-0.05em]">{order.orderNumber}</h1>
      <p className="mt-2 font-mono text-xs uppercase tracking-[0.16em] text-white/45">{order.status}{order.returned ? " · Returned" : ""}</p>
      <ol className="mt-10 grid gap-3 md:grid-cols-5">
        {STEPS.map((step, index) => (
          <li key={step} className={`border px-3 py-4 ${index <= current ? "border-lime" : "border-white/10 text-white/35"}`}>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em]">{String(index + 1).padStart(2, "0")}</p>
            <p className="mt-2 font-display text-lg">{step}</p>
          </li>
        ))}
      </ol>
      <div className="mt-8 border border-white/10 p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">Carrier</p>
        <p className="mt-2 font-mono text-lg">{order.trackingCarrier ?? "Awaiting scan"} {order.trackingNumber ?? ""}</p>
        {order.trackingNumber ? (
          <button
            type="button"
            className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-lime"
            onClick={() => navigator.clipboard.writeText(order.trackingNumber ?? "")}
          >
            Copy tracking code
          </button>
        ) : null}
      </div>
      <ul className="mt-8 space-y-2 text-sm">
        {order.items.map((item) => (
          <li key={item.variantId} className="flex justify-between border-b border-white/10 py-2">
            <span>{item.title} · {item.color} / {item.size} × {item.quantity}</span>
            <span className="font-mono">{money(item.priceCents * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-right font-mono text-lime">Total {money(order.totalCents)}</p>
      <button type="button" className="btn-lime mt-6" onClick={() => downloadInvoice(order)}>Download invoice</button>
    </div>
  );
}
