// SECURITY: storage keys must never escape the upload folder.
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalStorage } from "@/lib/storage/local";
import { assertSafeKey } from "@/lib/storage/types";

let dir: string;
let storage: LocalStorage;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "mt-storage-"));
  storage = new LocalStorage(dir);
});
afterEach(() => rm(dir, { recursive: true, force: true }));

describe("LocalStorage", () => {
  it("stores, reads and deletes", async () => {
    await storage.put("couple1/abc-123.webp", Buffer.from("hello"));
    expect((await storage.get("couple1/abc-123.webp"))?.toString()).toBe("hello");
    await storage.delete("couple1/abc-123.webp");
    expect(await storage.get("couple1/abc-123.webp")).toBeNull();
  });
  it("deleting a missing file is not an error", async () => {
    await expect(storage.delete("couple1/missing.webp")).resolves.toBeUndefined();
  });
  it("leaves no temp files behind", async () => {
    await storage.put("couple1/a.webp", Buffer.from("x"));
    expect(await readdir(join(dir, "couple1"))).toEqual(["a.webp"]);
  });
  it("rejects path traversal and odd keys on every operation", async () => {
    const bad = ["../evil.webp", "couple1/../../etc/passwd", "/etc/passwd", "couple1/a b.webp", "couple1\\a.webp", "", "single", "a//b.webp", "couple1/a.webp/../../x", "couple1/\u0000.webp"];
    for (const key of bad) {
      await expect(storage.put(key, Buffer.from("x"))).rejects.toThrow("Unsafe");
      await expect(storage.get(key)).rejects.toThrow("Unsafe");
      await expect(storage.delete(key)).rejects.toThrow("Unsafe");
      expect(() => assertSafeKey(key)).toThrow();
    }
  });
});
