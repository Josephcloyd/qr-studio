"use client";

import { useShallow } from "zustand/react/shallow";
import { SliderField } from "@/components/ui/Field";
import { mapElements } from "@/lib/model/ops";
import type { DesignElement } from "@/lib/model/types";
import { selectSelectedElements, useEditorStore } from "../../store/editorStore";
import { PanelHeading, Section } from "../Section";
import { AlignButtons, ArrangeSection, LayerButtons, SelectionActions } from "./ArrangeSection";
import { CanvasProperties } from "./CanvasProperties";
import { QrProperties } from "./QrProperties";
import { IconProperties, ImageProperties, ShapeProperties } from "./SimpleProperties";
import { TextProperties } from "./TextProperties";

const TITLES: Record<DesignElement["type"], string> = {
  qr: "QR code",
  text: "Text",
  image: "Image",
  shape: "Shape",
  icon: "Icon",
};

function TypeProperties({ el }: { el: DesignElement }) {
  switch (el.type) {
    case "qr":
      return <QrProperties el={el} />;
    case "text":
      return <TextProperties el={el} />;
    case "image":
      return <ImageProperties el={el} />;
    case "shape":
      return <ShapeProperties el={el} />;
    case "icon":
      return <IconProperties el={el} />;
  }
}

function MultiProperties({ elements }: { elements: DesignElement[] }) {
  const apply = useEditorStore((s) => s.apply);
  const ids = elements.map((e) => e.id);
  const opacity = elements.reduce((s, e) => s + e.opacity, 0) / elements.length;
  return (
    <>
      <PanelHeading
        title={`${elements.length} elements`}
        subtitle="Shift-click to add or remove from the selection."
      />
      <Section
        title="Arrange"
        action={<SelectionActions locked={elements.every((e) => e.locked)} />}
      >
        <AlignButtons multi />
        <div className="grid gap-1.5">
          <p className="text-ink-3 text-[12px]">Layer order</p>
          <LayerButtons />
        </div>
        <SliderField
          label="Opacity"
          min={0}
          max={1}
          step={0.01}
          value={opacity}
          onValueChange={(v) =>
            apply(
              (d) => mapElements(d, ids, (e) => ({ ...e, opacity: v })),
              `multi-opacity:${ids.join()}`,
            )
          }
          format={(v) => `${Math.round(v * 100)}%`}
        />
      </Section>
    </>
  );
}

export function PropertiesPanel() {
  const selected = useEditorStore(useShallow(selectSelectedElements));
  const unit = useEditorStore((s) => s.doc.unit);

  if (selected.length === 0) {
    return (
      <div data-testid="properties-panel">
        <PanelHeading title="Canvas" subtitle="Select something on the canvas to edit it." />
        <CanvasProperties />
      </div>
    );
  }
  if (selected.length > 1) {
    return (
      <div data-testid="properties-panel">
        <MultiProperties elements={selected} />
      </div>
    );
  }
  const el = selected[0];
  return (
    <div data-testid="properties-panel" key={el.id}>
      <PanelHeading
        title={TITLES[el.type]}
        subtitle={el.locked ? "Locked — unlock to move or edit it." : undefined}
      />
      <div
        className={el.locked ? "opacity-50" : undefined}
        // inert removes locked controls from mouse, keyboard and screen readers alike.
        inert={el.locked}
      >
        <TypeProperties el={el} />
      </div>
      <ArrangeSection el={el} unit={unit} />
    </div>
  );
}
