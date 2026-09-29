import type { Category, FitAdvice, Product, ProductImage, Review, Size, Variant } from "./types";
import { SIZES } from "./types";
import { FLOOR_DRAFTS } from "./catalog-floor";
import { mediaUrl, placeholderForProduct } from "./product-media";

function shot(photo: string, color: string, alt: string): ProductImage {
  const id = photo.startsWith("photo-") ? photo : `photo-${photo}`;
  return { url: mediaUrl({ type: "unsplash", id }), color, alt };
}

function shotPexels(id: number, color: string, alt: string): ProductImage {
  return { url: mediaUrl({ type: "pexels", id }), color, alt };
}

function buildVariants(
  productId: string,
  colors: string[],
  stock: Record<string, number> = {},
  offsets: Record<string, number> = {},
): Variant[] {
  return colors.flatMap((color) =>
    SIZES.map((size) => {
      const key = `${color}|${size}`;
      const colorSlug = color.toLowerCase().replace(/\s+/g, "-");
      return {
        id: `${productId}__${colorSlug}__${size}`,
        sku: `VL-${productId.toUpperCase()}-${color.replace(/\s+/g, "").slice(0, 3).toUpperCase()}-${size}`,
        size: size as Size,
        color,
        inventoryCount: stock[key] ?? (size === "XS" ? 5 : 11),
        priceOffsetCents: offsets[color] ?? 0,
      };
    }),
  );
}

function review(
  productId: string,
  id: string,
  userName: string,
  rating: number,
  comment: string,
  fit: FitAdvice,
  verifiedPurchase: boolean,
  createdAt: string,
): Review {
  return { id, productId, userName, rating, comment, fit, verifiedPurchase, createdAt };
}

type Draft = Omit<Product, "rating" | "reviewsCount" | "reviews" | "hidden">;

