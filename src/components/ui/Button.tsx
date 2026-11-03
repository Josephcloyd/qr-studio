"use client";

import { Tooltip } from "radix-ui";
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { cn } from "./cn";

type Variant = "primary" | "accent" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-2 active:translate-y-px shadow-[0_1px_0_rgb(0_0_0/0.2)]",
  accent: "bg-accent text-ink hover:brightness-95 active:translate-y-px shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)]",
  secondary: "bg-card text-ink border border-line-strong hover:border-ink hover:bg-white active:translate-y-px",
  ghost: "text-ink-2 hover:text-ink hover:bg-paper-3/70",
  danger: "bg-card text-danger border border-danger/30 hover:bg-danger-soft",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-xl",
  lg: "h-12 px-6 text-[15px] gap-2.5 rounded-2xl",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({ variant = "secondary", size = "md", className, type = "button", ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-[background,border,color,filter,transform] duration-150 select-none disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...rest}
    />
  );
}

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  shortcut?: string;
  active?: boolean;
  size?: "sm" | "md" | "lg";
  tooltipSide?: "top" | "bottom" | "left" | "right";
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

const ICON_SIZES = { sm: "size-8 rounded-lg", md: "size-9 rounded-xl", lg: "size-11 rounded-xl" };

/** Icon-only button with an accessible label and a tooltip. */
export function IconButton({
  label,
  shortcut,
  active = false,
  size = "md",
  tooltipSide = "bottom",
  className,
  children,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <Tooltip.Root delayDuration={350}>
      <Tooltip.Trigger asChild>
        <button
          type={type}
          aria-label={label}
          aria-pressed={active || undefined}
          className={cn(
            "inline-flex shrink-0 items-center justify-center text-ink-2 transition-colors duration-150 hover:bg-paper-3/80 hover:text-ink disabled:pointer-events-none disabled:opacity-35",
            active && "bg-ink text-paper hover:bg-ink hover:text-paper",
            ICON_SIZES[size],
            className,
          )}
          {...rest}
        >
          {children}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side={tooltipSide}
          sideOffset={6}
          className="z-[100] flex items-center gap-2 rounded-lg bg-ink px-2.5 py-1.5 text-xs font-medium text-paper shadow-pop"
        >
          {label}
          {shortcut && <kbd className="font-mono text-[11px] text-paper/60">{shortcut}</kbd>}
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export const TooltipProvider = Tooltip.Provider;
