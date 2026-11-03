import type { Metadata } from "next";
import { GeneratorPage } from "@/features/generator/GeneratorPage";

export const metadata: Metadata = {
  title: "QR code generator",
  description:
    "Create QR codes for websites, Wi-Fi, contacts, WhatsApp, events and more — generated locally in your browser.",
};

export default function CreatePage() {
  return <GeneratorPage />;
}
