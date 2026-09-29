import { NextResponse } from "next/server";

import { countProductsInDatabase, isDatabaseConfigured, isMysqlUrl, query } from "@/lib/db";



export const dynamic = "force-dynamic";



/** Lightweight DB catalog snapshot (slug + inventory). Falls back when DATABASE_URL is unset. */

export async function GET() {

  if (!isDatabaseConfigured()) {

    return NextResponse.json({ ok: false, mode: "standby", products: [] });

  }

  try {

    const mysql = isMysqlUrl();

    const rows = await query<{

      id: string;

      slug: string;

      title: string;

      category: string;

      price_cents: number;

      inventory: number | null;

    }>(

      mysql

        ? `SELECT p.id, p.slug, p.title, p.category, p.price_cents,

            (SELECT SUM(inventory_count) FROM product_variants v WHERE v.product_id = p.id) AS inventory

           FROM products p ORDER BY p.title`

        : `SELECT p.id, p.slug, p.title, p.category, p.price_cents,

            (SELECT COALESCE(SUM(inventory_count), 0) FROM product_variants v WHERE v.product_id = p.id) AS inventory

           FROM products p ORDER BY p.title`,

    );

    return NextResponse.json({

      ok: true,

      mode: "database",

      count: await countProductsInDatabase(),

      products: rows.map((row) => ({

        id: String(row.id),

        slug: String(row.slug),

        title: String(row.title),

        category: String(row.category),

        priceCents: Number(row.price_cents),

        inventory: Number(row.inventory ?? 0),

      })),

    });

  } catch (error) {

    const message = error instanceof Error ? error.message : "Query failed";

    return NextResponse.json({ ok: false, mode: "error", reason: message, products: [] }, { status: 500 });

  }

}

