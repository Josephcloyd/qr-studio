/**
 * Shows/hides the GetLaunch PH loading screen (see LoadingScreen.tsx / splash.css).
 *
 * Like getlaunchph.com, the intro is held still while React hydrates — that work
 * blocks the main thread and would make the SVG drawing stutter — then plays in
 * one smooth pass (startSplash). Only the orbit ring spins during the hold; it's
 * compositor-driven, so it stays smooth while the page is busy. The splash fades
 * once the full intro has played *and* the page is ready (finishSplash).
 *
 * Reloads, back/forward and reduced-motion users never see it: SPLASH_DECIDE_SCRIPT
 * runs before first paint and marks html[data-splash-skip]. Nothing is stored
 * (the main site remembers the intro in browser storage, which our privacy rules forbid).
 */
const INTRO_MS = 2200;
/** Longest we wait for the main thread to go idle before playing anyway. */
const IDLE_TIMEOUT_MS = 400;

/** Inline <head> script: decide before first paint so a reload never flashes a half-drawn intro. */
export const SPLASH_DECIDE_SCRIPT = `try{var n=performance.getEntriesByType("navigation")[0];if((n&&n.type!=="navigate")||matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.dataset.splashSkip=""}catch(e){}`;

let playStartedAt: number | null = null;
const doneWaiters: (() => void)[] = [];
let finishRequested = false;
let finishScheduled = false;

const root = () => document.documentElement;
const skipped = () => root().dataset.splashSkip !== undefined;

function scheduleFinish(): void {
  if (finishScheduled || !finishRequested || playStartedAt === null) return;
  finishScheduled = true;
  const remaining = skipped() ? 0 : Math.max(0, playStartedAt + INTRO_MS - performance.now());
  window.setTimeout(() => {
    root().dataset.splash = "done";
    doneWaiters.splice(0).forEach((resolve) => resolve());
  }, remaining);
}

function play(): void {
  if (playStartedAt !== null) return;
  playStartedAt = performance.now();
  root().dataset.splashPlay = "";
  scheduleFinish();
}

/** Call once hydrated: plays the intro as soon as the main thread is idle. */
export function startSplash(): void {
  if (skipped()) return play();
  // Older Safari has no requestIdleCallback.
  if (typeof window.requestIdleCallback === "function")
    window.requestIdleCallback(play, { timeout: IDLE_TIMEOUT_MS });
  else setTimeout(play, 50);
}

/** Call when the page's real UI is ready; fades out once the intro has fully played. */
export function finishSplash(): void {
  finishRequested = true;
  scheduleFinish();
}

/**
 * Resolves once the splash starts fading. Heavy, non-essential work (e.g. template
 * thumbnails) waits for this so it can't make the intro stutter. The fade itself
 * is compositor-driven, so work started now doesn't disturb it.
 */
export function afterSplash(): Promise<void> {
  if (root().dataset.splash === "done") return Promise.resolve();
  return new Promise((resolve) => doneWaiters.push(resolve));
}

/** Pages that load their real UI in a second step start and finish the splash themselves. */
export const holdsSplash = (pathname: string) => pathname.startsWith("/studio");
