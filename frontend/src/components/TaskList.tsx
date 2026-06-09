import type { ReactElement } from "react";
import type { Task } from "../types";
import { TaskCard } from "./TaskCard";

export interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
}

export function TaskList({
  tasks,
  isLoading = false,
}: TaskListProps): ReactElement {
  if (isLoading && tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-10 text-center">
        <p className="text-sm text-slate-500">Loading tasks...</p>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/30 px-6 py-10 text-center">
        <p className="text-base text-slate-300">No tasks yet.</p>
        <p className="mt-1 text-sm text-slate-500">
          Tap the mic and say &ldquo;add buy groceries&rdquo;.
        </p>
      </div>
    );
  }

  return (
    <section aria-label="Tasks" className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
        Tasks
      </h2>
      <ul className="flex flex-col gap-3">
        {tasks.map((task) => (
          <li key={task.id}>
            <TaskCard task={task} />
          </li>
        ))}
      </ul>
    </section>
  );
}
