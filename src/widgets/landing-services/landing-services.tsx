"use client";
import { useState } from 'react';
import { ServiceCard, type Service } from '@/entities/service';
import { selectProjectService } from '@/features/request-project';
import { Container, Icon, StatusPanel } from '@/shared/ui';
import s from './landing-services.module.css';
export function LandingServices({ services, loading, error, onRetry }: {
  services: Service[]; loading: boolean; error: boolean; onRetry: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return <section id="services" className={s.services} aria-labelledby="services-title">
    <Container>
      <div className={s.services__heading}>
        <div><p className={s.services__eyebrow}>Каталог услуг</p><h2 id="services-title">Чем можем помочь</h2></div>
        <p className={s.services__description}>От отдельного приложения до развития вашей ИТ-системы. Выберите направление, чтобы обсудить детали.</p>
      </div>
      {loading && <StatusPanel kind="loading" title="Загружаем услуги">Получаем каталог…</StatusPanel>}
      {error && <StatusPanel kind="error" title="Каталог временно недоступен" actions={<button type="button" onClick={onRetry}>Повторить</button>}>Попробуйте загрузить услуги ещё раз.</StatusPanel>}
      {!loading && !error && !services.length && <p>Каталог пока пуст.</p>}
      <div id="services-list" className={s.services__grid}>
        {services.slice(0, expanded ? services.length : 3).map((service, index) =>
          <ServiceCard key={service.id} service={service} index={index} href="#consultation" onClick={() => selectProjectService(service.id)} />)}
      </div>
      {services.length > 3 && <div className={s.services__more}><button type="button" aria-expanded={expanded} aria-controls="services-list" onClick={() => setExpanded(!expanded)}>
        {expanded ? 'Свернуть каталог' : 'Все услуги каталога'}<Icon />
      </button></div>}
      <p className={s.services__note}>Цены и сроки в учебном каталоге приведены для примера. Точная оценка зависит от задачи.</p>
    </Container>
  </section>;
}
