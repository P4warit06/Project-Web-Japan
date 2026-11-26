import Link from "next/link";
import { buttonClass } from "./button";

/** Cursor paging via ?cursor=. `first` link shows when we are past the first page. */
export function Pager({
  basePath,
  nextCursor,
  hasCursor,
  moreLabel,
  firstLabel,
}: {
  basePath: string;
  nextCursor: string | null;
  hasCursor: boolean;
  moreLabel: string;
  firstLabel: string;
}) {
  if (!nextCursor && !hasCursor) return null;
  return (
    <nav className="mt-8 flex flex-wrap gap-3" aria-label={moreLabel}>
      {hasCursor && (
        <Link href={basePath} className={buttonClass("secondary")}>
          {firstLabel}
        </Link>
      )}
      {nextCursor && (
        <Link href={`${basePath}?cursor=${encodeURIComponent(nextCursor)}`} className={buttonClass("secondary")}>
          {moreLabel}
        </Link>
      )}
    </nav>
  );
}
