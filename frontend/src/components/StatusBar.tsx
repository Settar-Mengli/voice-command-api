import type { ReactElement, ReactNode } from "react";

export interface StatusBarProps {
  message: string;
  transcription: string;
  error: string | null;
  isListening: boolean;
}

export function StatusBar({
  message,
  transcription,
  error,
  isListening,
}: StatusBarProps): ReactElement {
  let content: ReactNode;
  let toneClasses: string;

  if (error) {
    content = error;
    toneClasses = "text-rose-300";
  } else if (isListening && transcription) {
    content = `"${transcription}"`;
    toneClasses = "italic text-sky-300";
  } else if (isListening) {
    content = "Listening...";
    toneClasses = "text-slate-400";
  } else if (message) {
    content = message;
    toneClasses = "text-slate-100";
  } else {
    content = "Tap the mic to start.";
    toneClasses = "text-slate-500";
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="min-h-[3.5rem] w-full rounded-2xl border border-slate-800/80 bg-slate-900/50 px-5 py-4 text-center text-sm sm:text-base"
    >
      <p className={toneClasses}>{content}</p>
    </div>
  );
}
