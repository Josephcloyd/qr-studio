"use client";

import dynamic from "next/dynamic";

/** The editor is browser-only (canvas measurement, File API, pointer input). */
const StudioApp = dynamic(() => import("@/features/studio/StudioApp").then((m) => m.StudioApp), {
  ssr: false,
  loading: () => (
    <div className="bg-paper text-ink-3 flex h-dvh items-center justify-center text-sm">
      Opening the studio…
    </div>
  ),
});

export function StudioLoader() {
  return <StudioApp />;
}
