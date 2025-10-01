import { prisma } from './prisma'

/**
 * Ensures only one academic year can be active at a time
 * Call this before setting an academic year to active
 */
export async function setActiveAcademicYear(academicYearId: string) {
  // First, deactivate all other academic years
  await prisma.academicYear.updateMany({
    where: {
      NOT: { id: academicYearId },
      isActive: true,
    },
    data: {
      isActive: false,
    },
  })

  // Then activate the specified academic year
  await prisma.academicYear.update({
    where: { id: academicYearId },
    data: {
      isActive: true,
    },
  })
}

/**
 * Get the currently active academic year
 */
export async function getActiveAcademicYear() {
  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
  })

  return activeYear
}

/**
 * Validates that only one academic year is active
 * Can be used for data integrity checks
 */
export async function validateSingleActiveYear() {
  const activeYears = await prisma.academicYear.findMany({
    where: { isActive: true },
  })

  if (activeYears.length > 1) {
    throw new Error(
      `Data integrity error: Multiple active academic years found (${activeYears.length}). Only one academic year can be active at a time.`
    )
  }

  return activeYears[0] || null
}
