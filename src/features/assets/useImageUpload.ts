"use client";

import { useCallback, useState } from "react";
import { toast } from "@/components/ui/Toaster";
import { ImageIntakeError, processImageFile } from "@/lib/assets/intake";
import { useAssetStore, type Asset } from "./assetStore";

/**
 * Reads image files from the user's device into the in-memory asset store.
 * Files are processed by the browser only — never uploaded.
 */
export function useImageUpload() {
  const add = useAssetStore((s) => s.add);
  const [busy, setBusy] = useState(false);

  const ingest = useCallback(
    async (files: FileList | File[] | null): Promise<Asset[]> => {
      const list = files ? Array.from(files) : [];
      if (!list.length) return [];
      setBusy(true);
      const added: Asset[] = [];
      try {
        for (const file of list) {
          try {
            added.push(add(await processImageFile(file)));
          } catch (error) {
            const message = error instanceof ImageIntakeError ? error.message : "That image couldn't be added.";
            toast.error(`Couldn't add ${file.name}`, message);
          }
        }
      } finally {
        setBusy(false);
      }
      return added;
    },
    [add],
  );

  return { ingest, busy };
}
