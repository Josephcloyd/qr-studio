/**
 * Hides the GetLaunch PH loading screen (see LoadingScreen.tsx / splash.css).
 *
 * On a fresh visit the intro plays for at least INTRO_MS so the emblem finishes
 * drawing, like getlaunchph.com. Reloads, back/forward and reduced-motion users
 * skip straight to the page. Nothing is stored — the main site remembers the
 * intro in browser storage, which QR Studio's privacy rules don't allow.
 */
const INTRO_MS = 1800;

function introRemaining(): number {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return 0;
  const [nav] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  if (nav && nav.type !== "navigate") return 0;
  return Math.max(0, INTRO_MS - performance.now());
}

let finished = false;

export function finishSplash(): void {
  if (finished) return;
  finished = true;
  const root = document.documentElement;
  window.setTimeout(() => {
    root.dataset.splash = "done";
  }, introRemaining());
}

/** Pages that load their real UI in a second step finish the splash themselves. */
export const holdsSplash = (pathname: string) => pathname.startsWith("/studio");
