"use server";
import { redirect } from "next/navigation";
import { requireMember } from "@/features/auth/dal";
import { parseForm } from "@/features/common/form";
import type { FormState } from "@/features/common/types";
import { db } from "@/lib/db";
import { createTripFor, deleteTripFor, updateTripFor } from "./core";
import { createTripSchema, deleteSchema, updateTripSchema } from "./schema";

/** Fields: title (required), description, startDate, endDate ("YYYY-MM-DD"). Redirects to /trips/[id]. */
export async function createTripAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { coupleSpaceId } = await requireMember();
  const parsed = parseForm(createTripSchema, formData);
  if (!parsed.ok) return parsed.state;
  const id = await createTripFor(db, coupleSpaceId, parsed.data);
  redirect(`/trips/${id}`);
}

/** Same fields + hidden `id`. Redirects to /trips/[id]. */
export async function updateTripAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { coupleSpaceId } = await requireMember();
  const parsed = parseForm(updateTripSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { id, ...input } = parsed.data;
  const found = await updateTripFor(db, coupleSpaceId, id, input);
  if (!found) return { ok: false, formError: "errors.notFound" };
  redirect(`/trips/${id}`);
}

/** Hidden field `id`. Redirects to /trips. */
export async function deleteTripAction(formData: FormData): Promise<void> {
  const { coupleSpaceId } = await requireMember();
  const parsed = parseForm(deleteSchema, formData);
  if (parsed.ok) await deleteTripFor(db, coupleSpaceId, parsed.data.id);
  redirect("/trips");
}
