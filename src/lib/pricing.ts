import type { ShippingMethod } from "./types";

export const FREE_SHIPPING_CENTS = 20000;
export const TAX_RATE = 0.0825;

export function quote(subtotalCents: number, method: ShippingMethod, discountPercent: number) {
  const discountCents = Math.round(subtotalCents * (discountPercent / 100));
  const net = Math.max(0, subtotalCents - discountCents);
  const shippingCents = net >= FREE_SHIPPING_CENTS ? 0 : method === "express" ? 3500 : 1800;
  const taxCents = Math.round(net * TAX_RATE);
  const totalCents = net + shippingCents + taxCents;
  return { discountCents, shippingCents, taxCents, totalCents, net };
}
