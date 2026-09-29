import fs from "node:fs";
import path from "node:path";

/** Shared DATABASE_URL resolution (matches src/lib/db.ts). */
export function resolveDatabaseUrl(env = process.env) {
  const direct = env.DATABASE_URL?.trim();
  if (direct) return direct;

  const host = env.DB_HOST?.trim();
  const user = env.DB_USER?.trim();
  const database = env.DB_NAME?.trim();
  if (!host || !user || !database) return "";

  const port = env.DB_PORT?.trim() || "3306";
  const password = env.DB_PASSWORD ?? "";
  return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

export function isMysqlUrl(url) {
  return url.startsWith("mysql://") || url.startsWith("mysqls://");
}

/** Matches src/lib/db.ts sslOptions for mysql2. */
export function mysqlSslOptions(env = process.env, url = resolveDatabaseUrl(env)) {
  if (env.DB_SSL?.trim().toLowerCase() === "true") {
    return { rejectUnauthorized: true };
  }
  if (!url) return undefined;
  const local = /localhost|127\.0\.0\.1/i.test(url);
  const requiresSsl = /sslmode=require|ssl=true/i.test(url) || !local;
  if (!requiresSsl) return undefined;
  return { rejectUnauthorized: true };
}

export function loadEnvLocal(root) {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}
