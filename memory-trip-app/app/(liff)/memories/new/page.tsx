import type { Metadata } from "next";
import { createMemoryAction } from "@/features/memories/actions";
import { getTrip, listTrips } from "@/features/trips/service";
import { getT } from "@/lib/i18n/server";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { MemoryForm } from "@/components/memory/memory-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("memories.new") };
}

export default async function NewMemoryPage({
  searchParams,
}: {
  searchParams: Promise<{ trip?: string | string[] }>;
}) {
  const { trip: rawTrip } = await searchParams;
  const preselected = typeof rawTrip === "string" ? rawTrip : undefined;
  const [{ t }, page] = await Promise.all([getT(), listTrips()]);

  const options = page.items.map((trip) => ({ value: trip.id, label: trip.title }));
  // The preselected trip may sit beyond the first page of trips: add it explicitly.
  if (preselected && !options.some((o) => o.value === preselected)) {
    const extra = await getTrip(preselected);
    if (extra) options.unshift({ value: extra.id, label: extra.title });
  }

  if (options.length === 0) {
    return (
      <>
        <PageHeader title={t("memories.new")} back={{ href: "/memories", label: t("nav.memories") }} />
        <EmptyState
          title={t("memories.needTrip.title")}
          body={t("memories.needTrip.body")}
          action={{ href: "/trips/new", label: t("trips.new") }}
        />
      </>
    );
  }

  const tripId = options.some((o) => o.value === preselected) ? preselected! : options[0].value;
  return (
    <>
      <PageHeader title={t("memories.new")} back={{ href: "/memories", label: t("nav.memories") }} />
      <MemoryForm
        action={createMemoryAction}
        tripId={tripId}
        tripOptions={options}
        cancelHref={`/trips/${tripId}`}
      />
    </>
  );
}
