"use client";

import Link from "next/link";
import { useState } from "react";

export function Footer() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <footer className="mt-24 border-t border-white/10 bg-ink">
      <div className="shell grid gap-12 py-16 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <p className="eyebrow">Dispatch list</p>
          <h2 className="mt-3 font-display text-4xl tracking-[-0.04em]">Notes from the drop.</h2>
          <form
            className="mt-6 flex max-w-md gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!email.includes("@")) return;
              setDone(true);
            }}
          >
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email address"
              className="w-full border-b border-white/20 bg-transparent py-3 text-sm outline-none focus:border-lime"
            />
            <button type="submit" className="btn-lime shrink-0">
              {done ? "Listed" : "Join"}
            </button>
          </form>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
            {done ? "You are on the list. No noise, only drops." : "One letter when a run goes live."}
          </p>
        </div>
        <FooterCol title="Shop" links={[["/shop", "All pieces"], ["/shop?sort=newest", "SS26 drop"], ["/shop?category=Outerwear", "Outerwear"], ["/shop?category=Footwear", "Footwear"]]} />
        <FooterCol title="Client" links={[["/account", "Account"], ["/account/orders", "Orders"], ["/wishlist", "Wishlist"], ["/checkout", "Checkout"]]} />
        <FooterCol title="Atelier" links={[["/admin", "Command center"], ["/shop?category=Objects", "Objects"], ["/shop?category=Knits", "Knits"], ["/shop?category=Bottoms", "Trousers"]]} />
      </div>
      <div className="shell overflow-hidden border-t border-white/10 py-6">
        <p className="font-display text-[18vw] leading-none tracking-[-0.06em] text-transparent" style={{ WebkitTextStroke: "1px rgba(248,249,250,0.28)" }}>
          VALENCE
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">
          <span>© {new Date().getFullYear()} Valence Atelier</span>
          <span>Autonomous luxury commerce</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/40">{title}</p>
      <ul className="mt-4 space-y-3">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-sm text-bone/80 hover:text-lime">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
