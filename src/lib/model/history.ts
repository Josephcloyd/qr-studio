/**
 * Snapshot-based undo history. Documents are immutable, so a snapshot is just
 * a reference — unchanged elements are shared between snapshots.
 */
import type { DesignDocument } from "./types";

export const HISTORY_LIMIT = 100;
/** Consecutive changes with the same key inside this window merge into one step. */
export const COALESCE_MS = 800;

export interface History {
  past: DesignDocument[];
  future: DesignDocument[];
  lastKey: string | null;
  lastAt: number;
}

export const EMPTY_HISTORY: History = { past: [], future: [], lastKey: null, lastAt: 0 };

/**
 * Records `previous` as an undo step before a change. If `key` matches the
 * last change within the coalescing window, the step is merged instead.
 */
export function record(history: History, previous: DesignDocument, key: string | null, now: number): History {
  const merge = key !== null && key === history.lastKey && now - history.lastAt < COALESCE_MS;
  if (merge) return { ...history, future: [], lastAt: now };
  const past = [...history.past, previous].slice(-HISTORY_LIMIT);
  return { past, future: [], lastKey: key, lastAt: now };
}

export function undo(history: History, current: DesignDocument): { history: History; doc: DesignDocument } | null {
  const prev = history.past[history.past.length - 1];
  if (!prev) return null;
  return {
    doc: prev,
    history: { past: history.past.slice(0, -1), future: [current, ...history.future], lastKey: null, lastAt: 0 },
  };
}

export function redo(history: History, current: DesignDocument): { history: History; doc: DesignDocument } | null {
  const next = history.future[0];
  if (!next) return null;
  return {
    doc: next,
    history: { past: [...history.past, current].slice(-HISTORY_LIMIT), future: history.future.slice(1), lastKey: null, lastAt: 0 },
  };
}
