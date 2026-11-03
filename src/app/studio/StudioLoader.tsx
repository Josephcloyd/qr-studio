"use client";

import dynamic from "next/dynamic";

/** The editor is browser-only (canvas measurement, File API, pointer input). */
const StudioApp = dynamic(() => import("@/features/studio/StudioApp").then((m) => m.StudioApp), {
  ssr: false,
  loading: () => <div className="flex h-dvh items-center justify-center bg-paper text-sm text-ink-3">Opening the studio…</div>,
});

export function StudioLoader() {
  return <StudioApp />;
}
