import "server-only";
import { LocalStorage } from "./local";
import { createR2Storage } from "./r2";
import type { StorageProvider } from "./types";

export type { StorageProvider } from "./types";

let instance: StorageProvider | undefined;

/** Chosen by STORAGE_PROVIDER: "local" (default, development) or "r2" (production). */
export function getStorage(): StorageProvider {
  if (instance) return instance;
  const provider = process.env.STORAGE_PROVIDER ?? "local";
  if (provider === "local") {
    if (process.env.VERCEL) {
      // Vercel functions have no persistent disk: photos would vanish.
      throw new Error("STORAGE_PROVIDER=local cannot be used on Vercel. Set STORAGE_PROVIDER=r2.");
    }
    // Fixed folder (./storage/uploads): a static path keeps Next from tracing the whole project
    // into the server bundle. Tests construct LocalStorage themselves with a temp folder.
    instance = new LocalStorage();
  } else if (provider === "r2") {
    instance = createR2Storage();
  } else {
    throw new Error(`Unknown STORAGE_PROVIDER "${provider}" (use "local" or "r2").`);
  }
  return instance;
}
