import type { Metadata } from "next";
import Link from "next/link";
import { listTrips } from "@/features/trips/service";
import { getT } from "@/lib/i18n/server";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pager } from "@/components/ui/pager";
import { PlusIcon } from "@/components/ui/icons";
import { TripRouteList } from "@/components/trip/trip-route";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("nav.trips") };
}

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ cursor?: string | string[] }>;
}) {
  const { cursor: raw } = await searchParams;
  const cursor = typeof raw === "string" && raw ? raw : undefined;
  const [{ t, locale }, page] = await Promise.all([getT(), listTrips(cursor)]);
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
      {page.items.length === 0 ? (
        <EmptyState
          title={t("trips.empty.title")}
          body={t("trips.empty.body")}
          action={{ href: "/trips/new", label: t("trips.new") }}
        />
      ) : (
        <TripRouteList trips={page.items} t={t} locale={locale} />
      )}
      <Pager
        basePath="/trips"
        nextCursor={page.nextCursor}
        hasCursor={Boolean(cursor)}
        moreLabel={t("common.loadMore")}
        firstLabel={t("common.backToNewest")}
      />
    </>
  );
}
