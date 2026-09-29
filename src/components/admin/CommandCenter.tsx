"use client";

import { useEffect, useMemo, useState } from "react";
import { createCustomProduct } from "@/lib/catalog";
import { useCommerce } from "@/context/CommerceProvider";
import type { Category, OrderStatus, Product } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

const STATUSES: OrderStatus[] = ["Pending", "Processing", "Shipped", "Delivered"];

export function CommandCenter() {
  const { catalog, state, format, updateOrderStatus, saveProduct, addCustomProduct, signOut } = useCommerce();
  const [tab, setTab] = useState<"overview" | "catalog" | "orders">("overview");
  const [db, setDb] = useState("checking");
  const [selectedId, setSelectedId] = useState(catalog[0]?.id ?? "");
  const selected = catalog.find((product) => product.id === selectedId) ?? catalog[0];

  useEffect(() => {
    fetch("/api/health")
      .then((response) => response.json())
      .then((data: { mode?: string }) => setDb(data.mode ?? "standby"))
      .catch(() => setDb("offline"));
  }, []);

  const kpis = useMemo(() => {
    const orders = state.orders;
    const revenue = orders.reduce((sum, order) => sum + order.totalCents, 0);
    const aov = orders.length ? Math.round(revenue / orders.length) : 0;
    const returns = orders.filter((order) => order.returned).length;
    return {
      revenue,
      orders: orders.length,
      aov,
      returnRate: orders.length ? (returns / orders.length) * 100 : 0,
    };
  }, [state.orders]);

  return (
    <div className="shell py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Executive desk</p>
          <h1 className="mt-3 font-display text-5xl tracking-[-0.05em]">Command center</h1>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">Database {db}</p>
        </div>
        <button type="button" className="btn-ghost" onClick={() => void signOut().then(() => window.location.assign("/admin/login"))}>Sign out</button>
      </div>
      <div className="mt-6 flex gap-3 font-mono text-[11px] uppercase tracking-[0.18em]">
        {(["overview", "catalog", "orders"] as const).map((item) => (
          <button key={item} type="button" className={tab === item ? "text-lime" : "text-white/40"} onClick={() => setTab(item)}>{item}</button>
        ))}
      </div>
      {tab === "overview" ? (
        <div className="mt-8 grid gap-3 md:grid-cols-4">
          <Kpi label="Total revenue" value={format(kpis.revenue)} />
          <Kpi label="Total orders" value={String(kpis.orders)} />
          <Kpi label="Average order value" value={format(kpis.aov)} />
          <Kpi label="Return rate" value={`${kpis.returnRate.toFixed(1)}%`} />
        </div>
      ) : null}
      {tab === "catalog" && selected ? (
        <CatalogDesk
          products={catalog}
          selected={selected}
          onSelect={setSelectedId}
          onSave={saveProduct}
          onCreate={addCustomProduct}
        />
      ) : null}
      {tab === "orders" ? <OrderQueue orders={state.orders} format={format} onUpdate={updateOrderStatus} /> : null}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <article className="border border-white/10 bg-ink p-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className="mt-3 font-display text-3xl tracking-[-0.04em]">{value}</p>
    </article>
  );
}

