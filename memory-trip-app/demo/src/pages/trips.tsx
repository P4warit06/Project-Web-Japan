import Link from "next/link";
import { BackLink } from "@/components/ui/back-link";
import { filmDate, lineStyle } from "@/components/format";
import { Photo, PhotoGrid } from "@/components/media/photo";
import { PhotoUploader } from "@/components/media/photo-uploader";
import { LinkButton, buttonClass } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusIcon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { MemoryStops } from "@/components/memory/memory-stops";
import { PlaceForm } from "@/components/place/place-form";
import { PlaceList } from "@/components/place/place-list";
import { TripForm } from "@/components/trip/trip-form";
import { TripRouteBody, TripRouteList } from "@/components/trip/trip-route";
import {
  createPlaceAction,
  createTripAction,
  deletePlaceAction,
  deleteTripAction,
  updatePlaceAction,
  updateTripAction,
} from "../actions";
import { getTrip, listPlaces, listTrips } from "../data";
import { NotFound, useTitle, useView } from "../view";

export function TripsPage() {
  const { t, locale, s } = useView();
  useTitle(t("nav.trips"));
  const trips = listTrips(s);
  return (
    <>
      <PageHeader
        title={t("nav.trips")}
        actions={
          <LinkButton href="/trips/new">
            <PlusIcon className="h-5 w-5" />
            {t("trips.new")}
          </LinkButton>
        }
      >
        <Link href="/places" className="btn btn-ghost -ml-2 mt-1">
          {t("places.all")}
        </Link>
      </PageHeader>
      {trips.length === 0 ? (
        <EmptyState
          title={t("trips.empty.title")}
          body={t("trips.empty.body")}
          action={{ href: "/trips/new", label: t("trips.new") }}
        />
      ) : (
        <TripRouteList trips={trips} t={t} locale={locale} />
      )}
    </>
  );
}

export function NewTripPage() {
  const { t } = useView();
  useTitle(t("trips.new"));
  return (
    <>
      <PageHeader title={t("trips.new")} back={{ href: "/trips", label: t("nav.trips") }} />
      <TripForm action={createTripAction} cancelHref="/trips" />
    </>
  );
}

export function EditTripPage({ tripId }: { tripId: string }) {
  const { t, s } = useView();
  useTitle(t("trips.edit"));
  const trip = getTrip(s, tripId);
  if (!trip) return <NotFound />;
  return (
    <>
      <PageHeader title={t("trips.edit")} back={{ href: `/trips/${trip.id}`, label: trip.title }} />
      <TripForm action={updateTripAction} trip={trip} cancelHref={`/trips/${trip.id}`} />
    </>
  );
}

