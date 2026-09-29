import "server-only";
import type { Order, ProductOverride, Review } from "./types";

const memory: {
  orders: Order[];
  reviews: Review[];
  overrides: Record<string, ProductOverride>;
} = {
  orders: [],
  reviews: [],
  overrides: {},
};

export function getMemory() {
  return memory;
}
