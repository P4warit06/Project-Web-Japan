import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteMediaAction, setTripCoverAction } from "@/features/media/actions";
import { getMedia } from "@/features/media/service";
import { getTrip } from "@/features/trips/service";
import { getT } from "@/lib/i18n/server";
import { formatDate, lineStyle } from "@/components/format";
import { Photo } from "@/components/media/photo";
import { BackLink } from "@/components/ui/back-link";
import { buttonClass } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { SubmitButton } from "@/components/ui/submit-button";

type Props = { params: Promise<{ mediaId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { mediaId } = await params;
  const media = await getMedia(mediaId);
  return { title: media?.tripTitle ?? undefined };
}

export default async function PhotoPage({ params }: Props) {
  const { mediaId } = await params;
  const [{ t, locale }, media] = await Promise.all([getT(), getMedia(mediaId)]);
  if (!media) notFound();
  // Is this photo the trip's current cover? (only the cover's thumbnail URL is exposed)
  const trip = await getTrip(media.tripId);
  const isCover = Boolean(trip?.coverThumbUrl && trip.coverThumbUrl === media.thumbUrl);
  const here = `/gallery/${media.id}`;

  return (
    <article>
      <BackLink href="/gallery" label={t("nav.gallery")} />
      <div
        className="mx-auto mb-2 max-h-[75dvh] overflow-hidden rounded-[var(--radius-control)] bg-surface-2 shadow-[0_5px_0_0_var(--line)]"
        style={{ ...lineStyle(media.tripId), aspectRatio: `${media.width} / ${media.height}` }}
      >
        <Photo
          media={media}
          variant="full"
          priority
          alt={t("media.alt", { title: media.tripTitle, n: 1 })}
          className="!object-contain"
        />
      </div>

      <p className="mt-4 text-[0.9375rem] text-soft">
        {t("media.addedOn", { date: formatDate(media.createdAt, locale) })}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-x-5">
        <Link
          href={`/trips/${media.tripId}`}
          className="voice inline-flex min-h-11 items-center text-lg font-semibold text-accent underline underline-offset-2 [overflow-wrap:anywhere]"
        >
          {media.tripTitle}
        </Link>
        {media.memoryId && (
          <Link
            href={`/memories/${media.memoryId}`}
            className="inline-flex min-h-11 items-center text-accent underline underline-offset-2"
          >
            {t("media.fromMemory")}
          </Link>
        )}
      </div>
      {isCover && <p className="text-[0.9375rem] text-soft">{t("media.isCover")}</p>}

      <div className="mt-8 flex flex-col gap-3 border-t border-rule pt-6 sm:flex-row">
        <form action={setTripCoverAction}>
          <input type="hidden" name="tripId" value={media.tripId} />
          <input type="hidden" name="mediaId" value={isCover ? "" : media.id} />
          <input type="hidden" name="returnTo" value={here} />
          <SubmitButton
            label={isCover ? t("media.removeCover") : t("media.setCover")}
            pendingLabel={t("common.saving")}
            variant="secondary"
            className="w-full sm:w-auto"
          />
        </form>
        <ConfirmDelete
          action={deleteMediaAction}
          id={media.id}
          extraFields={{ returnTo: "/gallery" }}
          triggerLabel={t("media.delete")}
          title={t("media.delete.title")}
          body={t("media.delete.body")}
          confirmLabel={t("media.delete.confirm")}
          pendingLabel={t("common.deleting")}
          cancelLabel={t("common.cancel")}
          triggerClassName={buttonClass("quiet-danger")}
        />
      </div>
    </article>
  );
}
