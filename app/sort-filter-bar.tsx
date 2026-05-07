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
      <label className="flex items-center gap-1 text-neutral-600 dark:text-neutral-400">
        Sort
        <select
          value={sortKey}
          onChange={(e) => onSortKey(e.target.value as SortKey)}
          className="px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
        >
          <option value="created">Created</option>
          <option value="priority">Priority</option>
          <option value="deadline">Deadline</option>
          <option value="task">Task</option>
        </select>
      </label>
      <button
        onClick={() => onSortDir(sortDir === "asc" ? "desc" : "asc")}
        className="px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
        title="Toggle direction"
      >
        {sortDir === "asc" ? "↑" : "↓"}
      </button>
      <label className="ml-auto flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
        <input
          type="checkbox"
          checked={hideChecked}
          onChange={(e) => onHideChecked(e.target.checked)}
        />
        Hide checked
      </label>
    </div>
  );
}
