// Helpers shared by Server Actions: FormData -> validated data, zod errors -> i18n keys.
// Pure (no server-only) so it can be unit-tested.
import { z } from "zod";
import type { FormState } from "./types";

const MAX_ECHO_LENGTH = 10_000;

/** Raw string values from FormData (files and Next's internal $ACTION_* fields excluded). */
export function rawFormValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string" && !key.startsWith("$ACTION")) {
      out[key] = value.slice(0, MAX_ECHO_LENGTH);
    }
  }
  return out;
}

/** Maps a zod issue to one of the i18n keys "errors.required|tooLong|invalid". */
function issueKey(issue: z.core.$ZodIssue): string {
  if (issue.code === "custom" && issue.message.startsWith("errors.")) {
    return issue.message;
  }
  if (issue.code === "too_big") return "errors.tooLong";
  if (issue.code === "too_small") return "errors.required";
  if (issue.code === "invalid_type" && issue.input === undefined) {
    return "errors.required";
  }
  return "errors.invalid";
}

export function parseForm<T>(
  schema: z.ZodType<T>,
  formData: FormData,
): { ok: true; data: T } | { ok: false; state: FormState } {
  const values = rawFormValues(formData);
  const result = schema.safeParse(values);
  if (result.success) return { ok: true, data: result.data };

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !(field in fieldErrors)) fieldErrors[field] = issueKey(issue);
  }
  return {
    ok: false,
    state: {
      ok: false,
      values,
      fieldErrors,
      formError: Object.keys(fieldErrors).length ? undefined : "errors.invalid",
    },
  };
}

// ---- reusable field schemas -------------------------------------------------

export const requiredText = (max: number) => z.string().trim().min(1).max(max);

/** Optional text; empty string becomes null. */
export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : null));

export const idField = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/);

const DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::\d{2})?)?$/;

/** Parses "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" as a floating time stored as UTC. */
export function parseFloatingDate(value: string): Date | null {
  const m = DATE_TIME.exec(value);
  if (!m) return null;
  const [y, mo, d, h = "0", mi = "0"] = m.slice(1);
  const date = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi));
  const ok =
    date.getUTCFullYear() === +y &&
    date.getUTCMonth() === +mo - 1 &&
    date.getUTCDate() === +d &&
    date.getUTCHours() === +h &&
    date.getUTCMinutes() === +mi;
  return ok ? date : null;
}

export const requiredDate = z
  .string()
  .trim()
  .min(1)
  .transform((v, ctx) => {
    const date = parseFloatingDate(v);
    if (!date) ctx.addIssue({ code: "custom", message: "errors.invalid" });
    return date as Date;
  });

export const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((v, ctx) => {
    if (!v) return null;
    const date = parseFloatingDate(v);
    if (!date) {
      ctx.addIssue({ code: "custom", message: "errors.invalid" });
      return null;
    }
    return date;
  });

export const optionalNumber = (min: number, max: number) =>
  z
    .string()
    .trim()
    .optional()
    .transform((v, ctx) => {
      if (!v) return null;
      const n = Number(v);
      if (!Number.isFinite(n) || n < min || n > max) {
        ctx.addIssue({ code: "custom", message: "errors.invalid" });
        return null;
      }
      return n;
    });
