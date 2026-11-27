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

/** Bottom tab bar on phones, left rail on desktop. Labels arrive translated. */
export function TabBar({
  labels,
  navLabel,
  brand,
}: {
  labels: Record<TabKey, string>;
  navLabel: string;
  brand: string;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  return (
    <nav
      aria-label={navLabel}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-rule bg-surface pb-[env(safe-area-inset-bottom)] md:inset-y-0 md:right-auto md:w-[232px] md:border-t-0 md:border-r md:px-4 md:pt-8 md:pb-6"
    >
      <p className="voice mb-8 hidden items-center gap-3 px-3 text-xl font-semibold text-ink md:flex">
        <BrandMark className="shrink-0 text-accent" />
        {brand}
      </p>
      <ul className="grid grid-cols-5 md:flex md:flex-col md:gap-1">
        {TABS.map(({ key, href, Icon, desktopOnly }) => {
          const active = isActive(href);
          // On phones Places has no tab of its own: highlight Trips while on /places.
          const mobileActive = active || (key === "trips" && pathname.startsWith("/places"));
          if (desktopOnly && !active) {
            return (
              <li key={key} className="hidden md:block">
                <Link
                  href={href}
                  className="flex min-h-11 items-center gap-3 rounded px-3 font-medium text-soft hover:text-ink"
                >
                  <Icon className="h-6 w-6 shrink-0" />
                  <span className="truncate">{labels[key]}</span>
                </Link>
              </li>
            );
          }
          return (
            <li key={key} className={desktopOnly ? "hidden md:block" : undefined}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex min-h-[3.75rem] flex-col items-center justify-center gap-0.5 px-1 text-xs leading-tight font-medium md:min-h-11 md:flex-row md:justify-start md:gap-3 md:rounded md:px-3 md:text-base ${
                  active ? "text-accent md:bg-surface-2" : mobileActive ? "text-accent md:text-soft md:hover:text-ink" : "text-soft hover:text-ink"
                }`}
              >
                {mobileActive && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 h-[3px] w-9 rounded-b-full bg-accent md:hidden"
                  />
                )}
                <Icon className="h-6 w-6 shrink-0" />
                <span className="max-w-full truncate">{labels[key]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
