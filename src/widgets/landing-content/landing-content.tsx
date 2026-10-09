import { Brand, Container, Icon, LinkButton } from '@/shared/ui';
import { milestones, stages } from './content';
import { HeroVisual } from './hero-visual';
import { HeroMetric } from './hero-metric';
import { ManifestText } from './manifest-text';
import s from './landing-content.module.css';
export function LandingHero() {
  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <Container className={s.hero__grid}>
        <div className={s.hero__copy}>
          <div className={s.hero__intro}>
            <h1 id="hero-title">Разработка<br />программного<br />обеспечения</h1>
            <HeroMetric />
          </div>
          <div className={s.hero__actions}>
            <LinkButton href="#request">Получить расчёт проекта</LinkButton>
            <LinkButton href="#portfolio" variant="secondary">Изучить портфолио<Icon /></LinkButton>
          </div>
        </div>
        <HeroVisual className={s.hero__visual} />
      </Container>
    </section>
  );
}
export function Chronicle(){return <div className={s.chronicle} aria-label="Хроника компании"><div className={s.chronicle__track}>{[0,1].map(copy=><div key={copy} className={s.chronicle__items} aria-hidden={copy===1?true:undefined}>{milestones.map(item=><span key={item}>{item}</span>)}</div>)}</div></div>}
export function Manifest(){return <section id="about" className={s.manifest} aria-label="Инженерный манифест"><Container><blockquote className={s.manifest__panel}><span>Инженерный манифест</span><ManifestText/></blockquote></Container></section>}
export { Portfolio } from './portfolio';
export function DevelopmentStages({children}:{children:React.ReactNode}){return <section id="workflow" className={s.workflow} aria-labelledby="workflow-title"><Container><h2 id="workflow-title">5 этапов создания безупречного ПО</h2><div className={s.workflow__list}>{children}</div></Container></section>}
export { stages };
export function SiteFooter(){return <footer id="contacts" className={s.footer}><Container><div className={s.footer__brand}><Brand/><p>Инженерия и разработка программного обеспечения</p></div><div className={s.footer__columns}><div><h2>Контакты</h2><address>117342, г. Москва,<br/>ул. Профсоюзная, д. 65, оф. 412<br/><a href="tel:+74951234567">+7 (495) 123-45-67</a><br/><a href="mailto:info@siriustech.ru">info@siriustech.ru</a></address></div><div><h2>Услуги</h2><a href="#services">Заказная разработка ПО</a><a href="#services">Сайты и корпоративные порталы</a><a href="#services">Мобильные приложения</a><a href="#request">Интеграция с 1С</a><a href="#request">Выделенные команды</a><a href="#request">Техподдержка SLA 24/7</a></div><div><h2>О компании</h2><a href="#top">Главная</a><a href="#services">Услуги</a><a href="#portfolio">Портфолио</a><a href="#about">О компании</a><a href="#workflow">Методология</a><a href="#contacts">Контакты</a></div><div><h2>Гарантии & стандарты</h2><p>12 месяцев безусловной гарантии на код.</p><p>Передача исключительных авторских прав на ПО заказчику в полном объёме по договору.</p><span className={s.footer__policy}>Политика конфиденциальности</span></div></div><div className={s.footer__bottom}><p>© 2004–2025 ООО «СириусТех». Все права защищены.</p><p>Фундаментальный подход к цифровым решениям</p></div></Container></footer>}
