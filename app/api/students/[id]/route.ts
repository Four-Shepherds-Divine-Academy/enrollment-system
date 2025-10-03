import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { studentSchema } from '@/lib/validations/student'
import { z } from 'zod'
import { auth } from '@/auth'

// GET single student
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        section: {
          select: {
            id: true,
            name: true,
            gradeLevel: true,
          },
        },
      },
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
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id },
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

    // Normalize LRN - convert empty string to null
    const normalizedLrn = validatedData.lrn && validatedData.lrn.trim() !== ''
      ? validatedData.lrn.trim()
      : null

    // Check if LRN is being changed and already exists for another student
    if (normalizedLrn && normalizedLrn !== existingStudent.lrn) {
      const lrnExists = await prisma.student.findFirst({
        where: {
          lrn: normalizedLrn,
          id: { not: id },
        },
      })

      if (lrnExists) {
        return NextResponse.json(
          { error: 'A student with this LRN already exists. Please check the LRN or use a different one.' },
          { status: 409 }
        )
      }
    }

    // Create full name
    const fullName = [
      validatedData.firstName,
      validatedData.middleName,
      validatedData.lastName,
    ]
      .filter(Boolean)
      .join(' ')

    // Update student
    const { section, enrollmentStatus, ...studentData } = validatedData
    const student = await prisma.student.update({
      where: { id },
      data: {
        ...studentData,
        lrn: normalizedLrn,
        fullName,
        dateOfBirth: new Date(validatedData.dateOfBirth),
        sectionId: section || null,
        ...(enrollmentStatus && { enrollmentStatus }),
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
        sectionId: section || null,
        ...(enrollmentStatus && { status: enrollmentStatus }),
      },
    })

    // Handle notification cleanup when status changes
    if (enrollmentStatus && existingStudent.enrollmentStatus !== enrollmentStatus) {
      const session = await auth()
      const adminId = session?.user?.id || session?.user?.email || 'system'

      // If changed from PENDING to ENROLLED, delete pending notifications
      if (existingStudent.enrollmentStatus === 'PENDING' && enrollmentStatus === 'ENROLLED') {
        await prisma.notification.deleteMany({
          where: {
            studentId: student.id,
            type: 'ENROLLMENT',
          },
        })
      }

      // If changed to PENDING, create notification if it doesn't exist
      if (enrollmentStatus === 'PENDING') {
        const existingNotification = await prisma.notification.findFirst({
          where: {
            studentId: student.id,
            type: 'ENROLLMENT',
          },
        })

        if (!existingNotification) {
          await prisma.notification.create({
            data: {
              adminId: adminId,
              type: 'ENROLLMENT',
              title: 'Pending Enrollment',
              message: `${student.fullName} is enrolled in ${validatedData.gradeLevel} and is awaiting approval.`,
              studentId: student.id,
            },
          })
        }
      }

      // If changed to DROPPED, update notification message
      if (enrollmentStatus === 'DROPPED') {
        await prisma.notification.updateMany({
          where: {
            studentId: student.id,
            type: 'ENROLLMENT',
          },
          data: {
            title: 'Student Dropped',
            message: `${student.fullName} has been dropped from ${validatedData.gradeLevel}.`,
          },
        })
      }
    }

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
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id },
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

    // Delete related notifications
    await prisma.notification.deleteMany({
      where: { studentId: id },
    })

    // Delete enrollments first
    await prisma.enrollment.deleteMany({
      where: { studentId: id },
    })

    // Delete student
    await prisma.student.delete({
      where: { id },
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
