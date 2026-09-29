export function encodeShare(ids: string[]) {
  const b64 = btoa(ids.join(","));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function decodeShare(code: string) {
  try {
    const pad = code.length % 4 === 0 ? "" : "=".repeat(4 - (code.length % 4));
    const b64 = code.replace(/-/g, "+").replace(/_/g, "/") + pad;
    return atob(b64)
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}
