import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TodosApp from "./todos-app";
import StreakBanner from "./streak-banner";
import SignOutButton from "./sign-out-button";
import type { Group, Streak, Todo, TodoCheck } from "@/lib/types";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [todosRes, groupsRes, checksRes, streakRes] = await Promise.all([
    supabase
      .from("todos")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("groups").select("*").order("created_at"),
    supabase.from("todo_checks").select("*"),
    user
      ? supabase
          .from("user_streaks")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const todos = (todosRes.data ?? []) as Todo[];
  const groups = (groupsRes.data ?? []) as Group[];
  const checks = (checksRes.data ?? []) as TodoCheck[];
  const streak = (streakRes.data ?? null) as Streak | null;

  return (
    <main className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-6 sm:py-10 space-y-5">
        <header className="flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo />
            <div className="leading-tight">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Ember
              </h1>
              <p className="text-[11px] text-[color:var(--muted)] -mt-0.5">
                small fires, kept lit
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            {user ? (
              <>
                <Link
                  href="/account"
                  className="hidden sm:inline-block text-[color:var(--muted)] hover:text-[color:var(--foreground)] truncate max-w-[180px]"
                >
                  {user.email ?? "Account"}
                </Link>
                <Link
                  href="/account"
                  className="sm:hidden inline-flex items-center justify-center size-9 rounded-full bg-[color:var(--surface)] border border-[color:var(--border)]"
                  aria-label="Account"
                >
                  {(user.email ?? "?").slice(0, 1).toUpperCase()}
                </Link>
                <SignOutButton />
              </>
            ) : (
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] hover:opacity-90 transition-opacity text-sm font-medium"
              >
                Sign in
              </Link>
            )}
          </div>
        </header>

        {user && <StreakBanner streak={streak} />}

        {!user && (
          <div className="rounded-xl border border-dashed border-[color:var(--border)] bg-[color:var(--surface)]/60 backdrop-blur px-4 py-3 text-sm text-[color:var(--muted)]">
            You’re browsing as a guest.{" "}
            <Link href="/login" className="text-[color:var(--accent)] underline-offset-2 hover:underline">
              Sign in
            </Link>{" "}
            to add, check, and prioritize todos.
          </div>
        )}

        <TodosApp
          initialTodos={todos}
          initialGroups={groups}
          initialChecks={checks}
          currentUserId={user?.id ?? null}
        />

        <p className="text-[11px] text-[color:var(--muted)] text-center pt-2">
          Tip: swipe right to bump priority · swipe left to delete · Ctrl+Z to undo
        </p>
      </div>
    </main>
  );
}

function Logo() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 34 34"
      className="drop-shadow-[0_0_8px_rgba(251,191,36,0.4)] transition-transform group-hover:rotate-[-4deg]"
    >
      <defs>
        <radialGradient id="logoFlame" cx="50%" cy="65%" r="60%">
          <stop offset="0%" stopColor="#fff7d6" />
          <stop offset="45%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#ea580c" />
        </radialGradient>
      </defs>
      <rect x="11" y="20" width="12" height="9" rx="2" fill="#f59e0b" opacity="0.85" />
      <rect x="9" y="28" width="16" height="3" rx="1.5" fill="#92400e" opacity="0.6" />
      <line x1="17" y1="17" x2="17" y2="21" stroke="#3f2a14" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 4 C 11 12, 10 17, 17 22 C 24 17, 23 12, 17 4 Z" fill="url(#logoFlame)" />
    </svg>
  );
}
