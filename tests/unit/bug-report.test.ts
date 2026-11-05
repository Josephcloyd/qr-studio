import { describe, expect, it } from "vitest";
import { BUG_REPORT_EMAIL, bugReportBody, bugReportMailto } from "@/lib/support/bugReport";

const ctx = {
  page: "/studio/",
  userAgent: "Mozilla/5.0 TestBrowser",
  screen: "1920×1080",
  viewport: "1600×900",
};

describe("bug report email", () => {
  it("builds a mailto link to the support address with subject and body", () => {
    const url = bugReportMailto(ctx);
    expect(url.startsWith(`mailto:${BUG_REPORT_EMAIL}?subject=`)).toBe(true);
    const params = new URLSearchParams(url.split("?")[1]);
    expect(params.get("subject")).toBe("QR Studio bug report");
    expect(params.get("body")).toContain("Page: /studio/");
    expect(params.get("body")).toContain("Browser: Mozilla/5.0 TestBrowser");
  });

  it("uses CRLF line breaks as mail clients expect", () => {
    expect(bugReportBody(ctx)).toContain("What happened?\r\n");
    expect(bugReportBody(ctx)).not.toMatch(/[^\r]\n/);
  });

  it("omits the technical details block when no context is available", () => {
    const body = bugReportBody(null);
    expect(body).toContain("Steps to reproduce:");
    expect(body).not.toContain("Browser:");
  });

  it("clips very long values", () => {
    const body = bugReportBody({ ...ctx, userAgent: "x".repeat(1000) });
    expect(body).toContain(`Browser: ${"x".repeat(300)}…`);
    expect(body).not.toContain("x".repeat(301));
  });
});
