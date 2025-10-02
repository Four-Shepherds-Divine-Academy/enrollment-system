import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const grade10Students = await prisma.student.findMany({
    where: { gradeLevel: 'Grade 10' },
    include: { enrollments: true },
  })

  console.log('Grade 10 Students:')
  grade10Students.forEach((s) => {
    console.log(`  ${s.fullName} - Section: ${s.section || 'N/A'}`)
  })

  // Group by section
  const bySection = grade10Students.reduce((acc, s) => {
    const section = s.section || 'No Section'
    if (!acc[section]) acc[section] = []
    acc[section].push(s.fullName)
    return acc
  }, {} as Record<string, string[]>)

  console.log('\nBy Section:')
  Object.entries(bySection).forEach(([section, students]) => {
    console.log(`  ${section}: ${students.length} students`)
    students.forEach((name) => console.log(`    - ${name}`))
  })
}

void main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
