import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve, sep } from "node:path";
import { randomUUID } from "node:crypto";
import { assertSafeKey, type StorageProvider } from "./types";

/** Development storage on the local disk. NEVER inside `public/`: files there are served
 *  to anyone with the URL. Photos are served only through the authenticated /api/media route. */
export class LocalStorage implements StorageProvider {
  private readonly root: string;

  constructor(rootDir: string = join(process.cwd(), "storage", "uploads")) {
    this.root = resolve(rootDir);
  }

  private pathFor(key: string): string {
    assertSafeKey(key);
    const full = resolve(this.root, key);
    if (!full.startsWith(this.root + sep)) throw new Error("Unsafe storage key");
    return full;
  }

  async put(key: string, data: Buffer): Promise<void> {
    const target = this.pathFor(key);
    await mkdir(dirname(target), { recursive: true });
    // Write to a temp file then rename, so readers never see a half-written image.
    const tmp = `${target}.${randomUUID()}.tmp`;
    await writeFile(tmp, data, { mode: 0o600 });
    await rename(tmp, target);
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      return await readFile(this.pathFor(key));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }
}
