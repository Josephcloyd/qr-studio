import { createDocument, createQrElement, createTextElement } from "@/lib/model/factory";
import { addElements } from "@/lib/model/ops";
import type { QrContent } from "@/lib/qr/content";
import type { QrStyle } from "@/lib/qr/style";
import { useEditorStore } from "./store/editorStore";

/**
 * Sends a generated QR code to the studio. If the studio already holds an
 * unsaved design, the code is added to it instead of replacing it.
 */
export function sendQrToStudio(content: QrContent, style: QrStyle): "added" | "created" {
  const editor = useEditorStore.getState();
  if (editor.dirty && editor.doc.elements.length > 0) {
    const size = Math.round(Math.min(editor.doc.width, editor.doc.height) * 0.45);
    const el = createQrElement({ x: (editor.doc.width - size) / 2, y: (editor.doc.height - size) / 2, width: size }, content, style);
    editor.addElement(el);
    return "added";
  }
  const doc = createDocument(undefined, "My QR card");
  const size = Math.round(doc.width * 0.62);
  const qr = createQrElement({ x: (doc.width - size) / 2, y: doc.height * 0.1, width: size }, content, style);
  const label = createTextElement("Scan me", { x: doc.width * 0.1, y: doc.height * 0.1 + size + 22, width: doc.width * 0.8 }, "label", {
    align: "center",
    fontSize: 22,
    letterSpacing: 0.2,
  });
  editor.loadDocument(addElements(doc, [qr, label]));
  editor.select([qr.id]);
  return "created";
}
