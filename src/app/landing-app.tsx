"use client";
import { useCallback, useEffect, useState } from 'react';
import { HomePage } from '@/pages/home';
import { LandingServices } from '@/widgets/landing-services';
import { serviceRepository, type Service } from '@/entities/service';
import { RequestForm, requestRepository, SERVICE_SELECTION_EVENT } from '@/features/request-project';
import { AiChat, createChatRepository } from '@/features/ai-chat';
import { Container, Select } from '@/shared/ui';
import s from './landing-app.module.css';

export function LandingApp() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [serviceId, setServiceId] = useState('');
  const [chat] = useState(createChatRepository);
  const select = useCallback((id: string) => { chat.selectService(id); setServiceId(id); }, [chat]);
  useEffect(() => {
    const controller = new AbortController();
    serviceRepository.list(controller.signal).then(data => {
      if (!controller.signal.aborted) { setServices(data); setLoading(false); }
    }).catch(() => {
      if (!controller.signal.aborted) { setError(true); setLoading(false); }
    });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    const listener = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (services.some(service => service.id === id)) select(id);
    };
    window.addEventListener(SERVICE_SELECTION_EVENT, listener);
    return () => window.removeEventListener(SERVICE_SELECTION_EVENT, listener);
  }, [services, select]);
  return <HomePage
    services={<LandingServices services={services} loading={loading} error={error} onRetry={() => { setLoading(true); setError(false); setAttempt(value => value + 1); }} />}
    chat={<section id="consultation" className={s.consultation} aria-label="Консультация по услугам"><Container><div className={s.consultation__panel}>
      <Select label="Тема консультации" value={serviceId} onChange={event => select(event.target.value)}>
        <option value="">Помогите выбрать услугу</option>
        {services.map(service => <option key={service.id} value={service.id}>{service.title}</option>)}
      </Select>
      <AiChat repository={chat} live />
    </div></Container></section>}
    form={<RequestForm services={services} repository={requestRepository} compact live />}
  />;
}
