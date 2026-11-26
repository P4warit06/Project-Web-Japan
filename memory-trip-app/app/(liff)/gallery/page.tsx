import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listMedia } from "@/features/media/service";
import { getTrip } from "@/features/trips/service";
import { getT } from "@/lib/i18n/server";
import { PhotoGrid } from "@/components/media/photo";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pager } from "@/components/ui/pager";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("nav.gallery") };
}

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string | string[]; trip?: string | string[] }>;
}) {
  const { cursor: rawCursor, trip: rawTrip } = await searchParams;
  const cursor = typeof rawCursor === "string" && rawCursor ? rawCursor : undefined;
  const tripId = typeof rawTrip === "string" && rawTrip ? rawTrip : undefined;
  const [{ t }, page, trip] = await Promise.all([
    getT(),
    listMedia({ tripId, cursor }),
    tripId ? getTrip(tripId) : Promise.resolve(null),
  ]);
  if (tripId && !trip) notFound();
  const basePath = tripId ? `/gallery?trip=${encodeURIComponent(tripId)}` : "/gallery";

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
      {page.items.length === 0 ? (
        <EmptyState
          title={t("gallery.empty.title")}
          body={t("gallery.empty.body")}
          action={{ href: trip ? `/trips/${trip.id}` : "/trips", label: trip ? trip.title : t("nav.trips") }}
        />
      ) : (
        <PhotoGrid items={page.items} t={t} coverThumbUrl={undefined} />
      )}
      <Pager
        basePath={basePath}
        nextCursor={page.nextCursor}
        hasCursor={Boolean(cursor)}
        moreLabel={t("common.loadMore")}
        firstLabel={t("common.backToNewest")}
      />
    </>
  );
}
