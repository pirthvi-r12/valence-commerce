"use client";

import Link from "next/link";
import { useState } from "react";
import { cardBrand, formatCardNumber, luhn } from "@/lib/card";
import { useCommerce } from "@/context/CommerceProvider";
import { DEMO_PASSWORD, DEMO_USER } from "@/lib/seedOrders";
import type { Address } from "@/lib/types";

export function AccountCenter() {
  const { state, signIn, register, signOut, addAddress, removeAddress, setDefaultAddress, addPayment, removePayment, setDefaultPayment } = useCommerce();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(DEMO_USER.email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!state.user) {
    return (
      <div className="shell grid gap-10 py-16 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="mt-3 font-display text-5xl tracking-[-0.05em]">Enter the atelier.</h1>
          <p className="mt-4 max-w-md text-white/65">Orders, addresses, and saved cards live with your profile. Wishlist pieces sync when you sign in on this device.</p>
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.16em] text-lime">
            Demo client · {DEMO_USER.email} · {DEMO_PASSWORD}
          </p>
        </div>
        <form
          className="space-y-3 border border-white/10 bg-ink p-6"
          onSubmit={async (event) => {
            event.preventDefault();
            const message = mode === "signin" ? await signIn(email, password) : await register(name, email, password);
            setError(message);
          }}
        >
          <div className="flex gap-3 font-mono text-[10px] uppercase tracking-[0.16em]">
            <button type="button" className={mode === "signin" ? "text-lime" : "text-white/40"} onClick={() => setMode("signin")}>Sign in</button>
            <button type="button" className={mode === "register" ? "text-lime" : "text-white/40"} onClick={() => setMode("register")}>Create profile</button>
          </div>
          {mode === "register" ? <input className="field" placeholder="Name" value={name} onChange={(event) => setName(event.target.value)} /> : null}
          <input className="field" type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <input className="field" type="password" placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} />
          {error ? <p className="text-sm text-red-200">{error}</p> : null}
          <button type="submit" className="btn-lime w-full">{mode === "signin" ? "Sign in" : "Create profile"}</button>
        </form>
      </div>
    );
  }

  const latest = state.orders.find((order) => state.user?.role === "admin" || order.customerEmail === state.user?.email);

  return (
    <div className="shell py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{state.user.role}</p>
          <h1 className="mt-3 font-display text-5xl tracking-[-0.05em]">{state.user.name}</h1>
          <p className="mt-2 font-mono text-xs text-white/50">{state.user.email}</p>
        </div>
        <button type="button" className="btn-ghost" onClick={() => void signOut()}>Sign out</button>
      </div>
      {latest ? (
        <Link href={`/account/orders/${latest.id}`} className="mt-8 block border border-white/10 p-5 hover:border-lime">
          <p className="eyebrow">Latest shipment</p>
          <p className="mt-2 font-display text-3xl">{latest.orderNumber}</p>
          <p className="mt-1 font-mono text-xs uppercase tracking-[0.16em] text-white/50">{latest.status}</p>
        </Link>
      ) : null}
      <div className="mt-6">
        <Link href="/account/orders" className="btn-lime">Order history</Link>
      </div>
      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <AddressBook addresses={state.addresses} onAdd={addAddress} onRemove={removeAddress} onDefault={setDefaultAddress} />
        <PaymentBook payments={state.payments} onAdd={addPayment} onRemove={removePayment} onDefault={setDefaultPayment} />
      </div>
    </div>
  );
}

function AddressBook({
  addresses,
  onAdd,
  onRemove,
  onDefault,
}: {
  addresses: Address[];
  onAdd: (address: Omit<Address, "id">) => void;
  onRemove: (id: string) => void;
  onDefault: (id: string) => void;
}) {
  const [form, setForm] = useState({ name: "", line1: "", line2: "", city: "", region: "", postal: "", country: "United States", phone: "" });
  return (
    <section>
      <h2 className="font-display text-3xl">Shipping addresses</h2>
      <ul className="mt-4 space-y-3">
        {addresses.map((address) => (
          <li key={address.id} className="border border-white/10 p-4 text-sm">
            <p>{address.name} {address.isDefault ? <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.14em] text-lime">Default</span> : null}</p>
            <p className="text-white/60">{address.line1} {address.line2}</p>
            <p className="text-white/60">{address.city}, {address.region} {address.postal}</p>
            <div className="mt-3 flex gap-3 font-mono text-[10px] uppercase tracking-[0.14em]">
              <button type="button" onClick={() => onDefault(address.id)}>Make default</button>
              <button type="button" onClick={() => onRemove(address.id)}>Remove</button>
            </div>
          </li>
        ))}
      </ul>
      <form
        className="mt-4 grid gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          onAdd({ ...form, isDefault: addresses.length === 0 });
          setForm({ name: "", line1: "", line2: "", city: "", region: "", postal: "", country: "United States", phone: "" });
        }}
      >
        {(["name", "line1", "city", "region", "postal", "country", "phone"] as const).map((key) => (
          <input key={key} className="field" placeholder={key} value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} required={key !== "phone"} />
        ))}
        <button type="submit" className="btn-ghost">Save address</button>
      </form>
    </section>
  );
}

function PaymentBook({
  payments,
  onAdd,
  onRemove,
  onDefault,
}: {
  payments: { id: string; brand: string; last4: string; exp: string; isDefault: boolean }[];
  onAdd: (card: { brand: string; last4: string; exp: string; isDefault: boolean }) => void;
  onRemove: (id: string) => void;
  onDefault: (id: string) => void;
}) {
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");
  const [error, setError] = useState<string | null>(null);
  return (
    <section>
      <h2 className="font-display text-3xl">Payment methods</h2>
      <p className="mt-2 text-sm text-white/50">Only the brand and last four digits are stored.</p>
      <ul className="mt-4 space-y-3">
        {payments.map((card) => (
          <li key={card.id} className="flex items-center justify-between border border-white/10 p-4 font-mono text-sm">
            <span>{card.brand} ···· {card.last4} · {card.exp} {card.isDefault ? <span className="text-lime">Default</span> : null}</span>
            <span className="flex gap-3 text-[10px] uppercase tracking-[0.14em]">
              <button type="button" onClick={() => onDefault(card.id)}>Default</button>
              <button type="button" onClick={() => onRemove(card.id)}>Remove</button>
            </span>
          </li>
        ))}
      </ul>
      <form
        className="mt-4 space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          const digits = number.replace(/\s/g, "");
          if (!luhn(digits) || !/^\d{2}\/\d{2}$/.test(exp)) {
            setError("Use a valid test card and expiry, for example 4242 4242 4242 4242 and 12/28.");
            return;
          }
          setError(null);
          onAdd({ brand: cardBrand(digits), last4: digits.slice(-4), exp, isDefault: payments.length === 0 });
          setNumber("");
          setExp("");
        }}
      >
        <input className="field font-mono" placeholder="Card number" value={number} onChange={(event) => setNumber(formatCardNumber(event.target.value))} />
        <input className="field font-mono" placeholder="MM/YY" value={exp} onChange={(event) => setExp(event.target.value)} />
        {error ? <p className="text-sm text-red-200">{error}</p> : null}
        <button type="submit" className="btn-ghost">Save card</button>
      </form>
    </section>
  );
}
