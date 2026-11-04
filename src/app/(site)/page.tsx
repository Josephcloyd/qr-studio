import { GeneratorPage } from "@/features/generator/GeneratorPage";
import { TemplateShelf } from "@/features/landing/TemplateShelf";

/** Home is the tool itself: the QR generator, with templates right below. */
export default function HomePage() {
  return (
    <>
      <GeneratorPage />
      <section
        id="templates"
        aria-labelledby="templates-title"
        className="border-line mx-auto max-w-[1440px] scroll-mt-24 border-t px-3 pt-10 pb-20 sm:px-5"
      >
        <div className="mb-6">
          <h2 id="templates-title" className="text-ink text-2xl font-bold tracking-tight">
            Or start from a template
          </h2>
          <p className="text-ink-3 mt-1 text-[14.5px]">
            Every template opens in the studio, fully editable — text, colors, images and the QR
            code itself.
          </p>
        </div>
        <TemplateShelf limit={20} />
      </section>
    </>
  );
}
