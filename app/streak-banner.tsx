"use client";

import type { Streak } from "@/lib/types";

const BADGES = [
  { days: 3, name: "Spark" },
  { days: 7, name: "Flame" },
  { days: 30, name: "Inferno" },
];

export default function StreakBanner({ streak }: { streak: Streak | null }) {
  const current = streak?.current_streak ?? 0;
  const longest = streak?.longest_streak ?? 0;
  const earned = BADGES.filter((b) => longest >= b.days);

  return (
    <div className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2 flex items-center justify-between gap-3">
      <div className="text-sm">
        <span className="font-semibold">{current}-day streak</span>
        <span className="text-neutral-500">
          {" "}
          • best {longest}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {BADGES.map((b) => {
          const got = earned.includes(b);
          return (
            <span
              key={b.name}
              title={`${b.name} — ${b.days} days`}
              className={`text-[10px] px-2 py-0.5 rounded-full border ${
                got
                  ? "border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/30"
                  : "border-neutral-300 dark:border-neutral-700 text-neutral-400"
              }`}
            >
              {b.name}
            </span>
          );
        })}
      </div>
    </div>
  );
}
