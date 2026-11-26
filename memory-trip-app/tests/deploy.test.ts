import { describe, expect, it } from "vitest";
import { isDevLoginAllowed } from "@/features/auth/dev-login";
import { R2Storage } from "@/lib/storage/r2";

describe("isDevLoginAllowed (the mock login must never reach production)", () => {
  const cases: [string, NodeJS.ProcessEnv, boolean][] = [
    ["local dev", { NODE_ENV: "development" }, true],
    ["tests", { NODE_ENV: "test" }, true],
    ["local production build (next start)", { NODE_ENV: "production" }, false],
    ["vercel production", { NODE_ENV: "production", VERCEL_ENV: "production" }, false],
    ["vercel production even with the flag", { NODE_ENV: "production", VERCEL_ENV: "production", ALLOW_DEV_LOGIN: "true" }, false],
    ["vercel preview without the flag", { NODE_ENV: "production", VERCEL_ENV: "preview" }, false],
    ["vercel preview with the flag", { NODE_ENV: "production", VERCEL_ENV: "preview", ALLOW_DEV_LOGIN: "true" }, true],
    ["flag outside vercel preview", { NODE_ENV: "production", ALLOW_DEV_LOGIN: "true" }, false],
    ["flag with a wrong value", { NODE_ENV: "production", VERCEL_ENV: "preview", ALLOW_DEV_LOGIN: "1" }, false],
  ];
  it.each(cases)("%s", (_name, env, expected) => {
    expect(isDevLoginAllowed(env)).toBe(expected);
  });
});

describe("R2Storage", () => {
  const make = () => {
    const sent: { type: string; input: Record<string, unknown> }[] = [];
    let reply: unknown = {};
    const client = {
      send: async (command: unknown) => {
        const cmd = command as { constructor: { name: string }; input: Record<string, unknown> };
        sent.push({ type: cmd.constructor.name, input: cmd.input });
        if (reply instanceof Error) throw reply;
        return reply;
      },
    };
    return { storage: new R2Storage(client, "bucket-1"), sent, setReply: (r: unknown) => (reply = r) };
  };

  it("puts, gets and deletes with the right bucket and key", async () => {
    const { storage, sent, setReply } = make();
    await storage.put("c1/a.webp", Buffer.from("x"), "image/webp");
    expect(sent[0]).toMatchObject({ type: "PutObjectCommand", input: { Bucket: "bucket-1", Key: "c1/a.webp", ContentType: "image/webp" } });
    setReply({ Body: { transformToByteArray: async () => new Uint8Array([1, 2, 3]) } });
    expect((await storage.get("c1/a.webp"))?.equals(Buffer.from([1, 2, 3]))).toBe(true);
    await storage.delete("c1/a.webp");
    expect(sent[2].type).toBe("DeleteObjectCommand");
  });

  it("returns null for a missing object but rethrows other errors", async () => {
    const { storage, setReply } = make();
    setReply(Object.assign(new Error("nope"), { name: "NoSuchKey" }));
    expect(await storage.get("c1/missing.webp")).toBeNull();
    setReply(Object.assign(new Error("denied"), { name: "AccessDenied" }));
    await expect(storage.get("c1/a.webp")).rejects.toThrow("denied");
  });

  it("rejects unsafe keys before talking to R2", async () => {
    const { storage, sent } = make();
    await expect(storage.put("../x.webp", Buffer.from("x"), "image/webp")).rejects.toThrow("Unsafe");
    await expect(storage.get("/etc/passwd")).rejects.toThrow("Unsafe");
    await expect(storage.delete("a/../b")).rejects.toThrow("Unsafe");
    expect(sent).toEqual([]);
  });
});
