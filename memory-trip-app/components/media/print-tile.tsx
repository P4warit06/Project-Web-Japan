"use client";

import Link from "next/link";
import { m } from "motion/react";
import { filmDate } from "@/components/format";
import { itemVariants } from "@/components/motion/reveal";
import type { MediaDTO } from "@/features/media/types";

/** One photo print in a grid. It lifts and turns a little under the pointer and presses in
 *  when tapped: motion that answers what the person does. Strings arrive translated. */
export function PrintTile({
  media,
  index,
  alt,
  badge,
}: {
  media: Pick<MediaDTO, "id" | "thumbUrl" | "fullUrl" | "width" | "height" | "createdAt">;
  index: number;
  alt: string;
  /** Text of the "cover" badge, when this photo is the trip cover. */
  badge?: string;
}) {
  const tilt = index % 2 === 0 ? -1.2 : 1.2;
  return (
    <m.li
      className="print"
      variants={itemVariants}
      whileHover={{ y: -5, rotate: tilt, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
    >
      <Link href={`/gallery/${media.id}`} className="print-frame block aspect-square">
        {/* plain <img>: photos need the session cookie, see Photo in photo.tsx */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media.thumbUrl}
          alt={alt}
          width={media.width}
          height={media.height}
          loading="lazy"
          decoding="async"
          className="block h-full w-full object-cover"
        />
        <span className="imprint" aria-hidden="true">
          {filmDate(media.createdAt)}
        </span>
      </Link>
      {badge && (
        <span className="pointer-events-none absolute top-0 left-0 bg-ink px-2 py-0.5 text-xs font-semibold text-paper">
          {badge}
        </span>
      )}
    </m.li>
  );
}
