"use client";

import { useActionState } from "react";
import Link from "next/link";
import { initialFormState, type FormState } from "@/features/common/types";
import { useT } from "@/components/i18n/locale-provider";
import { toDateInput } from "@/components/format";
import { buttonClass } from "@/components/ui/button";
import { FormFrame, TextAreaField, TextField, useFieldError } from "@/components/ui/fields";
import { SubmitButton } from "@/components/ui/submit-button";

type Initial = {
  id: string;
  title: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
};

export function TripForm({
  action,
  trip,
  cancelHref,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  trip?: Initial;
  cancelHref: string;
}) {
  const t = useT();
  const [state, formAction] = useActionState(action, initialFormState);
  const err = useFieldError(state);
  const v = state.values ?? {};
  const val = (k: string, init: string) => v[k] ?? init;
  return (
    <FormFrame action={formAction} state={state}>
      {trip && <input type="hidden" name="id" value={trip.id} />}
      <TextField
        name="title"
        label={t("trips.field.title")}
        defaultValue={val("title", trip?.title ?? "")}
        error={err("title")}
        maxLength={200}
        placeholder={t("trips.field.titlePlaceholder")}
      />
      <TextAreaField
        name="description"
        label={t("trips.field.description")}
        optional
        rows={4}
        defaultValue={val("description", trip?.description ?? "")}
        error={err("description")}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="startDate"
          type="date"
          label={t("trips.field.startDate")}
          optional
          defaultValue={val("startDate", toDateInput(trip?.startDate))}
          error={err("startDate")}
        />
        <TextField
          name="endDate"
          type="date"
          label={t("trips.field.endDate")}
          optional
          defaultValue={val("endDate", toDateInput(trip?.endDate))}
          error={err("endDate")}
        />
      </div>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className={buttonClass("secondary")}>
          {t("common.cancel")}
        </Link>
        <SubmitButton label={t("trips.save")} pendingLabel={t("common.saving")} />
      </div>
    </FormFrame>
  );
}
