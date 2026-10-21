"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button, Checkbox, Input, Select, StatusPanel } from "@/shared/ui";
import type { Service } from "@/entities/service";
import type {
  ProjectRequest,
  RequestErrors,
  RequestRepository,
} from "../model/types";
import { validateRequest } from "../model/validation";
import s from "./request-form.module.css";
import { SERVICE_SELECTION_EVENT } from "../model/selection";
const empty: ProjectRequest = {
  name: "",
  company: "",
  phone: "",
  email: "",
  serviceId: "",
  consent: false,
};
export function RequestForm({
  repository,
  services,
  compact = false,
  live = false,
}: {
  repository: RequestRepository;
  services: Service[];
  compact?: boolean;
  live?: boolean;
}) {
  const [data, setData] = useState(empty);
  const [errors, setErrors] = useState<RequestErrors>({});
  const [status, setStatus] = useState<
    "idle" | "loading" | "error" | "success"
  >("idle");
  const controller = useRef<AbortController | null>(null);
  const busy = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    const select = (event: Event) => {
      const serviceId = (event as CustomEvent<string>).detail;
      if (busy.current || !services.some(service => service.id === serviceId)) return;
      setData(current => ({ ...current, serviceId }));
      setErrors(current => ({ ...current, serviceId: undefined }));
      setStatus('idle');
    };
    window.addEventListener(SERVICE_SELECTION_EVENT, select);
    return () => window.removeEventListener(SERVICE_SELECTION_EVENT, select);
  }, [services]);
  function update<K extends keyof ProjectRequest>(
    key: K,
    value: ProjectRequest[K],
  ) {
    setData((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    if (status === "success" || status === "error") setStatus("idle");
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    const nextErrors = validateRequest(
      data,
      services.map((service) => service.id),
    );
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      const field = Object.keys(nextErrors)[0];
      formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
      return;
    }
    busy.current = true;
    setStatus("loading");
    controller.current = new AbortController();
    const active = controller.current;
    try {
      await repository.submit(
        {
          ...data,
          name: data.name.trim(),
          company: data.company.trim(),
          email: data.email.trim(),
        },
        active.signal,
      );
      if (!active.signal.aborted) setStatus("success");
    } catch {
      if (!active.signal.aborted) setStatus("error");
    } finally {
      busy.current = false;
    }
  }
  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      aria-label="Заявка на проект"
      className={`${s.form} ${compact ? s["form--compact"] : ""}`}
    >
      <fieldset disabled={status === "loading"} className={s.form__fields}>
        <legend className={s.form__legend}>{live ? 'Заявка на проект' : 'Демонстрационная заявка'}</legend>
        <div className={s.form__grid}>
          <Input
            label="Имя и фамилия"
            name="name"
            autoComplete="name"
            required
            value={data.name}
            onChange={(e) => update("name", e.target.value)}
            error={errors.name}
          />
          <Input
            label="Компания / организация"
            name="company"
            autoComplete="organization"
            value={data.company}
            onChange={(e) => update("company", e.target.value)}
          />
          <Input
            label="Телефон"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            placeholder="+7 (___) ___-__-__"
            value={data.phone}
            onChange={(e) => update("phone", e.target.value)}
            error={errors.phone}
          />
          <Input
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            error={errors.email}
          />
        </div>
        <Select
          label="Услуга"
          name="serviceId"
          required
          value={data.serviceId}
          onChange={(e) => update("serviceId", e.target.value)}
          error={errors.serviceId}
        >
          <option value="">Выберите услугу</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.title}
            </option>
          ))}
        </Select>
        <div className={s.form__footer}>
          <Checkbox
            name="consent"
            required
            checked={data.consent}
            onChange={(e) => update("consent", e.target.checked)}
            error={errors.consent}
          >
            Даю согласие на обработку своих персональных данных
          </Checkbox>
          <Button type="submit" loading={status === "loading"}>
            {status === "loading" ? "Отправляем…" : "Отправить"}
          </Button>
        </div>
      </fieldset>
      {status === "error" && (
        <StatusPanel kind="error" title="Заявка не отправлена">
          Не удалось отправить заявку. Данные сохранены в форме — попробуйте ещё
          раз.
        </StatusPanel>
      )}
      {status === "success" && (
        <StatusPanel kind="success" title={live ? 'Заявка сохранена' : 'Демонстрация завершена'}>
          {live ? 'Спасибо! Ваша заявка на обсуждение проекта сохранена.' : 'Форма заполнена верно. Данные никуда не отправлены.'}
        </StatusPanel>
      )}
    </form>
  );
}
