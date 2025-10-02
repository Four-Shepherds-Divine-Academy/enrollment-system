import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { studentSchema } from '@/lib/validations/student'
import { z } from 'zod'
import { auth } from '@/auth'

// GET all students with search and filters
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const gradeLevel = searchParams.get('gradeLevel')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const academicYear = searchParams.get('academicYear')

    const where: Prisma.StudentWhereInput = {}

    // Grade level filter
    if (gradeLevel && gradeLevel !== 'All Grades') {
      where.gradeLevel = gradeLevel
    }

    // Status filter
    if (status && status !== 'All Status') {
      where.enrollmentStatus = status
    }

    // Search filter (name, LRN, city)
    if (search && search.trim() !== '') {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { lrn: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Academic year filter
    if (academicYear) {
      where.enrollments = {
        some: {
          schoolYear: academicYear
        }
      }
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        enrollments: {
          select: {
            schoolYear: true,
            gradeLevel: true,
            section: true,
            status: true,
            enrollmentDate: true,
          },
          orderBy: {
            enrollmentDate: 'desc'
          }
        },
      },
      orderBy: {
        fullName: 'asc',
      },
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

// POST create new student or re-enroll existing student
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
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

    // Check if student exists by LRN or full name (for re-enrollment)
    let student
    let existingStudent = null

    // First try to find by LRN
    if (validatedData.lrn) {
      existingStudent = await prisma.student.findUnique({
        where: { lrn: validatedData.lrn },
      })
    }

    // If not found by LRN, try to find by full name and date of birth
    if (!existingStudent) {
      existingStudent = await prisma.student.findFirst({
        where: {
          fullName: fullName,
          dateOfBirth: new Date(validatedData.dateOfBirth),
        },
      })
    }

    // Check for active academic year
    const activeYear = await prisma.academicYear.findFirst({
      where: {
        isActive: true,
      },
    })

    if (!activeYear) {
      return NextResponse.json(
        { error: 'No active academic year. Please create an academic year first.' },
        { status: 400 }
      )
    }

    if (existingStudent) {
      // Update existing student record
      student = await prisma.student.update({
        where: { id: existingStudent.id },
        data: {
          ...validatedData,
          fullName,
          dateOfBirth: new Date(validatedData.dateOfBirth),
        },
      })

      // Create new enrollment record for active academic year
      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: student.id,
          academicYearId: activeYear.id,
          schoolYear: activeYear.name,
          gradeLevel: validatedData.gradeLevel,
          section: validatedData.section,
          status: 'ENROLLED',
        },
      })

      // Create notification for pending students (re-enrollment)
      if (student.enrollmentStatus === 'PENDING') {
        try {
          const session = await auth()

          if (session?.user?.id) {
            await prisma.notification.create({
              data: {
                adminId: session.user.id,
                type: 'ENROLLMENT',
                title: 'Re-enrollment Pending',
                message: `${student.fullName} has been re-enrolled in ${student.gradeLevel} and is awaiting approval.`,
                studentId: student.id,
                enrollmentId: enrollment.id,
              },
            })
          }
        } catch (notifError) {
          // Don't fail the enrollment if notification creation fails
          console.error('Failed to create notification:', notifError)
        }
      }

      return NextResponse.json({ ...student, isReenrollment: true }, { status: 200 })
    }

    // Create new student if not exists
    student = await prisma.student.create({
      data: {
        ...validatedData,
        fullName,
        dateOfBirth: new Date(validatedData.dateOfBirth),
      },
    })

    // Create initial enrollment record for active academic year
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: student.id,
        academicYearId: activeYear.id,
        schoolYear: activeYear.name,
        gradeLevel: validatedData.gradeLevel,
        section: validatedData.section,
        status: 'ENROLLED',
      },
    })

    // Create notification for pending students
    if (student.enrollmentStatus === 'PENDING') {
      try {
        const session = await auth()

        if (session?.user?.id) {
          await prisma.notification.create({
            data: {
              adminId: session.user.id,
              type: 'ENROLLMENT',
              title: 'New Pending Enrollment',
              message: `${student.fullName} has been enrolled in ${student.gradeLevel} and is awaiting approval.`,
              studentId: student.id,
              enrollmentId: enrollment.id,
            },
          })
        }
      } catch (notifError) {
        // Don't fail the enrollment if notification creation fails
        console.error('Failed to create notification:', notifError)
      }
    }

    return NextResponse.json({ ...student, isReenrollment: false }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating student:', error)
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    )
  }
}
