import Link from "next/link";
import { filmDate, formatDate, lineStyle } from "@/components/format";
import { Photo, PhotoGrid } from "@/components/media/photo";
import { BackLink } from "@/components/ui/back-link";
import { buttonClass } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteMediaAction, setTripCoverAction } from "../actions";
import { getMedia, getTrip, listMedia } from "../data";
import { useLocation } from "../router";
import { NotFound, useTitle, useView } from "../view";

export function GalleryPage() {
  const { t, s } = useView();
  const { query } = useLocation();
  useTitle(t("nav.gallery"));
  const tripId = query.get("trip") || undefined;
  const trip = tripId ? getTrip(s, tripId) : null;
  if (tripId && !trip) return <NotFound />;
  const items = listMedia(s, tripId);
  return (
    <>
      <PageHeader title={t("nav.gallery")}>
        {trip && (
          <p className="mt-1 text-soft">
            {t("gallery.filteredBy", { title: trip.title })}{" "}
            <Link href="/gallery" className="inline-flex min-h-11 items-center text-accent underline underline-offset-2">
              {t("gallery.showAll")}
            </Link>
          </p>
        )}
      </PageHeader>
      {items.length === 0 ? (
        <EmptyState
          title={t("gallery.empty.title")}
          body={t("gallery.empty.body")}
          action={{ href: trip ? `/trips/${trip.id}` : "/trips", label: trip ? trip.title : t("nav.trips") }}
        />
      ) : (
        <PhotoGrid items={items} t={t} coverThumbUrl={undefined} />
      )}
    </>
  );
}

export function PhotoPage({ mediaId }: { mediaId: string }) {
  const { t, locale, s } = useView();
  const media = getMedia(s, mediaId);
  useTitle(media?.tripTitle);
  if (!media) return <NotFound />;
  const trip = getTrip(s, media.tripId);
  const isCover = Boolean(trip?.coverThumbUrl && trip.coverThumbUrl === media.thumbUrl);
  const here = `/gallery/${media.id}`;

  return (
    <article>
      <BackLink href="/gallery" label={t("nav.gallery")} />
      <div className="print print-lg mx-auto mb-2 border-b-[5px] border-[var(--line)]" style={lineStyle(media.tripId)}>
        <div className="print-frame mx-auto max-h-[72dvh]" style={{ aspectRatio: `${media.width} / ${media.height}` }}>
          <Photo media={media} variant="full" priority alt={t("media.alt", { title: media.tripTitle, n: 1 })} className="!object-contain" />
          <span className="imprint" aria-hidden="true">
            {filmDate(media.createdAt)}
          </span>
        </div>
      </div>

      <p className="mt-4 text-[0.9375rem] text-soft">{t("media.addedOn", { date: formatDate(media.createdAt, locale) })}</p>
      <div className="mt-1 flex flex-wrap items-center gap-x-5">
        <Link
          href={`/trips/${media.tripId}`}
          className="voice inline-flex min-h-11 items-center text-lg font-semibold text-accent underline underline-offset-2 [overflow-wrap:anywhere]"
        >
          {media.tripTitle}
        </Link>
        {media.memoryId && (
          <Link href={`/memories/${media.memoryId}`} className="inline-flex min-h-11 items-center text-accent underline underline-offset-2">
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
