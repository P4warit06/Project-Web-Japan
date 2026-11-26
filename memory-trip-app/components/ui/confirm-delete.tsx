"use client";

import { useRef } from "react";
import { buttonClass } from "./button";
import { SubmitButton } from "./submit-button";

/** Two-step delete: the trigger only opens a dialog; the form posts after "confirm".
 *  All strings arrive translated. `action` is a Server Action taking hidden field `id`. */
export function ConfirmDelete({
  action,
  id,
  triggerLabel,
  title,
  body,
  confirmLabel,
  pendingLabel,
  cancelLabel,
  triggerClassName,
  extraFields,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  triggerLabel: string;
  title: string;
  body: string;
  confirmLabel: string;
  pendingLabel: string;
  cancelLabel: string;
  triggerClassName?: string;
  /** Extra hidden fields posted with the form (e.g. returnTo). */
  extraFields?: Record<string, string>;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button
        type="button"
        className={triggerClassName ?? buttonClass("quiet-danger")}
        onClick={() => ref.current?.showModal()}
      >
        {triggerLabel}
      </button>
      <dialog
        ref={ref}
        className="sheet"
        aria-labelledby={`del-${id}-title`}
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
      >
        <h2 id={`del-${id}-title`} className="voice text-xl font-semibold">
          {title}
        </h2>
        <p className="mt-2 text-soft">{body}</p>
        <form action={action} className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <input type="hidden" name="id" value={id} />
          {Object.entries(extraFields ?? {}).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <button type="button" className={buttonClass("secondary")} onClick={() => ref.current?.close()} autoFocus>
            {cancelLabel}
          </button>
          <SubmitButton label={confirmLabel} pendingLabel={pendingLabel} variant="danger" />
        </form>
      </dialog>
    </>
  );
}
