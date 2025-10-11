import { prisma } from './prisma'
import { SECTION_DEFINITIONS } from '@/prisma/seed-helpers'
import { STUDENT_REMARK_CATEGORIES } from './constants/student-remarks'

/**
 * Default fee template structure for all grade levels
 * Used as fallback when no previous academic year templates exist
 */
const DEFAULT_FEE_TEMPLATES = [
  // K1-K2 Template
  {
    gradeLevel: 'Kinder 1',
    name: 'Kinder 1 - Cash Scheme',
    description: 'Full payment scheme for Kinder 1',
    totalAmount: 22600.00,
    breakdowns: [
      { description: 'Entrance Fee', amount: 3000.00, category: 'REGISTRATION', order: 0, isRefundable: false },
      { description: 'Modules - Reading, Language, Math', amount: 2100.00, category: 'BOOKS', order: 1, isRefundable: true },
      { description: 'Supplementary Learning Materials GMRC/Other Activities', amount: 700.00, category: 'BOOKS', order: 2, isRefundable: true },
      { description: 'Miscellaneous', amount: 4500.00, category: 'MISC', order: 3, isRefundable: true },
      { description: 'Other Fee (included aircon fee)', amount: 5800.00, category: 'MISC', order: 4, isRefundable: true },
      { description: 'Tuition Fee', amount: 6500.00, category: 'TUITION', order: 5, isRefundable: false },
    ],
  },
  {
    gradeLevel: 'Kinder 2',
    name: 'Kinder 2 - Cash Scheme',
    description: 'Full payment scheme for Kinder 2',
    totalAmount: 22600.00,
    breakdowns: [
      { description: 'Entrance Fee', amount: 3000.00, category: 'REGISTRATION', order: 0, isRefundable: false },
      { description: 'Modules - Reading, Language, Math', amount: 2100.00, category: 'BOOKS', order: 1, isRefundable: true },
      { description: 'Supplementary Learning Materials GMRC/Other Activities', amount: 700.00, category: 'BOOKS', order: 2, isRefundable: true },
      { description: 'Miscellaneous', amount: 4500.00, category: 'MISC', order: 3, isRefundable: true },
      { description: 'Other Fee (included aircon fee)', amount: 5800.00, category: 'MISC', order: 4, isRefundable: true },
      { description: 'Tuition Fee', amount: 6500.00, category: 'TUITION', order: 5, isRefundable: false },
    ],
  },
  // Grade 1-3 Templates
  {
    gradeLevel: 'Grade 1',
    name: 'Grade 1 - Cash Scheme',
    description: 'Full payment scheme for Grade 1',
    totalAmount: 25900.00,
    breakdowns: [
      { description: 'Entrance Fee', amount: 3000.00, category: 'REGISTRATION', order: 0, isRefundable: false },
      { description: 'Modules - Reading, Language, Math, Makabansa, Filipino, GMRC', amount: 4900.00, category: 'BOOKS', order: 1, isRefundable: true },
      { description: 'Supplementary Learning', amount: 700.00, category: 'BOOKS', order: 2, isRefundable: true },
      { description: 'Miscellaneous', amount: 4500.00, category: 'MISC', order: 3, isRefundable: true },
      { description: 'Other Fee', amount: 5800.00, category: 'MISC', order: 4, isRefundable: true },
      { description: 'Tuition Fee', amount: 7000.00, category: 'TUITION', order: 5, isRefundable: false },
    ],
  },
  {
    gradeLevel: 'Grade 2',
    name: 'Grade 2 - Cash Scheme',
    description: 'Full payment scheme for Grade 2',
    totalAmount: 25900.00,
    breakdowns: [
      { description: 'Entrance Fee', amount: 3000.00, category: 'REGISTRATION', order: 0, isRefundable: false },
      { description: 'Modules - Reading, Language, Math, Makabansa, Filipino, GMRC', amount: 4900.00, category: 'BOOKS', order: 1, isRefundable: true },
      { description: 'Supplementary Learning', amount: 700.00, category: 'BOOKS', order: 2, isRefundable: true },
      { description: 'Miscellaneous', amount: 4500.00, category: 'MISC', order: 3, isRefundable: true },
      { description: 'Other Fee', amount: 5800.00, category: 'MISC', order: 4, isRefundable: true },
      { description: 'Tuition Fee', amount: 7000.00, category: 'TUITION', order: 5, isRefundable: false },
    ],
  },
  {
    gradeLevel: 'Grade 3',
    name: 'Grade 3 - Cash Scheme',
    description: 'Full payment scheme for Grade 3',
    totalAmount: 25900.00,
    breakdowns: [
      { description: 'Entrance Fee', amount: 3000.00, category: 'REGISTRATION', order: 0, isRefundable: false },
      { description: 'Modules - Reading, Language, Math, Makabansa, Filipino, GMRC', amount: 4900.00, category: 'BOOKS', order: 1, isRefundable: true },
      { description: 'Supplementary Learning', amount: 700.00, category: 'BOOKS', order: 2, isRefundable: true },
      { description: 'Miscellaneous', amount: 4500.00, category: 'MISC', order: 3, isRefundable: true },
      { description: 'Other Fee', amount: 5800.00, category: 'MISC', order: 4, isRefundable: true },
      { description: 'Tuition Fee', amount: 7000.00, category: 'TUITION', order: 5, isRefundable: false },
    ],
  },
  // Grade 4-6 Templates
  {
    gradeLevel: 'Grade 4',
    name: 'Grade 4 - Cash Scheme',
    description: 'Full payment scheme for Grade 4',
    totalAmount: 26600.00,
    breakdowns: [
      { description: 'Entrance Fee', amount: 3000.00, category: 'REGISTRATION', order: 0, isRefundable: false },
      { description: 'Modules', amount: 4900.00, category: 'BOOKS', order: 1, isRefundable: true },
      { description: 'Supplementary Learning', amount: 700.00, category: 'BOOKS', order: 2, isRefundable: true },
      { description: 'Miscellaneous', amount: 4500.00, category: 'MISC', order: 3, isRefundable: true },
      { description: 'Other Fee', amount: 6000.00, category: 'MISC', order: 4, isRefundable: true },
      { description: 'Tuition Fee', amount: 7500.00, category: 'TUITION', order: 5, isRefundable: false },
    ],
  },
  {
    gradeLevel: 'Grade 5',
    name: 'Grade 5 - Cash Scheme',
    description: 'Full payment scheme for Grade 5',
    totalAmount: 26600.00,
    breakdowns: [
      { description: 'Entrance Fee', amount: 3000.00, category: 'REGISTRATION', order: 0, isRefundable: false },
      { description: 'Modules', amount: 4900.00, category: 'BOOKS', order: 1, isRefundable: true },
      { description: 'Supplementary Learning', amount: 700.00, category: 'BOOKS', order: 2, isRefundable: true },
      { description: 'Miscellaneous', amount: 4500.00, category: 'MISC', order: 3, isRefundable: true },
      { description: 'Other Fee', amount: 6000.00, category: 'MISC', order: 4, isRefundable: true },
      { description: 'Tuition Fee', amount: 7500.00, category: 'TUITION', order: 5, isRefundable: false },
    ],
  },
  {
    gradeLevel: 'Grade 6',
    name: 'Grade 6 - Cash Scheme',
    description: 'Full payment scheme for Grade 6',
    totalAmount: 26600.00,
    breakdowns: [
      { description: 'Entrance Fee', amount: 3000.00, category: 'REGISTRATION', order: 0, isRefundable: false },
      { description: 'Modules', amount: 4900.00, category: 'BOOKS', order: 1, isRefundable: true },
      { description: 'Supplementary Learning', amount: 700.00, category: 'BOOKS', order: 2, isRefundable: true },
      { description: 'Miscellaneous', amount: 4500.00, category: 'MISC', order: 3, isRefundable: true },
      { description: 'Other Fee', amount: 6000.00, category: 'MISC', order: 4, isRefundable: true },
      { description: 'Tuition Fee', amount: 7500.00, category: 'TUITION', order: 5, isRefundable: false },
    ],
  },
  // JHS Grade 7
  {
    gradeLevel: 'Grade 7',
    name: 'Grade 7 - Cash Scheme',
    description: 'Full payment scheme for Grade 7',
    totalAmount: 27800.00,
    breakdowns: [
      { description: 'Entrance Fee', amount: 3000.00, category: 'REGISTRATION', order: 0, isRefundable: false },
      { description: 'Modules', amount: 5600.00, category: 'BOOKS', order: 1, isRefundable: true },
      { description: 'Supplementary Learning', amount: 700.00, category: 'BOOKS', order: 2, isRefundable: true },
      { description: 'Miscellaneous', amount: 4500.00, category: 'MISC', order: 3, isRefundable: true },
      { description: 'Other Fee', amount: 6000.00, category: 'MISC', order: 4, isRefundable: true },
      { description: 'Tuition Fee', amount: 8000.00, category: 'TUITION', order: 5, isRefundable: false },
    ],
  },
  // Grade 8-10 Templates
  {
    gradeLevel: 'Grade 8',
    name: 'Grade 8 - Cash Scheme',
    description: 'Full payment scheme for Grade 8',
    totalAmount: 27800.00,
    breakdowns: [
      { description: 'Entrance Fee', amount: 3000.00, category: 'REGISTRATION', order: 0, isRefundable: false },
      { description: 'Modules', amount: 5600.00, category: 'BOOKS', order: 1, isRefundable: true },
      { description: 'Supplementary Learning', amount: 700.00, category: 'BOOKS', order: 2, isRefundable: true },
      { description: 'Miscellaneous', amount: 4500.00, category: 'MISC', order: 3, isRefundable: true },
      { description: 'Other Fee', amount: 6000.00, category: 'MISC', order: 4, isRefundable: true },
      { description: 'Tuition Fee', amount: 8000.00, category: 'TUITION', order: 5, isRefundable: false },
    ],
  },
  {
    gradeLevel: 'Grade 9',
    name: 'Grade 9 - Cash Scheme',
    description: 'Full payment scheme for Grade 9',
    totalAmount: 27800.00,
    breakdowns: [
      { description: 'Entrance Fee', amount: 3000.00, category: 'REGISTRATION', order: 0, isRefundable: false },
      { description: 'Modules', amount: 5600.00, category: 'BOOKS', order: 1, isRefundable: true },
      { description: 'Supplementary Learning', amount: 700.00, category: 'BOOKS', order: 2, isRefundable: true },
      { description: 'Miscellaneous', amount: 4500.00, category: 'MISC', order: 3, isRefundable: true },
      { description: 'Other Fee', amount: 6000.00, category: 'MISC', order: 4, isRefundable: true },
      { description: 'Tuition Fee', amount: 8000.00, category: 'TUITION', order: 5, isRefundable: false },
    ],
  },
  {
    gradeLevel: 'Grade 10',
    name: 'Grade 10 - Cash Scheme',
    description: 'Full payment scheme for Grade 10',
    totalAmount: 27800.00,
    breakdowns: [
      { description: 'Entrance Fee', amount: 3000.00, category: 'REGISTRATION', order: 0, isRefundable: false },
      { description: 'Modules', amount: 5600.00, category: 'BOOKS', order: 1, isRefundable: true },
      { description: 'Supplementary Learning', amount: 700.00, category: 'BOOKS', order: 2, isRefundable: true },
      { description: 'Miscellaneous', amount: 4500.00, category: 'MISC', order: 3, isRefundable: true },
      { description: 'Other Fee', amount: 6000.00, category: 'MISC', order: 4, isRefundable: true },
      { description: 'Tuition Fee', amount: 8000.00, category: 'TUITION', order: 5, isRefundable: false },
    ],
  },
]

