import {
  Designs,
  Faq,
  Features,
  FinalCta,
  Formats,
  Hero,
  HowItWorks,
  PrivacySection,
} from "@/features/landing/Sections";

export default function HomePage() {
  return (
    <>
      <Hero />
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
