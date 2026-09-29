import "server-only";

const MAX_JSON_BYTES = 256_000;

export async function readJsonBody<T>(request: Request): Promise<T | null> {
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_JSON_BYTES) return null;
  try {
    const raw = await request.text();
    if (raw.length > MAX_JSON_BYTES) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function sanitizeEmail(value: unknown) {
  const email = String(value ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 254);
  if (!email.includes("@") || email.length < 5) return null;
  return email;
}
