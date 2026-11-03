"use client";

import { Switch as RSwitch } from "radix-ui";
import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "./cn";

const INPUT =
  "w-full rounded-xl border border-line-strong bg-card px-3 text-sm text-ink placeholder:text-ink-3/70 transition-colors hover:border-ink-3 focus:border-ink focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-cobalt aria-[invalid=true]:border-danger";

interface FieldShellProps {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  className?: string;
  hideLabel?: boolean;
  trailing?: ReactNode;
}

export function FieldShell({ label, htmlFor, hint, error, children, className, hideLabel, trailing }: FieldShellProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <div className={cn("flex items-baseline justify-between gap-2", hideLabel && "sr-only")}>
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink-2">
          {label}
        </label>
        {trailing}
      </div>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-[12.5px] font-medium text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-[12.5px] text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  hint?: ReactNode;
  error?: string | null;
  hideLabel?: boolean;
  trailing?: ReactNode;
}

export function TextField({ label, value, onValueChange, hint, error, hideLabel, className, trailing, ...rest }: TextFieldProps) {
  const id = useId();
  return (
    <FieldShell label={label} htmlFor={id} hint={hint} error={error} className={className} hideLabel={hideLabel} trailing={trailing}>
      <input
        id={id}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(INPUT, "h-10")}
        {...rest}
      />
    </FieldShell>
  );
}

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  hint?: ReactNode;
  error?: string | null;
  trailing?: ReactNode;
}

export function TextArea({ label, value, onValueChange, hint, error, className, rows = 4, trailing, ...rest }: TextAreaProps) {
  const id = useId();
  return (
    <FieldShell label={label} htmlFor={id} hint={hint} error={error} className={className} trailing={trailing}>
      <textarea
        id={id}
        rows={rows}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={cn(INPUT, "resize-y py-2.5 leading-relaxed")}
        {...rest}
      />
    </FieldShell>
  );
}

interface SelectFieldProps<T extends string> extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "value"> {
  label: string;
  value: T;
  options: { value: T; label: string; disabled?: boolean }[];
  onValueChange: (value: T) => void;
  hint?: ReactNode;
  hideLabel?: boolean;
}

export function SelectField<T extends string>({ label, value, options, onValueChange, hint, hideLabel, className, ...rest }: SelectFieldProps<T>) {
  const id = useId();
  return (
    <FieldShell label={label} htmlFor={id} hint={hint} className={className} hideLabel={hideLabel}>
      <select
        id={id}
        value={value}
        onChange={(e) => onValueChange(e.target.value as T)}
        className={cn(INPUT, "h-10 cursor-pointer appearance-none bg-[length:16px] bg-[right_10px_center] bg-no-repeat pr-9")}
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23463f36' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        }}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
  className?: string;
  precision?: number;
  /** Short label shown inside the field (e.g. "X"). */
  prefix?: string;
}

/** Compact numeric input that commits on blur/Enter and clamps to range. */
export function NumberField({ label, value, onValueChange, min = -Infinity, max = Infinity, step = 1, suffix, className, precision = 0, prefix }: NumberFieldProps) {
  const id = useId();
  const display = Number.isFinite(value) ? Number(value.toFixed(precision)) : 0;
  const commit = (raw: string) => {
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(n)) return;
    const clamped = Math.min(max, Math.max(min, n));
    if (clamped !== value) onValueChange(clamped);
  };
  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <label htmlFor={id} className={cn("text-[12px] font-medium text-ink-3", prefix && "sr-only")}>
        {label}
      </label>
      <div className="flex h-9 items-center rounded-lg border border-line-strong bg-card focus-within:border-ink hover:border-ink-3">
        {prefix && (
          <span aria-hidden="true" className="pl-2.5 font-mono text-[11px] font-semibold text-ink-3">
            {prefix}
          </span>
        )}
        <input
          id={id}
          key={display}
          type="number"
          inputMode="decimal"
          defaultValue={display}
          min={Number.isFinite(min) ? min : undefined}
          max={Number.isFinite(max) ? max : undefined}
          step={step}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit((e.target as HTMLInputElement).value);
          }}
          className="h-full w-full min-w-0 bg-transparent px-2 text-[13px] tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {suffix && <span className="pr-2.5 text-[11px] text-ink-3">{suffix}</span>}
      </div>
    </div>
  );
}

interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
  format?: (value: number) => string;
  hint?: ReactNode;
  className?: string;
}

export function SliderField({ label, value, min, max, step = 1, onValueChange, format, hint, className }: SliderFieldProps) {
  const id = useId();
  const fill = ((value - min) / (max - min || 1)) * 100;
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-[13px] font-medium text-ink-2">
          {label}
        </label>
        <output htmlFor={id} className="font-mono text-[12px] text-ink-3 tabular-nums">
          {format ? format(value) : value}
        </output>
      </div>
      <input
        id={id}
        type="range"
        className="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onValueChange(Number(e.target.value))}
        style={{ ["--fill" as string]: `${fill}%` }}
      />
      {hint && <p className="text-[12px] text-ink-3">{hint}</p>}
    </div>
  );
}

interface SwitchFieldProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  hint?: ReactNode;
  disabled?: boolean;
}

export function SwitchField({ label, checked, onCheckedChange, hint, disabled }: SwitchFieldProps) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex flex-col">
        <label htmlFor={id} className="text-[13px] font-medium text-ink-2">
          {label}
        </label>
        {hint && <span className="text-[12px] text-ink-3">{hint}</span>}
      </div>
      <RSwitch.Root
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        className="relative mt-0.5 h-[22px] w-[38px] shrink-0 cursor-pointer rounded-full bg-line-strong transition-colors data-[state=checked]:bg-ink disabled:opacity-40"
      >
        <RSwitch.Thumb className="block size-[18px] translate-x-[2px] rounded-full bg-card shadow transition-transform duration-150 data-[state=checked]:translate-x-[18px]" />
      </RSwitch.Root>
    </div>
  );
}

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: ReactNode; title?: string; disabled?: boolean }[];
  onValueChange: (value: T) => void;
  hideLabel?: boolean;
  className?: string;
  size?: "sm" | "md";
}

/** Radio group styled as a segmented control. Arrow keys move between options. */
export function Segmented<T extends string>({ label, value, options, onValueChange, hideLabel, className, size = "md" }: SegmentedProps<T>) {
  const id = useId();
  const enabled = options.filter((o) => !o.disabled);
  const move = (dir: 1 | -1) => {
    const i = enabled.findIndex((o) => o.value === value);
    const next = enabled[(i + dir + enabled.length) % enabled.length];
    if (next) onValueChange(next.value);
  };
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span id={id} className={cn("text-[13px] font-medium text-ink-2", hideLabel && "sr-only")}>
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={id}
        className="flex flex-wrap gap-1 rounded-xl bg-paper-2 p-1"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            move(1);
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            move(-1);
          }
        }}
      >
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              title={o.title}
              disabled={o.disabled}
              tabIndex={active ? 0 : -1}
              onClick={() => onValueChange(o.value)}
              className={cn(
                "flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-35",
                size === "sm" ? "h-7 px-2 text-[12px]" : "h-8 px-2.5 text-[13px]",
                active ? "bg-card text-ink shadow-[0_1px_2px_rgb(0_0_0/0.12)]" : "text-ink-3 hover:text-ink",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
