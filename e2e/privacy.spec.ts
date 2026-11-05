import { expect, test } from "@playwright/test";
import {
  elementCount,
  expectNoBrowserStorage,
  gotoReady,
  expectOnlyOwnStaticRequests,
  makePng,
  openStudio,
  watchNetwork,
} from "./helpers";

const MARKER = "PRIVATE-MARKER-7f3a9c";

test.describe("Privacy guarantees", () => {
  test.skip(({ isMobile }) => isMobile, "Covered on desktop browsers");

  test("bug reports are an email draft, never a request", async ({ page }) => {
    await gotoReady(page, "/privacy/");
    await expect(page.getByRole("link", { name: "Report a bug" })).toHaveAttribute(
      "href",
      /^mailto:danojosephclyde@gmail\.com\?subject=/,
    );
    // The chat bubble in the lower-right corner opens the same email draft.
    await page.getByRole("button", { name: "Report a bug" }).click();
    const link = page.getByRole("link", { name: "Email a bug report" });
    await expect(link).toHaveAttribute("href", /^mailto:danojosephclyde@gmail\.com\?subject=/);
    // Fill in the details without following the mailto: link.
    await link.evaluate((a) =>
      a.addEventListener("click", (e) => e.preventDefault(), { once: true }),
    );
    await link.click();
    const href = decodeURIComponent((await link.getAttribute("href")) ?? "");
    expect(href).toContain("Page: /privacy/");
    expect(href).not.toContain(MARKER);

    // The studio has the bubble too, on the canvas corner.
    await openStudio(page);
    await page.getByRole("button", { name: "Report a bug" }).click();
    await expect(page.getByRole("link", { name: "Email a bug report" })).toBeVisible();
  });

  test("QR content, images and designs never leave the browser", async ({ page, baseURL }) => {
    test.slow();
    const requests = watchNetwork(page);

    // Generator with a secret marker in the content.
    await gotoReady(page, "/");
    await page.getByRole("radio", { name: "Text", exact: true }).click();
    await page.getByLabel("Text", { exact: true }).fill(`secret ${MARKER}`);
    await page.getByRole("tab", { name: "Logo" }).click();
    await page
      .locator('input[type="file"]')
      .first()
      .setInputFiles({ name: `${MARKER}.png`, mimeType: "image/png", buffer: makePng() });
    await expect(page.locator("[data-scan-status]").first()).toHaveAttribute(
      "data-scan-status",
      /pass|fail/,
      { timeout: 15_000 },
    );
    await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download PNG" }).click(),
    ]);

    // Studio: send the code over, add an image, export every format.
    await page.getByRole("button", { name: "Design a layout around it" }).click();
    await expect(page.getByTestId("canvas-viewport")).toBeVisible();
    await page.getByRole("button", { name: "Images", exact: true }).click();
    await page.locator('input[type="file"][multiple]').setInputFiles({
      name: `${MARKER}-photo.png`,
      mimeType: "image/png",
      buffer: makePng(64, 64),
    });
    for (const format of ["PNG", "SVG", "PDF", "Project"]) {
      await page.getByRole("button", { name: "Export", exact: true }).click();
      await page
        .getByRole("dialog", { name: "Export" })
        .getByRole("radio", { name: new RegExp(`^${format}`) })
        .click();
      const download = page.waitForEvent("download");
      await page.getByTestId("export-download").click();
      // The test photo is dropped on top of the QR code, so raster exports
      // correctly fail the scan check and ask before downloading.
      const anyway = page.getByRole("button", { name: "Download anyway" });
      await Promise.race([download, anyway.waitFor().then(() => anyway.click())]);
      await download;
    }

    expect(requests.length).toBeGreaterThan(0);
    expectOnlyOwnStaticRequests(requests, baseURL!, [MARKER]);
    await expectNoBrowserStorage(page);
  });

  test("refreshing the studio does not bring back a design", async ({ page }) => {
    await openStudio(page, "digital-menu");
    await expect.poll(() => elementCount(page)).toBeGreaterThan(0);
    page.on("dialog", (d) => d.accept());
    await page.reload();
    await expect(page.getByTestId("canvas-viewport")).toBeVisible();
    await expect.poll(() => elementCount(page)).toBe(0);
    await expectNoBrowserStorage(page);
  });

  test("the content security policy blocks requests to other origins", async ({ page }) => {
    const external: string[] = [];
    page.on("request", (r) => r.url().includes("example.org") && external.push(r.url()));
    await gotoReady(page, "/");
    const result = await page.evaluate(async () => {
      const violations: string[] = [];
      document.addEventListener("securitypolicyviolation", (e) =>
        violations.push(`${e.violatedDirective} ${e.blockedURI}`),
      );
      let fetchBlocked = false;
      try {
        await fetch("https://example.org/collect", { method: "POST", body: "data" });
      } catch {
        fetchBlocked = true;
      }
      navigator.sendBeacon("https://example.org/beacon", "x");
      await new Promise((r) => setTimeout(r, 500));
      return { fetchBlocked, violations };
    });
    expect(result.fetchBlocked).toBe(true);
    expect(
      result.violations.filter((v) => v.startsWith("connect-src")).length,
    ).toBeGreaterThanOrEqual(1);
    // Nothing actually went out on the wire.
    const sent = external.length;
    expect(sent).toBe(0);
  });

  test("temporary object URLs are released", async ({ page }) => {
    await page.addInitScript(() => {
      const live = new Set<string>();
      const create = URL.createObjectURL.bind(URL);
      const revoke = URL.revokeObjectURL.bind(URL);
      URL.createObjectURL = (obj: Blob | MediaSource) => {
        const url = create(obj);
        live.add(url);
        return url;
      };
      URL.revokeObjectURL = (url: string) => {
        live.delete(url);
        revoke(url);
      };
      (window as unknown as { __liveUrls: () => number }).__liveUrls = () => live.size;
    });
    await openStudio(page);
    const live = () =>
      page.evaluate(() => (window as unknown as { __liveUrls: () => number }).__liveUrls());
    const before = await live();
    await page.getByRole("button", { name: "Images", exact: true }).click();
    await page.locator('input[type="file"][multiple]').setInputFiles([
      { name: "a.png", mimeType: "image/png", buffer: makePng() },
      { name: "b.png", mimeType: "image/png", buffer: makePng(50, 50) },
    ]);
    await expect.poll(live).toBe(before + 2);
    // Remove an unused upload → its URL is revoked.
    await page.getByRole("button", { name: "Remove image" }).first().click();
    await expect.poll(live).toBe(before + 1);
    // Starting a new design releases the rest.
    await page.getByRole("button", { name: "File menu" }).click();
    await page.getByRole("menuitem", { name: "New design" }).click();
    await page.getByRole("button", { name: "Create blank design" }).click();
    await expect.poll(live).toBe(before);
  });
});
