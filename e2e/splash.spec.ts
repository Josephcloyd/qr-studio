import { expect, test } from "@playwright/test";

test.describe("GetLaunch PH loading screen", () => {
  test("plays on arrival, then gets out of the way", async ({ page }) => {
    await page.goto("/");
    const splash = page.locator(".gl-splash");
    await expect(splash).toBeVisible();
    await expect(splash.getByText("Preparing your workspace")).toBeVisible();

    await expect(splash).toBeHidden({ timeout: 6000 });
    await page.getByRole("textbox", { name: "Website address" }).fill("getlaunchph.com");
  });

  test("template thumbnails draw after the intro, when scrolled into view", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator(".gl-splash")).toBeHidden({ timeout: 8000 });
    const firstCard = page.getByRole("link", { name: /Customize the .* template/ }).first();
    await firstCard.scrollIntoViewIfNeeded();
    await expect(firstCard.locator('svg[aria-label$="template preview"]')).toBeVisible();
  });

  test("the studio keeps it up until the editor is ready", async ({ page }) => {
    await page.goto("/studio/");
    await expect(page.locator(".gl-splash")).toBeHidden({ timeout: 8000 });
    await expect(page.getByText("Opening the studio…")).toHaveCount(0);
  });

  test("reloads skip the intro", async ({ page }) => {
    await page.goto("/privacy/");
    await expect(page.locator(".gl-splash")).toBeHidden({ timeout: 6000 });
    await page.reload();
    // No minimum intro on reload: it's done as soon as the page hydrates.
    await expect(page.locator(".gl-splash")).toBeHidden({ timeout: 1500 });
  });
});
