import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/adminAuth";
import { getMemory } from "@/lib/serverStore";
import type { ProductOverride } from "@/lib/types";

export async function PATCH(request: Request) {
  const denied = assertAdmin();
  if (denied) return denied;
  const body = (await request.json()) as { productId?: string; patch?: ProductOverride };
  if (!body.productId || !body.patch) return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  const current = getMemory().overrides[body.productId] ?? {};
  getMemory().overrides[body.productId] = {
    ...current,
    ...body.patch,
    inventory: { ...current.inventory, ...body.patch.inventory },
  };
  return NextResponse.json({ ok: true });
}
