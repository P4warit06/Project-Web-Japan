// Shared contract types. Owned by backend; frontend only imports them.

/** Result of a form Server Action (use with React `useActionState`). On success the
 *  action calls `redirect()` itself, so the UI only ever sees the failure state. */
export type FormState = {
  ok: boolean;
  /** field name -> i18n message key (e.g. "errors.required"). Translate with t(). */
  fieldErrors?: Record<string, MessageKeyString>;
  /** whole-form error as i18n message key (e.g. "errors.notFound"). */
  formError?: MessageKeyString;
  /** raw submitted values, so the form can be re-filled after an error. */
  values?: Record<string, string>;
};

export const initialFormState: FormState = { ok: false };

/** Cursor pagination. Pass `nextCursor` back as `cursor` to load the next page. */
export type Page<T> = { items: T[]; nextCursor: string | null };

/** Alias for readability: a key of lib/i18n/messages (validated by t() at use site). */
export type MessageKeyString = string;
