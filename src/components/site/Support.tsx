"use client";

import { Dialog as RDialog } from "radix-ui";
import { Download, Heart, House, ShieldCheck, X } from "lucide-react";
import { create } from "zustand";
import { cn } from "@/components/ui/cn";

/** The GetLaunch Ph GCash/InstaPay QR, served as a static file from our own origin. */
const SUPPORT_QR = "/support/gcash-qr.png";

const useSupport = create<{ open: boolean; setOpen: (open: boolean) => void }>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

export function SupportButton({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const setOpen = useSupport((s) => s.setOpen);
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label={compact ? "Support QR Studio" : undefined}
      className={cn(
        "border-gold-line bg-gold-soft text-ink hover:border-gold inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-[13.5px] font-semibold transition-colors",
        compact && "w-9 justify-center px-0",
        className,
      )}
    >
      <Heart className="text-gold size-4 fill-current" aria-hidden="true" />
      {!compact && "Support"}
    </button>
  );
}

const STEPS = [
  "Open GCash, tap QR, then scan the code.",
  "On the same phone, save the QR first and upload it in the GCash scanner.",
  "Choose any amount, verify the recipient inside GCash, then confirm.",
];

export function SupportDialog() {
  const open = useSupport((s) => s.open);
  const setOpen = useSupport((s) => s.setOpen);
  return (
    <RDialog.Root open={open} onOpenChange={setOpen}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-[80] bg-black/65 backdrop-blur-[2px]" />
        <RDialog.Content className="border-line bg-paper shadow-pop fixed inset-x-0 bottom-0 z-[81] max-h-[94dvh] overflow-y-auto rounded-t-3xl border focus:outline-none sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-[calc(100vw-2rem)] sm:max-w-[880px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-3xl">
          <div className="relative overflow-hidden bg-gradient-to-br from-[#2f5f4a] to-[#244839] px-6 pt-6 pb-6 text-white sm:px-8 sm:pt-8">
            <div
              className="absolute -top-16 -right-12 size-44 rounded-full bg-white/8"
              aria-hidden="true"
            />
            <RDialog.Close
              aria-label="Close"
              className="absolute top-4 right-4 rounded-lg p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X className="size-5" />
            </RDialog.Close>
            <span className="flex size-14 items-center justify-center rounded-2xl bg-white/15">
              <Heart className="size-6 fill-current" aria-hidden="true" />
            </span>
            <p className="mt-5 text-[12px] font-bold tracking-[0.16em] text-white/75 uppercase">
              Support QR Studio
            </p>
            <RDialog.Title className="mt-1.5 text-2xl font-bold tracking-tight">
              Donate through GCash
            </RDialog.Title>
            <RDialog.Description className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/85">
              Choose any amount you&apos;re comfortable with. Every contribution helps keep QR
              Studio free for everyone.
            </RDialog.Description>
            <p className="mt-4 flex max-w-xl items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-[14px]">
              <House className="size-4 shrink-0" aria-hidden="true" />
              <span>
                <strong>50% of every donation</strong> goes to helping homeless people in Cebu City.
              </span>
            </p>
          </div>

          <div className="grid gap-5 p-6 sm:grid-cols-[1.05fr_1fr] sm:p-8">
            <div className="border-line bg-card flex flex-col items-center rounded-2xl border p-5">
              <p className="text-accent-ink text-[11.5px] font-bold tracking-[0.16em] uppercase">
                Official GCash QR
              </p>
              <div className="mt-4 w-full max-w-[300px] rounded-xl bg-white p-3">
                {/* eslint-disable-next-line @next/next/no-img-element -- static same-origin file */}
                <img
                  src={SUPPORT_QR}
                  alt="GCash InstaPay QR code for donations to GetLaunch Ph"
                  width={352}
                  height={352}
                  className="block h-auto w-full"
                />
              </div>
              <p className="text-ink-3 mt-4 text-center text-[13px] leading-relaxed">
                Scan this code with GCash. Recipient details stay hidden here and appear only during
                confirmation in the GCash app.
              </p>
              <a
                href={SUPPORT_QR}
                download="getlaunchph-gcash-qr.png"
                className="border-line-strong text-ink hover:bg-paper-3 mt-4 inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-[14px] font-semibold"
              >
                <Download className="size-4" aria-hidden="true" />
                Save QR to scan
              </a>
            </div>

            <div className="grid content-start gap-4">
              <div className="border-gold-line bg-gold-soft flex gap-3 rounded-2xl border p-4">
                <ShieldCheck className="text-gold mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <p className="text-ink text-[14px] leading-relaxed font-medium">
                  Complete the transfer only in the official GCash app. GetLaunch Ph will never ask
                  for your MPIN, OTP, password, or verification code.
                </p>
              </div>
              <div className="border-line bg-card rounded-2xl border p-5">
                <h3 className="text-ink text-[16px] font-bold">How to donate</h3>
                <ol className="mt-4 grid gap-3.5">
                  {STEPS.map((step, i) => (
                    <li key={step} className="text-ink-2 flex gap-3 text-[14px] leading-relaxed">
                      <span className="bg-accent-soft text-accent-ink flex size-7 shrink-0 items-center justify-center rounded-full text-[12.5px] font-bold">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
              <p className="text-ink-3 text-[12.5px]">
                Please confirm the recipient name in GCash before sending. Donations are optional —
                QR Studio stays free either way.
              </p>
            </div>
          </div>
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}
