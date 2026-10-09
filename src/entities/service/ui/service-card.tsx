import { Icon } from "@/shared/ui";
import type { Service } from "../model/types";
import s from "./service-card.module.css";
export function ServiceCard({
  service,
  index = 0,
  hover = false,
  href,
  onClick,
}: {
  service: Service;
  index?: number;
  hover?: boolean;
  href: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`${s.card} ${hover ? s["card--hover"] : ""} ${service.category ? s["card--neutral"] : ""}`}
    >
      {service.category && (
        <div className={s.card__category}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          {service.category}
        </div>
      )}
      <h3 className={s.card__title}>{service.title}</h3>
      <p className={s.card__description}>{service.description}</p>
      {service.detail && <p className={s.card__detail}>{service.detail}</p>}
      {service.priceFrom && <p className={s.card__detail}>от {service.priceFrom.toLocaleString('ru-RU')} ₽ {service.priceUnit} · {service.duration}</p>}
      {!service.category && <Icon name={service.id === "web" ? "web" : service.id === "mobile" ? "mobile" : "code"} className={s.card__art} />}
      <span className={s.card__link}>
        Обсудить услугу
        <Icon />
      </span>
    </a>
  );
}
