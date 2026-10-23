"use client";

import { useState } from 'react';
import { Container, Icon } from '@/shared/ui';
import { portfolioCases } from './portfolio-content';
import s from './portfolio.module.css';
import layout from './landing-content.module.css';

const previews = [
  { heading: 'Управление заказами', label: 'Заказ', rows: ['Заказ #1048 · самовывоз', 'Заказ #1049 · доставка', 'Заказ #1050 · самовывоз', 'Заказ #1051 · доставка'], states: ['Готов к выдаче', 'В пути', 'Собирается', 'Новый'] },
  { heading: 'Рабочее пространство склада', label: 'Задание', rows: ['Приёмка · зона А', 'Комплектация · зона Б', 'Упаковка · линия 02', 'Отгрузка · ворота 03'], states: ['Завершено', 'В работе', 'В работе', 'Ожидает'] },
  { heading: 'Планирование доставок', label: 'Маршрут', rows: ['Северный район · 12 адресов', 'Центр · 8 адресов', 'Южный район · 10 адресов', 'Западный район · 6 адресов'], states: ['Завершён', 'В пути', 'В пути', 'Назначен'] },
  { heading: 'Планирование запасов', label: 'Категория', rows: ['Молочная продукция', 'Бакалея', 'Овощи и фрукты', 'Бытовая химия'], states: ['В наличии', 'Пополнение', 'Пополнение', 'В наличии'] },
  { heading: 'Мониторинг инфраструктуры', label: 'Сервис', rows: ['Сервер приложений', 'База данных', 'Сетевой шлюз', 'Резервное копирование'], states: ['Доступен', 'Доступна', 'Доступен', 'Выполнено'] },
];

export function Portfolio() {
  const [selected, setSelected] = useState(0);
  const item = portfolioCases[selected];
  const preview = previews[selected];
  return <section id="portfolio" className={layout.portfolio} aria-labelledby="portfolio-title" data-case={item.id}>
    <Container>
      <p className={layout.eyebrow}>Решения для бизнеса</p>
      <div className={layout.portfolio__heading}><h2 id="portfolio-title">Примеры проектов</h2><p className={s.note}>Демонстрационные кейсы и показатели</p></div>
      <div className={s.navigation} role="group" aria-label="Выбрать кейс">
        {portfolioCases.map((project, index) => <button key={project.id} type="button" aria-label={`Кейс ${project.brand}`} aria-pressed={selected === index} aria-controls="case" onClick={() => setSelected(index)}>{project.brand}</button>)}
      </div>
      <article id="case" className={layout.portfolio__case} aria-labelledby="case-title">
        <figure className={s.preview} aria-label={`Пример интерфейса: ${preview.heading}`}>
          <div aria-hidden="true">
            <div className={s.preview__top}><span><Icon name="web" />{preview.heading}</span><span>Обзор</span></div>
            <div className={s.preview__summary}><div><span>Рабочее пространство</span><strong>{item.brand}</strong></div><span className={s.preview__badge}>Демо</span></div>
            <div className={s.preview__table}><div className={s.preview__labels}><span>{preview.label}</span><span>Статус</span></div>{preview.rows.map((row, i) => <div className={s.preview__row} key={row}><span>{row}</span><span data-tone={i === 0 ? 'green' : i === 3 ? 'gray' : 'blue'}>{preview.states[i]}</span></div>)}</div>
            <div className={s.preview__timeline}><span>Все процессы — в одном окне</span><div><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></div>
          </div>
          <figcaption>Концепция интерфейса · пример реализации</figcaption>
        </figure>
        <div className={s.copy} key={item.id}>
          <h3 id="case-title">{item.title}</h3>
          <p className={s.description}>{item.description}</p>
          <dl className={s.metrics}>{item.metrics.map(metric => <div key={metric.label}><dt>{metric.label}</dt><dd>{metric.value}</dd></div>)}</dl>
          <p className={s.details}>{item.details}</p>
          <a href="#request" className={s.link}>Обсудить похожую задачу<Icon /></a>
        </div>
      </article>
    </Container>
  </section>;
}
