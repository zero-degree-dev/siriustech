import s from "./case-metrics.module.css";
export function CaseMetrics({
  metrics,
  layout = "columns",
}: {
  metrics: { value: string; label: string }[];
  layout?: "columns" | "rows";
}) {
  return (
    <dl className={`${s.metrics} ${layout === "rows" ? s["metrics--rows"] : ""}`}>
      {metrics.map((metric) => (
        <div key={metric.label} className={s.metrics__item}>
          <dt className={s.metrics__label}>{metric.label}</dt>
          <dd className={s.metrics__value}>{metric.value}</dd>
        </div>
      ))}
    </dl>
  );
}