function CatalogDesk({
  products,
  selected,
  onSelect,
  onSave,
  onCreate,
}: {
  products: Product[];
  selected: Product;
  onSelect: (id: string) => void;
  onSave: (id: string, patch: { priceCents?: number; compareAtCents?: number | null; hidden?: boolean; inventory?: Record<string, number> }) => void;
  onCreate: (product: Product) => void;
}) {
  const [price, setPrice] = useState(String(selected.priceCents / 100));
  const [compare, setCompare] = useState(selected.compareAtCents ? String(selected.compareAtCents / 100) : "");
  const [hidden, setHidden] = useState(selected.hidden);
  const [stock, setStock] = useState<Record<string, number>>(Object.fromEntries(selected.variants.map((variant) => [variant.id, variant.inventoryCount])));
  const [draft, setDraft] = useState({ title: "", category: "Outerwear" as Category, price: "420", color: "Obsidian", stock: "8", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1600&h=2000&q=80" });

  useEffect(() => {
    setPrice(String(selected.priceCents / 100));
    setCompare(selected.compareAtCents ? String(selected.compareAtCents / 100) : "");
    setHidden(selected.hidden);
    setStock(Object.fromEntries(selected.variants.map((variant) => [variant.id, variant.inventoryCount])));
  }, [selected]);

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
      <ul className="max-h-[70vh] space-y-2 overflow-auto">
        {products.map((product) => (
          <li key={product.id}>
            <button type="button" onClick={() => onSelect(product.id)} className={`w-full border px-3 py-2 text-left text-sm ${product.id === selected.id ? "border-lime" : "border-white/10"}`}>
              {product.title}
              {product.hidden ? <span className="ml-2 font-mono text-[10px] text-white/40">Hidden</span> : null}
            </button>
          </li>
        ))}
      </ul>
      <div className="space-y-6">
        <form
          className="grid gap-3 border border-white/10 p-5 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(selected.id, {
              priceCents: Math.round(Number(price) * 100),
              compareAtCents: compare ? Math.round(Number(compare) * 100) : null,
              hidden,
              inventory: stock,
            });
          }}
        >
          <h2 className="font-display text-3xl md:col-span-2">{selected.title}</h2>
          <label className="text-sm">Price USD<input className="field mt-2" value={price} onChange={(event) => setPrice(event.target.value)} /></label>
          <label className="text-sm">Compare-at<input className="field mt-2" value={compare} onChange={(event) => setCompare(event.target.value)} placeholder="Empty clears sale" /></label>
          <label className="flex items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" checked={hidden} onChange={(event) => setHidden(event.target.checked)} /> Hidden from the floor
          </label>
          <div className="md:col-span-2 grid max-h-64 gap-2 overflow-auto sm:grid-cols-2">
            {selected.variants.map((variant) => (
              <label key={variant.id} className="flex items-center justify-between gap-2 font-mono text-[11px]">
                <span>{variant.color} / {variant.size}</span>
                <input className="field w-20" type="number" min={0} value={stock[variant.id] ?? 0} onChange={(event) => setStock({ ...stock, [variant.id]: Number(event.target.value) })} />
              </label>
            ))}
          </div>
          <button type="submit" className="btn-lime md:col-span-2">Save SKU</button>
        </form>
        <form
          className="grid gap-3 border border-white/10 p-5 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            const product = createCustomProduct({
              title: draft.title,
              category: draft.category,
              priceCents: Math.round(Number(draft.price) * 100),
              compareAtCents: null,
              description: "Added from the command center.",
              imageUrl: draft.image,
              color: draft.color,
              stock: Number(draft.stock) || 0,
            });
            onCreate(product);
            setDraft({ ...draft, title: "" });
          }}
        >
          <h2 className="font-display text-3xl md:col-span-2">Add a piece</h2>
          <input className="field md:col-span-2" placeholder="Title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required />
          <select className="field" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value as Category })}>
            {CATEGORIES.map((category) => <option key={category} className="bg-ink">{category}</option>)}
          </select>
          <input className="field" placeholder="Price" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} />
          <input className="field" placeholder="Color" value={draft.color} onChange={(event) => setDraft({ ...draft, color: event.target.value })} />
          <input className="field" placeholder="Stock per size" value={draft.stock} onChange={(event) => setDraft({ ...draft, stock: event.target.value })} />
          <input className="field md:col-span-2" placeholder="Image URL" value={draft.image} onChange={(event) => setDraft({ ...draft, image: event.target.value })} />
          <button type="submit" className="btn-ghost md:col-span-2">Publish to floor</button>
        </form>
      </div>
    </div>
  );
}

function OrderQueue({
  orders,
  format,
  onUpdate,
}: {
  orders: { id: string; orderNumber: string; customerEmail: string; status: OrderStatus; totalCents: number; trackingCarrier: string | null; trackingNumber: string | null }[];
  format: (cents: number) => string;
  onUpdate: (id: string, status: OrderStatus, tracking?: { carrier?: string; number?: string }) => void;
}) {
  return (
    <div className="mt-8 overflow-auto border border-white/10">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
          <tr>
            <th className="px-3 py-3">Order</th>
            <th>Client</th>
            <th>Total</th>
            <th>Status</th>
            <th>Carrier</th>
            <th>Tracking</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-t border-white/10">
              <td className="px-3 py-3 font-mono">{order.orderNumber}</td>
              <td>{order.customerEmail}</td>
              <td className="font-mono">{format(order.totalCents)}</td>
              <td>
                <select
                  className="field"
                  value={order.status}
                  onChange={(event) => onUpdate(order.id, event.target.value as OrderStatus)}
                >
                  {STATUSES.map((status) => <option key={status} className="bg-ink">{status}</option>)}
                </select>
              </td>
              <td>
                <input
                  className="field"
                  defaultValue={order.trackingCarrier ?? ""}
                  onBlur={(event) => onUpdate(order.id, order.status, { carrier: event.target.value, number: order.trackingNumber ?? "" })}
                />
              </td>
              <td>
                <input
                  className="field"
                  defaultValue={order.trackingNumber ?? ""}
                  onBlur={(event) => onUpdate(order.id, order.status, { carrier: order.trackingCarrier ?? "", number: event.target.value })}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
