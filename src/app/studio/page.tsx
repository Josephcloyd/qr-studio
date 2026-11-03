import type { Metadata } from "next";
import { StudioLoader } from "./StudioLoader";

export const metadata: Metadata = {
  title: "Design studio",
  description:
    "Design complete QR layouts — cards, menus, flyers and posters — right in your browser.",
};

export default function StudioPage() {
  return <StudioLoader />;
}
