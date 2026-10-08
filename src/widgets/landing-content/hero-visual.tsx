"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import s from "./hero-visual.module.css";

const slides = [
  {
    src: "/landing/hero/threat-monitoring.png",
    alt: "Команда инженеров в центре мониторинга информационной безопасности",
  },
  {
    src: "/landing/hero/cloud-infrastructure.png",
    alt: "Инженеры управляют облачной инфраструктурой в центре мониторинга",
  },
  {
    src: "/landing/hero/digital-forensics.png",
    alt: "Специалисты анализируют цифровые угрозы в исследовательской лаборатории",
  },
];

export function HeroVisual({ className }: { className?: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const underlayRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<SVGSVGElement>(null);
  const cursorAnchorRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const underlayImageRefs = useRef<(HTMLImageElement | null)[]>([]);

  useEffect(() => {
    const host = hostRef.current;
    const frame = frameRef.current;
    const underlay = underlayRef.current;
    const cursor = cursorRef.current;
    const cursorAnchor = cursorAnchorRef.current;
    const images = imageRefs.current;
    const underlayImages = underlayImageRefs.current;
    if (!host || !frame || !underlay || !cursor || !cursorAnchor) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation: Animation | undefined;
    let cursorAnimation: Animation | undefined;
    let anchorAnimation: Animation | undefined;
    let controller: AbortController | undefined;
    const bounds = host.getBoundingClientRect();
    let onScreen = bounds.bottom > 0 && bounds.top < window.innerHeight;

    const measure = () => {
      host.style.setProperty("--visual-width", `${host.clientWidth - 3}px`);
      host.style.setProperty("--visual-height", `${host.clientHeight - 3}px`);
    };
    const resize = new ResizeObserver(measure);
    resize.observe(host);
    measure();

    const syncPlayback = () => {
      for (const active of [animation, anchorAnimation, cursorAnimation]) {
        if (!active || active.playState === "finished") continue;
        if (document.hidden || !onScreen) active.pause();
        else active.play();
      }
    };
    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      syncPlayback();
    });
    intersection.observe(host);
    document.addEventListener("visibilitychange", syncPlayback);

    const show = (index: number, layer = images) => {
      layer.forEach((image, position) => {
        if (image) image.hidden = position !== index;
      });
    };
    const ready = async (index: number, includeUnderlay = false) => {
      try {
        await Promise.all([
          images[index]!.decode(),
          ...(includeUnderlay ? [underlayImages[index]!.decode()] : []),
        ]);
        return true;
      } catch {
        return false;
      }
    };
    const reset = () => {
      controller?.abort();
      animation?.cancel();
      cursorAnimation?.cancel();
      anchorAnimation?.cancel();
      animation = undefined;
      cursorAnimation = undefined;
      anchorAnimation = undefined;
      delete host.dataset.running;
      delete host.dataset.duplicateHandle;
      host.dataset.phase = "static";
      host.dataset.current = "0";
      underlay.hidden = true;
      show(0);
    };

    const start = () => {
      reset();
      if (motion.matches || !frame.animate) return;
      controller = new AbortController();
      const { signal } = controller;

      const play = async (frames: Keyframe[], duration: number, easing = "linear") => {
        signal.throwIfAborted();
        const previous = animation;
        const previousAnchor = anchorAnimation;
        animation = frame.animate(frames, {
          duration,
          easing,
          fill: "forwards",
        });
        previous?.cancel();
        // Keep the pointer and moving handle attached even when the photo's
        // opacity reaches zero at the upper-left corner.
        anchorAnimation = cursorAnchor.animate(
          frames.map(({ width, height, offset }) => ({ width, height, offset })),
          { duration, easing, fill: "forwards" },
        );
        previousAnchor?.cancel();
        syncPlayback();
        await Promise.all([animation.finished, anchorAnimation.finished]);
        signal.throwIfAborted();
      };

      const fly = async (from: string, to: string) => {
        signal.throwIfAborted();
        const previous = cursorAnimation;
        cursorAnimation = cursor.animate(
          [{ transform: from }, { transform: to }],
          { duration: 600, easing: "cubic-bezier(0.4, 0, 0.2, 1)", fill: "forwards" },
        );
        previous?.cancel();
        syncPlayback();
        await cursorAnimation.finished;
        signal.throwIfAborted();
      };

      const cycle = async () => {
        if (!(await ready(0)) || signal.aborted) return;
        host.dataset.running = "true";
        let index = 0;
        let expanded = true;
        host.dataset.phase = "expand";
        await play(
          [
            { width: "0%", height: "0%", opacity: 0 },
            { width: "2%", height: "2%", opacity: 1, offset: 0.02 },
            { width: "100%", height: "100%", opacity: 1 },
          ],
          1400,
          "cubic-bezier(0.3, 0, 0.7, 1)",
        );

        while (!signal.aborted) {
          const nextIndex = (index + 1) % slides.length;
          const nextReady = ready(nextIndex, true);

          host.dataset.phase = "hold";
          // A WAAPI hold keeps its remaining time when the tab or hero is hidden.
          const hold = play(
            [
              { width: expanded ? "100%" : "0%", height: expanded ? "100%" : "0%", opacity: expanded ? 1 : 0 },
              { width: expanded ? "100%" : "0%", height: expanded ? "100%" : "0%", opacity: expanded ? 1 : 0 },
            ],
            2400,
          );
          const restingPoint = expanded ? "translate(-24px, -24px)" : "translate(24px, 24px)";
          await Promise.all([hold, fly("translate(0, 0)", restingPoint)]);
          const loaded = await nextReady;
          signal.throwIfAborted();
          if (!loaded) {
            // Keep the current photo visible on a loading failure.
            animation?.cancel();
            anchorAnimation?.cancel();
            cursorAnimation?.cancel();
            underlay.hidden = true;
            show(index);
            delete host.dataset.running;
            host.dataset.phase = "static";
            return;
          }

          await fly(restingPoint, "translate(0, 0)");
          if (expanded) {
            show(nextIndex, underlayImages);
            underlay.hidden = false;
            host.dataset.duplicateHandle = "true";
            host.dataset.phase = "collapse";
            await play([
              { width: "100%", height: "100%", opacity: 1 },
              { width: "2%", height: "2%", opacity: 1, offset: 0.98 },
              { width: "0%", height: "0%", opacity: 0 },
            ], 1200, "cubic-bezier(0.3, 0, 0.7, 1)");
          } else {
            // Grow the next photo over the full-size photo left by the collapse.
            show(nextIndex);
            host.dataset.phase = "expand";
            await play([
              { width: "0%", height: "0%", opacity: 0 },
              { width: "2%", height: "2%", opacity: 1, offset: 0.02 },
              { width: "100%", height: "100%", opacity: 1 },
            ], 1400, "cubic-bezier(0.3, 0, 0.7, 1)");
          }
          expanded = !expanded;
          index = nextIndex;
          show(index);
          host.dataset.current = String(index);
        }
      };

      void cycle().catch(() => {
        if (!signal.aborted) reset();
      });
    };

    motion.addEventListener("change", start);
    start();
    return () => {
      reset();
      resize.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      motion.removeEventListener("change", start);
    };
  }, []);

  return (
    <div ref={hostRef} className={`${s.visual} ${className ?? ""}`}>
      <div
        ref={underlayRef}
        className={`${s.visual__frame} ${s["visual__frame--underlay"]}`}
        data-layer="background"
        hidden
        aria-hidden="true"
      >
        <div className={s.visual__viewport}>
          <div className={s.visual__canvas}>
            {slides.map((slide, index) => (
              <Image
                key={slide.src}
                ref={(image) => { underlayImageRefs.current[index] = image; }}
                src={slide.src}
                alt=""
                fill
                hidden={index !== 0}
                sizes="(max-width: 767px) 100vw, 50vw"
                loading="eager"
              />
            ))}
          </div>
        </div>
      </div>
      <div ref={frameRef} className={s.visual__frame} data-layer="foreground">
        <div className={s.visual__viewport}>
          <div className={s.visual__canvas}>
            {slides.map((slide, index) => (
              <Image
                key={slide.src}
                ref={(image) => {
                  imageRefs.current[index] = image;
                }}
                src={slide.src}
                alt={slide.alt}
                fill
                hidden={index !== 0}
                sizes="(max-width: 767px) 100vw, 50vw"
                priority={index === 0}
                loading={index === 0 ? undefined : "eager"}
              />
            ))}
          </div>
        </div>
      </div>
      <span className={s.visual__handle} aria-hidden="true" />
      <div ref={cursorAnchorRef} className={s.visual__anchor} aria-hidden="true">
        <svg
          ref={cursorRef}
          className={s.visual__cursor}
          viewBox="0 0 32 32"
          aria-hidden="true"
        >
          <path d="M4 3v24l6.5-6.5L16 30l5-3-5.5-9.5H25Z" />
        </svg>
      </div>
    </div>
  );
}
