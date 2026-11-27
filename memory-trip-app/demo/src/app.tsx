import { useEffect } from "react";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { TabBar } from "@/components/shell/tab-bar";
import { Routes, type Route } from "./router";
import { demoText } from "./strings";
import { NotFound, useView } from "./view";
import { GalleryPage, PhotoPage } from "./pages/gallery";
import { HomePage } from "./pages/home";
import { EditMemoryPage, MemoriesPage, MemoryPage, NewMemoryPage } from "./pages/memories";
import { SettingsPage } from "./pages/settings";
import { EditPlacePage, EditTripPage, NewPlacePage, NewTripPage, PlacesPage, TripPage, TripsPage } from "./pages/trips";

// Order matters only where two patterns have the same length: fixed words ("new") first.
const routes: Route[] = [
  { path: "/", render: () => <HomePage /> },
  { path: "/trips", render: () => <TripsPage /> },
  { path: "/trips/new", render: () => <NewTripPage /> },
  { path: "/trips/:tripId", render: (p) => <TripPage tripId={p.tripId} /> },
  { path: "/trips/:tripId/edit", render: (p) => <EditTripPage tripId={p.tripId} /> },
  { path: "/trips/:tripId/places/new", render: (p) => <NewPlacePage tripId={p.tripId} /> },
  { path: "/trips/:tripId/places/:placeId/edit", render: (p) => <EditPlacePage tripId={p.tripId} placeId={p.placeId} /> },
  { path: "/places", render: () => <PlacesPage /> },
  { path: "/memories", render: () => <MemoriesPage /> },
  { path: "/memories/new", render: () => <NewMemoryPage /> },
  { path: "/memories/:memoryId", render: (p) => <MemoryPage memoryId={p.memoryId} /> },
  { path: "/memories/:memoryId/edit", render: (p) => <EditMemoryPage memoryId={p.memoryId} /> },
  { path: "/gallery", render: () => <GalleryPage /> },
  { path: "/gallery/:mediaId", render: (p) => <PhotoPage mediaId={p.mediaId} /> },
  { path: "/settings", render: () => <SettingsPage /> },
];

function Shell() {
  const { t, locale } = useView();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return (
    <div className="md:pl-[232px]">
      <a
        href="#main"
        onClick={(e) => {
          // A plain "#main" link would change the route, so move focus by hand instead.
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-3 focus:font-semibold"
      >
        {t("a11y.skip")}
      </a>
      <TabBar
        brand={t("app.name")}
        navLabel={t("nav.label")}
        labels={{
          home: t("nav.home"),
          trips: t("nav.trips"),
          memories: t("nav.memories"),
          gallery: t("nav.gallery"),
          places: t("nav.places"),
          settings: t("nav.settings"),
        }}
      />
      <main
        id="main"
        tabIndex={-1}
        className="mx-auto w-full max-w-[42rem] pt-[calc(1.5rem+env(safe-area-inset-top))] pr-[max(1rem,env(safe-area-inset-right))] pb-[calc(6.5rem+env(safe-area-inset-bottom))] pl-[max(1rem,env(safe-area-inset-left))] md:px-10 md:pt-12 md:pb-20"
      >
        <p role="note" className="mb-6 rounded-[var(--radius-control)] bg-surface-2 px-4 py-3 text-[0.9375rem]">
          {demoText[locale].banner}
        </p>
        <Routes routes={routes} fallback={<NotFound />} />
      </main>
    </div>
  );
}

export function App() {
  const { locale } = useView();
  return (
    <LocaleProvider locale={locale}>
      <Shell />
    </LocaleProvider>
  );
}
