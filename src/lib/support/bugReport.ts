/**
 * Bug reports open the person's own email app with a pre-filled message.
 * Nothing is sent by QR Studio itself, and the design is never included.
 */
export const BUG_REPORT_EMAIL = "danojosephclyde@gmail.com";

export interface BugReportContext {
  /** Path only (no query or hash), e.g. "/studio/". */
  page: string;
  userAgent: string;
  screen: string;
  viewport: string;
}

const MAX_FIELD = 300;
const clip = (s: string) => (s.length > MAX_FIELD ? `${s.slice(0, MAX_FIELD)}…` : s);

export function bugReportBody(ctx: BugReportContext | null): string {
  const lines = [
    "What happened?",
    "",
    "",
    "What did you expect to happen?",
    "",
    "",
    "Steps to reproduce:",
    "1. ",
    "2. ",
    "",
    "(Screenshots help: attach them to this email.)",
  ];
  if (ctx) {
    lines.push(
      "",
      "---",
      `Page: ${clip(ctx.page)}`,
      `Browser: ${clip(ctx.userAgent)}`,
      `Screen: ${clip(ctx.screen)} · window ${clip(ctx.viewport)}`,
      "",
      "QR Studio added the details above to help us reproduce the problem. Your design isn't included. Edit or remove anything before sending.",
    );
  }
  return lines.join("\r\n");
}

export function bugReportMailto(ctx: BugReportContext | null): string {
  const subject = encodeURIComponent("QR Studio bug report");
  const body = encodeURIComponent(bugReportBody(ctx));
  return `mailto:${BUG_REPORT_EMAIL}?subject=${subject}&body=${body}`;
}
