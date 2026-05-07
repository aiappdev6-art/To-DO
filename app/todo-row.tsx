"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import type { Todo, TodoCheck } from "@/lib/types";
import CheckersPopover from "./checkers-popover";

type Props = {
  todo: Todo;
  checks: TodoCheck[];
  isOwner: boolean;
  isGuest: boolean;
  isCheckedByMe: boolean;
  onToggleCheck: () => void;
  onSetPriority: (next: number) => void;
  onDelete: () => void;
  onSetDeadline: (deadline: string | null) => void;
};

const PRIORITY_RAIL = [
  "bg-transparent",
  "bg-gradient-to-b from-yellow-300 to-amber-400",
  "bg-gradient-to-b from-orange-400 to-orange-600",
  "bg-gradient-to-b from-red-500 to-rose-700",
];

const PRIORITY_PILL = [
  "",
  "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300",
  "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
];

const SWIPE_THRESHOLD = 80;
const DELETE_THRESHOLD = 140;

export default function TodoRow({
  todo,
  checks,
  isOwner,
  isGuest,
  isCheckedByMe,
  onToggleCheck,
  onSetPriority,
  onDelete,
  onSetDeadline,
}: Props) {
  const x = useMotionValue(0);
  const [editingDeadline, setEditingDeadline] = useState(false);

  const bgRight = useTransform(
    x,
    [0, SWIPE_THRESHOLD],
    ["rgba(0,0,0,0)", "rgba(245,158,11,0.20)"]
  );
  const bgLeft = useTransform(
    x,
    [-DELETE_THRESHOLD, 0],
    ["rgba(244,63,94,0.30)", "rgba(0,0,0,0)"]
  );

  const swipeEnabled = !isGuest && isOwner;

  function handleDragEnd() {
    const dx = x.get();
    if (dx > SWIPE_THRESHOLD && isOwner) {
      onSetPriority(todo.priority + 1);
    } else if (dx < -DELETE_THRESHOLD && isOwner) {
      animate(x, -window.innerWidth, {
        duration: 0.18,
        ease: "easeIn",
        onComplete: () => onDelete(),
      });
      return;
    }
    animate(x, 0, { type: "spring", stiffness: 500, damping: 35 });
  }

  const deadlineDate = todo.deadline ? new Date(todo.deadline) : null;
  const overdue =
    deadlineDate && deadlineDate.getTime() < Date.now() && !isCheckedByMe;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
      className="relative list-none"
    >
      {/* hint backgrounds */}
      <motion.div
        style={{ backgroundColor: bgRight }}
        className="absolute inset-0 flex items-center pl-5 text-amber-700 dark:text-amber-300 text-xs font-medium pointer-events-none rounded-xl"
      >
        ▸ Priority
      </motion.div>
      <motion.div
        style={{ backgroundColor: bgLeft }}
        className="absolute inset-0 flex items-center justify-end pr-5 text-rose-700 dark:text-rose-300 text-xs font-medium pointer-events-none rounded-xl"
      >
        Delete ◂
      </motion.div>

      <motion.div
        drag={swipeEnabled ? "x" : false}
        dragConstraints={{ left: -200, right: 200 }}
        dragElastic={0.35}
        style={{ x }}
        onDragEnd={handleDragEnd}
        className={`row-grab relative flex items-stretch gap-3 rounded-xl border bg-[color:var(--surface)] shadow-sm hover:shadow-md transition-shadow ${
          isCheckedByMe
            ? "border-[color:var(--border)] opacity-75"
            : overdue
            ? "border-rose-300 dark:border-rose-900"
            : "border-[color:var(--border)]"
        }`}
      >
        <span
          className={`block w-1.5 self-stretch rounded-l-xl ${
            PRIORITY_RAIL[todo.priority]
          }`}
        />
        <div className="flex items-start gap-3 py-3 pr-3 flex-1 min-w-0">
          <button
            onClick={onToggleCheck}
            disabled={isGuest}
            className={`mt-0.5 size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
              isCheckedByMe
                ? "bg-[color:var(--accent)] border-[color:var(--accent)] text-white"
                : "border-[color:var(--border)] hover:border-[color:var(--accent)]"
            } disabled:cursor-not-allowed`}
            aria-label="Mark as done for me"
          >
            {isCheckedByMe && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6.5l2.5 2.5L10 3.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <div className="flex-1 min-w-0">
            <Link
              href={`/todos/${todo.id}/timer`}
              className="block text-sm leading-snug break-words hover:text-[color:var(--accent)] transition-colors"
            >
              <span
                className={
                  isCheckedByMe
                    ? "line-through text-[color:var(--muted)]"
                    : "font-medium"
                }
              >
                {todo.task}
              </span>
            </Link>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
              {todo.priority > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-md font-semibold tracking-wide ${
                    PRIORITY_PILL[todo.priority]
                  }`}
                >
                  P{todo.priority}
                </span>
              )}
              {deadlineDate && (
                <span
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md ${
                    overdue
                      ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                      : "bg-[color:var(--surface-2)] text-[color:var(--muted)]"
                  }`}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <circle
                      cx="5"
                      cy="5"
                      r="4"
                      stroke="currentColor"
                      strokeWidth="1.2"
                    />
                    <path
                      d="M5 2.5V5l1.5 1"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                    />
                  </svg>
                  {deadlineDate.toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
              {checks.length > 0 && (
                <CheckersPopover
                  todoId={todo.id}
                  checks={checks}
                  visibleToOwner={isOwner}
                />
              )}
            </div>
          </div>

          {isOwner && (
            <button
              onClick={() => setEditingDeadline((v) => !v)}
              className="shrink-0 size-8 rounded-md text-[color:var(--muted)] hover:text-[color:var(--accent)] hover:bg-[color:var(--surface-2)] flex items-center justify-center"
              aria-label="Set deadline"
              title="Set deadline"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle
                  cx="8"
                  cy="9"
                  r="5.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M8 6v3l2 1.5M5 2.5l-1.5 1.5M11 2.5l1.5 1.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          )}
        </div>
      </motion.div>

      {editingDeadline && isOwner && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-[color:var(--surface-2)] text-sm"
        >
          <input
            type="datetime-local"
            defaultValue={
              todo.deadline
                ? new Date(todo.deadline).toISOString().slice(0, 16)
                : ""
            }
            onChange={(e) => {
              const v = e.target.value;
              onSetDeadline(v ? new Date(v).toISOString() : null);
            }}
            className="text-xs px-2 py-1 rounded-md border border-[color:var(--border)] bg-[color:var(--surface)]"
          />
          {todo.deadline && (
            <button
              onClick={() => onSetDeadline(null)}
              className="text-xs text-[color:var(--muted)] hover:text-rose-600"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setEditingDeadline(false)}
            className="ml-auto text-xs text-[color:var(--accent)]"
          >
            Done
          </button>
        </motion.div>
      )}
    </motion.li>
  );
}
