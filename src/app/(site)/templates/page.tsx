import type { Metadata } from "next";
import { TemplateShelf } from "@/features/landing/TemplateShelf";

export const metadata: Metadata = {
  title: "QR design templates",
  description:
    "20 editable QR layouts for business cards, menus, Wi-Fi signs, invitations, flyers and more.",
};

export default function TemplatesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10 pb-24 sm:px-6 lg:pt-14">
      <div className="mb-10 max-w-2xl">
        <p className="text-accent-ink font-mono text-[11px] font-semibold tracking-[0.2em] uppercase">
          Templates
        </p>
        <h1 className="font-display text-ink mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Pick a starting point.
        </h1>
        <p className="text-ink-3 mt-4 text-[16px] leading-relaxed">
          Open any template in the studio and change everything — text, colors, images, layout and
          the QR code itself. Templates are built into the app; nothing is downloaded when you use
          one.
        </p>
      </div>
      <TemplateShelf limit={20} />
    </div>
  );
}
