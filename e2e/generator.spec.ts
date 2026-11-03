import { expect, test, type Page } from "@playwright/test";
import { decodePngFile, gotoReady, savedPath } from "./helpers";

type Fill = [label: string, value: string];

const CASES: { type: string; fills: Fill[]; contains: string }[] = [
  {
    type: "Website",
    fills: [["Website address", "getlaunch.ph/qr?x=1&y=ñ"]],
    contains: "https://getlaunch.ph/qr",
  },
  {
    type: "Text",
    fills: [["Text", 'Salamat po! こんにちは 🎉 — special: "quotes" & <tags>']],
    contains: "こんにちは",
  },
  {
    type: "Wi-Fi",
    fills: [
      ["Network name (SSID)", 'Café; "Guest"'],
      ["Password", "p@ss:w;rd,ok"],
    ],
    contains: "WIFI:T:WPA;",
  },
  {
    type: "Contact",
    fills: [
      ["First name", "Ana"],
      ["Last name", "Reyes"],
      ["Email", "ana@example.com"],
      ["Mobile", "+63 917 123 4567"],
    ],
    contains: "BEGIN:VCARD",
  },
  {
    type: "Email",
    fills: [
      ["Send to", "hello@example.com"],
      ["Subject", "Hi & bye"],
    ],
    contains: "mailto:hello@example.com",
  },
  { type: "Phone", fills: [["Phone number", "+63 2 8123 4567"]], contains: "tel:+63281234567" },
  {
    type: "SMS",
    fills: [
      ["Phone number", "+63 917 000 1111"],
      ["Message", "Order: 2 cups"],
    ],
    contains: "SMSTO:+639170001111:",
  },
  {
    type: "WhatsApp",
    fills: [
      ["WhatsApp number", "+63 917 000 2222"],
      ["Pre-filled message", "Hello po"],
    ],
    contains: "https://wa.me/639170002222",
  },
  {
    type: "Location",
    fills: [
      ["Latitude", "14.5995"],
      ["Longitude", "120.9842"],
    ],
    contains: "14.5995,120.9842",
  },
  {
    type: "Event",
    fills: [
      ["Event name", "Launch Night"],
      ["Starts", "2026-12-05T18:30"],
      ["Ends", "2026-12-05T22:00"],
    ],
    contains: "BEGIN:VEVENT",
  },
];

async function pickType(page: Page, type: string) {
  await page
    .getByRole("radiogroup", { name: "QR code type" })
    .getByRole("radio", { name: type, exact: true })
    .click();
}

test.describe("QR generator", () => {
  test("generates, scan-checks and downloads every QR type", async ({ page }, info) => {
    test.slow();
    await gotoReady(page, "/create/");
    const cases =
      info.project.name === "chromium"
        ? CASES
        : CASES.filter((c) => ["Website", "Wi-Fi", "Contact"].includes(c.type));
    for (const c of cases) {
      await pickType(page, c.type);
      for (const [label, value] of c.fills)
        await page.getByLabel(label, { exact: true }).fill(value);
      await expect(page.locator("[data-scan-status]").first()).toHaveAttribute(
        "data-scan-status",
        "pass",
        { timeout: 15_000 },
      );
      await page.getByText("Encoded content").click();
      const payload = (await page.locator("details pre").textContent()) ?? "";
      expect(payload).toContain(c.contains);
      await page.getByText("Encoded content").click();

      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: "Download PNG" }).click(),
      ]);
      const decoded = decodePngFile(await savedPath(download));
      expect(decoded.width).toBe(1024);
      // vCard/iCal use CRLF; compare exactly.
      expect(decoded.data, `${c.type} decodes from the downloaded PNG`).toBe(payload);
    }
  });

  test("validates empty and invalid input", async ({ page }) => {
    await gotoReady(page, "/create/");
    const url = page.getByLabel("Website address", { exact: true });
    await url.fill("javascript:alert(1)");
    await expect(page.getByText("Only http:// and https:// links are supported.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Download PNG" })).toBeDisabled();
    await url.fill("not a url");
    await expect(page.getByText(/can't contain spaces/)).toBeVisible();
    await pickType(page, "Wi-Fi");
    await page.getByLabel("Network name (SSID)", { exact: true }).fill("Home");
    await page.getByLabel("Password", { exact: true }).fill("short");
    await expect(page.getByText(/8 to 63 characters/)).toBeVisible();
  });

  test("warns about low contrast styling", async ({ page }) => {
    await gotoReady(page, "/create/");
    await page.getByLabel("Website address", { exact: true }).fill("example.com");
    await page.getByRole("tab", { name: "Customize" }).click();
    const fg = page.getByLabel("Modules color", { exact: true });
    await fg.fill("#dddddd");
    await fg.press("Enter");
    await expect(page.getByText(/Contrast is very low/)).toBeVisible();
  });

  test("downloads SVG and PDF locally", async ({ page }) => {
    await gotoReady(page, "/create/");
    await page.getByLabel("Website address", { exact: true }).fill("example.com");
    await expect(page.locator("[data-scan-status]").first()).toHaveAttribute(
      "data-scan-status",
      "pass",
      { timeout: 15_000 },
    );
    await page.getByRole("radio", { name: "SVG" }).click();
    const [svg] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download SVG" }).click(),
    ]);
    expect(svg.suggestedFilename()).toMatch(/\.svg$/);
    await page.getByRole("radio", { name: "PDF" }).click();
    const [pdf] = await Promise.all([
      page.waitForEvent("download"),
      page.getByRole("button", { name: "Download PDF" }).click(),
    ]);
    expect(pdf.suggestedFilename()).toMatch(/\.pdf$/);
  });
});
