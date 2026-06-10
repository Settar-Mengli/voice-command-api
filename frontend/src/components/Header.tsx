import type { ReactElement } from "react";

export interface HeaderProps {
  speechSupported?: boolean;
  speechEnabled?: boolean;
  onToggleSpeech?: () => void;
}

export function Header({
  speechSupported = false,
  speechEnabled = true,
  onToggleSpeech,
}: HeaderProps): ReactElement {
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
        <div className="flex items-center gap-2">
          {speechSupported && onToggleSpeech && (
            <button
              type="button"
              onClick={onToggleSpeech}
              aria-pressed={speechEnabled}
              aria-label={
                speechEnabled ? "Mute spoken responses" : "Unmute spoken responses"
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-700/80 text-slate-300 transition-colors hover:border-slate-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
            >
              {speechEnabled ? (
                <SpeakerOnIcon className="h-4 w-4" />
              ) : (
                <SpeakerOffIcon className="h-4 w-4" />
              )}
            </button>
          )}
          <span className="hidden rounded-full border border-slate-700/80 px-3 py-1 text-xs font-medium uppercase tracking-wider text-slate-400 sm:inline">
            beta
          </span>
        </div>
      </div>
    </header>
  );
}

interface IconProps {
  className?: string;
}

function SpeakerOnIcon({ className }: IconProps): ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function SpeakerOffIcon({ className }: IconProps): ReactElement {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  );
}
