import { describe, expect, it } from "vitest";
import { emptyContent, QR_TYPES } from "@/lib/qr/content";
import { escapeText, escapeWifi, foldLine } from "@/lib/qr/escape";
import { encodePayload, type EncodeResult } from "@/lib/qr/payloads";
import { normalizePhone, normalizeWebUrl } from "@/lib/qr/validators";

const payload = (r: EncodeResult) => {
  if (!r.ok) throw new Error(`Expected ok, got ${JSON.stringify(r.errors)}`);
  return r.payload;
};
const errors = (r: EncodeResult) => {
  if (r.ok) throw new Error(`Expected errors, got payload ${r.payload}`);
  return r.errors;
};

describe("empty inputs", () => {
  it.each(QR_TYPES)("%s rejects an empty form with a field error", (type) => {
    const result = encodePayload(emptyContent(type));
    expect(result.ok).toBe(false);
    expect(Object.keys(errors(result)).length).toBeGreaterThan(0);
  });
});

describe("url", () => {
  it("adds https when missing", () => {
    expect(payload(encodePayload({ type: "url", url: "getlaunchph.com/tools" }))).toBe(
      "https://getlaunchph.com/tools",
    );
  });
  it("keeps explicit http(s)", () => {
    expect(payload(encodePayload({ type: "url", url: "http://example.com/a?b=1#c" }))).toBe(
      "http://example.com/a?b=1#c",
    );
  });
  it.each([
    "javascript:alert(1)",
    "data:text/html,hi",
    "ftp://x.com",
    "not a url",
    "localhostish",
    "https://",
  ])("rejects %s", (url) => {
    expect(errors(encodePayload({ type: "url", url })).url).toBeTruthy();
  });
  it("accepts IPs and localhost", () => {
    expect(normalizeWebUrl("192.168.1.1:8080").ok).toBe(true);
    expect(normalizeWebUrl("http://localhost:3000").ok).toBe(true);
  });
  it("accepts internationalized domains", () => {
    expect(normalizeWebUrl("https://例え.jp/パス").ok).toBe(true);
  });
});

describe("text", () => {
  it("encodes text verbatim, including newlines and unicode", () => {
    const text = "Line 1\nLínea 2 — 日本語 ✓";
    expect(payload(encodePayload({ type: "text", text }))).toBe(text);
  });
  it("rejects whitespace-only", () => {
    expect(errors(encodePayload({ type: "text", text: "   " })).text).toBeTruthy();
  });
});

describe("wifi", () => {
  const base = {
    type: "wifi" as const,
    ssid: "Home",
    password: "supersecret",
    encryption: "WPA" as const,
    hidden: false,
  };
  it("formats WPA networks", () => {
    expect(payload(encodePayload(base))).toBe("WIFI:T:WPA;S:Home;P:supersecret;;");
  });
  it("formats open networks without a password", () => {
    expect(payload(encodePayload({ ...base, encryption: "nopass", password: "ignored" }))).toBe(
      "WIFI:T:nopass;S:Home;;",
    );
  });
  it("marks hidden networks", () => {
    expect(payload(encodePayload({ ...base, hidden: true }))).toBe(
      "WIFI:T:WPA;S:Home;P:supersecret;H:true;;",
    );
  });
  it("escapes special characters", () => {
    expect(escapeWifi('a\\b;c,d:e"f')).toBe('a\\\\b\\;c\\,d\\:e\\"f');
  });
  it("validates WPA password length", () => {
    expect(errors(encodePayload({ ...base, password: "short" })).password).toMatch(/8 to 63/);
    expect(encodePayload({ ...base, password: "z".repeat(64) }).ok).toBe(false);
    expect(encodePayload({ ...base, password: "ab".repeat(32) }).ok).toBe(true); // 64 hex
  });
  it("validates WEP keys and warns about WEP", () => {
    expect(encodePayload({ ...base, encryption: "WEP", password: "abc" }).ok).toBe(false);
    const r = encodePayload({ ...base, encryption: "WEP", password: "abcde" });
    expect(r.ok && r.warnings.length).toBeTruthy();
  });
  it("limits SSID to 32 bytes", () => {
    expect(errors(encodePayload({ ...base, ssid: "ñ".repeat(17) })).ssid).toBeTruthy();
  });
});

describe("vcard", () => {
  const contact = { ...emptyContent("vcard"), firstName: "Ana", lastName: "Reyes" };
  it("produces a vCard 3.0 with CRLF line endings", () => {
    const p = payload(
      encodePayload({
        ...contact,
        organization: "Acme, Inc.",
        email: "ana@acme.ph",
        phone: "+63 (2) 8123-4567",
      }),
    );
    expect(p.startsWith("BEGIN:VCARD\r\nVERSION:3.0\r\n")).toBe(true);
    expect(p).toContain("N:Reyes;Ana;;;");
    expect(p).toContain("FN:Ana Reyes");
    expect(p).toContain("ORG:Acme\\, Inc.");
    expect(p).toContain("TEL;TYPE=WORK,VOICE:+63281234567");
    expect(p.endsWith("END:VCARD")).toBe(true);
  });
  it("allows company-only cards", () => {
    expect(
      payload(encodePayload({ ...emptyContent("vcard"), organization: "GetLaunch PH" })),
    ).toContain("FN:GetLaunch PH");
  });
  it("validates email, phone and website", () => {
    const e = errors(
      encodePayload({ ...contact, email: "nope", phone: "abc", website: "javascript:x" }),
    );
    expect(Object.keys(e).sort()).toEqual(["email", "phone", "website"]);
  });
  it("includes address and folds long lines", () => {
    const p = payload(encodePayload({ ...contact, street: "x".repeat(120), city: "Cebu" }));
    expect(p).toContain("\r\n ");
    expect(p.replace(/\r\n /g, "")).toContain(`ADR;TYPE=WORK:;;${"x".repeat(120)};Cebu;;;`);
  });
});

