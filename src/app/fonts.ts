import localFont from "next/font/local";
const robotoCyrillic = localFont({
  src: "../../node_modules/@fontsource-variable/roboto/files/roboto-cyrillic-wght-normal.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-roboto-cyrillic",
  display: "swap",
});
const robotoLatin = localFont({
  src: "../../node_modules/@fontsource-variable/roboto/files/roboto-latin-wght-normal.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-roboto-latin",
  display: "swap",
});
const interCyrillic = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-cyrillic-wght-normal.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-inter-cyrillic",
  display: "swap",
});
const interLatin = localFont({
  src: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-inter-latin",
  display: "swap",
});
const monoCyrillic = localFont({
  src: "../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-cyrillic-wght-normal.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-mono-cyrillic",
  display: "swap",
});
const monoLatin = localFont({
  src: "../../node_modules/@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-mono-latin",
  display: "swap",
});
export const fonts =
  robotoCyrillic.variable +
  " " +
  robotoLatin.variable +
  " " +
  interCyrillic.variable +
  " " +
  interLatin.variable +
  " " +
  monoCyrillic.variable +
  " " +
  monoLatin.variable;
