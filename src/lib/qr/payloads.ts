/**
 * Encodes typed QR content into the static payload string stored in the code.
 * Pure functions: no I/O, no network. Each returns field-level errors so the
 * form can show inline validation.
 */
import type {
  ContentOf,
  EmailContent,
  EventContent,
  LocationContent,
  PhoneContent,
  QrContent,
  QrType,
  SmsContent,
  TextContent,
  UrlContent,
  VCardContent,
  WhatsAppContent,
  WifiContent,
} from "./content";
import { escapeText, escapeWifi, foldLine, utf8Length } from "./escape";
import {
  isRealDate,
  isRealDateTime,
  isValidEmail,
  normalizePhone,
  normalizeWebUrl,
  parseCoordinate,
} from "./validators";

export type FieldErrors = Record<string, string>;

export type EncodeResult =
  { ok: true; payload: string; warnings: string[] } | { ok: false; errors: FieldErrors };

const ok = (payload: string, warnings: string[] = []): EncodeResult => ({
  ok: true,
  payload,
  warnings,
});
const fail = (errors: FieldErrors): EncodeResult => ({ ok: false, errors });

function encodeUrl(c: UrlContent): EncodeResult {
  const check = normalizeWebUrl(c.url);
  return check.ok ? ok(check.url) : fail({ url: check.error });
}

function encodeText(c: TextContent): EncodeResult {
  return c.text.trim() ? ok(c.text) : fail({ text: "Enter some text to encode." });
}

function validateWifiPassword(c: WifiContent): string | null {
  const p = c.password;
  if (c.encryption === "nopass") return null;
  if (!p) return "Enter the network password.";
  if (c.encryption === "WEP") {
    const validWep = [5, 13].includes(p.length) || /^([0-9a-f]{10}|[0-9a-f]{26})$/i.test(p);
    return validWep ? null : "WEP keys are 5 or 13 characters (or 10 / 26 hex digits).";
  }
  const validWpa = (p.length >= 8 && p.length <= 63) || /^[0-9a-f]{64}$/i.test(p);
  return validWpa ? null : "WPA passwords are 8 to 63 characters long.";
}

function encodeWifi(c: WifiContent): EncodeResult {
  const errors: FieldErrors = {};
  if (!c.ssid) errors.ssid = "Enter the network name (SSID).";
  else if (utf8Length(c.ssid) > 32) errors.ssid = "Network names are at most 32 bytes.";
  const passwordError = validateWifiPassword(c);
  if (passwordError) errors.password = passwordError;
  if (Object.keys(errors).length) return fail(errors);

  const parts = [`T:${c.encryption}`, `S:${escapeWifi(c.ssid)}`];
  if (c.encryption !== "nopass") parts.push(`P:${escapeWifi(c.password)}`);
  if (c.hidden) parts.push("H:true");
  const warnings =
    c.encryption === "WEP" ? ["WEP is insecure — use WPA2/WPA3 on your router if you can."] : [];
  return ok(`WIFI:${parts.join(";")};;`, warnings);
}

function vcardLines(c: VCardContent, website: string | null): string[] {
  const t = (v: string) => escapeText(v.trim());
  const fullName = [c.firstName, c.lastName]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ");
  const lines = ["BEGIN:VCARD", "VERSION:3.0"];
  lines.push(`N:${t(c.lastName)};${t(c.firstName)};;;`);
  lines.push(`FN:${t(fullName || c.organization)}`);
  if (c.organization.trim()) lines.push(`ORG:${t(c.organization)}`);
  if (c.title.trim()) lines.push(`TITLE:${t(c.title)}`);
  const phone = normalizePhone(c.phone);
  if (phone) lines.push(`TEL;TYPE=WORK,VOICE:${phone}`);
  const mobile = normalizePhone(c.mobile);
  if (mobile) lines.push(`TEL;TYPE=CELL:${mobile}`);
  if (c.email.trim()) lines.push(`EMAIL;TYPE=INTERNET:${c.email.trim()}`);
  if (website) lines.push(`URL:${website}`);
  const address = [c.street, c.city, c.region, c.postalCode, c.country];
  if (address.some((s) => s.trim())) lines.push(`ADR;TYPE=WORK:;;${address.map(t).join(";")}`);
  if (c.note.trim()) lines.push(`NOTE:${t(c.note)}`);
  lines.push("END:VCARD");
  return lines;
}

function encodeVCard(c: VCardContent): EncodeResult {
  const errors: FieldErrors = {};
  if (![c.firstName, c.lastName, c.organization].some((s) => s.trim())) {
    errors.firstName = "Add a name or a company.";
  }
  if (c.email.trim() && !isValidEmail(c.email)) errors.email = "Enter a valid email address.";
  if (c.phone.trim() && !normalizePhone(c.phone)) errors.phone = "Enter a valid phone number.";
  if (c.mobile.trim() && !normalizePhone(c.mobile)) errors.mobile = "Enter a valid phone number.";
  let website: string | null = null;
  if (c.website.trim()) {
    const check = normalizeWebUrl(c.website);
    if (check.ok) website = check.url;
    else errors.website = check.error;
  }
  if (Object.keys(errors).length) return fail(errors);
  return ok(vcardLines(c, website).map(foldLine).join("\r\n"));
}

