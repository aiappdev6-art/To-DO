"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Mode = "idle" | "otp-sent" | "loading" | "error";
type Tab = "otp" | "password";

export default function LoginClient() {
  const supabase = createClient();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("otp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [mode, setMode] = useState<Mode>("idle");
  const [message, setMessage] = useState<string | null>(null);

  function fail(err: { message: string }) {
    setMode("error");
    setMessage(err.message);
  }

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setMode("loading");
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    if (error) return fail(error);
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
    if (error) return fail(error);
    router.replace("/");
    router.refresh();
  }

  async function signInPassword(e: React.FormEvent) {
    e.preventDefault();
    setMode("loading");
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return fail(error);
    router.replace("/");
    router.refresh();
  }

  async function signUpPassword(e: React.FormEvent) {
    e.preventDefault();
    setMode("loading");
    setMessage(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) return fail(error);
    if (data.session) {
      router.replace("/");
      router.refresh();
    } else {
      setMode("idle");
      setMessage("Check your email to confirm your account, then sign in.");
    }
  }

  async function signInWithGoogle() {
    setMode("loading");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
    if (error) fail(error);
  }

  async function signInWithPasskey() {
    setMode("loading");
    setMessage(null);
    try {
      const { data: factors, error: lf } =
        await supabase.auth.mfa.listFactors();
      if (lf) throw lf;
      const passkey = factors?.all?.find(
        (f) => (f as { factor_type: string }).factor_type === "webauthn"
      );
      if (!passkey) {
        throw new Error(
          "No passkey found. Sign in first, then enroll one on the Account page."
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
      fail(err as { message: string });
    }
  }

  const inputCls =
    "w-full px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900";
  const primaryBtn =
    "w-full py-2 rounded-md bg-black text-white dark:bg-white dark:text-black disabled:opacity-50";
  const secondaryBtn =
    "w-full py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900";

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-neutral-50 dark:bg-neutral-950">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold text-center">Sign in</h1>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-md bg-neutral-200 dark:bg-neutral-800 text-sm">
          <button
            onClick={() => {
              setTab("otp");
              setMode("idle");
              setMessage(null);
            }}
            className={`flex-1 py-1.5 rounded ${
              tab === "otp"
                ? "bg-white dark:bg-neutral-900 shadow-sm"
                : "text-neutral-600 dark:text-neutral-400"
            }`}
          >
            Email code
          </button>
          <button
            onClick={() => {
              setTab("password");
              setMode("idle");
              setMessage(null);
            }}
            className={`flex-1 py-1.5 rounded ${
              tab === "password"
                ? "bg-white dark:bg-neutral-900 shadow-sm"
                : "text-neutral-600 dark:text-neutral-400"
            }`}
          >
            Password
          </button>
        </div>

        {tab === "otp" && mode !== "otp-sent" && (
          <form onSubmit={sendOtp} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
            <button
              type="submit"
              disabled={(mode as Mode) === "loading"}
              className={primaryBtn}
            >
              Send code
            </button>
          </form>
        )}

        {tab === "otp" && mode === "otp-sent" && (
          <form onSubmit={verifyOtp} className="space-y-3">
            <input
              inputMode="numeric"
              required
              placeholder="6-digit code"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className={`${inputCls} tracking-widest text-center`}
            />
            <button
              type="submit"
              disabled={(mode as Mode) === "loading"}
              className={primaryBtn}
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

        {tab === "password" && (
          <form className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
            <div className="flex gap-2">
              <button
                onClick={signInPassword}
                disabled={(mode as Mode) === "loading"}
                className={primaryBtn}
              >
                Sign in
              </button>
              <button
                onClick={signUpPassword}
                disabled={(mode as Mode) === "loading"}
                className={secondaryBtn}
              >
                Sign up
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center gap-3 text-xs text-neutral-500">
          <div className="h-px bg-neutral-300 dark:bg-neutral-700 flex-1" />
          or
          <div className="h-px bg-neutral-300 dark:bg-neutral-700 flex-1" />
        </div>

        <div className="space-y-2">
          <button onClick={signInWithGoogle} className={secondaryBtn}>
            Continue with Google
          </button>
          <button onClick={signInWithPasskey} className={secondaryBtn}>
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
