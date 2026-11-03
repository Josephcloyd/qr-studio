import {
  ArrowRight,
  CloudOff,
  FileImage,
  FileJson,
  FileText,
  Fingerprint,
  HardDrive,
  ImagePlus,
  LayoutTemplate,
  MousePointer2,
  PenTool,
  ScanLine,
  Shapes,
  UserX,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { HeroPlayground } from "./HeroPlayground";
import { TemplateShelf } from "./TemplateShelf";

function Eyebrow({
  children,
  tone = "accent",
}: {
  children: ReactNode;
  tone?: "accent" | "light";
}) {
  return (
    <p
      className={`font-mono text-[11px] font-semibold tracking-[0.2em] uppercase ${tone === "accent" ? "text-accent-ink" : "text-accent"}`}
    >
      {children}
    </p>
  );
}

export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="paper-grain border-line relative overflow-hidden border-b"
    >
      <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:pt-20 lg:pb-28">
        <div className="animate-rise">
          <p className="border-line-strong bg-card text-ink-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-[11px] font-semibold tracking-[0.12em] uppercase">
            <span className="bg-accent size-1.5 rounded-full" aria-hidden="true" />
            Free · No sign-up · Runs in your browser
          </p>
          <h1
            id="hero-title"
            className="font-display text-ink mt-6 text-[clamp(2.75rem,1.6rem+5vw,5.6rem)] leading-[0.95] font-semibold tracking-[-0.035em] text-balance"
          >
            Create QR codes.{" "}
            <span className="relative whitespace-nowrap italic">
              Design them
              <svg
                aria-hidden="true"
                viewBox="0 0 300 20"
                preserveAspectRatio="none"
                className="text-accent absolute -bottom-2 left-0 h-3 w-full"
              >
                <path
                  d="M2 14 C 60 4, 120 4, 180 10 S 270 16, 298 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            your way.
          </h1>
          <p className="text-ink-2 mt-7 max-w-xl text-[17px] leading-relaxed">
            Generate, customize, and design professional QR codes in minutes. Your projects stay in
            your browser. No account, no uploads, and no cloud storage.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/create/"
              className="group bg-ink text-paper hover:bg-ink-2 inline-flex h-13 items-center gap-2 rounded-2xl px-6 text-[15px] font-semibold shadow-[0_2px_0_var(--accent)] transition-all hover:-translate-y-0.5"
            >
              Create QR code
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
            <Link
              href="#designs"
              className="border-line-strong bg-card text-ink hover:border-ink inline-flex h-13 items-center rounded-2xl border px-6 text-[15px] font-semibold transition-colors"
            >
              Explore designs
            </Link>
          </div>
          <dl className="border-line mt-10 grid max-w-lg grid-cols-3 gap-4 border-t pt-6">
            {[
              ["10", "QR types"],
              ["20", "editable templates"],
              ["0", "bytes uploaded"],
            ].map(([n, label]) => (
              <div key={label}>
                <dt className="sr-only">{label}</dt>
                <dd className="font-display text-ink text-3xl font-semibold">{n}</dd>
                <dd className="text-ink-3 mt-0.5 text-[12.5px]">{label}</dd>
              </div>
            ))}
          </dl>
        </div>
        <HeroPlayground />
      </div>
    </section>
  );
}

const USES = [
  "Restaurant menus",
  "Wi-Fi cards",
  "Business cards",
  "Event invites",
  "Product labels",
  "Social posters",
  "Table tents",
  "Printable flyers",
  "Stickers",
  "Contact cards",
];

