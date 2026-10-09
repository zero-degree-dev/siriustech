import { ResizeVisual } from "./resize-visual";

const slides = [
  { src: "/landing/hero/threat-monitoring.png", alt: "Команда инженеров в центре мониторинга информационной безопасности" },
  { src: "/landing/hero/cloud-infrastructure.png", alt: "Инженеры управляют облачной инфраструктурой в центре мониторинга" },
  { src: "/landing/hero/digital-forensics.png", alt: "Специалисты анализируют цифровые угрозы в исследовательской лаборатории" },
];

export function HeroVisual({ className }: { className?: string }) {
  return <ResizeVisual slides={slides} className={className} sizes="(max-width: 767px) 100vw, 50vw" priority />;
}
