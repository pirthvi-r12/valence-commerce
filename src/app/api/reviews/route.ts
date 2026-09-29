import { NextResponse } from "next/server";
import { isDatabaseConfigured, persistReview } from "@/lib/db";
import { getMemory } from "@/lib/serverStore";
import type { Review } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as { review?: Review };
  const review = body.review;
  if (!review?.productId || !review.comment || review.rating < 1 || review.rating > 5) {
    return NextResponse.json({ error: "Invalid review" }, { status: 400 });
  }
  getMemory().reviews.unshift(review);
  if (isDatabaseConfigured()) {
    try {
      await persistReview(review);
    } catch {
      // keep in-memory review if DB schema is behind
    }
  }
  return NextResponse.json({ ok: true, review });
}