export function UseStrip() {
  return (
    <div
      className="border-line bg-ink text-paper overflow-hidden border-b py-4"
      aria-label="Things you can make"
    >
      <ul className="flex w-max animate-[marquee_40s_linear_infinite] gap-10 font-mono text-[12px] font-semibold tracking-[0.18em] uppercase motion-reduce:animate-none">
        {[...USES, ...USES].map((u, i) => (
          <li
            key={i}
            className="flex items-center gap-10"
            aria-hidden={i >= USES.length || undefined}
          >
            {u}
            <span className="text-accent" aria-hidden="true">
              ✦
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Designs() {
  return (
    <section
      id="designs"
      aria-labelledby="designs-title"
      className="border-line scroll-mt-20 border-b"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <Eyebrow>Explore designs</Eyebrow>
            <h2
              id="designs-title"
              className="font-display text-ink mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
            >
              Start from a layout. Make it entirely yours.
            </h2>
            <p className="text-ink-3 mt-4 text-[16px] leading-relaxed">
              Every template is a set of ordinary, editable elements — swap the text, colors, images
              and the QR code itself.
            </p>
          </div>
          <Link
            href="/templates/"
            className="border-line-strong bg-card text-ink hover:border-ink inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold"
          >
            All 20 templates <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <TemplateShelf limit={8} />
      </div>
    </section>
  );
}

const FEATURES = [
  {
    Icon: MousePointer2,
    title: "A real design canvas",
    body: "Drag, resize, rotate, align and layer text, images, shapes and icons around your code — with smart guides, undo and keyboard shortcuts.",
  },
  {
    Icon: ScanLine,
    title: "Scan-checked as you design",
    body: "Every code is decoded right in your browser while you style it, and again before each export. Risky combinations are blocked, not just warned about.",
  },
  {
    Icon: ImagePlus,
    title: "Your logo, in the middle",
    body: "Add a centered logo with a clean plate behind it. Error correction rises automatically and the size is capped so the code keeps working.",
  },
  {
    Icon: Shapes,
    title: "Ten kinds of QR",
    body: "Websites, Wi-Fi, contact cards, email, phone, SMS, WhatsApp, locations, calendar events and plain text — all static, no redirects.",
  },
  {
    Icon: LayoutTemplate,
    title: "Print and screen sizes",
    body: "Business cards, A4, A5, flyers, posters, stickers, table tents, social squares and stories — or any custom size in mm, inches or pixels.",
  },
  {
    Icon: PenTool,
    title: "Pixel-perfect exports",
    body: "High-resolution PNG with print DPI, true vector SVG, and print-ready PDF — the same renderer draws the canvas and every file.",
  },
];

export function Features() {
  return (
    <section aria-labelledby="features-title" className="border-line bg-card border-b">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Eyebrow>What&apos;s inside</Eyebrow>
            <h2
              id="features-title"
              className="font-display text-ink mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
            >
              More than a color picker.
            </h2>
            <p className="text-ink-3 mt-4 max-w-md text-[16px] leading-relaxed">
              QR Studio pairs a careful QR engine with a lightweight design studio, so you can make
              the whole printed piece — not just the square.
            </p>
            <Link
              href="/studio/"
              className="bg-accent text-ink mt-8 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)] hover:brightness-95"
            >
              Open the studio <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <ol className="border-line bg-line grid gap-px overflow-hidden rounded-3xl border sm:grid-cols-2">
            {FEATURES.map(({ Icon, title, body }, i) => (
              <li key={title} className="group bg-card hover:bg-paper p-6 transition-colors sm:p-7">
                <div className="flex items-center justify-between">
                  <Icon className="text-accent-ink size-6" aria-hidden="true" />
                  <span className="text-ink-3 font-mono text-[11px]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="text-ink mt-5 text-[17px] font-semibold">{title}</h3>
                <p className="text-ink-3 mt-2 text-[14px] leading-relaxed">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Generate",
    body: "Choose what the code should do and fill in the details. The preview updates as you type.",
  },
  {
    n: "02",
    title: "Design",
    body: "Style the code, then build a layout around it — or start from a template.",
  },
  {
    n: "03",
    title: "Download",
    body: "Export PNG, SVG or PDF. Save a project file if you want to keep editing later.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-title" className="border-line border-b">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <Eyebrow>How it works</Eyebrow>
        <h2
          id="how-title"
          className="font-display text-ink mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl"
        >
          Three steps. No sign-up.
        </h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-6">
          {STEPS.map((s) => (
            <li key={s.n} className="border-ink relative border-t-2 pt-6">
              <span className="font-display text-accent text-[64px] leading-none font-semibold">
                {s.n}
              </span>
              <h3 className="text-ink mt-3 text-xl font-semibold">{s.title}</h3>
              <p className="text-ink-3 mt-2 max-w-sm text-[15px] leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function PrivacySection() {
  const local = [
    { Icon: Fingerprint, text: "QR generation and styling" },
    { Icon: ImagePlus, text: "Reading your logos and photos" },
    { Icon: MousePointer2, text: "Every edit on the canvas" },
    { Icon: FileImage, text: "PNG, SVG and PDF exports" },
    { Icon: FileJson, text: "Saving and opening project files" },
  ];
  const never = [
    { Icon: UserX, text: "No accounts or sign-in" },
    { Icon: CloudOff, text: "No uploads, no cloud storage" },
    { Icon: HardDrive, text: "No auto-saving to your browser storage" },
    { Icon: ScanLine, text: "No analytics, trackers or scan tracking" },
  ];
  return (
    <section
      id="privacy"
      aria-labelledby="privacy-title"
      className="bg-ink text-paper scroll-mt-20"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <Eyebrow tone="light">Privacy-first by design</Eyebrow>
            <h2
              id="privacy-title"
              className="font-display mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
            >
              Your designs never leave your browser.
            </h2>
            <p className="text-paper/70 mt-5 max-w-xl text-[16px] leading-relaxed">
              QR Studio is a static website. Once the page has loaded, everything you make is
              created, edited and exported on your own device. There is no server that receives your
              content — and a strict security policy stops the page from sending data to other
              websites.
            </p>
            <p className="text-paper/55 mt-4 max-w-xl text-[14px] leading-relaxed">
              To be precise: like any website, our host sees ordinary requests for the site&apos;s
              own files (and your IP address) when the page loads. Links inside your QR codes are
              only visited when someone scans them.
            </p>
            <Link
              href="/privacy/"
              className="text-accent mt-8 inline-flex items-center gap-2 text-[15px] font-semibold underline-offset-4 hover:underline"
            >
              Read exactly how it works <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="border-paper/10 bg-paper/5 rounded-3xl border p-6">
              <h3 className="text-accent font-mono text-[11px] font-semibold tracking-[0.16em] uppercase">
                Happens on your device
              </h3>
              <ul className="mt-4 grid gap-3">
                {local.map(({ Icon, text }) => (
                  <li key={text} className="text-paper/85 flex items-center gap-3 text-[14px]">
                    <Icon className="text-paper/50 size-4 shrink-0" aria-hidden="true" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-paper/10 bg-paper/5 rounded-3xl border p-6">
              <h3 className="text-accent font-mono text-[11px] font-semibold tracking-[0.16em] uppercase">
                Never happens
              </h3>
              <ul className="mt-4 grid gap-3">
                {never.map(({ Icon, text }) => (
                  <li key={text} className="text-paper/85 flex items-center gap-3 text-[14px]">
                    <Icon className="text-paper/50 size-4 shrink-0" aria-hidden="true" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const FORMATS = [
  {
    Icon: FileImage,
    name: "PNG",
    spec: "Up to 600 DPI · transparent background · print DPI embedded",
    use: "Screens, documents, most printers",
  },
  {
    Icon: PenTool,
    name: "SVG",
    spec: "True vector · images & fonts embedded · no expiring links",
    use: "Designers, signage, large formats",
  },
  {
    Icon: FileText,
    name: "PDF",
    spec: "A4, A5, Letter, custom · exact physical size · 150–600 DPI",
    use: "Print shops and office printing",
  },
  {
    Icon: FileJson,
    name: "Project",
    spec: "Editable .qrstudio.json · includes your images",
    use: "Continue editing later, on this device",
  },
];

export function Formats() {
  return (
    <section aria-labelledby="formats-title" className="border-line border-b">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
        <Eyebrow>Export formats</Eyebrow>
        <h2
          id="formats-title"
          className="font-display text-ink mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl"
        >
          Ready for the printer, the screen, or later.
        </h2>
        <div className="border-line bg-card mt-12 overflow-hidden rounded-3xl border">
          {FORMATS.map(({ Icon, name, spec, use }) => (
            <div
              key={name}
              className="border-line grid items-center gap-2 border-b px-6 py-5 last:border-b-0 md:grid-cols-[180px_1fr_1fr] md:gap-6"
            >
              <div className="flex items-center gap-3">
                <Icon className="text-accent-ink size-5" aria-hidden="true" />
                <span className="font-display text-ink text-2xl font-semibold">{name}</span>
              </div>
              <p className="text-ink-2 font-mono text-[12.5px]">{spec}</p>
              <p className="text-ink-3 text-[14px]">{use}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "Is QR Studio really free?",
    a: "Yes. QR Studio is a free tool from GetLaunch Ph. There are no paid plans, watermarks or sign-ups.",
  },
  {
    q: "Do my QR codes expire?",
    a: "No. QR Studio makes static codes: the link or information is stored directly in the pattern. There's no redirect service in between, so nothing can expire or be switched off — and nobody tracks the scans.",
  },
  {
    q: "Are my images or designs uploaded anywhere?",
    a: "No. Images are opened by your browser and kept in memory on your device. Designs, exports and project files are created locally. The site has no backend that could receive them.",
  },
  {
    q: "What happens if I close the tab?",
    a: "Your design is gone — we deliberately don't save it anywhere, not even in your browser's storage. Use “Download project file” to keep a copy you can open again later. The studio warns you before you leave with unsaved work.",
  },
  {
    q: "Will a styled QR code still scan?",
    a: "QR Studio checks every code by actually decoding it in your browser, raises error correction when you add a logo, keeps a proper quiet zone, and disables corner styles that confuse scanners. Still, always test-scan your final print with a couple of phones.",
  },
  {
    q: "Can I use the codes commercially?",
    a: "Yes — anything you make is yours to use for your business, events or personal projects.",
  },
  {
    q: "Which browsers are supported?",
    a: "Recent versions of Chrome, Edge, Firefox and Safari on desktop and mobile. The studio has a touch-friendly layout for phones and tablets.",
  },
];

export function Faq() {
  return (
    <section aria-labelledby="faq-title" className="border-line bg-card border-b">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:py-28">
        <div>
          <Eyebrow>FAQ</Eyebrow>
          <h2
            id="faq-title"
            className="font-display text-ink mt-3 text-4xl font-semibold tracking-tight sm:text-5xl"
          >
            Good questions.
          </h2>
        </div>
        <div className="divide-line border-line divide-y border-y">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group py-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="text-ink flex cursor-pointer list-none items-center justify-between gap-4 text-[16.5px] font-semibold">
                {q}
                <span
                  className="border-line-strong text-ink-2 flex size-8 shrink-0 items-center justify-center rounded-full border text-lg leading-none transition-transform group-open:rotate-45"
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="text-ink-3 mt-3 max-w-2xl text-[15px] leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="paper-grain">
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:py-24">
        <h2
          id="cta-title"
          className="font-display text-ink mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl"
        >
          Make something people will want to scan.
        </h2>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link
            href="/create/"
            className="bg-ink text-paper hover:bg-ink-2 inline-flex h-13 items-center gap-2 rounded-2xl px-6 text-[15px] font-semibold"
          >
            Create QR code <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link
            href="/studio/"
            className="border-line-strong bg-card text-ink hover:border-ink inline-flex h-13 items-center rounded-2xl border px-6 text-[15px] font-semibold"
          >
            Open design studio
          </Link>
        </div>
      </div>
    </section>
  );
}
