import type { Metadata } from "next";
import { UiKitPage } from "@/pages/ui-kit";
import { DemoExamples } from "@/app/demo-examples";
export const metadata: Metadata = {
  title: "UI Kit",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <UiKitPage demos={<DemoExamples />} />;
}
