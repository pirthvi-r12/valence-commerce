const ITEMS = [
  "FREE GLOBAL SHIPPING ON ORDERS OVER $200",
  "SS26 DROP IS LIVE",
  "VALENCE20 UNLOCKS 20% OFF",
  "EXPRESS DISPATCH IN 48 HOURS",
  "LIMITED RUNS · NO RESTOCK GUARANTEE",
];

export function Marquee() {
  const row = [...ITEMS, ...ITEMS];
  return (
    <div className="ticker overflow-hidden border-y border-white/10 bg-ink">
      <div className="ticker-track flex w-max gap-0 py-3">
        {row.map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center font-mono text-[11px] uppercase tracking-[0.22em] text-bone/80">
            <span className="px-6">{item}</span>
            <span className="text-lime">•</span>
          </span>
        ))}
      </div>
    </div>
  );
}
