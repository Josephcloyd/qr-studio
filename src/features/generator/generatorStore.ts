/** Generator state — in memory only, nothing persisted. */
import { create } from "zustand";
import { emptyContent, QR_TYPES, type QrContent, type QrType } from "@/lib/qr/content";
import { DEFAULT_QR_STYLE, type QrStyle } from "@/lib/qr/style";

type ContentByType = { [K in QrType]: Extract<QrContent, { type: K }> };

interface GeneratorState {
  type: QrType;
  contents: ContentByType;
  style: QrStyle;
  setType: (type: QrType) => void;
  setContent: (content: QrContent) => void;
  setStyle: (style: QrStyle) => void;
  reset: () => void;
}

const initialContents = (): ContentByType =>
  Object.fromEntries(QR_TYPES.map((t) => [t, emptyContent(t)])) as ContentByType;

export const useGeneratorStore = create<GeneratorState>((set) => ({
  type: "url",
  contents: initialContents(),
  style: DEFAULT_QR_STYLE,
  setType: (type) => set({ type }),
  setContent: (content) => set((s) => ({ contents: { ...s.contents, [content.type]: content }, type: content.type })),
  setStyle: (style) => set({ style }),
  reset: () => set({ type: "url", contents: initialContents(), style: DEFAULT_QR_STYLE }),
}));

export function currentContent(state: Pick<GeneratorState, "type" | "contents">): QrContent {
  return state.contents[state.type];
}
