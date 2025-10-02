import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Fixing Grade 10 students section...')

  // Update all Grade 10 students without a section to "Dependability"
  const result = await prisma.student.updateMany({
    where: {
      gradeLevel: 'Grade 10',
      section: null,
    },
    data: {
      section: 'Dependability',
    },
  })

  console.log(`✓ Updated ${result.count} Grade 10 students to Dependability section`)

  // Also update their enrollment records
  const students = await prisma.student.findMany({
    where: {
      gradeLevel: 'Grade 10',
      section: 'Dependability',
    },
  })

  for (const student of students) {
    await prisma.enrollment.updateMany({
      where: {
        studentId: student.id,
        gradeLevel: 'Grade 10',
      },
      data: {
        section: 'Dependability',
      },
    })
  }

  console.log('✓ Updated enrollment records')

  // Verify
  const grade10Students = await prisma.student.findMany({
    where: { gradeLevel: 'Grade 10' },
  })

  console.log('\nGrade 10 Students:')
  grade10Students.forEach((s) => {
    console.log(`  ${s.fullName} - Section: ${s.section}`)
  })
}

void main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
