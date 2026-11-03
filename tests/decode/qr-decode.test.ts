import { describe, expect, it } from "vitest";
import { linear, radial, solid, NO_PAINT } from "@/lib/model/paint";
import { encodePayload } from "@/lib/qr/payloads";
import {
  DEFAULT_LOGO,
  DEFAULT_QR_STYLE,
  DOT_STYLES,
  FINDER_COMPATIBILITY,
  FINDER_DOT_STYLES,
  FINDER_FRAME_STYLES,
  sanitizeQrStyle,
  type EcLevel,
  type QrStyle,
} from "@/lib/qr/style";
import { decodeSvg, makeLogoDataUrl, renderQrMarkup } from "../helpers/decode";

const URL_PAYLOAD = "https://getlaunch.ph/qr-studio?ref=print&utm=none";
const style = (patch: Partial<QrStyle>): QrStyle => ({ ...DEFAULT_QR_STYLE, ...patch });

describe("QR renderer output decodes with an independent decoder", () => {
  it.each(DOT_STYLES.map((d) => d.id))("dot style %s", (dotStyle) => {
    const svg = renderQrMarkup(URL_PAYLOAD, style({ dotStyle }));
    expect(decodeSvg(svg)).toBe(URL_PAYLOAD);
  });

  // Every allowed finder pairing × every module style, with a logo, at two sizes.
  const pairs = FINDER_FRAME_STYLES.flatMap((f) =>
    FINDER_COMPATIBILITY[f.id].map((d) => [f.id, d] as const),
  );
  it.each(pairs)("finder %s + %s with every module style and a logo", (finderFrame, finderDot) => {
    const logo = makeLogoDataUrl();
    for (const { id: dotStyle } of DOT_STYLES) {
      const s = style({
        finderFrame,
        finderDot,
        dotStyle,
        ecLevel: "H",
        logo: { ...DEFAULT_LOGO, assetId: "logo", size: 0.24 },
      });
      const svg = renderQrMarkup(URL_PAYLOAD, s, logo);
      for (const width of [400, 800]) {
        expect(decodeSvg(svg, width), `${dotStyle} @${width}px`).toBe(URL_PAYLOAD);
      }
    }
  });

  it("maps unreliable finder pairings to a safe dot", () => {
    for (const f of FINDER_FRAME_STYLES) {
      for (const d of FINDER_DOT_STYLES) {
        const safe = sanitizeQrStyle(style({ finderFrame: f.id, finderDot: d.id })).finderDot;
        expect(FINDER_COMPATIBILITY[f.id]).toContain(safe);
      }
    }
  });

  it.each<EcLevel>(["L", "M", "Q", "H"])("error correction %s", (ecLevel) => {
    const svg = renderQrMarkup(URL_PAYLOAD, style({ ecLevel }));
    expect(decodeSvg(svg)).toBe(URL_PAYLOAD);
  });

  it("dark custom colors and finder accents", () => {
    const svg = renderQrMarkup(
      URL_PAYLOAD,
      style({ foreground: solid("#1d3557"), finderFrameColor: "#c1121f", finderDotColor: "#003049", background: solid("#fdf6e3") }),
    );
    expect(decodeSvg(svg)).toBe(URL_PAYLOAD);
  });

  it("linear and radial gradient foregrounds", () => {
    const a = renderQrMarkup(URL_PAYLOAD, style({ foreground: linear(45, "#1b263b", "#7b2cbf") }));
    const b = renderQrMarkup(URL_PAYLOAD, style({ foreground: radial("#000000", "#2b2d42"), dotStyle: "dots" }));
    expect(decodeSvg(a)).toBe(URL_PAYLOAD);
    expect(decodeSvg(b)).toBe(URL_PAYLOAD);
  });

  it("gradient background", () => {
    const svg = renderQrMarkup(URL_PAYLOAD, style({ background: linear(90, "#ffffff", "#ffe8d6") }));
    expect(decodeSvg(svg)).toBe(URL_PAYLOAD);
  });

  it("transparent background over a light surface", () => {
    const svg = renderQrMarkup(URL_PAYLOAD, style({ background: NO_PAINT }));
    expect(decodeSvg(svg, 600, "#f5efe6")).toBe(URL_PAYLOAD);
  });

  it("inverted colors (light on dark)", () => {
    const svg = renderQrMarkup(URL_PAYLOAD, style({ foreground: solid("#ffffff"), background: solid("#111111") }));
    expect(decodeSvg(svg)).toBe(URL_PAYLOAD);
  });

  it("minimum quiet zone", () => {
    const svg = renderQrMarkup(URL_PAYLOAD, style({ margin: 2 }));
    expect(decodeSvg(svg)).toBe(URL_PAYLOAD);
  });

  it("small export resolution", () => {
    const svg = renderQrMarkup(URL_PAYLOAD, style({ dotStyle: "fluid" }));
    expect(decodeSvg(svg, 180)).toBe(URL_PAYLOAD);
  });
});

