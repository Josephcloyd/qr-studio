import { emptyContent } from "@/lib/qr/content";
import { C, frame, icon, linear, page, qr, shape, solid, text, type TemplateDef } from "./kit";

const contact = {
  ...emptyContent("vcard"),
  firstName: "Andrea",
  lastName: "Santos",
  organization: "Santos Studio",
  title: "Creative Director",
  mobile: "+63 917 555 0142",
  email: "andrea@santos.studio",
  website: "santos.studio",
  city: "Makati",
  country: "Philippines",
};

export const BUSINESS_TEMPLATES: TemplateDef[] = [
  {
    id: "business-card-ink",
    name: "Business contact card",
    category: "Business",
    description: "Two-sided feel on one card: details left, save-contact code right.",
    build: () => {
      const f = frame("business-card");
      return page("business-card", "Business card", { paint: solid(C.paper) }, [
        shape(f, "rect", 0, 0, 0.035, 1, { fill: solid(C.vermilion), name: "Accent bar" }),
        text(f, "Andrea Santos", 0.09, 0.14, 0.56, { fontFamily: "fraunces", fontSize: 22, fontWeight: 700, color: C.ink, letterSpacing: -0.01 }),
        text(f, "Creative Director · Santos Studio", 0.09, 0.3, 0.56, { fontSize: 9.5, fontWeight: 500, color: C.muted }),
        shape(f, "line", 0.09, 0.44, 0.18, 0.04, { stroke: C.ink, strokeWidth: 1.5, name: "Divider" }),
        text(f, "+63 917 555 0142\nandrea@santos.studio\nsantos.studio", 0.09, 0.55, 0.56, { fontSize: 9.5, lineHeight: 1.6, color: C.ink2 }),
        shape(f, "rect", 0.66, 0.1, 0.3, 0.8, { fill: solid(C.white), cornerRadius: 10, stroke: "#e2dccf", strokeWidth: 1, name: "QR card" }),
        qr(f, contact, 0.68, 0.14, 0.26, { margin: 2, dotStyle: "rounded", finderFrame: "rounded", finderDot: "rounded", foreground: solid(C.ink) }, "Contact QR"),
        text(f, "SAVE CONTACT", 0.66, 0.73, 0.3, { fontSize: 7, fontWeight: 700, letterSpacing: 0.18, align: "center", color: C.ink }),
      ]);
    },
  },
  {
    id: "company-profile",
    name: "Business profile",
    category: "Business",
    description: "A5 profile sheet with a bold headline and a code to your company page.",
    build: () => {
      const f = frame("a5");
      return page("a5", "Company profile", { paint: solid(C.cream) }, [
        shape(f, "rect", 0, 0, 1, 0.42, { fill: solid(C.navy), name: "Header block" }),
        text(f, "EST. 2016 · MANILA", 0.08, 0.06, 0.6, { fontFamily: "jetbrains-mono", fontSize: 11, fontWeight: 600, letterSpacing: 0.2, color: "#9fb2ff" }),
        text(f, "We build brands people remember.", 0.08, 0.11, 0.8, { fontFamily: "fraunces", fontSize: 46, fontWeight: 600, lineHeight: 1.05, color: C.white, letterSpacing: -0.02 }),
        text(f, "Strategy, identity and packaging for growing Filipino businesses.", 0.08, 0.31, 0.7, { fontSize: 14, color: "#cdd5f5", lineHeight: 1.5 }),
        text(f, "What we do", 0.08, 0.48, 0.4, { fontSize: 13, fontWeight: 700, color: C.ink, uppercase: true, letterSpacing: 0.14 }),
        text(f, "Brand identity\nPackaging design\nWebsites & digital\nPrint & signage", 0.08, 0.52, 0.42, { fontSize: 15, lineHeight: 1.7, color: C.ink2 }),
        qr(f, { type: "url", url: "https://example.com/about" }, 0.56, 0.5, 0.36, { dotStyle: "classy", finderFrame: "leaf", finderDot: "leaf", foreground: solid(C.navy), margin: 2 }, "Profile QR"),
        text(f, "Scan for our full portfolio", 0.56, 0.77, 0.36, { fontSize: 12, align: "center", color: C.muted }),
        shape(f, "line", 0.08, 0.88, 0.84, 0.01, { stroke: C.ink, strokeWidth: 1 }),
        text(f, "hello@example.com · +63 2 8123 4567", 0.08, 0.91, 0.84, { fontSize: 12, color: C.ink2 }),
      ]);
    },
  },
  {
    id: "company-website",
    name: "Company website",
    category: "Business",
    description: "Dark square card that sends people straight to your site.",
    build: () => {
      const f = frame("square-card");
      return page("square-card", "Visit our website", { paint: solid(C.ink) }, [
        text(f, "Visit our website", 0.1, 0.08, 0.8, { fontFamily: "fraunces", fontSize: 30, fontWeight: 600, color: C.paper, align: "center", letterSpacing: -0.01 }),
        shape(f, "rect", 0.22, 0.24, 0.56, 0.56, { fill: solid(C.paper), cornerRadius: 22, name: "Code plate" }),
        qr(f, { type: "url", url: "https://example.com" }, 0.26, 0.28, 0.48, { margin: 1, dotStyle: "fluid", finderFrame: "rounded", finderDot: "circle", foreground: solid(C.ink), background: solid(C.paper) }),
        text(f, "example.com", 0.1, 0.86, 0.8, { fontFamily: "jetbrains-mono", fontSize: 14, color: C.vermilion, align: "center", letterSpacing: 0.04 }),
      ]);
    },
  },
  {
    id: "customer-support",
    name: "Customer support",
    category: "Business",
    description: "Counter-top sign that opens a WhatsApp chat with your team.",
    build: () => {
      const f = frame("table-tent");
      return page("table-tent", "Customer support", { paint: linear(160, "#effaf4", "#d6f0e2") }, [
        icon(f, "message", 0.42, 0.07, 0.16, C.forest, 2),
        text(f, "Need a hand?", 0.08, 0.2, 0.84, { fontFamily: "fraunces", fontSize: 36, fontWeight: 700, color: C.forest, align: "center" }),
        text(f, "Chat with our support team on WhatsApp — we usually reply within minutes.", 0.12, 0.29, 0.76, { fontSize: 14, color: "#2f5b46", align: "center", lineHeight: 1.45 }),
        shape(f, "rect", 0.16, 0.42, 0.68, 0.46, { fill: solid(C.white), cornerRadius: 24, name: "Card" }),
        qr(f, { type: "whatsapp", number: "+63 917 555 0199", message: "Hi! I need help with my order." }, 0.22, 0.45, 0.56, { margin: 1, dotStyle: "rounded", finderFrame: "rounded", finderDot: "rounded", foreground: solid(C.forest) }),
        text(f, "Mon–Sat · 9am–8pm", 0.16, 0.92, 0.68, { fontSize: 12, fontWeight: 600, color: C.forest, align: "center", letterSpacing: 0.08, uppercase: true }),
      ]);
    },
  },
];
