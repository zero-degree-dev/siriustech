"use client";

import { useEffect, useRef, useState } from "react";

export function useActiveSection(hrefs: readonly string[]) {
  const header = useRef<HTMLElement>(null);
  const [activeHref, setActiveHref] = useState(hrefs[0]);
  const pending = useRef<{ href: string; until: number } | null>(null);
  const pendingTimer = useRef<number | null>(null);
  const refresh = useRef<(() => void) | null>(null);

  useEffect(() => {
    let frame = 0;
    let closedHeaderBottom = 0;
    const root = document.documentElement;
    const previousOffset = root.style.getPropertyValue("--header-scroll-offset");

    const update = () => {
      frame = 0;
      const headerBottom = header.current?.getBoundingClientRect().bottom ?? 0;
      const menuOpen = header.current?.querySelector('[aria-expanded="true"]');
      if (!menuOpen) closedHeaderBottom = headerBottom;
      // The open mobile menu must not change where an anchor lands after closing.
      const threshold = (closedHeaderBottom || headerBottom) + 24;
      root.style.setProperty("--header-scroll-offset", `${threshold}px`);
      let current = hrefs[0];
      for (const href of hrefs) {
        const section = document.getElementById(href.slice(1));
        if (section && section.getBoundingClientRect().top <= threshold + 1) {
          current = href;
        }
      }
      // A short footer may never reach the activation line.
      const maxScroll = root.scrollHeight - window.innerHeight;
      if (maxScroll > 0 && window.scrollY >= maxScroll - 2) {
        current = hrefs[hrefs.length - 1];
      }
      // Keep the destination selected while smooth scrolling past other sections.
      if (pending.current) {
        if (
          current !== pending.current.href &&
          performance.now() < pending.current.until
        ) return;
        pending.current = null;
      }
      setActiveHref(current);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    refresh.current = schedule;
    const interrupt = () => {
      pending.current = null;
      schedule();
    };
    const interruptWithKey = (event: KeyboardEvent) => {
      if (
        ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)
      ) interrupt();
    };
    const observer = new ResizeObserver(schedule);
    if (header.current) observer.observe(header.current);
    observer.observe(document.body);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("hashchange", schedule);
    window.addEventListener("wheel", interrupt, { passive: true });
    window.addEventListener("touchstart", interrupt, { passive: true });
    window.addEventListener("keydown", interruptWithKey);
    schedule();

    return () => {
      window.cancelAnimationFrame(frame);
      if (pendingTimer.current !== null) window.clearTimeout(pendingTimer.current);
      refresh.current = null;
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", schedule);
      window.removeEventListener("wheel", interrupt);
      window.removeEventListener("touchstart", interrupt);
      window.removeEventListener("keydown", interruptWithKey);
      if (previousOffset) root.style.setProperty("--header-scroll-offset", previousOffset);
      else root.style.removeProperty("--header-scroll-offset");
    };
  }, [hrefs]);

  const selectSection = (href: string) => {
    pending.current = { href, until: performance.now() + 2000 };
    setActiveHref(href);
    if (pendingTimer.current !== null) window.clearTimeout(pendingTimer.current);
    pendingTimer.current = window.setTimeout(() => {
      pending.current = null;
      refresh.current?.();
    }, 2000);
  };
  return { header, activeHref, selectSection };
}
