import { Container } from "@/shared/ui";
import { SiteHeader } from "@/widgets/site-header";
import {
  LandingHero,
  Chronicle,
  Manifest,
  Portfolio,
  DevelopmentStages,
  SiteFooter,
  stages,
} from "@/widgets/landing-content";
import { WorkflowStep } from "@/widgets/workflow-step";
import { TechnologyGlobe } from "@/widgets/technology-globe";
import s from "./home-page.module.css";
export function HomePage({ form, services, chat }: { form: React.ReactNode; services: React.ReactNode; chat: React.ReactNode }) {
  return (
    <div id="top" className={s.home}>
      <a href="#main" className={s.home__skip}>
        Перейти к содержимому
      </a>
      <SiteHeader />
      <main id="main">
        <LandingHero />
        <Chronicle />
        {services}
        {chat}
        <Manifest />
        <Portfolio />
        <TechnologyGlobe />
        <DevelopmentStages>
          {stages.map(([title, text], index) => (
            <WorkflowStep
              key={title}
              number={String(index + 1).padStart(2, "0")}
              title={title}
              reverse={index % 2 === 1}
              embedded
            >
              {text}
            </WorkflowStep>
          ))}
        </DevelopmentStages>
        <section
          id="request"
          className={s.home__feedback}
          aria-labelledby="request-title"
        >
          <Container className={s["home__form-grid"]}>
            <div>
              <h2 id="request-title">
                Обсудите задачу
                <br />с{" "}
                <span>
                  ведущим
                  <br />
                  архитектором
                </span>
              </h2>
              <p className={s.home__demo}>
                Оставьте контакты и выберите услугу. Заявка будет сохранена для обсуждения проекта.
              </p>
            </div>
            {form}
          </Container>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
