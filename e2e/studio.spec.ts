import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { PNG } from "pngjs";
import { decodePngFile, elementCount, makePng, openStudio, savedPath } from "./helpers";

test.skip(({ isMobile }) => isMobile, "Desktop studio flows; see mobile.spec.ts for touch layouts");

async function openExport(page: Page, format: "PNG" | "SVG" | "PDF" | "Project") {
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Export" });
  await dialog.getByRole("radio", { name: new RegExp(`^${format}`) }).click();
  return dialog;
}

async function exportDownload(page: Page) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByTestId("export-download").click(),
  ]);
  return savedPath(download);
}

const fieldValue = (page: Page, label: string) =>
  page.getByLabel(label, { exact: true }).inputValue();

test.describe("Design studio", () => {
  test("template → PNG export at print DPI that still scans", async ({ page }) => {
    await openStudio(page, "wifi-access");
    await expect.poll(() => elementCount(page)).toBeGreaterThan(3);
    const dialog = await openExport(page, "PNG");
    await dialog.getByLabel("Resolution").selectOption("150");
    const file = await exportDownload(page);
    const decoded = decodePngFile(file);
    expect([decoded.width, decoded.height]).toEqual([600, 600]); // 4in × 150 DPI
    expect(decoded.data).toBe("WIFI:T:WPA;S:Cafe Guest;P:kapeTayo2026;;");
  });

  test("add, move, resize, rotate, reorder, duplicate, delete, undo and redo", async ({ page }) => {
    await openStudio(page);
    await page.getByRole("button", { name: "Text", exact: true }).click();
    await page.getByRole("button", { name: "Add a heading" }).click();
    await page.getByRole("button", { name: "QR code", exact: true }).click();
    await page.getByRole("button", { name: "Website", exact: true }).click();
    await expect.poll(() => elementCount(page)).toBe(2);

    // The new QR code is selected; drag it.
    const x0 = Number(await fieldValue(page, "X position"));
    const qr = page.locator("[data-element-id]").last();
    const box = (await qr.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 30, { steps: 10 });
    await page.mouse.up();
    await expect.poll(async () => Number(await fieldValue(page, "X position"))).toBeGreaterThan(x0);

    // Undo / redo the move.
    await page.keyboard.press("ControlOrMeta+z");
    await expect.poll(async () => Number(await fieldValue(page, "X position"))).toBeCloseTo(x0, 1);
    await page.keyboard.press("ControlOrMeta+Shift+z");
    await expect.poll(async () => Number(await fieldValue(page, "X position"))).toBeGreaterThan(x0);

    // Resize from the SE handle (QR stays square).
    const w0 = Number(await fieldValue(page, "Width"));
    const se = (await page.locator('[data-handle="se"]').boundingBox())!;
    await page.mouse.move(se.x + se.width / 2, se.y + se.height / 2);
    await page.mouse.down();
    await page.mouse.move(se.x + 60, se.y + 60, { steps: 8 });
    await page.mouse.up();
    await expect.poll(async () => Number(await fieldValue(page, "Width"))).toBeGreaterThan(w0);
    expect(await fieldValue(page, "Width")).toBe(await fieldValue(page, "Height"));

    // Rotate with the rotation handle (Shift snaps to 15°).
    const rot = (await page.locator('[data-handle="rotate"]').boundingBox())!;
    await page.mouse.move(rot.x + rot.width / 2, rot.y + rot.height / 2);
    await page.mouse.down();
    await page.keyboard.down("Shift");
    await page.mouse.move(rot.x + 200, rot.y + 120, { steps: 8 });
    await page.mouse.up();
    await page.keyboard.up("Shift");
    await expect
      .poll(async () => Math.abs(Number(await fieldValue(page, "Rotation")) % 15))
      .toBe(0);
    expect(Number(await fieldValue(page, "Rotation"))).not.toBe(0);

    // Layer order: send to back, check the Layers panel.
    await page.getByRole("button", { name: "Send to back" }).click();
    await page.getByRole("button", { name: "Layers", exact: true }).click();
    const layers = page.getByRole("list", { name: "Layers" }).getByRole("listitem");
    await expect(layers.last()).toContainText("QR code");

    // Duplicate and delete.
    await page.keyboard.press("ControlOrMeta+d");
    await expect.poll(() => elementCount(page)).toBe(3);
    await page.keyboard.press("Delete");
    await expect.poll(() => elementCount(page)).toBe(2);

    // Change a property and undo it.
    await page.getByRole("button", { name: "Lock" }).first().click();
    await page.keyboard.press("ControlOrMeta+z");
  });

  test("edits text inline", async ({ page }) => {
    await openStudio(page, "company-website");
    const heading = page
      .locator("[data-element-id]")
      .filter({ hasText: "Visit our website" })
      .first();
    await heading.dblclick();
    const editor = page.getByRole("textbox", { name: "Edit text" });
    await expect(editor).toBeVisible();
    await editor.fill("Scan for our shop");
    await page.keyboard.press("Escape");
    await expect(
      page.locator("[data-testid=canvas-viewport] text").filter({ hasText: "Scan for our shop" }),
    ).toHaveCount(1);
  });

  test("uploaded images are embedded in SVG and visible in PNG exports", async ({ page }) => {
    await openStudio(page);
    await page.getByRole("button", { name: "Images", exact: true }).click();
    await page
      .locator('input[type="file"][multiple]')
      .setInputFiles({ name: "brand-logo.png", mimeType: "image/png", buffer: makePng(200, 200) });
    await expect.poll(() => elementCount(page)).toBe(1);

    // Clicking a placed image's thumbnail selects it rather than stacking a copy;
    // "Add another copy" is the explicit way to place it again.
    const thumb = page.getByRole("button", { name: "Select brand-logo.png on the canvas" });
    if (await thumb.isVisible()) {
      await thumb.click();
      expect(await elementCount(page)).toBe(1);
      await page.getByRole("button", { name: "Add another copy" }).click();
      await expect.poll(() => elementCount(page)).toBe(2);
      await page.keyboard.press("Delete");
      await expect.poll(() => elementCount(page)).toBe(1);
    }

    await openExport(page, "SVG");
    const svg = readFileSync(await exportDownload(page), "utf8");
    expect(svg).toContain("data:image/png;base64,");
    expect(svg).not.toContain("blob:");

    await openExport(page, "PNG");
    const png = PNG.sync.read(readFileSync(await exportDownload(page)));
    // The image is centered; sample its orange area left of the white center dot.
    const x = Math.round(png.width * 0.3);
    const y = Math.round(png.height * 0.5);
    const i = (y * png.width + x) * 4;
    expect(png.data[i]).toBeGreaterThan(200);
    expect(png.data[i + 1]).toBeLessThan(130);
  });

  test("PDF export uses the requested page size", async ({ page }) => {
    await openStudio(page, "company-profile");
    const dialog = await openExport(page, "PDF");
    await dialog.getByLabel("Page size").selectOption("a4");
    await dialog.getByLabel("Image quality").selectOption("150");
    const pdf = readFileSync(await exportDownload(page), "latin1");
    expect(pdf.startsWith("%PDF-")).toBe(true);
    const box = /\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/.exec(pdf);
    expect(Number(box?.[1])).toBeCloseTo(595.28, 0); // A4 in points
    expect(Number(box?.[2])).toBeCloseTo(841.89, 0);
  });

  test("project file round trip; refresh does not recover the design", async ({ page }) => {
    await openStudio(page, "digital-menu");
    await page.getByRole("button", { name: "Images", exact: true }).click();
    await page
      .locator('input[type="file"][multiple]')
      .setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: makePng(160, 90) });
    const count = 8;
    await expect.poll(() => elementCount(page)).toBe(count);

    await page.getByRole("button", { name: "File menu" }).click();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("menuitem", { name: "Download project file" }).click(),
    ]);
    const projectPath = await savedPath(download);
    expect(download.suggestedFilename()).toMatch(/\.qrstudio\.json$/);
    const project = JSON.parse(readFileSync(projectPath, "utf8"));
    expect(project.assets).toHaveLength(1);

    // Nothing is persisted: a reload starts from a blank canvas.
    page.on("dialog", (d) => d.accept());
    await page.goto("/studio/");
    await expect(page.getByTestId("canvas-viewport")).toBeVisible();
    await expect.poll(() => elementCount(page)).toBe(0);

    await page.locator('input[type="file"][accept*=".qrstudio.json"]').setInputFiles(projectPath);
    await expect.poll(() => elementCount(page)).toBe(count);
    await expect(page.locator("[data-testid=canvas-viewport] image").first()).toHaveAttribute(
      "href",
      /^blob:/,
    );
  });

  test("rejects invalid project files", async ({ page }) => {
    await openStudio(page);
    await page.locator('input[type="file"][accept*=".qrstudio.json"]').setInputFiles({
      name: "bad.qrstudio.json",
      mimeType: "application/json",
      buffer: Buffer.from(
        '{"format":"qr-studio-project","formatVersion":1,"document":{"elements":"nope"}}',
      ),
    });
    await expect(page.getByText("Couldn't open project")).toBeVisible();
    await expect.poll(() => elementCount(page)).toBe(0);
  });
});
