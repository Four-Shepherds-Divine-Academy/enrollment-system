import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding 2025 fee templates and optional fees...')

  // Get or create 2025-2026 academic year
  let academicYear = await prisma.academicYear.findFirst({
    where: { name: '2025-2026' },
  })

  if (!academicYear) {
    academicYear = await prisma.academicYear.create({
      data: {
        name: '2025-2026',
        startDate: new Date('2025-08-01'),
        endDate: new Date('2026-05-31'),
        isActive: true,
      },
    })
    console.log('Created academic year: 2025-2026')
  }

  // ============= FEE TEMPLATES =============

  const feeTemplatesData = [
    // K1-K2 Template
    {
      gradeLevel: 'Kinder 1',
      name: 'Kinder 1 - Cash Scheme 2025',
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
      name: 'Kinder 2 - Cash Scheme 2025',
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
      name: 'Grade 1 - Cash Scheme 2025',
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
      name: 'Grade 2 - Cash Scheme 2025',
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
      name: 'Grade 3 - Cash Scheme 2025',
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
      name: 'Grade 4 - Cash Scheme 2025',
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
      name: 'Grade 5 - Cash Scheme 2025',
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
      name: 'Grade 6 - Cash Scheme 2025',
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
      name: 'Grade 7 - Cash Scheme 2025',
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
      name: 'Grade 8 - Cash Scheme 2025',
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
      name: 'Grade 9 - Cash Scheme 2025',
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
      name: 'Grade 10 - Cash Scheme 2025',
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

  console.log('\n=== Creating Fee Templates ===')
  for (const templateData of feeTemplatesData) {
    const { breakdowns, ...template } = templateData

    const existingTemplate = await prisma.feeTemplate.findUnique({
      where: {
        gradeLevel_academicYearId: {
          gradeLevel: template.gradeLevel,
          academicYearId: academicYear.id,
        },
      },
    })

    if (existingTemplate) {
      console.log(`✓ Fee template already exists for ${template.gradeLevel}`)
      continue
    }

    await prisma.feeTemplate.create({
      data: {
        ...template,
        academicYearId: academicYear.id,
        isActive: true,
        breakdowns: {
          create: breakdowns,
        },
      },
    })

    console.log(`✓ Created fee template: ${template.name}`)
  }

  // ============= OPTIONAL FEES =============

  console.log('\n=== Creating Optional Fees ===')

  const optionalFeesData = [
    {
      name: 'School ID',
      description: 'Official school identification card',
      amount: 250.00,
      category: 'ID_CARD',
      hasVariations: false,
      applicableGradeLevels: [], // Applies to all grades
      sortOrder: 1,
    },
    {
      name: 'PE Uniform',
      description: 'Physical education uniform set',
      amount: 1150.00,
      category: 'UNIFORM',
      hasVariations: false,
      applicableGradeLevels: [],
      sortOrder: 2,
    },
    {
      name: 'Foundation T-Shirt',
      description: 'Official foundation t-shirt',
      amount: 250.00,
      category: 'UNIFORM',
      hasVariations: false,
      applicableGradeLevels: [],
      sortOrder: 3,
    },
    {
      name: 'Daily Uniform',
      description: 'Official daily school uniform (price varies by gender and sleeve type)',
      amount: null, // Variable amount
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
      applicableGradeLevels: ['Kinder 2', 'Grade 6', 'Grade 10'], // Only for graduating grades
      sortOrder: 5,
    },
    {
      name: 'Recognition Fee',
      description: 'Recognition ceremony expenses',
      amount: 850.00,
      category: 'MISCELLANEOUS',
      hasVariations: false,
      applicableGradeLevels: [], // All grades
      sortOrder: 6,
    },
    {
      name: 'Form 137 (Transfer)',
      description: 'Form 137 for students planning to transfer',
      amount: 400.00,
      category: 'CERTIFICATION',
      hasVariations: false,
      applicableGradeLevels: [],
      sortOrder: 7,
    },
    {
      name: 'Certifications',
      description: 'Various school certifications',
      amount: 100.00,
      category: 'CERTIFICATION',
      hasVariations: false,
      applicableGradeLevels: [],
      sortOrder: 8,
    },
    {
      name: 'Notebook',
      description: 'School notebook (price per piece)',
      amount: 50.00,
      category: 'BOOKS',
      hasVariations: false,
      applicableGradeLevels: [],
      sortOrder: 9,
    },
  ]

  for (const optionalFeeData of optionalFeesData) {
    const { variations, ...feeData } = optionalFeeData

    // Check if optional fee already exists
    const existingFee = await prisma.optionalFee.findFirst({
      where: {
        name: feeData.name,
        academicYearId: academicYear.id,
      },
    })

    if (existingFee) {
      console.log(`✓ Optional fee already exists: ${feeData.name}`)
      continue
    }

    const createdFee = await prisma.optionalFee.create({
      data: {
        ...feeData,
        academicYearId: academicYear.id,
        isActive: true,
      },
    })

    // Create variations if they exist
    if (variations && variations.length > 0) {
      for (const variation of variations) {
        await prisma.optionalFeeVariation.create({
          data: {
            ...variation,
            optionalFeeId: createdFee.id,
          },
        })
      }
      console.log(`✓ Created optional fee with variations: ${feeData.name}`)
    } else {
      console.log(`✓ Created optional fee: ${feeData.name}`)
    }
  }

  console.log('\n=== Seed Completed ===')
  console.log(`Academic Year: ${academicYear.name}`)
  console.log(`Fee Templates Created: ${feeTemplatesData.length}`)
  console.log(`Optional Fees Created: ${optionalFeesData.length}`)
}

void main()
  .catch((e) => {
    console.error('Error seeding fees:', e)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
