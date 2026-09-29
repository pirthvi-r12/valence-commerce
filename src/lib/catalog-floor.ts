import type { Category, Size, Variant } from "./types";
import { SIZES } from "./types";
import { mediaShot, type MediaRef } from "./product-media";

type FloorDraft = {
  id: string;
  title: string;
  slug: string;
  category: Category;
  priceCents: number;
  media: MediaRef;
  mediaAlt?: MediaRef;
  colors?: string[];
  featured?: boolean;
  compareAtCents?: number | null;
  dropLabel?: string;
  createdAt?: string;
};

const COLOR_HEX: Record<string, string> = {
  Obsidian: "#14161A",
  Bone: "#E7E2D8",
  Voltage: "#D4FF00",
  Ink: "#12141A",
  Stone: "#A39E93",
  Black: "#101114",
  Night: "#0E1014",
  Glacier: "#D9DDE3",
  Graphite: "#3A3D44",
  Ash: "#8E9299",
  Lime: "#D4FF00",
};

function buildVariants(productId: string, colors: string[]): Variant[] {
  return colors.flatMap((color) =>
    SIZES.map((size) => {
      const colorSlug = color.toLowerCase().replace(/\s+/g, "-");
      return {
        id: `${productId}__${colorSlug}__${size}`,
        sku: `VL-${productId.toUpperCase()}-${color.replace(/\s+/g, "").slice(0, 3).toUpperCase()}-${size}`,
        size: size as Size,
        color,
        inventoryCount: size === "XS" ? 5 : 11,
        priceOffsetCents: 0,
      };
    }),
  );
}

function floorDraft(input: FloorDraft) {
  const colors = input.colors ?? ["Obsidian"];
  return {
    id: input.id,
    title: input.title,
    slug: input.slug,
    description: `${input.title} — ${input.category.toLowerCase()} from the VALENCE floor, cut with matte hardware and silent finishes.`,
    story: `${input.title} is part of the atelier uniform: limited runs, no logo noise, built for city weather and travel.`,
    category: input.category,
    priceCents: input.priceCents,
    compareAtCents: input.compareAtCents ?? null,
    featured: input.featured ?? false,
    materials: ["Atelier specified", "Matte finish"],
    specs: [
      { label: "Category", value: input.category },
      { label: "Run", value: "Open floor" },
    ],
    colors: colors.map((name) => ({ name, hex: COLOR_HEX[name] ?? "#14161A" })),
    images: colors.map((color, index) =>
      mediaShot(index === 1 && input.mediaAlt ? input.mediaAlt : input.media, color, `${input.title} ${color}`),
    ),
    variants: buildVariants(input.id, colors),
    tags: ["city", "travel"],
    completeTheLook: ["obsidian-shell-parka", "bone-technical-tee"],
    dropLabel: input.dropLabel ?? "Core",
    createdAt: input.createdAt ?? "2026-08-15T10:00:00.000Z",
  };
}

const u = (id: string): MediaRef => ({ type: "unsplash", id });
const p = (id: number): MediaRef => ({ type: "pexels", id });

