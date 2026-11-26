// Cloudflare R2 (S3-compatible) storage for production. The bucket must stay PRIVATE: no public
// bucket URL, no r2.dev subdomain. Photos are only ever served through /api/media/[id].
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ServiceException,
} from "@aws-sdk/client-s3";
import { assertSafeKey, type StorageProvider } from "./types";

/** The only part of S3Client we use; lets tests inject a fake. */
type Sender = { send: (command: unknown) => Promise<unknown> };

export class R2Storage implements StorageProvider {
  constructor(
    private readonly client: Sender,
    private readonly bucket: string,
  ) {}

  async put(key: string, data: Buffer, contentType: string): Promise<void> {
    assertSafeKey(key);
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key: key, Body: data, ContentType: contentType }),
    );
  }

  async get(key: string): Promise<Buffer | null> {
    assertSafeKey(key);
    try {
      const res = (await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }))) as {
        Body?: { transformToByteArray(): Promise<Uint8Array> };
      };
      if (!res.Body) return null;
      return Buffer.from(await res.Body.transformToByteArray());
    } catch (err) {
      const e = err as S3ServiceException;
      if (e.name === "NoSuchKey" || e.$metadata?.httpStatusCode === 404) return null;
      throw err;
    }
  }

  async delete(key: string): Promise<void> {
    assertSafeKey(key);
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }
}

export function createR2Storage(env: NodeJS.ProcessEnv = process.env): R2Storage {
  const accountId = env.R2_ACCOUNT_ID;
  const accessKeyId = env.R2_ACCESS_KEY_ID;
  const secretAccessKey = env.R2_SECRET_ACCESS_KEY;
  const bucket = env.R2_BUCKET;
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error("STORAGE_PROVIDER=r2 needs R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_BUCKET.");
  }
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
    // R2 does not support the newer default checksum headers of the AWS SDK.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
  // S3Client.send has heavily overloaded generics; R2Storage only needs `send(command)`.
  return new R2Storage(client as unknown as Sender, bucket);
}
