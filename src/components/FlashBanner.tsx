"use client";

import { useEffect, useState } from "react";
import { flashSaleEnds, formatCountdown } from "@/lib/flash";

export function FlashBanner() {
  const [label, setLabel] = useState("--h --m --s");

  useEffect(() => {
    const tick = () => setLabel(formatCountdown(flashSaleEnds()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="bg-lime text-obsidian">
      <p className="shell flex items-center justify-center gap-3 py-2 text-center font-mono text-[11px] uppercase tracking-[0.22em]" aria-live="polite">
        <span>Flash sale ends in</span>
        <span className="font-medium">{label}</span>
        <span className="hidden sm:inline">· VALENCE20 for 20% off</span>
      </p>
    </div>
  );
}
