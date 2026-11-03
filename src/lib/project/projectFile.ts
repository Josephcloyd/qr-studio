/**
 * The `.qrstudio.json` project format. Serialization and validation are pure
 * so they can be tested in Node; decoding embedded images happens in the
 * browser (see features/project/importProject.ts).
 */
import { z } from "zod";
import { ID_PATTERN } from "@/lib/model/ids";
import { referencedAssets } from "@/lib/model/ops";
import { documentSchema } from "@/lib/model/schema";
import type { DesignDocument } from "@/lib/model/types";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/assets/intake";

export const PROJECT_FORMAT = "qr-studio-project";
export const PROJECT_FORMAT_VERSION = 1;
export const PROJECT_EXTENSION = ".qrstudio.json";
export const MAX_PROJECT_BYTES = 60 * 1024 * 1024;
export const MAX_ASSET_BYTES = 20 * 1024 * 1024;
export const MAX_ASSETS = 100;
/** base64 inflates by 4/3; allow a little header overhead. */
const MAX_DATA_URL_CHARS = Math.ceil((MAX_ASSET_BYTES * 4) / 3) + 64;

export interface ProjectAsset {
  id: string;
  name: string;
  mime: (typeof ACCEPTED_IMAGE_TYPES)[number];
  width: number;
  height: number;
  dataUrl: string;
}

export interface ProjectFile {
  format: typeof PROJECT_FORMAT;
  formatVersion: typeof PROJECT_FORMAT_VERSION;
  app: string;
  exportedAt: string;
  document: DesignDocument;
  assets: ProjectAsset[];
}

const assetSchema = z
  .object({
    id: z.string().regex(ID_PATTERN),
    name: z.string().max(120),
    mime: z.enum(ACCEPTED_IMAGE_TYPES),
    width: z.number().min(1).max(20000),
    height: z.number().min(1).max(20000),
    dataUrl: z.string().max(MAX_DATA_URL_CHARS),
  })
  .refine((a) => new RegExp(`^data:${a.mime.replace("+", "\\+")};base64,[A-Za-z0-9+/=]+$`).test(a.dataUrl), {
    message: "Embedded image data doesn't match its declared type.",
  });

const projectSchema = z.object({
  format: z.literal(PROJECT_FORMAT),
  formatVersion: z.literal(PROJECT_FORMAT_VERSION),
  app: z.string().max(60),
  exportedAt: z.string().max(40),
  document: documentSchema,
  assets: z.array(assetSchema).max(MAX_ASSETS),
});

export function serializeProject(doc: DesignDocument, assets: ProjectAsset[], now = new Date()): string {
  const used = referencedAssets(doc);
  const file: ProjectFile = {
    format: PROJECT_FORMAT,
    formatVersion: PROJECT_FORMAT_VERSION,
    app: "QR Studio",
    exportedAt: now.toISOString(),
    document: doc,
    assets: assets.filter((a) => used.has(a.id)),
  };
  return JSON.stringify(file);
}

export type ParseResult = { ok: true; project: ProjectFile } | { ok: false; error: string };

export function parseProjectFile(text: string): ParseResult {
  if (text.length > MAX_PROJECT_BYTES) return { ok: false, error: "This project file is too large (max 60 MB)." };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "This file isn't valid JSON. Choose a .qrstudio.json project file." };
  }
  if (typeof raw !== "object" || raw === null || (raw as { format?: unknown }).format !== PROJECT_FORMAT) {
    return { ok: false, error: "This isn't a QR Studio project file." };
  }
  if ((raw as { formatVersion?: unknown }).formatVersion !== PROJECT_FORMAT_VERSION) {
    return { ok: false, error: "This project was made with a newer version of QR Studio." };
  }
  const parsed = projectSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path.join(".") || "file";
    return { ok: false, error: `The project file is damaged or invalid (${where}: ${issue?.message ?? "invalid"}).` };
  }
  const project = parsed.data as ProjectFile;
  const available = new Set(project.assets.map((a) => a.id));
  const missing = [...referencedAssets(project.document)].filter((id) => !available.has(id));
  if (missing.length) return { ok: false, error: "The project references images that aren't included in the file." };
  const elementIds = project.document.elements.map((e) => e.id);
  if (new Set(elementIds).size !== elementIds.length) {
    return { ok: false, error: "The project file contains duplicate element ids." };
  }
  return { ok: true, project };
}

/** Rewrites asset references (imported assets always get fresh local ids). */
export function remapAssetIds(doc: DesignDocument, map: ReadonlyMap<string, string>): DesignDocument {
  const re = (id: string | null) => (id ? (map.get(id) ?? id) : id);
  return {
    ...doc,
    background: { ...doc.background, imageAssetId: re(doc.background.imageAssetId) },
    elements: doc.elements.map((e) => {
      if (e.type === "image") return { ...e, assetId: re(e.assetId) as string };
      if (e.type === "qr") return { ...e, style: { ...e.style, logo: { ...e.style.logo, assetId: re(e.style.logo.assetId) } } };
      return e;
    }),
  };
}

export function projectFileName(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${slug || "qr-studio-design"}${PROJECT_EXTENSION}`;
}
