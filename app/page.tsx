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
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-xl mx-auto px-4 py-6 sm:py-10 space-y-4">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Todos</h1>
          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <>
                <Link
                  href="/account"
                  className="text-neutral-600 dark:text-neutral-400 hover:underline truncate max-w-[140px] sm:max-w-none"
                >
                  {user.email ?? "Account"}
                </Link>
                <SignOutButton />
              </>
            ) : (
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-md bg-black text-white dark:bg-white dark:text-black"
              >
                Sign in
              </Link>
            )}
          </div>
        </header>

        {user && <StreakBanner streak={streak} />}

        {!user && (
          <div className="text-xs text-neutral-500 px-3 py-2 rounded-md border border-dashed border-neutral-300 dark:border-neutral-700">
            You’re browsing as a guest. Sign in to add, check, and prioritize todos.
          </div>
        )}

        <TodosApp
          initialTodos={todos}
          initialGroups={groups}
          initialChecks={checks}
          currentUserId={user?.id ?? null}
        />

        <p className="text-[11px] text-neutral-400 text-center pt-2">
          Tip: swipe right to bump priority, swipe left to delete.
          Ctrl+Z to undo.
        </p>
      </div>
    </main>
  );
}
