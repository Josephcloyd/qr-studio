/**
 * Tracks every object URL the app creates so each one is released. Object
 * URLs only reference in-memory blobs inside this tab; nothing is uploaded.
 */

const live = new Set<string>();

export function createObjectUrl(blob: Blob): string {
  const url = URL.createObjectURL(blob);
  live.add(url);
  return url;
}

export function revokeObjectUrl(url: string | null | undefined): void {
  if (!url || !live.has(url)) return;
  URL.revokeObjectURL(url);
  live.delete(url);
}

export function revokeAllObjectUrls(): void {
  for (const url of live) URL.revokeObjectURL(url);
  live.clear();
}

/** Number of URLs still alive — used by tests and the privacy check. */
export function liveObjectUrlCount(): number {
  return live.size;
}
