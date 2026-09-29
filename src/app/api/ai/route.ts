import { NextResponse } from "next/server";
import { PRODUCTS } from "@/lib/catalog";
import { readJsonBody } from "@/lib/request-guard";
import { styleOutfit } from "@/lib/stylist";

export async function POST(request: Request) {
  const body = await readJsonBody<{ message?: string }>(request);
  if (!body) return NextResponse.json({ error: "Payload too large or invalid" }, { status: 413 });
  const message = String(body.message ?? "").slice(0, 500);
  const key = process.env.OPENAI_API_KEY;
  if (key) {
    try {
      const catalog = PRODUCTS.map((product) => ({
        slug: product.slug,
        title: product.title,
        category: product.category,
        price: product.priceCents / 100,
        tags: product.tags,
      }));
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You are the VALENCE shopping stylist. Reply with JSON {\"text\": string, \"slugs\": string[]} using only the provided slugs. Keep text under 60 words." },
            { role: "user", content: JSON.stringify({ message, catalog }) },
          ],
        }),
      });
      const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
      const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as { text?: string; slugs?: string[] };
      if (parsed.text && Array.isArray(parsed.slugs)) return NextResponse.json({ text: parsed.text, slugs: parsed.slugs });
    } catch {
      // The local stylist still answers.
    }
  }
  return NextResponse.json(styleOutfit(message, PRODUCTS));
}
