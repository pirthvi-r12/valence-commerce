/**
 * Applies sql/valance.sql — picks [POSTGRESQL] or [MYSQL] block from DATABASE_URL or DB_* vars.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isMysqlUrl, loadEnvLocal, mysqlSslOptions, resolveDatabaseUrl } from "./database-url.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
loadEnvLocal(root);

const url = resolveDatabaseUrl();
if (!url) {
  console.error("Database not configured. Set DATABASE_URL or DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME in .env.local");
  process.exit(1);
}

const mysql = isMysqlUrl(url);
const tag = mysql ? "MYSQL" : "POSTGRESQL";
const raw = fs.readFileSync(path.join(root, "sql/valance.sql"), "utf8");
const match = raw.match(new RegExp(`-- \\[${tag}\\]([\\s\\S]*?)-- \\[/${tag}\\]`));
if (!match) {
  console.error(`Could not find -- [${tag}] section in sql/valance.sql`);
  process.exit(1);
}
const sql = match[1].trim();

if (mysql) {
  const mysql2 = await import("mysql2/promise");
  const ssl = mysqlSslOptions(process.env, url);
  const dbName = process.env.DB_NAME?.trim();
  const host = process.env.DB_HOST?.trim() || "127.0.0.1";
  const isLocal = /localhost|127\.0\.0\.1/i.test(host);

  if (dbName && isLocal) {
    const bootstrap = await mysql2.createConnection({
      host,
      port: Number(process.env.DB_PORT?.trim() || "3306"),
      user: process.env.DB_USER?.trim() || "root",
      password: process.env.DB_PASSWORD ?? "",
      multipleStatements: true,
      ssl,
      connectTimeout: 15000,
    });
    try {
      await bootstrap.query(
        `CREATE DATABASE IF NOT EXISTS \`${dbName.replace(/`/g, "")}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
      );
      console.log(`Ensured database "${dbName}" exists.`);
    } finally {
      await bootstrap.end();
    }
  }

  const connection = await mysql2.createConnection({
    uri: url,
    multipleStatements: true,
    ssl,
    connectTimeout: 15000,
  });
  try {
    await connection.query(sql);
    console.log(`Applied sql/valance.sql [${tag}] to MySQL.`);
  } finally {
    await connection.end();
  }
} else {
  const pg = await import("pg");
  const Client = pg.default?.Client ?? pg.Client;
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(sql);
    console.log(`Applied sql/valance.sql [${tag}] to PostgreSQL.`);
  } finally {
    await client.end();
  }
}
