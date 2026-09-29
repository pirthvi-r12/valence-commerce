"use client";

import { Heart } from "lucide-react";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { motion } from "framer-motion";
import { imageCandidates, imageFor } from "@/lib/catalog";
import { useCommerce } from "@/context/CommerceProvider";
import type { Product } from "@/lib/types";

function preferredVariant(product: Product) {
  return (
    product.variants.find((variant) => variant.size === "M" && variant.inventoryCount > 0) ??
    product.variants.find((variant) => variant.inventoryCount > 0) ??
    product.variants[0]
  );
}

export function ProductCard({ product }: { product: Product }) {
  const { format, toggleWishlist, isWishlisted, addToCart } = useCommerce();
  const variant = preferredVariant(product);
  const wished = isWishlisted(product.id);
  const low = variant && variant.inventoryCount > 0 && variant.inventoryCount <= 5;

  return (
    <article className="group">
      <div className="relative aspect-[4/5] overflow-hidden bg-[#12141a]">
        <Link href={`/product/${product.slug}`} className="absolute inset-0">
          <ProductImage
            src={imageFor(product, variant?.color)}
            candidates={imageCandidates(product, variant?.color)}
            productId={product.id}
            alt={product.images[0]?.alt || product.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="transition duration-700 group-hover:scale-[1.04]"
          />
        </Link>
        <div className="pointer-events-none absolute left-3 top-3 flex gap-2">
          <span className="border border-white/15 bg-obsidian/70 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] backdrop-blur">
            {product.dropLabel}
          </span>
          {low ? (
            <span className="bg-lime px-2 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-obsidian">Low stock</span>
          ) : null}
        </div>
        <motion.button
          type="button"
          aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
          aria-pressed={wished}
          onClick={() => toggleWishlist(product.id)}
          whileTap={{ scale: 0.86 }}
          animate={wished ? { scale: [1, 1.22, 1] } : { scale: 1 }}
          className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center border border-white/15 bg-obsidian/70 backdrop-blur"
        >
          <Heart size={16} className={wished ? "fill-lime text-lime" : "text-bone"} />
        </motion.button>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">{product.category}</p>
          <Link href={`/product/${product.slug}`} className="mt-1 block font-display text-xl tracking-[-0.03em] hover:text-lime">
            {product.title}
          </Link>
        </div>
        <div className="text-right font-mono text-sm">
          {product.compareAtCents && product.compareAtCents > product.priceCents ? (
            <div className="text-white/35 line-through">{format(product.compareAtCents)}</div>
          ) : null}
          <div>{format(product.priceCents + (variant?.priceOffsetCents ?? 0))}</div>
        </div>
      </div>
      {variant ? (
        <button type="button" className="btn-ghost mt-4 w-full" onClick={() => addToCart(product.id, variant.id, 1)}>
          Add {variant.color} / {variant.size}
        </button>
      ) : null}
    </article>
  );
}
