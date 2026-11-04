"use client";

import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignHorizontalDistributeCenter,
  AlignStartHorizontal,
  AlignStartVertical,
  AlignVerticalDistributeCenter,
  ArrowDownToLine,
  ArrowUpToLine,
  ChevronDown,
  ChevronUp,
  Copy,
  Lock,
  LockOpen,
  Trash2,
} from "lucide-react";
import { IconButton } from "@/components/ui/Button";
import { NumberField, SliderField } from "@/components/ui/Field";
import { fromUnits, toUnits } from "@/lib/model/units";
import type { DesignElement, DisplayUnit } from "@/lib/model/types";
import type { Alignment } from "@/lib/model/ops";
import { useEditorStore } from "../../store/editorStore";
import { Section } from "../Section";

const PRECISION: Record<DisplayUnit, number> = { px: 0, mm: 1, in: 2 };

export function AlignButtons({ multi }: { multi: boolean }) {
  const align = useEditorStore((s) => s.alignSelection);
  const distribute = useEditorStore((s) => s.distributeSelection);
  const items: { a: Alignment; label: string; Icon: typeof AlignStartVertical }[] = [
    { a: "left", label: "Align left", Icon: AlignStartVertical },
    { a: "center", label: "Align center", Icon: AlignCenterVertical },
    { a: "right", label: "Align right", Icon: AlignEndVertical },
    { a: "top", label: "Align top", Icon: AlignStartHorizontal },
    { a: "middle", label: "Align middle", Icon: AlignCenterHorizontal },
    { a: "bottom", label: "Align bottom", Icon: AlignEndHorizontal },
  ];
  return (
    <div className="grid gap-1.5">
      <p className="text-ink-3 text-[12px]">{multi ? "Align to each other" : "Align to page"}</p>
      <div className="bg-paper-2 flex flex-wrap gap-0.5 rounded-xl p-1">
        {items.map(({ a, label, Icon }) => (
          <IconButton key={a} label={label} size="sm" onClick={() => align(a)} tooltipSide="top">
            <Icon className="size-4" />
          </IconButton>
        ))}
        {multi && (
          <>
            <IconButton
              label="Distribute horizontally"
              size="sm"
              onClick={() => distribute("horizontal")}
              tooltipSide="top"
            >
              <AlignHorizontalDistributeCenter className="size-4" />
            </IconButton>
            <IconButton
              label="Distribute vertically"
              size="sm"
              onClick={() => distribute("vertical")}
              tooltipSide="top"
            >
              <AlignVerticalDistributeCenter className="size-4" />
            </IconButton>
          </>
        )}
      </div>
    </div>
  );
}

export function LayerButtons() {
  const reorder = useEditorStore((s) => s.reorderSelection);
  return (
    <div className="bg-paper-2 flex gap-0.5 rounded-xl p-1">
      <IconButton
        label="Bring to front"
        shortcut="Ctrl Shift ]"
        size="sm"
        onClick={() => reorder("front")}
        tooltipSide="top"
      >
        <ArrowUpToLine className="size-4" />
      </IconButton>
      <IconButton
        label="Bring forward"
        shortcut="Ctrl ]"
        size="sm"
        onClick={() => reorder("forward")}
        tooltipSide="top"
      >
        <ChevronUp className="size-4" />
      </IconButton>
      <IconButton
        label="Send backward"
        shortcut="Ctrl ["
        size="sm"
        onClick={() => reorder("backward")}
        tooltipSide="top"
      >
        <ChevronDown className="size-4" />
      </IconButton>
      <IconButton
        label="Send to back"
        shortcut="Ctrl Shift ["
        size="sm"
        onClick={() => reorder("back")}
        tooltipSide="top"
      >
        <ArrowDownToLine className="size-4" />
      </IconButton>
    </div>
  );
}

export function SelectionActions({ locked }: { locked: boolean }) {
  const duplicate = useEditorStore((s) => s.duplicateSelection);
  const remove = useEditorStore((s) => s.deleteSelection);
  const setLocked = useEditorStore((s) => s.setSelectionLocked);
  return (
    <div className="flex items-center gap-0.5">
      <IconButton label="Duplicate" shortcut="Ctrl D" size="sm" onClick={duplicate}>
        <Copy className="size-4" />
      </IconButton>
      <IconButton
        label="Lock"
        shortcut="Ctrl Shift L"
        size="sm"
        active={locked}
        onClick={() => setLocked(!locked)}
      >
        {locked ? <Lock className="size-4" /> : <LockOpen className="size-4" />}
      </IconButton>
      <IconButton
        label="Delete"
        shortcut="Del"
        size="sm"
        disabled={locked}
        onClick={remove}
        className="hover:!bg-danger-soft hover:!text-danger"
      >
        <Trash2 className="size-4" />
      </IconButton>
    </div>
  );
}

export function ArrangeSection({ el, unit }: { el: DesignElement; unit: DisplayUnit }) {
  const update = useEditorStore((s) => s.updateElement);
  const p = PRECISION[unit];
  const set = (patch: Partial<DesignElement>, key: string) =>
    update(el.id, patch, `${key}:${el.id}`);
  const dim = (field: "x" | "y" | "width" | "height", label: string, prefix: string) => (
    <NumberField
      label={label}
      prefix={prefix}
      value={fromUnits(el[field], unit)}
      precision={p}
      step={unit === "px" ? 1 : unit === "mm" ? 0.5 : 0.05}
      min={field === "width" || field === "height" ? fromUnits(4, unit) : undefined}
      suffix={unit}
      onValueChange={(v) => {
        const value = toUnits(v, unit);
        if ((field === "width" || field === "height") && (el.type === "qr" || el.type === "icon")) {
          // Square elements stay square.
          set({ width: value, height: value }, "size");
        } else {
          set({ [field]: value } as Partial<DesignElement>, field);
        }
      }}
    />
  );
  return (
    <Section title="Arrange" action={<SelectionActions locked={el.locked} />}>
      <div className="grid grid-cols-2 gap-2">
        {dim("x", "X position", "X")}
        {dim("y", "Y position", "Y")}
        {dim("width", "Width", "W")}
        {el.type === "text" ? (
          <div
            className="border-line-strong text-ink-3 flex h-9 items-center gap-2 self-end rounded-lg border border-dashed px-2.5 text-[13px]"
            title="Text height adjusts to its content"
          >
            <span className="font-mono text-[11px] font-semibold">H</span>
            <span className="tabular-nums">{Number(fromUnits(el.height, unit).toFixed(p))}</span>
            <span className="ml-auto text-[11px]">auto</span>
          </div>
        ) : (
          dim("height", "Height", "H")
        )}
        <NumberField
          label="Rotation"
          prefix="↻"
          value={el.rotation}
          min={-180}
          max={180}
          suffix="°"
          onValueChange={(rotation) => set({ rotation }, "rotation")}
        />
      </div>
      <SliderField
        label="Opacity"
        min={0}
        max={1}
        step={0.01}
        value={el.opacity}
        onValueChange={(opacity) => set({ opacity }, "opacity")}
        format={(v) => `${Math.round(v * 100)}%`}
      />
      <div className="grid gap-1.5">
        <p className="text-ink-3 text-[12px]">Layer order</p>
        <LayerButtons />
      </div>
      <AlignButtons multi={false} />
    </Section>
  );
}
