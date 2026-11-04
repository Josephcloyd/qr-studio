"use client";

import { ColorField } from "@/components/ui/ColorField";
import { cn } from "@/components/ui/cn";
import { useRovingGroup } from "@/components/ui/useRovingGroup";
import { Segmented, SliderField, SwitchField } from "@/components/ui/Field";
import { solid } from "@/lib/model/paint";
import {
  DOT_STYLES,
  EC_LABELS,
  EC_LEVELS,
  FINDER_DOT_STYLES,
  FINDER_FRAME_STYLES,
  MAX_MARGIN,
  MIN_MARGIN,
  effectiveEcLevel,
  hasActiveLogo,
  isFinderPairSafe,
  safeFinderDot,
  type QrStyle,
} from "@/lib/qr/style";
import { QrGraphic, QrSvg } from "@/render/QrGraphic";
import { PaintEditor } from "./PaintEditor";

const PREVIEW_PAYLOAD = "QR";

interface StyleControlsProps {
  style: QrStyle;
  onChange: (style: QrStyle, key?: string) => void;
}

function OptionTile({
  active,
  label,
  onClick,
  children,
  disabled,
  title,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      aria-label={label}
      title={title ?? label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl border p-1.5 text-[11px] font-medium transition-all",
        active
          ? "border-ink bg-card text-ink shadow-[0_0_0_1px_var(--ink)]"
          : "border-line bg-card text-ink-3 hover:border-ink-3 hover:text-ink",
        disabled && "hover:border-line cursor-not-allowed opacity-30",
      )}
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

export function StyleControls({ style, onChange }: StyleControlsProps) {
  const set = (patch: Partial<QrStyle>, key?: string) => onChange({ ...style, ...patch }, key);
  const logo = hasActiveLogo(style);
  const effective = effectiveEcLevel(style);
  const { attach: shapeGroupAttach, onKeyDown: shapeGroupKeys } = useRovingGroup<HTMLDivElement>();
  const { attach: frameGroupAttach, onKeyDown: frameGroupKeys } = useRovingGroup<HTMLDivElement>();
  const { attach: dotGroupAttach, onKeyDown: dotGroupKeys } = useRovingGroup<HTMLDivElement>();

  return (
    <div className="grid gap-6">
      <section className="grid gap-2.5">
        <h3 className="text-ink text-[13px] font-semibold">Module shape</h3>
        <div
          ref={shapeGroupAttach}
          onKeyDown={shapeGroupKeys}
          role="radiogroup"
          aria-label="Module shape"
          className="grid grid-cols-3 gap-2 sm:grid-cols-6"
        >
          {DOT_STYLES.map((d) => (
            <OptionTile
              key={d.id}
              label={d.label}
              active={style.dotStyle === d.id}
              onClick={() => set({ dotStyle: d.id })}
            >
              <QrSvg
                payload={PREVIEW_PAYLOAD}
                size={52}
                idPrefix={`dot-${d.id}`}
                style={{
                  ...style,
                  dotStyle: d.id,
                  margin: 1,
                  logo: { ...style.logo, assetId: null },
                  background: solid("#ffffff"),
                }}
                className="size-[52px]"
              />
            </OptionTile>
          ))}
        </div>
      </section>

      <section className="grid gap-2.5">
        <h3 className="text-ink text-[13px] font-semibold">Corner frames</h3>
        <div
          ref={frameGroupAttach}
          onKeyDown={frameGroupKeys}
          role="radiogroup"
          aria-label="Corner frame"
          className="grid grid-cols-4 gap-2"
        >
          {FINDER_FRAME_STYLES.map((f) => (
            <OptionTile
              key={f.id}
              label={f.label}
              active={style.finderFrame === f.id}
              onClick={() =>
                set({ finderFrame: f.id, finderDot: safeFinderDot(f.id, style.finderDot) })
              }
            >
              <FinderPreview
                style={{
                  ...style,
                  finderFrame: f.id,
                  finderDot: safeFinderDot(f.id, style.finderDot),
                }}
                id={`ff-${f.id}`}
              />
            </OptionTile>
          ))}
        </div>
        <h3 className="text-ink mt-1 text-[13px] font-semibold">Corner dots</h3>
        <div
          ref={dotGroupAttach}
          onKeyDown={dotGroupKeys}
          role="radiogroup"
          aria-label="Corner dot"
          className="grid grid-cols-5 gap-2"
        >
          {FINDER_DOT_STYLES.map((d) => {
            const safe = isFinderPairSafe(style.finderFrame, d.id);
            return (
              <OptionTile
                key={d.id}
                label={d.label}
                active={style.finderDot === d.id}
                disabled={!safe}
                title={safe ? d.label : `${d.label} doesn't scan reliably with this frame`}
                onClick={() => set({ finderDot: d.id })}
              >
                <FinderPreview style={{ ...style, finderDot: d.id }} id={`fd-${d.id}`} />
              </OptionTile>
            );
          })}
        </div>
        <p className="text-ink-3 text-[12px]">
          Some corner combinations are disabled because they confuse scanners.
        </p>
      </section>

      <section className="grid gap-4">
        <h3 className="text-ink text-[13px] font-semibold">Colors</h3>
        <PaintEditor
          label="Modules"
          value={style.foreground}
          onChange={(foreground) => set({ foreground }, "fg")}
        />
        <div className="grid grid-cols-2 gap-2">
          <ColorField
            label="Corner frame"
            value={style.finderFrameColor ?? "#16130f"}
            onValueChange={(c) => set({ finderFrameColor: c }, "ffc")}
          />
          <ColorField
            label="Corner dot"
            value={style.finderDotColor ?? "#16130f"}
            onValueChange={(c) => set({ finderDotColor: c }, "fdc")}
          />
        </div>
        {(style.finderFrameColor || style.finderDotColor) && (
          <button
            type="button"
            className="text-accent-ink justify-self-start text-[12.5px] font-medium underline-offset-2 hover:underline"
            onClick={() => set({ finderFrameColor: null, finderDotColor: null })}
          >
            Match corners to module color
          </button>
        )}
        <PaintEditor
          label="Background"
          value={style.background}
          onChange={(background) => set({ background }, "bg")}
          allowNone
          noneLabel="Transparent"
        />
      </section>

      <section className="grid gap-4">
        <h3 className="text-ink text-[13px] font-semibold">Reliability</h3>
        <Segmented
          label="Error correction"
          value={style.ecLevel}
          onValueChange={(ecLevel) => set({ ecLevel })}
          options={EC_LEVELS.map((l) => ({
            value: l,
            label: l,
            title: EC_LABELS[l],
            disabled: logo && (l === "L" || l === "M"),
          }))}
        />
        <p className="text-ink-3 -mt-2 text-[12px]">
          {EC_LABELS[effective]} of the code can be damaged and still scan.
          {logo && " Logos require Q or H."}
        </p>
        <SliderField
          label="Quiet zone"
          min={MIN_MARGIN}
          max={MAX_MARGIN}
          value={style.margin}
          onValueChange={(margin) => set({ margin }, "margin")}
          format={(v) => `${v} modules`}
          hint="The clear border scanners need. 4 is standard."
        />
      </section>
    </div>
  );
}

/** Crops the top-left finder pattern out of the real renderer (1 unit = 1 module). */
function FinderPreview({ style, id }: { style: QrStyle; id: string }) {
  const MARGIN = 1;
  const SIZE = 21 + MARGIN * 2; // "QR" encodes as a version-1 (21×21) code
  return (
    <svg viewBox="0 0 9 9" className="size-10" aria-hidden="true">
      <QrGraphic
        payload={PREVIEW_PAYLOAD}
        size={SIZE}
        idPrefix={id}
        style={{
          ...style,
          margin: MARGIN,
          foreground: solid("#16130f"),
          finderFrameColor: null,
          finderDotColor: null,
          background: solid("#ffffff"),
          logo: { ...style.logo, assetId: null },
        }}
      />
    </svg>
  );
}

export function LogoToggle({ style, onChange }: StyleControlsProps) {
  return (
    <SwitchField
      label="Show logo"
      checked={style.logo.visible}
      onCheckedChange={(visible) => onChange({ ...style, logo: { ...style.logo, visible } })}
    />
  );
}
