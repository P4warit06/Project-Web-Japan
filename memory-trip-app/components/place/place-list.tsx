import Link from "next/link";
import type { PlaceDTO, PlaceWithTrip } from "@/features/places/types";
import type { TFunction } from "@/lib/i18n";
import { mapsHref } from "@/components/format";
import { ExternalIcon } from "@/components/ui/icons";

export function PlaceList({
  places,
  t,
  showTrip = false,
}: {
  places: (PlaceDTO | PlaceWithTrip)[];
  t: TFunction;
  showTrip?: boolean;
}) {
  return (
    <ul className="border-t border-rule">
      {places.map((p) => (
        <li key={p.id} className="border-b border-rule py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="voice text-lg leading-[1.4] font-semibold [overflow-wrap:anywhere]">{p.name}</h3>
              {showTrip && "tripTitle" in p && (
                <Link
                  href={`/trips/${p.tripId}`}
                  className="inline-flex min-h-11 items-center text-[0.9375rem] leading-snug text-accent underline underline-offset-2"
                >
                  {p.tripTitle}
                </Link>
              )}
            </div>
            <Link
              href={`/trips/${p.tripId}/places/${p.id}/edit`}
              className="-mt-1 -mr-2 inline-flex min-h-11 shrink-0 items-center rounded px-3 text-accent hover:bg-surface-2"
              aria-label={`${t("common.edit")}: ${p.name}`}
            >
              {t("common.edit")}
            </Link>
          </div>
          {p.address && <p className="text-[0.9375rem] text-soft [overflow-wrap:anywhere]">{p.address}</p>}
          {p.note && <p className="voice user-text mt-1" style={{ lineHeight: 1.85 }}>{p.note}</p>}
          <a
            href={mapsHref(p)}
            target="_blank"
            rel="noopener noreferrer"
            className="-mb-2 mt-1 inline-flex min-h-11 items-center gap-1.5 text-[0.9375rem] text-accent underline underline-offset-2"
          >
            {t("places.openMap")}
            <ExternalIcon className="h-4 w-4" />
          </a>
        </li>
      ))}
    </ul>
  );
}
