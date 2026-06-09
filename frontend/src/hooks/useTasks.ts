import { useCallback, useEffect, useState } from "react";
import {
  createTask,
  deleteTask,
  getTasks,
  replaceTask,
  updateTask,
} from "../lib/api";
import type { InstructionResponse, Task } from "../types";

export interface UseTasksResult {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  executeInstruction: (response: InstructionResponse) => Promise<string>;
}

const UNCLEAR_FALLBACK = "Sorry, I didn't understand that.";

export function useTasks(): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    async (response: InstructionResponse): Promise<string> => {
      if (response.endpoint === null || response.method === null) {
        const reasonValue = response.params["error"];
        return typeof reasonValue === "string" && reasonValue.length > 0
          ? reasonValue
          : UNCLEAR_FALLBACK;
      }

      try {
        const summary = await dispatch(response);
        await refetch();
        return summary;
      } catch (e) {
        return `Something went wrong: ${e instanceof Error ? e.message : String(e)}`;
      }
    },
    [refetch],
  );

  return { tasks, isLoading, error, refetch, executeInstruction };
}

async function dispatch(response: InstructionResponse): Promise<string> {
  const { endpoint, method, params } = response;
  const isCollection = endpoint === "/tasks";
  const isItem = endpoint !== null && endpoint.startsWith("/tasks/");

  if (isCollection && method === "GET") {
    return "Refreshed your tasks.";
  }

  if (isCollection && method === "POST") {
    const title = stringParam(params, "title");
    const done = boolParam(params, "done") ?? false;
    if (title === null) {
      throw new Error("missing title");
    }
    const created = await createTask({ title, done });
    return `Created: "${created.title}"`;
  }

  if (isItem && method === "PUT") {
    const id = numberParam(params, "id");
    const title = stringParam(params, "title");
    const done = boolParam(params, "done") ?? false;
    if (id === null || title === null) {
      throw new Error("missing id or title");
    }
    const replaced = await replaceTask(id, { title, done });
    return `Replaced task #${replaced.id}.`;
  }

  if (isItem && method === "PATCH") {
    const id = numberParam(params, "id");
    if (id === null) {
      throw new Error("missing id");
    }
    const title = stringParam(params, "title");
    const done = boolParam(params, "done");
    const patch: { title?: string; done?: boolean } = {};
    if (title !== null) {
      patch.title = title;
    }
    if (done !== null) {
      patch.done = done;
    }
    const updated = await updateTask(id, patch);
    if (title !== null && done === null) {
      return `Renamed task #${updated.id} to "${updated.title}".`;
    }
    if (done !== null && title === null) {
      return done
        ? `Marked task #${updated.id} as done.`
        : `Marked task #${updated.id} as not done.`;
    }
    return `Updated task #${updated.id}.`;
  }

  if (isItem && method === "DELETE") {
    const id = numberParam(params, "id");
    if (id === null) {
      throw new Error("missing id");
    }
    await deleteTask(id);
    return `Deleted task #${id}.`;
  }

  throw new Error(
    `Unsupported instruction: ${method ?? "?"} ${endpoint ?? "?"}`,
  );
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
