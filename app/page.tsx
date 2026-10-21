import type { Metadata } from "next";
import { LandingApp } from "@/app/landing-app";
export const metadata: Metadata = {
  title: "СириусТех — разработка программного обеспечения",
  description:
    "Разработка программного обеспечения, корпоративных порталов и мобильных приложений. Инженерный подход к цифровым решениям.",
};
export default function Page() {
  return <LandingApp />;
}
