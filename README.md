# SiriusTech

Каркас Next.js App Router + React + TypeScript strict, CSS Modules / БЭМ, Feature-Sliced Design. `/` — стартовая страница, `/ui-kit` — витрина по Figma. Основной лендинг подключён к NestJS и PostgreSQL: каталог из 12 услуг, заявки, Polza AI и MCP. Подробности и запуск: [docs/backend.md](docs/backend.md).

## Запуск

Node.js 20.19+ и npm. Зависимости фиксирует `package-lock.json`.

```sh
npm ci
npm run dev
```

Откройте http://localhost:3000. `npm run dev` запускает PostgreSQL, NestJS и Next.js вместе; настройки находятся в `backend/.env` (см. [инструкцию](docs/backend.md)). Если сайт уже работает, `npm run dev:services` поднимет недостающие базу и API. Для одной демовитрины без бэкенда: `npm run dev:web` и http://localhost:3000/ui-kit. Шрифты поставляются локально из Fontsource.

## Структура

```text
app/                  маршруты Next.js, metadata, root layout
pages/README.md        исключает распознавание src/pages как Pages Router
src/
  app/                композиция адаптеров, шрифты, глобальные стили
  pages/              страницы home и ui-kit
  widgets/            составной блок этапа работы
  features/           request-project, ai-chat: UI, модели, адаптеры
  entities/           service и case: предметные данные и отображение
  shared/             UI-примитивы, транспорт, конфигурация, CSS-токены
```

Импортируйте слайсы через `index.ts`: `@/features/ai-chat`. Зависимости направлены вниз по слоям; соседние слайсы не импортируют друг друга. ESLint проверяет эти правила для alias и относительных импортов. В `shared` и `app` допускаются зависимости между сегментами. Корневой `app` связывает FSD-приложение с маршрутизатором. Не удаляйте `pages/README.md`.

Статические страницы и примитивы — Server Components. Интерактивные поля, форма, чат и композиция демонстрационных адаптеров имеют клиентские границы. Функции адаптеров создаются внутри клиентской композиции, не передаются через границу RSC.

## Стили и UI

Токены находятся в `src/shared/styles/tokens.css`. Локальные стили — `*.module.css`. Пример: `styles.button`, `styles['button--secondary']`, `styles.field__label`. Stylelint проверяет БЭМ-классы. Глобально подключаются только reset, токены и базовые правила документа.

Примитивы экспортируются из `@/shared/ui`. `Button` имеет варианты primary/secondary, loading и нативные атрибуты; ссылки оформляются `LinkButton`. Поля связывают label, ошибку и подсказку через id; карточки услуг и показатели кейсов живут в entities. Hover/focus/disabled и ошибки доступны в витрине. Сценарий ответа управляет формой и чатом, список услуг загружается независимо.

## Бэкенд, PostgreSQL, Polza AI и MCP

См. [инструкцию по запуску и архитектуре](docs/backend.md). Основной сайт использует реальный API, а /ui-kit — демонстрационные адаптеры.

## Проверки

```sh
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Unit-тесты проверяют транспорт, валидацию, повторные отправки и восстановление после ошибок. Playwright проверяет витрину, клавиатурную навигацию и сценарии на 375/768/1280 px; скриншоты находятся в `test-results/`. Витрина имеет robots noindex, но не является закрытой страницей.

Источник дизайна: SiriusTech26 через figma-mcp-bridge, узлы `237:4772` и `241:17416`. Экспортированные эталоны — `docs/reference/`; правила дизайна — `DESIGN.md`.
