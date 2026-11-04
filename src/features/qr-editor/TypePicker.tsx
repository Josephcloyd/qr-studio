"use client";

import {
  CalendarDays,
  Contact,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquareText,
  Phone,
  Type,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/components/ui/cn";
import { useRovingGroup } from "@/components/ui/useRovingGroup";
import { QR_TYPE_LABELS, QR_TYPES, type QrType } from "@/lib/qr/content";

export const QR_TYPE_ICONS: Record<QrType, LucideIcon> = {
  url: Globe,
  text: Type,
  wifi: Wifi,
  vcard: Contact,
  email: Mail,
  phone: Phone,
  sms: MessageSquareText,
  whatsapp: MessageCircle,
  location: MapPin,
  event: CalendarDays,
};

export function TypePicker({
  value,
  onChange,
  compact = false,
}: {
  value: QrType;
  onChange: (t: QrType) => void;
  compact?: boolean;
}) {
  const { attach: groupAttach, onKeyDown: groupKeys } = useRovingGroup<HTMLDivElement>();
  return (
    <div
      ref={groupAttach}
      onKeyDown={groupKeys}
      role="radiogroup"
      aria-label="QR code type"
      className={cn("grid gap-1.5", compact ? "grid-cols-5" : "grid-cols-5 sm:grid-cols-5")}
    >
      {QR_TYPES.map((type) => {
        const Icon = QR_TYPE_ICONS[type];
        const active = type === value;
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(type)}
            className={cn(
              "group flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 text-[11.5px] font-medium transition-all duration-150",
              active
                ? "border-accent bg-accent-soft text-ink"
                : "border-line bg-card text-ink-2 hover:border-ink-3 hover:text-ink",
            )}
          >
            <Icon
              className={cn(
                "size-[18px]",
                active ? "text-accent" : "text-ink-3 group-hover:text-ink",
              )}
              aria-hidden="true"
            />
            <span className="truncate">{QR_TYPE_LABELS[type]}</span>
          </button>
        );
      })}
    </div>
  );
}
