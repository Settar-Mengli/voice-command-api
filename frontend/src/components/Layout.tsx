import type { ReactElement, ReactNode } from "react";
import { Header } from "./Header";

export interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps): ReactElement {
  return (
    <div className="flex min-h-full flex-col">
      <Header />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 px-6 py-12">
        {children}
      </main>
    </div>
  );
}
