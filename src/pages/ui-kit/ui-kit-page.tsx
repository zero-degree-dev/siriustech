import Link from "next/link";
import type { ReactNode } from "react";
import {
  Brand,
  Button,
  Checkbox,
  Container,
  Icon,
  Input,
  LinkButton,
  Select,
  Spinner,
  StatusPanel,
  Textarea,
  Typography,
} from "@/shared/ui";
import { ServiceCard, services } from "@/entities/service";
import { CaseMetrics } from "@/entities/case";
import { WorkflowStep } from "@/widgets/workflow-step";
import s from "./ui-kit-page.module.css";
const colors = [
  ["Surface / Base", "#FFFFFF", "surface-base"],
  ["Surface / Tinted", "#F0F7FF", "surface-tinted"],
  ["Surface / Dark", "#071324", "surface-dark"],
  ["Text / Primary", "#0F172A", "text-primary"],
  ["Action / Primary", "#0369A1", "action-primary"],
  ["Accent / Blue", "#0284C7", "accent-blue"],
  ["Text / Secondary", "#334E68", "text-secondary"],
  ["Text / Muted", "#475569", "text-muted"],
  ["Text / On dark", "#B8CDDF", "text-on-dark"],
  ["Border / Subtle", "#B9D8EB", "border-subtle"],
  ["Accent / Cyan", "#06B6D4", "accent-cyan"],
  ["Accent / Bright", "#38BDF8", "accent-bright"],
];
const types = [
  ["display", "Display · Roboto Bold", "54 / 60", "Инженерная точность"],
  ["heading", "Heading · Roboto Bold", "48 / 56", "Услуги и решения"],
  ["subheading", "Subheading · Roboto Medium", "32 / 38", "Обсудим ваш проект"],
  ["title", "Card title · Roboto Bold", "20 / 28", "Заказная разработка ПО"],
  [
    "body",
    "Body · Roboto Regular",
    "18 / 25",
    "Разбираемся в задаче и проектируем решение.",
  ],
  ["label", "Label · Roboto Medium", "14 / 20", "Имя и фамилия"],
  [
    "data",
    "Data · JetBrains Mono",
    "12 / 16",
    "2004 — Основание бюро «СириусТех»",
  ],
] as const;
function Section({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={s.kit__section} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={s.kit__heading}>
        {title}
      </h2>
      {note && <p className={s.kit__note}>{note}</p>}
      <div className={s.kit__body}>{children}</div>
    </section>
  );
}
export function UiKitPage({ demos }: { demos: ReactNode }) {
  return (
    <>
      <a href="#palette" className={s.kit__skip}>
        Перейти к компонентам
      </a>
      <header className={s.kit__header}>
        <Container>
          <div className={s.kit__top}>
            <Link href="/" aria-label="SiriusTech — на главную">
              <Brand />
            </Link>
            <span className={s.kit__version}>Версия 0.1</span>
          </div>
          <h1>SiriusTech / UI Kit</h1>
          <p>
            Палитра, типографика и компоненты интерфейса. От макета — к
            работающему продукту.
          </p>
        </Container>
      </header>
      <Container>
        <nav className={s.kit__nav} aria-label="Разделы UI Kit">
          {[
            ["palette", "Цвет"],
            ["typography", "Типографика"],
            ["geometry", "Ритм"],
            ["buttons", "Кнопки"],
            ["fields", "Поля"],
            ["cards", "Карточки"],
            ["examples", "Сценарии"],
          ].map(([id, label]) => (
            <a key={id} href={`#${id}`}>
              {label}
            </a>
          ))}
        </nav>
        <main>
          <Section id="palette" title="Цветовая система">
            <div className={s.kit__palette}>
              {colors.map(([name, hex, token]) => (
                <div key={token}>
                  <div
                    className={s.kit__swatch}
                    style={{ background: `var(--${token})` }}
                  />
                  <h3 className={s.kit__label}>{name}</h3>
                  <p className={s.kit__hex}>{hex}</p>
                </div>
              ))}
            </div>
          </Section>
          <Section
            id="typography"
            title="Типографика"
            note="Roboto — основной текст. Inter — логотип и навигация. JetBrains Mono — строка хроники."
          >
            <div className={s.kit__types}>
              {types.map(([variant, label, size, text]) => (
                <div className={s.kit__type} key={variant}>
                  <div>
                    <p className={s.kit__label}>{label}</p>
                    <p className={s.kit__hex}>{size} px</p>
                  </div>
                  <Typography variant={variant}>{text}</Typography>
                </div>
              ))}
            </div>
          </Section>
          <Section
            id="geometry"
            title="Геометрия и ритм"
            note="Страница: 1280 px · контент: 1216 px · поля: 32 px · карточка: 384 px / промежуток 32 px."
          >
            <div className={s.kit__spacing}>
              {[8, 16, 24, 32, 64, 96].map((value, index) => (
                <div key={value}>
                  <div className={s.kit__measure} style={{ width: value }} />
                  <h3>{value} px</h3>
                  <p>
                    {
                      [
                        "Микроотступ",
                        "Связанные элементы",
                        "Внутри блока",
                        "Поля и отступы",
                        "Разделение групп",
                        "Секции",
                      ][index]
                    }
                  </p>
                </div>
              ))}
            </div>
            <p className={s.kit__note}>
              Скругления: 16 px — карточки · 24–32 px — поля и кнопки · обводки:
              1–2 px
            </p>
          </Section>
          <Section
            id="buttons"
            title="Кнопки и состояния"
            note="Hover и focus доступны при наведении и с клавиатуры. Недостающие состояния дополнены по предложениям в Figma."
          >
            <div className={s["kit__button-grid"]}>
              {["Default", "Hover", "Focus", "Disabled"].map((label, i) => (
                <div
                  key={label}
                  className={`${s["kit__button-column"]} ${i === 1 ? s["kit__button-column--hover"] : ""} ${i === 2 ? s["kit__button-column--focus"] : ""}`}
                >
                  <p className={s.kit__label}>{label}</p>
                  <Button disabled={i === 3}>Получить расчёт</Button>
                  <Button variant="secondary" disabled={i === 3}>
                    Изучить портфолио
                  </Button>
                </div>
              ))}
            </div>
            <div className={s.kit__inline}>
              <Button loading>Отправляем…</Button>
              <LinkButton href="#request" variant="secondary">
                К форме заявки <Icon />
              </LinkButton>
              <Spinner />
              <span className={s.kit__note}>Ожидание ответа</span>
            </div>
          </Section>
          <Section id="fields" title="Поля и выбор">
            <div className={s.kit__fields}>
              <Input
                label="Корпоративный e-mail · Default"
                placeholder="alex@company.ru"
                type="email"
              />
              <Input
                label="Корпоративный e-mail · Focus"
                defaultValue="alex@company.ru"
                className={s.kit__focused}
              />
              <Input
                label="Корпоративный e-mail · Ошибка"
                defaultValue="alex@"
                error="Введите полный адрес, например alex@company.ru"
              />
              <Input
                label="Недоступное поле"
                disabled
                defaultValue="alex@company.ru"
              />
              <Select label="Услуга">
                <option>Заказная разработка ПО / ERP / CRM</option>
                <option>Мобильные приложения</option>
              </Select>
              <Textarea
                label="Описание проекта"
                placeholder="Расскажите о задаче"
              />
            </div>
            <div className={s.kit__inline}>
              <Checkbox>Не выбрано</Checkbox>
              <Checkbox defaultChecked>Выбрано</Checkbox>
              <Checkbox disabled>Недоступно</Checkbox>
            </div>
          </Section>
          <Section
            id="cards"
            title="Карточки и фирменные элементы"
            note="Шесть услуг из Figma. Наведите курсор или перейдите к карточке клавишей Tab."
          >
            <div className={s.kit__cards}>
              {services.map((service, index) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  index={index}
                  href="#request"
                />
              ))}
            </div>
            <div className={s.kit__paired}>
              <div>
                <p className={s.kit__label}>Зафиксированное hover-состояние</p>
                <ServiceCard service={services[0]} hover href="#request" />
              </div>
              <div className={s["kit__brand-examples"]}>
                <CaseMetrics
                  metrics={[
                    { value: "+22%", label: "скорости обработки заказов" },
                    { value: "4 200", label: "магазинов" },
                  ]}
                />
                <p className={s.kit__note}>
                  Пример показателей кейса из макета
                </p>
                <Brand />
                <div className={s.kit__inline}>
                  <span className={s.kit__marker} />
                  <span className={s.kit__cross} />
                  <span className={s.kit__note}>Фирменные маркеры</span>
                </div>
              </div>
            </div>
            <WorkflowStep number="01" title="Анализ и встреча">
              Глубокое погружение в бизнес-задачу, интервью ключевых
              стейкхолдеров, фиксация бизнес-целей.
            </WorkflowStep>
          </Section>
          <Section
            id="examples"
            title="Форма заявки и ИИ-ассистент"
            note="Интерактивные примеры на заменяемых адаптерах. Без подключения к бэкенду."
          >
            {demos}
          </Section>
          <Section id="states" title="Системные состояния">
            <div className={s.kit__paired}>
              <StatusPanel
                kind="loading"
                title="ИИ-помощник · Обработка запроса"
              >
                Уточняем информацию по вашему запросу…
              </StatusPanel>
              <StatusPanel
                kind="error"
                title="ИИ-помощник · Данные временно недоступны"
                actions={
                  <LinkButton href="#examples" variant="secondary">
                    Перейти к демонстрации
                  </LinkButton>
                }
              >
                Не удалось получить информацию об услугах. Попробуйте ещё раз
                или обсудите задачу с архитектором.
              </StatusPanel>
            </div>
          </Section>
        </main>
        <footer className={s.kit__footer}>
          <Brand />
          <p>
            Компоненты по макету SiriusTech26.
            <br />
            CSS Modules · БЭМ · Feature-Sliced Design
          </p>
          <a href="#">К началу страницы ↑</a>
        </footer>
      </Container>
    </>
  );
}
