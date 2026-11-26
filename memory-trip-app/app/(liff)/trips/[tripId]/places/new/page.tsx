import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createPlaceAction } from "@/features/places/actions";
import { getTrip } from "@/features/trips/service";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { PlaceForm } from "@/components/place/place-form";

type Props = { params: Promise<{ tripId: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("places.new") };
}

export default async function NewPlacePage({ params }: Props) {
  const { tripId } = await params;
  const [{ t }, trip] = await Promise.all([getT(), getTrip(tripId)]);
  if (!trip) notFound();
  return (
    <>
      <PageHeader title={t("places.new")} back={{ href: `/trips/${trip.id}`, label: trip.title }} />
      <PlaceForm action={createPlaceAction} tripId={trip.id} cancelHref={`/trips/${trip.id}`} />
    </>
  );
}
