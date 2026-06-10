import { useCallback, useEffect, useRef, useState, type MutableRefObject } from "react";
import {
  createTask,
  deleteTask,
  getTasks,
  replaceTask,
  updateTask,
} from "../lib/api";
import type {
  InstructionResponse,
  InstructionResult,
  Priority,
  Task,
} from "../types";

export interface UseTasksResult {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  executeInstruction: (response: InstructionResult) => Promise<string>;
}

const UNCLEAR_FALLBACK = "Sorry, I didn't understand that.";

const OFF_TOPIC_HINT =
  'I can only help with tasks — try "add buy milk" or "delete task 2".';

type UndoAction =
  | { kind: "create"; task: Task }
  | { kind: "delete"; task: Task }
  | { kind: "toggle"; taskId: number; previousDone: boolean }
  | { kind: "rename"; taskId: number; previousTitle: string }
  | { kind: "replace"; taskId: number; previous: Task }
  | { kind: "bulk_delete"; tasks: Task[] }
  | { kind: "bulk_complete"; tasks: Array<Task & { previousDone: boolean }> };

function friendlyUnclearReason(reason: string): string {
  const lower = reason.toLowerCase();
  if (
    lower.includes("unrelated") ||
    lower.includes("task management") ||
    lower.includes("cannot tell") ||
    lower.includes("ambiguous") ||
    lower.includes("not related")
  ) {
    return OFF_TOPIC_HINT;
  }
  return reason;
}

type ResolveResult =
  | { kind: "ok"; id: number }
  | { kind: "message"; message: string };