const drafts: Draft[] = [
  {
    id: "p1",
    title: "Obsidian Shell Parka",
    slug: "obsidian-shell-parka",
    description: "A matte 3-layer shell with a couture shoulder and a hood that disappears in clear weather.",
    story:
      "Cut from V-TEX 20K membrane and bonded without a logo. The Obsidian Shell is the SS26 uniform: silent in a lobby, sealed in a storm, and finished with matte hardware that refuses to flash.",
    category: "Outerwear",
    priceCents: 89000,
    compareAtCents: 98000,
    featured: true,
    materials: ["V-TEX 20K membrane", "Matte nylon face", "Articulated hood"],
    specs: [
      { label: "Waterproof", value: "20,000 mm" },
      { label: "Breathability", value: "18,000 g/m²" },
      { label: "Weight", value: "640 g" },
      { label: "Origin", value: "Cut in Portugal" },
    ],
    colors: [
      { name: "Obsidian", hex: "#14161A" },
      { name: "Bone", hex: "#E6E1D6" },
      { name: "Voltage", hex: "#D4FF00" },
    ],
    images: [
      shot("photo-1544022613-e87ca75a784a", "Obsidian", "Matte black shell coat, three-quarter view"),
      shot("photo-1551028719-00167b16eac5", "Obsidian", "Black technical parka on a model"),
      shot("photo-1539533018447-63fcce2678e3", "Bone", "Bone parka in natural light"),
      shot("photo-1591047139829-d91aecb6caea", "Bone", "Stone-colored shell jacket"),
      shot("photo-1515886657613-9f3515b0c78f", "Voltage", "Voltage technical outer layer"),
      shot("photo-1469334031218-e382a71b716b", "Voltage", "Editorial voltage outerwear"),
    ],
    variants: buildVariants("p1", ["Obsidian", "Bone", "Voltage"], {
      "Obsidian|M": 3,
      "Voltage|XS": 2,
    }),
    tags: ["rain", "waterproof", "cold", "city", "travel"],
    completeTheLook: ["arc-form-cargo-trouser", "cipher-merino-beanie", "glacier-expedition-boot"],
    dropLabel: "SS26",
    createdAt: "2026-09-20T10:00:00.000Z",
  },
  {
    id: "p2",
    title: "Arc-Form Cargo Trouser",
    slug: "arc-form-cargo-trouser",
    description: "A tapered cargo with a clean front and articulated knees, built to move under a shell.",
    story:
      "The Arc-Form keeps the pocket architecture and loses the noise. Double-weave stretch, a hidden zip at the hem, and a rise that sits cleanly under the Nightfall vest.",
    category: "Bottoms",
    priceCents: 42000,
    compareAtCents: null,
    featured: true,
    materials: ["Double-weave stretch", "Matte ripstop", "YKK silent zips"],
    specs: [
      { label: "Rise", value: "Mid" },
      { label: "Leg", value: "Tapered" },
      { label: "Weight", value: "410 g" },
      { label: "Pockets", value: "6" },
    ],
    colors: [
      { name: "Ink", hex: "#12141A" },
      { name: "Stone", hex: "#A39E93" },
    ],
    images: [
      shot("photo-1624378439575-d8705ad7ae80", "Ink", "Ink cargo trouser"),
      shot("photo-1542272604-787c3835535d", "Ink", "Dark technical trouser detail"),
      shot("photo-1473966968600-fa801b869a1a", "Stone", "Stone cargo trouser"),
      shot("photo-1506629082955-511b1aa562c8", "Stone", "Stone pant in studio light"),
    ],
    variants: buildVariants("p2", ["Ink", "Stone"], { "Stone|XS": 4 }),
    tags: ["travel", "city"],
    completeTheLook: ["obsidian-shell-parka", "bone-technical-tee", "signal-crossbody-02"],
    dropLabel: "SS26",
    createdAt: "2026-09-12T10:00:00.000Z",
  },
  {
    id: "p3",
    title: "Voltage Knit Crew",
    slug: "voltage-knit-crew",
    description: "A dense merino crew with a technical hand and a voltage option that reads as pigment, not a logo.",
    story:
      "Grid-knit merino at 240 grams. It layers under every shell in the drop and holds a shape after a day of travel. The voltage dye is mineral, not fluorescent plastic.",
    category: "Knits",
    priceCents: 28000,
    compareAtCents: null,
    featured: false,
    materials: ["Merino grid 240", "Reinforced collar", "Flatlock seam"],
    specs: [
      { label: "Gauge", value: "240 g/m²" },
      { label: "Fiber", value: "Merino" },
      { label: "Fit", value: "Regular" },
      { label: "Care", value: "Cold wash" },
    ],
    colors: [
      { name: "Voltage", hex: "#C6F000" },
      { name: "Graphite", hex: "#3A3D44" },
      { name: "Bone", hex: "#F4F1EA" },
    ],
    images: [
      shot("photo-1556821840-3a63f95609a7", "Voltage", "Voltage knit crew"),
      shot("photo-1434389677669-e08b4cac3105", "Voltage", "Knit on a rail"),
      shot("photo-1617137968427-85924c800a22", "Graphite", "Graphite crew knit"),
      shot("photo-1487222477894-8943e31ef7b2", "Graphite", "Graphite knit portrait"),
      shot("photo-1489987707025-afc232f7ea0f", "Bone", "Bone knit crew"),
      shot("photo-1602810318383-e386cc2a3ccf", "Bone", "Bone crew, studio"),
    ],
    variants: buildVariants("p3", ["Voltage", "Graphite", "Bone"]),
    tags: ["cold", "night", "city"],
    completeTheLook: ["mono-track-pant", "cipher-merino-beanie", "nightfall-modular-vest"],
    dropLabel: "SS26",
    createdAt: "2026-08-28T10:00:00.000Z",
  },
  {
    id: "p4",
    title: "Nightfall Modular Vest",
    slug: "nightfall-modular-vest",
    description: "A limited vest with a concealed placket and pockets mapped for a passport, a phone, and nothing else.",
    story:
      "Nightfall is a 400-piece run. The fill is recycled, the face is matte, and the interior sling pocket is cut for a boarding pass. It is the layer between a knit and weather.",
    category: "Layering",
    priceCents: 64000,
    compareAtCents: null,
    featured: true,
    materials: ["Matte face cloth", "Recycled fill", "Interior sling pocket"],
    specs: [
      { label: "Fill", value: "80 g" },
      { label: "Run", value: "400 pieces" },
      { label: "Weight", value: "380 g" },
      { label: "Closure", value: "Concealed zip" },
    ],
    colors: [
      { name: "Night", hex: "#0E1014" },
      { name: "Ash", hex: "#8E9299" },
    ],
    images: [
      shot("photo-1594938298603-c8148c4dae35", "Night", "Nightfall vest, dark"),
      shotPexels(7680060, "Night", "Dark modular vest"),
      shot("photo-1469334031218-e382a71b716b", "Ash", "Ash vest in daylight"),
      shotPexels(6311574, "Ash", "Ash outer layer"),
    ],
    variants: buildVariants("p4", ["Night", "Ash"], { "Night|L": 1, "Ash|XS": 3 }),
    tags: ["travel", "night", "city"],
    completeTheLook: ["voltage-knit-crew", "arc-form-cargo-trouser", "signal-crossbody-02"],
    dropLabel: "Limited",
    createdAt: "2026-09-18T10:00:00.000Z",
  },
  {
    id: "p5",
    title: "Bone Technical Tee",
    slug: "bone-technical-tee",
    description: "A heavy jersey tee with a taller collar and a bone dye that stays clean under a shell.",
    story:
      "The only logo is the weave. Compact cotton with a technical finish, a shoulder that holds a bag strap, and a length that covers the cargo waistband.",
    category: "Tops",
    priceCents: 16000,
    compareAtCents: null,
    featured: false,
    materials: ["Compact jersey", "Bonded collar", "Matte dye"],
    specs: [
      { label: "Weight", value: "220 g/m²" },
      { label: "Fiber", value: "Cotton compact" },
      { label: "Fit", value: "Box" },
      { label: "Neck", value: "Tall crew" },
    ],
    colors: [
      { name: "Bone", hex: "#F7F4EE" },
      { name: "Obsidian", hex: "#14161A" },
    ],
    images: [
      shot("photo-1521572163474-6864f9cf17ab", "Bone", "Bone technical tee"),
      shot("photo-1489987707025-afc232f7ea0f", "Bone", "Folded bone tee"),
      shot("photo-1583743814966-8936f5b7be1a", "Obsidian", "Obsidian technical tee"),
      shot("photo-1618354691373-d851c5c3a990", "Obsidian", "Black tee, flat lay"),
    ],
    variants: buildVariants("p5", ["Bone", "Obsidian"], { "Obsidian|XL": 0, "Bone|S": 6 }),
    tags: ["heat", "city"],
    completeTheLook: ["mono-track-pant", "signal-crossbody-02", "cipher-merino-beanie"],
    dropLabel: "Core",
    createdAt: "2026-06-02T10:00:00.000Z",
  },
  {
    id: "p6",
    title: "Glacier Expedition Boot",
    slug: "glacier-expedition-boot",
    description: "A waterproof boot with a slim last, built for wet cities and cold platforms.",
    story:
      "The Glacier boot keeps an expedition sole and a dress-shoe throat. Membrane lined, matte rubber, and a lug that does not theatricalize the street.",
    category: "Footwear",
    priceCents: 52000,
    compareAtCents: null,
    featured: true,
    materials: ["Waterproof membrane", "Matte rubber lug", "Leather and textile"],
    specs: [
      { label: "Drop", value: "8 mm" },
      { label: "Waterproof", value: "Sealed" },
      { label: "Last", value: "Slim" },
      { label: "Sole", value: "City lug" },
    ],
    colors: [
      { name: "Glacier", hex: "#D9DDE3" },
      { name: "Black", hex: "#111111" },
    ],
    images: [
      shot("photo-1520639888713-7851133b1ed0", "Glacier", "Glacier expedition boot"),
      shotPexels(2529148, "Glacier", "Pale technical boot"),
      shotPexels(1464625, "Black", "Black expedition boot"),
      shot("photo-1549298916-b41d501d3772", "Black", "Black boot profile"),
    ],
    variants: buildVariants("p6", ["Glacier", "Black"], { "Glacier|XL": 4, "Black|M": 7 }),
    tags: ["rain", "cold", "snow", "waterproof"],
    completeTheLook: ["obsidian-shell-parka", "arc-form-cargo-trouser", "helix-insulation-jacket"],
    dropLabel: "SS26",
    createdAt: "2026-07-19T10:00:00.000Z",
  },
  {
    id: "p7",
    title: "Signal Crossbody 02",
    slug: "signal-crossbody-02",
    description: "A compact crossbody in bonded nylon with a lime interior and a strap that disappears under a coat.",
    story:
      "Signal 02 holds a passport, a lens, and a phone. The exterior is silent black. The interior is voltage, visible only when the bag is open.",
    category: "Objects",
    priceCents: 34000,
    compareAtCents: 38000,
    featured: false,
    materials: ["Bonded nylon", "Matte hardware", "Voltage lining"],
    specs: [
      { label: "Volume", value: "4.5 L" },
      { label: "Strap", value: "Adjustable" },
      { label: "Closure", value: "Magnetic + zip" },
      { label: "Weight", value: "420 g" },
    ],
    colors: [
      { name: "Black", hex: "#111111" },
      { name: "Lime", hex: "#D4FF00" },
    ],
    images: [
      shot("photo-1590874103328-eac38a683ce7", "Black", "Black signal crossbody"),
      shotPexels(2905238, "Black", "Crossbody in profile"),
      shot("photo-1553062407-98eeb64c6a62", "Lime", "Lime-accent crossbody"),
      shotPexels(373125, "Lime", "Open crossbody detail"),
    ],
    variants: buildVariants("p7", ["Black", "Lime"], { "Lime|XL": 2, "Black|XS": 0 }),
    tags: ["travel", "night", "city"],
    completeTheLook: ["nightfall-modular-vest", "bone-technical-tee", "mono-track-pant"],
    dropLabel: "Limited",
    createdAt: "2026-09-08T10:00:00.000Z",
  },
  {
    id: "p8",
    title: "Helix Insulation Jacket",
    slug: "helix-insulation-jacket",
    description: "A baffled insulator that compresses into its own pocket and still reads as a coat.",
    story:
      "Helix is the cold-weather counterpart to the shell. Box baffles, a ceramic colorway with a small upcharge, and a pack size that fits the Signal bag.",
    category: "Layering",
    priceCents: 76000,
    compareAtCents: 84000,
    featured: true,
    materials: ["Recycled baffles", "Matte shell", "Packs into pocket"],
    specs: [
      { label: "Fill power", value: "Synthetic 80g" },
      { label: "Packed", value: "Signal-compatible" },
      { label: "Weight", value: "520 g" },
      { label: "Hood", value: "Stowable" },
    ],
    colors: [
      { name: "Ink", hex: "#16181D" },
      { name: "Ceramic", hex: "#C8C2B4" },
    ],
    images: [
      shot("photo-1594938298603-c8148c4dae35", "Ink", "Ink insulation jacket"),
      shotPexels(6311392, "Ink", "Dark helix jacket"),
      shot("photo-1594938298603-c8148c4dae35", "Ceramic", "Ceramic insulation jacket"),
      shot("photo-1544022613-e87ca75a784a", "Ceramic", "Ceramic coat, walking"),
    ],
    variants: buildVariants("p8", ["Ink", "Ceramic"], { "Ceramic|M": 5 }, { Ceramic: 2000 }),
    tags: ["cold", "snow", "travel"],
    completeTheLook: ["arc-form-cargo-trouser", "glacier-expedition-boot", "cipher-merino-beanie"],
    dropLabel: "SS26",
    createdAt: "2026-09-16T10:00:00.000Z",
  },
  {
    id: "p9",
    title: "Mono Track Pant",
    slug: "mono-track-pant",
    description: "A clean track pant in matte stretch, with a zip hem and no contrast stripe.",
    story:
      "Mono removes the athletic graphic and keeps the ease. It is the warm-weather bottom and the flight pant, cut to sit with the Bone tee.",
    category: "Bottoms",
    priceCents: 31000,
    compareAtCents: null,
    featured: false,
    materials: ["Matte stretch", "Zip hem", "Elastic waist"],
    specs: [
      { label: "Rise", value: "Mid" },
      { label: "Leg", value: "Straight" },
      { label: "Weight", value: "340 g" },
      { label: "Stripe", value: "None" },
    ],
    colors: [
      { name: "Black", hex: "#101114" },
      { name: "Stone", hex: "#B7B1A4" },
    ],
    images: [
      shot("photo-1542272604-787c3835535d", "Black", "Black mono track pant"),
      shotPexels(1598505, "Black", "Black pant movement"),
      shot("photo-1473966968600-fa801b869a1a", "Stone", "Stone track pant"),
      shot("photo-1618354691373-d851c5c3a990", "Stone", "Stone pant detail"),
    ],
    variants: buildVariants("p9", ["Black", "Stone"]),
    tags: ["travel", "heat", "city"],
    completeTheLook: ["bone-technical-tee", "signal-crossbody-02", "voltage-knit-crew"],
    dropLabel: "Core",
    createdAt: "2026-08-04T10:00:00.000Z",
  },
  {
    id: "p10",
    title: "Cipher Merino Beanie",
    slug: "cipher-merino-beanie",
    description: "A fine merino beanie with a short cuff and a density that works under the shell hood.",
    story:
      "Cipher is the smallest piece in the uniform and the one people steal. Fine merino, a cuff that stays put, and a dye lot matched to Obsidian and Bone.",
    category: "Headwear",
    priceCents: 14000,
    compareAtCents: null,
    featured: false,
    materials: ["Fine merino", "Short cuff", "Seamless crown"],
    specs: [
      { label: "Fiber", value: "Merino" },
      { label: "Cuff", value: "Short" },
      { label: "Weight", value: "70 g" },
      { label: "Season", value: "Cold" },
    ],
    colors: [
      { name: "Obsidian", hex: "#1A1C20" },
      { name: "Bone", hex: "#E7E2D8" },
    ],
    images: [
      shot("photo-1576871337632-b9aef4c17ab9", "Obsidian", "Obsidian merino beanie"),
      shot("photo-1576871337632-b9aef4c17ab9", "Obsidian", "Beanie detail"),
      shotPexels(4992944, "Bone", "Bone merino beanie"),
      shot("photo-1489987707025-afc232f7ea0f", "Bone", "Light beanie portrait"),
    ],
    variants: buildVariants("p10", ["Obsidian", "Bone"], { "Bone|L": 3 }),
    tags: ["cold", "snow", "city"],
    completeTheLook: ["obsidian-shell-parka", "helix-insulation-jacket", "voltage-knit-crew"],
    dropLabel: "Core",
    createdAt: "2026-05-11T10:00:00.000Z",
  },
  ...FLOOR_DRAFTS,
];

