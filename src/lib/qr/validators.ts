/** Field-level validators shared by the payload encoders. */

const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;
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
  const hasScheme = /^[a-z][a-z\d+.-]*:/i.test(trimmed);
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
  // Keep the user's original casing/path; only add the scheme when missing.
  return { ok: true, url: candidate };
}

export function parseCoordinate(value: string, limit: number): number | null {
  const trimmed = value.trim();
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return Math.abs(n) <= limit ? n : null;
}
