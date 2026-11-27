import Link from "next/link";
import type { MediaDTO } from "@/features/media/types";
import type { TFunction } from "@/lib/i18n";
import { filmDate } from "@/components/format";

/** Photos need the session cookie, so they are plain same-origin <img> (not next/image,
 *  whose optimizer fetches without the cookie). Width/height come from the DTO and the
 *  wrapper reserves the space, so nothing jumps while images load. */
export function Photo({
  media,
  alt,
  variant = "thumb",
  className = "",
  priority = false,
}: {
  media: Pick<MediaDTO, "thumbUrl" | "fullUrl" | "width" | "height">;
  alt: string;
  variant?: "thumb" | "full";
  className?: string;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={variant === "full" ? media.fullUrl : media.thumbUrl}
      alt={alt}
      width={media.width}
      height={media.height}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={`block h-full w-full object-cover ${className}`}
    />
  );
}

/** Grid of photo prints linking to the photo page. Alt text comes from titles. */
export function PhotoGrid({
  items,
  t,
  altTitle = "",
  coverThumbUrl,
}: {
  items: (MediaDTO & { tripTitle?: string })[];
  t: TFunction;
  /** Alt text base for photos that carry no tripTitle of their own (trip or memory title). */
  altTitle?: string;
  coverThumbUrl?: string | null;
}) {
  return (
    <ul className="grid grid-cols-3 gap-3 md:grid-cols-4">
      {items.map((m, i) => (
        <li key={m.id} className="print">
          <Link href={`/gallery/${m.id}`} className="print-frame block aspect-square">
            <Photo media={m} alt={t("media.alt", { title: m.tripTitle ?? altTitle, n: i + 1 })} />
            <span className="imprint" aria-hidden="true">
              {filmDate(m.createdAt)}
            </span>
          </Link>
          {coverThumbUrl && m.thumbUrl === coverThumbUrl && (
            <span className="pointer-events-none absolute top-0 left-0 bg-ink px-2 py-0.5 text-xs font-semibold text-paper">
              {t("media.cover.badge")}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Small print for trip rows. Decorative: the trip title is already in the link. */
export function CoverThumb({ url, className = "" }: { url: string; className?: string }) {
  return (
    <span className={`print block shrink-0 ${className}`}>
      <span className="print-frame block h-full w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" width={160} height={160} loading="lazy" decoding="async" className="block h-full w-full object-cover" />
      </span>
    </span>
  );
}
