import { create } from "zustand";

export type PanelId =
  "templates" | "qr" | "text" | "uploads" | "shapes" | "elements" | "background" | "layers";
export type DialogId = "export" | "preview" | "shortcuts" | "new" | "import-confirm" | null;

interface UiState {
  panel: PanelId | null;
  /** Mobile: whether the properties sheet is open. */
  propertiesOpen: boolean;
  dialog: DialogId;
  setPanel: (panel: PanelId | null) => void;
  togglePanel: (panel: PanelId) => void;
  setPropertiesOpen: (open: boolean) => void;
  openDialog: (dialog: DialogId) => void;
}

/** Desktop opens with Templates showing; phones start with the canvas visible. */
const initialPanel = (): PanelId | null =>
  typeof window !== "undefined" && !window.matchMedia("(min-width: 1024px)").matches
    ? null
    : "templates";

export const useUiStore = create<UiState>((set, get) => ({
  panel: initialPanel(),
  propertiesOpen: false,
  dialog: null,
  setPanel: (panel) => set({ panel }),
  togglePanel: (panel) => set({ panel: get().panel === panel ? null : panel }),
  setPropertiesOpen: (propertiesOpen) => set({ propertiesOpen }),
  openDialog: (dialog) => set({ dialog }),
}));
