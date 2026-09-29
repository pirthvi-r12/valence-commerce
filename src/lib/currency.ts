import type { CurrencyCode } from "./types";

export const CURRENCY_CODES: CurrencyCode[] = ["USD", "EUR", "GBP", "CAD", "JPY"];

export const REFERENCE_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  CAD: 1.36,
  JPY: 149,
};

const LOCALES: Record<CurrencyCode, string> = {
  USD: "en-US",
  EUR: "de-DE",
  GBP: "en-GB",
  CAD: "en-CA",
  JPY: "ja-JP",
};

export function isCurrency(value: string): value is CurrencyCode {
  return CURRENCY_CODES.includes(value as CurrencyCode);
}

export function formatMoney(
  centsUsd: number,
  currency: CurrencyCode,
  rates: Record<CurrencyCode, number> = REFERENCE_RATES,
) {
  const rate = rates[currency] ?? 1;
  const value = (centsUsd / 100) * rate;
  return new Intl.NumberFormat(LOCALES[currency], {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "JPY" ? 0 : 2,
    maximumFractionDigits: currency === "JPY" ? 0 : 2,
  }).format(value);
}

export function stripeAmount(
  centsUsd: number,
  currency: CurrencyCode,
  rates: Record<CurrencyCode, number> = REFERENCE_RATES,
) {
  const value = (centsUsd / 100) * (rates[currency] ?? 1);
  if (currency === "JPY") return Math.max(1, Math.round(value));
  return Math.max(50, Math.round(value * 100));
}

export function detectCurrency(): CurrencyCode {
  if (typeof window === "undefined") return "USD";
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const lang = navigator.language || "";
  if (tz.includes("Tokyo") || lang.startsWith("ja")) return "JPY";
  if (tz.includes("London") || lang === "en-GB") return "GBP";
  if (tz.includes("Toronto") || tz.includes("Vancouver") || lang === "en-CA" || lang === "fr-CA") return "CAD";
  if (tz.startsWith("Europe/") || /^(de|fr|it|es|nl|pt)/.test(lang)) return "EUR";
  return "USD";
}
