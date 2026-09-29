"use client";

import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { useCommerce } from "@/context/CommerceProvider";
import { encodeShare } from "@/lib/share";

export function WishlistView({ sharedIds }: { sharedIds?: string[] }) {
  const { catalog, state } = useCommerce();
  const [copied, setCopied] = useState(false);
  const ids = sharedIds ?? state.wishlist;
  const products = ids
    .map((id) => catalog.find((product) => product.id === id))
    .filter((product): product is NonNullable<typeof product> => Boolean(product && !product.hidden));

  async function share() {
    const code = encodeShare(state.wishlist);
    const url = `${window.location.origin}/wishlist/${code}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }

  return (
    <div className="shell py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{sharedIds ? "Shared wardrobe" : "Wishlist"}</p>
          <h1 className="mt-3 font-display text-5xl tracking-[-0.05em]">{sharedIds ? "A public edit" : "Saved pieces"}</h1>
        </div>
        {!sharedIds ? (
          <button type="button" className="btn-lime" onClick={() => void share()} disabled={state.wishlist.length === 0}>
            {copied ? "Link copied" : "Share wishlist"}
          </button>
        ) : null}
      </div>
      {state.user && !sharedIds ? <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-white/40">Synced to {state.user.email} on this device.</p> : null}
      {products.length === 0 ? (
        <p className="mt-10 text-white/60">Nothing saved yet. Hearts on the floor will land here.</p>
      ) : (
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
