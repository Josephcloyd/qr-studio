/** QR content types. Each is encoded into a static payload — no redirects, no tracking. */

export const QR_TYPES = [
  "url",
  "text",
  "wifi",
  "vcard",
  "email",
  "phone",
  "sms",
  "whatsapp",
  "location",
  "event",
] as const;

export type QrType = (typeof QR_TYPES)[number];

export interface UrlContent {
  type: "url";
  url: string;
}
export interface TextContent {
  type: "text";
  text: string;
}
export type WifiEncryption = "WPA" | "WEP" | "nopass";
export interface WifiContent {
  type: "wifi";
  ssid: string;
  password: string;
  encryption: WifiEncryption;
  hidden: boolean;
}
export interface VCardContent {
  type: "vcard";
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  mobile: string;
  email: string;
  website: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  note: string;
}
export interface EmailContent {
  type: "email";
  to: string;
  subject: string;
  body: string;
}
export interface PhoneContent {
  type: "phone";
  number: string;
}
export interface SmsContent {
  type: "sms";
  number: string;
  message: string;
}
export interface WhatsAppContent {
  type: "whatsapp";
  number: string;
  message: string;
}
export type MapProvider = "google" | "apple" | "osm" | "geo";
export interface LocationContent {
  type: "location";
  mode: "coordinates" | "address";
  latitude: string;
  longitude: string;
  address: string;
  provider: MapProvider;
}
export interface EventContent {
  type: "event";
  title: string;
  location: string;
  /** `YYYY-MM-DDTHH:mm` (datetime-local) or `YYYY-MM-DD` when allDay. */
  start: string;
  end: string;
  allDay: boolean;
  description: string;
}

export type QrContent =
  | UrlContent
  | TextContent
  | WifiContent
  | VCardContent
  | EmailContent
  | PhoneContent
  | SmsContent
  | WhatsAppContent
  | LocationContent
  | EventContent;

export type ContentOf<T extends QrType> = Extract<QrContent, { type: T }>;

export const QR_TYPE_LABELS: Record<QrType, string> = {
  url: "Website",
  text: "Text",
  wifi: "Wi-Fi",
  vcard: "Contact",
  email: "Email",
  phone: "Phone",
  sms: "SMS",
  whatsapp: "WhatsApp",
  location: "Location",
  event: "Event",
};

export function emptyContent<T extends QrType>(type: T): ContentOf<T> {
  const map: { [K in QrType]: ContentOf<K> } = {
    url: { type: "url", url: "" },
    text: { type: "text", text: "" },
    wifi: { type: "wifi", ssid: "", password: "", encryption: "WPA", hidden: false },
    vcard: {
      type: "vcard",
      firstName: "",
      lastName: "",
      organization: "",
      title: "",
      phone: "",
      mobile: "",
      email: "",
      website: "",
      street: "",
      city: "",
      region: "",
      postalCode: "",
      country: "",
      note: "",
    },
    email: { type: "email", to: "", subject: "", body: "" },
    phone: { type: "phone", number: "" },
    sms: { type: "sms", number: "", message: "" },
    whatsapp: { type: "whatsapp", number: "", message: "" },
    location: {
      type: "location",
      mode: "coordinates",
      latitude: "",
      longitude: "",
      address: "",
      provider: "google",
    },
    event: {
      type: "event",
      title: "",
      location: "",
      start: "",
      end: "",
      allDay: false,
      description: "",
    },
  };
  return map[type];
}
