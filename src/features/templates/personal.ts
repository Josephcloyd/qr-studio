import { emptyContent } from "@/lib/qr/content";
import { C, frame, icon, linear, page, qr, shape, solid, text, type TemplateDef } from "./kit";

export const PERSONAL_TEMPLATES: TemplateDef[] = [
  {
    id: "personal-contact",
    name: "Personal contact",
    category: "Personal",
    description: "Minimal card — scan to save your number and email.",
    build: () => {
      const f = frame("business-card");
      return page("business-card", "Personal contact", { paint: solid(C.white) }, [
        qr(
          f,
          {
            ...emptyContent("vcard"),
            firstName: "Rico",
            lastName: "Bautista",
            mobile: "+63 918 222 0101",
            email: "rico@example.com",
          },
          0.06,
          0.12,
          0.3,
          { margin: 1, foreground: solid(C.ink) },
          "Contact QR",
        ),
        text(f, "Rico Bautista", 0.43, 0.2, 0.52, {
          fontFamily: "space-grotesk",
          fontSize: 21,
          fontWeight: 700,
          color: C.ink,
        }),
        text(f, "Photographer", 0.43, 0.36, 0.52, {
          fontSize: 10,
          color: C.vermilion,
          fontWeight: 600,
          uppercase: true,
          letterSpacing: 0.16,
        }),
        text(f, "+63 918 222 0101\nrico@example.com", 0.43, 0.56, 0.52, {
          fontFamily: "jetbrains-mono",
          fontSize: 9,
          lineHeight: 1.7,
          color: C.ink2,
        }),
      ]);
    },
  },
  {
    id: "portfolio",
    name: "Portfolio",
    category: "Personal",
    description: "Hand-signed card pointing to your work.",
    build: () => {
      const f = frame("square-card");
      return page(
        "square-card",
        "Portfolio",
        {
          paint: solid(C.paper),
          pattern: "diagonal",
          patternColor: C.ink,
          patternOpacity: 0.05,
          patternScale: 14,
        },
        [
          text(f, "Hi, I'm Lia —", 0.08, 0.07, 0.84, {
            fontFamily: "caveat",
            fontSize: 40,
            fontWeight: 700,
            color: C.rust,
          }),
          text(f, "illustrator & visual storyteller.", 0.08, 0.2, 0.6, {
            fontFamily: "fraunces",
            fontSize: 24,
            fontWeight: 500,
            lineHeight: 1.1,
            color: C.ink,
          }),
          qr(
            f,
            { type: "url", url: "https://example.com/portfolio" },
            0.5,
            0.45,
            0.42,
            {
              margin: 2,
              dotStyle: "dots",
              finderFrame: "circle",
              finderDot: "circle",
              foreground: solid(C.ink),
              background: solid(C.white),
            },
            "Portfolio QR",
          ),
          shape(f, "arrow", 0.12, 0.62, 0.3, 0.06, {
            stroke: C.ink,
            strokeWidth: 3,
            rotation: 18,
            name: "Arrow",
          }),
          text(f, "See my work", 0.08, 0.5, 0.36, {
            fontFamily: "caveat",
            fontSize: 28,
            color: C.ink,
          }),
          text(f, "lia.example.com", 0.08, 0.86, 0.6, {
            fontFamily: "jetbrains-mono",
            fontSize: 12,
            color: C.muted,
          }),
        ],
      );
    },
  },
  {
    id: "social-profile",
    name: "Social media profile",
    category: "Personal",
    description: "Story-sized “find me online” card.",
    build: () => {
      const f = frame("story");
      return page("story", "Find me online", { paint: linear(180, "#16130f", "#3d3428") }, [
        shape(f, "ellipse", 0.32, 0.08, 0.36, 0.2025, {
          fill: linear(135, "#ff5a1f", "#ffd166"),
          name: "Avatar ring",
        }),
        text(f, "JM", 0.32, 0.145, 0.36, {
          fontFamily: "fraunces",
          fontSize: 150,
          fontWeight: 700,
          color: C.ink,
          align: "center",
        }),
        text(f, "Jamie Mendoza", 0.06, 0.31, 0.88, {
          fontFamily: "fraunces",
          fontSize: 96,
          fontWeight: 600,
          color: C.paper,
          align: "center",
        }),
        text(f, "Coffee · Code · Cats", 0.06, 0.37, 0.88, {
          fontSize: 44,
          color: "#c8bfb0",
          align: "center",
        }),
        shape(f, "rect", 0.17, 0.45, 0.66, 0.37, {
          fill: solid(C.paper),
          cornerRadius: 64,
          name: "Code card",
        }),
        qr(
          f,
          { type: "url", url: "https://example.com/jamie" },
          0.23,
          0.483,
          0.54,
          {
            margin: 1,
            dotStyle: "fluid",
            finderFrame: "rounded",
            finderDot: "circle",
            foreground: solid(C.ink),
            background: solid(C.paper),
          },
          "Profile QR",
        ),
        icon(f, "at-sign", 0.46, 0.86, 0.08, C.vermilion, 2),
      ]);
    },
  },
  {
    id: "digital-profile-card",
    name: "Digital profile card",
    category: "Personal",
    description: "Dark business card with a gradient code and a WhatsApp link.",
    build: () => {
      const f = frame("business-card");
      return page("business-card", "Digital profile card", { paint: solid(C.ink) }, [
        text(f, "Kai Navarro", 0.07, 0.16, 0.55, {
          fontFamily: "outfit",
          fontSize: 22,
          fontWeight: 700,
          color: C.paper,
        }),
        text(f, "Freelance developer", 0.07, 0.32, 0.55, { fontSize: 10, color: "#b8ae9f" }),
        icon(f, "message", 0.07, 0.58, 0.05, C.vermilion, 2),
        text(f, "Message me on WhatsApp", 0.14, 0.58, 0.5, {
          fontSize: 9.5,
          fontWeight: 600,
          color: C.paper,
        }),
        shape(f, "rect", 0.64, 0.1, 0.3, 0.8, {
          fill: solid(C.paper),
          cornerRadius: 12,
          name: "Code plate",
        }),
        qr(
          f,
          { type: "whatsapp", number: "+63 917 000 1234", message: "Hi Kai! Got your card." },
          0.66,
          0.15,
          0.26,
          {
            margin: 1,
            dotStyle: "rounded",
            finderFrame: "rounded",
            finderDot: "rounded",
            foreground: linear(135, "#16130f", "#7a1f5c"),
            background: solid(C.paper),
          },
          "WhatsApp QR",
        ),
        text(f, "SCAN", 0.64, 0.72, 0.3, {
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: 0.3,
          color: C.ink,
          align: "center",
        }),
      ]);
    },
  },
];
