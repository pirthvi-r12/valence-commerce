"use client";

import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { ProductImage } from "@/components/ProductImage";
import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { Marquee } from "@/components/Marquee";
import { imageFor } from "@/lib/catalog";
import { useCommerce } from "@/context/CommerceProvider";

const PRESS = [
  { source: "Vogue", quote: "VALENCE cuts technical cloth with couture discipline." },
  { source: "Hypebeast", quote: "The SS26 shell is the first parka we would wear to a dinner and a storm." },
  { source: "GQ", quote: "Quiet luxury, engineered. No logos. All performance." },
];

const MATERIAL_TILES = [
  {
    title: "V-TEX 20K",
    copy: "Membrane that stays matte in rain.",
    href: "/product/obsidian-shell-parka",
    cta: "View shell",
  },
  {
    title: "Merino 240",
    copy: "Grid knit for the layer underneath.",
    href: "/product/voltage-knit-crew",
    cta: "View knit",
  },
  {
    title: "Silent hardware",
    copy: "No logo, no shine, no rattle.",
    href: "/shop?q=silent",
    cta: "Shop pieces",
  },
  {
    title: "48h dispatch",
    copy: "Packed in the atelier, not a warehouse maze.",
    href: "/shop",
    cta: "View the floor",
  },
] as const;

