import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { updateTripAction } from "@/features/trips/actions";
import { getTrip } from "@/features/trips/service";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { TripForm } from "@/components/trip/trip-form";

type Props = { params: Promise<{ tripId: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("trips.edit") };
}

export default async function EditTripPage({ params }: Props) {
  const { tripId } = await params;
  const [{ t }, trip] = await Promise.all([getT(), getTrip(tripId)]);
  if (!trip) notFound();
  return (
    <>
      <PageHeader title={t("trips.edit")} back={{ href: `/trips/${trip.id}`, label: trip.title }} />
      <TripForm action={updateTripAction} trip={trip} cancelHref={`/trips/${trip.id}`} />
    </>
  );
}
