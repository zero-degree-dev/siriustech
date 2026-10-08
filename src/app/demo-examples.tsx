"use client";
import { useEffect, useState } from "react";
import { DemoProvider } from "./providers/demo-provider";
import { RequestForm } from "@/features/request-project";
import { AiChat } from "@/features/ai-chat";
import { type Service, type ServiceRepository } from "@/entities/service";
import { Button, Select, StatusPanel } from "@/shared/ui";
import s from "./demo-examples.module.css";
function Examples({
  repository,
  children,
}: {
  repository: ServiceRepository;
  children: (services: Service[]) => React.ReactNode;
}) {
  const [services, setServices] = useState<Service[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "ready">(
    "loading",
  );
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    repository
      .list(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setServices(result);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus("error");
      });
    return () => controller.abort();
  }, [repository, attempt]);
  return (
    <>
      {status === "loading" && (
        <StatusPanel kind="loading" title="Загрузка услуг">
          Подготавливаем демонстрационную форму…
        </StatusPanel>
      )}
      {status === "error" && (
        <StatusPanel
          kind="error"
          title="Услуги недоступны"
          actions={
            <Button
              onClick={() => {
                setStatus("loading");
                setAttempt((n) => n + 1);
              }}
            >
              Повторить загрузку
            </Button>
          }
        >
          Попробуйте успешный сценарий и повторите загрузку.
        </StatusPanel>
      )}
      {status === "ready" && children(services)}
    </>
  );
}
export function DemoExamples() {
  return (
    <DemoProvider>
      {(demo) => (
        <div className={s.demo}>
          <div className={s.demo__toolbar}>
            <p>
              Данные остаются в этой вкладке. Переключите сценарий, чтобы
              проверить обработку ошибок.
            </p>
            <Select
              label="Сценарий ответа"
              value={demo.scenario}
              onChange={(e) =>
                demo.setScenario(e.target.value as "success" | "error")
              }
            >
              <option value="success">Успешный ответ</option>
              <option value="error">Ошибка сервера</option>
            </Select>
          </div>
          <AiChat repository={demo.chat} />
          <div id="request" className={s.demo__request}>
            <div>
              <h3>Обсудим ваш проект</h3>
              <p>
                Форма заявки из макета. Имя, телефон, e-mail, услуга и согласие
                обязательны. Компания — по желанию.
              </p>
              <p>В деморежиме заявка не отправляется.</p>
            </div>
            <Examples repository={demo.services}>
              {(services) => (
                <RequestForm services={services} repository={demo.request} />
              )}
            </Examples>
          </div>
        </div>
      )}
    </DemoProvider>
  );
}
