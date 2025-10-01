import { PrismaClient, Section } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { mapSectionToEnum, GRADE_SECTION_MAPPINGS_2023_2024 } from './seed-helpers'

const prisma = new PrismaClient()

// Import student data from the original seed file
async function importOriginalData() {
  const originalSeed = await import('./seed-2023-2024-complete')
  return originalSeed
}

async function main() {
  console.log('Starting UPDATED seed for 2023-2024 academic year...')
  console.log('This version uses the Section enum properly.')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.admin.upsert({
    where: { email: 'admin@4sda.com' },
    update: {},
    create: {
      email: 'admin@4sda.com',
      password: hashedPassword,
      name: '4SDA Administrator',
      role: 'admin',
    },
  })
  console.log('Admin created:', admin.email)

  // Create 2023-2024 academic year
  const academicYear = await prisma.academicYear.upsert({
    where: { name: '2023-2024' },
    update: {
      isClosed: false,
    },
    create: {
      name: '2023-2024',
      startDate: new Date('2023-08-01'),
      endDate: new Date('2024-05-31'),
      isActive: false,
      isClosed: false,
    },
  })
  console.log('Academic year created:', academicYear.name)

  // Create grade-section assignments for this academic year
  console.log('Creating grade-section assignments...')
  for (const [gradeLevel, sections] of Object.entries(GRADE_SECTION_MAPPINGS_2023_2024)) {
    for (const section of sections) {
      await prisma.gradeSection.upsert({
        where: {
          academicYearId_gradeLevel_section: {
            academicYearId: academicYear.id,
            gradeLevel,
            section,
          },
        },
        update: {},
        create: {
          academicYearId: academicYear.id,
          gradeLevel,
          section,
        },
      })
      console.log(`✓ Created grade-section: ${gradeLevel} - ${section}`)
    }
  }

  console.log('\n✓ Seed setup completed!')
  console.log('Note: Please manually re-run the original seed to populate students,')
  console.log('or we can create a data migration script to update existing records.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