export function TripPage({ tripId }: { tripId: string }) {
  const { t, locale, s } = useView();
  const trip = getTrip(s, tripId);
  useTitle(trip?.title);
  if (!trip) return <NotFound />;

  const cover = trip.coverThumbUrl ? trip.media.find((m) => m.thumbUrl === trip.coverThumbUrl) : undefined;
  const GRID_LIMIT = 9;

  return (
    <div className="draw flex flex-col gap-10">
      <div>
        <BackLink href="/trips" label={t("nav.trips")} />
        {trip.coverThumbUrl && (
          <div className="print print-lg mb-6 border-b-[5px] border-[var(--line)]" style={lineStyle(trip.id)}>
            <div className="print-frame aspect-[16/10]">
              <Photo
                media={cover ?? { thumbUrl: trip.coverThumbUrl, fullUrl: trip.coverThumbUrl, width: 480, height: 300 }}
                variant="full"
                priority
                alt={t("media.coverAlt", { title: trip.title })}
              />
              {cover && (
                <span className="imprint" aria-hidden="true">
                  {filmDate(cover.createdAt)}
                </span>
              )}
            </div>
          </div>
        )}
        <TripRouteBody trip={trip} t={t} locale={locale} headingLevel={1} showDescription />
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <LinkButton href={`/memories/new?trip=${encodeURIComponent(trip.id)}`}>
            <PlusIcon className="h-5 w-5" />
            {t("memories.new")}
          </LinkButton>
          <LinkButton href={`/trips/${trip.id}/places/new`} variant="secondary">
            <PlusIcon className="h-5 w-5" />
            {t("places.new")}
          </LinkButton>
        </div>
      </div>

      <section aria-labelledby="trip-photos">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="trip-photos" className="text-lg font-semibold">
            {t("media.title")}
          </h2>
          {trip.media.length > GRID_LIMIT && (
            <Link
              href={`/gallery?trip=${encodeURIComponent(trip.id)}`}
              className="-mr-2 inline-flex min-h-11 items-center px-2 text-accent underline underline-offset-2"
            >
              {t("media.viewAll")}
            </Link>
          )}
        </div>
        <PhotoUploader tripId={trip.id} />
        {trip.media.length > 0 ? (
          <div className="mt-4">
            <PhotoGrid items={trip.media.slice(0, GRID_LIMIT)} t={t} altTitle={trip.title} coverThumbUrl={trip.coverThumbUrl} />
          </div>
        ) : (
          <p className="mt-3 text-soft">{t("media.empty")}</p>
        )}
      </section>

      <section aria-labelledby="trip-places">
        <h2 id="trip-places" className="mb-3 text-lg font-semibold">
          {t("trips.places")}
        </h2>
        {trip.places.length > 0 ? (
          <PlaceList places={trip.places} t={t} />
        ) : (
          <EmptyState
            title={t("places.empty.title")}
            body={t("places.empty.body")}
            action={{ href: `/trips/${trip.id}/places/new`, label: t("places.new") }}
          />
        )}
      </section>

      <section aria-labelledby="trip-memories">
        <h2 id="trip-memories" className="mb-4 text-lg font-semibold">
          {t("trips.memories")}
        </h2>
        {trip.memories.length > 0 ? (
          <MemoryStops memories={trip.memories} t={t} locale={locale} draw />
        ) : (
          <EmptyState
            title={t("memories.empty.title")}
            body={t("memories.empty.body")}
            action={{ href: `/memories/new?trip=${encodeURIComponent(trip.id)}`, label: t("memories.new") }}
          />
        )}
      </section>

      <div className="flex flex-col gap-3 border-t border-rule pt-6 sm:flex-row">
        <Link href={`/trips/${trip.id}/edit`} className={buttonClass("secondary")}>
          {t("trips.edit")}
        </Link>
        <ConfirmDelete
          action={deleteTripAction}
          id={trip.id}
          triggerLabel={t("trips.delete")}
          title={t("trips.delete.title")}
          body={t("trips.delete.body", { title: trip.title })}
          confirmLabel={t("trips.delete.confirm")}
          pendingLabel={t("common.deleting")}
          cancelLabel={t("common.cancel")}
        />
      </div>
    </div>
  );
}

export function NewPlacePage({ tripId }: { tripId: string }) {
  const { t, s } = useView();
  useTitle(t("places.new"));
  const trip = getTrip(s, tripId);
  if (!trip) return <NotFound />;
  return (
    <>
      <PageHeader title={t("places.new")} back={{ href: `/trips/${trip.id}`, label: trip.title }} />
      <PlaceForm action={createPlaceAction} tripId={trip.id} cancelHref={`/trips/${trip.id}`} />
    </>
  );
}

export function EditPlacePage({ tripId, placeId }: { tripId: string; placeId: string }) {
  const { t, s } = useView();
  useTitle(t("places.edit"));
  const trip = getTrip(s, tripId);
  const place = trip?.places.find((p) => p.id === placeId);
  if (!trip || !place) return <NotFound />;
  return (
    <>
      <PageHeader title={t("places.edit")} back={{ href: `/trips/${trip.id}`, label: trip.title }} />
      <PlaceForm action={updatePlaceAction} tripId={trip.id} place={place} cancelHref={`/trips/${trip.id}`} />
      <div className="mt-10 border-t border-rule pt-6">
        <ConfirmDelete
          action={deletePlaceAction}
          id={place.id}
          triggerLabel={t("places.delete")}
          title={t("places.delete.title")}
          body={t("places.delete.body", { name: place.name })}
          confirmLabel={t("places.delete.confirm")}
          pendingLabel={t("common.deleting")}
          cancelLabel={t("common.cancel")}
        />
      </div>
    </>
  );
}

export function PlacesPage() {
  const { t, s } = useView();
  useTitle(t("nav.places"));
  const places = listPlaces(s);
  return (
    <>
      <PageHeader title={t("nav.places")} />
      {places.length === 0 ? (
        <EmptyState
          title={t("places.all.empty.title")}
          body={t("places.all.empty.body")}
          action={{ href: "/trips", label: t("nav.trips") }}
        />
      ) : (
        <PlaceList places={places} t={t} showTrip />
      )}
    </>
  );
}
