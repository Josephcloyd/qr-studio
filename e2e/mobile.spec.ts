import { expect, test } from "@playwright/test";
import { elementCount, gotoReady } from "./helpers";

test.skip(({ isMobile }) => !isMobile, "Touch layout only");

test.describe("Mobile studio", () => {
  test("bottom tool dock, sheets and touch selection", async ({ page }) => {
    await gotoReady(page, "/studio/");
    const tools = page.getByRole("navigation", { name: "Tools" });
    await expect(tools).toBeVisible();
    // The desktop side panels are not used on phones.
    await expect(page.getByRole("complementary", { name: "Properties" })).toHaveCount(0);

    await tools.getByRole("button", { name: "Templates" }).tap();
    const sheet = page.getByRole("dialog", { name: "Templates" });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: /Use template: Wi-Fi access/ }).tap();
    await expect(sheet).toHaveCount(0);
    await expect.poll(() => elementCount(page)).toBeGreaterThan(3);

    // Tap the QR code to select it; the thumb-friendly action bar appears.
    const qr = page
      .locator("[data-element-id]")
      .filter({ has: page.locator("path[fill-rule=evenodd]") })
      .first();
    const box = (await qr.boundingBox())!;
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    const bar = page.getByRole("toolbar", { name: "Selection actions" });
    await expect(bar).toBeVisible();
    await bar.getByRole("button", { name: "Edit" }).tap();
    await expect(page.getByRole("dialog", { name: "Properties" })).toBeVisible();
    await expect(page.getByText("Scan check passed")).toBeVisible({ timeout: 15_000 });
  });

  test("generator works on a phone", async ({ page }) => {
    await gotoReady(page, "/create/");
    await page.getByLabel("Website address", { exact: true }).fill("example.com");
    await expect(page.locator("[data-scan-status]").first()).toHaveAttribute(
      "data-scan-status",
      "pass",
      { timeout: 15_000 },
    );
    // No horizontal overflow.
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("landing page has no horizontal overflow", async ({ page }) => {
    await gotoReady(page, "/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
