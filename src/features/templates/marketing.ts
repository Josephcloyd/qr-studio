import {
  C,
  frame,
  icon,
  linear,
  page,
  qr,
  shape,
  solid,
  text,
  NO_PAINT,
  type TemplateDef,
} from "./kit";

export const MARKETING_TEMPLATES: TemplateDef[] = [
  {
    id: "social-follow",
    name: "Social media",
    category: "Marketing",
    description: "Square post that sends people to your profile.",
    build: () => {
      const f = frame("social-square");
      return page("social-square", "Follow us", { paint: linear(135, "#7a1f5c", "#d1450f") }, [
        text(f, "@kapetayo.ph", 0.08, 0.08, 0.84, {
          fontFamily: "jetbrains-mono",
          fontSize: 40,
          fontWeight: 600,
          color: "#ffd9c7",
          align: "center",
        }),
        text(f, "Follow us for daily brews & drops", 0.08, 0.15, 0.84, {
          fontFamily: "fraunces",
          fontSize: 84,
          fontWeight: 700,
          lineHeight: 1.02,
          color: C.white,
          align: "center",
          letterSpacing: -0.02,
        }),
        shape(f, "rect", 0.29, 0.43, 0.42, 0.42, {
          fill: solid(C.white),
          cornerRadius: 48,
          name: "Code card",
        }),
        qr(
          f,
          { type: "url", url: "https://example.com/@kapetayo.ph" },
          0.33,
          0.47,
          0.34,
          {
            margin: 1,
            dotStyle: "fluid",
            finderFrame: "rounded",
            finderDot: "rounded",
            foreground: linear(135, "#7a1f5c", "#d1450f"),
          },
          "Profile QR",
        ),
        icon(f, "camera", 0.2, 0.9, 0.05, C.white, 2),
        icon(f, "heart", 0.475, 0.9, 0.05, C.white, 2),
        icon(f, "share", 0.75, 0.9, 0.05, C.white, 2),
      ]);
    },
  },
  {
    id: "product-promotion",
    name: "Product promotion",
    category: "Marketing",
    description: "A4 sale poster with a bold burst and a deal code.",
    build: () => {
      const f = frame("a4");
      return page("a4", "Product promotion", { paint: solid(C.sun) }, [
        shape(f, "star", 0.56, 0.05, 0.38, 0.27, {
          fill: solid(C.vermilion),
          sides: 18,
          innerRatio: 0.82,
          name: "Sale burst",
          rotation: 8,
        }),
        text(f, "20%\nOFF", 0.58, 0.1, 0.34, {
          fontFamily: "bebas-neue",
          fontSize: 96,
          lineHeight: 0.85,
          color: C.ink,
          align: "center",
          rotation: 8,
        }),
        text(f, "WEEKEND SALE", 0.07, 0.07, 0.5, {
          fontFamily: "jetbrains-mono",
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: 0.2,
          color: C.ink,
        }),
        text(f, "Fresh kicks for the holidays.", 0.07, 0.11, 0.5, {
          fontFamily: "fraunces",
          fontSize: 64,
          fontWeight: 700,
          lineHeight: 1,
          color: C.ink,
          letterSpacing: -0.02,
        }),
        shape(f, "rect", 0.07, 0.42, 0.86, 0.46, {
          fill: solid(C.ink),
          cornerRadius: 36,
          name: "Panel",
        }),
        qr(
          f,
          { type: "url", url: "https://example.com/sale" },
          0.13,
          0.465,
          0.36,
          {
            margin: 2,
            dotStyle: "rounded",
            finderFrame: "rounded",
            finderDot: "square",
            foreground: solid(C.ink),
            background: solid(C.white),
          },
          "Shop QR",
        ),
        text(f, "Scan to shop the sale", 0.54, 0.5, 0.36, {
          fontSize: 30,
          fontWeight: 700,
          color: C.sun,
          lineHeight: 1.15,
        }),
        text(f, "Use code\nHOLIDAY20\nat checkout", 0.54, 0.6, 0.36, {
          fontFamily: "jetbrains-mono",
          fontSize: 20,
          color: C.paper,
          lineHeight: 1.5,
        }),
        text(f, "Valid until 31 Dec 2026 · while stocks last", 0.07, 0.92, 0.86, {
          fontSize: 13,
          color: C.ink2,
          align: "center",
        }),
      ]);
    },
  },
  {
    id: "advertisement",
    name: "Advertisement",
    category: "Marketing",
    description: "“Now open” flyer for a new store or branch.",
    build: () => {
      const f = frame("flyer");
      return page("flyer", "Now open", { paint: solid(C.paper) }, [
        shape(f, "ellipse", 0.48, -0.12, 0.7, 0.54, {
          fill: solid(C.vermilion),
          name: "Sun shape",
        }),
        text(f, "NOW\nOPEN", 0.07, 0.07, 0.6, {
          fontFamily: "bebas-neue",
          fontSize: 200,
          lineHeight: 0.84,
          color: C.ink,
        }),
        text(f, "Panaderya Uno — fresh pandesal from 5AM daily.", 0.07, 0.43, 0.6, {
          fontFamily: "fraunces",
          fontSize: 34,
          fontWeight: 500,
          lineHeight: 1.15,
          color: C.ink,
        }),
        icon(f, "croissant", 0.07, 0.6, 0.08, C.rust, 1.75),
        text(f, "123 Mabini St., Quezon City\nOpen daily 5AM – 9PM", 0.18, 0.605, 0.45, {
          fontSize: 18,
          lineHeight: 1.5,
          color: C.ink2,
        }),
        shape(f, "rect", 0.6, 0.62, 0.33, 0.3, {
          fill: NO_PAINT,
          stroke: C.ink,
          strokeWidth: 3,
          strokeStyle: "dashed",
          cornerRadius: 20,
          name: "Cut-out frame",
        }),
        qr(
          f,
          {
            type: "location",
            mode: "address",
            latitude: "",
            longitude: "",
            address: "Panaderya Uno, Mabini St, Quezon City",
            provider: "google",
          },
          0.635,
          0.64,
          0.26,
          {
            margin: 2,
            dotStyle: "classy",
            finderFrame: "leaf",
            finderDot: "leaf",
            foreground: solid(C.ink),
            background: solid(C.paper),
          },
          "Directions QR",
        ),
        text(f, "GET DIRECTIONS", 0.6, 0.875, 0.33, {
          fontSize: 14,
          fontWeight: 800,
          letterSpacing: 0.2,
          align: "center",
          color: C.ink,
        }),
      ]);
    },
  },
  {
    id: "product-label",
    name: "Product information",
    category: "Marketing",
    description: "Round-cornered sticker linking to product details.",
    build: () => {
      const f = frame("sticker");
      return page("sticker", "Product label", { paint: solid(C.forest) }, [
        shape(f, "rect", 0.06, 0.06, 0.88, 0.88, {
          fill: NO_PAINT,
          stroke: "#9cc5ad",
          strokeWidth: 1.5,
          strokeStyle: "dashed",
          cornerRadius: 16,
          name: "Inner line",
        }),
        icon(f, "leaf", 0.44, 0.1, 0.12, "#bfe0cc", 1.75),
        text(f, "100% Organic Coffee", 0.1, 0.24, 0.8, {
          fontFamily: "outfit",
          fontSize: 20,
          fontWeight: 700,
          color: C.white,
          align: "center",
        }),
        shape(f, "rect", 0.3, 0.4, 0.4, 0.4, {
          fill: solid(C.white),
          cornerRadius: 14,
          name: "Code plate",
        }),
        qr(
          f,
          { type: "url", url: "https://example.com/beans/benguet" },
          0.325,
          0.425,
          0.35,
          {
            margin: 1,
            dotStyle: "rounded",
            finderFrame: "rounded",
            finderDot: "rounded",
            foreground: solid(C.forest),
          },
          "Product QR",
        ),
        text(f, "Scan for origin & brew guide", 0.1, 0.84, 0.8, {
          fontSize: 11,
          fontWeight: 600,
          color: "#d6ecdf",
          align: "center",
          letterSpacing: 0.04,
        }),
      ]);
    },
  },
];