const floorReviewRows: Review[] = FLOOR_DRAFTS.flatMap((draft, index) => [
  review(draft.id, `rv_${draft.id}_a`, "Floor Client", 5, "Matte, quiet, and exact — uniform quality.", "Runs true to size", true, "2026-09-01"),
  review(draft.id, `rv_${draft.id}_b`, "Atelier Guest", index % 3 === 0 ? 4 : 5, "True to the drop. Would buy again.", "Runs true to size", index % 2 === 0, "2026-08-20"),
]);

const reviewRows: Review[] = [
  review("p1", "rv1", "Mina Albrecht", 5, "The shell sheds a Tokyo downpour and still looks like tailoring. Hood stows clean.", "Runs true to size", true, "2026-09-12"),
  review("p1", "rv2", "Jonas Hale", 5, "Matte hardware, no logo, real membrane. Size M is the last honest fit in this category.", "Runs true to size", true, "2026-09-18"),
  review("p1", "rv3", "Imani Brooks", 4, "Beautiful shoulder. I sized up for a knit underneath and it still looked sharp.", "Runs small", true, "2026-09-22"),
  review("p2", "rv4", "Leo March", 5, "Cargos without the costume. The taper is exact and the pockets stay flat.", "Runs true to size", true, "2026-09-09"),
  review("p2", "rv5", "Sara Nguyen", 4, "Ink color is deeper than the photo. True through the thigh.", "Runs true to size", true, "2026-08-30"),
  review("p2", "rv6", "Chris Adel", 5, "Wore them on a red-eye under the vest. No shine, no noise.", "Runs true to size", false, "2026-09-01"),
  review("p3", "rv7", "Elena Voss", 5, "The voltage dye is adult. Merino that does not itch and does not bag.", "Runs true to size", true, "2026-09-04"),
  review("p3", "rv8", "Marcus Pell", 4, "Graphite is the one I live in. Collar stays upright.", "Runs true to size", true, "2026-08-22"),
  review("p3", "rv9", "Noor Elian", 5, "Layered under Nightfall for a week in Oslo. Still the right weight.", "Runs small", true, "2026-09-15"),
  review("p4", "rv10", "Helen Cho", 5, "Limited feels real. The sling pocket is the entire point of the vest.", "Runs true to size", true, "2026-09-19"),
  review("p4", "rv11", "Andre Silva", 5, "Night color disappears in a doorway. L was the last piece and it fits.", "Runs true to size", true, "2026-09-21"),
  review("p4", "rv12", "Priya Raman", 4, "Ash photographs lighter than it wears. Still the cleanest vest I own.", "Runs large", true, "2026-09-11"),
  review("p5", "rv13", "Owen Blake", 5, "Heavy enough to hold a shape. Bone stays bone after three washes.", "Runs true to size", true, "2026-07-02"),
  review("p5", "rv14", "Camille Orth", 4, "Collar height is the detail. True to size on me.", "Runs true to size", true, "2026-08-14"),
  review("p5", "rv15", "Jules Hart", 5, "The black one sold through in XL, which tells you what you need to know.", "Runs small", false, "2026-09-03"),
  review("p6", "rv16", "Freya Lind", 5, "Wet platforms, dry socks. The last is slimmer than a hiking boot and better for it.", "Runs true to size", true, "2026-09-06"),
  review("p6", "rv17", "Nico Alvarez", 5, "Glacier color is a weapon with the bone tee. Grip is serious.", "Runs true to size", true, "2026-08-19"),
  review("p6", "rv18", "Amina Dar", 4, "Break-in took two days. After that, all city.", "Runs small", true, "2026-09-16"),
  review("p7", "rv19", "Rae Kim", 5, "Four and a half liters and it vanishes under the parka. Lime lining is a private joke.", "Runs true to size", true, "2026-09-10"),
  review("p7", "rv20", "Tomás Ferreira", 4, "Strap length is generous. Hardware stays matte.", "Runs true to size", true, "2026-09-13"),
  review("p7", "rv21", "Lila Berg", 5, "Passport, phone, lens. Nothing else fits, which is the design.", "Runs true to size", false, "2026-08-29"),
  review("p8", "rv22", "Soren Adey", 5, "Packs into the pocket and still looks like a coat when it is on. Ceramic is worth the offset.", "Runs true to size", true, "2026-09-17"),
  review("p8", "rv23", "Maya Chen", 5, "Wore Ink over the knit in sleet. Warm, quiet, no puff.", "Runs true to size", true, "2026-09-20"),
  review("p8", "rv24", "Evan Ross", 4, "Hood is optional and better for it. True through the chest.", "Runs large", true, "2026-09-07"),
  review("p9", "rv25", "Gina Morales", 5, "The track pant for people who hate track pants. No stripe, real drape.", "Runs true to size", true, "2026-08-11"),
  review("p9", "rv26", "Paul Ike", 4, "Stone pairs with the bone tee as if they were cut together.", "Runs true to size", true, "2026-09-02"),
  review("p9", "rv27", "Hana Ito", 5, "Flight pant. Wrinkle resistant, not shiny.", "Runs true to size", true, "2026-07-28"),
  review("p10", "rv28", "Omar Said", 5, "Short cuff, dense knit, stays under the hood. This is the one.", "Runs true to size", true, "2026-09-05"),
  review("p10", "rv29", "Bea Lorne", 5, "Bone dye matches the tee. Small object, exact.", "Runs true to size", true, "2026-08-18"),
  review("p10", "rv30", "Victor Lang", 4, "Obsidian is nearly black. Fits a larger head in L.", "Runs small", false, "2026-09-14"),
  ...floorReviewRows,
];

