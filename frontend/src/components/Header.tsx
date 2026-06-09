import type { ReactElement } from "react";

export function Header(): ReactElement {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-800/60 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Voice Command
          </h1>
          <p className="text-xs text-slate-400 sm:text-sm">
            Speak to manage your tasks
          </p>
        </div>
        <span className="hidden rounded-full border border-slate-700/80 px-3 py-1 text-xs font-medium uppercase tracking-wider text-slate-400 sm:inline">
          beta
        </span>
      </div>
    </header>
  );
}
