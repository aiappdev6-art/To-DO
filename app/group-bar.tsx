"use client";

import { useState } from "react";
import type { Group } from "@/lib/types";

type Props = {
  groups: Group[];
  active: string | null; // null = all, "" = ungrouped, id = specific group
  onSelect: (g: string | null) => void;
  onCreate: (name: string) => void;
  canCreate: boolean;
};

export default function GroupBar({
  groups,
  active,
  onSelect,
  onCreate,
  canCreate,
}: Props) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const Pill = ({
    label,
    selected,
    onClick,
  }: {
    label: string;
    selected: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm border transition-colors ${
        selected
          ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
          : "bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      <Pill label="All" selected={active === null} onClick={() => onSelect(null)} />
      <Pill
        label="Ungrouped"
        selected={active === ""}
        onClick={() => onSelect("")}
      />
      {groups.map((g) => (
        <Pill
          key={g.id}
          label={g.name}
          selected={active === g.id}
          onClick={() => onSelect(g.id)}
        />
      ))}
      {canCreate &&
        (adding ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (name.trim()) {
                onCreate(name);
                setName("");
                setAdding(false);
              }
            }}
            className="flex items-center gap-1"
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                if (!name.trim()) setAdding(false);
              }}
              placeholder="Group name"
              className="px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm w-32"
            />
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="whitespace-nowrap px-3 py-1.5 rounded-full text-sm border border-dashed border-neutral-400 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
          >
            + Group
          </button>
        ))}
    </div>
  );
}
