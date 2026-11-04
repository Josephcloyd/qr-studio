"use client";

import { Tooltip } from "radix-ui";
import { useEffect, type ReactNode } from "react";
import { SupportDialog } from "@/components/site/Support";
import { UnsavedWorkGuard } from "@/features/studio/UnsavedWorkGuard";
import { Toaster } from "./Toaster";

/** Client-side providers shared by every page. */
export function Providers({ children }: { children: ReactNode }) {
  // Marks the document once React has hydrated (used by E2E tests to avoid
  // typing into inputs before they're interactive).
  useEffect(() => {
    document.documentElement.dataset.hydrated = "true";
  }, []);
  return (
    <Tooltip.Provider delayDuration={350}>
      {children}
      <Toaster />
      <SupportDialog />
      <UnsavedWorkGuard />
    </Tooltip.Provider>
  );
}