describe("email / phone / sms / whatsapp", () => {
  it("builds mailto with encoded subject and body", () => {
    expect(
      payload(
        encodePayload({ type: "email", to: "hi@x.ph", subject: "Hello & bye", body: "Line\nTwo" }),
      ),
    ).toBe("mailto:hi@x.ph?subject=Hello%20%26%20bye&body=Line%0ATwo");
    expect(payload(encodePayload({ type: "email", to: "hi@x.ph", subject: "", body: "" }))).toBe(
      "mailto:hi@x.ph",
    );
  });
  it("normalizes phone numbers", () => {
    expect(payload(encodePayload({ type: "phone", number: "+63 917-123-4567" }))).toBe(
      "tel:+639171234567",
    );
    expect(normalizePhone("12")).toBeNull();
    expect(normalizePhone("call me")).toBeNull();
  });
  it("builds SMSTO payloads", () => {
    expect(
      payload(encodePayload({ type: "sms", number: "0917 123 4567", message: "Hi: there" })),
    ).toBe("SMSTO:09171234567:Hi: there");
  });
  it("builds wa.me links and requires international format", () => {
    expect(
      payload(
        encodePayload({ type: "whatsapp", number: "+63 917 123 4567", message: "Hello po!" }),
      ),
    ).toBe("https://wa.me/639171234567?text=Hello%20po!");
    expect(
      errors(encodePayload({ type: "whatsapp", number: "0917 123 4567", message: "" })).number,
    ).toMatch(/leading 0/);
  });
});

describe("location", () => {
  const base = emptyContent("location");
  it("builds provider links from coordinates", () => {
    const c = { ...base, latitude: "14.5547", longitude: "121.0244" };
    expect(payload(encodePayload({ ...c, provider: "google" }))).toBe(
      "https://www.google.com/maps/search/?api=1&query=14.5547,121.0244",
    );
    expect(payload(encodePayload({ ...c, provider: "geo" }))).toBe("geo:14.5547,121.0244");
    expect(payload(encodePayload({ ...c, provider: "apple" }))).toContain("maps.apple.com");
    expect(payload(encodePayload({ ...c, provider: "osm" }))).toContain("openstreetmap.org");
  });
  it("rejects out-of-range coordinates", () => {
    const e = errors(encodePayload({ ...base, latitude: "91", longitude: "abc" }));
    expect(e.latitude && e.longitude).toBeTruthy();
  });
  it("builds search links from an address without any geocoding call", () => {
    const p = payload(
      encodePayload({ ...base, mode: "address", address: "SM Mall of Asia, Pasay" }),
    );
    expect(p).toBe(
      "https://www.google.com/maps/search/?api=1&query=SM%20Mall%20of%20Asia%2C%20Pasay",
    );
  });
});

describe("event", () => {
  const base = { ...emptyContent("event"), title: "Kasal; Ana, Ben" };
  it("formats timed events", () => {
    const p = payload(
      encodePayload({ ...base, start: "2026-12-05T15:00", end: "2026-12-05T21:30" }),
    );
    expect(p).toBe(
      "BEGIN:VEVENT\r\nSUMMARY:Kasal\\; Ana\\, Ben\r\nDTSTART:20261205T150000\r\nDTEND:20261205T213000\r\nEND:VEVENT",
    );
  });
  it("formats all-day events with an exclusive end date", () => {
    const p = payload(encodePayload({ ...base, allDay: true, start: "2026-12-31", end: "" }));
    expect(p).toContain("DTSTART;VALUE=DATE:20261231");
    expect(p).toContain("DTEND;VALUE=DATE:20270101");
  });
  it("rejects end before start", () => {
    expect(
      errors(encodePayload({ ...base, start: "2026-12-05T15:00", end: "2026-12-05T10:00" })).end,
    ).toBeTruthy();
  });
});

describe("escaping helpers", () => {
  it("escapes vCard/iCal text", () => {
    expect(escapeText("a\\b,c;d\ne")).toBe("a\\\\b\\,c\\;d\\ne");
  });
  it("folds without splitting multi-byte characters", () => {
    const folded = foldLine(`NOTE:${"日本".repeat(40)}`);
    const segments = folded.split("\r\n ");
    expect(segments.length).toBeGreaterThan(1);
    for (const s of segments) expect(new TextEncoder().encode(s).length).toBeLessThanOrEqual(75);
    expect(segments.join("")).toBe(`NOTE:${"日本".repeat(40)}`);
  });
});
