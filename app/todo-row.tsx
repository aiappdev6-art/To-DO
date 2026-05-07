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

const PRIORITY_COLORS = [
  "bg-transparent",
  "bg-yellow-400",
  "bg-orange-500",
  "bg-red-600",
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

  // Background hint colors
  const bgRight = useTransform(
    x,
    [0, SWIPE_THRESHOLD],
    ["rgba(0,0,0,0)", "rgba(245,158,11,0.25)"]
  );
  const bgLeft = useTransform(
    x,
    [-DELETE_THRESHOLD, 0],
    ["rgba(220,38,38,0.35)", "rgba(0,0,0,0)"]
  );

  const swipeEnabled = !isGuest;

  function handleDragEnd() {
    const dx = x.get();
    if (dx > SWIPE_THRESHOLD && isOwner) {
      onSetPriority(todo.priority + 1);
    } else if (dx < -DELETE_THRESHOLD && isOwner) {
      // Animate off-screen, then delete (which triggers exit animation via parent).
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
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
      className="relative border-b border-neutral-200 dark:border-neutral-800 last:border-b-0 overflow-hidden"
    >
      {/* swipe hints */}
      <motion.div
        style={{ backgroundColor: bgRight }}
        className="absolute inset-0 flex items-center pl-4 text-amber-700 text-xs font-medium pointer-events-none"
      >
        Priority +1
      </motion.div>
      <motion.div
        style={{ backgroundColor: bgLeft }}
        className="absolute inset-0 flex items-center justify-end pr-4 text-red-700 text-xs font-medium pointer-events-none"
      >
        Delete
      </motion.div>

      <motion.div
        drag={swipeEnabled ? "x" : false}
        dragConstraints={{ left: -200, right: 200 }}
        dragElastic={0.35}
        style={{ x }}
        onDragEnd={handleDragEnd}
        className="relative flex items-center gap-3 px-3 py-2.5 bg-white dark:bg-neutral-900"
      >
        <span
          className={`block w-1 self-stretch rounded-full ${
            PRIORITY_COLORS[todo.priority]
          }`}
        />
        <input
          type="checkbox"
          checked={isCheckedByMe}
          disabled={isGuest}
          onChange={onToggleCheck}
          className="size-4 cursor-pointer disabled:cursor-not-allowed"
          aria-label="Mark as done for me"
        />
        <div className="flex-1 min-w-0">
          <Link
            href={`/todos/${todo.id}/timer`}
            className="block text-sm break-words hover:underline"
          >
            <span
              className={
                isCheckedByMe ? "line-through text-neutral-400" : ""
              }
            >
              {todo.task}
            </span>
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-neutral-500">
            {todo.priority > 0 && (
              <span className="font-medium">P{todo.priority}</span>
            )}
            {deadlineDate && (
              <span className={overdue ? "text-red-600" : ""}>
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
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <button
              onClick={() => setEditingDeadline((v) => !v)}
              className="hover:text-neutral-800 dark:hover:text-neutral-200"
              aria-label="Set deadline"
              title="Set deadline"
            >
              ⏰
            </button>
          </div>
        )}
      </motion.div>

      {editingDeadline && isOwner && (
        <div className="px-3 pb-2 pt-1 flex items-center gap-2 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
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
            className="text-xs px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
          />
          {todo.deadline && (
            <button
              onClick={() => onSetDeadline(null)}
              className="text-xs text-neutral-500 hover:text-red-600"
            >
              Clear
            </button>
          )}
          <button
            onClick={() => setEditingDeadline(false)}
            className="ml-auto text-xs text-neutral-500"
          >
            Done
          </button>
        </div>
      )}
    </motion.li>
  );
}
