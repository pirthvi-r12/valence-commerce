import { imageFor, PRODUCTS } from "./catalog";
import { quote } from "./pricing";
import type { Address, Order, OrderItem, SavedCard, Size } from "./types";

export const DEMO_USER = {
  id: "usr_avery",
  name: "Avery Chen",
  email: "avery@valence.studio",
  role: "customer" as const,
};

export const DEMO_PASSWORD = "atelier";

export const DEMO_ADDRESSES: Address[] = [
  {
    id: "addr_la",
    name: "Avery Chen",
    line1: "118 Mercer Street",
    line2: "Atelier 4",
    city: "Los Angeles",
    region: "CA",
    postal: "90013",
    country: "United States",
    phone: "+1 213 555 0148",
    isDefault: true,
  },
  {
    id: "addr_ldn",
    name: "Avery Chen",
    line1: "18 Redchurch Street",
    line2: "",
    city: "London",
    region: "England",
    postal: "E2 7DD",
    country: "United Kingdom",
    phone: "+44 20 7946 0991",
    isDefault: false,
  },
];

export const DEMO_CARDS: SavedCard[] = [
  { id: "card_4242", brand: "Visa", last4: "4242", exp: "12/28", isDefault: true },
];

function line(slug: string, color: string, size: Size, quantity: number): OrderItem {
  const product = PRODUCTS.find((item) => item.slug === slug);
  if (!product) throw new Error(`Missing product ${slug}`);
  const variant = product.variants.find((item) => item.color === color && item.size === size);
  if (!variant) throw new Error(`Missing variant ${slug} ${color} ${size}`);
  return {
    productId: product.id,
    variantId: variant.id,
    title: product.title,
    sku: variant.sku,
    size,
    color,
    priceCents: product.priceCents + variant.priceOffsetCents,
    quantity,
    image: imageFor(product, color),
  };
}

function makeOrder(input: Omit<Order, "subtotalCents" | "discountCents" | "shippingCents" | "taxCents" | "totalCents"> & { discountPercent?: number }): Order {
  const subtotalCents = input.items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
  const priced = quote(subtotalCents, input.shippingMethod, input.discountPercent ?? 0);
  return {
    ...input,
    subtotalCents,
    discountCents: priced.discountCents,
    shippingCents: priced.shippingCents,
    taxCents: priced.taxCents,
    totalCents: priced.totalCents,
  };
}

const address = DEMO_ADDRESSES[0];

export function buildSeedOrders(): Order[] {
  return [
    makeOrder({
      id: "ord_1001",
      orderNumber: "VL-10421",
      userId: DEMO_USER.id,
      customerEmail: DEMO_USER.email,
      customerName: DEMO_USER.name,
      shippingAddress: address,
      shippingMethod: "express",
      coupon: null,
      currency: "USD",
      fxRate: 1,
      status: "Delivered",
      returned: false,
      trackingCarrier: "DHL",
      trackingNumber: "VL882190442",
      createdAt: "2026-09-14T15:04:00.000Z",
      items: [line("obsidian-shell-parka", "Obsidian", "M", 1), line("cipher-merino-beanie", "Obsidian", "M", 1)],
    }),
    makeOrder({
      id: "ord_1002",
      orderNumber: "VL-10428",
      userId: DEMO_USER.id,
      customerEmail: DEMO_USER.email,
      customerName: DEMO_USER.name,
      shippingAddress: address,
      shippingMethod: "standard",
      coupon: "VALENCE20",
      currency: "USD",
      fxRate: 1,
      status: "Shipped",
      returned: false,
      trackingCarrier: "UPS",
      trackingNumber: "1Z999AA10123456784",
      createdAt: "2026-09-24T11:20:00.000Z",
      discountPercent: 20,
      items: [line("arc-form-cargo-trouser", "Ink", "M", 1), line("bone-technical-tee", "Bone", "S", 2)],
    }),
    makeOrder({
      id: "ord_1003",
      orderNumber: "VL-10433",
      userId: DEMO_USER.id,
      customerEmail: DEMO_USER.email,
      customerName: DEMO_USER.name,
      shippingAddress: DEMO_ADDRESSES[1],
      shippingMethod: "express",
      coupon: null,
      currency: "GBP",
      fxRate: 0.78,
      status: "Processing",
      returned: false,
      trackingCarrier: null,
      trackingNumber: null,
      createdAt: "2026-09-26T09:12:00.000Z",
      items: [line("nightfall-modular-vest", "Night", "M", 1)],
    }),
    makeOrder({
      id: "ord_1004",
      orderNumber: "VL-10436",
      userId: DEMO_USER.id,
      customerEmail: DEMO_USER.email,
      customerName: DEMO_USER.name,
      shippingAddress: address,
      shippingMethod: "standard",
      coupon: null,
      currency: "USD",
      fxRate: 1,
      status: "Pending",
      returned: false,
      trackingCarrier: null,
      trackingNumber: null,
      createdAt: "2026-09-27T18:40:00.000Z",
      items: [line("glacier-expedition-boot", "Glacier", "M", 1)],
    }),
    makeOrder({
      id: "ord_1005",
      orderNumber: "VL-10302",
      userId: DEMO_USER.id,
      customerEmail: DEMO_USER.email,
      customerName: DEMO_USER.name,
      shippingAddress: address,
      shippingMethod: "standard",
      coupon: null,
      currency: "USD",
      fxRate: 1,
      status: "Delivered",
      returned: true,
      trackingCarrier: "DHL",
      trackingNumber: "VL771003118",
      createdAt: "2026-08-20T13:00:00.000Z",
      items: [line("voltage-knit-crew", "Voltage", "M", 1)],
    }),
    makeOrder({
      id: "ord_1006",
      orderNumber: "VL-10440",
      userId: null,
      customerEmail: "guest@studio.com",
      customerName: "Guest Atelier",
      shippingAddress: {
        ...address,
        id: "addr_guest",
        name: "Guest Atelier",
        line1: "1 Market Street",
        line2: "",
      },
      shippingMethod: "express",
      coupon: null,
      currency: "EUR",
      fxRate: 0.92,
      status: "Pending",
      returned: false,
      trackingCarrier: null,
      trackingNumber: null,
      createdAt: "2026-09-28T08:15:00.000Z",
      items: [line("helix-insulation-jacket", "Ink", "L", 1)],
    }),
  ];
}
