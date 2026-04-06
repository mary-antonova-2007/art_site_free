"use client";

import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/layout/theme-provider";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <div className="site-shell">{children}</div>
    </ThemeProvider>
  );
}
