/**
 * Project file download/import. Both happen entirely in the browser: the
 * file is written with a Blob download and read with the File API.
 */
import { toast } from "@/components/ui/Toaster";
import {
  dataUrlToBlob,
  isUnsafeSvg,
  MAX_IMAGE_SIDE,
  type ProcessedImage,
} from "@/lib/assets/intake";
import { createId } from "@/lib/model/ids";
import { referencedAssets } from "@/lib/model/ops";
import {
  MAX_PROJECT_BYTES,
  parseProjectFile,
  projectFileName,
  remapAssetIds,
  serializeProject,
  type ProjectAsset,
} from "@/lib/project/projectFile";
import { useAssetStore } from "@/features/assets/assetStore";
import { pruneUnusedAssets } from "@/features/assets/release";
import { downloadBlob, formatBytes } from "@/features/export/download";
import { assetDataUrl } from "@/features/export/svgExport";
import { useEditorStore } from "@/features/studio/store/editorStore";

export async function downloadProject(): Promise<void> {
  const { doc } = useEditorStore.getState();
  const { assets } = useAssetStore.getState();
  try {
    const list: ProjectAsset[] = [];
    for (const id of referencedAssets(doc)) {
      const a = assets[id];
      if (!a) continue;
      list.push({
        id,
        name: a.name,
        mime: a.mime,
        width: a.width,
        height: a.height,
        dataUrl: await assetDataUrl(a),
      });
    }
    const blob = new Blob([serializeProject(doc, list)], { type: "application/json" });
    downloadBlob(blob, projectFileName(doc.name));
    useEditorStore.getState().markSaved();
    toast.success(
      "Project file downloaded",
      `${formatBytes(blob.size)} · open it later with “Open project”.`,
    );
  } catch (error) {
    toast.error(
      "Couldn't save the project",
      error instanceof Error ? error.message : "Please try again.",
    );
  }
}

async function verifyImage(blob: Blob, mime: string): Promise<{ width: number; height: number }> {
  if (mime === "image/svg+xml") {
    if (isUnsafeSvg(await blob.text())) throw new Error("An embedded SVG contains scripts.");
    return { width: 0, height: 0 };
  }
  const bitmap = await createImageBitmap(blob).catch(() => {
    throw new Error("An embedded image is damaged.");
  });
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  if (Math.max(size.width, size.height) > MAX_IMAGE_SIDE * 2)
    throw new Error("An embedded image is too large.");
  return size;
}

/** Reads, validates and loads a project file. Returns true on success. */
export async function importProjectFile(file: File): Promise<boolean> {
  if (file.size > MAX_PROJECT_BYTES) {
    toast.error("File too large", "Project files can be up to 60 MB.");
    return false;
  }
  const parsed = parseProjectFile(await file.text());
  if (!parsed.ok) {
    toast.error("Couldn't open project", parsed.error);
    return false;
  }
  const { project } = parsed;
  const store = useAssetStore.getState();
  const added: string[] = [];
  try {
    const remap = new Map<string, string>();
    for (const a of project.assets) {
      const blob = dataUrlToBlob(a.dataUrl);
      const verified = await verifyImage(blob, a.mime);
      const image: ProcessedImage = {
        blob,
        mime: a.mime,
        name: a.name,
        width: verified.width || a.width,
        height: verified.height || a.height,
      };
      const id = createId("asset");
      store.add(image, id);
      added.push(id);
      remap.set(a.id, id);
    }
    useEditorStore.getState().loadDocument(remapAssetIds(project.document, remap));
    pruneUnusedAssets();
    toast.success("Project opened", `“${project.document.name}” is ready to edit.`);
    return true;
  } catch (error) {
    for (const id of added) store.remove(id);
    toast.error(
      "Couldn't open project",
      error instanceof Error ? error.message : "The file is damaged.",
    );
    return false;
  }
}
