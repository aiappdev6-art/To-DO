export type Group = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
};

export type Todo = {
  id: string;
  user_id: string;
  group_id: string | null;
  task: string;
  priority: 0 | 1 | 2 | 3;
  deadline: string | null;
  created_at: string;
};

export type TodoCheck = {
  todo_id: string;
  user_id: string;
  checked_at: string;
};

export type Streak = {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_check_date: string | null;
};

export type SortKey = "created" | "priority" | "deadline" | "task";
export type SortDir = "asc" | "desc";
