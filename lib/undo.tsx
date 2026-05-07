"use client";

import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

export type UndoableAction = {
  label: string;
  // do() actually performs the change (state + server). It returns a token
  // we hand back to undo() if needed.
  redo: () => Promise<void> | void;
  undo: () => Promise<void> | void;
};

type Ctx = {
  push: (a: UndoableAction) => Promise<void>;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
};

const UndoCtx = createContext<Ctx | null>(null);

export function useUndo() {
  const ctx = useContext(UndoCtx);
  if (!ctx) throw new Error("UndoProvider missing");
  return ctx;
}

export function UndoProvider({ children }: { children: React.ReactNode }) {
  const undoStack = useRef<UndoableAction[]>([]);
  const redoStack = useRef<UndoableAction[]>([]);
  const [snack, setSnack] = useState<{
    id: number;
    label: string;
  } | null>(null);
  const snackTimer = useRef<number | null>(null);

  const showSnack = useCallback((label: string) => {
    if (snackTimer.current) window.clearTimeout(snackTimer.current);
    const id = Date.now();
    setSnack({ id, label });
    snackTimer.current = window.setTimeout(() => setSnack(null), 4500);
  }, []);

  const push = useCallback(
    async (a: UndoableAction) => {
      undoStack.current.push(a);
      redoStack.current = [];
      await a.redo();
      showSnack(a.label);
    },
    [showSnack]
  );

  const undo = useCallback(async () => {
    const a = undoStack.current.pop();
    if (!a) return;
    redoStack.current.push(a);
    await a.undo();
    showSnack(`Undid: ${a.label}`);
  }, [showSnack]);

  const redo = useCallback(async () => {
    const a = redoStack.current.pop();
    if (!a) return;
    undoStack.current.push(a);
    await a.redo();
    showSnack(`Redid: ${a.label}`);
  }, [showSnack]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tgt = e.target as HTMLElement;
      if (tgt && /^(INPUT|TEXTAREA|SELECT)$/.test(tgt.tagName)) return;
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.key === "z" && e.shiftKey) || e.key === "y") {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  return (
    <UndoCtx.Provider value={{ push, undo, redo }}>
      {children}
      <AnimatePresence>
        {snack && (
          <motion.div
            key={snack.id}
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-neutral-900 text-white shadow-lg flex items-center gap-3 text-sm max-w-[92vw]"
          >
            <span className="truncate">{snack.label}</span>
            <button
              onClick={undo}
              className="font-medium text-amber-300 hover:text-amber-200"
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </UndoCtx.Provider>
  );
}
