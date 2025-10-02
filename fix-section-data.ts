import { PrismaClient, Section } from '@prisma/client'

const prisma = new PrismaClient()

// Map old format to enum values
function extractSection(sectionValue: string): Section | null {
  if (!sectionValue) return null

  // Check if any enum value is contained in the string
  if (sectionValue.includes('Enthusiasm')) return Section.Enthusiasm
  if (sectionValue.includes('Generosity')) return Section.Generosity
  if (sectionValue.includes('Obedience')) return Section.Obedience
  if (sectionValue.includes('Hospitality')) return Section.Hospitality
  if (sectionValue.includes('Simplicity')) return Section.Simplicity
  if (sectionValue.includes('Benevolence')) return Section.Benevolence
  if (sectionValue.includes('Sincerity')) return Section.Sincerity
  if (sectionValue.includes('Responsibility')) return Section.Responsibility
  if (sectionValue.includes('Perseverance')) return Section.Perseverance
  if (sectionValue.includes('Integrity')) return Section.Integrity
  if (sectionValue.includes('Optimism')) return Section.Optimism
  if (sectionValue.includes('Dependability')) return Section.Dependability

  return null
}

async function main() {
  console.log('Checking for invalid section values in database...\n')

  // Check students with invalid sections
  const students = await prisma.$queryRaw<Array<{ id: string; section: string }>>`
    SELECT id, section::text
    FROM "Student"
    WHERE section IS NOT NULL
  `

  console.log(`Found ${students.length} students with sections`)

  const invalidStudents = students.filter(s => {
    const section = s.section
    return !Object.values(Section).includes(section as Section)
  })

  if (invalidStudents.length > 0) {
    console.log(`\nFound ${invalidStudents.length} students with invalid section values:`)
    invalidStudents.forEach(s => {
      console.log(`  ${s.id}: "${s.section}"`)
    })

    console.log('\nFixing student sections...')
    for (const student of invalidStudents) {
      const correctSection = extractSection(student.section)
      if (correctSection) {
        await prisma.student.update({
          where: { id: student.id },
          data: { section: correctSection }
        })
        console.log(`  Fixed ${student.id}: "${student.section}" -> "${correctSection}"`)
      } else {
        console.log(`  Could not map section for ${student.id}: "${student.section}"`)
      }
    }
  } else {
    console.log('All student sections are valid!')
  }

  // Check enrollments with invalid sections
  const enrollments = await prisma.$queryRaw<Array<{ id: string; section: string }>>`
    SELECT id, section::text
    FROM "Enrollment"
    WHERE section IS NOT NULL
  `

  console.log(`\nFound ${enrollments.length} enrollments with sections`)

  const invalidEnrollments = enrollments.filter(e => {
    const section = e.section
    return !Object.values(Section).includes(section as Section)
  })

  if (invalidEnrollments.length > 0) {
    console.log(`\nFound ${invalidEnrollments.length} enrollments with invalid section values:`)
    invalidEnrollments.forEach(e => {
      console.log(`  ${e.id}: "${e.section}"`)
    })

    console.log('\nFixing enrollment sections...')
    for (const enrollment of invalidEnrollments) {
      const correctSection = extractSection(enrollment.section)
      if (correctSection) {
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { section: correctSection }
        })
        console.log(`  Fixed ${enrollment.id}: "${enrollment.section}" -> "${correctSection}"`)
      } else {
        console.log(`  Could not map section for ${enrollment.id}: "${enrollment.section}"`)
      }
    }
  } else {
    console.log('All enrollment sections are valid!')
  }

  console.log('\n✓ Done!')
}

void main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
