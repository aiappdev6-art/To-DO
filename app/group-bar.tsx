"use client";

import { useState } from "react";
import type { Group } from "@/lib/types";

type Props = {
  groups: Group[];
  active: string | null;
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
      className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm border transition-all ${
        selected
          ? "bg-[color:var(--foreground)] text-[color:var(--background)] border-[color:var(--foreground)] shadow-sm"
          : "bg-[color:var(--surface)] border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--foreground)] hover:border-[color:var(--accent)]"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
      <Pill label="All" selected={active === null} onClick={() => onSelect(null)} />
      <Pill
        label="Inbox"
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
            className="flex items-center"
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => {
                if (!name.trim()) setAdding(false);
              }}
              placeholder="New list…"
              className="px-3 py-1.5 rounded-full border border-[color:var(--accent)] bg-[color:var(--surface)] text-sm w-32 outline-none"
            />
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="whitespace-nowrap px-3 py-1.5 rounded-full text-sm border border-dashed border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--accent)] hover:border-[color:var(--accent)]"
          >
            + List
          </button>
        ))}
    </div>
  );
}
