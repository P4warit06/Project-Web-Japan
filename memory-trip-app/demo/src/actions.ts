// Form handlers of the demo. Same contract as the real Server Actions (features/*/actions.ts)
// and the SAME validation (the real zod schemas), but they write to the browser store.
import { idField, parseForm } from "@/features/common/form";
import type { FormState } from "@/features/common/types";
import { createMemorySchema, deleteSchema as deleteMemorySchema, updateMemorySchema } from "@/features/memories/schema";
import { createPlaceSchema, deleteSchema as deletePlaceSchema, updatePlaceSchema } from "@/features/places/schema";
import { createTripSchema, deleteSchema as deleteTripSchema, updateTripSchema } from "@/features/trips/schema";
import { z } from "zod";
import * as data from "./data";
import { navigate } from "./router";
import { demoStore } from "./store";

const stamp = () => ({ id: newId(), now: new Date().toISOString() });

export function newId(): string {
  return crypto.randomUUID();
}

const STORAGE_FULL: FormState = { ok: false, formError: "errors.uploadFailed" };
const NOT_FOUND: FormState = { ok: false, formError: "errors.notFound" };

/** Saves `next` and goes to `to`. Returns an error state if it could not be saved. */
function finish(next: data.DemoState | null, to: string): FormState {
  if (!next) return NOT_FOUND;
  if (!demoStore.commit(next)) return STORAGE_FULL;
  navigate(to);
  return { ok: true };
}

export async function createTripAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(createTripSchema, formData);
  if (!parsed.ok) return parsed.state;
  const s = stamp();
  return finish(data.createTrip(demoStore.get(), parsed.data, s), `/trips/${s.id}`);
}

export async function updateTripAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(updateTripSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { id, ...input } = parsed.data;
  return finish(data.updateTrip(demoStore.get(), id, input), `/trips/${id}`);
}

export async function deleteTripAction(formData: FormData): Promise<void> {
  const parsed = parseForm(deleteTripSchema, formData);
  if (parsed.ok) demoStore.commit(data.deleteTrip(demoStore.get(), parsed.data.id));
  navigate("/trips");
}

export async function createPlaceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(createPlaceSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { tripId, ...input } = parsed.data;
  return finish(data.createPlace(demoStore.get(), tripId, input, stamp()), `/trips/${tripId}`);
}

export async function updatePlaceAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(updatePlaceSchema, formData);
  if (!parsed.ok) return parsed.state;
  const { id, ...input } = parsed.data;
  const result = data.updatePlace(demoStore.get(), id, input);
  return finish(result?.state ?? null, `/trips/${result?.tripId ?? ""}`);
}

export async function deletePlaceAction(formData: FormData): Promise<void> {
  const parsed = parseForm(deletePlaceSchema, formData);
  if (!parsed.ok) return navigate("/trips");
  const { state, tripId } = data.deletePlace(demoStore.get(), parsed.data.id);
  demoStore.commit(state);
  navigate(tripId ? `/trips/${tripId}` : "/trips");
}

export async function createMemoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(createMemorySchema, formData);
  if (!parsed.ok) return parsed.state;
  const { tripId, ...input } = parsed.data;
  return finish(data.createMemory(demoStore.get(), tripId, input, stamp()), `/trips/${tripId}`);
}

export async function updateMemoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = parseForm(updateMemorySchema, formData);
  if (!parsed.ok) return parsed.state;
  const { id, ...input } = parsed.data;
  const result = data.updateMemory(demoStore.get(), id, input);
  return finish(result?.state ?? null, `/trips/${result?.tripId ?? ""}`);
}

export async function deleteMemoryAction(formData: FormData): Promise<void> {
  const parsed = parseForm(deleteMemorySchema, formData);
  if (!parsed.ok) return navigate("/trips");
  const { state, tripId } = data.deleteMemory(demoStore.get(), parsed.data.id);
  demoStore.commit(state);
  navigate(tripId ? `/trips/${tripId}` : "/trips");
}

const returnTo = z.string().optional();
const mediaDeleteSchema = z.object({ id: idField, returnTo });
const coverSchema = z.object({ tripId: idField, mediaId: z.string().optional(), returnTo });

/** Only paths inside the demo are allowed as a return target. */
function safeTo(value: string | undefined, fallback: string): string {
  return value && /^\/[A-Za-z0-9/_?=&%.-]*$/.test(value) && !value.startsWith("//") ? value : fallback;
}

export async function deleteMediaAction(formData: FormData): Promise<void> {
  const parsed = parseForm(mediaDeleteSchema, formData);
  if (parsed.ok) demoStore.commit(data.deleteMedia(demoStore.get(), parsed.data.id));
  navigate(safeTo(parsed.ok ? parsed.data.returnTo : undefined, "/gallery"));
}

export async function setTripCoverAction(formData: FormData): Promise<void> {
  const parsed = parseForm(coverSchema, formData);
  if (!parsed.ok) return navigate("/trips");
  const { tripId, mediaId, returnTo: back } = parsed.data;
  const next = data.setCover(demoStore.get(), tripId, mediaId ? mediaId : null);
  if (next) demoStore.commit(next);
  navigate(safeTo(back, `/trips/${tripId}`));
}

export async function resetDemoAction(): Promise<void> {
  demoStore.reset();
  navigate("/");
}
