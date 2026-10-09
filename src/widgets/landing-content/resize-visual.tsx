"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { createResizePlayer, type ResizePlayer, type ResizeSlide } from "./resize-player";
import s from "./hero-visual.module.css";

type Props = {
  slides: readonly ResizeSlide[];
  className?: string;
  sizes: string;
  priority?: boolean;
  sequence?: (player: ResizePlayer) => Promise<void>;
  visibilityTarget?: string;
};

export function ResizeVisual({ slides, className, sizes, priority = false, sequence, visibilityTarget }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const underlayRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<SVGSVGElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const underlayImageRefs = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    const host = hostRef.current;
    const frame = frameRef.current;
    const underlay = underlayRef.current;
    const cursor = cursorRef.current;
    const anchor = anchorRef.current;
    if (!host || !frame || !underlay || !cursor || !anchor) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let controller: AbortController | undefined;
    const measure = () => {
      host.style.setProperty("--visual-width", `${host.clientWidth - 3}px`);
      host.style.setProperty("--visual-height", `${host.clientHeight - 3}px`);
    };
    const resize = new ResizeObserver(measure);
    resize.observe(host);
    measure();

    const start = () => {
      controller?.abort();
      controller = new AbortController();
      const player = createResizePlayer({ host, frame, underlay, cursor, anchor, images: imageRefs.current, underlayImages: underlayImageRefs.current, visibilityTarget: visibilityTarget ? document.querySelector(visibilityTarget) ?? host : host }, controller.signal, motion.matches || !frame.animate);
      const cycle = async () => {
        if (sequence) return sequence(player);
        if (player.reducedMotion || !(await player.start())) return;
        while (!player.signal.aborted) {
          await Promise.all([player.hold(2400), player.rest()]);
          if (!(await player.transition((player.current + 1) % slides.length))) return;
        }
      };
      void cycle().catch(() => { if (!player.signal.aborted) player.stop(); });
    };
    motion.addEventListener("change", start);
    start();
    return () => {
      controller?.abort();
      resize.disconnect();
      motion.removeEventListener("change", start);
    };
  }, [slides, sequence, visibilityTarget]);

  return (
    <div ref={hostRef} className={`${s.visual} ${className ?? ""}`} data-phase="static" data-current="0">
      <div ref={underlayRef} className={`${s.visual__frame} ${s["visual__frame--underlay"]}`} data-layer="background" hidden aria-hidden="true">
        <div className={s.visual__viewport}><div className={s.visual__canvas}>
          {slides.map((slide, index) => <Image key={slide.src} ref={(image) => { underlayImageRefs.current[index] = image; }} src={slide.src} alt="" fill hidden={index !== 0} sizes={sizes} loading="eager" />)}
        </div></div>
      </div>
      <div ref={frameRef} className={s.visual__frame} data-layer="foreground">
        <div className={s.visual__viewport}><div className={s.visual__canvas}>
          {slides.map((slide, index) => <Image key={slide.src} ref={(image) => { imageRefs.current[index] = image; }} src={slide.src} alt={slide.alt} fill hidden={index !== 0} sizes={sizes} priority={priority && index === 0} loading={priority && index === 0 ? undefined : "eager"} />)}
        </div></div>
      </div>
      <span className={s.visual__handle} aria-hidden="true" />
      <div ref={anchorRef} className={s.visual__anchor} aria-hidden="true">
        <svg ref={cursorRef} className={s.visual__cursor} viewBox="0 0 32 32" aria-hidden="true"><path d="M4 3v24l6.5-6.5L16 30l5-3-5.5-9.5H25Z" /></svg>
      </div>
    </div>
  );
}