function encodeEmail(c: EmailContent): EncodeResult {
  if (!isValidEmail(c.to)) return fail({ to: "Enter a valid email address." });
  const params = [
    c.subject.trim() ? `subject=${encodeURIComponent(c.subject.trim())}` : "",
    c.body.trim() ? `body=${encodeURIComponent(c.body)}` : "",
  ].filter(Boolean);
  return ok(`mailto:${c.to.trim()}${params.length ? `?${params.join("&")}` : ""}`);
}

function encodePhone(c: PhoneContent): EncodeResult {
  const phone = normalizePhone(c.number);
  return phone ? ok(`tel:${phone}`) : fail({ number: "Enter a valid phone number." });
}

function encodeSms(c: SmsContent): EncodeResult {
  const phone = normalizePhone(c.number);
  if (!phone) return fail({ number: "Enter a valid phone number." });
  return ok(`SMSTO:${phone}:${c.message}`);
}

function encodeWhatsApp(c: WhatsAppContent): EncodeResult {
  const phone = normalizePhone(c.number);
  if (!phone) return fail({ number: "Enter a WhatsApp number with country code." });
  const digits = phone.replace("+", "");
  if (!phone.startsWith("+") && digits.startsWith("0")) {
    return fail({ number: "Use the international format without the leading 0 (e.g. 63 917…)." });
  }
  if (digits.length < 7) return fail({ number: "That number is too short." });
  const text = c.message.trim() ? `?text=${encodeURIComponent(c.message)}` : "";
  return ok(`https://wa.me/${digits}${text}`);
}

function encodeLocation(c: LocationContent): EncodeResult {
  if (c.mode === "address") {
    const q = c.address.trim();
    if (!q) return fail({ address: "Enter an address or place name." });
    const e = encodeURIComponent(q);
    const urls: Record<LocationContent["provider"], string> = {
      google: `https://www.google.com/maps/search/?api=1&query=${e}`,
      apple: `https://maps.apple.com/?q=${e}`,
      osm: `https://www.openstreetmap.org/search?query=${e}`,
      geo: `geo:0,0?q=${e}`,
    };
    return ok(urls[c.provider]);
  }
  const errors: FieldErrors = {};
  const lat = parseCoordinate(c.latitude, 90);
  const lng = parseCoordinate(c.longitude, 180);
  if (lat === null) errors.latitude = "Latitude must be a number between -90 and 90.";
  if (lng === null) errors.longitude = "Longitude must be a number between -180 and 180.";
  if (lat === null || lng === null) return fail(errors);
  const ll = `${lat},${lng}`;
  const urls: Record<LocationContent["provider"], string> = {
    google: `https://www.google.com/maps/search/?api=1&query=${ll}`,
    apple: `https://maps.apple.com/?ll=${ll}&q=${ll}`,
    osm: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}`,
    geo: `geo:${ll}`,
  };
  return ok(urls[c.provider]);
}

function icalDate(value: string, allDay: boolean): string {
  const [date, time = "00:00"] = value.split("T");
  const d = date.replace(/-/g, "");
  return allDay ? d : `${d}T${time.replace(":", "")}00`;
}

function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function encodeEvent(c: EventContent): EncodeResult {
  const errors: FieldErrors = {};
  if (!c.title.trim()) errors.title = "Give the event a title.";
  const valid = c.allDay ? isRealDate : isRealDateTime;
  const start = c.allDay ? c.start.slice(0, 10) : c.start;
  const end = c.allDay ? c.end.slice(0, 10) : c.end;
  if (!valid(start)) errors.start = "Choose a start date and time.";
  if (end && !valid(end)) errors.end = "Choose a valid end date.";
  if (!errors.start && end && !errors.end && end < start)
    errors.end = "End must be after the start.";
  if (Object.keys(errors).length) return fail(errors);

  const dateParam = c.allDay ? ";VALUE=DATE" : "";
  const endValue = c.allDay ? nextDay(end || start) : end;
  const lines = ["BEGIN:VEVENT", `SUMMARY:${escapeText(c.title.trim())}`];
  lines.push(`DTSTART${dateParam}:${icalDate(start, c.allDay)}`);
  if (endValue) lines.push(`DTEND${dateParam}:${icalDate(endValue, c.allDay)}`);
  if (c.location.trim()) lines.push(`LOCATION:${escapeText(c.location.trim())}`);
  if (c.description.trim()) lines.push(`DESCRIPTION:${escapeText(c.description.trim())}`);
  lines.push("END:VEVENT");
  return ok(lines.map(foldLine).join("\r\n"));
}

type Encoder<T extends QrType> = (content: ContentOf<T>) => EncodeResult;

const ENCODERS: { [K in QrType]: Encoder<K> } = {
  url: encodeUrl,
  text: encodeText,
  wifi: encodeWifi,
  vcard: encodeVCard,
  email: encodeEmail,
  phone: encodePhone,
  sms: encodeSms,
  whatsapp: encodeWhatsApp,
  location: encodeLocation,
  event: encodeEvent,
};

export function encodePayload(content: QrContent): EncodeResult {
  const encoder = ENCODERS[content.type] as Encoder<QrType> | undefined;
  if (!encoder) return fail({ type: "Unknown QR code type." });
  try {
    return encoder(content);
  } catch {
    // Defensive: content can come from imported files. Never crash rendering.
    return fail({ content: "This QR content couldn't be encoded." });
  }
}
