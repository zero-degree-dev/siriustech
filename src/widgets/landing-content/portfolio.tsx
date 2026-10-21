"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CaseMetrics, type PortfolioCase } from "@/entities/case";
import { Container, Icon } from "@/shared/ui";
import { portfolioCases } from "./portfolio-content";
import { ResizeVisual } from "./resize-visual";
import type { ResizePlayer } from "./resize-player";
import s from "./portfolio.module.css";
import layout from "./landing-content.module.css";

const slides = portfolioCases.map((item) => item.image);
const characterDuration = 25;
const holdDuration = 4000;
const motionQuery = "(prefers-reduced-motion: reduce)";
function subscribeMotion(callback: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}
function reducedMotionSnapshot() { return window.matchMedia(motionQuery).matches; }
export function caseTextLength(item: PortfolioCase) {
  return Math.max(item.title.length, item.description.length, ...item.metrics.flatMap((metric) => [metric.value.length, metric.label.length]));
}

function TypedText({ text, count }: { text: string; count: number }) {
  let caret = Math.min(text.length, Math.max(0, count)) - 1;
  while (caret >= 0 && /\s/.test(text[caret])) caret -= 1;
  const isCurrentField = count < text.length;
  return <>
    <span className={s.portfolio__accessible}>{text}</span>
    <span aria-hidden="true" className={s.portfolio__typed}>
      {Array.from(text, (letter, index) => <span key={index} data-visible={index < count} className={[
        s.portfolio__letter,
        isCurrentField && index === caret ? s["portfolio__letter--current"] : "",
      ].filter(Boolean).join(" ")}>{letter}</span>)}
    </span>
  </>;
}

function CaseBody({ item, count, ghost = false }: { item: PortfolioCase; count: number; ghost?: boolean }) {
  const render = (text: string) => ghost ? text : <TypedText text={text} count={count} />;
  return <>
    <h3 id={ghost ? undefined : "case-title"} className={s.portfolio__title}>{render(item.title)}</h3>
    <p className={s.portfolio__description}>{render(item.description)}</p>
    <div className={s.portfolio__metrics}>
      <CaseMetrics layout="rows" metrics={item.metrics} renderText={(text) => render(text)} />
    </div>
  </>;
}

type View = { index: number; count: number; phase: "idle" | "typing" | "transition" };

