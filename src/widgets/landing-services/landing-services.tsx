"use client";
import { useLayoutEffect, useRef, useState } from 'react';
import { ServiceCard, type Service } from '@/entities/service';
import { selectProjectService } from '@/features/request-project';
import { Container, Icon, StatusPanel } from '@/shared/ui';
import s from './landing-services.module.css';
import { serviceSummaries } from './service-summaries';
export function LandingServices({ services, loading, error, onRetry }: {
  services: Service[]; loading: boolean; error: boolean; onRetry: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const collapseTop = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (expanded || collapseTop.current === null || !toggle.current) return;
    // Keep the collapse control at the same screen position before the next paint.
    const delta = toggle.current.getBoundingClientRect().top - collapseTop.current;
    collapseTop.current = null;
    window.scrollBy({ top: delta, behavior: 'instant' });
  }, [expanded]);
  function toggleCatalog() {
    if (expanded && toggle.current) collapseTop.current = toggle.current.getBoundingClientRect().top;
    setExpanded(value => !value);
  }
  return <section id="services" className={s.services} aria-labelledby="services-title">
    <Container>
      <div className={s.services__heading}>
        <div><p className={s.services__eyebrow}>Каталог услуг</p><h2 id="services-title">Чем можем помочь</h2></div>
      </div>
      {loading && <StatusPanel kind="loading" title="Загружаем услуги">Получаем каталог…</StatusPanel>}
      {error && <StatusPanel kind="error" title="Каталог временно недоступен" actions={<button type="button" onClick={onRetry}>Повторить</button>}>Попробуйте загрузить услуги ещё раз.</StatusPanel>}
      {!loading && !error && !services.length && <p>Каталог пока пуст.</p>}
      <div id="services-list" className={s.services__grid}>
        {services.slice(0, expanded ? services.length : 3).map((service, index) =>
          <ServiceCard key={service.id} service={{ ...service, description: serviceSummaries[service.id] ?? service.description }} compact index={index} href="#consultation" onClick={() => selectProjectService(service.id)} />)}
      </div>
      {services.length > 3 && <div className={s.services__more}><button ref={toggle} type="button" aria-expanded={expanded} aria-controls="services-list" onClick={toggleCatalog}>
        {expanded ? 'Свернуть каталог' : 'Все услуги каталога'}<Icon />
      </button></div>}
      <p className={s.services__note}>Цены и сроки — пример. Оценим ваш проект отдельно.</p>
    </Container>
  </section>;
}
