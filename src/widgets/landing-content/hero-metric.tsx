"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import s from "./hero-metric.module.css";

const phrases = ["20+ лет", "16 специалистов", "35+ кейсов"];
const motionQuery = "(prefers-reduced-motion: reduce)";

function subscribeMotion(callback: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getReducedMotion() {
  return window.matchMedia(motionQuery).matches;
}

export function HeroMetric() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState(phrases[0]);
  const reducedMotion = useSyncExternalStore(subscribeMotion, getReducedMotion, () => false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || reducedMotion) return;

    let index = 0;
    let count = 0;
    let phase: "typing" | "hold" | "erasing" | "gap" = "typing";
    let timer: number | undefined;
    let pending: (() => void) | undefined;
    let remaining = 0;
    let deadline = 0;
    const bounds = host.getBoundingClientRect();
    let onScreen = bounds.bottom > 0 && bounds.top < window.innerHeight;

    const arm = () => {
      if (!pending || timer !== undefined || !onScreen || document.hidden) return;
      deadline = performance.now() + remaining;
      timer = window.setTimeout(() => {
        timer = undefined;
        const callback = pending;
        pending = undefined;
        callback?.();
      }, remaining);
    };
    const schedule = (callback: () => void, delay: number) => {
      pending = callback;
      remaining = delay;
      arm();
    };
    const advance = () => {
      if (phase === "hold") phase = "erasing";
      if (phase === "gap") phase = "typing";

      if (phase === "typing") {
        count += 1;
        setText(phrases[index].slice(0, count));
        if (count === phrases[index].length) {
          phase = "hold";
          schedule(advance, 2200);
        } else schedule(advance, 80);
      } else {
        count -= 1;
        setText(phrases[index].slice(0, count));
        if (count === 0) {
          index = (index + 1) % phrases.length;
          phase = "gap";
          schedule(advance, 250);
        } else schedule(advance, 45);
      }
    };

    const syncPlayback = () => {
      const paused = !onScreen || document.hidden;
      host.dataset.paused = String(paused);
      if (paused && timer !== undefined) {
        window.clearTimeout(timer);
        timer = undefined;
        remaining = Math.max(0, deadline - performance.now());
      } else if (!paused) arm();
    };
    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      syncPlayback();
    });
    intersection.observe(host);
    document.addEventListener("visibilitychange", syncPlayback);

    // The server renders the complete first phrase; typing starts after hydration.
    schedule(() => {
      setText("");
      schedule(advance, 80);
    }, 0);
    syncPlayback();

    return () => {
      window.clearTimeout(timer);
      pending = undefined;
      intersection.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      delete host.dataset.paused;
    };
  }, [reducedMotion]);

  const visibleText = reducedMotion ? phrases[0] : text;
  const separator = visibleText.indexOf(" ");
  const number = separator === -1 ? visibleText : visibleText.slice(0, separator);
  const word = separator === -1 ? "" : visibleText.slice(separator + 1);

  return (
    <div ref={hostRef} className={s.metric}>
      <span className={s.metric__description}>20+ лет, 16 специалистов, 35+ кейсов.</span>
      <div className={s.metric__line} aria-hidden="true">
        <span className={s.metric__number}>{number || "\u00a0"}</span>
        {separator !== -1 && <span className={s.metric__word}>{word}</span>}
        <span className={`${s.metric__caret} ${s[separator === -1 ? "metric__caret--number" : "metric__caret--word"]}`} />
      </div>
    </div>
  );
}
