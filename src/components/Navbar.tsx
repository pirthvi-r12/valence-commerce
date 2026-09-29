"use client";

import { Globe, Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CURRENCY_CODES } from "@/lib/currency";
import { useCommerce } from "@/context/CommerceProvider";

const LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?sort=newest", label: "SS26 Drop" },
  { href: "/shop?category=Outerwear", label: "Outerwear" },
  { href: "/wishlist", label: "Wishlist" },
];

export function Navbar() {
  const { cartCount, wishlistCount, currency, setCurrency, fxLive, setCartOpen, setSearchOpen, state } = useCommerce();
  const [open, setOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSearchOpen]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="relative z-40 border-b border-white/10 bg-[#07080B]/75 backdrop-blur-xl">
      <div className="shell flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button type="button" className="grid h-10 w-10 place-items-center border border-white/10 md:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu size={16} />
          </button>
          <Link href="/" className="font-display text-lg tracking-[0.18em]">
            VALENCE <span className="text-lime">//</span>
          </Link>
        </div>
        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-[11px] uppercase tracking-[0.22em] text-white/70 hover:text-lime">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 px-2 py-2 font-mono text-[11px] uppercase tracking-[0.16em] text-white/80"
              aria-expanded={currencyOpen}
              onClick={() => setCurrencyOpen((value) => !value)}
            >
              <Globe size={15} />
              {currency}
              <span className={`h-1.5 w-1.5 ${fxLive ? "bg-signal" : "bg-white/30"}`} title={fxLive ? "Live FX" : "Reference FX"} />
            </button>
            {currencyOpen ? (
              <div className="absolute right-0 z-50 mt-1 w-36 border border-white/10 bg-ink p-1 shadow-lift">
                {CURRENCY_CODES.map((code) => (
                  <button
                    key={code}
                    type="button"
                    className={`block w-full px-3 py-2 text-left font-mono text-xs tracking-[0.14em] ${code === currency ? "bg-lime text-obsidian" : "hover:bg-white/5"}`}
                    onClick={() => {
                      setCurrency(code);
                      setCurrencyOpen(false);
                    }}
                  >
                    {code}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <button type="button" aria-label="Search" className="grid h-10 w-10 place-items-center" onClick={() => setSearchOpen(true)}>
            <Search size={16} />
          </button>
          <Link href="/wishlist" aria-label="Wishlist" className="relative grid h-10 w-10 place-items-center">
            <Heart size={16} />
            {wishlistCount > 0 ? <Badge count={wishlistCount} /> : null}
          </Link>
          <Link href="/account" aria-label="Account" className="grid h-10 w-10 place-items-center">
            <User size={16} className={state.user ? "text-lime" : ""} />
          </Link>
          <button type="button" aria-label="Open bag" className="relative grid h-10 w-10 place-items-center" onClick={() => setCartOpen(true)}>
            <ShoppingBag size={16} />
            {cartCount > 0 ? <Badge count={cartCount} /> : null}
          </button>
        </div>
      </div>
      <MobileMenu open={open} onClose={() => setOpen(false)} />
    </header>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
      <button type="button" className="absolute inset-0 bg-obsidian/95 backdrop-blur-md" aria-label="Close menu" onClick={onClose} />
      <div className="relative flex h-full flex-col bg-obsidian">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <span className="font-display tracking-[0.18em]">VALENCE</span>
          <button type="button" aria-label="Close menu" className="grid h-10 w-10 place-items-center border border-white/10" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <nav className="scrollbar-none flex flex-1 flex-col gap-6 overflow-y-auto overscroll-contain px-6 py-10">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} onClick={onClose} className="font-display text-4xl tracking-[-0.04em] hover:text-lime">
              {link.label}
            </Link>
          ))}
          <Link href="/account" onClick={onClose} className="font-display text-4xl tracking-[-0.04em] hover:text-lime">
            Account
          </Link>
        </nav>
      </div>
    </div>,
    document.body,
  );
}

function Badge({ count }: { count: number }) {
  return (
    <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center bg-lime px-1 font-mono text-[9px] text-obsidian">
      {count}
    </span>
  );
}
