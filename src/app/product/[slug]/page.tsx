import type { Metadata } from "next";
import { ProductDetail } from "@/components/pdp/ProductDetail";
import { PRODUCTS, getProduct } from "@/lib/catalog";

export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const product = getProduct(params.slug);
  if (!product) return { title: "Piece" };
  return {
    title: product.title,
    description: product.description,
    openGraph: { images: product.images[0] ? [product.images[0].url] : [] },
  };
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  return <ProductDetail slug={params.slug} />;
}
