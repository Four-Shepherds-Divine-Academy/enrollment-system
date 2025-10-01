import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const years = await prisma.academicYear.findMany({
    include: {
      _count: {
        select: { enrollments: true },
      },
    },
  })

  console.log('Academic Years:')
  years.forEach((year) => {
    console.log(
      `  ${year.name} - Active: ${year.isActive}, Closed: ${year.isClosed}, Enrollments: ${year._count.enrollments}`
    )
  })
}

main().finally(() => prisma.$disconnect())
