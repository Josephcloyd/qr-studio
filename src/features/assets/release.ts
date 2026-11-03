/**
 * Releases an asset's object URL once nothing references it any more —
 * neither the studio document nor the standalone generator.
 */
import { referencedAssets } from "@/lib/model/ops";
import { useEditorStore } from "@/features/studio/store/editorStore";
import { useGeneratorStore } from "@/features/generator/generatorStore";
import { useAssetStore } from "./assetStore";

export function isAssetInUse(id: string): boolean {
  const { doc, history } = useEditorStore.getState();
  if (referencedAssets(doc).has(id)) return true;
  // Keep assets that undo could bring back.
  if (
    history.past.some((d) => referencedAssets(d).has(id)) ||
    history.future.some((d) => referencedAssets(d).has(id))
  ) {
    return true;
  }
  return useGeneratorStore.getState().style.logo.assetId === id;
}

export function releaseAssetIfUnused(id: string): void {
  if (!isAssetInUse(id)) useAssetStore.getState().remove(id);
}

/** Drops every asset not used by the generator or the current document (after New/Import). */
export function pruneUnusedAssets(): void {
  const { assets } = useAssetStore.getState();
  for (const id of Object.keys(assets)) releaseAssetIfUnused(id);
}
