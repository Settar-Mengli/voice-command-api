import type { ReactElement } from "react";
import type { Task } from "../types";

export interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps): ReactElement {
  const priority = task.priority ?? "normal";

  return (
    <article className="group flex items-center gap-4 rounded-2xl border border-slate-800/70 bg-slate-900/40 px-5 py-4 shadow-sm transition-colors duration-200 hover:border-slate-700">
      <CheckboxIndicator checked={task.done} />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-base font-medium sm:text-lg ${
            task.done ? "text-slate-500 line-through" : "text-slate-100"
          }`}
        >
          {task.title}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {priority === "high" ? (
          <span
            className="h-2 w-2 rounded-full bg-rose-400"
            aria-label="High priority"
            title="High priority"
          />
        ) : null}
        {priority === "low" ? (
          <span
            className="h-2 w-2 rounded-full bg-slate-600"
            aria-label="Low priority"
            title="Low priority"
          />
        ) : null}
        <span className="rounded-full border border-slate-700/80 px-2.5 py-0.5 text-xs font-medium text-slate-400">
          #{task.id}
        </span>
      </div>
    </article>
  );
}

interface CheckboxIndicatorProps {
  checked: boolean;
}

function CheckboxIndicator({
  checked,
}: CheckboxIndicatorProps): ReactElement {
  return (
    <span
      role="img"
      aria-label={checked ? "Done" : "Not done"}
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
        checked
          ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-300"
          : "border-slate-700 bg-slate-800/60 text-transparent"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4 w-4"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}
