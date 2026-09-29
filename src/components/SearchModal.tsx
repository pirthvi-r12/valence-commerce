"use client";

import { Search, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { imageCandidates, imageFor } from "@/lib/catalog";
import { searchProducts } from "@/lib/search";
import { useCommerce } from "@/context/CommerceProvider";

export function SearchModal() {
  const { searchOpen, setSearchOpen, catalog, format } = useCommerce();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchProducts(query, catalog).slice(0, 6), [query, catalog]);

  useEffect(() => {
    if (!searchOpen) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [searchOpen, setSearchOpen]);

  if (!searchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md" onClick={() => setSearchOpen(false)}>
      <div className="shell pt-[12vh]" onClick={(event) => event.stopPropagation()}>
        <div className="border border-white/10 bg-ink shadow-lift" role="dialog" aria-modal="true" aria-label="Search the atelier">
          <div className="flex items-center gap-3 border-b border-white/10 px-4">
            <Search size={16} className="text-lime" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search shells, knits, sizes, materials"
              className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-white/30"
            />
            <button type="button" aria-label="Close search" onClick={() => setSearchOpen(false)}>
              <X size={16} />
            </button>
          </div>
          <ul className="max-h-[60vh] overflow-auto">
            {results.length === 0 ? (
              <li className="px-5 py-8 text-sm text-white/50">No pieces match that search.</li>
            ) : (
              results.map((product) => (
                <li key={product.id} className="border-b border-white/5 last:border-0">
                  <Link href={`/product/${product.slug}`} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03]" onClick={() => setSearchOpen(false)}>
                    <span className="relative h-16 w-14 shrink-0 overflow-hidden bg-[#12141a]">
                      <ProductImage
                        src={imageFor(product)}
                        candidates={imageCandidates(product)}
                        productId={product.id}
                        alt=""
                        fill
                        sizes="56px"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">{product.category}</span>
                      <span className="block truncate font-display text-lg">{product.title}</span>
                    </span>
                    <span className="font-mono text-sm">{format(product.priceCents)}</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
          <div className="flex items-center justify-between px-4 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/35">
            <span>Fuzzy match · thumbnails · live</span>
            <Link href={query ? `/shop?q=${encodeURIComponent(query)}` : "/shop"} onClick={() => setSearchOpen(false)} className="text-lime">
              View catalog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
