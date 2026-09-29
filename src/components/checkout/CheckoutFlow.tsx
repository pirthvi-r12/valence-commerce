"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cardBrand, formatCardNumber, luhn } from "@/lib/card";
import { useCommerce } from "@/context/CommerceProvider";
import type { Address, Order, ShippingMethod } from "@/lib/types";

const publishable = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = publishable ? loadStripe(publishable) : null;

const EMPTY: Address = {
  id: "draft",
  name: "",
  line1: "",
  line2: "",
  city: "",
  region: "",
  postal: "",
  country: "United States",
  phone: "",
  isDefault: false,
};

export function CheckoutFlow() {
  const { detailedCart, format, priceCart, state, placeOrder, coupon } = useCommerce();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(state.user?.email ?? "");
  const [address, setAddress] = useState<Address>({ ...EMPTY, name: state.user?.name ?? "" });
  const [method, setMethod] = useState<ShippingMethod>("standard");
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const priced = priceCart(method);

  if (order) return <Confirmation order={order} format={format} />;
  if (detailedCart.length === 0) {
    return (
      <div className="shell py-24">
        <p className="eyebrow">Checkout</p>
        <h1 className="mt-4 font-display text-5xl tracking-[-0.05em]">Your bag is empty.</h1>
        <Link href="/shop" className="btn-lime mt-8">Explore collection</Link>
      </div>
    );
  }

  function validateContact() {
    if (!email.includes("@") || !address.name || !address.line1 || !address.city || !address.region || !address.postal || !address.country) {
      setError("Contact and shipping address are required.");
      return false;
    }
    setError(null);
    return true;
  }

  return (
    <div className="shell py-10">
      <p className="eyebrow">Checkout</p>
      <h1 className="mt-3 font-display text-5xl tracking-[-0.05em]">Dispatch</h1>
      <ol className="mt-6 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-[0.18em]">
        {["Contact", "Shipping", "Payment"].map((label, index) => (
          <li key={label}>
            <button type="button" disabled={index + 1 > step} onClick={() => index + 1 < step && setStep(index + 1)} className={step === index + 1 ? "text-lime" : "text-white/40"}>
              0{index + 1} {label}
            </button>
          </li>
        ))}
      </ol>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          {error ? <p className="mb-4 border border-red-400/40 px-3 py-2 text-sm text-red-200">{error}</p> : null}
          {step === 1 ? (
            <form
              className="space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (validateContact()) setStep(2);
              }}
            >
              {state.addresses.length > 0 ? (
                <label className="block text-sm">Saved address
                  <select
                    className="field mt-2"
                    onChange={(event) => {
                      const saved = state.addresses.find((item) => item.id === event.target.value);
                      if (saved) setAddress(saved);
                    }}
                    defaultValue=""
                  >
                    <option value="" className="bg-ink">Use a saved address</option>
                    {state.addresses.map((item) => (
                      <option key={item.id} value={item.id} className="bg-ink">{item.name} · {item.city}</option>
                    ))}
                  </select>
                </label>
              ) : null}
              <Field label="Email" value={email} onChange={setEmail} autoComplete="email" type="email" />
              <Field label="Full name" value={address.name} onChange={(value) => setAddress({ ...address, name: value })} autoComplete="name" />
              <Field label="Phone" value={address.phone} onChange={(value) => setAddress({ ...address, phone: value })} autoComplete="tel" />
              <Field label="Address" value={address.line1} onChange={(value) => setAddress({ ...address, line1: value })} autoComplete="address-line1" />
              <Field label="Apartment" value={address.line2} onChange={(value) => setAddress({ ...address, line2: value })} autoComplete="address-line2" />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="City" value={address.city} onChange={(value) => setAddress({ ...address, city: value })} autoComplete="address-level2" />
                <Field label="Region" value={address.region} onChange={(value) => setAddress({ ...address, region: value })} autoComplete="address-level1" />
                <Field label="Postal code" value={address.postal} onChange={(value) => setAddress({ ...address, postal: value })} autoComplete="postal-code" />
                <Field label="Country" value={address.country} onChange={(value) => setAddress({ ...address, country: value })} autoComplete="country-name" />
              </div>
              <button type="submit" className="btn-lime mt-2">Continue to shipping</button>
            </form>
          ) : null}
          {step === 2 ? (
            <div className="space-y-3">
              <MethodCard title="Standard" copy="4–7 business days" price={labelShipping(priceCart("standard").shippingCents, format)} active={method === "standard"} onClick={() => setMethod("standard")} />
              <MethodCard title="Priority Express" copy="1–2 business days" price={labelShipping(priceCart("express").shippingCents, format)} active={method === "express"} onClick={() => setMethod("express")} />
              <button type="button" className="btn-lime" onClick={() => setStep(3)}>Continue to payment</button>
            </div>
          ) : null}
          {step === 3 ? (
            <PaymentStage
              amountLabel={format(priced.totalCents)}
              totalCents={priced.totalCents}
              onPaid={async (paymentLabel) => {
                const placed = await placeOrder({ email, name: address.name, address, method, paymentLabel });
                setOrder(placed);
              }}
            />
          ) : null}
        </div>
        <aside className="h-fit border border-white/10 bg-ink p-5 lg:sticky lg:top-28">
          <p className="eyebrow">Summary</p>
          <ul className="mt-4 space-y-3">
            {detailedCart.map((line) => (
              <li key={line.variantId} className="flex justify-between gap-3 text-sm">
                <span>{line.title} × {line.qty}</span>
                <span className="font-mono">{format(line.unit * line.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 border-t border-white/10 pt-4 font-mono text-sm">
            <Row label="Subtotal" value={format(priced.net + priced.discountCents)} />
            <Row label={coupon ? `Discount ${coupon.code}` : "Discount"} value={`-${format(priced.discountCents)}`} />
            <Row label="Shipping" value={priced.shippingCents === 0 ? "Free" : format(priced.shippingCents)} />
            <Row label="Tax 8.25%" value={format(priced.taxCents)} />
            <div className="flex justify-between pt-2 text-base text-lime">
              <dt>Total</dt>
              <dd>{format(priced.totalCents)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, autoComplete, type = "text" }: { label: string; value: string; onChange: (value: string) => void; autoComplete?: string; type?: string }) {
  return (
    <label className="block text-sm">
      {label}
      <input className="field mt-2" value={value} type={type} autoComplete={autoComplete} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function MethodCard({ title, copy, price, active, onClick }: { title: string; copy: string; price: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center justify-between border px-4 py-4 text-left ${active ? "border-lime" : "border-white/10"}`}>
      <span>
        <span className="block font-display text-2xl">{title}</span>
        <span className="text-sm text-white/50">{copy}</span>
      </span>
      <span className="font-mono">{price}</span>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-white/70">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function labelShipping(cents: number, format: (cents: number) => string) {
  return cents === 0 ? "Free" : format(cents);
}

function PaymentStage({ amountLabel, totalCents, onPaid }: { amountLabel: string; totalCents: number; onPaid: (label: string) => Promise<void> }) {
  const { currency } = useCommerce();
  const [secret, setSecret] = useState<string | null>(null);
  const [mode, setMode] = useState<"loading" | "stripe" | "test">(stripePromise ? "loading" : "test");

  useEffect(() => {
    if (!stripePromise) return;
    let cancel = false;
    fetch("/api/stripe/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountCents: totalCents, currency }),
    })
      .then((response) => response.json())
      .then((data: { clientSecret?: string }) => {
        if (cancel) return;
        if (data.clientSecret) {
          setSecret(data.clientSecret);
          setMode("stripe");
        } else setMode("test");
      })
      .catch(() => {
        if (!cancel) setMode("test");
      });
    return () => {
      cancel = true;
    };
  }, [currency, totalCents]);

  if (mode === "loading") return <p className="font-mono text-xs uppercase tracking-[0.16em] text-white/50">Contacting Stripe…</p>;

  if (mode === "stripe" && secret && stripePromise) {
    return (
      <Elements stripe={stripePromise} options={{ clientSecret: secret, appearance: { theme: "night", variables: { colorPrimary: "#D4FF00", colorBackground: "#0D0F15", colorText: "#F8F9FA", borderRadius: "0px" } } }}>
        <StripePay amountLabel={amountLabel} onPaid={onPaid} />
      </Elements>
    );
  }

  return <TestPay amountLabel={amountLabel} onPaid={onPaid} liveAttempt={false} />;
}

function StripePay({ amountLabel, onPaid }: { amountLabel: string; onPaid: (label: string) => Promise<void> }) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!stripe || !elements) return;
        setBusy(true);
        const result = await stripe.confirmPayment({ elements, redirect: "if_required" });
        if (result.error) {
          setError(result.error.message ?? "Payment failed.");
          setBusy(false);
          return;
        }
        await onPaid("Stripe");
      }}
    >
      <p className="text-sm text-white/60">Card, Apple Pay, and Google Pay via Stripe. Charging {amountLabel}.</p>
      <PaymentElement />
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
      <button type="submit" className="btn-lime" disabled={busy || !stripe}>{busy ? "Authorizing" : `Pay ${amountLabel}`}</button>
    </form>
  );
}

function TestPay({ amountLabel, onPaid, liveAttempt }: { amountLabel: string; onPaid: (label: string) => Promise<void>; liveAttempt: boolean }) {
  const [wallet, setWallet] = useState<"card" | "apple" | "google">("card");
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        if (wallet !== "card") {
          setBusy(true);
          await new Promise((resolve) => setTimeout(resolve, 600));
          await onPaid(wallet === "apple" ? "Apple Pay" : "Google Pay");
          return;
        }
        const digits = number.replace(/\s/g, "");
        if (!luhn(digits)) {
          setError("Enter a valid test card. 4242 4242 4242 4242 passes.");
          return;
        }
        if (!/^\d{2}\/\d{2}$/.test(exp)) {
          setError("Expiry should look like 12/28.");
          return;
        }
        const [month, year] = exp.split("/").map(Number);
        const expiry = new Date(2000 + year, month - 1, 1);
        if (month < 1 || month > 12 || expiry < new Date()) {
          setError("That card is expired.");
          return;
        }
        if (!/^\d{3,4}$/.test(cvc)) {
          setError("CVC should be 3 or 4 digits.");
          return;
        }
        setBusy(true);
        await new Promise((resolve) => setTimeout(resolve, 700));
        await onPaid(`${cardBrand(digits)} •••• ${digits.slice(-4)}`);
      }}
    >
      <p className="border border-lime/30 bg-lime/10 px-3 py-2 text-sm text-lime">
        {liveAttempt ? "Stripe is configured but the payment intent did not return. Test mode is active." : "Stripe test-mode fallback. No live charge is created."}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {(["card", "apple", "google"] as const).map((option) => (
          <button key={option} type="button" onClick={() => setWallet(option)} className={`border px-2 py-3 font-mono text-[10px] uppercase tracking-[0.14em] ${wallet === option ? "border-lime text-lime" : "border-white/15"}`}>
            {option === "card" ? "Card" : option === "apple" ? "Apple Pay" : "Google Pay"}
          </button>
        ))}
      </div>
      {wallet === "card" ? (
        <>
          <label className="block text-sm">Card number
            <input className="field mt-2 font-mono" inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" value={number} onChange={(event) => setNumber(formatCardNumber(event.target.value))} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">Expiry<input className="field mt-2 font-mono" autoComplete="cc-exp" placeholder="12/28" value={exp} onChange={(event) => setExp(event.target.value)} /></label>
            <label className="text-sm">CVC<input className="field mt-2 font-mono" autoComplete="cc-csc" placeholder="123" value={cvc} onChange={(event) => setCvc(event.target.value.replace(/\D/g, "").slice(0, 4))} /></label>
          </div>
        </>
      ) : (
        <p className="text-sm text-white/60">Test authorization for {wallet === "apple" ? "Apple Pay" : "Google Pay"}. Wallets appear automatically when Stripe keys are set.</p>
      )}
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
      <button type="submit" className="btn-lime" disabled={busy}>{busy ? "Authorizing" : `Pay ${amountLabel}`}</button>
    </form>
  );
}

function Confirmation({ order, format }: { order: Order; format: (cents: number) => string }) {
  return (
    <div className="shell py-20">
      <p className="eyebrow">Confirmed</p>
      <h1 className="mt-4 font-display text-6xl tracking-[-0.05em]">{order.orderNumber}</h1>
      <p className="mt-4 max-w-xl text-white/70">Payment recorded in test mode. A receipt is ready in your order history. Total {format(order.totalCents)}.</p>
      <div className="mt-8 flex gap-3">
        <Link href={`/account/orders/${order.id}`} className="btn-lime">Track shipment</Link>
        <Link href="/shop" className="btn-ghost">Continue</Link>
      </div>
    </div>
  );
}
