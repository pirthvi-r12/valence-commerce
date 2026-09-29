import "server-only";
import { PRODUCTS } from "./catalog";
import { COUPONS } from "./coupons";
import type { Address, Order, OrderItem, Review } from "./types";

export type SqlRow = Record<string, unknown>;

type PgPool = import("pg").Pool;

let pgPool: PgPool | null = null;

function databaseUrlFromParts(): string {
  const host = process.env.DB_HOST?.trim();
  const user = process.env.DB_USER?.trim();
  const database = process.env.DB_NAME?.trim();
  if (!host || !user || !database) return "";
  const port = process.env.DB_PORT?.trim() || "3306";
  const password = process.env.DB_PASSWORD ?? "";
  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export function getDatabaseUrl() {
  return process.env.DATABASE_URL?.trim() || databaseUrlFromParts();
}

export function isDatabaseConfigured() {
  return getDatabaseUrl().length > 0;
}

export function isMysqlUrl(url = getDatabaseUrl()) {
  return url.startsWith("mysql://") || url.startsWith("mysqls://");
}

export function sslOptions(url = getDatabaseUrl()): { rejectUnauthorized: true } | undefined {
  if (process.env.DB_SSL?.trim().toLowerCase() === "true") {
    return { rejectUnauthorized: true };
  }
  if (!url) return undefined;
  const local = /localhost|127\.0\.0\.1/i.test(url);
  const requiresSsl = /sslmode=require|ssl=true/i.test(url) || !local;
  if (!requiresSsl) return undefined;
  return { rejectUnauthorized: true };
}

export async function query<T extends SqlRow = SqlRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  const url = getDatabaseUrl();
  if (!url) return [];

  if (isMysqlUrl(url)) {
    const mysql = await import("mysql2/promise");
    const connection = await mysql.createConnection({
      uri: url,
      ssl: sslOptions(url),
      connectTimeout: 15000,
    });
    try {
      const [rows] = await connection.query(sql, params);
      return Array.isArray(rows) ? (rows as T[]) : [];
    } finally {
      await connection.end();
    }
  }

  const { Pool } = await import("pg");
  if (!pgPool) {
    pgPool = new Pool({
      connectionString: url,
      ssl: sslOptions(url),
      connectionTimeoutMillis: 2500,
      max: 4,
    });
  }
  const result = await pgPool.query(sql, params);
  return result.rows as T[];
}

function marks(count: number, mysql: boolean, offset = 0) {
  return Array.from({ length: count }, (_, index) => (mysql ? "?" : `$${index + 1 + offset}`)).join(", ");
}

