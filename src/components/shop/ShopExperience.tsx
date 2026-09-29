"use client";

import { SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ProductCard } from "@/components/ProductCard";
import { useCommerce } from "@/context/CommerceProvider";
import { searchProducts } from "@/lib/search";
import { CATEGORIES, SIZES, type Category, type Size } from "@/lib/types";

const SORTS = [
  { id: "featured", label: "Featured" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "newest", label: "Newest Drop" },
] as const;

export function ShopExperience() {
  const params = useSearchParams();
  const router = useRouter();
  const { catalog } = useCommerce();
  const [mobileFilters, setMobileFilters] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mobileFilters) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileFilters]);

  const category = params.get("category") ?? "All";
  const sort = params.get("sort") ?? "featured";
  const query = params.get("q") ?? "";
  const sizes = (params.get("size") ?? "").split(",").filter(Boolean) as Size[];
  const colors = (params.get("color") ?? "").split(",").filter(Boolean);
  const minParam = params.get("min");
  const maxParam = params.get("max");
  const minRaw = minParam === null ? Number.NaN : Number(minParam);
  const maxRaw = maxParam === null ? Number.NaN : Number(maxParam);
  const min = Number.isFinite(minRaw) ? Math.min(Math.max(minRaw, 0), 1990) : 0;
  const max = Number.isFinite(maxRaw) ? Math.min(Math.max(maxRaw, min + 10), 2000) : 2000;
  const inStock = params.get("stock") === "1";

  const colorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const product of catalog) {
      for (const color of product.colors) map.set(color.name, color.hex);
    }
    return Array.from(map.entries());
  }, [catalog]);

  function shopHref(next: Record<string, string | null>) {
    const search = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(next)) {
      if (!value) search.delete(key);
      else search.set(key, value);
    }
    const qs = search.toString();
    return qs ? `/shop?${qs}` : "/shop";
  }

  function write(next: Record<string, string | null>) {
    router.replace(shopHref(next), { scroll: false });
  }

  function toggleList(key: "size" | "color", value: string, current: string[]) {
    const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
    write({ [key]: next.length ? next.join(",") : null });
  }

  const products = useMemo(() => {
    let list = catalog.filter((product) => !product.hidden);
    if (query) {
      const matched = new Set(searchProducts(query, list).map((product) => product.id));
      list = list.filter((product) => matched.has(product.id));
    }
    if (category !== "All") list = list.filter((product) => product.category === category);
    list = list.filter((product) => {
      const price = product.priceCents / 100;
      if (price < min || price > max) return false;
      const variantOk = product.variants.some((variant) => {
        const sizeOk = sizes.length === 0 || sizes.includes(variant.size);
        const colorOk = colors.length === 0 || colors.includes(variant.color);
        const stockOk = !inStock || variant.inventoryCount > 0;
        return sizeOk && colorOk && stockOk;
      });
      const colorExists = colors.length === 0 || product.colors.some((color) => colors.includes(color.name));
      return variantOk && colorExists;
    });
    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.priceCents - b.priceCents);
    else if (sort === "price-desc") sorted.sort((a, b) => b.priceCents - a.priceCents);
    else if (sort === "newest") sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    else sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating);
    return sorted;
  }, [catalog, category, colors, inStock, max, min, query, sizes, sort]);

  const filters = (
    <div className="space-y-8">
      <FilterBlock title="Category">
        <div className="flex flex-wrap gap-2">
          {["All", ...CATEGORIES].map((item) => (
            <Link
              key={item}
              href={shopHref({ category: item === "All" ? null : item })}
              scroll={false}
              replace
              aria-current={category === item ? "true" : undefined}
              className={chip(category === item)}
            >
              {item}
            </Link>
          ))}
        </div>
      </FilterBlock>
      <FilterBlock title="Price">
        <div className="relative h-8">
          <div className="absolute left-0 right-0 top-[14px] h-px bg-white/20" />
          <input className="dual" type="range" min={0} max={2000} step={10} value={min} aria-label="Minimum price" onChange={(event) => write({ min: String(Math.min(Number(event.target.value), max - 10)) })} />
          <input className="dual" type="range" min={0} max={2000} step={10} value={max} aria-label="Maximum price" onChange={(event) => write({ max: String(Math.max(Number(event.target.value), min + 10)) })} />
        </div>
        <p className="mt-2 font-mono text-xs text-white/60">${min} — ${max}</p>
      </FilterBlock>
      <FilterBlock title="Size">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button key={size} type="button" aria-pressed={sizes.includes(size)} className={chip(sizes.includes(size))} onClick={() => toggleList("size", size, sizes)}>
              {size}
            </button>
          ))}
        </div>
      </FilterBlock>
      <FilterBlock title="Color">
        <div className="flex flex-wrap gap-2">
          {colorOptions.map(([name, hex]) => (
            <button key={name} type="button" aria-label={name} aria-pressed={colors.includes(name)} title={name} onClick={() => toggleList("color", name, colors)} className={`h-8 w-8 border ${colors.includes(name) ? "border-lime" : "border-white/20"}`} style={{ background: hex }} />
          ))}
        </div>
      </FilterBlock>
      <label className="flex items-center justify-between gap-3 text-sm">
        <span>In stock only</span>
        <input type="checkbox" checked={inStock} onChange={(event) => write({ stock: event.target.checked ? "1" : null })} className="h-4 w-4 accent-lime" />
      </label>
      <button type="button" className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/50" onClick={() => router.replace("/shop")}>
        Clear filters
      </button>
    </div>
  );

  return (
    <div className="shell py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1 className="mt-3 font-display text-5xl tracking-[-0.05em] md:text-6xl">The collection</h1>
        </div>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-white/50">{String(products.length).padStart(2, "0")} pieces</p>
      </div>
      <div className="mb-4 flex flex-wrap gap-2 md:hidden">
        {["All", ...CATEGORIES].map((item) => (
          <Link
            key={`mobile-${item}`}
            href={shopHref({ category: item === "All" ? null : item })}
            scroll={false}
            replace
            className={chip(category === item)}
          >
            {item}
          </Link>
        ))}
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="shop-search">Search</label>
        <input
          id="shop-search"
          value={query}
          onChange={(event) => write({ q: event.target.value || null })}
          placeholder="Live search"
          className="field max-w-sm"
        />
        <label className="sr-only" htmlFor="sort">Sort</label>
        <select id="sort" value={sort} onChange={(event) => write({ sort: event.target.value === "featured" ? null : event.target.value })} className="field max-w-[240px]">
          {SORTS.map((item) => (
            <option key={item.id} value={item.id} className="bg-ink">
              {item.label}
            </option>
          ))}
        </select>
        <button type="button" className="btn-ghost md:hidden" onClick={() => setMobileFilters(true)}>
          <SlidersHorizontal size={14} /> Filters
        </button>
      </div>
      <div className="grid gap-10 md:grid-cols-[240px_1fr]">
        <aside className="hidden md:block">{filters}</aside>
        {products.length === 0 ? (
          <div className="border border-white/10 p-10">
            <h2 className="font-display text-3xl">No pieces match this cut.</h2>
            <button type="button" className="btn-lime mt-6" onClick={() => router.replace("/shop")}>
              Reset
            </button>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
      {mounted && mobileFilters
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex flex-col bg-obsidian md:hidden" role="dialog" aria-modal="true" aria-label="Filters">
              <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-5 py-4">
                <p className="font-display text-3xl">Filters</p>
                <button type="button" aria-label="Close filters" className="grid h-10 w-10 place-items-center border border-white/10" onClick={() => setMobileFilters(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="scrollbar-none flex-1 overflow-y-auto overscroll-contain px-5 py-6">{filters}</div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function chip(active: boolean) {
  return `border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] ${active ? "border-lime bg-lime text-obsidian" : "border-white/15 text-white/70"}`;
}

function FilterBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{title}</p>
      {children}
    </div>
  );
}

export type ShopCategory = Category;
