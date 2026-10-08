import { ApiError, mockDelay, type DemoScenario } from "@/shared/api";
import type { Service, ServiceRepository } from "../model/types";
export const services: Service[] = [
  {
    id: "software",
    title: "Заказная разработка ПО",
    description:
      "Проектирование и создание уникальных ERP, CRM и автоматизированных систем управления предприятием под специфику бизнес-процессов на стеке Java, .NET и Python.",
  },
  {
    id: "web",
    title: "Сайты и корпоративные порталы",
    description:
      "Масштабируемые B2B-кабинеты, защищённые интранет-порталы холдингов и платформы электронной коммерции с отказоустойчивой микросервисной архитектурой.",
  },
  {
    id: "mobile",
    title: "Мобильные приложения",
    description:
      "Нативная и кроссплатформенная разработка для iOS и Android. Глубокая интеграция с аппаратными датчиками, платёжными шлюзами и корпоративными бэкендами.",
  },
  {
    id: "integration",
    title: "Интеграция с 1С:Предприятие 8",
    category: "Системная интеграция",
    description:
      "Двусторонний бесшовный обмен данными между учётными базами 1С и внешними веб-сервисами, шинами данных (ESB) и мобильными клиентами в реальном времени.",
    detail: "1С:Предприятие • SOAP / REST",
  },
  {
    id: "support",
    title: "Техническая поддержка SLA 24/7",
    category: "Надёжность и мониторинг",
    description:
      "Круглосуточный проактивный мониторинг инцидентов, регламентное резервное копирование, оперативные обновления безопасности и фиксированное время реакции от 15 минут.",
    detail: "SLA 99.98% • Поддержка 24/7",
  },
  {
    id: "teams",
    title: "Выделенные инженерные команды",
    category: "Инженеры Prime / Top",
    description:
      "Формирование сработанных команд под управлением опытного тимлида «СириусТех». Быстрое погружение в технологический стек клиента по модели Staff Augmentation.",
    detail: "Dedicated Teams • Staffing",
  },
];
export function createServiceMock(
  scenario: DemoScenario = "success",
): ServiceRepository {
  return {
    async list(signal) {
      await mockDelay(signal);
      if (scenario === "error")
        throw new ApiError("Не удалось загрузить услуги", "http", 503);
      return services.map((service) => ({ ...service }));
    },
  };
}
