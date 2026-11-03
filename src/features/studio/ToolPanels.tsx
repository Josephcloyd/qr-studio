"use client";

import { Image as ImageIcon, Layers, LayoutTemplate, PaintBucket, QrCode, Shapes, Sparkles, Type, type LucideIcon } from "lucide-react";
import type { ComponentType } from "react";
import { BackgroundPanel } from "./panels/left/BackgroundPanel";
import { ElementsPanel } from "./panels/left/ElementsPanel";
import { LayersPanel } from "./panels/left/LayersPanel";
import { QrPanel } from "./panels/left/QrPanel";
import { ShapesPanel } from "./panels/left/ShapesPanel";
import { TemplatesPanel } from "./panels/left/TemplatesPanel";
import { TextPanel } from "./panels/left/TextPanel";
import { UploadsPanel } from "./panels/left/UploadsPanel";
import type { PanelId } from "./store/uiStore";

export const TOOLS: { id: PanelId; label: string; Icon: LucideIcon; Panel: ComponentType }[] = [
  { id: "templates", label: "Templates", Icon: LayoutTemplate, Panel: TemplatesPanel },
  { id: "qr", label: "QR code", Icon: QrCode, Panel: QrPanel },
  { id: "text", label: "Text", Icon: Type, Panel: TextPanel },
  { id: "uploads", label: "Uploads", Icon: ImageIcon, Panel: UploadsPanel },
  { id: "shapes", label: "Shapes", Icon: Shapes, Panel: ShapesPanel },
  { id: "elements", label: "Elements", Icon: Sparkles, Panel: ElementsPanel },
  { id: "background", label: "Background", Icon: PaintBucket, Panel: BackgroundPanel },
  { id: "layers", label: "Layers", Icon: Layers, Panel: LayersPanel },
];

export function ActivePanel({ id }: { id: PanelId }) {
  const tool = TOOLS.find((t) => t.id === id);
  if (!tool) return null;
  return <tool.Panel />;
}
