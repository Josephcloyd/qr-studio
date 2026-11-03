"use client";

import { Popover } from "radix-ui";
import { useId, useState } from "react";
import { HexAlphaColorPicker } from "react-colorful";
import { normalizeHex } from "@/lib/color/color";
import { cn } from "./cn";

export const SWATCHES = [
  "#16130f", "#463f36", "#ffffff", "#f6f3ec", "#ff5a1f", "#e63946", "#f4a261", "#e9c46a",
  "#2a9d8f", "#1c6e46", "#2b3bff", "#1d3557", "#7b2cbf", "#ff8fab", "#8d6e63", "#b08968",
];

interface ColorFieldProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  /** Called when a continuous change (dragging the picker) ends. */
  className?: string;
  hideLabel?: boolean;
  allowAlpha?: boolean;
}

export function ColorField({ label, value, onValueChange, className, hideLabel, allowAlpha = true }: ColorFieldProps) {
  const id = useId();
  // null = show the live value; a string = the user is mid-edit.
  const [draft, setDraft] = useState<string | null>(null);

  const commitDraft = () => {
    const hex = draft === null ? null : normalizeHex(draft);
    if (hex && hex !== value) onValueChange(allowAlpha ? hex : hex.slice(0, 7));
    setDraft(null);
  };

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label htmlFor={id} className={cn("text-[13px] font-medium text-ink-2", hideLabel && "sr-only")}>
        {label}
      </label>
      <div className="flex h-9 items-center gap-2 rounded-lg border border-line-strong bg-card pr-2 pl-1 focus-within:border-ink hover:border-ink-3">
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              type="button"
              aria-label={`Pick ${label.toLowerCase()}`}
              className="checkerboard relative size-7 shrink-0 overflow-hidden rounded-md border border-line-strong"
            >
              <span className="absolute inset-0" style={{ background: value }} />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              sideOffset={8}
              collisionPadding={12}
              className="z-[90] w-[244px] rounded-2xl border border-line bg-card p-3 shadow-pop"
            >
              <div className="[&_.react-colorful]:!h-40 [&_.react-colorful]:!w-full">
                <HexAlphaColorPicker color={value} onChange={(c) => onValueChange(allowAlpha ? c : c.slice(0, 7))} />
              </div>
              <div className="mt-3 grid grid-cols-8 gap-1.5" role="list" aria-label="Color presets">
                {SWATCHES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="listitem"
                    aria-label={c}
                    onClick={() => onValueChange(c)}
                    className={cn(
                      "size-6 rounded-md border border-ink/10 transition-transform hover:scale-110",
                      c.toLowerCase() === value.toLowerCase().slice(0, 7) && "ring-2 ring-cobalt ring-offset-1",
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        <input
          id={id}
          value={draft ?? value}
          spellCheck={false}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitDraft();
          }}
          className="h-full w-full min-w-0 bg-transparent font-mono text-[12.5px] uppercase focus:outline-none"
        />
      </div>
    </div>
  );
}
