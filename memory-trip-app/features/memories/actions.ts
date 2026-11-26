"use server";
import { redirect } from "next/navigation";
import { requireMember } from "@/features/auth/dal";
import { parseForm } from "@/features/common/form";
import type { FormState } from "@/features/common/types";
import { db } from "@/lib/db";
import { createMemoryFor, deleteMemoryFor, updateMemoryFor } from "./core";
import { createMemorySchema, deleteSchema, updateMemorySchema } from "./schema";

/** Fields: tripId (hidden), title (required), content (required), happenedAt ("YYYY-MM-DDTHH:mm"),
 *  mood (one of MOODS or empty), tags (comma separated text). Redirects to /trips/[tripId]. */
export async function createMemoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { coupleSpaceId } = await requireMember();
  const parsed = parseForm(createMemorySchema, formData);
  if (!parsed.ok) return parsed.state;
  const { tripId, ...input } = parsed.data;
  const id = await createMemoryFor(db, coupleSpaceId, tripId, input);
  if (!id) return { ok: false, formError: "errors.notFound" };
  redirect(`/trips/${tripId}`);
}

/** Same fields + hidden `id`. */
export async function updateMemoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { coupleSpaceId } = await requireMember();
  const parsed = parseForm(updateMemorySchema, formData);
  if (!parsed.ok) return parsed.state;
  const { id, ...input } = parsed.data;
  const tripId = await updateMemoryFor(db, coupleSpaceId, id, input);
  if (!tripId) return { ok: false, formError: "errors.notFound" };
  redirect(`/trips/${tripId}`);
}

/** Hidden field `id`. Redirects back to the trip. */
export async function deleteMemoryAction(formData: FormData): Promise<void> {
  const { coupleSpaceId } = await requireMember();
  const parsed = parseForm(deleteSchema, formData);
  const tripId = parsed.ok ? await deleteMemoryFor(db, coupleSpaceId, parsed.data.id) : null;
  redirect(tripId ? `/trips/${tripId}` : "/trips");
}
