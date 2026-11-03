import { C, frame, icon, linear, page, qr, shape, solid, text, type TemplateDef } from "./kit";

export const RESTAURANT_TEMPLATES: TemplateDef[] = [
  {
    id: "digital-menu",
    name: "Digital menu",
    category: "Restaurant",
    description: "Table tent with a warm, editorial menu call-out.",
    build: () => {
      const f = frame("table-tent");
      return page(
        "table-tent",
        "Digital menu",
        {
          paint: solid("#fff4e6"),
          pattern: "dots",
          patternColor: C.rust,
          patternOpacity: 0.07,
          patternScale: 18,
        },
        [
          text(f, "KUSINA NI LOLA", 0.08, 0.06, 0.84, {
            fontFamily: "jetbrains-mono",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: 0.3,
            color: C.rust,
            align: "center",
          }),
          text(f, "View our menu", 0.06, 0.11, 0.88, {
            fontFamily: "playfair-display",
            fontSize: 44,
            fontWeight: 700,
            italic: true,
            color: C.ink,
            align: "center",
            lineHeight: 1,
          }),
          icon(f, "utensils", 0.44, 0.255, 0.12, C.rust, 1.75),
          shape(f, "rect", 0.18, 0.38, 0.64, 0.43, {
            fill: solid(C.white),
            cornerRadius: 18,
            stroke: C.ink,
            strokeWidth: 2,
            name: "Menu card",
          }),
          qr(
            f,
            { type: "url", url: "https://example.com/menu" },
            0.23,
            0.413,
            0.54,
            {
              margin: 1,
              dotStyle: "classy",
              finderFrame: "leaf",
              finderDot: "leaf",
              foreground: solid(C.ink),
            },
            "Menu QR",
          ),
          text(f, "Point your camera at the code", 0.1, 0.85, 0.8, {
            fontSize: 13,
            color: C.ink2,
            align: "center",
          }),
          text(f, "Free Wi-Fi · ask our staff", 0.1, 0.9, 0.8, {
            fontSize: 11,
            color: C.muted,
            align: "center",
            fontWeight: 500,
          }),
        ],
      );
    },
  },
  {
    id: "order-at-table",
    name: "Restaurant ordering",
    category: "Restaurant",
    description: "Scan-to-order card with numbered steps.",
    build: () => {
      const f = frame("square-card");
      const step = (n: string, label: string, fy: number) => [
        shape(f, "ellipse", 0.08, fy, 0.075, 0.075, {
          fill: solid(C.vermilion),
          name: `Step ${n}`,
        }),
        text(f, n, 0.08, fy + 0.012, 0.075, {
          fontSize: 13,
          fontWeight: 800,
          align: "center",
          color: C.ink,
        }),
        text(f, label, 0.18, fy + 0.012, 0.32, { fontSize: 13, fontWeight: 600, color: C.ink }),
      ];
      return page("square-card", "Scan to order", { paint: solid(C.paper) }, [
        text(f, "Scan to order", 0.08, 0.08, 0.84, {
          fontFamily: "bebas-neue",
          fontSize: 54,
          color: C.ink,
          letterSpacing: 0.02,
        }),
        text(f, "Skip the line — order and pay from your table.", 0.08, 0.24, 0.42, {
          fontSize: 13,
          color: C.muted,
          lineHeight: 1.45,
        }),
        ...step("1", "Scan the code", 0.46),
        ...step("2", "Pick your food", 0.6),
        ...step("3", "We bring it over", 0.74),
        shape(f, "rect", 0.52, 0.3, 0.42, 0.6, {
          fill: solid(C.ink),
          cornerRadius: 20,
          name: "Code panel",
        }),
        qr(
          f,
          { type: "url", url: "https://example.com/order?table=12" },
          0.56,
          0.34,
          0.34,
          {
            margin: 2,
            foreground: solid(C.ink),
            background: solid(C.white),
            dotStyle: "rounded",
            finderFrame: "rounded",
            finderDot: "circle",
          },
          "Order QR",
        ),
        text(f, "TABLE 12", 0.52, 0.78, 0.42, {
          fontFamily: "jetbrains-mono",
          fontSize: 14,
          fontWeight: 700,
          color: C.paper,
          align: "center",
          letterSpacing: 0.2,
        }),
      ]);
    },
  },
  {
    id: "wifi-access",
    name: "Wi-Fi access",
    category: "Restaurant",
    description: "Guests join your network instantly — no typing passwords.",
    build: () => {
      const f = frame("square-card");
      return page("square-card", "Free Wi-Fi", { paint: linear(150, "#eef2ff", "#d9defd") }, [
        shape(f, "ellipse", 0.42, 0.07, 0.16, 0.16, { fill: solid(C.cobalt), name: "Icon circle" }),
        icon(f, "wifi", 0.455, 0.105, 0.09, C.white, 2.25),
        text(f, "Connect to Wi-Fi", 0.1, 0.26, 0.8, {
          fontFamily: "outfit",
          fontSize: 30,
          fontWeight: 700,
          color: C.navy,
          align: "center",
        }),
        qr(
          f,
          {
            type: "wifi",
            ssid: "Cafe Guest",
            password: "kapeTayo2026",
            encryption: "WPA",
            hidden: false,
          },
          0.29,
          0.38,
          0.42,
          {
            margin: 2,
            dotStyle: "dots",
            finderFrame: "circle",
            finderDot: "circle",
            foreground: solid(C.navy),
            background: solid(C.white),
          },
          "Wi-Fi QR",
        ),
        text(f, "Network  Cafe Guest\nPassword  kapeTayo2026", 0.15, 0.83, 0.7, {
          fontFamily: "jetbrains-mono",
          fontSize: 11.5,
          color: C.navy,
          align: "center",
          lineHeight: 1.6,
        }),
      ]);
    },
  },
  {
    id: "customer-feedback",
    name: "Customer feedback",
    category: "Restaurant",
    description: "Invite happy diners to leave a review.",
    build: () => {
      const f = frame("square-card");
      const stars = [0.27, 0.37, 0.47, 0.57, 0.67].map((fx) =>
        shape(f, "star", fx - 0.01, 0.1, 0.08, 0.08, {
          fill: solid(C.sun),
          name: "Star",
          sides: 5,
          innerRatio: 0.45,
        }),
      );
      return page("square-card", "Leave a review", { paint: solid(C.ink) }, [
        ...stars,
        text(f, "Loved your meal?", 0.08, 0.22, 0.84, {
          fontFamily: "fraunces",
          fontSize: 32,
          fontWeight: 600,
          italic: true,
          color: C.paper,
          align: "center",
        }),
        text(f, "Tell us how we did — it takes 30 seconds.", 0.12, 0.33, 0.76, {
          fontSize: 12.5,
          color: "#c8bfb0",
          align: "center",
        }),
        shape(f, "rect", 0.27, 0.43, 0.46, 0.46, {
          fill: solid(C.paper),
          cornerRadius: 18,
          name: "Code plate",
        }),
        qr(
          f,
          { type: "url", url: "https://example.com/review" },
          0.3,
          0.46,
          0.4,
          {
            margin: 1,
            dotStyle: "fluid",
            finderFrame: "rounded",
            finderDot: "rounded",
            foreground: solid(C.ink),
            background: solid(C.paper),
          },
          "Review QR",
        ),
        text(f, "SALAMAT PO!", 0.1, 0.92, 0.8, {
          fontFamily: "jetbrains-mono",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.3,
          color: C.sun,
          align: "center",
        }),
      ]);
    },
  },
];
