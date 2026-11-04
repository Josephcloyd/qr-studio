/** Field-level validators shared by the payload encoders. */

// URL-significant characters (? & = # % /) are excluded so an address can't
// smuggle extra mailto parameters such as `?bcc=`.
const EMAIL_PATTERN =
  /^[^\s@<>()[\]\\,;:"?&=#%/]+@[^\s@<>()[\]\\,;:"?&=#%/]+\.[^\s@<>()[\]\\,;:"?&=#%/]{2,}$/;
/** Control, zero-width and bidi-override characters used to disguise links. */
const DECEPTIVE_CHARS = /[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁠-⁤﻿\\]/;
const PHONE_CHARS = /^[+\d\s().-]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

/** Strips formatting, keeping a leading `+`. Returns null when it isn't a phone number. */
export function normalizePhone(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || !PHONE_CHARS.test(trimmed)) return null;
  const plus = trimmed.startsWith("+") ? "+" : "";
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 3 || digits.length > 15) return null;
  return plus + digits;
}

export type UrlCheck = { ok: true; url: string } | { ok: false; error: string };

/**
 * Normalizes a user-entered web address. Adds `https://` when no scheme is
 * given and only allows http(s) — `javascript:`, `data:` etc. are rejected.
 */
export function normalizeWebUrl(raw: string): UrlCheck {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, error: "Enter a web address." };
  if (/\s/.test(trimmed)) return { ok: false, error: "Web addresses can't contain spaces." };
  if (DECEPTIVE_CHARS.test(trimmed)) {
    return { ok: false, error: "This address contains hidden or unusual characters." };
  }
  // A colon followed by a digit is a port (localhost:3000), not a scheme.
  const hasScheme = /^[a-z][a-z\d+.-]*:(?!\d)/i.test(trimmed);
  if (hasScheme && !/^https?:\/\//i.test(trimmed)) {
    return { ok: false, error: "Only http:// and https:// links are supported." };
  }
  const candidate = hasScheme ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, error: "That doesn't look like a valid web address." };
  }
  const host = parsed.hostname;
  const isIp = /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[");
  if (!isIp && host !== "localhost" && !/\.[a-z\d-]{2,}$/i.test(host)) {
    return { ok: false, error: "Include the full domain, like example.com." };
  }
  // Encode exactly what was validated: the normalized URL (punycode host,
  // percent-encoded path) is what scanners and browsers will open.
  return { ok: true, url: parsed.href };
}

/** True for a real calendar date `YYYY-MM-DD` (rejects 2026-13-01, 2026-02-30). */
export function isRealDate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d;
}

/** True for `YYYY-MM-DDTHH:mm` with a real date and a valid time of day. */
export function isRealDateTime(value: string): boolean {
  const m = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(value);
  return !!m && isRealDate(m[1]) && Number(m[2]) < 24 && Number(m[3]) < 60;
}

export function parseCoordinate(value: string, limit: number): number | null {
  const trimmed = value.trim();
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Math.abs(n) <= limit ? n : null;
}
