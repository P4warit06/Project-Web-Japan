"use client";

import { useActionState } from "react";
import Link from "next/link";
import { initialFormState, type FormState } from "@/features/common/types";
import type { PlaceDTO } from "@/features/places/types";
import { useT } from "@/components/i18n/locale-provider";
import { buttonClass } from "@/components/ui/button";
import { FormFrame, TextAreaField, TextField, useFieldError } from "@/components/ui/fields";
import { SubmitButton } from "@/components/ui/submit-button";

export function PlaceForm({
  action,
  tripId,
  place,
  cancelHref,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  tripId: string;
  place?: PlaceDTO;
  cancelHref: string;
}) {
  const t = useT();
  const [state, formAction] = useActionState(action, initialFormState);
  const err = useFieldError(state);
  const v = state.values ?? {};
  const val = (k: string, init: string) => v[k] ?? init;
  const lat = val("latitude", place?.latitude != null ? String(place.latitude) : "");
  const lng = val("longitude", place?.longitude != null ? String(place.longitude) : "");
  const coordsOpen = Boolean(lat || lng || err("latitude") || err("longitude"));
  return (
    <FormFrame action={formAction} state={state}>
      <input type="hidden" name="tripId" value={tripId} />
      {place && <input type="hidden" name="id" value={place.id} />}
      <TextField
        name="name"
        label={t("places.field.name")}
        defaultValue={val("name", place?.name ?? "")}
        error={err("name")}
        maxLength={200}
        placeholder={t("places.field.namePlaceholder")}
      />
      <TextField
        name="address"
        label={t("places.field.address")}
        optional
        defaultValue={val("address", place?.address ?? "")}
        error={err("address")}
      />
      <TextAreaField
        name="note"
        label={t("places.field.note")}
        optional
        rows={4}
        defaultValue={val("note", place?.note ?? "")}
        error={err("note")}
      />
      <details open={coordsOpen} className="rounded-[var(--radius-control)] border border-rule px-4 py-1">
        <summary className="flex min-h-11 cursor-pointer items-center font-medium">
          {t("places.field.coordinates")}
        </summary>
        <div className="grid gap-5 pt-2 pb-4 sm:grid-cols-2">
          <TextField
            name="latitude"
            label={t("places.field.latitude")}
            optional
            inputMode="decimal"
            placeholder="35.6586"
            defaultValue={lat}
            error={err("latitude")}
          />
          <TextField
            name="longitude"
            label={t("places.field.longitude")}
            optional
            inputMode="decimal"
            placeholder="139.7454"
            defaultValue={lng}
            error={err("longitude")}
          />
        </div>
      </details>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className={buttonClass("secondary")}>
          {t("common.cancel")}
        </Link>
        <SubmitButton label={t("places.save")} pendingLabel={t("common.saving")} />
      </div>
    </FormFrame>
  );
}