export async function seedDatabase() {
  if (!isDatabaseConfigured()) {
    return { ok: false as const, reason: "Database not configured (DATABASE_URL or DB_* in .env.local)" };
  }
  const mysql = isMysqlUrl();

  for (const coupon of COUPONS) {
    if (mysql) {
      await query(
        `INSERT INTO coupons (code, discount_percent, valid_until, active) VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE discount_percent = VALUES(discount_percent), valid_until = VALUES(valid_until), active = VALUES(active)`,
        [coupon.code, coupon.discountPercent, coupon.validUntil.slice(0, 10), coupon.active ? 1 : 0],
      );
    } else {
      await query(
        `INSERT INTO coupons (code, discount_percent, valid_until, active) VALUES ($1, $2, $3, $4)
         ON CONFLICT (code) DO UPDATE SET discount_percent = EXCLUDED.discount_percent, valid_until = EXCLUDED.valid_until, active = EXCLUDED.active`,
        [coupon.code, coupon.discountPercent, coupon.validUntil.slice(0, 10), coupon.active],
      );
    }
  }

  for (const product of PRODUCTS) {
    const values = [
      product.id,
      product.title,
      product.slug,
      product.description,
      product.category,
      product.priceCents,
      product.compareAtCents,
      product.featured,
      product.rating,
      product.reviewsCount,
      product.hidden,
      product.dropLabel,
    ];
    if (mysql) {
      await query(
        `INSERT INTO products (id, title, slug, description, category, price_cents, compare_at_price_cents, featured, rating, reviews_count, hidden, drop_label)
         VALUES (${marks(12, true)})
         ON DUPLICATE KEY UPDATE title = VALUES(title), price_cents = VALUES(price_cents), rating = VALUES(rating), reviews_count = VALUES(reviews_count), hidden = VALUES(hidden), drop_label = VALUES(drop_label)`,
        values,
      );
    } else {
      await query(
        `INSERT INTO products (id, title, slug, description, category, price_cents, compare_at_price_cents, featured, rating, reviews_count, hidden, drop_label)
         VALUES (${marks(12, false)})
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, price_cents = EXCLUDED.price_cents, rating = EXCLUDED.rating, reviews_count = EXCLUDED.reviews_count, hidden = EXCLUDED.hidden, drop_label = EXCLUDED.drop_label`,
        values,
      );
    }

    for (const [index, image] of product.images.entries()) {
      const id = `${product.id}-img-${index}`;
      if (mysql) {
        await query(
          `INSERT INTO product_images (id, product_id, image_url, sort_order, color_name) VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE image_url = VALUES(image_url), sort_order = VALUES(sort_order), color_name = VALUES(color_name)`,
          [id, product.id, image.url, index, image.color],
        );
      } else {
        await query(
          `INSERT INTO product_images (id, product_id, image_url, sort_order, color_name) VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET image_url = EXCLUDED.image_url, sort_order = EXCLUDED.sort_order, color_name = EXCLUDED.color_name`,
          [id, product.id, image.url, index, image.color],
        );
      }
    }

    for (const variant of product.variants) {
      const variantValues = [
        variant.id,
        product.id,
        variant.sku,
        variant.size,
        variant.color,
        variant.inventoryCount,
        variant.priceOffsetCents,
      ];
      if (mysql) {
        await query(
          `INSERT INTO product_variants (id, product_id, sku, size, color, inventory_count, price_offset_cents)
           VALUES (${marks(7, true)})
           ON DUPLICATE KEY UPDATE inventory_count = VALUES(inventory_count), price_offset_cents = VALUES(price_offset_cents)`,
          variantValues,
        );
      } else {
        await query(
          `INSERT INTO product_variants (id, product_id, sku, size, color, inventory_count, price_offset_cents)
           VALUES (${marks(7, false)})
           ON CONFLICT (id) DO UPDATE SET inventory_count = EXCLUDED.inventory_count, price_offset_cents = EXCLUDED.price_offset_cents`,
          variantValues,
        );
      }
    }

    for (const item of product.reviews) {
      if (mysql) {
        await query(
          `INSERT INTO reviews (id, product_id, user_name, rating, comment, verified_purchase, fit, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)`,
          [item.id, product.id, item.userName, item.rating, item.comment, item.verifiedPurchase ? 1 : 0, item.fit, item.createdAt],
        );
      } else {
        await query(
          `INSERT INTO reviews (id, product_id, user_name, rating, comment, verified_purchase, fit, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment`,
          [item.id, product.id, item.userName, item.rating, item.comment, item.verifiedPurchase, item.fit, item.createdAt],
        );
      }
    }
  }

  return { ok: true as const, products: PRODUCTS.length };
}

function parseAddress(raw: unknown): Address {
  const value = (typeof raw === "string" ? JSON.parse(raw) : raw) as Partial<Address> & { name?: string };
  return {
    id: value.id ?? "addr_db",
    name: value.name ?? "",
    line1: value.line1 ?? "",
    line2: value.line2 ?? "",
    city: value.city ?? "",
    region: value.region ?? "",
    postal: value.postal ?? "",
    country: value.country ?? "",
    phone: value.phone ?? "",
    isDefault: Boolean(value.isDefault),
  };
}

export async function persistOrder(order: Order) {
  if (!isDatabaseConfigured()) return false;
  const mysql = isMysqlUrl();
  const shippingJson = JSON.stringify(order.shippingAddress);

  if (mysql) {
    await query(
      `INSERT INTO orders (id, order_number, user_id, customer_email, customer_name, shipping_address_json, shipping_method, subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents, status, tracking_carrier, tracking_number, coupon_code, currency, fx_rate, returned, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status), tracking_carrier = VALUES(tracking_carrier), tracking_number = VALUES(tracking_number)`,
      [
        order.id,
        order.orderNumber,
        order.userId,
        order.customerEmail,
        order.customerName,
        shippingJson,
        order.shippingMethod,
        order.subtotalCents,
        order.discountCents,
        order.shippingCents,
        order.taxCents,
        order.totalCents,
        order.status,
        order.trackingCarrier,
        order.trackingNumber,
        order.coupon,
        order.currency,
        order.fxRate,
        order.returned ? 1 : 0,
        order.createdAt,
      ],
    );
  } else {
    await query(
      `INSERT INTO orders (id, order_number, user_id, customer_email, customer_name, shipping_address_json, shipping_method, subtotal_cents, discount_cents, shipping_cents, tax_cents, total_cents, status, tracking_carrier, tracking_number, coupon_code, currency, fx_rate, returned, created_at)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, tracking_carrier = EXCLUDED.tracking_carrier, tracking_number = EXCLUDED.tracking_number`,
      [
        order.id,
        order.orderNumber,
        order.userId,
        order.customerEmail,
        order.customerName,
        shippingJson,
        order.shippingMethod,
        order.subtotalCents,
        order.discountCents,
        order.shippingCents,
        order.taxCents,
        order.totalCents,
        order.status,
        order.trackingCarrier,
        order.trackingNumber,
        order.coupon,
        order.currency,
        order.fxRate,
        order.returned,
        order.createdAt,
      ],
    );
  }

  await query(mysql ? "DELETE FROM order_items WHERE order_id = ?" : "DELETE FROM order_items WHERE order_id = $1", [order.id]);

  for (const [index, item] of order.items.entries()) {
    const lineId = `${order.id}-line-${index}`;
    const lineValues = [
      lineId,
      order.id,
      item.productId,
      item.variantId,
      item.title,
      item.sku,
      item.size,
      item.color,
      item.priceCents,
      item.quantity,
      item.image,
    ];
    if (mysql) {
      await query(
        `INSERT INTO order_items (id, order_id, product_id, variant_id, title, sku, size, color, price_cents, quantity, image_url)
         VALUES (${marks(11, true)})`,
        lineValues,
      );
    } else {
      await query(
        `INSERT INTO order_items (id, order_id, product_id, variant_id, title, sku, size, color, price_cents, quantity, image_url)
         VALUES (${marks(11, false)})`,
        lineValues,
      );
    }
  }

  return true;
}

