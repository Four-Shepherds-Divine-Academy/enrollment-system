import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { studentSchema } from '@/lib/validations/student'
import { z } from 'zod'

// GET single student
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: params.id },
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    return NextResponse.json(student)
  } catch (error) {
    console.error('Error fetching student:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student' },
      { status: 500 }
    )
  }
}

// PUT update student
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        enrollments: {
          include: {
            academicYear: true,
          },
        },
      },
    })

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Only allow editing if student has enrollment in active year
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeYear) {
      return NextResponse.json(
        { error: 'No active academic year found' },
        { status: 400 }
      )
    }

    const hasActiveEnrollment = existingStudent.enrollments.some(
      (enrollment) => enrollment.academicYearId === activeYear.id
    )

    if (!hasActiveEnrollment) {
      return NextResponse.json(
        { error: 'Cannot edit student not enrolled in current academic year' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = studentSchema.parse(body)

    // Create full name
    const fullName = [
      validatedData.firstName,
      validatedData.middleName,
      validatedData.lastName,
    ]
      .filter(Boolean)
      .join(' ')

    // Update student
    const student = await prisma.student.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        fullName,
        dateOfBirth: new Date(validatedData.dateOfBirth),
      },
    })

    // Update enrollment record for current year
    await prisma.enrollment.updateMany({
      where: {
        studentId: student.id,
        academicYearId: activeYear.id,
      },
      data: {
        gradeLevel: validatedData.gradeLevel,
        section: validatedData.section,
      },
    })

    return NextResponse.json(student)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating student:', error)
    return NextResponse.json(
      { error: 'Failed to update student' },
      { status: 500 }
    )
  }
}

// DELETE student
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        enrollments: {
          include: {
            academicYear: true,
          },
        },
      },
    })

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Check if student has enrollment in active year only
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeYear) {
      return NextResponse.json(
        { error: 'No active academic year found' },
        { status: 400 }
      )
    }

    const hasActiveEnrollment = existingStudent.enrollments.some(
      (enrollment) => enrollment.academicYearId === activeYear.id
    )

    if (!hasActiveEnrollment) {
      return NextResponse.json(
        { error: 'Cannot delete student not enrolled in current academic year' },
        { status: 403 }
      )
    }

    // Check if student has enrollments in inactive years
    const hasClosedYearEnrollment = existingStudent.enrollments.some(
      (enrollment) => !enrollment.academicYear.isActive
    )

    if (hasClosedYearEnrollment) {
      return NextResponse.json(
        {
          error:
            'Cannot delete student with enrollments in closed academic years',
        },
        { status: 403 }
      )
    }

    // Delete enrollments first
    await prisma.enrollment.deleteMany({
      where: { studentId: params.id },
    })

    // Delete student
    await prisma.student.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting student:', error)
    return NextResponse.json(
      { error: 'Failed to delete student' },
      { status: 500 }
    )
  }
}
