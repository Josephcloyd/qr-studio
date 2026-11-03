import { createDocument, createQrElement } from "@/lib/model/factory";
import { addElements } from "@/lib/model/ops";
import { NO_PAINT } from "@/lib/model/paint";
import type { DesignDocument } from "@/lib/model/types";
import type { QrContent } from "@/lib/qr/content";
import type { QrStyle } from "@/lib/qr/style";

/** A borderless document containing only one QR code — for QR-only downloads. */
export function qrOnlyDocument(content: QrContent, style: QrStyle, size: number, name = "QR code"): DesignDocument {
  const base = createDocument({ id: "qr", label: "QR", description: "", width: size, height: size, unit: "px", dpi: 96 }, name);
  return addElements({ ...base, background: { ...base.background, paint: NO_PAINT } }, [
    createQrElement({ x: 0, y: 0, width: size }, content, style),
  ]);
}
