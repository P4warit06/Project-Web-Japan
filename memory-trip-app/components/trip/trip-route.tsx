import Link from "next/link";
import type { TripSummary } from "@/features/trips/types";
import type { TFunction } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n/config";
import { countLabel, formatTripEnds, lineStyle } from "@/components/format";

/** A trip drawn as a route: start station, line, end station.
 *  Without dates it is a single station. This is the app's signature element. */
export function TripRouteBody({
  trip,
  t,
  locale,
  headingLevel = 3,
  showDescription,
}: {
  trip: TripSummary & { description?: string | null };
  t: TFunction;
  locale: Locale;
  headingLevel?: 1 | 2 | 3;
  showDescription?: boolean;
}) {
  const { from, to } = formatTripEnds(trip.startDate, trip.endDate, locale);
  const Heading = `h${headingLevel}` as "h1" | "h2" | "h3";
  const single = !to;
  return (
    <div className={`route ${single ? "route-single" : ""}`} style={lineStyle(trip.id)}>
      <span className="route-ring route-ring-start" aria-hidden="true" />
      {to && <span className="route-ring route-ring-end" aria-hidden="true" />}
      {from && <p className="text-[0.9375rem] text-soft">{from}</p>}
      <Heading
        className={`voice font-semibold [overflow-wrap:anywhere] ${
          headingLevel === 1 ? "text-[1.75rem] leading-[1.35]" : "text-xl leading-[1.4]"
        } ${from ? "my-0.5" : ""}`}
      >
        {trip.title}
      </Heading>
      {showDescription && trip.description && (
        <p className="voice user-text my-2 text-soft">{trip.description}</p>
      )}
      <p className={`text-[0.9375rem] text-soft ${to ? "mb-1" : ""}`}>
        {countLabel(t, locale, "places", trip.placeCount)}, {countLabel(t, locale, "memories", trip.memoryCount)}
      </p>
      {to && <p className="text-[0.9375rem] text-soft">{to}</p>}
    </div>
  );
}

export function TripRouteLink({
  trip,
  t,
  locale,
}: {
  trip: TripSummary;
  t: TFunction;
  locale: Locale;
}) {
  return (
    <Link
      href={`/trips/${trip.id}`}
      className="-my-2 block rounded-lg py-2 hover:bg-surface-2/60 active:bg-surface-2"
    >
      <TripRouteBody trip={trip} t={t} locale={locale} />
    </Link>
  );
}

export function TripRouteList({
  trips,
  t,
  locale,
}: {
  trips: TripSummary[];
  t: TFunction;
  locale: Locale;
}) {
  return (
    <ul className="flex flex-col gap-8">
      {trips.map((trip) => (
        <li key={trip.id}>
          <TripRouteLink trip={trip} t={t} locale={locale} />
        </li>
      ))}
    </ul>
  );
}
