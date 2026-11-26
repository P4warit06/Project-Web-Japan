import { createPrismaClient, type Db } from "@/lib/db-client";

let client: Db | undefined;

export function testDb(): Db {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("TEST_DATABASE_URL missing: global setup did not run");
  return (client ??= createPrismaClient(url));
}

export async function resetDb(db: Db) {
  await db.tag.deleteMany();
  await db.trip.deleteMany();
  await db.coupleSpace.deleteMany();
  await db.user.deleteMany();
}

/** Two separate couple spaces, each with one trip, one place and one memory. */
export async function seedTwoCouples(db: Db) {
  const make = async (key: string) => {
    const user = await db.user.create({ data: { displayName: `User ${key}` } });
    const space = await db.coupleSpace.create({ data: { name: `Space ${key}`, ownerId: user.id } });
    await db.coupleMember.create({ data: { coupleSpaceId: space.id, userId: user.id, role: "owner" } });
    const trip = await db.trip.create({ data: { coupleSpaceId: space.id, title: `Trip ${key}` } });
    const place = await db.place.create({ data: { tripId: trip.id, name: `Place ${key}` } });
    const memory = await db.memoryEntry.create({
      data: {
        tripId: trip.id,
        title: `Memory ${key}`,
        content: "text",
        happenedAt: new Date("2026-03-01T10:00:00Z"),
        tags: { connectOrCreate: [{ where: { coupleSpaceId_name: { coupleSpaceId: space.id, name: "food" } }, create: { coupleSpaceId: space.id, name: "food" } }] },
      },
    });
    return { user, space, trip, place, memory };
  };
  return { a: await make("A"), b: await make("B") };
}
