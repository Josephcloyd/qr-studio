/** Escaping helpers for structured QR payload formats. */

/** Wi-Fi (ZXing MECARD-style) escaping: `\ ; , : "` get a backslash. */
export function escapeWifi(value: string): string {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

/** vCard 3.0 / iCalendar TEXT escaping (RFC 2426 / RFC 5545). */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

const encoder = new TextEncoder();
const FOLD_LIMIT = 75;

/**
 * Folds a content line at 75 octets (RFC 5545 §3.1 / RFC 2425) without
 * splitting multi-byte UTF-8 characters. Continuation lines start with a space.
 */
export function foldLine(line: string): string {
  if (encoder.encode(line).length <= FOLD_LIMIT) return line;
  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    // Continuation lines carry a leading space, which counts toward the limit.
    const limit = parts.length === 0 ? FOLD_LIMIT : FOLD_LIMIT - 1;
    if (currentBytes + bytes > limit) {
      parts.push(current);
      current = "";
      currentBytes = 0;
    }
    current += char;
    currentBytes += bytes;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export function utf8Length(value: string): number {
  return encoder.encode(value).length;
}
