import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { deletePlaceAction, updatePlaceAction } from "@/features/places/actions";
import { getTrip } from "@/features/trips/service";
import { getT } from "@/lib/i18n/server";
import { ConfirmDelete } from "@/components/ui/confirm-delete";
import { PageHeader } from "@/components/ui/page-header";
import { PlaceForm } from "@/components/place/place-form";

type Props = { params: Promise<{ tripId: string; placeId: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("places.edit") };
}

export default async function EditPlacePage({ params }: Props) {
  const { tripId, placeId } = await params;
  // There is no getPlace(): places come from the trip.
  const [{ t }, trip] = await Promise.all([getT(), getTrip(tripId)]);
  const place = trip?.places.find((p) => p.id === placeId);
  if (!trip || !place) notFound();
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
