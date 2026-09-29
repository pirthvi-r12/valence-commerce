export interface Coupon {
  code: string;
  discountPercent: number;
  validUntil: string;
  active: boolean;
}

export const COUPONS: Coupon[] = [
  { code: "VALENCE20", discountPercent: 20, validUntil: "2027-12-31T23:59:59.000Z", active: true },
  { code: "SS26", discountPercent: 15, validUntil: "2026-12-31T23:59:59.000Z", active: true },
  { code: "ARC10", discountPercent: 10, validUntil: "2026-12-31T23:59:59.000Z", active: false },
  { code: "DROP24", discountPercent: 25, validUntil: "2025-01-01T00:00:00.000Z", active: true },
];

export function validateCoupon(code: string, now = new Date()): { ok: true; coupon: Coupon } | { ok: false; error: string } {
  const found = COUPONS.find((coupon) => coupon.code.toLowerCase() === code.trim().toLowerCase());
  if (!found) return { ok: false, error: "Code not recognized." };
  if (!found.active) return { ok: false, error: "This code is no longer active." };
  if (new Date(found.validUntil).getTime() < now.getTime()) return { ok: false, error: "This code has expired." };
  return { ok: true, coupon: found };
}
