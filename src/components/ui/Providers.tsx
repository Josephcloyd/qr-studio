"use client";

import { Tooltip } from "radix-ui";
import type { ReactNode } from "react";
import { Toaster } from "./Toaster";

/** Client-side providers shared by every page. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <Tooltip.Provider delayDuration={350}>
      {children}
      <Toaster />
    </Tooltip.Provider>
  );
}
