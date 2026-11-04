import Link from "next/link";
import { Brand } from "./Brand";

export function SiteFooter() {
  return (
    <footer className="border-line bg-paper border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-sm">
          <Brand />
          <p className="text-ink-3 mt-4 text-[13.5px] leading-relaxed">
            A free tool from GetLaunch Ph. Everything you make is created in your browser and stays
            on your device.
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="text-ink-2 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px] font-medium"
        >
          <Link href="/" className="hover:text-ink">
            Generator
          </Link>
          <Link href="/studio/" className="hover:text-ink">
            Design studio
          </Link>
          <Link href="/templates/" className="hover:text-ink">
            Templates
          </Link>
          <Link href="/privacy/" className="hover:text-ink">
            How privacy works
          </Link>
        </nav>
      </div>
      <div className="border-line/70 border-t">
        <div className="text-ink-3 mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 font-mono text-[11px] tracking-wide sm:flex-row sm:justify-between sm:px-6">
          <span>© GetLaunch Ph · QR Studio</span>
          <span>No accounts · No uploads · No tracking</span>
        </div>
        <div className="text-ink-3 mx-auto flex max-w-7xl flex-col gap-1 px-4 pb-5 text-[11.5px] leading-relaxed sm:flex-row sm:justify-between sm:gap-6 sm:px-6">
          <p>
            Provided free and as-is. Always test-scan your codes before printing or sharing.
            &ldquo;QR Code&rdquo; is a registered trademark of DENSO WAVE INCORPORATED.
          </p>
          <a
            href="/third-party-notices.txt"
            className="hover:text-ink shrink-0 underline-offset-2 hover:underline"
          >
            Open-source notices
          </a>
        </div>
      </div>
    </footer>
  );
}