export async function fetchOrdersFromDatabase(): Promise<Order[]> {
  if (!isDatabaseConfigured()) return [];
  const mysql = isMysqlUrl();
  const orderRows = await query<SqlRow>(
    mysql ? "SELECT * FROM orders ORDER BY created_at DESC" : "SELECT * FROM orders ORDER BY created_at DESC",
  );
  if (!orderRows.length) return [];

  const ids = orderRows.map((row) => String(row.id));
  const itemRows = mysql
    ? await query<SqlRow>(`SELECT * FROM order_items WHERE order_id IN (${ids.map(() => "?").join(",")})`, ids)
    : await query<SqlRow>("SELECT * FROM order_items WHERE order_id = ANY($1::text[])", [ids]);

  const itemsByOrder = new Map<string, OrderItem[]>();
  for (const row of itemRows) {
    const orderId = String(row.order_id);
    const list = itemsByOrder.get(orderId) ?? [];
    list.push({
      productId: String(row.product_id),
      variantId: String(row.variant_id ?? ""),
      title: String(row.title),
      sku: String(row.sku ?? ""),
      size: String(row.size ?? "M") as OrderItem["size"] & string,
      color: String(row.color ?? ""),
      priceCents: Number(row.price_cents),
      quantity: Number(row.quantity),
      image: String(row.image_url ?? ""),
    });
    itemsByOrder.set(orderId, list);
  }

  return orderRows.map((row) => ({
    id: String(row.id),
    orderNumber: String(row.order_number),
    userId: row.user_id ? String(row.user_id) : null,
    customerEmail: String(row.customer_email),
    customerName: String(row.customer_name ?? ""),
    shippingAddress: parseAddress(row.shipping_address_json),
    shippingMethod: (String(row.shipping_method ?? "standard") === "express" ? "express" : "standard") as Order["shippingMethod"],
    subtotalCents: Number(row.subtotal_cents),
    discountCents: Number(row.discount_cents),
    shippingCents: Number(row.shipping_cents),
    taxCents: Number(row.tax_cents),
    totalCents: Number(row.total_cents),
    coupon: row.coupon_code ? String(row.coupon_code) : null,
    currency: String(row.currency ?? "USD") as Order["currency"],
    fxRate: Number(row.fx_rate ?? 1),
    status: String(row.status) as Order["status"],
    returned: Boolean(row.returned),
    trackingCarrier: row.tracking_carrier ? String(row.tracking_carrier) : null,
    trackingNumber: row.tracking_number ? String(row.tracking_number) : null,
    createdAt: new Date(String(row.created_at)).toISOString(),
    items: itemsByOrder.get(String(row.id)) ?? [],
  }));
}

export async function persistReview(review: Review) {
  if (!isDatabaseConfigured()) return false;
  const mysql = isMysqlUrl();
  if (mysql) {
    await query(
      `INSERT INTO reviews (id, product_id, user_name, rating, comment, verified_purchase, fit, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)`,
      [
        review.id,
        review.productId,
        review.userName,
        review.rating,
        review.comment,
        review.verifiedPurchase ? 1 : 0,
        review.fit,
        review.createdAt,
      ],
    );
  } else {
    await query(
      `INSERT INTO reviews (id, product_id, user_name, rating, comment, verified_purchase, fit, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment`,
      [
        review.id,
        review.productId,
        review.userName,
        review.rating,
        review.comment,
        review.verifiedPurchase,
        review.fit,
        review.createdAt,
      ],
    );
  }
  return true;
}

export async function countProductsInDatabase() {
  if (!isDatabaseConfigured()) return 0;
  const rows = await query<{ count: string | number }>(
    isMysqlUrl() ? "SELECT COUNT(*) AS count FROM products" : "SELECT COUNT(*)::int AS count FROM products",
  );
  return Number(rows[0]?.count ?? 0);
}
