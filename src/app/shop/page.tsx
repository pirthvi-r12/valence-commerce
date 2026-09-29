import { Suspense } from "react";
import { ShopExperience } from "@/components/shop/ShopExperience";

export const metadata = { title: "Shop" };

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="shell py-20 font-mono text-xs uppercase tracking-[0.2em] text-white/40">Loading the floor…</div>}>
      <ShopExperience />
    </Suspense>
  );
}
