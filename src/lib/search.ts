import type { Product } from "./types";

function subsequenceScore(token: string, haystack: string) {
  let index = 0;
  for (const char of haystack) {
    if (char === token[index]) index += 1;
    if (index === token.length) return 8;
  }
  return 0;
}

export function searchProducts(query: string, products: Product[]) {
  const q = query.trim().toLowerCase();
  const visible = products.filter((product) => !product.hidden);
  if (!q) return visible.slice(0, 8);
  const tokens = q.split(/\s+/).filter(Boolean);
  return visible
    .map((product) => {
      const title = product.title.toLowerCase();
      const hay = [
        product.title,
        product.category,
        product.description,
        product.dropLabel,
        product.tags.join(" "),
        product.colors.map((color) => color.name).join(" "),
        product.materials.join(" "),
      ]
        .join(" ")
        .toLowerCase();
      let score = 0;
      if (title === q) score += 80;
      if (title.includes(q)) score += 50;
      if (hay.includes(q)) score += 24;
      for (const token of tokens) {
        if (title.includes(token)) score += 16;
        else if (hay.includes(token)) score += 10;
        else score += subsequenceScore(token, hay);
      }
      return { product, score };
    })
    .filter((entry) => entry.score > 8)
    .sort((a, b) => b.score - a.score || a.product.title.localeCompare(b.product.title))
    .map((entry) => entry.product);
}
