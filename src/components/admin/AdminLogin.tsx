"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useCommerce } from "@/context/CommerceProvider";

export function AdminLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const { adoptAdmin } = useCommerce();
  const [email, setEmail] = useState("admin@valence.studio");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="shell grid min-h-[70vh] place-items-center py-16">
      <form
        className="w-full max-w-md border border-white/10 bg-ink p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError(null);
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = (await response.json()) as { error?: string };
          setBusy(false);
          if (!response.ok) {
            setError(data.error ?? "Access denied.");
            return;
          }
          adoptAdmin();
          router.push(params.get("next") || "/admin");
          router.refresh();
        }}
      >
        <p className="eyebrow">Restricted</p>
        <h1 className="mt-3 font-display text-4xl tracking-[-0.04em]">Command center</h1>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-white/45">admin@valence.studio · valence-admin</p>
        <input className="field mt-6" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <input className="field mt-3" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" />
        {error ? <p className="mt-3 text-sm text-red-200">{error}</p> : null}
        <button type="submit" className="btn-lime mt-4 w-full" disabled={busy}>{busy ? "Checking" : "Enter"}</button>
      </form>
    </div>
  );
}
