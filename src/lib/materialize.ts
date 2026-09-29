import { PRODUCTS } from "./catalog";
import type { Product, ProductOverride } from "./types";

export function applyOverride(product: Product, override?: ProductOverride): Product {
  if (!override) return product;
  return {
    ...product,
    title: override.title ?? product.title,
    priceCents: override.priceCents ?? product.priceCents,
    compareAtCents: override.compareAtCents === undefined ? product.compareAtCents : override.compareAtCents,
    hidden: override.hidden ?? product.hidden,
    variants: product.variants.map((variant) => ({
      ...variant,
      inventoryCount: override.inventory?.[variant.id] ?? variant.inventoryCount,
    })),
  };
}

export function materialize(overrides: Record<string, ProductOverride>, custom: Product[]) {
  return [...PRODUCTS.map((product) => applyOverride(product, overrides[product.id])), ...custom];
}

export function findProduct(catalog: Product[], productId: string) {
  return catalog.find((product) => product.id === productId) ?? null;
}
