import {
  Designs,
  Faq,
  Features,
  FinalCta,
  Formats,
  Hero,
  HowItWorks,
  PrivacySection,
  UseStrip,
} from "@/features/landing/Sections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <UseStrip />
      <Designs />
      <Features />
      <HowItWorks />
      <PrivacySection />
      <Formats />
      <Faq />
      <FinalCta />
    </>
  );
}
