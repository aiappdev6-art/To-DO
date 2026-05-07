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
    <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-md mx-auto px-4 py-6 sm:py-10 space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm hover:underline">
            ← Back
          </Link>
          <span className="text-xs text-neutral-500">Focus timer</span>
        </div>
        <h1 className="text-xl font-semibold break-words">{todo.task}</h1>
        <TimerClient todoId={todo.id} currentUserId={user?.id ?? null} />
      </div>
    </main>
  );
}
