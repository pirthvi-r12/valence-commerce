import { NextResponse } from "next/server";
import { stripeAmount } from "@/lib/currency";
import type { CurrencyCode } from "@/lib/types";
import { isCurrency } from "@/lib/currency";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return NextResponse.json({ mode: "test-fallback" });
  const body = (await request.json()) as { amountCents?: number; currency?: string };
  const currency: CurrencyCode = body.currency && isCurrency(body.currency) ? body.currency : "USD";
  const amount = stripeAmount(Number(body.amountCents ?? 0), currency);
  try {
    const { default: Stripe } = await import("stripe");
    const stripe = new Stripe(secret);
    const intent = await stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
    });
    return NextResponse.json({ mode: "stripe", clientSecret: intent.client_secret });
  } catch {
    return NextResponse.json({ mode: "test-fallback" });
  }
}
