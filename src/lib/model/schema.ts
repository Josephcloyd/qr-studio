/**
 * Strict schemas for imported project files. Imported data is untrusted:
 * every field is typed and bounded, unknown keys are stripped, and image
 * references can only point at embedded assets — never at URLs, so an
 * imported file can't make the browser contact anyone.
 */
import { z } from "zod";
import { ID_PATTERN } from "./ids";
import { BACKGROUND_PATTERNS, SHAPE_KINDS } from "./types";

const MAX_TEXT = 5000;
const color = z.string().regex(/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
const id = z.string().regex(ID_PATTERN);
const num = (min: number, max: number) => z.number().min(min).max(max);
const str = (max = 500) => z.string().max(max);
const COORD = 100000;

const stop = z.object({ offset: num(0, 1), color });
const stops = z.array(stop).min(2).max(8);
export const paintSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("none") }),
  z.object({ kind: z.literal("solid"), color }),
  z.object({ kind: z.literal("linear"), angle: num(-360, 360), stops }),
  z.object({ kind: z.literal("radial"), stops }),
]);

export const qrContentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("url"), url: str(2000) }),
  z.object({ type: z.literal("text"), text: str(MAX_TEXT) }),
  z.object({
    type: z.literal("wifi"),
    ssid: str(64),
    password: str(128),
    encryption: z.enum(["WPA", "WEP", "nopass"]),
    hidden: z.boolean(),
  }),
  z.object({
    type: z.literal("vcard"),
    firstName: str(),
    lastName: str(),
    organization: str(),
    title: str(),
    phone: str(64),
    mobile: str(64),
    email: str(),
    website: str(2000),
    street: str(),
    city: str(),
    region: str(),
    postalCode: str(64),
    country: str(),
    note: str(2000),
  }),
  z.object({ type: z.literal("email"), to: str(), subject: str(), body: str(2000) }),
  z.object({ type: z.literal("phone"), number: str(64) }),
  z.object({ type: z.literal("sms"), number: str(64), message: str(1000) }),
  z.object({ type: z.literal("whatsapp"), number: str(64), message: str(1000) }),
  z.object({
    type: z.literal("location"),
    mode: z.enum(["coordinates", "address"]),
    latitude: str(32),
    longitude: str(32),
    address: str(),
    provider: z.enum(["google", "apple", "osm", "geo"]),
  }),
  z.object({
    type: z.literal("event"),
    title: str(),
    location: str(),
    start: str(32),
    end: str(32),
    allDay: z.boolean(),
    description: str(2000),
  }),
]);

export const qrStyleSchema = z.object({
  ecLevel: z.enum(["L", "M", "Q", "H"]),
  margin: num(0, 20),
  dotStyle: z.enum(["square", "rounded", "fluid", "classy", "dots", "diamond"]),
  finderFrame: z.enum(["square", "rounded", "circle", "leaf"]),
  finderDot: z.enum(["square", "rounded", "circle", "leaf", "diamond"]),
  foreground: paintSchema,
  finderFrameColor: color.nullable(),
  finderDotColor: color.nullable(),
  background: paintSchema,
  logo: z.object({
    assetId: id.nullable(),
    visible: z.boolean(),
    size: num(0, 1),
    offsetX: num(-1, 1),
    offsetY: num(-1, 1),
    opacity: num(0, 1),
    plate: z.enum(["none", "square", "rounded", "circle"]),
    plateColor: color,
    platePadding: num(0, 10),
    clearBehind: z.boolean(),
  }),
});

const elementBase = {
  id,
  name: str(120),
  x: num(-COORD, COORD),
  y: num(-COORD, COORD),
  width: num(0.5, COORD),
  height: num(0.5, COORD),
  rotation: num(-360, 360),
  opacity: num(0, 1),
  locked: z.boolean(),
  hidden: z.boolean(),
};

export const elementSchema = z.discriminatedUnion("type", [
  z.object({ ...elementBase, type: z.literal("qr"), content: qrContentSchema, style: qrStyleSchema }),
  z.object({
    ...elementBase,
    type: z.literal("text"),
    text: str(MAX_TEXT),
    fontFamily: z.string().regex(/^[a-z0-9-]{1,40}$/),
    fontSize: num(1, 2000),
    fontWeight: num(100, 900),
    italic: z.boolean(),
    uppercase: z.boolean(),
    color,
    align: z.enum(["left", "center", "right"]),
    letterSpacing: num(-1, 2),
    lineHeight: num(0.5, 4),
    background: color.nullable(),
    padding: num(0, 1000),
    cornerRadius: num(0, 5000),
    borderColor: color.nullable(),
    borderWidth: num(0, 500),
  }),
  z.object({
    ...elementBase,
    type: z.literal("image"),
    assetId: id,
    fit: z.enum(["cover", "contain", "fill"]),
    cornerRadius: num(0, 5000),
    borderColor: color.nullable(),
    borderWidth: num(0, 500),
    flipX: z.boolean(),
    flipY: z.boolean(),
  }),
  z.object({
    ...elementBase,
    type: z.literal("shape"),
    shape: z.enum(SHAPE_KINDS),
    fill: paintSchema,
    stroke: color.nullable(),
    strokeWidth: num(0, 500),
    strokeStyle: z.enum(["solid", "dashed", "dotted"]),
    cornerRadius: num(0, 5000),
    sides: num(3, 24),
    innerRatio: num(0.1, 0.95),
  }),
  z.object({
    ...elementBase,
    type: z.literal("icon"),
    icon: z.string().regex(/^[a-z0-9-]{1,40}$/),
    color,
    strokeWidth: num(0.25, 6),
  }),
]);

export const MAX_ELEMENTS = 1000;

export const documentSchema = z.object({
  version: z.literal(1),
  id,
  name: str(120),
  width: num(48, 20000),
  height: num(48, 20000),
  unit: z.enum(["px", "mm", "in"]),
  dpi: num(72, 1200),
  cornerRadius: num(0, 10000),
  background: z.object({
    paint: paintSchema,
    imageAssetId: id.nullable(),
    imageFit: z.enum(["cover", "contain"]),
    imageOpacity: num(0, 1),
    pattern: z.enum(BACKGROUND_PATTERNS),
    patternColor: color,
    patternOpacity: num(0, 1),
    patternScale: num(4, 400),
  }),
  border: z.object({ width: num(0, 1000), color }),
  elements: z.array(elementSchema).max(MAX_ELEMENTS),
});
