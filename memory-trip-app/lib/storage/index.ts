import "server-only";
import { LocalStorage } from "./local";
import type { StorageProvider } from "./types";

export type { StorageProvider } from "./types";

let instance: StorageProvider | undefined;

/** Chosen by STORAGE_PROVIDER ("local" by default). R2 arrives with the Vercel deployment. */
export function getStorage(): StorageProvider {
  if (instance) return instance;
  const provider = process.env.STORAGE_PROVIDER ?? "local";
  if (provider === "local") {
    if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
      throw new Error("STORAGE_PROVIDER=local cannot be used on Vercel (no persistent disk). Use r2.");
    }
    instance = new LocalStorage(process.env.LOCAL_STORAGE_DIR);
    return instance;
  }
  throw new Error(`Unknown STORAGE_PROVIDER "${provider}"`);
}