/**
 * Default optional fees structure
 * Used as fallback when no previous academic year optional fees exist
 */
const DEFAULT_OPTIONAL_FEES = [
  {
    name: 'School ID',
    description: 'Official school identification card',
    amount: 250.00,
    category: 'ID_CARD',
    hasVariations: false,
    applicableGradeLevels: [],
    sortOrder: 1,
    variations: [],
  },
  {
    name: 'PE Uniform',
    description: 'Physical education uniform set',
    amount: 1150.00,
    category: 'UNIFORM',
    hasVariations: false,
    applicableGradeLevels: [],
    sortOrder: 2,
    variations: [],
  },
  {
    name: 'Foundation T-Shirt',
    description: 'Official foundation t-shirt',
    amount: 250.00,
    category: 'UNIFORM',
    hasVariations: false,
    applicableGradeLevels: [],
    sortOrder: 3,
    variations: [],
  },
  {
    name: 'Daily Uniform',
    description: 'Official daily school uniform (price varies by gender and sleeve type)',
    amount: null,
    category: 'UNIFORM',
    hasVariations: true,
    applicableGradeLevels: [],
    sortOrder: 4,
    variations: [
      { name: 'Girl - Short Sleeve', amount: 1173.00 },
      { name: 'Boy - Short Sleeve', amount: 1193.00 },
      { name: 'Girl - Long Sleeve', amount: 1248.00 },
      { name: 'Boy - Long Sleeve', amount: 1268.00 },
    ],
  },
  {
    name: 'Graduation Fee',
    description: 'Graduation ceremony and related expenses',
    amount: 2650.00,
    category: 'GRADUATION',
    hasVariations: false,
    applicableGradeLevels: ['Kinder 2', 'Grade 6', 'Grade 10'],
    sortOrder: 5,
    variations: [],
  },
  {
    name: 'Recognition Fee',
    description: 'Recognition ceremony expenses',
    amount: 850.00,
    category: 'MISCELLANEOUS',
    hasVariations: false,
    applicableGradeLevels: [],
    sortOrder: 6,
    variations: [],
  },
  {
    name: 'Form 137 (Transfer)',
    description: 'Form 137 for students planning to transfer',
    amount: 400.00,
    category: 'CERTIFICATION',
    hasVariations: false,
    applicableGradeLevels: [],
    sortOrder: 7,
    variations: [],
  },
  {
    name: 'Certifications',
    description: 'Various school certifications',
    amount: 100.00,
    category: 'CERTIFICATION',
    hasVariations: false,
    applicableGradeLevels: [],
    sortOrder: 8,
    variations: [],
  },
  {
    name: 'Notebook',
    description: 'School notebook (price per piece)',
    amount: 50.00,
    category: 'BOOKS',
    hasVariations: false,
    applicableGradeLevels: [],
    sortOrder: 9,
    variations: [],
  },
]

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

    // Get the new academic year
    const newAcademicYear = await prisma.academicYear.findUnique({
      where: { id: newAcademicYearId },
    })

    if (!newAcademicYear) {
      throw new Error('New academic year not found')
    }

    let copiedCount = 0
    let templatesSource: any[] = []

    // Determine source of templates: previous year or defaults
    if (!mostRecentYear || mostRecentYear.feeTemplates.length === 0) {
      console.log('No previous fee templates found. Using default templates.')
      // Use default templates and update names with the new academic year
      templatesSource = DEFAULT_FEE_TEMPLATES.map(template => ({
        ...template,
        name: template.name.replace('Cash Scheme', `Cash Scheme ${newAcademicYear.name}`),
      }))
    } else {
      console.log(`Copying templates from ${mostRecentYear.name}`)
      templatesSource = mostRecentYear.feeTemplates
    }

    // Copy or create each fee template and its breakdowns
    for (const template of templatesSource) {
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
      // Check if template is from previous year (has id) or default (no id)
      const templateName = mostRecentYear
        ? template.name.replace(mostRecentYear.name, newAcademicYear.name)
        : template.name

      await prisma.feeTemplate.create({
        data: {
          name: templateName,
          gradeLevel: template.gradeLevel,
          academicYearId: newAcademicYearId,
          totalAmount: template.totalAmount,
          isActive: template.isActive ?? true,
          description: template.description || null,
          breakdowns: {
            create: template.breakdowns.map((breakdown: any) => ({
              description: breakdown.description,
              amount: breakdown.amount,
              category: breakdown.category,
              order: breakdown.order,
              isRefundable: breakdown.isRefundable ?? true,
            })),
          },
        },
      })

      copiedCount++
      console.log(`✓ Created fee template for ${template.gradeLevel}`)
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

    let copiedCount = 0
    let feesSource: any[] = []

    // Determine source of optional fees: previous year or defaults
    if (!mostRecentYear || mostRecentYear.optionalFees.length === 0) {
      console.log('No previous optional fees found. Using default optional fees.')
      feesSource = DEFAULT_OPTIONAL_FEES
    } else {
      console.log(`Copying optional fees from ${mostRecentYear.name}`)
      feesSource = mostRecentYear.optionalFees
    }

    // Copy or create each optional fee and its variations
    for (const optionalFee of feesSource) {
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
      // Handle both database objects and default objects
      const variationsData = optionalFee.variations && optionalFee.variations.length > 0
        ? {
            create: optionalFee.variations.map((variation: any) => ({
              name: variation.name,
              amount: variation.amount,
            })),
          }
        : undefined

      await prisma.optionalFee.create({
        data: {
          name: optionalFee.name,
          description: optionalFee.description || null,
          amount: optionalFee.amount,
          category: optionalFee.category,
          hasVariations: optionalFee.hasVariations ?? false,
          applicableGradeLevels: optionalFee.applicableGradeLevels ?? [],
          isActive: optionalFee.isActive ?? true,
          academicYearId: newAcademicYearId,
          sortOrder: optionalFee.sortOrder ?? 0,
          variations: variationsData,
        },
      })

      copiedCount++
      console.log(`✓ Created optional fee: ${optionalFee.name}`)
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
    console.log(`Fee templates created: ${feeTemplatesCopied}`)
    console.log(`Optional fees created: ${optionalFeesCopied}`)
    console.log(`Total actions: ${summary.totalActions}`)

    return summary
  } catch (error) {
    console.error('Error prepopulating academic year data:', error)
    throw error
  }
}
