-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleSpaceId" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "memoryEntryId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "thumbnailKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaAsset_coupleSpaceId_fkey" FOREIGN KEY ("coupleSpaceId") REFERENCES "CoupleSpace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MediaAsset_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MediaAsset_memoryEntryId_fkey" FOREIGN KEY ("memoryEntryId") REFERENCES "MemoryEntry" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trip" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "coupleSpaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "coverMediaId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Trip_coupleSpaceId_fkey" FOREIGN KEY ("coupleSpaceId") REFERENCES "CoupleSpace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Trip_coverMediaId_fkey" FOREIGN KEY ("coverMediaId") REFERENCES "MediaAsset" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Trip" ("coupleSpaceId", "createdAt", "description", "endDate", "id", "startDate", "title", "updatedAt") SELECT "coupleSpaceId", "createdAt", "description", "endDate", "id", "startDate", "title", "updatedAt" FROM "Trip";
DROP TABLE "Trip";
ALTER TABLE "new_Trip" RENAME TO "Trip";
CREATE INDEX "Trip_coupleSpaceId_startDate_idx" ON "Trip"("coupleSpaceId", "startDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_thumbnailKey_key" ON "MediaAsset"("thumbnailKey");

-- CreateIndex
CREATE INDEX "MediaAsset_coupleSpaceId_createdAt_idx" ON "MediaAsset"("coupleSpaceId", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_tripId_createdAt_idx" ON "MediaAsset"("tripId", "createdAt");

-- CreateIndex
CREATE INDEX "MediaAsset_memoryEntryId_idx" ON "MediaAsset"("memoryEntryId");
