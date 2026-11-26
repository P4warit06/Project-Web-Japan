import type { Metadata } from "next";
import { createTripAction } from "@/features/trips/actions";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { TripForm } from "@/components/trip/trip-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("trips.new") };
}

export default async function NewTripPage() {
  const { t } = await getT();
  return (
    <>
      <PageHeader title={t("trips.new")} back={{ href: "/trips", label: t("nav.trips") }} />
      <TripForm action={createTripAction} cancelHref="/trips" />
    </>
  );
}
