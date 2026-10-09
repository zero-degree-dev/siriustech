import s from "./case-metrics.module.css";
import type { ReactNode } from "react";
import type { CaseMetric } from "../model/types";
export function CaseMetrics({
  metrics,
  layout = "columns",
  renderText,
}: {
  metrics: readonly CaseMetric[];
  layout?: "columns" | "rows";
  renderText?: (text: string, field: "label" | "value", index: number) => ReactNode;
}) {
  return (
    <dl className={`${s.metrics} ${layout === "rows" ? s["metrics--rows"] : ""}`}>
      {metrics.map((metric, index) => (
        <div key={metric.label} className={s.metrics__item}>
          <dt className={s.metrics__label}>{renderText?.(metric.label, "label", index) ?? metric.label}</dt>
          <dd className={s.metrics__value}>{renderText?.(metric.value, "value", index) ?? metric.value}</dd>
        </div>
      ))}
    </dl>
  );
}
