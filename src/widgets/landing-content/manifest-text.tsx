"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import s from "./manifest-text.module.css";

const message = "Надёжный софт — как точный инженерный расчёт:\n ни единой лишней строки, безупречная работа\n десятилетиями.";
const emphasis = "безупречная работа";
const accentStart = message.indexOf(emphasis);
const description = message.replaceAll("\n", "");
const motionQuery = "(prefers-reduced-motion: reduce)";

function subscribeMotion(callback: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getReducedMotion() {
  return window.matchMedia(motionQuery).matches;
}

export function ManifestText() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(message.length);
  const reducedMotion = useSyncExternalStore(subscribeMotion, getReducedMotion, () => false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || reducedMotion) return;

    let progress = 0;
    let initialized = false;
    let completed = false;
    let timer: number | undefined;
    let remaining = 35;
    let deadline = 0;
    const bounds = host.getBoundingClientRect();
    let onScreen = bounds.bottom > 0 && bounds.top < window.innerHeight;

    const schedule = () => {
      if (!initialized || completed || timer !== undefined || !onScreen || document.hidden) return;
      deadline = performance.now() + remaining;
      timer = window.setTimeout(() => {
        timer = undefined;
        progress += 1;
        setCount(progress);
        if (progress === message.length) {
          completed = true;
        } else {
          remaining = 35;
          schedule();
        }
      }, remaining);
    };
    const syncPlayback = () => {
      const paused = !onScreen || document.hidden;
      host.dataset.paused = String(paused);
      if (paused && timer !== undefined) {
        window.clearTimeout(timer);
        timer = undefined;
        remaining = Math.max(0, deadline - performance.now());
      } else if (!paused) schedule();
    };

    const intersection = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      syncPlayback();
    });
    intersection.observe(host);
    document.addEventListener("visibilitychange", syncPlayback);

    // Preserve the complete quote on the server and with JavaScript disabled.
    const initialization = window.setTimeout(() => {
      setCount(0);
      initialized = true;
      syncPlayback();
    }, 0);

    return () => {
      window.clearTimeout(initialization);
      window.clearTimeout(timer);
      intersection.disconnect();
      document.removeEventListener("visibilitychange", syncPlayback);
      delete host.dataset.paused;
    };
  }, [reducedMotion]);

  const visibleCount = reducedMotion ? message.length : count;
  let caretIndex = visibleCount - 1;
  while (caretIndex >= 0 && /\s/.test(message[caretIndex])) caretIndex -= 1;

  return (
    <div ref={hostRef} className={s["manifest-text"]}>
      <span className={s["manifest-text__description"]}>{description}</span>
      <p aria-hidden="true">
        {Array.from(message, (letter, index) => letter === "\n" ? <br key={index} /> : (
          <span
            key={index}
            data-visible={index < visibleCount}
            className={[
              s["manifest-text__letter"],
              index >= accentStart && index < accentStart + emphasis.length ? s["manifest-text__accent"] : "",
              visibleCount < message.length && index === caretIndex ? s["manifest-text__letter--current"] : "",
            ].filter(Boolean).join(" ")}
          >{letter}</span>
        ))}
      </p>
    </div>
  );
}
