"use client";

import { Send, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { imageCandidates, imageFor } from "@/lib/catalog";
import { styleOutfit } from "@/lib/stylist";
import { useCommerce } from "@/context/CommerceProvider";
import type { Product } from "@/lib/types";

interface ChatMessage {
  role: "assistant" | "user";
  text: string;
  products?: Product[];
}

const PROMPTS = [
  "I need an outfit for rainy weather in Tokyo under $300",
  "Cold-weather layers for Oslo",
  "Monochrome travel kit",
  "Something under $200",
];

export function AiStylistWidget() {
  const { catalog, format, cartOpen, searchOpen, pdpDock } = useCommerce();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      text: "Valence concierge. Tell me the weather, the city, and a ceiling — I will pull the pieces.",
    },
  ]);

  async function ask(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setDraft("");
    setMessages((current) => [...current, { role: "user", text: content }]);
    setBusy(true);
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });
      const data = (await response.json()) as { text?: string; slugs?: string[] };
      const slugs = data.slugs ?? [];
      const products = slugs.map((slug) => catalog.find((product) => product.slug === slug)).filter((product): product is Product => Boolean(product));
      setMessages((current) => [...current, { role: "assistant", text: data.text || "Here is the edit.", products }]);
    } catch {
      const local = styleOutfit(content, catalog);
      const products = local.slugs.map((slug) => catalog.find((product) => product.slug === slug)).filter((product): product is Product => Boolean(product));
      setMessages((current) => [...current, { role: "assistant", text: local.text, products }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`fixed right-5 z-[55] transition-all ${pdpDock ? "bottom-24" : "bottom-5"} ${cartOpen || searchOpen ? "pointer-events-none opacity-0" : ""}`}>
      {open ? (
        <div className="mb-3 flex h-[540px] w-[min(100vw-2.5rem,380px)] flex-col border border-white/10 bg-[#0C0E13] shadow-lift">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="eyebrow">Concierge</p>
              <p className="font-display text-lg">Stylist on the floor</p>
            </div>
            <button type="button" aria-label="Close concierge" onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-auto px-4 py-4">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === "user" ? "ml-8 bg-white/5 px-3 py-2 text-sm" : "mr-6 text-sm text-white/80"}>
                <p>{message.text}</p>
                {message.products?.length ? (
                  <div className="mt-3 space-y-2">
                    {message.products.map((product) => (
                      <Link key={product.id} href={`/product/${product.slug}`} className="flex items-center gap-3 border border-white/10 bg-obsidian p-2" onClick={() => setOpen(false)}>
                        <span className="relative h-14 w-11 overflow-hidden bg-[#12141a]">
                          <ProductImage
                            src={imageFor(product)}
                            candidates={imageCandidates(product)}
                            productId={product.id}
                            alt=""
                            fill
                            sizes="44px"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display">{product.title}</span>
                          <span className="font-mono text-xs text-lime">{format(product.priceCents)}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {busy ? <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-lime">Editing the rack…</p> : null}
          </div>
          <div className="flex gap-2 overflow-auto border-t border-white/10 px-3 py-2">
            {PROMPTS.map((prompt) => (
              <button key={prompt} type="button" className="shrink-0 border border-white/10 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-white/60 hover:border-lime hover:text-lime" onClick={() => ask(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2 border-t border-white/10 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              void ask(draft);
            }}
          >
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Weather, city, budget" className="field" />
            <button type="submit" aria-label="Send" className="grid w-12 place-items-center bg-lime text-obsidian">
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : null}
      <button type="button" aria-label="Open stylist" className="ml-auto grid h-14 w-14 place-items-center bg-lime text-obsidian shadow-lift" onClick={() => setOpen((value) => !value)}>
        {open ? <X /> : <Sparkles />}
      </button>
    </div>
  );
}
