"use client";

import { useLayoutEffect, useRef } from "react";

export function useNavigationIndicator(activeHref: string, menuOpen: boolean) {
  const navigation = useRef<HTMLElement>(null);
  const indicator = useRef<HTMLSpanElement>(null);
  const positioned = useRef(false);

  useLayoutEffect(() => {
    const nav = navigation.current;
    const background = indicator.current;
    if (!nav || !background) return;
    let disposed = false;
    let frame = 0;

    const update = () => {
      if (disposed) return;
      const link = nav.querySelector<HTMLAnchorElement>(
        `a[href="${activeHref}"]`,
      );
      const bounds = nav.getBoundingClientRect();
      if (!link || !bounds.width || !bounds.height) {
        background.style.opacity = "0";
        background.dataset.animated = "false";
        positioned.current = false;
        window.cancelAnimationFrame(frame);
        return;
      }

      const target = link.getBoundingClientRect();
      background.style.width = `${target.width}px`;
      background.style.height = `${target.height}px`;
      background.style.transform = `translate3d(${target.left - bounds.left}px, ${target.top - bounds.top}px, 0)`;
      background.style.opacity = "1";

      if (!positioned.current) {
        // First render and reopening the mobile menu should not fly in from (0, 0).
        background.dataset.animated = "false";
        background.getBoundingClientRect();
        positioned.current = true;
      }
      if (background.dataset.animated !== "true") {
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(() => {
          background.dataset.animated = "true";
        });
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(nav);
    nav.querySelectorAll("a").forEach(link => observer.observe(link));
    // Font metrics can change even if the viewport stays the same size.
    void document.fonts?.ready.then(update);
    window.addEventListener("resize", update);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [activeHref, menuOpen]);

  return { navigation, indicator };
}
