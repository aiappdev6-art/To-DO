"use client";

import type { Streak } from "@/lib/types";
import { motion } from "framer-motion";

const BADGES = [
  { days: 3, name: "Spark" },
  { days: 7, name: "Flame" },
  { days: 30, name: "Inferno" },
];

export default function StreakBanner({ streak }: { streak: Streak | null }) {
  const current = streak?.current_streak ?? 0;
  const longest = streak?.longest_streak ?? 0;
  const nextBadge =
    BADGES.find((b) => longest < b.days) ?? BADGES[BADGES.length - 1];
  const progress =
    nextBadge.days > 0
      ? Math.min(1, longest / nextBadge.days)
      : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-sm"
    >
      <div
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{
          background:
            "radial-gradient(120% 60% at 0% 0%, rgba(251,191,36,0.18), transparent 60%), radial-gradient(80% 80% at 100% 100%, rgba(244,114,182,0.10), transparent 60%)",
        }}
      />
      <div className="relative px-4 py-3 flex items-center gap-4">
        <Flame burning={current > 0} />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums">
              {current}
            </span>
            <span className="text-sm text-[color:var(--muted)]">
              day{current === 1 ? "" : "s"} streak
            </span>
            {longest > 0 && (
              <span className="ml-auto text-[11px] text-[color:var(--muted)]">
                best {longest}
              </span>
            )}
          </div>
          {longest < 30 && (
            <div className="mt-1.5">
              <div className="h-1.5 rounded-full bg-[color:var(--surface-2)] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                />
              </div>
              <div className="flex items-center justify-between mt-1 text-[10px] text-[color:var(--muted)]">
                <span>{nextBadge.days - longest} to {nextBadge.name}</span>
                <span className="flex gap-1">
                  {BADGES.map((b) => {
                    const got = longest >= b.days;
                    return (
                      <span
                        key={b.name}
                        title={`${b.name} — ${b.days} days`}
                        className={`px-1.5 py-0.5 rounded-full border text-[9px] uppercase tracking-wide ${
                          got
                            ? "border-amber-500 text-amber-600 bg-amber-50/70 dark:bg-amber-950/40"
                            : "border-[color:var(--border)] text-[color:var(--muted)]"
                        }`}
                      >
                        {b.name}
                      </span>
                    );
                  })}
                </span>
              </div>
            </div>
          )}
          {longest >= 30 && (
            <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
              Inferno earned. You’re on fire.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function Flame({ burning }: { burning: boolean }) {
  return (
    <motion.div
      animate={
        burning
          ? { scale: [1, 1.06, 0.97, 1.03, 1], rotate: [0, -2, 3, -1, 0] }
          : { scale: 1, rotate: 0 }
      }
      transition={
        burning
          ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.2 }
      }
      className="shrink-0"
      style={{ filter: "drop-shadow(0 0 10px rgba(251,191,36,0.55))" }}
    >
      <svg width="32" height="40" viewBox="0 0 32 40">
        <defs>
          <radialGradient id="streakFlame" cx="50%" cy="65%" r="60%">
            <stop offset="0%" stopColor="#fff7d6" />
            <stop offset="40%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#ea580c" />
          </radialGradient>
        </defs>
        <path
          d="M16 2 C 7 14, 5 25, 16 38 C 27 25, 25 14, 16 2 Z"
          fill={burning ? "url(#streakFlame)" : "#a8a29e"}
        />
      </svg>
    </motion.div>
  );
}
