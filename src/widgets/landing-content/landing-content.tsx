import { Brand, Container, Icon, LinkButton } from '@/shared/ui';
import { milestones, stages } from './content';
import { HeroVisual } from './hero-visual';
import s from './landing-content.module.css';
export function LandingHero() {
  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <Container className={s.hero__grid}>
        <div className={s.hero__copy}>
          <div className={s.hero__intro}>
            <p className={s.hero__eyebrow}>СириусТех · разработка для бизнеса</p>
            <h1 id="hero-title">Разработка программного обеспечения <span>для бизнеса</span></h1>
            <p className={s.hero__description}>Создаём веб-сервисы, приложения и внутренние системы. Помогаем связать их с вашими процессами и поддерживаем после запуска.</p>
          </div>
          <div className={s.hero__actions}>
            <LinkButton href="#request">Обсудить проект<Icon /></LinkButton>
            <LinkButton href="#services" variant="secondary">Посмотреть услуги</LinkButton>
          </div>
          <div className={s.hero__principles}><span>От идеи до запуска</span><span>Понятные этапы</span><span>Поддержка и развитие</span></div>
        </div>
        <HeroVisual className={s.hero__visual} />
      </Container>
    </section>
  );
}
export function Chronicle(){return <div className={s.chronicle} aria-label="Направления работы"><Container className={s.chronicle__items}>{milestones.map(item=><span key={item}>{item}</span>)}</Container></div>}
export function Manifest(){return <section id="about" className={s.manifest} aria-labelledby="about-title"><Container className={s.manifest__panel}><h2 id="about-title">Сначала задача.<br />Затем технология.</h2><div><p>Начинаем с того, как устроена ваша работа: кто будет пользоваться системой, что нужно упростить и с чем предстоит интеграция.</p><p>На этой основе определяем объём проекта, согласуем этапы и показываем результат по мере разработки.</p></div></Container></section>}
export { Portfolio } from './portfolio';
export function DevelopmentStages({children}:{children:React.ReactNode}){return <section id="workflow" className={s.workflow} aria-labelledby="workflow-title"><Container><p className={s.eyebrow}>Рабочий процесс</p><h2 id="workflow-title">Как строится работа</h2><p className={s.workflow__intro}>Пять последовательных этапов. На каждом — понятный результат.</p><div className={s.workflow__list}>{children}</div></Container></section>}
export { stages };
export function SiteFooter(){return <footer id="contacts" className={s.footer}><Container><div className={s.footer__columns}><div className={s.footer__brand}><Brand/><p>Разработка программного обеспечения для бизнеса.</p></div><div><h2>Направления</h2><a href="#services">Разработка и интеграции</a><a href="#services">Поддержка и развитие</a><a href="#consultation">Подобрать услугу</a></div><div><h2>О работе</h2><a href="#portfolio">Примеры проектов</a><a href="#technologies">Технологии</a><a href="#workflow">Этапы проекта</a></div><div><h2>Обсудим вашу задачу</h2><p>Расскажите, какую систему вы хотите создать или улучшить.</p><a href="#request">Оставить заявку →</a></div></div><div className={s.footer__bottom}><p>© {new Date().getFullYear()} СириусТех</p><p>Учебный проект. Каталог и кейсы демонстрационные.</p></div></Container></footer>}
