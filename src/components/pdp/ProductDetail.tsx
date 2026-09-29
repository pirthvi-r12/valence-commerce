"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, Ruler, X } from "lucide-react";
import Link from "next/link";
import { ProductImage } from "@/components/ProductImage";
import { useEffect, useRef, useState, type RefObject } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Stars } from "@/components/Stars";
import { useCommerce } from "@/context/CommerceProvider";
import { imageCandidates, imageFor } from "@/lib/catalog";
import { FIT_OPTIONS, SIZES, type FitAdvice, type Review, type Size } from "@/lib/types";

const CHART: { size: Size; chest: number; shoulder: number; length: number; sleeve: number }[] = [
  { size: "XS", chest: 96, shoulder: 41, length: 66, sleeve: 60 },
  { size: "S", chest: 102, shoulder: 43, length: 68, sleeve: 62 },
  { size: "M", chest: 108, shoulder: 45, length: 70, sleeve: 64 },
  { size: "L", chest: 114, shoulder: 47, length: 72, sleeve: 66 },
  { size: "XL", chest: 120, shoulder: 49, length: 74, sleeve: 68 },
];

export function ProductDetail({ slug }: { slug: string }) {
  const { catalog, ready, format, addToCart, toggleWishlist, isWishlisted, setPdpDock, reviewsFor, addReview, state } = useCommerce();
  const product = catalog.find((item) => item.slug === slug);
  const [color, setColor] = useState(product?.colors[0]?.name ?? "");
  const [size, setSize] = useState<Size>("M");
  const [index, setIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [guide, setGuide] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "verified" | number>("all");
  const buyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!product) return;
    setColor(product.colors[0]?.name ?? "");
    const preferred = product.variants.find((variant) => variant.size === "M" && variant.inventoryCount > 0);
    setSize(preferred?.size ?? "M");
    setIndex(0);
  }, [product]);

  useEffect(() => {
    const onScroll = () => {
      const top = buyRef.current?.getBoundingClientRect().top ?? 1;
      setPdpDock(top < 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      setPdpDock(false);
    };
  }, [setPdpDock, slug]);

  if (!ready) return <div className="shell py-20 font-mono text-xs uppercase tracking-[0.2em] text-white/40">Loading piece…</div>;
  if (!product || product.hidden) {
    return (
      <div className="shell py-24">
        <p className="eyebrow">Unavailable</p>
        <h1 className="mt-4 font-display text-5xl tracking-[-0.05em]">This piece is off the floor.</h1>
        <Link href="/shop" className="btn-lime mt-8">
          Back to shop
        </Link>
      </div>
    );
  }

  const gallery = product.images.filter((image) => image.color === color);
  const shots = gallery.length ? gallery : product.images;
  const shot = shots[Math.min(index, shots.length - 1)];
  const variant = product.variants.find((item) => item.color === color && item.size === size) ?? product.variants[0];
  const unit = product.priceCents + (variant?.priceOffsetCents ?? 0);
  const compare = product.compareAtCents ? product.compareAtCents + (variant?.priceOffsetCents ?? 0) : null;
  const stock = variant?.inventoryCount ?? 0;
  const reviews = reviewsFor(product.id);
  const related = product.completeTheLook
    .map((look) => catalog.find((item) => item.slug === look && !item.hidden))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <div className="shell py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        image: product.images.map((image) => image.url),
        description: product.description,
        sku: variant?.sku,
        brand: { "@type": "Brand", name: "VALENCE" },
        aggregateRating: product.reviewsCount ? { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewsCount } : undefined,
        offers: { "@type": "Offer", priceCurrency: "USD", price: (unit / 100).toFixed(2), availability: stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
      }) }} />
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
        <Link href="/shop" className="hover:text-lime">Shop</Link> / {product.category}
      </p>
      <div className="mt-6 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <ZoomFrame
            src={shot?.url ?? imageFor(product, color)}
            alt={shot?.alt || product.title}
            productId={product.id}
            candidates={imageCandidates(product, color)}
          />
          <div className="mt-3 flex gap-2 overflow-auto">
            {shots.map((image, imageIndex) => (
              <button key={image.url + imageIndex} type="button" onClick={() => setIndex(imageIndex)} className={`relative h-20 w-16 shrink-0 overflow-hidden border ${imageIndex === index ? "border-lime" : "border-white/10"}`}>
                <ProductImage src={image.url} candidates={imageCandidates(product, color)} productId={product.id} alt="" fill sizes="64px" />
              </button>
            ))}
          </div>
        </div>
        <div ref={buyRef}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">{product.dropLabel}</p>
              <h1 className="mt-3 font-display text-4xl tracking-[-0.045em] md:text-5xl">{product.title}</h1>
            </div>
            <motion.button
              type="button"
              aria-label="Wishlist"
              aria-pressed={isWishlisted(product.id)}
              whileTap={{ scale: 0.86 }}
              animate={isWishlisted(product.id) ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              onClick={() => toggleWishlist(product.id)}
              className="grid h-11 w-11 place-items-center border border-white/15"
            >
              <Heart className={isWishlisted(product.id) ? "fill-lime text-lime" : ""} size={16} />
            </motion.button>
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Stars value={average(reviews)} />
            <span className="font-mono text-xs text-white/50">{reviews.length} reviews</span>
          </div>
          <div className="mt-5 flex items-end gap-3 font-mono">
            {compare && compare > unit ? <span className="text-white/35 line-through">{format(compare)}</span> : null}
            <span className="text-2xl">{format(unit)}</span>
          </div>
          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/45">SKU {variant?.sku}</p>
          <p className="mt-5 max-w-xl text-white/70">{product.description}</p>
          {stock > 0 && stock <= 5 ? (
            <p className="mt-4 inline-flex bg-lime px-2 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-obsidian">
              Only {stock} pieces left in Size {size}
            </p>
          ) : null}
          <div className="mt-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Color · {color}</p>
            <div className="mt-3 flex gap-2">
              {product.colors.map((swatch) => (
                <button
                  key={swatch.name}
                  type="button"
                  aria-label={swatch.name}
                  aria-pressed={swatch.name === color}
                  title={swatch.name}
                  onClick={() => {
                    setColor(swatch.name);
                    setIndex(0);
                  }}
                  className={`h-9 w-9 border ${swatch.name === color ? "border-lime" : "border-white/20"}`}
                  style={{ background: swatch.hex }}
                />
              ))}
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Size</p>
              <button type="button" className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.16em] text-lime" onClick={() => setGuide(true)}>
                <Ruler size={12} /> Size guide
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SIZES.map((option) => {
                const match = product.variants.find((item) => item.color === color && item.size === option);
                const gone = !match || match.inventoryCount <= 0;
                return (
                  <button key={option} type="button" disabled={gone} onClick={() => setSize(option)} className={`h-11 w-12 border font-mono text-xs ${size === option ? "border-lime bg-lime text-obsidian" : "border-white/15"} ${gone ? "text-white/25 line-through" : ""}`}>
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex border border-white/15">
              <button type="button" className="h-12 w-10" onClick={() => setQty((value) => Math.max(1, value - 1))}>-</button>
              <span className="grid w-8 place-items-center font-mono text-sm">{qty}</span>
              <button type="button" className="h-12 w-10" onClick={() => setQty((value) => Math.min(stock || 1, value + 1))}>+</button>
            </div>
            <button type="button" disabled={stock <= 0} className="btn-lime flex-1 disabled:opacity-40" onClick={() => variant && addToCart(product.id, variant.id, qty)}>
              {stock <= 0 ? "Sold out" : "Add to bag"}
            </button>
          </div>
          <dl className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
            {product.specs.map((spec) => (
              <div key={spec.label}>
                <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">{spec.label}</dt>
                <dd className="mt-1 text-sm">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <section className="mt-16 grid gap-10 border-t border-white/10 pt-12 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Cut notes</p>
          <p className="mt-4 text-lg leading-relaxed text-white/75">{product.story}</p>
          <ul className="mt-6 space-y-2 text-sm text-white/60">
            {product.materials.map((material) => (
              <li key={material}>· {material}</li>
            ))}
          </ul>
        </div>
        <Reviews
          reviews={reviews}
          filter={filter}
          setFilter={setFilter}
          onWrite={() => setReviewOpen(true)}
        />
      </section>

      {related.length > 0 ? (
        <section className="mt-16">
          <p className="eyebrow">Complete the look</p>
          <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      ) : null}

      <SizeGuide open={guide} size={size} onClose={() => setGuide(false)} onPick={setSize} />
      <ReviewModal
        open={reviewOpen}
        defaultName={state.user?.name ?? ""}
        onClose={() => setReviewOpen(false)}
        onSubmit={(input) => {
          addReview({ productId: product.id, ...input });
          setReviewOpen(false);
        }}
      />
      <StickyBar title={product.title} image={shot?.url ?? imageFor(product)} price={format(unit)} disabled={stock <= 0} anchor={buyRef} onAdd={() => variant && addToCart(product.id, variant.id, qty)} />
    </div>
  );
}

function average(reviews: Review[]) {
  if (!reviews.length) return 0;
  return Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10;
}

function ZoomFrame({ src, alt, productId, candidates }: { src: string; alt: string; productId: string; candidates: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [lens, setLens] = useState({ x: 0, y: 0, w: 1, h: 1, on: false });
  return (
    <div
      ref={ref}
      onMouseMove={(event) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        setLens({ x: event.clientX - rect.left, y: event.clientY - rect.top, w: rect.width, h: rect.height, on: true });
      }}
      onMouseLeave={() => setLens((current) => ({ ...current, on: false }))}
      className="relative aspect-[4/5] cursor-crosshair overflow-hidden bg-[#12141a]"
    >
      {src ? (
        <ProductImage src={src} alt={alt} productId={productId} candidates={candidates} fill priority sizes="(max-width: 1024px) 100vw, 60vw" />
      ) : null}
      {lens.on ? (
        <div
          className="pointer-events-none absolute hidden h-44 w-44 border border-white/50 shadow-lift md:block"
          style={{
            left: lens.x - 88,
            top: lens.y - 88,
            backgroundImage: `url(${src})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: `${lens.w * 2.4}px ${lens.h * 2.4}px`,
            backgroundPosition: `${-lens.x * 2.4 + 88}px ${-lens.y * 2.4 + 88}px`,
          }}
        />
      ) : null}
    </div>
  );
}

function Reviews({
  reviews,
  filter,
  setFilter,
  onWrite,
}: {
  reviews: Review[];
  filter: "all" | "verified" | number;
  setFilter: (value: "all" | "verified" | number) => void;
  onWrite: () => void;
}) {
  const visible = reviews.filter((review) => {
    if (filter === "verified") return review.verifiedPurchase;
    if (typeof filter === "number") return review.rating === filter;
    return true;
  });
  const total = reviews.length || 1;
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="eyebrow">Verified buyers</p>
        <button type="button" className="btn-ghost px-4 py-2" onClick={onWrite}>
          Write a review
        </button>
      </div>
      <div className="mt-5 space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = reviews.filter((review) => review.rating === star).length;
          const pct = (count / total) * 100;
          return (
            <button key={star} type="button" onClick={() => setFilter(filter === star ? "all" : star)} className="flex w-full items-center gap-3 text-left">
              <span className="w-8 font-mono text-xs">{star}★</span>
              <span className="h-1 flex-1 bg-white/10">
                <motion.span className="block h-full bg-lime" initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} />
              </span>
              <span className="w-8 font-mono text-[10px] text-white/40">{count}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className={filter === "all" ? "text-lime" : "text-white/50"} onClick={() => setFilter("all")}>All</button>
        <button type="button" className={filter === "verified" ? "text-lime" : "text-white/50"} onClick={() => setFilter("verified")}>Verified purchase</button>
      </div>
      <div className="mt-6 space-y-5">
        {visible.length === 0 ? <p className="text-sm text-white/50">No reviews in this cut yet.</p> : null}
        {visible.map((review) => (
          <article key={review.id} className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between gap-3">
              <Stars value={review.rating} />
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/40">{review.createdAt.slice(0, 10)}</span>
            </div>
            <p className="mt-2 text-sm">{review.comment}</p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/45">
              {review.userName} · {review.fit}
              {review.verifiedPurchase ? " · Verified purchase" : ""}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function SizeGuide({ open, size, onClose, onPick }: { open: boolean; size: Size; onClose: () => void; onPick: (size: Size) => void }) {
  const row = CHART.find((item) => item.size === size) ?? CHART[2];
  const max = { chest: 120, shoulder: 49, length: 74, sleeve: 68 };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[75] grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-lg border border-white/10 bg-ink p-6" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="Size guide">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl tracking-[-0.04em]">Size guide</h2>
          <button type="button" aria-label="Close" onClick={onClose}><X /></button>
        </div>
        <div className="mt-4 flex gap-2">
          {CHART.map((item) => (
            <button key={item.size} type="button" onClick={() => onPick(item.size)} className={`h-10 w-12 border font-mono text-xs ${item.size === size ? "border-lime bg-lime text-obsidian" : "border-white/15"}`}>
              {item.size}
            </button>
          ))}
        </div>
        <div className="mt-6 space-y-4">
          {(Object.keys(max) as (keyof typeof max)[]).map((key) => (
            <div key={key}>
              <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-white/50">
                <span>{key}</span>
                <span>{row[key]} cm</span>
              </div>
              <div className="h-2 bg-white/10">
                <motion.div className="h-full bg-lime" animate={{ width: `${(row[key] / max[key]) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewModal({
  open,
  defaultName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  defaultName: string;
  onClose: () => void;
  onSubmit: (input: { rating: number; comment: string; fit: FitAdvice; name: string }) => void;
}) {
  const [name, setName] = useState(defaultName);
  const [rating, setRating] = useState(5);
  const [fit, setFit] = useState<FitAdvice>("Runs true to size");
  const [comment, setComment] = useState("");
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[75] grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <form
        className="w-full max-w-lg border border-white/10 bg-ink p-6"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (!comment.trim()) return;
          onSubmit({ rating, comment, fit, name });
        }}
      >
        <div className="flex items-center justify-between">
          <h2 className="font-display text-3xl">Write a review</h2>
          <button type="button" aria-label="Close" onClick={onClose}><X /></button>
        </div>
        <label className="mt-4 block text-sm">Name<input className="field mt-2" value={name} onChange={(event) => setName(event.target.value)} required /></label>
        <div className="mt-4 flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} type="button" onClick={() => setRating(star)} className={`h-10 w-10 border font-mono ${rating === star ? "border-lime text-lime" : "border-white/15"}`}>{star}</button>
          ))}
        </div>
        <label className="mt-4 block text-sm">Fit
          <select className="field mt-2" value={fit} onChange={(event) => setFit(event.target.value as FitAdvice)}>
            {FIT_OPTIONS.map((option) => <option key={option} className="bg-ink">{option}</option>)}
          </select>
        </label>
        <label className="mt-4 block text-sm">Notes<textarea className="field mt-2 min-h-28" value={comment} onChange={(event) => setComment(event.target.value)} required /></label>
        <button type="submit" className="btn-lime mt-5 w-full">Submit review</button>
      </form>
    </div>
  );
}

function StickyBar({ title, image, price, disabled, anchor, onAdd }: { title: string; image: string; price: string; disabled: boolean; anchor: RefObject<HTMLDivElement>; onAdd: () => void }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const top = anchor.current?.getBoundingClientRect().top ?? 0;
      setShow(top < -40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [anchor]);
  return (
    <AnimatePresence>
      {show ? (
        <motion.div initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }} className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#07080B]/92 backdrop-blur-xl">
          <div className="shell flex items-center gap-4 py-3 pr-20">
            <span className="relative hidden h-12 w-10 overflow-hidden bg-[#12141a] sm:block">
              {image ? <ProductImage src={image} alt="" fill sizes="40px" className="object-cover" /> : null}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-lg">{title}</p>
              <p className="font-mono text-sm text-lime">{price}</p>
            </div>
            <button type="button" disabled={disabled} className="btn-lime disabled:opacity-40" onClick={onAdd}>
              Add to bag
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
