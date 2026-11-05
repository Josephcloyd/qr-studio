import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { CONTENT_SECURITY_POLICY } from "@/lib/security/csp";
import { LoadingScreen } from "@/components/site/LoadingScreen";
import { SPLASH_DECIDE_SCRIPT } from "@/components/site/splash";
import { Providers } from "@/components/ui/Providers";
import "./globals.css";
import "./splash.css";

export const metadata: Metadata = {
  title: {
    default: "QR Studio — Create QR codes. Design them your way.",
    template: "%s · QR Studio",
  },
  description:
    "Generate, customize, and design professional QR codes in minutes. A free tool by GetLaunch PH. Your projects stay in your browser — no account, no uploads, no cloud storage.",
  applicationName: "QR Studio",
  authors: [{ name: "GetLaunch PH" }],
  referrer: "no-referrer",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#131615",
  width: "device-width",
  initialScale: 1,
};

const isProduction = process.env.NODE_ENV === "production";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The splash script sets html[data-splash] before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Dev mode needs eval for React tooling, so CSP is applied to production builds. */}
        {isProduction && (
          <meta httpEquiv="Content-Security-Policy" content={CONTENT_SECURITY_POLICY} />
        )}
        <script dangerouslySetInnerHTML={{ __html: SPLASH_DECIDE_SCRIPT }} />
        <link
          rel="preload"
          href="/fonts/inter.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/fraunces.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-dvh antialiased">
        <LoadingScreen />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
