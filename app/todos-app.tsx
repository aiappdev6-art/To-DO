"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUndo } from "@/lib/undo";
import type { Group, SortDir, SortKey, Todo, TodoCheck } from "@/lib/types";
import TodoRow from "./todo-row";
import GroupBar from "./group-bar";
import SortFilterBar from "./sort-filter-bar";
import { AnimatePresence } from "framer-motion";

type Props = {
  initialTodos: Todo[];
  initialGroups: Group[];
  initialChecks: TodoCheck[];
  currentUserId: string | null;
};

export default function TodosApp({
  initialTodos,
  initialGroups,
  initialChecks,
  currentUserId,
}: Props) {
  const supabase = createClient();
  const { push } = useUndo();

  const [todos, setTodos] = useState(initialTodos);
  const [groups, setGroups] = useState(initialGroups);
  const [checks, setChecks] = useState(initialChecks);

  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [hideChecked, setHideChecked] = useState(false);

  const [task, setTask] = useState("");

  const isGuest = !currentUserId;

  const checksByTodo = useMemo(() => {
    const m: Record<string, TodoCheck[]> = {};
    for (const c of checks) (m[c.todo_id] ??= []).push(c);
    return m;
  }, [checks]);

  const myCheck = (todoId: string) =>
    !!currentUserId &&
    !!checksByTodo[todoId]?.some((c) => c.user_id === currentUserId);

  const visible = useMemo(() => {
    let list = todos;
    if (activeGroup !== null) {
      list = list.filter((t) =>
        activeGroup === "" ? t.group_id === null : t.group_id === activeGroup
      );
    }
    if (hideChecked) list = list.filter((t) => !myCheck(t.id));
    const dir = sortDir === "asc" ? 1 : -1;
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case "priority":
          return (a.priority - b.priority) * dir;
        case "deadline": {
          const av = a.deadline ? new Date(a.deadline).getTime() : Infinity;
          const bv = b.deadline ? new Date(b.deadline).getTime() : Infinity;
          return (av - bv) * dir;
        }
        case "task":
          return a.task.localeCompare(b.task) * dir;
        case "created":
        default:
          return (
            (new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()) *
            dir
          );
      }
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todos, activeGroup, hideChecked, sortKey, sortDir, checks, currentUserId]);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (isGuest) return;
    const text = task.trim();
    if (!text) return;
    setTask("");
    const { data, error } = await supabase
      .from("todos")
      .insert({
        task: text,
        group_id: activeGroup === "" || activeGroup === null ? null : activeGroup,
      })
      .select()
      .single();
    if (error || !data) {
      setTask(text);
      return;
    }
    const created = data as Todo;
    setTodos((t) => [created, ...t]);
    push({
      label: `Added "${text}"`,
      redo: async () => {
        // Already inserted; re-insert if undone.
        const exists = await supabase
          .from("todos")
          .select("id")
          .eq("id", created.id)
          .maybeSingle();
        if (!exists.data) {
          await supabase.from("todos").insert(created);
          setTodos((t) => [created, ...t.filter((x) => x.id !== created.id)]);
        }
      },
      undo: async () => {
        await supabase.from("todos").delete().eq("id", created.id);
        setTodos((t) => t.filter((x) => x.id !== created.id));
      },
    });
  }

  async function toggleCheck(todo: Todo) {
    if (isGuest) return;
    const had = myCheck(todo.id);
    push({
      label: had ? `Unchecked "${todo.task}"` : `Checked "${todo.task}"`,
      redo: async () => {
        if (had) {
          await supabase
            .from("todo_checks")
            .delete()
            .eq("todo_id", todo.id)
            .eq("user_id", currentUserId!);
          setChecks((cs) =>
            cs.filter(
              (c) => !(c.todo_id === todo.id && c.user_id === currentUserId)
            )
          );
        } else {
          const row: TodoCheck = {
            todo_id: todo.id,
            user_id: currentUserId!,
            checked_at: new Date().toISOString(),
          };
          await supabase.from("todo_checks").insert(row);
          setChecks((cs) => [...cs, row]);
        }
      },
      undo: async () => {
        if (had) {
          const row: TodoCheck = {
            todo_id: todo.id,
            user_id: currentUserId!,
            checked_at: new Date().toISOString(),
          };
          await supabase.from("todo_checks").insert(row);
          setChecks((cs) => [...cs, row]);
        } else {
          await supabase
            .from("todo_checks")
            .delete()
            .eq("todo_id", todo.id)
            .eq("user_id", currentUserId!);
          setChecks((cs) =>
            cs.filter(
              (c) => !(c.todo_id === todo.id && c.user_id === currentUserId)
            )
          );
        }
      },
    });
  }

  async function setPriority(todo: Todo, next: number) {
    if (isGuest || todo.user_id !== currentUserId) return;
    const prev = todo.priority;
    const p = ((next % 4) + 4) % 4 as 0 | 1 | 2 | 3;
    push({
      label: p === 0 ? `Cleared priority` : `Priority P${p}`,
      redo: async () => {
        await supabase.from("todos").update({ priority: p }).eq("id", todo.id);
        setTodos((ts) =>
          ts.map((t) => (t.id === todo.id ? { ...t, priority: p } : t))
        );
      },
      undo: async () => {
        await supabase
          .from("todos")
          .update({ priority: prev })
          .eq("id", todo.id);
        setTodos((ts) =>
          ts.map((t) => (t.id === todo.id ? { ...t, priority: prev } : t))
        );
      },
    });
  }

  async function deleteTodo(todo: Todo) {
    if (isGuest || todo.user_id !== currentUserId) return;
    push({
      label: `Deleted "${todo.task}"`,
      redo: async () => {
        await supabase.from("todos").delete().eq("id", todo.id);
        setTodos((ts) => ts.filter((t) => t.id !== todo.id));
      },
      undo: async () => {
        await supabase.from("todos").insert(todo);
        setTodos((ts) => [todo, ...ts]);
      },
    });
  }

  async function setDeadline(todo: Todo, deadline: string | null) {
    if (isGuest || todo.user_id !== currentUserId) return;
    const prev = todo.deadline;
    push({
      label: deadline ? `Set deadline` : `Cleared deadline`,
      redo: async () => {
        await supabase.from("todos").update({ deadline }).eq("id", todo.id);
        setTodos((ts) =>
          ts.map((t) => (t.id === todo.id ? { ...t, deadline } : t))
        );
      },
      undo: async () => {
        await supabase
          .from("todos")
          .update({ deadline: prev })
          .eq("id", todo.id);
        setTodos((ts) =>
          ts.map((t) => (t.id === todo.id ? { ...t, deadline: prev } : t))
        );
      },
    });
  }

  async function addGroup(name: string) {
    if (isGuest) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const { data, error } = await supabase
      .from("groups")
      .insert({ name: trimmed, created_by: currentUserId })
      .select()
      .single();
    if (error || !data) return;
    setGroups((g) => [...g, data as Group]);
    setActiveGroup((data as Group).id);
  }

  return (
    <div className="space-y-4">
      <GroupBar
        groups={groups}
        active={activeGroup}
        onSelect={setActiveGroup}
        onCreate={addGroup}
        canCreate={!isGuest}
      />

      {!isGuest && (
        <form onSubmit={addTodo} className="flex gap-2">
          <input
            value={task}
            onChange={(e) => setTask(e.target.value)}
            placeholder="What needs doing?"
            className="flex-1 px-3 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-black text-white dark:bg-white dark:text-black"
          >
            Add
          </button>
        </form>
      )}

      <SortFilterBar
        sortKey={sortKey}
        sortDir={sortDir}
        hideChecked={hideChecked}
        onSortKey={setSortKey}
        onSortDir={setSortDir}
        onHideChecked={setHideChecked}
      />

      <ul className="rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        {visible.length === 0 && (
          <li className="px-3 py-8 text-center text-sm text-neutral-500">
            {isGuest ? "No todos to show." : "Nothing here. Add a todo above."}
          </li>
        )}
        <AnimatePresence initial={false}>
          {visible.map((todo) => (
            <TodoRow
              key={todo.id}
              todo={todo}
              checks={checksByTodo[todo.id] ?? []}
              isOwner={!!currentUserId && todo.user_id === currentUserId}
              isGuest={isGuest}
              isCheckedByMe={myCheck(todo.id)}
              onToggleCheck={() => toggleCheck(todo)}
              onSetPriority={(p) => setPriority(todo, p)}
              onDelete={() => deleteTodo(todo)}
              onSetDeadline={(d) => setDeadline(todo, d)}
            />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}
