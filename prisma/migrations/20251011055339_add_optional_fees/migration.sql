-- CreateEnum
CREATE TYPE "OptionalFeeCategory" AS ENUM ('ID_CARD', 'UNIFORM', 'BOOKS', 'MISCELLANEOUS', 'GRADUATION', 'CERTIFICATION', 'OTHER');

-- CreateTable
CREATE TABLE "OptionalFee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" DOUBLE PRECISION,
    "category" "OptionalFeeCategory" NOT NULL DEFAULT 'OTHER',
    "hasVariations" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "applicableGradeLevels" TEXT[],
    "academicYearId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptionalFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OptionalFeeVariation" (
    "id" TEXT NOT NULL,
    "optionalFeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OptionalFeeVariation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentOptionalFee" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "academicYearId" TEXT NOT NULL,
    "optionalFeeId" TEXT NOT NULL,
    "selectedVariationId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentOptionalFee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OptionalFee_isActive_idx" ON "OptionalFee"("isActive");

-- CreateIndex
CREATE INDEX "OptionalFee_academicYearId_idx" ON "OptionalFee"("academicYearId");

-- CreateIndex
CREATE INDEX "OptionalFee_category_idx" ON "OptionalFee"("category");

-- CreateIndex
CREATE INDEX "OptionalFeeVariation_optionalFeeId_idx" ON "OptionalFeeVariation"("optionalFeeId");

-- CreateIndex
CREATE INDEX "StudentOptionalFee_studentId_idx" ON "StudentOptionalFee"("studentId");

-- CreateIndex
CREATE INDEX "StudentOptionalFee_academicYearId_idx" ON "StudentOptionalFee"("academicYearId");

-- CreateIndex
CREATE INDEX "StudentOptionalFee_optionalFeeId_idx" ON "StudentOptionalFee"("optionalFeeId");

-- CreateIndex
CREATE INDEX "StudentOptionalFee_isPaid_idx" ON "StudentOptionalFee"("isPaid");

-- CreateIndex
CREATE UNIQUE INDEX "StudentOptionalFee_studentId_academicYearId_optionalFeeId_key" ON "StudentOptionalFee"("studentId", "academicYearId", "optionalFeeId");

-- AddForeignKey
ALTER TABLE "OptionalFee" ADD CONSTRAINT "OptionalFee_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OptionalFeeVariation" ADD CONSTRAINT "OptionalFeeVariation_optionalFeeId_fkey" FOREIGN KEY ("optionalFeeId") REFERENCES "OptionalFee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentOptionalFee" ADD CONSTRAINT "StudentOptionalFee_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentOptionalFee" ADD CONSTRAINT "StudentOptionalFee_academicYearId_fkey" FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentOptionalFee" ADD CONSTRAINT "StudentOptionalFee_optionalFeeId_fkey" FOREIGN KEY ("optionalFeeId") REFERENCES "OptionalFee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
