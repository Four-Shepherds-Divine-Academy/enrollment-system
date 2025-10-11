import { prisma } from './prisma'
import { SECTION_DEFINITIONS } from '@/prisma/seed-helpers'
import { STUDENT_REMARK_CATEGORIES } from './constants/student-remarks'

/**
 * Copies fee templates from the most recent academic year to a new academic year
 * @param newAcademicYearId - The ID of the new academic year
 * @returns The number of fee templates copied
 */
export async function copyFeeTemplatesFromMostRecent(newAcademicYearId: string): Promise<number> {
  try {
    // Find the most recent academic year (excluding the new one)
    const mostRecentYear = await prisma.academicYear.findFirst({
      where: {
        NOT: { id: newAcademicYearId },
      },
      orderBy: {
        startDate: 'desc',
      },
      include: {
        feeTemplates: {
          include: {
            breakdowns: true,
          },
        },
      },
    })

    if (!mostRecentYear || mostRecentYear.feeTemplates.length === 0) {
      console.log('No previous fee templates found to copy')
      return 0
    }

    // Get the new academic year
    const newAcademicYear = await prisma.academicYear.findUnique({
      where: { id: newAcademicYearId },
    })

    if (!newAcademicYear) {
      throw new Error('New academic year not found')
    }

    let copiedCount = 0

    // Copy each fee template and its breakdowns
    for (const template of mostRecentYear.feeTemplates) {
      // Check if a fee template already exists for this grade level in the new year
      const existingTemplate = await prisma.feeTemplate.findUnique({
        where: {
          gradeLevel_academicYearId: {
            gradeLevel: template.gradeLevel,
            academicYearId: newAcademicYearId,
          },
        },
      })

      if (existingTemplate) {
        console.log(`Fee template already exists for ${template.gradeLevel}, skipping`)
        continue
      }

      // Create the new fee template with breakdowns
      await prisma.feeTemplate.create({
        data: {
          name: template.name.replace(mostRecentYear.name, newAcademicYear.name),
          gradeLevel: template.gradeLevel,
          academicYearId: newAcademicYearId,
          totalAmount: template.totalAmount,
          isActive: template.isActive,
          description: template.description,
          breakdowns: {
            create: template.breakdowns.map((breakdown) => ({
              description: breakdown.description,
              amount: breakdown.amount,
              category: breakdown.category,
              order: breakdown.order,
              isRefundable: breakdown.isRefundable,
            })),
          },
        },
      })

      copiedCount++
      console.log(`✓ Copied fee template for ${template.gradeLevel}`)
    }

    return copiedCount
  } catch (error) {
    console.error('Error copying fee templates:', error)
    throw error
  }
}

/**
 * Copies optional fees from the most recent academic year to a new academic year
 * @param newAcademicYearId - The ID of the new academic year
 * @returns The number of optional fees copied
 */
export async function copyOptionalFeesFromMostRecent(newAcademicYearId: string): Promise<number> {
  try {
    // Find the most recent academic year (excluding the new one)
    const mostRecentYear = await prisma.academicYear.findFirst({
      where: {
        NOT: { id: newAcademicYearId },
      },
      orderBy: {
        startDate: 'desc',
      },
      include: {
        optionalFees: {
          include: {
            variations: true,
          },
        },
      },
    })

    if (!mostRecentYear || mostRecentYear.optionalFees.length === 0) {
      console.log('No previous optional fees found to copy')
      return 0
    }

    let copiedCount = 0

    // Copy each optional fee and its variations
    for (const optionalFee of mostRecentYear.optionalFees) {
      // Check if an optional fee already exists with the same name in the new year
      const existingFee = await prisma.optionalFee.findFirst({
        where: {
          name: optionalFee.name,
          academicYearId: newAcademicYearId,
        },
      })

      if (existingFee) {
        console.log(`Optional fee already exists: ${optionalFee.name}, skipping`)
        continue
      }

      // Create the new optional fee with variations
      await prisma.optionalFee.create({
        data: {
          name: optionalFee.name,
          description: optionalFee.description,
          amount: optionalFee.amount,
          category: optionalFee.category,
          hasVariations: optionalFee.hasVariations,
          applicableGradeLevels: optionalFee.applicableGradeLevels,
          isActive: optionalFee.isActive,
          academicYearId: newAcademicYearId,
          sortOrder: optionalFee.sortOrder,
          variations: {
            create: optionalFee.variations.map((variation) => ({
              name: variation.name,
              amount: variation.amount,
            })),
          },
        },
      })

      copiedCount++
      console.log(`✓ Copied optional fee: ${optionalFee.name}`)
    }

    return copiedCount
  } catch (error) {
    console.error('Error copying optional fees:', error)
    throw error
  }
}

