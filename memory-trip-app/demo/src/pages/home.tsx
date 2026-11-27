import Link from "next/link";
import { countLabel } from "@/components/format";
import { LinkButton } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PlusIcon } from "@/components/ui/icons";
import { MemoryStops } from "@/components/memory/memory-stops";
import { Reveal } from "@/components/motion/reveal";
import { Hero } from "@/components/shell/hero";
import { Statement } from "@/components/shell/statement";
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
    <>
      <div>
        <Hero
          title={t("dashboard.hero.title")}
          sub={t("dashboard.hero.sub")}
          cta={
            <LinkButton href={addMemoryHref} variant="light">
              <PlusIcon className="h-5 w-5" />
              {t("memories.new")}
            </LinkButton>
          }
        />
        <Statement lead={t("dashboard.statement.lead")} emphasis={t("dashboard.statement.emphasis")} />
      </div>
    <div className="mt-12 flex flex-col gap-10">
      <header>
        <h2 className="display text-[clamp(2rem,5vw,3rem)] [overflow-wrap:anywhere]">
          {t("dashboard.greeting", { name: DEMO_USER_NAME })}
        </h2>
        <p className="mt-2 text-soft">
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
          <Reveal>
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
          </Reveal>

          <Reveal>
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
          </Reveal>
        </>
      )}
    </div>
    </>
  );
}
