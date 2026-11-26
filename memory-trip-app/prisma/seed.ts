// Dev seed: one couple space with two demo users. Safe to run many times (upsert).
// Run: npm run db:seed
import { config } from "dotenv";
import { createPrismaClient } from "../lib/db-client";

config({ path: [".env.local", ".env"], quiet: true });

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed demo data when NODE_ENV=production.");
  }

  const db = createPrismaClient();
  try {
    const [a, b] = await Promise.all(
      [
        { id: "seed-user-a", displayName: "Alex" },
        { id: "seed-user-b", displayName: "Sam" },
      ].map((u) =>
        db.user.upsert({ where: { id: u.id }, update: {}, create: u }),
      ),
    );

    const space = await db.coupleSpace.upsert({
      where: { id: "seed-couple" },
      update: {},
      create: { id: "seed-couple", name: "Our Trips", ownerId: a.id },
    });

    for (const [user, role] of [
      [a, "owner"],
      [b, "partner"],
    ] as const) {
      await db.coupleMember.upsert({
        where: {
          coupleSpaceId_userId: { coupleSpaceId: space.id, userId: user.id },
        },
        update: {},
        create: { coupleSpaceId: space.id, userId: user.id, role },
      });
    }

    const counts = {
      users: await db.user.count(),
      coupleSpaces: await db.coupleSpace.count(),
      members: await db.coupleMember.count(),
    };
    console.log("Seed done:", counts);
  } finally {
    await db.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
