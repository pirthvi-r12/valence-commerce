import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnvLocal, mysqlSslOptions, resolveDatabaseUrl } from "./database-url.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnvLocal(root);

const url = resolveDatabaseUrl();
if (!url) {
  console.error("Database not configured.");
  process.exit(1);
}

const tables = ["users", "products", "product_images", "product_variants", "orders", "coupons", "wishlists"];

const mysql2 = await import("mysql2/promise");
const connection = await mysql2.createConnection({
  uri: url,
  ssl: mysqlSslOptions(process.env, url),
  connectTimeout: 15000,
});
try {
  const [ping] = await connection.query("SELECT 1 AS ok");
  const tableCounts = {};
  for (const table of tables) {
    const [rows] = await connection.query(`SELECT COUNT(*) AS c FROM \`${table.replace(/`/g, "")}\``);
    tableCounts[table] = Number(rows[0]?.c ?? 0);
  }
  console.log(
    JSON.stringify({ ok: true, ping, database: process.env.DB_NAME, host: process.env.DB_HOST, tables: tableCounts }, null, 2),
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  await connection.end();
}
