// Pure helpers (safe in Server and Client Components).
// Dates are "floating" local times stored as UTC, so everything is formatted in UTC:
// a memory typed as 21:00 must read 21:00 whatever the viewer's time zone is.
// Years are Gregorian (th-TH-u-ca-gregory) so photos, phones and LINE all agree.
import type { Locale } from "@/lib/i18n/config";
import type { MessageKey, TFunction } from "@/lib/i18n";

function tag(locale: Locale): string {
  return locale === "th" ? "th-TH-u-ca-gregory" : "en-GB";
}

function parse(iso: string): Date | null {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmt(iso: string, locale: Locale, options: Intl.DateTimeFormatOptions): string {
  const d = parse(iso);
  if (!d) return "";
  return new Intl.DateTimeFormat(tag(locale), { timeZone: "UTC", ...options }).format(d);
}

export function formatDate(iso: string, locale: Locale): string {
  return fmt(iso, locale, { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(iso: string, locale: Locale): string {
  return fmt(iso, locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export function formatMonth(iso: string, locale: Locale): string {
  return fmt(iso, locale, { month: "long", year: "numeric" });
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

/** Start and end labels of a trip; either may be null. */
export function formatTripEnds(
  start: string | null,
  end: string | null,
  locale: Locale,
): { from: string | null; to: string | null } {
  return {
    from: start ? formatDate(start, locale) : null,
    to: end && end !== start ? formatDate(end, locale) : null,
  };
}

/** `<input type="date">` value from an ISO string. */
export function toDateInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 10) : "";
}

/** `<input type="datetime-local">` value from an ISO string. */
export function toDateTimeInput(iso: string | null | undefined): string {
  return iso ? iso.slice(0, 16) : "";
}

const LINE_COUNT = 6;

/** Stable colour per trip, so a trip is the same line everywhere. */
export function tripColorIndex(tripId: string): number {
  let h = 0;
  for (let i = 0; i < tripId.length; i++) h = (h * 31 + tripId.charCodeAt(i)) >>> 0;
  return h % LINE_COUNT;
}

export function lineStyle(tripId: string): React.CSSProperties {
  return { "--line": `var(--line-${tripColorIndex(tripId)})` } as React.CSSProperties;
}

type CountKind = "trips" | "places" | "memories" | "photos";

/** "1 trip" / "3 trips" using Intl.PluralRules so both languages stay correct. */
export function countLabel(t: TFunction, locale: Locale, kind: CountKind, n: number): string {
  const form = new Intl.PluralRules(locale).select(n) === "one" ? "one" : "other";
  return t(`count.${kind}.${form}` as MessageKey, { count: n });
}

export function mapsHref(place: {
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}): string {
  const q =
    place.latitude != null && place.longitude != null
      ? `${place.latitude},${place.longitude}`
      : [place.name, place.address].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}
