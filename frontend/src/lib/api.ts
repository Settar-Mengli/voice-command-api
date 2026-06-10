import type {
  InstructionResult,
  Task,
  TaskCreate,
  TaskUpdate,
} from "../types";

const BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `API request failed: ${init?.method ?? "GET"} ${path} -> ${response.status} ${response.statusText}${
        body ? ` :: ${body}` : ""
      }`,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getTasks(): Promise<Task[]> {
  return request<Task[]>("/tasks");
}

export function createTask(data: TaskCreate): Promise<Task> {
  return request<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTask(id: number, data: TaskUpdate): Promise<Task> {
  return request<Task>(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function replaceTask(id: number, data: TaskCreate): Promise<Task> {
  return request<Task>(`/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTask(id: number): Promise<void> {
  await request<{ message: string }>(`/tasks/${id}`, { method: "DELETE" });
}

export function sendInstruction(
  transcription: string,
): Promise<InstructionResult> {
  return request<InstructionResult>("/instruction", {
    method: "POST",
    body: JSON.stringify({ transcription }),
  });
}
