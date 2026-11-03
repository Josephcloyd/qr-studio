/**
 * Embeds the bundled fonts a design uses into exported SVGs so the file
 * renders identically anywhere (and so SVG→PNG rasterization can use them).
 *
 * PRIVACY: this is the only `fetch` in the app. It reads our own static font
 * files from the same origin; it sends no user data. Allow-listed in
 * scripts/privacy-audit.mjs.
 */
import { FONT_ASSET_BASE, getFont } from "@/lib/fonts/registry";
import type { DesignDocument } from "@/lib/model/types";

const cache = new Map<string, Promise<string>>();

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

function loadFontFile(file: string): Promise<string> {
  const hit = cache.get(file);
  if (hit) return hit;
  const promise = fetch(`${FONT_ASSET_BASE}${file}`, { credentials: "omit", cache: "force-cache" })
    .then((res) => {
      if (!res.ok) throw new Error(`Font ${file} failed to load (${res.status})`);
      return res.arrayBuffer();
    })
    .then((buf) => `data:font/woff2;base64,${bytesToBase64(new Uint8Array(buf))}`);
  cache.set(file, promise);
  promise.catch(() => cache.delete(file));
  return promise;
}

export function fontsUsed(doc: DesignDocument): string[] {
  const ids = new Set<string>();
  for (const e of doc.elements) if (e.type === "text" && !e.hidden) ids.add(e.fontFamily);
  return [...ids];
}

/** Builds @font-face rules (with embedded data) for the given font ids. */
export async function fontFaceCss(fontIds: string[]): Promise<string> {
  const rules: string[] = [];
  for (const id of fontIds) {
    const font = getFont(id);
    if (!font.file) continue; // system fonts can't be embedded
    const [min, max] = font.weights;
    const weight = min === max ? `${min}` : `${min} ${max}`;
    const normal = await loadFontFile(font.file);
    rules.push(
      `@font-face{font-family:'${font.family}';src:url(${normal}) format('woff2');font-weight:${weight};font-style:normal}`,
    );
    if (font.italicFile) {
      const italic = await loadFontFile(font.italicFile);
      rules.push(
        `@font-face{font-family:'${font.family}';src:url(${italic}) format('woff2');font-weight:${weight};font-style:italic}`,
      );
    }
  }
  return rules.join("");
}

/** Waits until the browser has the fonts loaded, so text measurement is accurate. */
export async function ensureFontsLoaded(fontIds: string[]): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  await Promise.all(
    fontIds.map((id) => {
      const f = getFont(id);
      if (!f.file) return Promise.resolve();
      return document.fonts.load(`400 16px '${f.family}'`).catch(() => undefined);
    }),
  );
}
