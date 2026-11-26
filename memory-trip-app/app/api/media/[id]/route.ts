import { getCurrentUser } from "@/features/auth/dal";
import { handleMediaGet } from "@/features/media/http";
import { db } from "@/lib/db";
import { getStorage } from "@/lib/storage";

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  return handleMediaGet(request, id, { getUser: getCurrentUser, db, storage: getStorage() });
}
