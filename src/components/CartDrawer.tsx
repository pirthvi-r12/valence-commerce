"use client";

import { Minus, Plus, Undo2, X } from "lucide-react";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { imageCandidates, imageFor } from "@/lib/catalog";
import { FREE_SHIPPING_CENTS } from "@/lib/pricing";
import { useCommerce } from "@/context/CommerceProvider";

export function CartDrawer() {
  const {
    cartOpen,
    setCartOpen,
    detailedCart,
    format,
    subtotalCents,
    coupon,
    shippingGapCents,
    setQty,
    removeLine,
    undoRemove,
    state,
    applyCoupon,
    clearCoupon,
    addToCart,
    catalog,
    priceCart,
  } = useCommerce();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const priced = priceCart("express");
  const progress = Math.min(100, ((FREE_SHIPPING_CENTS - shippingGapCents) / FREE_SHIPPING_CENTS) * 100);

  const crossSell = useMemo(() => {
    const owned = new Set(detailedCart.map((line) => line.productId));
    const slugs = new Set<string>();
    for (const line of detailedCart) line.product.completeTheLook.forEach((slug) => slugs.add(slug));
    const picks = catalog.filter((product) => slugs.has(product.slug) && !owned.has(product.id) && !product.hidden);
    for (const product of catalog) {
      if (picks.length >= 3) break;
      if (!owned.has(product.id) && !product.hidden && !picks.includes(product)) picks.push(product);
    }
    return picks.slice(0, 3);
  }, [catalog, detailedCart]);

  return (
    <AnimatePresence>
      {cartOpen ? (
        <>
          <motion.button
            type="button"
            aria-label="Close bag"
            className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCartOpen(false)}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Bag"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0B0D12]/95 shadow-lift backdrop-blur-xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <p className="eyebrow">Bag</p>
                <h2 className="font-display text-2xl tracking-[-0.04em]">{detailedCart.length ? "Ready to dispatch" : "Empty"}</h2>
              </div>
              <button type="button" aria-label="Close" onClick={() => setCartOpen(false)}>
                <X />
              </button>
            </div>
            <div className="border-b border-white/10 px-5 py-4">
              <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em]">
                <span>{shippingGapCents > 0 ? `${format(shippingGapCents)} away from Free Express Delivery` : "Free Express Delivery unlocked"}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1 bg-white/10">
                <div className="h-full bg-lime" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <div className="flex-1 space-y-5 overflow-auto px-5 py-5">
              {detailedCart.length === 0 ? (
                <div className="py-10">
                  <p className="text-white/60">The bag is clear. The drop is not.</p>
                  <Link href="/shop" className="btn-lime mt-6" onClick={() => setCartOpen(false)}>
                    Explore collection
                  </Link>
                </div>
              ) : (
                detailedCart.map((line) => (
                  <div key={line.variantId} className="flex gap-3">
                    <Link href={`/product/${line.product.slug}`} className="relative h-28 w-20 shrink-0 overflow-hidden bg-[#12141a]" onClick={() => setCartOpen(false)}>
                      <ProductImage src={line.image} productId={line.productId} alt="" fill sizes="80px" />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-lg leading-tight">{line.title}</p>
                          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
                            {line.color} / {line.size} · {line.sku}
                          </p>
                        </div>
                        <p className="font-mono text-sm">{format(line.unit * line.qty)}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center border border-white/15">
                          <button type="button" aria-label="Decrease quantity" className="grid h-8 w-8 place-items-center" onClick={() => setQty(line.variantId, line.qty - 1)}>
                            <Minus size={12} />
                          </button>
                          <span className="w-6 text-center font-mono text-xs">{line.qty}</span>
                          <button type="button" aria-label="Increase quantity" className="grid h-8 w-8 place-items-center" onClick={() => setQty(line.variantId, line.qty + 1)}>
                            <Plus size={12} />
                          </button>
                        </div>
                        <button type="button" className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50 hover:text-lime" onClick={() => removeLine(line.variantId)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {state.removed ? (
                <button type="button" onClick={undoRemove} className="flex w-full items-center justify-between border border-lime/40 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-lime">
                  <span>Removed {state.removed.title}</span>
                  <span className="inline-flex items-center gap-1">
                    <Undo2 size={12} /> Undo
                  </span>
                </button>
              ) : null}
              {crossSell.length > 0 && detailedCart.length > 0 ? (
                <div>
                  <p className="eyebrow">Complete the look</p>
                  <div className="mt-3 space-y-3">
                    {crossSell.map((product) => {
                      const variant = product.variants.find((item) => item.inventoryCount > 0) ?? product.variants[0];
                      return (
                        <div key={product.id} className="flex items-center gap-3">
                          <span className="relative h-16 w-12 overflow-hidden bg-[#12141a]">
                            <ProductImage
                              src={imageFor(product)}
                              candidates={imageCandidates(product)}
                              productId={product.id}
                              alt=""
                              fill
                              sizes="48px"
                            />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm">{product.title}</p>
                            <p className="font-mono text-xs text-white/50">{format(product.priceCents)}</p>
                          </div>
                          {variant ? (
                            <button type="button" className="btn-ghost px-3 py-2" onClick={() => addToCart(product.id, variant.id, 1)}>
                              Add
                            </button>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="border-t border-white/10 px-5 py-4">
              <form
                className="mb-4 flex gap-2"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const message = await applyCoupon(code);
                  setError(message);
                  if (!message) setCode("");
                }}
              >
                <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Promo code" className="field" />
                <button type="submit" className="btn-ghost">Apply</button>
              </form>
              {error ? <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-red-300">{error}</p> : null}
              {coupon ? (
                <button type="button" className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-lime" onClick={clearCoupon}>
                  {coupon.code} · {coupon.discountPercent}% off · remove
                </button>
              ) : null}
              <div className="mb-4 flex items-center justify-between font-mono text-sm">
                <span className="text-white/50">Subtotal</span>
                <span>{format(subtotalCents)}</span>
              </div>
              {priced.discountCents > 0 ? (
                <div className="mb-4 flex items-center justify-between font-mono text-sm text-lime">
                  <span>Discount</span>
                  <span>-{format(priced.discountCents)}</span>
                </div>
              ) : null}
              <Link href="/checkout" className={`btn-lime w-full ${detailedCart.length === 0 ? "pointer-events-none opacity-40" : ""}`} onClick={() => setCartOpen(false)}>
                Checkout
              </Link>
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
