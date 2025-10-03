/*
  Warnings:

  - You are about to drop the column `isClosed` on the `AcademicYear` table. All the data in the column will be lost.
  - You are about to drop the column `section` on the `Enrollment` table. All the data in the column will be lost.
  - You are about to drop the column `section` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the `GradeSection` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[fullName,dateOfBirth]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."GradeSection" DROP CONSTRAINT "GradeSection_academicYearId_fkey";

-- DropIndex
DROP INDEX "public"."AcademicYear_isClosed_idx";

-- AlterTable
ALTER TABLE "AcademicYear" DROP COLUMN "isClosed";

-- AlterTable
ALTER TABLE "Enrollment" DROP COLUMN "section",
ADD COLUMN     "sectionId" TEXT;

-- AlterTable
ALTER TABLE "Student" DROP COLUMN "section",
ADD COLUMN     "sectionId" TEXT;

-- DropTable
DROP TABLE "public"."GradeSection";

-- DropEnum
DROP TYPE "public"."Section";

-- CreateTable
CREATE TABLE "Section" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gradeLevel" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Section_gradeLevel_idx" ON "Section"("gradeLevel");

-- CreateIndex
CREATE INDEX "Section_isActive_idx" ON "Section"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Section_name_gradeLevel_key" ON "Section"("name", "gradeLevel");

-- CreateIndex
CREATE INDEX "Enrollment_sectionId_idx" ON "Enrollment"("sectionId");

-- CreateIndex
CREATE INDEX "Student_sectionId_idx" ON "Student"("sectionId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_fullName_dateOfBirth_key" ON "Student"("fullName", "dateOfBirth");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;
