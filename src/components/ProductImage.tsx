"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";

import { placeholderForProduct } from "@/lib/product-media";

type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
  candidates?: string[];
  productId?: string;
  style?: CSSProperties;
};

/** Catalog photos with gallery + per-product fallback (never leave a broken icon). */
export function ProductImage({
  src,
  alt,
  className = "",
  fill,
  priority,
  candidates = [],
  productId,
  style,
}: ProductImageProps) {
  const fallback = useMemo(() => placeholderForProduct(productId ?? alt), [productId, alt]);

  const list = useMemo(() => {
    const merged = [src, ...candidates, fallback].map((url) => url?.trim()).filter(Boolean) as string[];
    return [...new Set(merged)];
  }, [src, candidates, fallback]);

  const [index, setIndex] = useState(0);
  const [exhausted, setExhausted] = useState(false);

  useEffect(() => {
    setIndex(0);
    setExhausted(false);
  }, [list.join("|")]);

  const layout = fill ? `absolute inset-0 h-full w-full object-cover ${className}` : className;

  if (exhausted) {
    return (
      <div
        className={`${layout} bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900`}
        style={style}
        aria-label={alt}
        role="img"
      />
    );
  }

  const resolved = list[Math.min(index, list.length - 1)] ?? fallback;

  if (!resolved) {
    return <div className={layout} style={style} aria-label={alt} role="img" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt={alt}
      className={layout}
      style={style}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (index + 1 < list.length) {
          setIndex((value) => value + 1);
        } else {
          setExhausted(true);
        }
      }}
    />
  );
}
