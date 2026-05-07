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
    "w-full px-3.5 py-2.5 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] outline-none focus:border-[color:var(--accent)] transition-colors";
  const primaryBtn =
    "w-full py-2.5 rounded-xl bg-[color:var(--foreground)] text-[color:var(--background)] font-medium hover:opacity-90 disabled:opacity-50 transition-opacity";
  const secondaryBtn =
    "w-full py-2.5 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] hover:border-[color:var(--accent)] transition-colors";

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div
            className="size-14 rounded-2xl flex items-center justify-center"
            style={{
              background:
                "radial-gradient(120% 120% at 50% 0%, rgba(251,191,36,0.35), transparent 60%)",
              filter: "drop-shadow(0 0 18px rgba(251,191,36,0.45))",
            }}
          >
            <svg width="42" height="42" viewBox="0 0 34 34">
              <defs>
                <radialGradient id="loginFlame" cx="50%" cy="65%" r="60%">
                  <stop offset="0%" stopColor="#fff7d6" />
                  <stop offset="45%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#ea580c" />
                </radialGradient>
              </defs>
              <path d="M17 4 C 11 12, 10 17, 17 22 C 24 17, 23 12, 17 4 Z" fill="url(#loginFlame)" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-center">
            Welcome to Ember
          </h1>
          <p className="text-sm text-[color:var(--muted)] text-center -mt-1">
            small fires, kept lit
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-full bg-[color:var(--surface-2)] border border-[color:var(--border)] text-sm">
          <button
            onClick={() => {
              setTab("otp");
              setMode("idle");
              setMessage(null);
            }}
            className={`flex-1 py-1.5 rounded-full transition-colors ${
              tab === "otp"
                ? "bg-[color:var(--surface)] shadow-sm font-medium"
                : "text-[color:var(--muted)]"
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
            className={`flex-1 py-1.5 rounded-full transition-colors ${
              tab === "password"
                ? "bg-[color:var(--surface)] shadow-sm font-medium"
                : "text-[color:var(--muted)]"
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

        <div className="flex items-center gap-3 text-[11px] text-[color:var(--muted)] uppercase tracking-widest">
          <div className="h-px bg-[color:var(--border)] flex-1" />
          or
          <div className="h-px bg-[color:var(--border)] flex-1" />
        </div>

        <div className="space-y-2">
          <button
            onClick={signInWithGoogle}
            className={`${secondaryBtn} flex items-center justify-center gap-2`}
          >
            <GoogleIcon /> Continue with Google
          </button>
          <button
            onClick={signInWithPasskey}
            className={`${secondaryBtn} flex items-center justify-center gap-2`}
          >
            <KeyIcon /> Sign in with passkey
          </button>
        </div>

        {message && (
          <p
            className={`text-sm text-center ${
              mode === "error"
                ? "text-rose-600 dark:text-rose-400"
                : "text-[color:var(--muted)]"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.63z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.83.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.96 10.71A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.46 3.44 1.35l2.58-2.58A8.97 8.97 0 0 0 9 0 9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

function KeyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="11" cy="5" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M9 7L3 13l1.5 1.5L6 13l1 1 1.5-1.5L7 11l1-1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
