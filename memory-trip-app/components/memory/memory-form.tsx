"use client";

import { useActionState, useEffect, useRef } from "react";
import Link from "next/link";
import { initialFormState, type FormState } from "@/features/common/types";
import { MOODS, type MemoryDTO } from "@/features/memories/types";
import { useT } from "@/components/i18n/locale-provider";
import { toDateTimeInput } from "@/components/format";
import { buttonClass } from "@/components/ui/button";
import { FormFrame, SelectField, TextAreaField, TextField, useFieldError } from "@/components/ui/fields";
import { SubmitButton } from "@/components/ui/submit-button";

function localNowForInput(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MemoryForm({
  action,
  memory,
  tripId,
  tripOptions,
  cancelHref,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  /** Editing: existing memory. */
  memory?: MemoryDTO;
  /** Fixed trip (edit) or the preselected one (new). */
  tripId: string;
  /** New memory: choose the trip. Omit to keep the trip fixed. */
  tripOptions?: { value: string; label: string }[];
  cancelHref: string;
}) {
  const t = useT();
  const [state, formAction] = useActionState(action, initialFormState);
  const err = useFieldError(state);
  const v = state.values ?? {};
  const val = (k: string, init: string) => v[k] ?? init;
  const when = val("happenedAt", toDateTimeInput(memory?.happenedAt));
  const whenRef = useRef<HTMLInputElement>(null);

  // New memories start at the phone's own clock. The server cannot know the viewer's
  // local time, so this is set after hydration (and only if the field is still empty).
  useEffect(() => {
    const el = whenRef.current;
    if (el && !el.value && !when) el.value = localNowForInput();
  }, [when]);

  const mood = val("mood", memory?.mood ?? "");
  const tags = val("tags", memory?.tags.join(", ") ?? "");
  return (
    <FormFrame action={formAction} state={state}>
      {memory && <input type="hidden" name="id" value={memory.id} />}
      {tripOptions ? (
        <SelectField
          name="tripId"
          label={t("memories.field.trip")}
          defaultValue={val("tripId", tripId)}
          options={tripOptions}
          error={err("tripId")}
        />
      ) : (
        <input type="hidden" name="tripId" value={tripId} />
      )}
      <TextField
        name="title"
        label={t("memories.field.title")}
        defaultValue={val("title", memory?.title ?? "")}
        error={err("title")}
        maxLength={200}
        placeholder={t("memories.field.titlePlaceholder")}
      />
      <TextAreaField
        name="content"
        label={t("memories.field.content")}
        rows={7}
        defaultValue={val("content", memory?.content ?? "")}
        error={err("content")}
        placeholder={t("memories.field.contentPlaceholder")}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="happenedAt" className="font-medium">
          {t("memories.field.happenedAt")}
        </label>
        <input
          ref={whenRef}
          id="happenedAt"
          name="happenedAt"
          type="datetime-local"
          defaultValue={when}
          className="control"
          aria-invalid={err("happenedAt") ? true : undefined}
          aria-describedby={err("happenedAt") ? "happenedAt-error" : undefined}
        />
        {err("happenedAt") && (
          <p id="happenedAt-error" className="text-sm font-medium text-danger">
            {err("happenedAt")}
          </p>
        )}
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 font-medium">
          {t("memories.field.mood")}
          <span className="ml-2 font-normal text-soft">{t("form.optional")}</span>
        </legend>
        <div className="flex flex-wrap gap-2">
          {[null, ...MOODS].map((m) => (
            <label key={m ?? "none"} className="relative">
              <input
                type="radio"
                name="mood"
                value={m ?? ""}
                defaultChecked={mood === (m ?? "")}
                className="chip-input sr-only"
              />
              <span className="chip">{m ? t(`mood.${m}`) : t("mood.none")}</span>
            </label>
          ))}
        </div>
        {err("mood") && <p className="text-sm font-medium text-danger">{err("mood")}</p>}
      </fieldset>
      <TextField
        name="tags"
        label={t("memories.field.tags")}
        hint={t("memories.field.tagsHint")}
        optional
        defaultValue={tags}
        error={err("tags")}
      />
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link href={cancelHref} className={buttonClass("secondary")}>
          {t("common.cancel")}
        </Link>
        <SubmitButton label={t("memories.save")} pendingLabel={t("common.saving")} />
      </div>
    </FormFrame>
  );
}
