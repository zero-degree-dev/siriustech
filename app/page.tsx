import type { Metadata } from "next";
import { HomePage } from "@/pages/home";
import { LandingForm } from "@/app/landing-form";
export const metadata: Metadata = {
  title: "СириусТех — разработка программного обеспечения",
  description:
    "Разработка программного обеспечения, корпоративных порталов и мобильных приложений. Инженерный подход к цифровым решениям.",
};
export default function Page() {
  return <HomePage form={<LandingForm />} />;
}
