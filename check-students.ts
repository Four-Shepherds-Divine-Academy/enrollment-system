import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const students = await prisma.student.findMany({
    include: { enrollments: true },
  })
  console.log('Total students:', students.length)

  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
  })
  console.log('Active year:', activeYear?.name)

  const studentsInActiveYear = students.filter((s) =>
    s.enrollments.some((e) => e.schoolYear === activeYear?.name)
  )
  console.log('Students in active year:', studentsInActiveYear.length)

  // Group by grade
  const byGrade = studentsInActiveYear.reduce((acc, s) => {
    const grade = s.gradeLevel
    if (!acc[grade]) acc[grade] = 0
    acc[grade]++
    return acc
  }, {} as Record<string, number>)

  console.log('\nBy Grade:')
  Object.entries(byGrade)
    .sort()
    .forEach(([grade, count]) => {
      console.log(`  ${grade}: ${count} students`)
    })
}

void main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
