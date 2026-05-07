"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type Props = {
  todoId: string;
  currentUserId: string | null;
};

export default function TimerClient({ todoId, currentUserId }: Props) {
  const supabase = createClient();
  const [minutes, setMinutes] = useState(25);
  const [remaining, setRemaining] = useState(25 * 60); // seconds
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const startedAt = useRef<number | null>(null);
  const initial = useRef<number>(25 * 60);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          window.clearInterval(id);
          setRunning(false);
          setDone(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  function start() {
    if (done) reset();
    initial.current = remaining > 0 ? remaining : minutes * 60;
    if (remaining === 0) setRemaining(minutes * 60);
    startedAt.current = Date.now();
    setDone(false);
    setRunning(true);
  }

  function pause() {
    setRunning(false);
  }

  function reset() {
    setRunning(false);
    setDone(false);
    setRemaining(minutes * 60);
    initial.current = minutes * 60;
  }

  async function markDone() {
    if (!currentUserId) return;
    await supabase
      .from("todo_checks")
      .upsert(
        { todo_id: todoId, user_id: currentUserId },
        { onConflict: "todo_id,user_id" }
      );
  }

  const progress = initial.current > 0 ? remaining / initial.current : 0;
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;

  return (
    <div className="space-y-6">
      <Candle progress={progress} burning={running} extinguished={done} />

      <div className="text-center">
        <div className="font-mono text-5xl tabular-nums tracking-tight">
          {m.toString().padStart(2, "0")}:{s.toString().padStart(2, "0")}
        </div>
        {done && (
          <div className="mt-2 text-sm text-amber-600">
            Time’s up. The candle has burned out.
          </div>
        )}
      </div>

      {!running && !done && (
        <div className="flex items-center gap-2 justify-center text-sm">
          <label className="text-neutral-600 dark:text-neutral-400">
            Minutes
          </label>
          <input
            type="number"
            min={1}
            max={180}
            value={minutes}
            onChange={(e) => {
              const v = Math.max(1, Math.min(180, Number(e.target.value) || 0));
              setMinutes(v);
              setRemaining(v * 60);
              initial.current = v * 60;
            }}
            className="w-20 px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-center"
          />
        </div>
      )}

      <div className="flex items-center gap-2 justify-center flex-wrap">
        {!running ? (
          <button
            onClick={start}
            className="px-6 py-2.5 rounded-full bg-[color:var(--foreground)] text-[color:var(--background)] font-medium shadow-sm hover:opacity-90 transition"
          >
            {done ? "Restart" : remaining < initial.current ? "Resume" : "Start"}
          </button>
        ) : (
          <button
            onClick={pause}
            className="px-6 py-2.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] hover:border-[color:var(--accent)] transition"
          >
            Pause
          </button>
        )}
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] hover:border-[color:var(--accent)] transition"
        >
          Reset
        </button>
        {done && currentUserId && (
          <button
            onClick={markDone}
            className="px-6 py-2.5 rounded-full bg-amber-500 text-white font-medium shadow-md shadow-amber-500/30 hover:bg-amber-600 transition"
          >
            Mark done
          </button>
        )}
      </div>
    </div>
  );
}

function Candle({
  progress,
  burning,
  extinguished,
}: {
  progress: number; // 1 = full, 0 = melted
  burning: boolean;
  extinguished: boolean;
}) {
  // Wax body: scaleY from 1 down to ~0.05 as progress 1->0.
  const wax = Math.max(0.05, progress);
  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative h-64 w-24 flex flex-col items-center justify-end">
        {/* flame */}
        {!extinguished && (
          <motion.div
            animate={
              burning
                ? { scale: [1, 1.1, 0.95, 1.05, 1], rotate: [0, -3, 4, -2, 0] }
                : { scale: 1, rotate: 0 }
            }
            transition={
              burning
                ? { duration: 1.1, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.2 }
            }
            className="absolute"
            style={{
              bottom: `calc(${wax * 220}px + 12px)`,
              filter: "drop-shadow(0 0 12px rgba(251, 191, 36, 0.7))",
            }}
          >
            <svg width="28" height="40" viewBox="0 0 28 40">
              <defs>
                <radialGradient id="flame" cx="50%" cy="70%" r="60%">
                  <stop offset="0%" stopColor="#fff7d6" />
                  <stop offset="40%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#ea580c" />
                </radialGradient>
              </defs>
              <path
                d="M14 2 C 6 14, 4 24, 14 38 C 24 24, 22 14, 14 2 Z"
                fill="url(#flame)"
              />
            </svg>
          </motion.div>
        )}
        {/* smoke wisp when extinguished */}
        {extinguished && (
          <motion.div
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 0.7, 0], y: -50 }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute"
            style={{ bottom: `calc(${wax * 220}px + 4px)` }}
          >
            <div className="w-2 h-10 rounded-full bg-neutral-400/40 blur-md" />
          </motion.div>
        )}
        {/* wick */}
        <div
          className="absolute w-[2px] bg-neutral-800 dark:bg-neutral-200"
          style={{
            height: 10,
            bottom: `calc(${wax * 220}px + 2px)`,
          }}
        />
        {/* wax body */}
        <motion.div
          animate={{ height: wax * 220 }}
          transition={{ ease: "linear", duration: 0.6 }}
          className="w-16 rounded-t-md bg-gradient-to-b from-amber-200 to-amber-400 shadow-inner relative overflow-hidden"
          style={{ height: wax * 220 }}
        >
          {/* drip */}
          <div className="absolute -right-1 top-2 w-2 h-6 rounded-b-full bg-amber-300/80" />
        </motion.div>
        {/* base */}
        <div className="w-20 h-3 rounded-md bg-neutral-300 dark:bg-neutral-700" />
      </div>
    </div>
  );
}