/**
 * Ensures all sections are created
 * @returns The number of sections created
 */
export async function ensureSectionsExist(): Promise<number> {
  try {
    let createdCount = 0

    for (const sectionDef of SECTION_DEFINITIONS) {
      const existing = await prisma.section.findUnique({
        where: {
          name_gradeLevel: {
            name: sectionDef.name,
            gradeLevel: sectionDef.gradeLevel,
          },
        },
      })

      if (existing) {
        continue
      }

      await prisma.section.create({
        data: {
          name: sectionDef.name,
          gradeLevel: sectionDef.gradeLevel,
          isActive: true,
        },
      })

      createdCount++
      console.log(`✓ Created section: ${sectionDef.gradeLevel} - ${sectionDef.name}`)
    }

    return createdCount
  } catch (error) {
    console.error('Error creating sections:', error)
    throw error
  }
}

/**
 * Seeds all predefined custom remarks
 * @returns The number of remarks created
 */
export async function seedCustomRemarks(): Promise<number> {
  try {
    let createdCount = 0

    for (const category of STUDENT_REMARK_CATEGORIES) {
      for (let i = 0; i < category.remarks.length; i++) {
        const remarkLabel = category.remarks[i]

        // Check if already exists
        const existing = await prisma.customRemark.findFirst({
          where: {
            label: remarkLabel,
            category: category.id,
          },
        })

        if (existing) {
          continue
        }

        // Create the remark
        await prisma.customRemark.create({
          data: {
            label: remarkLabel,
            category: category.id,
            sortOrder: i,
            createdBy: 'System',
            isActive: true,
          },
        })

        createdCount++
      }
    }

    if (createdCount > 0) {
      console.log(`✓ Created ${createdCount} custom remarks`)
    }

    return createdCount
  } catch (error) {
    console.error('Error seeding custom remarks:', error)
    throw error
  }
}

/**
 * Prepopulates all necessary data for a new academic year
 * @param academicYearId - The ID of the newly created academic year
 * @returns Summary of prepopulated data
 */
export async function prepopulateAcademicYearData(academicYearId: string) {
  try {
    console.log(`\n=== Prepopulating data for academic year ${academicYearId} ===`)

    // 1. Ensure sections exist
    const sectionsCreated = await ensureSectionsExist()

    // 2. Seed custom remarks
    const remarksCreated = await seedCustomRemarks()

    // 3. Copy fee templates from most recent year
    const feeTemplatesCopied = await copyFeeTemplatesFromMostRecent(academicYearId)

    // 4. Copy optional fees from most recent year
    const optionalFeesCopied = await copyOptionalFeesFromMostRecent(academicYearId)

    const summary = {
      sectionsCreated,
      remarksCreated,
      feeTemplatesCopied,
      optionalFeesCopied,
      totalActions: sectionsCreated + remarksCreated + feeTemplatesCopied + optionalFeesCopied,
    }

    console.log('=== Prepopulation Summary ===')
    console.log(`Sections created: ${sectionsCreated}`)
    console.log(`Custom remarks created: ${remarksCreated}`)
    console.log(`Fee templates copied: ${feeTemplatesCopied}`)
    console.log(`Optional fees copied: ${optionalFeesCopied}`)
    console.log(`Total actions: ${summary.totalActions}`)

    return summary
  } catch (error) {
    console.error('Error prepopulating academic year data:', error)
    throw error
  }
}
