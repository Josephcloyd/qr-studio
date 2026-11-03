"use client";

import { ArrowRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/components/ui/cn";
import { encodePayload } from "@/lib/qr/payloads";
import { DEFAULT_QR_STYLE, type QrStyle } from "@/lib/qr/style";
import { QrSvg } from "@/render/QrGraphic";
import { STYLE_PRESETS } from "@/features/generator/StylePresets";
import { useGeneratorStore } from "@/features/generator/generatorStore";

const FEATURED = ["ink", "vermilion", "cobalt", "forest", "sunset", "plum"];

/** Live hero: type a link, pick a look — the code is real and scannable. */
export function HeroPlayground() {
  const router = useRouter();
  const [url, setUrl] = useState("getlaunch.ph");
  const [presetId, setPresetId] = useState("ink");
  const preset = STYLE_PRESETS.find((p) => p.id === presetId) ?? STYLE_PRESETS[0];
  const style: QrStyle = useMemo(
    () => ({ ...DEFAULT_QR_STYLE, ...preset.style, ecLevel: "M" }),
    [preset],
  );
  const encoded = encodePayload({ type: "url", url });
  const payload = encoded.ok ? encoded.payload : null;

  const continueDesigning = () => {
    const gen = useGeneratorStore.getState();
    gen.setContent({ type: "url", url });
    gen.setStyle({ ...gen.style, ...preset.style });
    router.push("/create/");
  };

  return (
    <div className="relative mx-auto w-full max-w-[460px]">
      {/* Layered "specimen sheet" behind the live card. */}
      <div
        aria-hidden="true"
        className="bg-accent shadow-sheet absolute -top-6 -right-4 h-[78%] w-[70%] rotate-[7deg] rounded-[28px]"
      />
      <div
        aria-hidden="true"
        className="bg-cobalt shadow-sheet absolute -bottom-5 -left-5 h-[60%] w-[58%] -rotate-[6deg] rounded-[28px]"
      />

      <div className="border-line bg-card shadow-pop relative rounded-[28px] border p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <span className="text-ink-3 font-mono text-[10.5px] font-semibold tracking-[0.16em] uppercase">
            Live preview
          </span>
          <span className="bg-success-soft text-success inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold">
            <Check className="size-3" aria-hidden="true" /> Real, scannable code
          </span>
        </div>
        <div className="mx-auto mt-4 w-full max-w-[280px] overflow-hidden rounded-2xl">
          <QrSvg
            payload={payload}
            style={style}
            size={280}
            idPrefix="hero"
            className="block h-auto w-full"
            title="Live QR code preview"
          />
        </div>
        <label htmlFor="hero-url" className="text-ink-2 mt-5 block text-[12.5px] font-medium">
          Try your own link
        </label>
        <div
          className={cn(
            "bg-paper/60 focus-within:border-ink mt-1.5 flex h-11 items-center rounded-xl border px-3 transition-colors",
            encoded.ok ? "border-line-strong" : "border-danger",
          )}
        >
          <span className="text-ink-3 font-mono text-[12px]">https://</span>
          <input
            id="hero-url"
            value={url}
            onChange={(e) => setUrl(e.target.value.replace(/^https?:\/\//i, ""))}
            spellCheck={false}
            autoComplete="off"
            inputMode="url"
            aria-invalid={!encoded.ok}
            className="text-ink h-full min-w-0 flex-1 bg-transparent pl-1 text-[14px] font-medium focus:outline-none"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Pick a look">
          {FEATURED.map((id) => {
            const p = STYLE_PRESETS.find((x) => x.id === id)!;
            const fg =
              p.style.foreground.kind === "solid"
                ? p.style.foreground.color
                : p.style.foreground.kind !== "none"
                  ? p.style.foreground.stops[0].color
                  : "#000";
            return (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={presetId === id}
                onClick={() => setPresetId(id)}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12px] font-semibold transition-all",
                  presetId === id
                    ? "border-ink bg-ink text-paper"
                    : "border-line bg-card text-ink-2 hover:border-ink-3",
                )}
              >
                <span
                  className="ring-paper/70 size-2.5 rounded-full ring-1"
                  style={{ background: fg }}
                  aria-hidden="true"
                />
                {p.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={continueDesigning}
          disabled={!payload}
          className="group bg-ink text-paper hover:bg-ink-2 mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition-colors disabled:opacity-40"
        >
          Keep customizing
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}
