import { getCurrentUser } from "@/features/auth/dal";
import { handleUpload } from "@/features/media/http";
import { db } from "@/lib/db";
import { RateLimiter } from "@/lib/security/rate-limit";
import { getStorage } from "@/lib/storage";

// 30 uploads per user per 5 minutes (best effort per server instance).
const limiter = new RateLimiter(30, 5 * 60_000);

export async function POST(request: Request) {
  return handleUpload(request, { getUser: getCurrentUser, db, storage: getStorage(), limiter });
}
