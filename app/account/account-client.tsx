"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Factor = { id: string; factor_type: string; friendly_name?: string | null };

export default function AccountClient() {
  const supabase = createClient();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.all ?? []) as Factor[]);
  }
  useEffect(() => {
    load();
  }, []);

  async function enrollPasskey() {
    setBusy(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.mfa.enroll({
        factorType: "webauthn",
        friendlyName: `Passkey ${new Date().toLocaleDateString()}`,
      } as Parameters<typeof supabase.auth.mfa.enroll>[0]);
      if (error) throw error;
      setMsg("Passkey enrolled.");
      await load();
    } catch (e) {
      setMsg((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function unenroll(id: string) {
    setBusy(true);
    await supabase.auth.mfa.unenroll({ factorId: id });
    await load();
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-xl mx-auto px-4 py-8 sm:py-12 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Account</h1>
          <Link href="/" className="text-sm hover:underline">
            ← Back
          </Link>
        </div>

        <section className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Passkeys</h2>
            <button
              onClick={enrollPasskey}
              disabled={busy}
              className="text-sm px-3 py-1.5 rounded-md bg-black text-white dark:bg-white dark:text-black disabled:opacity-50"
            >
              Add passkey
            </button>
          </div>
          <ul className="text-sm divide-y divide-neutral-200 dark:divide-neutral-800">
            {factors.length === 0 && (
              <li className="py-2 text-neutral-500">No passkeys yet.</li>
            )}
            {factors.map((f) => (
              <li key={f.id} className="flex items-center justify-between py-2">
                <span>
                  {f.friendly_name || f.factor_type}{" "}
                  <span className="text-neutral-400">({f.factor_type})</span>
                </span>
                <button
                  onClick={() => unenroll(f.id)}
                  disabled={busy}
                  className="text-xs text-neutral-500 hover:text-red-600"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          {msg && <p className="text-sm text-neutral-600">{msg}</p>}
        </section>
      </div>
    </main>
  );
}