export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastUndoRef = useRef<UndoAction | null>(null);

  const refetch = useCallback(async (): Promise<void> => {
    try {
      const next = await getTasks();
      setTasks(next);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await getTasks();
        if (cancelled) return;
        setTasks(next);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load tasks");
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const executeInstruction = useCallback(
    async (response: InstructionResult): Promise<string> => {
      if (Array.isArray(response)) {
        return executeBatch(response, refetch, lastUndoRef);
      }

      if (response.endpoint === null || response.method === null) {
        const command = stringParam(response.params, "command");
        if (command === "undo") {
          return performUndo(lastUndoRef, refetch);
        }
        if (
          command === "clear_done" ||
          command === "clear_all" ||
          command === "complete_all"
        ) {
          return performBulk(command, refetch, lastUndoRef);
        }
        const reasonValue = response.params["error"];
        if (typeof reasonValue === "string" && reasonValue.length > 0) {
          return friendlyUnclearReason(reasonValue);
        }
        return UNCLEAR_FALLBACK;
      }

      try {
        const currentTasks = await getTasks();
        const summary = await dispatchOne(
          response,
          currentTasks,
          lastUndoRef,
        );
        if (summary.mutated) {
          await refetch();
        }
        return summary.text;
      } catch (e) {
        return `Something went wrong: ${e instanceof Error ? e.message : String(e)}`;
      }
    },
    [refetch],
  );

  return { tasks, isLoading, error, refetch, executeInstruction };
}

interface DispatchSummary {
  text: string;
  mutated: boolean;
  createdTitle?: string;
  kind?: "create" | "toggle" | "delete" | "rename" | "replace" | "other";
}

async function executeBatch(
  responses: InstructionResponse[],
  refetch: () => Promise<void>,
  undoRef: MutableRefObject<UndoAction | null>,
): Promise<string> {
  let currentTasks = await getTasks();
  const parts: DispatchSummary[] = [];
  for (const response of responses) {
    if (response.endpoint === null || response.method === null) {
      const reasonValue = response.params["error"];
      if (typeof reasonValue === "string" && reasonValue.length > 0) {
        return friendlyUnclearReason(reasonValue);
      }
      return UNCLEAR_FALLBACK;
    }

    try {
      const summary = await dispatchOne(response, currentTasks, undoRef);
      parts.push(summary);
      if (summary.mutated) {
        await refetch();
        currentTasks = await getTasks();
      }
    } catch (e) {
      return `Something went wrong: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  return composeBatchSummary(parts);
}

function composeBatchSummary(parts: DispatchSummary[]): string {
  const creates = parts.filter((p) => p.kind === "create" && p.createdTitle);
  if (creates.length > 1 && creates.length === parts.length) {
    const titles = creates.map((p) => p.createdTitle!);
    return `Added ${numberWord(titles.length)} items: ${formatList(titles)}.`;
  }
  if (parts.length === 1) {
    return parts[0].text;
  }
  return parts.map((p) => p.text).join(" ");
}

async function dispatchOne(
  response: InstructionResponse,
  tasks: Task[],
  undoRef: MutableRefObject<UndoAction | null>,
): Promise<DispatchSummary> {
  const { endpoint, method, params } = response;
  const isCollection = endpoint === "/tasks";
  const isItem = endpoint !== null && endpoint.startsWith("/tasks/");

  if (isCollection && method === "GET") {
    const query = stringParam(params, "query");
    if (query !== null) {
      return { text: composeQueryAnswer(tasks, query), mutated: false };
    }
    return { text: "Refreshed your tasks.", mutated: false };
  }

  if (isCollection && method === "POST") {
    const title = stringParam(params, "title");
    const done = boolParam(params, "done") ?? false;
    const priority = priorityParam(params) ?? "normal";
    if (title === null) {
      throw new Error("missing title");
    }
    const created = await createTask({ title, done, priority });
    undoRef.current = { kind: "create", task: created };
    return {
      text: `Added ${title}.`,
      mutated: true,
      createdTitle: created.title,
      kind: "create",
    };
  }

  if (isItem && method === "PUT") {
    const resolved = resolveTaskId(tasks, params);
    if (resolved.kind === "message") {
      return { text: resolved.message, mutated: false };
    }
    const existing = tasks.find((t) => t.id === resolved.id);
    const title = stringParam(params, "title");
    const done = boolParam(params, "done") ?? false;
    const priority = priorityParam(params) ?? existing?.priority ?? "normal";
    if (title === null) {
      throw new Error("missing title");
    }
    if (existing) {
      undoRef.current = { kind: "replace", taskId: resolved.id, previous: existing };
    }
    const replaced = await replaceTask(resolved.id, { title, done, priority });
    return { text: `Updated ${replaced.title}.`, mutated: true, kind: "replace" };
  }

  if (isItem && method === "PATCH") {
    const resolved = resolveTaskId(tasks, params);
    if (resolved.kind === "message") {
      return { text: resolved.message, mutated: false };
    }
    const existing = tasks.find((t) => t.id === resolved.id);
    const title = stringParam(params, "title");
    const done = boolParam(params, "done");
    const patch: { title?: string; done?: boolean; priority?: Priority } = {};
    if (title !== null) {
      patch.title = title;
    }
    if (done !== null) {
      patch.done = done;
    }
    const updated = await updateTask(resolved.id, patch);
    if (title !== null && done === null && existing) {
      undoRef.current = {
        kind: "rename",
        taskId: resolved.id,
        previousTitle: existing.title,
      };
      return {
        text: `Renamed to ${updated.title}.`,
        mutated: true,
        kind: "rename",
      };
    }
    if (done !== null && title === null && existing) {
      undoRef.current = {
        kind: "toggle",
        taskId: resolved.id,
        previousDone: existing.done,
      };
      return {
        text: done
          ? `Marked ${updated.title} done.`
          : `Marked ${updated.title} as not done.`,
        mutated: true,
        kind: "toggle",
      };
    }
    return { text: `Updated ${updated.title}.`, mutated: true, kind: "other" };
  }

  if (isItem && method === "DELETE") {
    const resolved = resolveTaskId(tasks, params);
    if (resolved.kind === "message") {
      return { text: resolved.message, mutated: false };
    }
    const existing = tasks.find((t) => t.id === resolved.id);
    if (existing) {
      undoRef.current = { kind: "delete", task: existing };
    }
    await deleteTask(resolved.id);
    const label = existing?.title ?? "task";
    return { text: `Deleted ${label}.`, mutated: true, kind: "delete" };
  }

  throw new Error(
    `Unsupported instruction: ${method ?? "?"} ${endpoint ?? "?"}`,
  );
}

async function performUndo(
  undoRef: MutableRefObject<UndoAction | null>,
  refetch: () => Promise<void>,
): Promise<string> {
  const action = undoRef.current;
  if (action === null) {
    return "Nothing to undo.";
  }

  switch (action.kind) {
    case "create":
      await deleteTask(action.task.id);
      break;
    case "delete":
      await createTask({
        title: action.task.title,
        done: action.task.done,
        priority: action.task.priority,
      });
      break;
    case "toggle":
      await updateTask(action.taskId, { done: action.previousDone });
      break;
    case "rename":
      await updateTask(action.taskId, { title: action.previousTitle });
      break;
    case "replace":
      await replaceTask(action.taskId, {
        title: action.previous.title,
        done: action.previous.done,
        priority: action.previous.priority,
      });
      break;
    case "bulk_delete":
      for (const task of action.tasks) {
        await createTask({
          title: task.title,
          done: task.done,
          priority: task.priority,
        });
      }
      break;
    case "bulk_complete":
      for (const task of action.tasks) {
        await updateTask(task.id, { done: task.previousDone });
      }
      break;
  }

  undoRef.current = null;
  await refetch();
  return "Undone.";
}

async function performBulk(
  command: "clear_done" | "clear_all" | "complete_all",
  refetch: () => Promise<void>,
  undoRef: MutableRefObject<UndoAction | null>,
): Promise<string> {
  const tasks = await getTasks();

  if (command === "clear_done") {
    const doneTasks = tasks.filter((t) => t.done);
    if (doneTasks.length === 0) {
      return "No finished tasks to clear.";
    }
    for (const task of doneTasks) {
      await deleteTask(task.id);
    }
    undoRef.current = { kind: "bulk_delete", tasks: doneTasks };
    await refetch();
    return `All set, cleared ${numberWord(doneTasks.length)} finished ${doneTasks.length === 1 ? "task" : "tasks"}.`;
  }

  if (command === "clear_all") {
    if (tasks.length === 0) {
      return "Your list is already empty.";
    }
    for (const task of tasks) {
      await deleteTask(task.id);
    }
    undoRef.current = { kind: "bulk_delete", tasks };
    await refetch();
    return `Cleared all ${numberWord(tasks.length)} ${tasks.length === 1 ? "task" : "tasks"}.`;
  }

  const openTasks = tasks.filter((t) => !t.done);
  if (openTasks.length === 0) {
    return "Everything is already done.";
  }
  const snapshots = openTasks.map((t) => ({ ...t, previousDone: t.done }));
  for (const task of openTasks) {
    await updateTask(task.id, { done: true });
  }
  undoRef.current = { kind: "bulk_complete", tasks: snapshots };
  await refetch();
  return `Marked ${numberWord(openTasks.length)} ${openTasks.length === 1 ? "task" : "tasks"} done.`;
}

function composeQueryAnswer(tasks: Task[], query: string): string {
  const total = tasks.length;
  const remaining = tasks.filter((t) => !t.done);
  const remainingCount = remaining.length;

  switch (query) {
    case "count":
      if (total === 0) {
        return "You have no tasks.";
      }
      return `You have ${numberWord(total)} ${total === 1 ? "task" : "tasks"}.`;
    case "remaining":
      if (remainingCount === 0) {
        return total === 0
          ? "You have no tasks left."
          : "You're all caught up.";
      }
      return `You have ${numberWord(remainingCount)} ${remainingCount === 1 ? "task" : "tasks"} left.`;
    case "summary":
      if (total === 0) {
        return "Your list is empty.";
      }
      if (remainingCount === 0) {
        return `All ${numberWord(total)} ${total === 1 ? "task is" : "tasks are"} done.`;
      }
      return `You have ${numberWord(remainingCount)} open: ${formatList(remaining.map((t) => t.title))}.`;
    default:
      return "Refreshed your tasks.";
  }
}

function formatList(items: string[]): string {
  if (items.length === 0) {
    return "";
  }
  if (items.length === 1) {
    return items[0];
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function numberWord(n: number): string {
  const words = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
  ];
  return n >= 0 && n <= 10 ? words[n] : String(n);
}

function resolveTaskId(
  tasks: Task[],
  params: Record<string, unknown>,
): ResolveResult {
  const id = numberParam(params, "id");
  if (id !== null) {
    return { kind: "ok", id };
  }

  const match = stringParam(params, "match");
  if (match === null) {
    return { kind: "message", message: "Which task did you mean?" };
  }

  const needle = match.toLowerCase();
  const hits = tasks.filter((task) =>
    task.title.toLowerCase().includes(needle),
  );

  if (hits.length === 0) {
    return {
      kind: "message",
      message: `No task matching "${match}" found.`,
    };
  }
  if (hits.length > 1) {
    return {
      kind: "message",
      message: `I found a few tasks matching "${match}" — which number?`,
    };
  }
  return { kind: "ok", id: hits[0].id };
}

function stringParam(
  params: Record<string, unknown>,
  key: string,
): string | null {
  const v = params[key];
  return typeof v === "string" && v.length > 0 ? v : null;
}

function boolParam(
  params: Record<string, unknown>,
  key: string,
): boolean | null {
  const v = params[key];
  return typeof v === "boolean" ? v : null;
}

function numberParam(
  params: Record<string, unknown>,
  key: string,
): number | null {
  const v = params[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function priorityParam(params: Record<string, unknown>): Priority | null {
  const v = params["priority"];
  if (v === "low" || v === "normal" || v === "high") {
    return v;
  }
  return null;
}
