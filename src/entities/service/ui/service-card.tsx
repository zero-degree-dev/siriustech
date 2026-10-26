import { Icon } from "@/shared/ui";
import type { Service } from "../model/types";
import s from "./service-card.module.css";
export function ServiceCard({
  service,
  index = 0,
  hover = false,
  compact = false,
  href,
  onClick,
}: {
  service: Service;
  index?: number;
  hover?: boolean;
  compact?: boolean;
  href: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className={`${s.card} ${compact ? s["card--compact"] : ""} ${hover ? s["card--hover"] : ""} ${service.category ? s["card--neutral"] : ""}`}
    >
      <span className={s.card__icon}><Icon name={service.id === "web" ? "web" : service.id === "mobile" ? "mobile" : "code"} /></span>
      {!compact && service.category && (
        <div className={s.card__category}>
          <span className={s.card__index}>{String(index + 1).padStart(2, "0")}</span>
          {service.category}
        </div>
      )}
      <h3 className={s.card__title}>{service.title}</h3>
      <p className={s.card__description}>{service.description}</p>
      {!compact && service.detail && <p className={s.card__detail}>{service.detail}</p>}
      {service.priceFrom && <p className={s.card__price}>{!compact && <span>Ориентировочно</span>}от {service.priceFrom.toLocaleString('ru-RU')} ₽ {service.priceUnit}<small>{service.duration}</small></p>}
      <span className={s.card__link}>
        Обсудить услугу
        <Icon />
      </span>
    </a>
  );
}
