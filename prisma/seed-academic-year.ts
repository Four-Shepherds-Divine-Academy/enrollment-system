import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Creating default academic year...')

  const currentYear = new Date().getFullYear()
  const nextYear = currentYear + 1
  const academicYearName = `${currentYear}-${nextYear}`

  const academicYear = await prisma.academicYear.upsert({
    where: { name: academicYearName },
    update: {},
    create: {
      name: academicYearName,
      startDate: new Date(`${currentYear}-06-01`), // June 1st start date
      isActive: true,
      isClosed: false,
    },
  })

  console.log('Academic year created:', academicYear.name)
  console.log('Start date:', academicYear.startDate)
  console.log('Status: Active')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