export function Landing() {
  const { catalog, format, notify } = useCommerce();
  const featured = catalog.filter((product) => product.featured && !product.hidden).slice(0, 5);
  const parka = catalog.find((product) => product.slug === "obsidian-shell-parka");
  const vest = catalog.find((product) => product.slug === "nightfall-modular-vest");
  const helix = catalog.find((product) => product.slug === "helix-insulation-jacket");
  const vestLeft = vest?.variants.reduce((sum, variant) => sum + variant.inventoryCount, 0) ?? 0;
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 140]);
  const fade = useTransform(scrollY, [0, 500], [1, 0.35]);
  const [press, setPress] = useState(0);

  return (
    <div>
      <section className="relative min-h-[88svh] overflow-hidden bg-obsidian">
        <motion.div style={{ y }} className="absolute inset-0 overflow-hidden">
          <div className="relative h-full w-full min-h-[88svh]">
            <video
              className="absolute inset-0 h-full w-full object-cover opacity-[0.45] brightness-[0.62] contrast-[1.06] saturate-[0.82]"
              autoPlay
              muted
              loop
              playsInline
              poster="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2000&q=80"
            >
              <source src="https://videos.pexels.com/video-files/3209298/3209298-hd_1920_1080_25fps.mp4" type="video/mp4" />
            </video>
          </div>
          <div className="absolute inset-0 bg-obsidian/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/75 to-obsidian/35" />
        </motion.div>
        <motion.div style={{ opacity: fade }} className="shell relative flex min-h-[88svh] flex-col justify-end pb-16 pt-28">
          <p className="eyebrow">SS26 / Drop 01 · Technical uniform</p>
          <h1 className="mt-4 max-w-5xl font-display text-6xl leading-[0.88] tracking-[-0.055em] sm:text-7xl md:text-8xl">
            Engineered
            <br />
            for weather
            <br />
            and silence.
          </h1>
          <p className="mt-6 max-w-xl text-base text-white/70 md:text-lg">
            Matte shells, merino grid, and hardware with nothing to shout. Cut in limited runs. Delivered globally on orders over $200.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <MagneticLink href="/shop">Explore Collection</MagneticLink>
            <a href="#showcase" className="btn-ghost">
              Turn the pieces
            </a>
          </div>
          <dl className="mt-12 grid max-w-3xl grid-cols-3 gap-4 border-t border-white/10 pt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
            <div>
              <dt>Dispatch</dt>
              <dd className="mt-2 text-sm text-bone">48 hours</dd>
            </div>
            <div>
              <dt>Membrane</dt>
              <dd className="mt-2 text-sm text-bone">V-TEX 20K</dd>
            </div>
            <div>
              <dt>Floor</dt>
              <dd className="mt-2 text-sm text-bone">{String(catalog.filter((product) => !product.hidden).length).padStart(2, "0")} pieces</dd>
            </div>
          </dl>
        </motion.div>
      </section>

      <Marquee />

      <section className="shell py-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Bento</p>
            <h2 className="mt-3 font-display text-4xl tracking-[-0.045em] md:text-6xl">The floor, arranged.</h2>
          </div>
          <Link href="/shop" className="btn-ghost">
            Shop all
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <BentoLink href="/product/obsidian-shell-parka" className="md:col-span-7 md:row-span-2 min-h-[460px]" image={parka ? imageFor(parka, "Obsidian") : ""} kicker="SS26 · Outerwear" title="Obsidian Shell" note={parka ? format(parka.priceCents) : ""} />
          <BentoLink href="/product/nightfall-modular-vest" className="min-h-[280px] md:col-span-5" image={vest ? imageFor(vest, "Night") : ""} kicker="Limited · 400 run" title="Nightfall Vest" note={`${vestLeft} on hand`} />
          <div className="flex min-h-[180px] flex-col justify-between bg-lime p-6 text-obsidian md:col-span-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.22em]">Low stock</p>
            <div>
              <p className="font-display text-5xl tracking-[-0.05em]">{vestLeft}</p>
              <p className="mt-2 max-w-xs text-sm">Pieces of Nightfall still on the rail. When they leave, the run is closed.</p>
            </div>
          </div>
          {MATERIAL_TILES.map((tile) => (
            <MaterialTile
              key={tile.title}
              {...tile}
              onDispatchHint={
                tile.title === "48h dispatch"
                  ? () => notify("48h atelier dispatch · Free express delivery on orders over $200.")
                  : undefined
              }
            />
          ))}
        </div>
      </section>

      <section id="showcase" className="py-10">
        <div className="shell mb-6 flex items-end justify-between">
          <div>
            <p className="eyebrow">Hover rotation</p>
            <h2 className="mt-3 font-display text-4xl tracking-[-0.045em] md:text-6xl">Turn the piece.</h2>
          </div>
        </div>
        <div className="flex gap-4 overflow-x-auto px-5 pb-8 md:px-8">
          {(featured.length ? featured : catalog).map((product) => (
            <TiltCard key={product.id} href={`/product/${product.slug}`} image={imageFor(product)} title={product.title} price={format(product.priceCents)} />
          ))}
          {helix ? <TiltCard href={`/product/${helix.slug}`} image={imageFor(helix, "Ceramic")} title="Helix Ceramic" price={format(helix.priceCents + 2000)} /> : null}
        </div>
      </section>

      <section className="shell py-16">
        <div className="grid items-center gap-10 border border-white/10 bg-ink p-6 md:grid-cols-2 md:p-10">
          <div>
            <p className="eyebrow">On record</p>
            <motion.blockquote key={PRESS[press].source} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 font-display text-3xl leading-tight tracking-[-0.04em] md:text-5xl">
              “{PRESS[press].quote}”
            </motion.blockquote>
            <p className="mt-6 font-mono text-xs uppercase tracking-[0.22em] text-lime">{PRESS[press].source}</p>
          </div>
          <div className="flex gap-3 md:justify-end">
            {PRESS.map((item, index) => (
              <button
                key={item.source}
                type="button"
                onClick={() => setPress(index)}
                className={`border px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] ${index === press ? "border-lime text-lime" : "border-white/15 text-white/50"}`}
              >
                {item.source}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="shell pb-8">
        <div className="flex flex-col items-start justify-between gap-6 border border-white/10 px-6 py-10 md:flex-row md:items-center md:px-10">
          <div>
            <p className="eyebrow">Next</p>
            <h2 className="mt-3 font-display text-4xl tracking-[-0.045em] md:text-6xl">Enter the collection.</h2>
          </div>
          <Link href="/shop" className="btn-lime">
            Explore Collection <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

function MagneticLink({ href, children }: { href: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 220, damping: 18 });
  const y = useSpring(my, { stiffness: 220, damping: 18 });
  const reduce = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      style={{ x, y }}
      className="inline-block"
      onMouseMove={(event) => {
        if (reduce || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        mx.set((event.clientX - (rect.left + rect.width / 2)) * 0.4);
        my.set((event.clientY - (rect.top + rect.height / 2)) * 0.4);
      }}
      onMouseLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      <Link href={href} className="btn-lime">
        {children}
      </Link>
    </motion.div>
  );
}

function MaterialTile({
  title,
  copy,
  href,
  cta,
  onDispatchHint,
}: {
  title: string;
  copy: string;
  href: string;
  cta: string;
  onDispatchHint?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={() => onDispatchHint?.()}
      className="group flex min-h-[180px] flex-col justify-between border border-white/10 bg-ink p-5 transition duration-300 hover:border-lime hover:bg-[#0f1118] md:col-span-3"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-lime">Material</p>
      <div>
        <h3 className="mt-3 font-display text-2xl tracking-[-0.04em] transition group-hover:text-lime">{title}</h3>
        <p className="mt-2 text-sm text-white/60">{copy}</p>
        <p className="mt-4 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/40 transition group-hover:text-lime">
          {cta}
          <ArrowUpRight size={14} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </p>
      </div>
    </Link>
  );
}

function BentoLink({ href, className, image, kicker, title, note }: { href: string; className: string; image: string; kicker: string; title: string; note: string }) {
  return (
    <Link href={href} className={`group relative overflow-hidden bg-[#12141a] ${className}`}>
      {image ? <ProductImage src={image} alt="" fill sizes="(max-width: 768px) 100vw, 60vw" className="object-cover transition duration-700 group-hover:scale-105" /> : null}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className="absolute bottom-0 p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-lime">{kicker}</p>
        <h3 className="mt-2 font-display text-4xl tracking-[-0.04em]">{title}</h3>
        <p className="mt-2 font-mono text-sm">{note}</p>
      </div>
    </Link>
  );
}

function TiltCard({ href, image, title, price }: { href: string; image: string; title: string; price: string }) {
  const [rot, setRot] = useState({ x: 0, y: 0 });
  return (
    <Link
      href={href}
      onMouseMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        setRot({ x: (py - 0.5) * -14, y: (px - 0.5) * 18 });
      }}
      onMouseLeave={() => setRot({ x: 0, y: 0 })}
      className="relative h-[460px] w-[300px] shrink-0"
      style={{ perspective: "1000px" }}
    >
      <div
        className="relative h-full w-full overflow-hidden border border-white/10 bg-[#12141a] transition-transform duration-200"
        style={{ transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`, transformStyle: "preserve-3d" }}
      >
        <ProductImage src={image} alt={title} fill sizes="300px" className="object-cover" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4" style={{ transform: "translateZ(30px)" }}>
          <p className="font-display text-2xl tracking-[-0.04em]">{title}</p>
          <p className="font-mono text-sm text-lime">{price}</p>
        </div>
      </div>
    </Link>
  );
}
