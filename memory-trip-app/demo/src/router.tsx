// A tiny router that keeps the page in the URL hash (#/trips/abc). GitHub Pages can only
// serve files, so a "real" path such as /trips/abc would be a 404 after a refresh; a hash
// never reaches the server. Reference: https://developer.mozilla.org/docs/Web/API/Window/hashchange_event
import { m } from "motion/react";
import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";

function subscribe(listener: () => void) {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}
const snapshot = () => window.location.hash;

export type Location = { path: string; query: URLSearchParams };

/** "#/trips/abc?x=1" -> { path: "/trips/abc", query: x=1 }. Anything odd becomes "/". */
export function parseHash(hash: string): Location {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const [pathPart, ...rest] = raw.split("?");
  const path = pathPart.startsWith("/") ? pathPart.replace(/\/+$/, "") || "/" : "/";
  return { path, query: new URLSearchParams(rest.join("?")) };
}

export function useLocation(): Location {
  const hash = useSyncExternalStore(subscribe, snapshot, () => "");
  return useMemo(() => parseHash(hash), [hash]);
}

/** Only in-app paths ("/trips/abc") are accepted, so a form can never send you elsewhere. */
function isInternal(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\");
}

export function navigate(path: string, options: { replace?: boolean } = {}) {
  if (!isInternal(path)) return;
  const url = `#${path}`;
  if (options.replace) window.history.replaceState(null, "", url);
  else window.location.hash = path;
  if (options.replace) window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export type Params = Record<string, string>;
export type Route = { path: string; render: (params: Params) => ReactNode };

/** Matches "/trips/:tripId/edit" against "/trips/abc/edit". */
export function matchRoute(pattern: string, path: string): Params | null {
  const a = pattern.split("/").filter(Boolean);
  const b = path.split("/").filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Params = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) {
      try {
        params[a[i].slice(1)] = decodeURIComponent(b[i]);
      } catch {
        return null;
      }
    } else if (a[i] !== b[i]) {
      return null;
    }
  }
  return params;
}

export function Routes({ routes, fallback }: { routes: Route[]; fallback: ReactNode }) {
  const { path } = useLocation();
  // A new page starts at the top, and focus moves to the content (keyboard / screen reader users).
  useEffect(() => {
    window.scrollTo(0, 0);
    document.getElementById("main")?.focus({ preventScroll: true });
  }, [path]);
  for (const route of routes) {
    const params = matchRoute(route.path, path);
    if (params) {
      // Keyed by path: each page settles in with a small rise (skipped for reduced motion).
      return (
        <m.div key={path} initial={{ y: 10 }} animate={{ y: 0 }} transition={{ duration: 0.35, ease: [0.22, 0.8, 0.3, 1] }}>
          {route.render(params)}
        </m.div>
      );
    }
  }
  return <>{fallback}</>;
}
