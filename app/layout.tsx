import type { Metadata } from "next";
import { fonts } from "@/app/fonts";
import "@/app/styles/globals.css";
export const metadata: Metadata = {
  title: { default: "SiriusTech", template: "%s · SiriusTech" },
  description: "Интерфейсная система SiriusTech",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={fonts}>
      <body>{children}</body>
    </html>
  );
}
