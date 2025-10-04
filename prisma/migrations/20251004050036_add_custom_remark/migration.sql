-- CreateTable
CREATE TABLE "CustomRemark" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomRemark_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomRemark_category_idx" ON "CustomRemark"("category");

-- CreateIndex
CREATE INDEX "CustomRemark_isActive_idx" ON "CustomRemark"("isActive");
