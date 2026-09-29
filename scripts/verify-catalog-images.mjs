import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = ["src/lib/catalog.ts", "src/lib/catalog-floor.ts", "src/lib/product-media.ts"];
const text = files.map((f) => fs.readFileSync(path.join(root, f), "utf8")).join("\n");

const unsplash = [...text.matchAll(/photo-[a-z0-9-]+/g)].map((m) => m[0]);
const pexels = [...text.matchAll(/\bp\((\d+)\)/g)].map((m) => Number(m[1]));

const unsUnique = [...new Set(unsplash)];
const pexUnique = [...new Set(pexels)];

async function ok(url) {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: { "User-Agent": "VALENCE-catalog-verify/1.0" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

const bad = [];
for (const id of unsUnique) {
  const url = `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=80`;
  if (!(await ok(url))) bad.push({ type: "unsplash", id, url });
}
for (const id of pexUnique) {
  const url = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;
  if (!(await ok(url))) bad.push({ type: "pexels", id, url });
}

console.log(JSON.stringify({ checked: { unsplash: unsUnique.length, pexels: pexUnique.length }, bad }, null, 2));
process.exit(bad.length ? 1 : 0);