function withRatings(draft: Draft): Product {
  const reviews = reviewRows.filter((row) => row.productId === draft.id);
  const rating = reviews.length ? reviews.reduce((sum, row) => sum + row.rating, 0) / reviews.length : 4.8;
  return {
    ...draft,
    hidden: false,
    reviews,
    reviewsCount: reviews.length,
    rating: Math.round(rating * 10) / 10,
  };
}

export const PRODUCTS: Product[] = drafts.map(withRatings);

export function getProduct(slug: string) {
  return PRODUCTS.find((product) => product.slug === slug) ?? null;
}

export function imageFor(product: Product, color?: string) {
  const url =
    product.images.find((image) => image.color === color)?.url ??
    product.images[0]?.url ??
    placeholderForProduct(product.id);
  return url || placeholderForProduct(product.id);
}

export function imageCandidates(product: Product, color?: string): string[] {
  const ordered = [
    product.images.find((image) => image.color === color)?.url,
    ...product.images.map((image) => image.url),
  ];
  return [...new Set(ordered.filter(Boolean))] as string[];
}

export function createCustomProduct(input: {
  title: string;
  category: Category;
  priceCents: number;
  compareAtCents: number | null;
  description: string;
  imageUrl: string;
  color: string;
  stock: number;
}): Product {
  const id = `custom-${Math.random().toString(36).slice(2, 8)}`;
  const slugBase = input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "piece";
  const color = input.color.trim() || "Obsidian";
  return {
    id,
    title: input.title.trim(),
    slug: `${slugBase}-${id.slice(-4)}`,
    description: input.description.trim() || "Atelier addition.",
    story: input.description.trim() || "Added from the command center.",
    category: input.category,
    priceCents: input.priceCents,
    compareAtCents: input.compareAtCents,
    featured: false,
    hidden: false,
    rating: 0,
    reviewsCount: 0,
    materials: ["Atelier specified"],
    specs: [{ label: "SKU family", value: id.toUpperCase() }],
    colors: [{ name: color, hex: "#D4FF00" }],
    images: [{ url: input.imageUrl, color, alt: input.title }],
    variants: buildVariants(id, [color], Object.fromEntries(SIZES.map((size) => [`${color}|${size}`, input.stock]))),
    reviews: [],
    tags: ["city"],
    completeTheLook: [],
    dropLabel: "Atelier",
    createdAt: new Date().toISOString(),
  };
}
