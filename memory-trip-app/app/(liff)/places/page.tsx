import type { Metadata } from "next";
import { listPlaces } from "@/features/places/service";
import { getT } from "@/lib/i18n/server";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pager } from "@/components/ui/pager";
import { PlaceList } from "@/components/place/place-list";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("nav.places") };
}

export default async function PlacesPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string | string[] }>;
}) {
  const { cursor: raw } = await searchParams;
  const cursor = typeof raw === "string" && raw ? raw : undefined;
  const [{ t }, page] = await Promise.all([getT(), listPlaces(cursor)]);
  return (
    <>
      <PageHeader title={t("nav.places")} />
      {page.items.length === 0 ? (
        <EmptyState
          title={t("places.all.empty.title")}
          body={t("places.all.empty.body")}
          action={{ href: "/trips", label: t("nav.trips") }}
        />
      ) : (
        <PlaceList places={page.items} t={t} showTrip />
      )}
      <Pager
        basePath="/places"
        nextCursor={page.nextCursor}
        hasCursor={Boolean(cursor)}
        moreLabel={t("common.loadMore")}
        firstLabel={t("common.backToNewest")}
      />
    </>
  );
}
