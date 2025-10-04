-- CreateTable
CREATE TABLE "RecycleBin" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityData" JSONB NOT NULL,
    "entityName" TEXT NOT NULL,
    "deletedBy" TEXT,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "permanentDeleteAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecycleBin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecycleBin_entityType_idx" ON "RecycleBin"("entityType");

-- CreateIndex
CREATE INDEX "RecycleBin_deletedAt_idx" ON "RecycleBin"("deletedAt");

-- CreateIndex
CREATE INDEX "RecycleBin_permanentDeleteAt_idx" ON "RecycleBin"("permanentDeleteAt");
