import type { Product } from "./types";

export interface StylistResult {
  text: string;
  slugs: string[];
}

const TAG_RULES: { keys: string[]; tags: string[] }[] = [
  { keys: ["rain", "storm", "wet", "waterproof", "drizzle"], tags: ["rain", "waterproof"] },
  { keys: ["cold", "winter", "snow", "freeze", "alpine"], tags: ["cold", "snow"] },
  { keys: ["heat", "hot", "summer", "humid"], tags: ["heat"] },
  { keys: ["night", "dinner", "evening", "gala"], tags: ["night"] },
  { keys: ["travel", "flight", "trip", "airport", "commute"], tags: ["travel"] },
  { keys: ["city", "tokyo", "paris", "london", "seoul", "oslo", "berlin"], tags: ["city"] },
];

function budgetCents(message: string) {
  const match = message.match(/(?:under|below|budget|less than)\s*\$?\s*(\d[\d,]*)/i) || message.match(/\$\s*(\d[\d,]*)/);
  if (!match) return null;
  const amount = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100);
}

function scoreProduct(product: Product, message: string) {
  let score = product.featured ? 2 : 0;
  score += product.rating;
  for (const rule of TAG_RULES) {
    if (rule.keys.some((key) => message.includes(key))) {
      score += product.tags.filter((tag) => rule.tags.includes(tag)).length * 6;
    }
  }
  if (message.includes(product.category.toLowerCase())) score += 4;
  for (const token of message.split(/\W+/)) {
    if (token.length > 3 && product.title.toLowerCase().includes(token)) score += 5;
  }
  return score;
}

function placeName(message: string) {
  const places = ["tokyo", "paris", "london", "seoul", "oslo", "berlin", "new york", "los angeles", "copenhagen"];
  return places.find((place) => message.includes(place));
}

export function styleOutfit(message: string, products: Product[]): StylistResult {
  const q = message.toLowerCase();
  const live = products.filter((product) => !product.hidden);
  const budget = budgetCents(q);
  const ranked = [...live].sort((a, b) => scoreProduct(b, q) - scoreProduct(a, q));
  const pool = budget ? ranked.filter((product) => product.priceCents <= budget) : ranked;
  const wantsOutfit = /outfit|look|layer|uniform|kit/.test(q);
  const picks: Product[] = [];

  if (wantsOutfit) {
    const order = ["Outerwear", "Layering", "Tops", "Knits", "Bottoms", "Footwear", "Objects", "Accessories", "Headwear"] as const;
    let spent = 0;
    for (const category of order) {
      const next = pool.find((product) => product.category === category && !picks.includes(product));
      if (!next) continue;
      if (budget && spent + next.priceCents > budget) continue;
      picks.push(next);
      spent += next.priceCents;
      if (picks.length === 3) break;
    }
  }

  if (!picks.length) {
    for (const product of pool) {
      if (picks.length === 3) break;
      picks.push(product);
    }
  }

  const place = placeName(q);
  const placeTitle = place ? place.replace(/\b\w/g, (char) => char.toUpperCase()) : "";
  const where = placeTitle ? ` in ${placeTitle}` : "";
  const overBudgetHits = budget
    ? ranked.filter((product) => product.priceCents > budget && scoreProduct(product, q) >= 8).slice(0, 1)
    : [];

  if (!picks.length) {
    const nearest = [...live].sort((a, b) => a.priceCents - b.priceCents).slice(0, 2);
    return {
      text: "The floor is empty for that brief. These are the closest cuts still in the atelier.",
      slugs: nearest.map((product) => product.slug),
    };
  }

  const names = picks.map((product) => product.title).join(", ");
  let text = placeTitle
    ? `For ${placeTitle}${budget ? " under your ceiling" : ""}, I would wear ${names}.`
    : `Start with ${names}.`;

  if (overBudgetHits.length) {
    text = `${overBudgetHits[0].title} is the material match, and it sits above the budget. Under the ceiling I would wear ${names}.`;
  } else if (/rain|storm|wet/.test(q)) {
    text = `Rain brief${where}: ${names}. Shells first, then a quiet layer underneath.`;
  } else if (/cold|snow|winter/.test(q)) {
    text = `Cold-weather uniform${where}: ${names}. Insulation where the wind hits, matte cloth everywhere else.`;
  }

  return { text, slugs: picks.map((product) => product.slug) };
}
