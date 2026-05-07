"use client";

import type { SortDir, SortKey } from "@/lib/types";

type Props = {
  sortKey: SortKey;
  sortDir: SortDir;
  hideChecked: boolean;
  onSortKey: (k: SortKey) => void;
  onSortDir: (d: SortDir) => void;
  onHideChecked: (v: boolean) => void;
};

export default function SortFilterBar({
  sortKey,
  sortDir,
  hideChecked,
  onSortKey,
  onSortDir,
  onHideChecked,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <div className="inline-flex items-center rounded-full bg-[color:var(--surface)] border border-[color:var(--border)] overflow-hidden">
        <span className="pl-3 pr-2 text-xs text-[color:var(--muted)]">Sort</span>
        <select
          value={sortKey}
          onChange={(e) => onSortKey(e.target.value as SortKey)}
          className="bg-transparent py-1.5 pr-2 outline-none cursor-pointer"
        >
          <option value="created">Newest</option>
          <option value="priority">Priority</option>
          <option value="deadline">Deadline</option>
          <option value="task">Name</option>
        </select>
        <button
          onClick={() => onSortDir(sortDir === "asc" ? "desc" : "asc")}
          className="px-2.5 py-1.5 border-l border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
          title="Toggle direction"
        >
          {sortDir === "asc" ? "↑" : "↓"}
        </button>
      </div>
      <label
        className={`ml-auto inline-flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-colors ${
          hideChecked
            ? "bg-[color:var(--accent-soft)] border-[color:var(--accent)] text-amber-700 dark:text-amber-300"
            : "bg-[color:var(--surface)] border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--foreground)]"
        }`}
      >
        <input
          type="checkbox"
          className="hidden"
          checked={hideChecked}
          onChange={(e) => onHideChecked(e.target.checked)}
        />
        <span className="text-xs font-medium">
          {hideChecked ? "Showing active only" : "Hide checked"}
        </span>
      </label>
    </div>
  );
}
