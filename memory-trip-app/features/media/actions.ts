"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireMember } from "@/features/auth/dal";
import { idField, parseForm } from "@/features/common/form";
import { db } from "@/lib/db";
import { safeReturnTo } from "@/lib/security/origin";
import { getStorage } from "@/lib/storage";
import { deleteMediaFor, setTripCoverFor } from "./core";

const returnTo = z.string().optional();
const deleteSchema = z.object({ id: idField, returnTo });
const coverSchema = z.object({
  tripId: idField,
  mediaId: z.string().optional(),
  returnTo,
});

/** Fields: id (hidden), returnTo (optional internal path such as "/gallery" or "/trips/abc").
 *  Deletes the photo and its files. Redirects to returnTo (default "/gallery"). */
export async function deleteMediaAction(formData: FormData): Promise<void> {
  const { coupleSpaceId } = await requireMember();
  const parsed = parseForm(deleteSchema, formData);
  if (parsed.ok) await deleteMediaFor(db, getStorage(), coupleSpaceId, parsed.data.id);
  redirect(safeReturnTo(parsed.ok ? parsed.data.returnTo : undefined, "/gallery"));
}

/** Fields: tripId, mediaId (empty string removes the cover), returnTo (optional internal path).
 *  The photo must belong to that trip. Redirects to returnTo (default "/trips/[tripId]"). */
export async function setTripCoverAction(formData: FormData): Promise<void> {
  const { coupleSpaceId } = await requireMember();
  const parsed = parseForm(coverSchema, formData);
  if (!parsed.ok) redirect("/trips");
  const { tripId, mediaId, returnTo } = parsed.data;
  const mediaParsed = mediaId ? idField.safeParse(mediaId) : null;
  if (!mediaParsed || mediaParsed.success) {
    await setTripCoverFor(db, coupleSpaceId, tripId, mediaParsed ? mediaParsed.data : null);
  }
  redirect(safeReturnTo(returnTo, `/trips/${tripId}`));
}
