/**
 * In-memory asset library (uploaded logos and images). Assets live only in
 * this browser tab as Blobs + object URLs. Nothing is persisted or uploaded.
 */
import { useMemo } from "react";
import { create } from "zustand";
import { createId } from "@/lib/model/ids";
import { createObjectUrl, revokeObjectUrl } from "@/lib/assets/objectUrls";
import type { AcceptedImageType, ProcessedImage } from "@/lib/assets/intake";
import type { AssetResolver } from "@/render/elements";
import type { ResolvedImage } from "@/render/QrGraphic";

export interface Asset {
  id: string;
  name: string;
  mime: AcceptedImageType;
  width: number;
  height: number;
  bytes: number;
  blob: Blob;
  url: string;
}

interface AssetState {
  assets: Record<string, Asset>;
  order: string[];
  add: (image: ProcessedImage, id?: string) => Asset;
  remove: (id: string) => void;
  clear: () => void;
}

export const useAssetStore = create<AssetState>((set, get) => ({
  assets: {},
  order: [],
  add: (image, id = createId("asset")) => {
    const existing = get().assets[id];
    if (existing) revokeObjectUrl(existing.url);
    const asset: Asset = {
      id,
      name: image.name,
      mime: image.mime,
      width: image.width,
      height: image.height,
      bytes: image.blob.size,
      blob: image.blob,
      url: createObjectUrl(image.blob),
    };
    set((s) => ({
      assets: { ...s.assets, [id]: asset },
      order: s.order.includes(id) ? s.order : [id, ...s.order],
    }));
    return asset;
  },
  remove: (id) => {
    const asset = get().assets[id];
    if (!asset) return;
    revokeObjectUrl(asset.url);
    set((s) => {
      const rest = { ...s.assets };
      delete rest[id];
      return { assets: rest, order: s.order.filter((x) => x !== id) };
    });
  },
  clear: () => {
    for (const a of Object.values(get().assets)) revokeObjectUrl(a.url);
    set({ assets: {}, order: [] });
  },
}));

/** One stable resolved object per asset, so memoized QR layouts aren't recomputed every frame. */
const resolvedCache = new WeakMap<Asset, ResolvedImage>();

export function resolveFrom(assets: Record<string, Asset>): AssetResolver {
  return (id) => {
    const a = assets[id];
    if (!a) return null;
    let resolved = resolvedCache.get(a);
    if (!resolved) {
      resolved = { href: a.url, width: a.width, height: a.height };
      resolvedCache.set(a, resolved);
    }
    return resolved;
  };
}

/** A stable resolver that updates when the asset library changes. */
export function useAssetResolver(): AssetResolver {
  const assets = useAssetStore((s) => s.assets);
  return useMemo(() => resolveFrom(assets), [assets]);
}
