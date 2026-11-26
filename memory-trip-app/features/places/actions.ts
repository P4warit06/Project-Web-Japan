"use server";
import { redirect } from "next/navigation";
import { requireMember } from "@/features/auth/dal";
import { parseForm } from "@/features/common/form";
import type { FormState } from "@/features/common/types";
import { db } from "@/lib/db";
import { createPlaceFor, deletePlaceFor, updatePlaceFor } from "./core";
import { createPlaceSchema, deleteSchema, updatePlaceSchema } from "./schema";

/** Fields: tripId (hidden), name (required), address, note, latitude, longitude. Redirects to /trips/[tripId]. */
export async function createPlaceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { coupleSpaceId } = await requireMember();
  const parsed = parseForm(createPlaceSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { tripId, ...input } = parsed.data;
  const id = await createPlaceFor(db, coupleSpaceId, tripId, input);
  if (!id) return { ok: false, formError: "errors.notFound" };
  redirect(`/trips/${tripId}`);
}

/** Same fields + hidden `id`. */
export async function updatePlaceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { coupleSpaceId } = await requireMember();
  const parsed = parseForm(updatePlaceSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { id, ...input } = parsed.data;
  const tripId = await updatePlaceFor(db, coupleSpaceId, id, input);
  if (!tripId) return { ok: false, formError: "errors.notFound" };
  redirect(`/trips/${tripId}`);
}

/** Hidden field `id`. Redirects back to the trip. */
export async function deletePlaceAction(formData: FormData): Promise<void> {
  const { coupleSpaceId } = await requireMember();
  const parsed = parseForm(deleteSchema, formData);
  const tripId = parsed.ok ? await deletePlaceFor(db, coupleSpaceId, parsed.data.id) : null;
  redirect(tripId ? `/trips/${tripId}` : "/trips");
}
