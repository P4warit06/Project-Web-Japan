"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BrandMark,
  HomeIcon,
  GalleryIcon,
  MemoriesIcon,
  PlacesIcon,
  SettingsIcon,
  TripsIcon,
} from "@/components/ui/icons";

export type TabKey = "home" | "trips" | "memories" | "gallery" | "places" | "settings";

// Six destinations do not fit a 360px bar with 44px+ targets and Thai labels, so phones get
// five tabs: Places is reached from the Trips page (and counts as "Trips" while open).
// The desktop rail has room for all six.
const TABS: { key: TabKey; href: string; Icon: typeof HomeIcon; desktopOnly?: boolean; mobileGroup?: string }[] = [
  { key: "home", href: "/", Icon: HomeIcon },
  { key: "trips", href: "/trips", Icon: TripsIcon },
  { key: "memories", href: "/memories", Icon: MemoriesIcon },
  { key: "gallery", href: "/gallery", Icon: GalleryIcon },
  { key: "places", href: "/places", Icon: PlacesIcon, desktopOnly: true },
  { key: "settings", href: "/settings", Icon: SettingsIcon },
];

/** Bottom tab bar on phones; on wide screens a top bar like a website: name on the left, links
 *  in the middle, one button on the right, a 3px ink line above. Labels arrive translated. */
export function TabBar({
  labels,
  navLabel,
  brand,
  cta,
}: {
  labels: Record<TabKey, string>;
  navLabel: string;
  brand: string;
  /** The one primary action, shown on the right of the top bar. */
  cta: { href: string; label: string };
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <nav
      aria-label={navLabel}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-surface pb-[env(safe-area-inset-bottom)] lg:top-0 lg:bottom-auto lg:h-[var(--nav-h)] lg:border-t-[3px] lg:border-t-ink lg:border-b lg:border-b-rule lg:bg-paper lg:pb-0"
    >
      <div className="mx-auto lg:flex lg:h-full lg:max-w-[84rem] lg:items-center lg:justify-between lg:gap-6 lg:px-8">
        <Link href="/" className="hidden shrink-0 items-center gap-2.5 text-ink lg:flex" aria-label={brand}>
          <BrandMark className="text-accent" />
          <span className="display text-[1.875rem] leading-none">{brand}</span>
        </Link>
        <ul className="grid grid-cols-5 lg:flex lg:items-center lg:gap-1">
          {TABS.map(({ key, href, Icon, desktopOnly }) => {
            const active = isActive(href);
            // On phones Places has no tab of its own: highlight Trips while on /places.
            const mobileActive = active || (key === "trips" && pathname.startsWith("/places"));
            return (
              <li key={key} className={desktopOnly ? "hidden lg:block" : undefined}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`relative flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5 px-1 text-xs leading-tight font-medium lg:min-h-11 lg:flex-row lg:rounded-[var(--radius-control)] lg:px-4 lg:text-base ${
                    active
                      ? "text-accent lg:bg-surface-2 lg:text-ink lg:font-semibold"
                      : mobileActive
                        ? "text-accent lg:text-soft lg:hover:text-ink"
                        : "text-soft hover:text-ink"
                  }`}
                >
                  {mobileActive && (
                    <span aria-hidden="true" className="absolute top-0 h-[3px] w-9 rounded-b-full bg-accent lg:hidden" />
                  )}
                  <Icon className="h-6 w-6 shrink-0 lg:hidden" />
                  <span className="max-w-full truncate">{labels[key]}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="hidden shrink-0 lg:block">
          <Link href={cta.href} className="btn btn-primary">
            {cta.label}
          </Link>
        </div>
      </div>
    </nav>
  );
}
