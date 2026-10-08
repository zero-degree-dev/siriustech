"use client";
import { useRef, useState } from "react";
import { Brand, Icon, LinkButton } from "@/shared/ui";
import s from "./site-header.module.css";
import { useActiveSection } from "./use-active-section";
import { useNavigationIndicator } from "./use-navigation-indicator";
const links = [
  ["#top", "Главная"],
  ["#services", "Услуги"],
  ["#portfolio", "Портфолио"],
  ["#technologies", "Технологии"],
  ["#workflow", "Методология"],
  ["#contacts", "Контакты"],
];
const sectionHrefs = links.map(([href]) => href);
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const { header, activeHref, selectSection } = useActiveSection(sectionHrefs);
  const { navigation, indicator } = useNavigationIndicator(activeHref, open);
  return (
    <header
      ref={header}
      className={s.header}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          setOpen(false);
          toggle.current?.focus();
        }
      }}
    >
      <a
        href="#top"
        aria-label="СириусТех — главная"
        className={s.header__brand}
        onClick={() => {
          selectSection("#top");
          setOpen(false);
        }}
      >
        <Brand />
      </a>
      <button
        ref={toggle}
        className={s.header__toggle}
        type="button"
        aria-expanded={open}
        aria-controls="main-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? "Закрыть" : "Меню"}
        <span aria-hidden="true">{open ? "×" : "☰"}</span>
      </button>
      <nav
        ref={navigation}
        id="main-navigation"
        className={`${s.header__nav} ${open ? s["header__nav--open"] : ""}`}
        aria-label="Основная навигация"
      >
        <span ref={indicator} className={s.header__indicator} aria-hidden="true" />
        {links.map(([href, label]) => (
          <a
            key={href}
            href={href}
            onClick={() => {
              selectSection(href);
              setOpen(false);
            }}
            className={activeHref === href ? s.header__active : undefined}
            aria-current={activeHref === href ? "location" : undefined}
          >
            {label}
          </a>
        ))}
      </nav>
      <LinkButton
        className={s.header__cta}
        href="#request"
        onClick={() => setOpen(false)}
      >
        Заказать звонок <Icon />
      </LinkButton>
    </header>
  );
}