export function Portfolio() {
  const [view, setView] = useState<View>({ index: 0, count: caseTextLength(portfolioCases[0]), phase: "idle" });
  const [selected, setSelected] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeMotion, reducedMotionSnapshot, () => false);
  const playerRef = useRef<ResizePlayer | null>(null);
  const pendingRef = useRef<number | undefined>(undefined);
  const manualRef = useRef(false);
  const indexRef = useRef(0);
  const pauseRef = useRef(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const shouldPause = hovered || focused || detailsOpen;

  useEffect(() => {
    pauseRef.current = shouldPause;
    playerRef.current?.setPaused(shouldPause && !manualRef.current);
  }, [shouldPause]);

  const sequence = useCallback(async (player: ResizePlayer) => {
    playerRef.current = player;
    player.selectStatic(indexRef.current);
    player.setPaused(pauseRef.current && !manualRef.current);
    const total = () => caseTextLength(portfolioCases[player.current]);
    const type = async () => {
      const length = total();
      indexRef.current = player.current;
      setView({ index: player.current, count: 0, phase: "typing" });
      await player.wait(length * characterDuration, (elapsed) => {
        const count = Math.min(length, Math.floor(elapsed / characterDuration));
        setView((previous) => previous.count === count ? previous : { ...previous, count });
      });
      setView({ index: player.current, count: length, phase: "idle" });
      manualRef.current = pendingRef.current !== undefined;
      player.setPaused(pauseRef.current && !manualRef.current);
    };

    try {
      if (player.reducedMotion) {
        pendingRef.current = undefined;
        manualRef.current = false;
        setSelected(player.current);
        setView({ index: player.current, count: total(), phase: "idle" });
        return;
      }
      if (!(await player.start(type))) return;
      while (!player.signal.aborted) {
        if (pendingRef.current === undefined) await player.wait(holdDuration);
        const next = pendingRef.current ?? (player.current + 1) % portfolioCases.length;
        pendingRef.current = undefined;
        if (next === player.current) continue;
        setSelected(next);
        setView((previous) => ({ ...previous, phase: "transition" }));
        if (!(await player.replace(next, type))) {
          manualRef.current = false;
          setView({ index: player.current, count: total(), phase: "idle" });
          setSelected(player.current);
          pauseRef.current = true;
          player.setPaused(true);
          continue;
        }
        indexRef.current = player.current;
        setDetailsOpen(false);
      }
    } finally {
      if (player.signal.aborted && playerRef.current === player) playerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const strip = stripRef.current;
    const button = buttonsRef.current[selected];
    if (!strip || !button) return;
    const bounds = strip.getBoundingClientRect();
    const buttonBounds = button.getBoundingClientRect();
    if (buttonBounds.left < bounds.left || buttonBounds.right > bounds.right) {
      const delta = buttonBounds.left < bounds.left ? buttonBounds.left - bounds.left - 8 : buttonBounds.right - bounds.right + 8;
      strip.scrollTo({ left: strip.scrollLeft + delta, behavior: reducedMotion ? "auto" : "smooth" });
    }
  }, [selected, reducedMotion]);

  const select = async (index: number) => {
    const player = playerRef.current;
    if (!player || player.signal.aborted) return;
    if (index === selected) return;
    setSelected(index);
    setDetailsOpen(false);
    if (player.reducedMotion) {
      pendingRef.current = index;
      if (await player.transition(index)) {
        if (pendingRef.current !== index || player.signal.aborted) return;
        pendingRef.current = undefined;
        indexRef.current = index;
        setView({ index, count: caseTextLength(portfolioCases[index]), phase: "idle" });
      }
      return;
    }
    manualRef.current = true;
    pendingRef.current = index;
    player.setPaused(false);
    player.skipWait();
  };

  const item = portfolioCases[view.index];
  return (
    <section id="portfolio" className={layout.portfolio} aria-labelledby="portfolio-title" data-case={item.id} data-text-phase={view.phase}>
      <svg className={s.portfolio__filters} width="0" height="0" aria-hidden="true">
        <defs><filter id="portfolio-logo-blue" colorInterpolationFilters="sRGB">
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="table" tableValues="0.00784 0.00784 0.00784 0.00784 0.00784 0.00784 0.00784 0.00784 0.00784 0.00784 1" />
            <feFuncG type="table" tableValues="0.51765 0.51765 0.51765 0.51765 0.51765 0.51765 0.51765 0.51765 0.51765 0.51765 1" />
            <feFuncB type="table" tableValues="0.78039 0.78039 0.78039 0.78039 0.78039 0.78039 0.78039 0.78039 0.78039 0.78039 1" />
          </feComponentTransfer>
        </filter></defs>
      </svg>
      <Container>
        <div className={layout.portfolio__heading}>
          <h2 id="portfolio-title">Портфолио реализованных систем</h2>
          <a href="#case">Все кейсы в портфолио<Icon /></a>
        </div>
        <p className={s.portfolio__note}>Демонстрационные кейсы. Описания и показатели — макетные.</p>
      </Container>
      <div className={s.portfolio__navigation}>
        <div ref={stripRef} className={s.portfolio__logos} role="group" aria-label="Выбрать кейс">
          {portfolioCases.map((project, index) => <button
            key={project.id} ref={(button) => { buttonsRef.current[index] = button; }}
            type="button" className={s.portfolio__logo} aria-label={`Кейс ${project.brand}`}
            aria-pressed={index === selected} aria-controls="case"
            onClick={() => { void select(index); }}
          ><Image src={project.logo} width={208} height={60} alt="" /></button>)}
        </div>
      </div>
      <Container>
        <article id="case" className={layout.portfolio__case} aria-labelledby="case-title"
          onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
          onFocusCapture={() => setFocused(true)}
          onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}>
          <ResizeVisual slides={slides} sizes="(max-width: 767px) 90vw, (max-width: 1199px) 40vw, 405px" className={layout.portfolio__image} sequence={sequence} visibilityTarget="#portfolio" />
          <div className={s.portfolio__copy} data-paused={shouldPause}>
            <div className={s.portfolio__body} data-transitioning={view.phase === "transition"}>
              <div className={s.portfolio__live}><CaseBody item={item} count={view.count} /></div>
              {portfolioCases.map((project) => <div key={project.id} className={s.portfolio__ghost} aria-hidden="true"><CaseBody item={project} count={caseTextLength(project)} ghost /></div>)}
            </div>
            <details className={layout.portfolio__details} open={detailsOpen} onToggle={(event) => setDetailsOpen(event.currentTarget.open)}>
              <summary>Подробнее<Icon /></summary>
              <p>{item.details}</p>
              <a href="#request">Обсудить похожую задачу</a>
            </details>
          </div>
        </article>
      </Container>
    </section>
  );
}
