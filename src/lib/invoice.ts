import { formatMoney, REFERENCE_RATES } from "./currency";
import type { CurrencyCode, Order } from "./types";

function ascii(value: string) {
  return value.replace(/[^\x20-\x7E]/g, "");
}

function escapePdf(value: string) {
  return ascii(value).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function money(cents: number, order: Order) {
  const currency = order.currency;
  const rates = { ...REFERENCE_RATES, [currency]: order.fxRate };
  return formatMoney(cents, currency, rates).replace(/[^\x20-\x7E]/g, "");
}

function buildPdf(lines: string[]) {
  const commands = lines
    .map((line, index) => `BT /F1 11 Tf 48 ${760 - index * 16} Td (${escapePdf(line)}) Tj ET`)
    .join("\n");
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n",
    `4 0 obj << /Length ${commands.length} >> stream\n${commands}\nendstream\nendobj\n`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Courier >> endobj\n",
  ];
  let body = "%PDF-1.4\n";
  const offsets = [0];
  for (const object of objects) {
    offsets.push(body.length);
    body += object;
  }
  const xrefAt = body.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) {
    xref += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  const trailer = `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF`;
  return new TextEncoder().encode(body + xref + trailer);
}

export function invoiceLines(order: Order) {
  const address = order.shippingAddress;
  const lines = [
    "VALENCE  //  AUTONOMOUS LUXURY COMMERCE",
    `INVOICE  ${order.orderNumber}`,
    `DATE  ${order.createdAt.slice(0, 10)}    STATUS  ${order.status}`,
    "",
    "BILL TO",
    order.customerName,
    order.customerEmail,
    address.line1,
    address.line2,
    `${address.city}, ${address.region} ${address.postal}`,
    address.country,
    "",
    "PIECE                          QTY        AMOUNT",
  ];
  for (const item of order.items) {
    const name = `${item.title} / ${item.color} / ${item.size}`.slice(0, 34).padEnd(34, " ");
    lines.push(`${name}${String(item.quantity).padStart(3, " ")}   ${money(item.priceCents * item.quantity, order)}`);
  }
  lines.push(
    "",
    `SUBTOTAL                 ${money(order.subtotalCents, order)}`,
    `DISCOUNT                 ${money(order.discountCents, order)}`,
    `SHIPPING                 ${order.shippingCents === 0 ? "FREE" : money(order.shippingCents, order)}`,
    `TAX                      ${money(order.taxCents, order)}`,
    `TOTAL                    ${money(order.totalCents, order)}`,
    "",
    order.coupon ? `PROMO  ${order.coupon}` : "PROMO  NONE",
    `CURRENCY  ${order.currency}    FX  ${order.fxRate}`,
    order.trackingNumber ? `TRACKING  ${order.trackingCarrier ?? ""} ${order.trackingNumber}` : "TRACKING  PENDING",
    "",
    "Thank you for wearing VALENCE.",
  );
  return lines.filter((line) => line !== undefined);
}

export function downloadInvoice(order: Order) {
  const bytes = buildPdf(invoiceLines(order));
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${order.orderNumber}-invoice.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function formatOrderMoney(cents: number, currency: CurrencyCode, fxRate: number) {
  return formatMoney(cents, currency, { ...REFERENCE_RATES, [currency]: fxRate });
}
