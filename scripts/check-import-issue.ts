import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkImportIssue() {
  const studentId = 'cmga4ylqf00b2hjl0ru7708su'

  console.log('\n=== CHECKING IMPORT ISSUE ===\n')

  // Check active year
  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
  })

  console.log('Current Active Year:')
  console.log(`  ${activeYear?.name} (ID: ${activeYear?.id})\n`)

  // Get student with all details
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      enrollments: {
        include: {
          academicYear: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!student) {
    console.log('Student not found!')
    await prisma.$disconnect()
    return
  }

  console.log('Student Info:')
  console.log(`  Name: ${student.fullName}`)
  console.log(`  Grade Level: ${student.gradeLevel}`)
  console.log(`  Section ID: ${student.sectionId}`)
  console.log(`  Enrollment Status: ${student.enrollmentStatus}`)
  console.log(`  Created At: ${student.createdAt}`)

  console.log(`\nEnrollment Records (${student.enrollments.length}):`)
  student.enrollments.forEach((enrollment, idx) => {
    console.log(`  ${idx + 1}. Academic Year: ${enrollment.academicYear.name}`)
    console.log(`     - Year Active: ${enrollment.academicYear.isActive}`)
    console.log(`     - Enrollment Status: ${enrollment.status}`)
    console.log(`     - Grade: ${enrollment.gradeLevel}`)
    console.log(`     - Created: ${enrollment.createdAt}`)
    console.log(`     - Enrollment ID: ${enrollment.academicYearId}`)
  })

  // Check if there's an enrollment for active year
  const hasActiveYearEnrollment = student.enrollments.find(
    (e) => e.academicYearId === activeYear?.id
  )

  console.log('\n=== DIAGNOSIS ===')
  if (!hasActiveYearEnrollment && activeYear) {
    console.log(`❌ PROBLEM: Student has NO enrollment record for active year "${activeYear.name}"`)
    console.log(`\nThe student needs an Enrollment record created for the active year.`)
    console.log(`\nWhen was "${activeYear.name}" set as active?`)
    console.log(`When was this student imported/created?`)
    console.log(`\nStudent created: ${student.createdAt}`)
    console.log(`Active year created: ${activeYear.createdAt}`)

    if (student.createdAt < activeYear.createdAt) {
      console.log(`\n⚠️ Student was created BEFORE the active year existed!`)
      console.log(`This means the import happened before "${activeYear.name}" was created.`)
    } else {
      console.log(`\n⚠️ Active year existed when student was created.`)
      console.log(`The import logic may not have created the enrollment record properly.`)
    }

    console.log(`\n💡 SOLUTION: Create an enrollment record for this student in "${activeYear.name}"`)
  } else {
    console.log(`✅ Student has enrollment in active year`)
  }

  await prisma.$disconnect()
}

checkImportIssue().catch(console.error)
