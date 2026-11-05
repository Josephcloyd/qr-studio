/**
 * Shows/hides the GetLaunch PH loading screen (see LoadingScreen.tsx / splash.css).
 *
 * On a fresh visit the full intro plays — the emblem, wordmark and caption
 * finish drawing — before it fades, matching getlaunchph.com's timing.
 * Reloads, back/forward and reduced-motion users never see it: SPLASH_DECIDE_SCRIPT
 * runs before first paint and marks html[data-splash-skip]. Nothing is stored
 * (the main site remembers the intro in browser storage, which our privacy rules forbid).
 */
const INTRO_MS = 2200;

/** Inline <head> script: decide before first paint so a reload never flashes a half-drawn intro. */
export const SPLASH_DECIDE_SCRIPT = `try{var n=performance.getEntriesByType("navigation")[0];if((n&&n.type!=="navigate")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.splashSkip=""}catch(e){}`;

function introRemaining(root: HTMLElement): number {
  if (root.dataset.splashSkip !== undefined) return 0;
  return Math.max(0, INTRO_MS - performance.now());
}

let finished = false;

export function finishSplash(): void {
  if (finished) return;
  finished = true;
  const root = document.documentElement;
  window.setTimeout(() => {
    root.dataset.splash = "done";
  }, introRemaining(root));
}

/** Pages that load their real UI in a second step finish the splash themselves. */
export const holdsSplash = (pathname: string) => pathname.startsWith("/studio");
