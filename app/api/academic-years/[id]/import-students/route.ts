import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const importSchema = z.object({
  students: z.array(
    z.object({
      studentId: z.string(),
      gradeLevel: z.string(),
    })
  ),
})

// POST - Bulk import students from previous year to new academic year
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: targetAcademicYearId } = await params
    const body = await request.json()
    const { students: studentsToImport } = importSchema.parse(body)

    // Verify target academic year exists
    const targetYear = await prisma.academicYear.findUnique({
      where: { id: targetAcademicYearId },
    })

    if (!targetYear) {
      return NextResponse.json(
        { error: 'Academic year not found' },
        { status: 404 }
      )
    }

    if (studentsToImport.length === 0) {
      return NextResponse.json(
        { error: 'No students provided for import' },
        { status: 400 }
      )
    }

    // Create enrollments for each student in the new academic year
    const results = {
      success: 0,
      skipped: 0,
      errors: [] as string[],
    }

    // Process students in batches for better performance and error handling
    const BATCH_SIZE = 10
    for (let i = 0; i < studentsToImport.length; i += BATCH_SIZE) {
      const batch = studentsToImport.slice(i, i + BATCH_SIZE)

      for (const importStudent of batch) {
        try {
          // Use transaction to ensure data consistency
          await prisma.$transaction(async (tx) => {
            // Get student details
            const student = await tx.student.findUnique({
              where: { id: importStudent.studentId },
            })

            if (!student) {
              throw new Error(`Student with ID ${importStudent.studentId} not found`)
            }

            // Check if student already enrolled in target year
            const existingEnrollment = await tx.enrollment.findFirst({
              where: {
                studentId: student.id,
                academicYearId: targetAcademicYearId,
              },
            })

            if (existingEnrollment) {
              // Don't throw error, just skip
              return 'SKIP'
            }

            // Validate grade level
            if (!importStudent.gradeLevel || importStudent.gradeLevel.trim() === '') {
              throw new Error(`Grade level is required for ${student.fullName}`)
            }

            // Create enrollment with the specified grade level
            await tx.enrollment.create({
              data: {
                studentId: student.id,
                academicYearId: targetAcademicYearId,
                schoolYear: targetYear.name,
                gradeLevel: importStudent.gradeLevel,
                sectionId: null, // Section will be assigned later
                status: 'ENROLLED',
              },
            })

            // Update student's current grade level
            await tx.student.update({
              where: { id: student.id },
              data: {
                gradeLevel: importStudent.gradeLevel,
                sectionId: null,
                enrollmentStatus: 'ENROLLED',
              },
            })

            return 'SUCCESS'
          })
            .then((result) => {
              if (result === 'SKIP') {
                results.skipped++
              } else {
                results.success++
              }
            })
            .catch((error) => {
              throw error
            })
        } catch (error) {
          // Get student name for error message
          const student = await prisma.student.findUnique({
            where: { id: importStudent.studentId },
          })

          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          results.errors.push(
            `${student?.fullName || importStudent.studentId}: ${errorMessage}`
          )
          console.error(`Failed to import student ${importStudent.studentId}:`, error)
        }
      }
    }

    return NextResponse.json({
      message: `Successfully enrolled ${results.success} students`,
      ...results,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error importing students:', error)
    return NextResponse.json(
      {
        error: 'Failed to import students',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

// Helper function to determine next grade level
function getNextGradeLevel(currentGrade: string): string {
  const gradeMapping: Record<string, string> = {
    'Kinder 1': 'Kinder 2',
    'Kinder 2': 'Grade 1',
    'Grade 1': 'Grade 2',
    'Grade 2': 'Grade 3',
    'Grade 3': 'Grade 4',
    'Grade 4': 'Grade 5',
    'Grade 5': 'Grade 6',
    'Grade 6': 'Grade 7',
    'Grade 7': 'Grade 8',
    'Grade 8': 'Grade 9',
    'Grade 9': 'Grade 10',
    'Grade 10': 'Grade 11', // If applicable
    'Grade 11': 'Grade 12', // If applicable
  }

  return gradeMapping[currentGrade] || currentGrade
}

// GET - Get available students from a specific academic year for import
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: targetAcademicYearId } = await params
    const { searchParams } = new URL(request.url)
    const sourceYearId = searchParams.get('sourceYearId')

    if (!sourceYearId) {
      return NextResponse.json(
        { error: 'Source academic year ID is required' },
        { status: 400 }
      )
    }

    // Get students from source year who are not yet in target year
    const sourceEnrollments = await prisma.enrollment.findMany({
      where: {
        academicYearId: sourceYearId,
        status: 'ENROLLED',
      },
      include: {
        student: true,
      },
    })

    // Get students already enrolled in target year
    const targetEnrollments = await prisma.enrollment.findMany({
      where: {
        academicYearId: targetAcademicYearId,
      },
      select: {
        studentId: true,
      },
    })

    const targetStudentIds = new Set(targetEnrollments.map((e) => e.studentId))

    // Filter out students already enrolled in target year
    const availableStudents = sourceEnrollments
      .filter((enrollment) => !targetStudentIds.has(enrollment.studentId))
      .map((enrollment) => ({
        id: enrollment.student.id,
        lrn: enrollment.student.lrn,
        fullName: enrollment.student.fullName,
        gradeLevel: enrollment.student.gradeLevel,
        section: enrollment.student.section,
        currentGrade: enrollment.gradeLevel,
        nextGrade: getNextGradeLevel(enrollment.gradeLevel),
      }))

    return NextResponse.json({
      students: availableStudents,
      total: availableStudents.length,
    })
  } catch (error) {
    console.error('Error fetching available students:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch available students',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
