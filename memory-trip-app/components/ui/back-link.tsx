import Link from "next/link";
import { ChevronLeftIcon } from "./icons";

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="-ml-2 mb-1 inline-flex min-h-11 items-center gap-1 rounded-lg pr-3 pl-1 text-soft hover:text-ink"
    >
      <ChevronLeftIcon className="h-5 w-5" />
      {label}
    </Link>
  );
}
