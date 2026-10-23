import { Icon } from '@/shared/ui';
import s from './hero-visual.module.css';

export function HeroVisual({ className }: { className?: string }) {
  return <figure className={`${s.visual} ${className ?? ''}`} aria-label="Пример интерфейса системы управления проектами">
    <div className={s.window} aria-hidden="true">
      <div className={s.toolbar}><span className={s.dots}><i /><i /><i /></span><span>Рабочее пространство</span><span className={s.avatar}>СТ</span></div>
      <div className={s.workspace}>
        <aside className={s.sidebar}><span className={s.mark}>С</span><Icon name="web" /><Icon name="code" /><Icon name="mobile" /><span className={s.sidebar__line} /></aside>
        <div className={s.content}>
          <div className={s.heading}><div><span className={s.caption}>Обзор проекта</span><strong>Всё под контролем</strong></div><span className={s.period}>Эта неделя ↗</span></div>
          <div className={s.metrics}><div><span>Задачи выполнены</span><strong>24 <small>/ 32</small></strong><div className={s.progress} /></div><div><span>Текущий этап</span><strong className={s.stage}>Разработка</strong><span className={s.status}>По плану</span></div></div>
          <div className={s.chart}><div className={s.chart__heading}><strong>Динамика работы</strong><span>Выполненные задачи</span></div><div className={s.bars}>{[28, 44, 36, 65, 82, 70, 94].map((height, i) => <div key={i}><i style={{ height: `${height}%` }} /><span>{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'][i]}</span></div>)}</div></div>
          <div className={s.window__footer}><span>Проект / Личный кабинет</span><span>Демонстрационный интерфейс</span></div>
        </div>
      </div>
    </div>
    <div className={s.task} aria-hidden="true"><span className={s.caption}>Следующий этап</span><strong>Запуск личного кабинета</strong><p>Дизайн согласован. Готовим релиз.</p><div><span className={s.task__avatars}><i>АК</i><i>МС</i><i>ДП</i></span><span>Команда проекта</span></div></div>
    <div className={s.integration} aria-hidden="true"><span className={s.integration__icon}><Icon name="code" /></span><div><strong>Системы работают вместе</strong><span>Сайт · CRM · склад</span></div><span className={s.check}>✓</span></div>
    <figcaption className={s.accessible}>Иллюстрация: задачи, этапы и интеграции в одном рабочем пространстве. Данные демонстрационные.</figcaption>
  </figure>;
}
