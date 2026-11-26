"use client";

import { useActionState } from "react";
import { initialFormState, type FormState } from "@/features/common/types";
import { tryTranslate } from "@/lib/i18n";
import { useT } from "@/components/i18n/locale-provider";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm({
  action,
  users,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  users: { id: string; displayName: string }[];
}) {
  const t = useT();
  const [state, formAction] = useActionState(action, initialFormState);
  const error = tryTranslate(t, state.fieldErrors?.userId) || tryTranslate(t, state.formError);
  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 font-medium">{t("login.pick")}</legend>
        {users.map((u, i) => (
          <label key={u.id} className="relative block">
            <input
              type="radio"
              name="userId"
              value={u.id}
              defaultChecked={state.values?.userId ? state.values.userId === u.id : i === 0}
              className="chip-input sr-only"
            />
            <span className="chip !flex !min-h-14 w-full !rounded-[var(--radius-control)] !px-4 text-lg">
              <span className="voice font-semibold">{u.displayName}</span>
            </span>
          </label>
        ))}
        {error && (
          <p role="alert" className="font-medium text-danger">
            {error}
          </p>
        )}
      </fieldset>
      <SubmitButton label={t("login.submit")} pendingLabel={t("login.pending")} className="w-full" />
    </form>
  );
}
