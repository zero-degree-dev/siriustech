import s from "./workflow-step.module.css";
export function WorkflowStep({
  number,
  title,
  children,
  reverse = false,
  embedded = false,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
  reverse?: boolean;
  embedded?: boolean;
}) {
  return (
    <div className={`${s.step} ${reverse ? s["step--reverse"] : ""} ${embedded ? s["step--embedded"] : ""}`}>
      <span className={s.step__number}>{number}</span>
      <div className={s.step__panel}>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </div>
  );
}
