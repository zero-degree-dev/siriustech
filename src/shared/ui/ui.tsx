import {
  type ButtonHTMLAttributes,
  type AnchorHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import s from "./ui.module.css";
const cx = (...names: (string | undefined | false)[]) =>
  names.filter(Boolean).join(" ");
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
  loading?: boolean;
};
export function Button({
  variant = "primary",
  loading,
  disabled,
  children,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(s.button, s[`button--${variant}`], className)}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}
export function LinkButton({
  variant = "primary",
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: "primary" | "secondary";
}) {
  return (
    <a
      {...props}
      className={cx(s.button, s[`button--${variant}`], className)}
    />
  );
}
export function Container({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cx(s.container, className)} />;
}
export function Typography({
  as: Tag = "p",
  variant = "body",
  className,
  ...props
}: HTMLAttributes<HTMLElement> & {
  as?: "h1" | "h2" | "h3" | "p" | "span";
  variant?:
    "display" | "heading" | "subheading" | "title" | "body" | "label" | "data";
}) {
  return (
    <Tag {...props} className={cx(s.type, s[`type--${variant}`], className)} />
  );
}
export function Icon({
  name = "arrow",
  ...props
}: React.SVGProps<SVGSVGElement> & {
  name?: "arrow" | "code" | "check" | "star" | "web" | "mobile";
}) {
  const paths = {
    web: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c-5 5-5 13 0 18 5-5 5-13 0-18Z",
    mobile: "M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm3 17h4",
    arrow: "M4 12h16m-6-6 6 6-6 6",
    code: "m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18",
    check: "m5 12 4 4L19 6",
    star: "m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z",
  };
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}
export function Spinner() {
  return <span className={s.spinner} aria-hidden="true" />;
}
export function StatusPanel({
  title,
  children,
  kind = "info",
  actions,
}: {
  title: string;
  children: ReactNode;
  kind?: "info" | "loading" | "error" | "success";
  actions?: ReactNode;
}) {
  return (
    <div className={s.status} role={kind === "error" ? "alert" : "status"}>
      <div className={s.status__header}>{title}</div>
      <div className={s.status__body}>
        {kind === "loading" && <Spinner />}
        <div>{children}</div>
        {actions && <div className={s.status__actions}>{actions}</div>}
      </div>
    </div>
  );
}
