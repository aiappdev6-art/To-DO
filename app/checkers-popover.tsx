"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { TodoCheck } from "@/lib/types";

type Props = {
  todoId: string;
  checks: TodoCheck[];
  visibleToOwner: boolean;
};

export default function CheckersPopover({
  todoId,
  checks,
  visibleToOwner,
}: Props) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [emails, setEmails] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open || !visibleToOwner) return;
    const ids = checks.map((c) => c.user_id);
    if (ids.length === 0) return;
    supabase
      .from("checker_profiles")
      .select("id,email")
      .in("id", ids)
      .then(({ data }) => {
        if (!data) return;
        const m: Record<string, string> = {};
        for (const r of data as { id: string; email: string }[]) {
          m[r.id] = r.email;
        }
        setEmails(m);
      });
  }, [open, visibleToOwner, checks, supabase, todoId]);

  if (!visibleToOwner) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[color:var(--surface-2)] text-[color:var(--muted)]">
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <path
            d="M1.5 4.5L3.5 6.5L7.5 2.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {checks.length}
      </span>
    );
  }

  return (
    <span className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[color:var(--surface-2)] text-[color:var(--muted)] hover:text-[color:var(--accent)] underline decoration-dotted underline-offset-2"
      >
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
          <path
            d="M1.5 4.5L3.5 6.5L7.5 2.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {checks.length} checked
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute z-30 left-0 top-full mt-1 w-56 max-h-56 overflow-auto rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-lg shadow-black/5 p-2 text-xs"
          >
            <div className="font-medium mb-1.5 text-[color:var(--foreground)]">
              Checked by
            </div>
            <ul className="space-y-1">
              {checks.map((c) => (
                <li
                  key={c.user_id}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate">
                    {emails[c.user_id] ?? c.user_id.slice(0, 8)}
                  </span>
                  <span className="text-[color:var(--muted)]">
                    {new Date(c.checked_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
