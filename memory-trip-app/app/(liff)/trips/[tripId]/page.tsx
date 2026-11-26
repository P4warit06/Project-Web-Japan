import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteTripAction } from "@/features/trips/actions";
import { getTrip } from "@/features/trips/service";
import { getT } from "@/lib/i18n/server";
import { BackLink } from "@/components/ui/back-link";
import { LinkButton, buttonClass } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusIcon } from "@/components/ui/icons";
import { MemoryStops } from "@/components/memory/memory-stops";
import { PlaceList } from "@/components/place/place-list";
import { TripRouteBody } from "@/components/trip/trip-route";

type Props = { params: Promise<{ tripId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tripId } = await params;
  const trip = await getTrip(tripId);
  return { title: trip?.title ?? undefined };
}

export default async function TripPage({ params }: Props) {
  const { tripId } = await params;
  const [{ t, locale }, trip] = await Promise.all([getT(), getTrip(tripId)]);
  if (!trip) notFound();

  return (
    <div className="draw flex flex-col gap-10">
      <div>
        <BackLink href="/trips" label={t("nav.trips")} />
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
