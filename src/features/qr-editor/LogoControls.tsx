"use client";

import { ImagePlus, LockKeyhole, Trash2 } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { ColorField } from "@/components/ui/ColorField";
import { Segmented, SliderField, SwitchField } from "@/components/ui/Field";
import { ACCEPT_ATTRIBUTE } from "@/lib/assets/intake";
import {
  MAX_LOGO_OFFSET,
  MAX_LOGO_SIZE,
  MIN_LOGO_SIZE,
  effectiveEcLevel,
  type QrStyle,
} from "@/lib/qr/style";
import { useAssetStore } from "@/features/assets/assetStore";
import { useImageUpload } from "@/features/assets/useImageUpload";

interface LogoControlsProps {
  style: QrStyle;
  onChange: (style: QrStyle, key?: string) => void;
  /** Called with the previous asset id when the logo is replaced or removed. */
  onReleaseAsset?: (assetId: string) => void;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

export function LogoControls({ style, onChange, onReleaseAsset }: LogoControlsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { ingest, busy } = useImageUpload();
  const asset = useAssetStore((s) =>
    style.logo.assetId ? s.assets[style.logo.assetId] : undefined,
  );
  const logo = style.logo;
  const setLogo = (patch: Partial<QrStyle["logo"]>, key?: string) =>
    onChange({ ...style, logo: { ...logo, ...patch } }, key);
  const maxSize =
    MAX_LOGO_SIZE[effectiveEcLevel({ ...style, logo: { ...logo, assetId: logo.assetId ?? "x" } })];

  const handleFiles = async (files: FileList | null) => {
    const [added] = await ingest(files);
    if (!added) return;
    const previous = logo.assetId;
    // Logos always get the strongest error correction by default.
    onChange({
      ...style,
      ecLevel: "H",
      logo: {
        ...logo,
        assetId: added.id,
        visible: true,
        size: Math.min(logo.size, MAX_LOGO_SIZE.H),
      },
    });
    if (previous && previous !== added.id) onReleaseAsset?.(previous);
  };

  const remove = () => {
    const previous = logo.assetId;
    onChange({ ...style, logo: { ...logo, assetId: null } });
    if (previous) onReleaseAsset?.(previous);
  };

  const picker = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPT_ATTRIBUTE}
      className="sr-only"
      tabIndex={-1}
      aria-hidden="true"
      onChange={(e) => {
        void handleFiles(e.target.files);
        e.target.value = "";
      }}
    />
  );

  if (!logo.assetId || !asset) {
    return (
      <div className="grid gap-3">
        {picker}
        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void handleFiles(e.dataTransfer.files);
          }}
          className="border-line-strong bg-paper/60 hover:border-ink hover:bg-card flex flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-7 text-center transition-colors"
        >
          <ImagePlus className="text-ink-3 size-6" aria-hidden="true" />
          <span className="text-ink text-sm font-semibold">
            {busy ? "Reading image…" : "Add a center logo"}
          </span>
          <span className="text-ink-3 text-[12.5px]">
            PNG, JPEG, WebP or SVG · drop a file or click
          </span>
        </button>
        <p className="text-ink-3 flex items-center gap-1.5 text-[12px]">
          <LockKeyhole className="size-3.5" aria-hidden="true" />
          Your logo is read by your browser and never uploaded.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {picker}
      <div className="border-line bg-paper/60 flex items-center gap-3 rounded-2xl border p-2.5">
        <div className="checkerboard border-line flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border">
          {/* eslint-disable-next-line @next/next/no-img-element -- local object URL, not optimizable */}
          <img src={asset.url} alt="" className="max-h-full max-w-full object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-ink truncate text-sm font-semibold">{asset.name}</p>
          <p className="text-ink-3 text-[12px]">
            {asset.width} × {asset.height}px · on this device only
          </p>
        </div>
        <Button size="sm" variant="secondary" onClick={() => inputRef.current?.click()}>
          Replace
        </Button>
        <Button size="sm" variant="ghost" aria-label="Remove logo" onClick={remove}>
          <Trash2 className="size-4" />
        </Button>
      </div>

      <SwitchField
        label="Show logo"
        checked={logo.visible}
        onCheckedChange={(visible) => setLogo({ visible })}
      />
      <SliderField
        label="Logo size"
        min={MIN_LOGO_SIZE}
        max={maxSize}
        step={0.01}
        value={Math.min(logo.size, maxSize)}
        onValueChange={(size) => setLogo({ size }, "logo-size")}
        format={pct}
        hint="Capped automatically so the code stays scannable."
      />
      <div className="grid grid-cols-2 gap-3">
        <SliderField
          label="Horizontal"
          min={-MAX_LOGO_OFFSET}
          max={MAX_LOGO_OFFSET}
          step={0.01}
          value={logo.offsetX}
          onValueChange={(offsetX) => setLogo({ offsetX }, "logo-x")}
          format={pct}
        />
        <SliderField
          label="Vertical"
          min={-MAX_LOGO_OFFSET}
          max={MAX_LOGO_OFFSET}
          step={0.01}
          value={logo.offsetY}
          onValueChange={(offsetY) => setLogo({ offsetY }, "logo-y")}
          format={pct}
        />
      </div>
      {(logo.offsetX !== 0 || logo.offsetY !== 0) && (
        <button
          type="button"
          className="text-accent-ink -mt-3 justify-self-start text-[12.5px] font-medium hover:underline"
          onClick={() => setLogo({ offsetX: 0, offsetY: 0 })}
        >
          Re-center logo
        </button>
      )}
      <SliderField
        label="Logo opacity"
        min={0.2}
        max={1}
        step={0.05}
        value={logo.opacity}
        onValueChange={(opacity) => setLogo({ opacity }, "logo-opacity")}
        format={pct}
      />
      <Segmented
        label="Background plate"
        value={logo.plate}
        onValueChange={(plate) => setLogo({ plate })}
        options={[
          { value: "none", label: "None" },
          { value: "square", label: "Square" },
          { value: "rounded", label: "Rounded" },
          { value: "circle", label: "Circle" },
        ]}
      />
      {logo.plate !== "none" && (
        <div className="grid grid-cols-2 gap-3">
          <ColorField
            label="Plate color"
            value={logo.plateColor}
            onValueChange={(plateColor) => setLogo({ plateColor }, "plate-color")}
          />
          <SliderField
            label="Padding"
            min={0}
            max={3}
            step={0.25}
            value={logo.platePadding}
            onValueChange={(platePadding) => setLogo({ platePadding }, "plate-pad")}
            format={(v) => `${v} mod`}
          />
        </div>
      )}
      <SwitchField
        label="Clear modules behind logo"
        hint="Recommended. Keeps the code clean and easier to scan."
        checked={logo.clearBehind}
        onCheckedChange={(clearBehind) => setLogo({ clearBehind })}
      />
    </div>
  );
}
