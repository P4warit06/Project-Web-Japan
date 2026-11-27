// Stands in for "next/navigation" in the demo build. Only what the shared components use.
import { navigate, useLocation } from "../router";

export function usePathname(): string {
  return useLocation().path;
}

export function useSearchParams(): URLSearchParams {
  return useLocation().query;
}

export function useRouter() {
  return {
    push: (path: string) => navigate(path),
    replace: (path: string) => navigate(path, { replace: true }),
    back: () => window.history.back(),
    // The demo screens read the store directly, so there is nothing to refresh.
    refresh: () => {},
  };
}