describe("QR codes with logos stay scannable", () => {
  const logo = makeLogoDataUrl();
  const withLogo = (patch: Partial<typeof DEFAULT_LOGO>, base: Partial<QrStyle> = {}) =>
    style({ ...base, ecLevel: "H", logo: { ...DEFAULT_LOGO, assetId: "logo", ...patch } });

  it.each([0.12, 0.2, 0.26, 0.3])("logo size %s with rounded plate", (size) => {
    const svg = renderQrMarkup(URL_PAYLOAD, withLogo({ size }), logo);
    expect(decodeSvg(svg)).toBe(URL_PAYLOAD);
  });

  it.each(["none", "square", "rounded", "circle"] as const)("plate %s", (plate) => {
    const svg = renderQrMarkup(URL_PAYLOAD, withLogo({ plate, size: 0.24 }), logo);
    expect(decodeSvg(svg)).toBe(URL_PAYLOAD);
  });

  it("offset logo", () => {
    const svg = renderQrMarkup(URL_PAYLOAD, withLogo({ offsetX: 0.12, offsetY: -0.1, size: 0.2 }), logo);
    expect(decodeSvg(svg)).toBe(URL_PAYLOAD);
  });

  it("logo + styled dots + gradient", () => {
    const svg = renderQrMarkup(
      URL_PAYLOAD,
      withLogo(
        { size: 0.24, plate: "circle" },
        { dotStyle: "dots", finderFrame: "circle", finderDot: "circle", foreground: linear(135, "#0b132b", "#3a506b") },
      ),
      logo,
    );
    expect(decodeSvg(svg)).toBe(URL_PAYLOAD);
  });

  it("clamps oversized logos so the code still decodes", () => {
    const svg = renderQrMarkup(URL_PAYLOAD, withLogo({ size: 0.9 }), logo);
    expect(decodeSvg(svg)).toBe(URL_PAYLOAD);
  });
});

describe("payload round-trips through rendering", () => {
  const roundTrip = (content: Parameters<typeof encodePayload>[0]) => {
    const encoded = encodePayload(content);
    if (!encoded.ok) throw new Error(JSON.stringify(encoded.errors));
    const svg = renderQrMarkup(encoded.payload, style({ ecLevel: "M" }));
    return { payload: encoded.payload, decoded: decodeSvg(svg, 800) };
  };

  it("non-English text (Filipino, Japanese, Arabic, emoji)", () => {
    const text = "Salamat po! Mabuhay ñ — こんにちは世界 — مرحبا — 🎉📱";
    const { payload, decoded } = roundTrip({ type: "text", text });
    expect(decoded).toBe(payload);
  });

  it("special characters in Wi-Fi credentials", () => {
    const { payload, decoded } = roundTrip({
      type: "wifi",
      ssid: 'Café; "Guest":5G',
      password: "p@ss;word,with:\\chars",
      encryption: "WPA",
      hidden: true,
    });
    expect(decoded).toBe(payload);
    expect(payload).toBe('WIFI:T:WPA;S:Café\\; \\"Guest\\"\\:5G;P:p@ss\\;word\\,with\\:\\\\chars;H:true;;');
  });

  it("long text near capacity", () => {
    const text = "Lorem ipsum dolor sit amet, ".repeat(40);
    const { payload, decoded } = roundTrip({ type: "text", text });
    expect(decoded).toBe(payload);
  });

  it("vCard contact", () => {
    const { payload, decoded } = roundTrip({
      type: "vcard",
      firstName: "María",
      lastName: "Dela Cruz",
      organization: "GetLaunch Ph",
      title: "Founder",
      phone: "+63 2 8123 4567",
      mobile: "+63 917 123 4567",
      email: "maria@example.com",
      website: "example.com",
      street: "123 Ayala Ave, Unit 4",
      city: "Makati",
      region: "Metro Manila",
      postalCode: "1226",
      country: "Philippines",
      note: "Met at the expo; follow up",
    });
    expect(decoded).toBe(payload);
  });

  it("calendar event", () => {
    const { payload, decoded } = roundTrip({
      type: "event",
      title: "Launch Night",
      location: "BGC, Taguig",
      start: "2026-12-05T18:30",
      end: "2026-12-05T22:00",
      allDay: false,
      description: "Bring your ticket, please",
    });
    expect(decoded).toBe(payload);
  });
});
