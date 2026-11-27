import Link from "next/link";
import { countLabel } from "@/components/format";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusIcon } from "@/components/ui/icons";
import { MemoryStops } from "@/components/memory/memory-stops";
import { TripRouteList } from "@/components/trip/trip-route";
import { dashboard } from "../data";
import { DEMO_USER_NAME, useTitle, useView } from "../view";

export function HomePage() {
  const { t, locale, s } = useView();
  useTitle(t("nav.home"));
  const data = dashboard(s);
  const latest = data.latestTrips[0];
  const addMemoryHref = latest ? `/memories/new?trip=${encodeURIComponent(latest.id)}` : "/trips/new";
  const isEmpty = data.counts.trips === 0;

  return (
    <div className="flex flex-col gap-10">
      <header>
        <h1 className="voice text-[1.875rem] leading-[1.35] font-semibold [overflow-wrap:anywhere]">
          {t("dashboard.greeting", { name: DEMO_USER_NAME })}
        </h1>
        <p className="mt-1 text-soft">
          {isEmpty
            ? t("dashboard.emptyLead")
            : t("dashboard.summary", {
                trips: countLabel(t, locale, "trips", data.counts.trips),
                places: countLabel(t, locale, "places", data.counts.places),
                memories: countLabel(t, locale, "memories", data.counts.memories),
              })}
        </p>
        {!isEmpty && (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <LinkButton href={addMemoryHref}>
              <PlusIcon className="h-5 w-5" />
              {t("memories.new")}
            </LinkButton>
            <LinkButton href="/trips/new" variant="secondary">
              {t("trips.new")}
            </LinkButton>
          </div>
        )}
      </header>

      {isEmpty ? (
        <EmptyState
          title={t("trips.empty.title")}
          body={t("trips.empty.body")}
          action={{ href: "/trips/new", label: t("trips.new") }}
        />
      ) : (
        <>
          <section aria-labelledby="latest-trips">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="latest-trips" className="text-lg font-semibold">
                {t("dashboard.latestTrips")}
              </h2>
              <Link href="/trips" className="-mr-2 inline-flex min-h-11 items-center px-2 text-accent underline underline-offset-2">
                {t("dashboard.seeAllTrips")}
              </Link>
            </div>
            <TripRouteList trips={data.latestTrips} t={t} locale={locale} />
          </section>

          <section aria-labelledby="recent-memories">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 id="recent-memories" className="text-lg font-semibold">
                {t("dashboard.recentMemories")}
              </h2>
              <Link href="/memories" className="-mr-2 inline-flex min-h-11 items-center px-2 text-accent underline underline-offset-2">
                {t("dashboard.seeAllMemories")}
              </Link>
            </div>
            {data.recentMemories.length > 0 ? (
              <MemoryStops memories={data.recentMemories} t={t} locale={locale} showTrip tone="neutral" />
            ) : (
              <EmptyState
                title={t("memories.empty.title")}
                body={t("memories.empty.body")}
                action={{ href: addMemoryHref, label: t("memories.new") }}
              />
            )}
          </section>
        </>
      )}
    </div>
  );
}
