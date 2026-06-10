import type { ReactElement, ReactNode } from "react";
import { Header } from "./Header";

export interface LayoutProps {
  children: ReactNode;
  speechSupported?: boolean;
  speechEnabled?: boolean;
  onToggleSpeech?: () => void;
}

export function Layout({
  children,
  speechSupported,
  speechEnabled,
  onToggleSpeech,
}: LayoutProps): ReactElement {
  return (
    <div className="flex min-h-full flex-col">
      <Header
        speechSupported={speechSupported}
        speechEnabled={speechEnabled}
        onToggleSpeech={onToggleSpeech}
      />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-12">
        {children}
      </main>
    </div>
  );
}
