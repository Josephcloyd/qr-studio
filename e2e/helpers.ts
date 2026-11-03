import { readFileSync } from "node:fs";
import { expect, type Download, type Page, type Request } from "@playwright/test";
import jsQR from "jsqr";
import { PNG } from "pngjs";

/** Records every network request the page makes. */
export function watchNetwork(page: Page): Request[] {
  const requests: Request[] = [];
  page.on("request", (r) => requests.push(r));
  return requests;
}

/**
 * Privacy assertion: every request must be a GET to our own origin (or a
 * local blob:/data: URL), and none may carry the marker text.
 */
export function expectOnlyOwnStaticRequests(
  requests: Request[],
  baseURL: string,
  markers: string[] = [],
) {
  const origin = new URL(baseURL).origin;
  for (const r of requests) {
    const url = r.url();
    if (url.startsWith("blob:") || url.startsWith("data:")) continue;
    expect(new URL(url).origin, `unexpected request to ${url}`).toBe(origin);
    // GET for the site's files; body-less HEAD is the Next.js router's
    // same-origin connectivity/prefetch check (next/dist/client/components/offline.js).
    expect(["GET", "HEAD"], `unexpected ${r.method()} request to ${url}`).toContain(r.method());
    expect(r.postData(), `request with a body: ${url}`).toBeNull();
    for (const m of markers)
      expect(decodeURIComponent(url), `marker leaked in ${url}`).not.toContain(m);
  }
}

export async function expectNoBrowserStorage(page: Page) {
  const storage = await page.evaluate(async () => ({
    local: localStorage.length,
    session: sessionStorage.length,
    idb: "databases" in indexedDB ? (await indexedDB.databases()).length : 0,
    cookies: document.cookie,
  }));
  expect(storage).toEqual({ local: 0, session: 0, idb: 0, cookies: "" });
}

export function decodePngFile(path: string): {
  data: string | null;
  width: number;
  height: number;
} {
  const png = PNG.sync.read(readFileSync(path));
  // Composite onto white so transparent exports decode like they'd print.
  const px = new Uint8ClampedArray(png.data.length);
  for (let i = 0; i < png.data.length; i += 4) {
    const a = png.data[i + 3] / 255;
    px[i] = png.data[i] * a + 255 * (1 - a);
    px[i + 1] = png.data[i + 1] * a + 255 * (1 - a);
    px[i + 2] = png.data[i + 2] * a + 255 * (1 - a);
    px[i + 3] = 255;
  }
  const result = jsQR(px, png.width, png.height, { inversionAttempts: "attemptBoth" });
  return { data: result?.data ?? null, width: png.width, height: png.height };
}

export async function savedPath(download: Download): Promise<string> {
  const path = await download.path();
  if (!path) throw new Error("download failed");
  return path;
}

/** A small, valid PNG (solid color with a white dot) for upload tests. */
export function makePng(
  width = 120,
  height = 80,
  rgb: [number, number, number] = [228, 87, 46],
): Buffer {
  const png = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const dot = Math.hypot(x - width / 2, y - height / 2) < Math.min(width, height) / 5;
      png.data[i] = dot ? 255 : rgb[0];
      png.data[i + 1] = dot ? 255 : rgb[1];
      png.data[i + 2] = dot ? 255 : rgb[2];
      png.data[i + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

/** Navigates and waits until React has hydrated the page. */
export async function gotoReady(page: Page, url: string) {
  await page.goto(url);
  await page.locator("html[data-hydrated]").waitFor({ state: "attached" });
}

/** Opens the studio on desktop with a template (or blank) and waits for the canvas. */
export async function openStudio(page: Page, template?: string) {
  await gotoReady(page, template ? `/studio/?template=${template}` : "/studio/");
  await expect(page.getByTestId("canvas-viewport")).toBeVisible();
}

export const elementCount = (page: Page) =>
  page.locator("[data-testid=canvas-viewport] [data-element-id]").count();
