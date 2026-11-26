"use client";

import { useEffect, useRef } from "react";
import { tryTranslate } from "@/lib/i18n";
import type { FormState } from "@/features/common/types";
import { useT } from "@/components/i18n/locale-provider";

type FieldShell = {
  name: string;
  label: string;
  hint?: string;
  optional?: boolean;
  error?: string;
};

function Shell({
  name,
  label,
  hint,
  optional,
  error,
  children,
}: FieldShell & { children: React.ReactNode }) {
  const t = useT();
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="font-medium">
        {label}
        {optional && <span className="ml-2 font-normal text-soft">{t("form.optional")}</span>}
      </label>
      {hint && (
        <p id={`${name}-hint`} className="text-sm text-soft">
          {hint}
        </p>
      )}
      {children}
      {error && (
        <p id={`${name}-error`} className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(name: string, hint?: string, error?: string) {
  return [hint ? `${name}-hint` : null, error ? `${name}-error` : null].filter(Boolean).join(" ") || undefined;
}

export function TextField(
  props: FieldShell & {
    defaultValue?: string;
    type?: "text" | "date" | "datetime-local" | "number";
    maxLength?: number;
    step?: string;
    inputMode?: "decimal" | "text";
    placeholder?: string;
  },
) {
  const { name, label, hint, optional, error, defaultValue, type = "text", ...rest } = props;
  return (
    <Shell name={name} label={label} hint={hint} optional={optional} error={error}>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="control"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
        {...rest}
      />
    </Shell>
  );
}

export function TextAreaField(
  props: FieldShell & { defaultValue?: string; rows?: number; maxLength?: number; placeholder?: string },
) {
  const { name, label, hint, optional, error, defaultValue, ...rest } = props;
  return (
    <Shell name={name} label={label} hint={hint} optional={optional} error={error}>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="control user-text"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
        {...rest}
      />
    </Shell>
  );
}

export function SelectField(
  props: FieldShell & { defaultValue?: string; options: { value: string; label: string }[] },
) {
  const { name, label, hint, optional, error, defaultValue, options } = props;
  return (
    <Shell name={name} label={label} hint={hint} optional={optional} error={error}>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="control"
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(name, hint, error)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Shell>
  );
}

/** <form> wrapper: shows the whole-form error and moves focus to the first invalid field. */
export function FormFrame({
  action,
  state,
  children,
}: {
  action: (formData: FormData) => void;
  state: FormState;
  children: React.ReactNode;
}) {
  const t = useT();
  const ref = useRef<HTMLFormElement>(null);
  const hasError = Boolean(state.formError) || Object.keys(state.fieldErrors ?? {}).length > 0;
  useEffect(() => {
    if (!hasError) return;
    const bad = ref.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
    bad?.focus();
  }, [hasError, state]);
  return (
    <form ref={ref} action={action} noValidate className="flex flex-col gap-5">
      {state.formError && (
        <p
          role="alert"
          className="rounded-[var(--radius-control)] border border-danger px-4 py-3 font-medium text-danger"
        >
          {tryTranslate(t, state.formError)}
        </p>
      )}
      {children}
    </form>
  );
}

/** Translate a field error key from FormState. */
export function useFieldError(state: FormState) {
  const t = useT();
  return (name: string) => tryTranslate(t, state.fieldErrors?.[name]) || undefined;
}
