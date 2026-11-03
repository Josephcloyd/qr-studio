/** Ids are lowercase alphanumeric + dashes so they're safe in SVG ids and JSON. */
export const ID_PATTERN = /^[a-z0-9-]{1,64}$/;

export function createId(prefix = "el"): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}-${random}`.toLowerCase();
}
