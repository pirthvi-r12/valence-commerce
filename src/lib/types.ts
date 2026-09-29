export type Role = "customer" | "admin";
export type Category =
  | "Outerwear"
  | "Layering"
  | "Tops"
  | "Knits"
  | "Bottoms"
  | "Footwear"
  | "Objects"
  | "Accessories"
  | "Headwear";
export type Size = "XS" | "S" | "M" | "L" | "XL";
export type FitAdvice = "Runs small" | "Runs true to size" | "Runs large";
export type OrderStatus = "Pending" | "Processing" | "Shipped" | "Delivered";
export type ShippingMethod = "standard" | "express";
export type CurrencyCode = "USD" | "EUR" | "GBP" | "CAD" | "JPY";

export const CATEGORIES: Category[] = [
  "Outerwear",
  "Layering",
  "Tops",
  "Knits",
  "Bottoms",
  "Footwear",
  "Objects",
  "Accessories",
  "Headwear",
];
export const SIZES: Size[] = ["XS", "S", "M", "L", "XL"];
export const FIT_OPTIONS: FitAdvice[] = ["Runs small", "Runs true to size", "Runs large"];

export interface ProductImage {
  url: string;
  color: string;
  alt: string;
}

export interface Variant {
  id: string;
  sku: string;
  size: Size;
  color: string;
  inventoryCount: number;
  priceOffsetCents: number;
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  fit: FitAdvice;
  createdAt: string;
}

export interface Spec {
  label: string;
  value: string;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  story: string;
  category: Category;
  priceCents: number;
  compareAtCents: number | null;
  featured: boolean;
  hidden: boolean;
  rating: number;
  reviewsCount: number;
  materials: string[];
  specs: Spec[];
  colors: ProductColor[];
  images: ProductImage[];
  variants: Variant[];
  reviews: Review[];
  tags: string[];
  completeTheLook: string[];
  dropLabel: string;
  createdAt: string;
}

export interface Address {
  id: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postal: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  exp: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AccountRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
}

export interface OrderItem {
  productId: string;
  variantId: string;
  title: string;
  sku: string;
  size: string;
  color: string;
  priceCents: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  customerEmail: string;
  customerName: string;
  shippingAddress: Address;
  shippingMethod: ShippingMethod;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  coupon: string | null;
  currency: CurrencyCode;
  fxRate: number;
  status: OrderStatus;
  returned: boolean;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  createdAt: string;
  items: OrderItem[];
}

export interface ProductOverride {
  title?: string;
  priceCents?: number;
  compareAtCents?: number | null;
  hidden?: boolean;
  inventory?: Record<string, number>;
}

export interface CartLine {
  productId: string;
  variantId: string;
  qty: number;
}
