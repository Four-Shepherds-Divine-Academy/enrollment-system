import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const switchSchema = z.object({
  gradeLevel: z.string().min(1),
  section: z.string().optional(),
})

// POST switch student to different section/grade
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = switchSchema.parse(body)

    // Get the student
    const student = await prisma.student.findUnique({
      where: { id },
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      )
    }

    // Get active academic year
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeYear) {
      return NextResponse.json(
        { error: 'No active academic year found' },
        { status: 400 }
      )
    }

    // Update student's grade level and section
    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        gradeLevel: validatedData.gradeLevel,
        section: validatedData.section || null,
      },
    })

    // Update the current enrollment record for this student in the active year
    await prisma.enrollment.updateMany({
      where: {
        studentId: id,
        academicYearId: activeYear.id,
      },
      data: {
        gradeLevel: validatedData.gradeLevel,
        section: validatedData.section || null,
      },
    })

    return NextResponse.json({
      ...updatedStudent,
      message: 'Student switched successfully',
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error switching student:', error)
    return NextResponse.json(
      {
        error: 'Failed to switch student',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
