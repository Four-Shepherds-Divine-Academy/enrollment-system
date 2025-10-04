import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkStudentEnrollment() {
  const studentId = 'cmga4ylqf00b2hjl0ru7708su'

  console.log('\n=== Checking Student Enrollment ===\n')

  // 1. Check which academic year is active
  const activeYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
  })

  console.log('Active Academic Year:')
  if (activeYear) {
    console.log(`  ID: ${activeYear.id}`)
    console.log(`  Name: ${activeYear.name}`)
    console.log(`  isActive: ${activeYear.isActive}`)
  } else {
    console.log('  ⚠️  NO ACTIVE ACADEMIC YEAR FOUND!')
  }

  // 2. Check all academic years
  const allYears = await prisma.academicYear.findMany({
    orderBy: { createdAt: 'desc' },
  })

  console.log('\nAll Academic Years:')
  allYears.forEach((year) => {
    console.log(`  - ${year.name} (ID: ${year.id}) - Active: ${year.isActive}`)
  })

  // 3. Check student details
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      enrollments: {
        include: {
          academicYear: true,
        },
      },
    },
  })

  console.log('\nStudent Details:')
  if (student) {
    console.log(`  Name: ${student.fullName}`)
    console.log(`  ID: ${student.id}`)
    console.log(`  Enrollment Status: ${student.enrollmentStatus}`)
    console.log(`\n  Enrollments (${student.enrollments.length}):`)
    student.enrollments.forEach((enrollment) => {
      console.log(`    - Year: ${enrollment.academicYear.name} (ID: ${enrollment.academicYearId})`)
      console.log(`      Active: ${enrollment.academicYear.isActive}`)
      console.log(`      Status: ${enrollment.status}`)
      console.log(`      Grade: ${enrollment.gradeLevel}`)
    })

    // 4. Check if student has enrollment in active year
    if (activeYear) {
      const hasActiveEnrollment = student.enrollments.some(
        (enrollment) => enrollment.academicYearId === activeYear.id
      )
      console.log(`\n  Has enrollment in active year (${activeYear.name}): ${hasActiveEnrollment ? '✅ YES' : '❌ NO'}`)
    }

    // 5. Check if student has enrollments in inactive years
    const hasClosedYearEnrollment = student.enrollments.some(
      (enrollment) => !enrollment.academicYear.isActive
    )
    console.log(`  Has enrollments in closed years: ${hasClosedYearEnrollment ? '❌ YES' : '✅ NO'}`)

    // 6. Determine why delete is failing
    console.log('\n=== DELETE VALIDATION RESULTS ===')
    if (!activeYear) {
      console.log('❌ FAIL: No active academic year found')
    } else {
      const hasActive = student.enrollments.some(
        (enrollment) => enrollment.academicYearId === activeYear.id
      )
      if (!hasActive) {
        console.log(`❌ FAIL: Student is NOT enrolled in active year (${activeYear.name})`)
      } else {
        console.log(`✅ PASS: Student is enrolled in active year (${activeYear.name})`)
      }
    }

    if (hasClosedYearEnrollment) {
      console.log('❌ FAIL: Student has enrollments in closed academic years')
    } else {
      console.log('✅ PASS: Student has NO enrollments in closed years')
    }
  } else {
    console.log('  ⚠️  STUDENT NOT FOUND!')
  }

  console.log('\n')
  await prisma.$disconnect()
}

checkStudentEnrollment().catch(console.error)
