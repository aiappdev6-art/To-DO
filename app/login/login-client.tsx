"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Mode = "idle" | "otp-sent" | "loading" | "error";

export default function LoginClient() {
  const supabase = createClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [mode, setMode] = useState<Mode>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setMode("loading");
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) {
      setMode("error");
      setMessage(error.message);
      return;
    }
    setMode("otp-sent");
    setMessage("Check your email for a 6-digit code.");
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setMode("loading");
    setMessage(null);
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error) {
      setMode("error");
      setMessage(error.message);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  async function signInWithGoogle() {
    setMode("loading");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setMode("error");
      setMessage(error.message);
    }
  }

  async function signInWithPasskey() {
    setMode("loading");
    setMessage(null);
    try {
      // Requires a current session. If you've enrolled a passkey
      // (factorType: 'webauthn') while signed in, you can re-verify here.
      const { data: factors, error: lf } =
        await supabase.auth.mfa.listFactors();
      if (lf) throw lf;
      const passkey = factors?.all?.find(
        (f) => (f as { factor_type: string }).factor_type === "webauthn"
      );
      if (!passkey) {
        throw new Error(
          "No passkey found. Sign in first, then enroll a passkey on the Account page."
        );
      }
      const { data: ch, error: ce } = await supabase.auth.mfa.challenge({
        factorId: passkey.id,
      });
      if (ce) throw ce;
      const { error: ve } = await supabase.auth.mfa.verify({
        factorId: passkey.id,
        challengeId: ch.id,
        code: "",
      });
      if (ve) throw ve;
      router.replace("/");
      router.refresh();
    } catch (err) {
      setMode("error");
      setMessage((err as Error).message);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold text-center">Sign in</h1>

        {mode !== "otp-sent" ? (
          <form onSubmit={sendOtp} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
            />
            <button
              type="submit"
              disabled={(mode as Mode) === "loading"}
              className="w-full py-2 rounded-md bg-black text-white dark:bg-white dark:text-black disabled:opacity-50"
            >
              Continue with email
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-3">
            <input
              inputMode="numeric"
              required
              placeholder="6-digit code"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 tracking-widest text-center"
            />
            <button
              type="submit"
              disabled={(mode as Mode) === "loading"}
              className="w-full py-2 rounded-md bg-black text-white dark:bg-white dark:text-black disabled:opacity-50"
            >
              Verify code
            </button>
            <button
              type="button"
              onClick={() => setMode("idle")}
              className="w-full text-sm text-neutral-500 hover:underline"
            >
              Use a different email
            </button>
          </form>
        )}

        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <div className="h-px bg-neutral-300 dark:bg-neutral-700 flex-1" />
          or
          <div className="h-px bg-neutral-300 dark:bg-neutral-700 flex-1" />
        </div>

        <div className="space-y-2">
          <button
            onClick={signInWithGoogle}
            className="w-full py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
          >
            Continue with Google
          </button>
          <button
            onClick={signInWithPasskey}
            className="w-full py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
          >
            Sign in with passkey
          </button>
        </div>

        {message && (
          <p
            className={`text-sm text-center ${
              mode === "error" ? "text-red-600" : "text-neutral-600"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </main>
  );
}
