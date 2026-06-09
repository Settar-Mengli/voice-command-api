import type { ReactElement } from "react";

export interface VoiceButtonProps {
  isListening: boolean;
  onClick?: () => void;
}

export function VoiceButton({
  isListening,
  onClick,
}: VoiceButtonProps): ReactElement {
  const baseClasses =
    "relative inline-flex h-32 w-32 items-center justify-center rounded-full text-white shadow-2xl shadow-indigo-900/60 transition-transform duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/60 hover:scale-105 active:scale-95";

  const stateClasses = isListening
    ? "bg-rose-500 motion-safe:animate-pulse"
    : "bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600";

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        aria-pressed={isListening}
        aria-label={isListening ? "Stop listening" : "Start listening"}
        onClick={onClick}
        className={`${baseClasses} ${stateClasses}`}
      >
        {isListening && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-rose-500/60 motion-safe:animate-ping"
          />
        )}
        <MicrophoneIcon className="relative h-14 w-14" />
      </button>
      <span className="text-xs font-medium uppercase tracking-widest text-slate-400">
        {isListening ? "Listening" : "Tap to speak"}
      </span>
    </div>
  );
}

interface MicrophoneIconProps {
  className?: string;
}

function MicrophoneIcon({ className }: MicrophoneIconProps): ReactElement {
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
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="8" y1="22" x2="16" y2="22" />
    </svg>
  );
}
