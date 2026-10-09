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
        <h2 id="services-title">Инженерные услуги высшей категории</h2>
        <button type="button" aria-expanded={expanded} aria-controls="services-list" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Свернуть каталог' : 'Все услуги каталога'}<Icon />
        </button>
      </div>
      <p>Демонстрационный каталог. Стоимость и сроки уточняются после обсуждения задачи.</p>
      {loading && <StatusPanel kind="loading" title="Загружаем услуги">Получаем каталог…</StatusPanel>}
      {error && <StatusPanel kind="error" title="Каталог временно недоступен" actions={<button type="button" onClick={onRetry}>Повторить</button>}>Попробуйте загрузить услуги ещё раз.</StatusPanel>}
      {!loading && !error && !services.length && <p>Каталог пока пуст.</p>}
      <div id="services-list" className={s.services__grid}>
        {services.slice(0, expanded ? services.length : 3).map((service, index) =>
          <ServiceCard key={service.id} service={service} index={index} href="#consultation" onClick={() => selectProjectService(service.id)} />)}
      </div>
    </Container>
  </section>;
}
