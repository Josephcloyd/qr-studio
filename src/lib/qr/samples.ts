import { emptyContent, type ContentOf, type QrContent, type QrType } from "./content";

/** Sample content so newly added codes render (and scan) immediately. */
export const SAMPLE_CONTENT: { [K in QrType]: ContentOf<K> } = {
  url: { type: "url", url: "https://getlaunchph.com" },
  text: { type: "text", text: "Hello from QR Studio!" },
  wifi: {
    type: "wifi",
    ssid: "Guest Wi-Fi",
    password: "welcome2026",
    encryption: "WPA",
    hidden: false,
  },
  vcard: {
    ...emptyContent("vcard"),
    firstName: "Juan",
    lastName: "Dela Cruz",
    organization: "Your Company",
    mobile: "+63 917 123 4567",
    email: "hello@example.com",
    website: "example.com",
  },
  email: { type: "email", to: "hello@example.com", subject: "Hello!", body: "" },
  phone: { type: "phone", number: "+63 2 8123 4567" },
  sms: { type: "sms", number: "+63 917 123 4567", message: "Hi! I saw your poster." },
  whatsapp: { type: "whatsapp", number: "+63 917 123 4567", message: "Hi! I'd like to order." },
  location: {
    type: "location",
    mode: "coordinates",
    latitude: "14.5995",
    longitude: "120.9842",
    address: "",
    provider: "google",
  },
  event: {
    type: "event",
    title: "Grand Opening",
    location: "Makati City",
    start: "2026-12-12T17:00",
    end: "2026-12-12T21:00",
    allDay: false,
    description: "",
  },
};

export function sampleContent(type: QrType): QrContent {
  return structuredClone(SAMPLE_CONTENT[type]);
}
