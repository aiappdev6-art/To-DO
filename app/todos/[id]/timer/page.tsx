import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import TimerClient from "./timer-client";
import { notFound } from "next/navigation";

export default async function TimerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: todo } = await supabase
    .from("todos")
    .select("id, task, user_id")
    .eq("id", id)
    .maybeSingle();

  if (!todo) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen">
      <div className="max-w-md mx-auto px-4 py-6 sm:py-10 space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M9 2L4 7l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back
          </Link>
          <span className="text-[10px] uppercase tracking-widest text-[color:var(--muted)]">
            Focus
          </span>
        </div>
        <div className="text-center space-y-1">
          <p className="text-[11px] uppercase tracking-widest text-[color:var(--muted)]">
            Burning for
          </p>
          <h1 className="text-2xl font-semibold break-words leading-tight">
            {todo.task}
          </h1>
        </div>
        <TimerClient todoId={todo.id} currentUserId={user?.id ?? null} />
      </div>
    </main>
  );
}