/** Each piece uses its own Unsplash or Pexels asset (no shared hero picks). */
export const FLOOR_DRAFTS = [
  floorDraft({ id: "p11", title: "Carbon Trench Shell", slug: "carbon-trench-shell", category: "Outerwear", priceCents: 94000, media: u("photo-1544022613-e87ca75a784a"), mediaAlt: p(6311587), colors: ["Obsidian", "Stone"], compareAtCents: 102000, featured: true, dropLabel: "SS26" }),
  floorDraft({ id: "p12", title: "Meridian Rain Cape", slug: "meridian-rain-cape", category: "Outerwear", priceCents: 72000, media: u("photo-1551028719-00167b16eac5"), mediaAlt: p(9856359), colors: ["Ink", "Bone"] }),
  floorDraft({ id: "p13", title: "Strata Field Coat", slug: "strata-field-coat", category: "Outerwear", priceCents: 81000, media: u("photo-1539533018447-63fcce2678e3"), mediaAlt: p(7680060), colors: ["Obsidian", "Ash"] }),
  floorDraft({ id: "p14", title: "Zero Wind Breaker", slug: "zero-wind-breaker", category: "Outerwear", priceCents: 48000, media: p(6311392), mediaAlt: u("photo-1594938298603-c8148c4dae35"), colors: ["Black", "Voltage"], featured: true }),
  floorDraft({ id: "p15", title: "Monolith Overcoat", slug: "monolith-overcoat", category: "Outerwear", priceCents: 118000, media: p(6311574), mediaAlt: u("photo-1594938298603-c8148c4dae35"), colors: ["Obsidian"], compareAtCents: 128000, dropLabel: "Limited" }),

  floorDraft({ id: "p16", title: "Pulse Grid Fleece", slug: "pulse-grid-fleece", category: "Layering", priceCents: 36000, media: u("photo-1591047139829-d91aecb6caea"), mediaAlt: p(996329), colors: ["Graphite", "Bone"] }),
  floorDraft({ id: "p17", title: "Delta Midlayer Zip", slug: "delta-midlayer-zip", category: "Layering", priceCents: 52000, media: p(1926769), mediaAlt: u("photo-1594938298603-c8148c4dae35"), colors: ["Night", "Stone"] }),
  floorDraft({ id: "p18", title: "Lumen Hybrid Blazer", slug: "lumen-hybrid-blazer", category: "Layering", priceCents: 68000, media: u("photo-1594938298603-c8148c4dae35"), mediaAlt: p(6311392), colors: ["Ink", "Ash"], featured: true }),
  floorDraft({ id: "p19", title: "Frostline Shacket", slug: "frostline-shacket", category: "Layering", priceCents: 44000, media: p(1926769), mediaAlt: u("photo-1515886657613-9f3515b0c78f"), colors: ["Obsidian", "Bone"] }),

  floorDraft({ id: "p20", title: "Slate Longsleeve Base", slug: "slate-longsleeve-base", category: "Tops", priceCents: 18000, media: u("photo-1521572163474-6864f9cf17ab"), mediaAlt: p(1598507), colors: ["Graphite", "Bone"] }),
  floorDraft({ id: "p21", title: "Grid Mock Neck", slug: "grid-mock-neck", category: "Tops", priceCents: 22000, media: u("photo-1542272604-787c3835535d"), mediaAlt: p(1598505), colors: ["Obsidian", "Stone"] }),
  floorDraft({ id: "p22", title: "Courier Polo", slug: "courier-polo", category: "Tops", priceCents: 24000, media: p(373125), mediaAlt: u("photo-1552374196-c4e7ffc6e126"), colors: ["Bone", "Black"] }),
  floorDraft({ id: "p23", title: "Drift Overshirt", slug: "drift-overshirt", category: "Tops", priceCents: 32000, media: u("photo-1473966968600-fa801b869a1a"), mediaAlt: p(2905238), colors: ["Stone", "Ink"], featured: true }),
  floorDraft({ id: "p24", title: "Prime Mesh Tank", slug: "prime-mesh-tank", category: "Tops", priceCents: 12000, media: u("photo-1618354691373-d851c5c3a990"), mediaAlt: p(4065153), colors: ["Black", "Voltage"] }),

  floorDraft({ id: "p25", title: "Atlas Rollneck", slug: "atlas-rollneck", category: "Knits", priceCents: 32000, media: u("photo-1617137968427-85924c800a22"), mediaAlt: p(3737630), colors: ["Obsidian", "Bone"] }),
  floorDraft({ id: "p26", title: "Nova Hoodie Knit", slug: "nova-hoodie-knit", category: "Knits", priceCents: 36000, media: p(1152077), mediaAlt: u("photo-1434389677669-e08b4cac3105"), colors: ["Graphite", "Night"] }),
  floorDraft({ id: "p27", title: "Calibre Half-Zip", slug: "calibre-half-zip", category: "Knits", priceCents: 30000, media: u("photo-1602810318383-e386cc2a3ccf"), mediaAlt: p(3737630), colors: ["Bone", "Ash"] }),
  floorDraft({ id: "p28", title: "Ridge Turtleneck", slug: "ridge-turtleneck", category: "Knits", priceCents: 29000, media: u("photo-1487222477894-8943e31ef7b2"), mediaAlt: p(4992944), colors: ["Obsidian", "Voltage"], featured: true }),
  floorDraft({ id: "p29", title: "Echo Mesh Knit", slug: "echo-mesh-knit", category: "Knits", priceCents: 26000, media: u("photo-1583743814966-8936f5b7be1a"), mediaAlt: p(4992944), colors: ["Black", "Stone"] }),

  floorDraft({ id: "p30", title: "Taper Denim Trouser", slug: "taper-denim-trouser", category: "Bottoms", priceCents: 38000, media: u("photo-1489987707025-afc232f7ea0f"), mediaAlt: p(1598507), colors: ["Ink", "Stone"] }),
  floorDraft({ id: "p31", title: "Grid Wide Leg", slug: "grid-wide-leg", category: "Bottoms", priceCents: 40000, media: p(2673014), mediaAlt: u("photo-1624378439575-d8705ad7ae80"), colors: ["Black", "Bone"] }),
  floorDraft({ id: "p32", title: "Field Short", slug: "field-short", category: "Bottoms", priceCents: 22000, media: u("photo-1445205170230-053b83016050"), mediaAlt: p(189472), colors: ["Stone", "Obsidian"] }),
  floorDraft({ id: "p33", title: "Align Chino", slug: "align-chino", category: "Bottoms", priceCents: 34000, media: p(1032110), mediaAlt: u("photo-1608231387042-66d1773070a5"), colors: ["Ink", "Ash"], featured: true }),

  floorDraft({ id: "p34", title: "Platform Derby", slug: "platform-derby", category: "Footwear", priceCents: 46000, media: u("photo-1549298916-b41d501d3772"), mediaAlt: p(190819), colors: ["Black", "Glacier"] }),
  floorDraft({ id: "p35", title: "Trail Low Sneaker", slug: "trail-low-sneaker", category: "Footwear", priceCents: 28000, media: p(2889260), mediaAlt: u("photo-1553062407-98eeb64c6a62"), colors: ["Obsidian", "Stone"], featured: true }),
  floorDraft({ id: "p36", title: "Mono Chelsea", slug: "mono-chelsea", category: "Footwear", priceCents: 54000, media: u("photo-1549298916-b41d501d3772"), colors: ["Black"] }),
  floorDraft({ id: "p37", title: "Storm Runner", slug: "storm-runner", category: "Footwear", priceCents: 22000, media: p(2889260), mediaAlt: u("photo-1542291026-7eec264c27ff"), colors: ["Glacier", "Voltage"] }),
  floorDraft({ id: "p38", title: "Ridge Hiker Low", slug: "ridge-hiker-low", category: "Footwear", priceCents: 58000, media: p(1106468), mediaAlt: u("photo-1542291026-7eec264c27ff"), colors: ["Ink", "Black"], compareAtCents: 62000 }),

  floorDraft({ id: "p39", title: "Archive Tote 01", slug: "archive-tote-01", category: "Objects", priceCents: 42000, media: p(336372), mediaAlt: u("photo-1553062407-98eeb64c6a62"), colors: ["Black", "Bone"] }),
  floorDraft({ id: "p40", title: "Transit Backpack 03", slug: "transit-backpack-03", category: "Objects", priceCents: 56000, media: u("photo-1553062407-98eeb64c6a62"), mediaAlt: p(373125), colors: ["Obsidian", "Stone"], featured: true }),
  floorDraft({ id: "p41", title: "Lens Case Module", slug: "lens-case-module", category: "Objects", priceCents: 18000, media: p(1152077), mediaAlt: u("photo-1590874103328-eac38a683ce7"), colors: ["Black", "Voltage"] }),
  floorDraft({ id: "p42", title: "Pocket Sling Mini", slug: "pocket-sling-mini", category: "Objects", priceCents: 26000, media: p(2905238), mediaAlt: p(3737630), colors: ["Ink", "Black"] }),
  floorDraft({ id: "p43", title: "Field Duffel", slug: "field-duffel", category: "Objects", priceCents: 68000, media: p(3737630), mediaAlt: u("photo-1489987707025-afc232f7ea0f"), colors: ["Obsidian", "Stone"], compareAtCents: 74000 }),

  floorDraft({ id: "p44", title: "Silent Belt 02", slug: "silent-belt-02", category: "Accessories", priceCents: 12000, media: p(4065153), mediaAlt: u("photo-1434389677669-e08b4cac3105"), colors: ["Black", "Obsidian"] }),
  floorDraft({ id: "p45", title: "Grid Glove Set", slug: "grid-glove-set", category: "Accessories", priceCents: 16000, media: p(3737630), mediaAlt: u("photo-1602810318383-e386cc2a3ccf"), colors: ["Graphite", "Bone"] }),
  floorDraft({ id: "p46", title: "Voltage Socks 3-Pack", slug: "voltage-socks-3-pack", category: "Accessories", priceCents: 4800, media: p(996329), mediaAlt: u("photo-1487222477894-8943e31ef7b2"), colors: ["Voltage", "Black"] }),
  floorDraft({ id: "p47", title: "Travel Wallet", slug: "travel-wallet", category: "Accessories", priceCents: 14000, media: p(1152077), mediaAlt: u("photo-1583743814966-8936f5b7be1a"), colors: ["Ink", "Bone"], featured: true }),
  floorDraft({ id: "p48", title: "Thermal Scarf", slug: "thermal-scarf", category: "Accessories", priceCents: 11000, media: p(996329), mediaAlt: u("photo-1445205170230-053b83016050"), colors: ["Obsidian", "Ash"] }),
  floorDraft({ id: "p49", title: "Key Clip Kit", slug: "key-clip-kit", category: "Accessories", priceCents: 9000, media: p(206876), mediaAlt: u("photo-1624378439575-d8705ad7ae80"), colors: ["Black", "Voltage"] }),

  floorDraft({ id: "p50", title: "Brim Storm Cap", slug: "brim-storm-cap", category: "Headwear", priceCents: 16000, media: u("photo-1489987707025-afc232f7ea0f"), mediaAlt: u("photo-1521369909029-2afed882baee"), colors: ["Obsidian", "Stone"] }),
  floorDraft({ id: "p51", title: "Merino Balaclava", slug: "merino-balaclava", category: "Headwear", priceCents: 18000, media: p(4992944), mediaAlt: u("photo-1583743814966-8936f5b7be1a"), colors: ["Black", "Bone"] }),
  floorDraft({ id: "p52", title: "Echo Bucket Hat", slug: "echo-bucket-hat", category: "Headwear", priceCents: 15000, media: u("photo-1521369909029-2afed882baee"), mediaAlt: p(4992944), colors: ["Ink", "Ash"], featured: true }),
  floorDraft({ id: "p53", title: "Wool Driver Cap", slug: "wool-driver-cap", category: "Headwear", priceCents: 17000, media: u("photo-1576871337632-b9aef4c17ab9"), mediaAlt: p(4992944), colors: ["Obsidian", "Graphite"] }),
  floorDraft({ id: "p54", title: "Zero Visor", slug: "zero-visor", category: "Headwear", priceCents: 13000, media: p(9856358), mediaAlt: u("photo-1542291026-7eec264c27ff"), colors: ["Black", "Glacier"] }),
];
