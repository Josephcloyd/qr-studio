"use client";

import { FlipHorizontal2, FlipVertical2 } from "lucide-react";
import { Popover } from "radix-ui";
import { IconButton } from "@/components/ui/Button";
import { ColorField } from "@/components/ui/ColorField";
import { cn } from "@/components/ui/cn";
import { Segmented, SliderField, SwitchField } from "@/components/ui/Field";
import type { IconElement, ImageElement, ShapeElement, StrokeStyle } from "@/lib/model/types";
import { getIcon, ICONS } from "@/render/icons";
import { PaintEditor } from "@/features/qr-editor/PaintEditor";
import { useEditorStore } from "../../store/editorStore";
import { Section } from "../Section";

export function ImageProperties({ el }: { el: ImageElement }) {
  const update = useEditorStore((s) => s.updateElement);
  const set = (patch: Partial<ImageElement>, key?: string) =>
    update<ImageElement>(el.id, patch, key ? `${key}:${el.id}` : null);
  return (
    <Section title="Image">
      <Segmented
        label="Fit"
        size="sm"
        value={el.fit}
        onValueChange={(fit) => set({ fit })}
        options={[
          { value: "contain", label: "Fit" },
          { value: "cover", label: "Fill & crop" },
          { value: "fill", label: "Stretch" },
        ]}
      />
      <div className="flex items-center gap-2">
        <span className="text-ink-2 flex-1 text-[13px] font-medium">Flip</span>
        <IconButton
          label="Flip horizontally"
          size="sm"
          active={el.flipX}
          onClick={() => set({ flipX: !el.flipX })}
        >
          <FlipHorizontal2 className="size-4" />
        </IconButton>
        <IconButton
          label="Flip vertically"
          size="sm"
          active={el.flipY}
          onClick={() => set({ flipY: !el.flipY })}
        >
          <FlipVertical2 className="size-4" />
        </IconButton>
      </div>
      <SliderField
        label="Corner radius"
        min={0}
        max={Math.round(Math.min(el.width, el.height) / 2)}
        value={Math.round(el.cornerRadius)}
        onValueChange={(cornerRadius) => set({ cornerRadius }, "radius")}
        format={(v) => `${v}px`}
      />
      <div className="grid grid-cols-2 items-end gap-2">
        <ColorField
          label="Border"
          value={el.borderColor ?? "#16130f"}
          onValueChange={(borderColor) =>
            set({ borderColor, borderWidth: el.borderWidth || 4 }, "img-border")
          }
        />
        <SliderField
          label="Width"
          min={0}
          max={40}
          value={el.borderWidth}
          onValueChange={(borderWidth) => set({ borderWidth }, "img-border-w")}
          format={(v) => `${v}px`}
        />
      </div>
    </Section>
  );
}

export function ShapeProperties({ el }: { el: ShapeElement }) {
  const update = useEditorStore((s) => s.updateElement);
  const set = (patch: Partial<ShapeElement>, key?: string) =>
    update<ShapeElement>(el.id, patch, key ? `${key}:${el.id}` : null);
  const isLine = el.shape === "line" || el.shape === "arrow";
  return (
    <Section title={isLine ? "Line" : "Shape"}>
      {!isLine && (
        <PaintEditor
          label="Fill"
          value={el.fill}
          onChange={(fill) => set({ fill }, "fill")}
          allowNone
        />
      )}
      {!isLine && (
        <SwitchField
          label="Outline"
          checked={el.stroke !== null && el.strokeWidth > 0}
          onCheckedChange={(on) =>
            set(
              on
                ? { stroke: el.stroke ?? "#16130f", strokeWidth: el.strokeWidth || 4 }
                : { stroke: null, strokeWidth: 0 },
            )
          }
        />
      )}
      {(isLine || (el.stroke && el.strokeWidth > 0)) && (
        <>
          <ColorField
            label={isLine ? "Color" : "Outline color"}
            value={el.stroke ?? "#16130f"}
            onValueChange={(stroke) => set({ stroke }, "stroke")}
          />
          <SliderField
            label="Thickness"
            min={0.5}
            max={60}
            step={0.5}
            value={el.strokeWidth}
            onValueChange={(strokeWidth) => set({ strokeWidth }, "stroke-w")}
            format={(v) => `${v}px`}
          />
          <Segmented<StrokeStyle>
            label="Style"
            size="sm"
            value={el.strokeStyle}
            onValueChange={(strokeStyle) => set({ strokeStyle })}
            options={[
              { value: "solid", label: "Solid" },
              { value: "dashed", label: "Dashed" },
              { value: "dotted", label: "Dotted" },
            ]}
          />
        </>
      )}
      {el.shape === "rect" && (
        <SliderField
          label="Corner radius"
          min={0}
          max={Math.round(Math.min(el.width, el.height) / 2)}
          value={Math.round(el.cornerRadius)}
          onValueChange={(cornerRadius) => set({ cornerRadius }, "radius")}
          format={(v) => `${v}px`}
        />
      )}
      {(el.shape === "polygon" || el.shape === "star") && (
        <SliderField
          label={el.shape === "star" ? "Points" : "Sides"}
          min={3}
          max={16}
          value={el.sides}
          onValueChange={(sides) => set({ sides }, "sides")}
        />
      )}
      {el.shape === "star" && (
        <SliderField
          label="Inner radius"
          min={0.15}
          max={0.9}
          step={0.01}
          value={el.innerRatio}
          onValueChange={(innerRatio) => set({ innerRatio }, "inner")}
          format={(v) => `${Math.round(v * 100)}%`}
        />
      )}
    </Section>
  );
}

export function IconProperties({ el }: { el: IconElement }) {
  const update = useEditorStore((s) => s.updateElement);
  const set = (patch: Partial<IconElement>, key?: string) =>
    update<IconElement>(el.id, patch, key ? `${key}:${el.id}` : null);
  const current = getIcon(el.icon);
  return (
    <Section title="Icon">
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="border-line-strong bg-card hover:border-ink flex h-10 items-center gap-3 rounded-xl border px-3 text-left text-sm"
          >
            <current.Icon className="size-5" aria-hidden="true" />
            <span className="flex-1 font-medium">{current.label}</span>
            <span className="text-ink-3 text-[12px]">Change</span>
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            sideOffset={6}
            collisionPadding={12}
            className="border-line bg-card shadow-pop z-[90] grid max-h-[320px] w-[280px] grid-cols-6 gap-1 overflow-y-auto rounded-2xl border p-2"
          >
            {ICONS.map((i) => (
              <Popover.Close asChild key={i.id}>
                <button
                  type="button"
                  aria-label={i.label}
                  title={i.label}
                  onClick={() => set({ icon: i.id, name: i.label })}
                  className={cn(
                    "hover:bg-paper-2 flex size-10 items-center justify-center rounded-lg",
                    i.id === el.icon && "bg-accent-soft text-accent-ink hover:bg-accent-soft",
                  )}
                >
                  <i.Icon className="size-5" aria-hidden="true" />
                </button>
              </Popover.Close>
            ))}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
      <ColorField
        label="Color"
        value={el.color}
        onValueChange={(color) => set({ color }, "icon-color")}
      />
      <SliderField
        label="Line weight"
        min={0.5}
        max={4}
        step={0.25}
        value={el.strokeWidth}
        onValueChange={(strokeWidth) => set({ strokeWidth }, "icon-stroke")}
        format={(v) => v.toFixed(2)}
      />
    </Section>
  );
}
