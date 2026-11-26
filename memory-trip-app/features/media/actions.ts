"use server";

/** Fields: id (hidden), returnTo (optional internal path such as "/gallery" or "/trips/abc").
 *  Deletes the photo and its files. Redirects to returnTo (default "/gallery"). */
export async function deleteMediaAction(_formData: FormData): Promise<void> {
  throw new Error("not implemented yet (backend in progress)");
}

/** Fields: tripId, mediaId (empty string removes the cover), returnTo (optional internal path).
 *  The photo must belong to that trip. Redirects to returnTo (default "/trips/[tripId]"). */
export async function setTripCoverAction(_formData: FormData): Promise<void> {
  throw new Error("not implemented yet (backend in progress)");
}
