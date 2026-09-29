"use client";

import Link from "next/link";
import { downloadInvoice, formatOrderMoney } from "@/lib/invoice";
import { useCommerce } from "@/context/CommerceProvider";

export function OrdersCenter() {
  const { state } = useCommerce();
  if (!state.user) {
    return (
      <div className="shell py-20">
        <h1 className="font-display text-5xl tracking-[-0.05em]">Sign in to see orders.</h1>
        <Link href="/account" className="btn-lime mt-6">Account</Link>
      </div>
    );
  }
  const orders = state.orders.filter((order) => state.user?.role === "admin" || order.customerEmail === state.user?.email);
  return (
    <div className="shell py-12">
      <p className="eyebrow">History</p>
      <h1 className="mt-3 font-display text-5xl tracking-[-0.05em]">Orders</h1>
      <div className="mt-8 space-y-4">
        {orders.length === 0 ? <p className="text-white/60">No dispatches yet.</p> : null}
        {orders.map((order) => (
          <article key={order.id} className="grid gap-4 border border-white/10 p-5 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="font-display text-2xl">{order.orderNumber}</p>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">
                {order.createdAt.slice(0, 10)} · {order.status} · {formatOrderMoney(order.totalCents, order.currency, order.fxRate)}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/account/orders/${order.id}`} className="btn-ghost">Track</Link>
              <button type="button" className="btn-lime" onClick={() => downloadInvoice(order)}>Invoice</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
