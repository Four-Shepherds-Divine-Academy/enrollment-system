import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Fixing active academic year...')

  // Set 2025-2026 as inactive
  await prisma.academicYear.updateMany({
    where: { name: '2025-2026' },
    data: { isActive: false },
  })

  // Ensure 2024-2025 is active
  await prisma.academicYear.updateMany({
    where: { name: '2024-2025' },
    data: { isActive: true, isClosed: false },
  })

  console.log('✓ Set 2024-2025 as active')
  console.log('✓ Set 2025-2026 as inactive')

  // Verify
  const years = await prisma.academicYear.findMany({
    include: {
      _count: {
        select: { enrollments: true },
      },
    },
  })

  console.log('\nAcademic Years:')
  years.forEach((year) => {
    console.log(
      `  ${year.name} - Active: ${year.isActive}, Enrollments: ${year._count.enrollments}`
    )
  })
}

main().finally(() => prisma.$disconnect())
