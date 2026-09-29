import type { ProductImage } from "./types";

/** Distinct fashion/editorial stills — verified HTTP 200 on images.unsplash.com. */
const PLACEHOLDER_POOL = [
  "photo-1594938298603-c8148c4dae35",
  "photo-1576871337632-b9aef4c17ab9",
  "photo-1551028719-00167b16eac5",
  "photo-1521369909029-2afed882baee",
  "photo-1544022613-e87ca75a784a",
  "photo-1556821840-3a63f95609a7",
  "photo-1590874103328-eac38a683ce7",
  "photo-1521572163474-6864f9cf17ab",
  "photo-1542272604-787c3835535d",
  "photo-1553062407-98eeb64c6a62",
  "photo-1542291026-7eec264c27ff",
  "photo-1520639888713-7851133b1ed0",
] as const;

export function placeholderForProduct(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const id = PLACEHOLDER_POOL[hash % PLACEHOLDER_POOL.length];
  return mediaUrl({ type: "unsplash", id });
}

export type MediaRef =
  | { type: "unsplash"; id: string }
  | { type: "pexels"; id: number };

export function mediaUrl(ref: MediaRef): string {
  if (ref.type === "pexels") {
    return `https://images.pexels.com/photos/${ref.id}/pexels-photo-${ref.id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;
  }
  const id = ref.id.startsWith("photo-") ? ref.id : `photo-${ref.id}`;
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;
}

export function mediaShot(ref: MediaRef, color: string, alt: string): ProductImage {
  return { url: mediaUrl(ref), color, alt };
}
