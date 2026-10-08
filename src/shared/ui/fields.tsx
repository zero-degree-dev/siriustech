"use client";
import {
  useId,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  type ReactNode,
} from "react";
import s from "./ui.module.css";
const cx = (...names: (string | undefined | false)[]) =>
  names.filter(Boolean).join(" ");
type FieldProps = { label: string; error?: string; hint?: string };
function Field({
  id,
  label,
  error,
  hint,
  children,
}: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className={s.field}>
      <label className={s.field__label} htmlFor={id}>
        {label}
      </label>
      {children}
      {(error || hint) && (
        <p
          id={`${id}-message`}
          className={cx(s.field__message, error && s["field__message--error"])}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}
export function Input({
  label,
  error,
  hint,
  id: suppliedId,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & FieldProps) {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  return (
    <Field {...{ id, label, error, hint }}>
      <input
        {...props}
        id={id}
        aria-invalid={!!error}
        aria-describedby={
          cx(props["aria-describedby"], (error || hint) && `${id}-message`) ||
          undefined
        }
        className={cx(
          s.field__control,
          error && s["field__control--error"],
          className,
        )}
      />
    </Field>
  );
}
export function Textarea({
  label,
  error,
  hint,
  id: suppliedId,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps) {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  return (
    <Field {...{ id, label, error, hint }}>
      <textarea
        {...props}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-message` : undefined}
        className={cx(
          s.field__control,
          s["field__control--textarea"],
          className,
        )}
      />
    </Field>
  );
}
export function Select({
  label,
  error,
  hint,
  id: suppliedId,
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & FieldProps) {
  const generatedId = useId();
  const id = suppliedId || generatedId;
  return (
    <Field {...{ id, label, error, hint }}>
      <select
        {...props}
        id={id}
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${id}-message` : undefined}
        className={cx(s.field__control, className)}
      />
    </Field>
  );
}
export function Checkbox({
  children,
  error,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  children: ReactNode;
  error?: string;
}) {
  const id = useId();
  return (
    <div>
      <label className={cx(s.checkbox, className)}>
        <input
          {...props}
          type="checkbox"
          aria-invalid={!!error}
          aria-describedby={error ? id : undefined}
          className={s.checkbox__input}
        />
        <span>{children}</span>
      </label>
      {error && (
        <p id={id} className={cx(s.field__message, s["field__message--error"])}>
          {error}
        </p>
      )}
    </div>
  );
}
