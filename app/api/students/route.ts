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
    const remark = searchParams.get('remark')
    const academicYear = searchParams.get('academicYear')
    const paymentStatus = searchParams.get('paymentStatus')
    const includeAllYears = searchParams.get('includeAllYears') === 'true' // For archive page

    // Get active academic year
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    if (!activeYear && !includeAllYears) {
      return NextResponse.json([])
    }

    const where: Prisma.StudentWhereInput = {}

    // CRITICAL: Only show students enrolled in the active academic year
    if (!includeAllYears && activeYear) {
      where.enrollments = {
        some: {
          academicYearId: activeYear.id,
        },
      }
    }

    // Grade level filter
    if (gradeLevel && gradeLevel !== 'All Grades') {
      where.gradeLevel = gradeLevel
    }

    // Remark filter (searches in remarks field)
    if (remark && remark !== 'All Remarks') {
      where.remarks = {
        contains: remark,
        mode: 'insensitive',
      }
    }

    // Search filter (name, LRN, city)
    if (search && search.trim() !== '') {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { lrn: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Payment status filter - only apply if explicitly selected (not 'All Payment Status') and there's an active year
    if (paymentStatus && paymentStatus.trim() !== '' && paymentStatus !== 'All Payment Status' && activeYear) {
      where.feeStatus = {
        some: {
          paymentStatus: paymentStatus as "PAID" | "PARTIAL" | "UNPAID" | "OVERPAID",
          academicYearId: activeYear.id,
        },
      }
    }

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        lrn: true,
        fullName: true,
        gradeLevel: true,
        contactNumber: true,
        city: true,
        province: true,
        enrollmentStatus: true,
        isTransferee: true,
        previousSchool: true,
        gender: true,
        houseNumber: true,
        street: true,
        subdivision: true,
        barangay: true,
        parentGuardian: true,
        fatherName: true,
        fatherOccupation: true,
        fatherEmployer: true,
        fatherWorkContact: true,
        fatherMonthlySalary: true,
        motherName: true,
        motherOccupation: true,
        motherEmployer: true,
        motherWorkContact: true,
        motherMonthlySalary: true,
        guardianRelationship: true,
        emergencyContactName: true,
        emergencyContactNumber: true,
        emergencyContactRelationship: true,
        remarks: true,
        section: {
          select: {
            id: true,
            name: true,
            gradeLevel: true,
          },
        },
        enrollments: {
          select: {
            schoolYear: true,
            gradeLevel: true,
            academicYearId: true,
            section: {
              select: {
                id: true,
                name: true,
                gradeLevel: true,
              },
            },
            status: true,
            enrollmentDate: true,
          },
          orderBy: {
            enrollmentDate: 'desc'
          }
        },
        feeStatus: {
          select: {
            paymentStatus: true,
            balance: true,
            totalDue: true,
            totalPaid: true,
            isLatePayment: true,
            academicYearId: true,
          },
          ...(academicYear && academicYear.trim() !== '' ? { where: { academicYearId: academicYear } } : {}),
        },
      },
      orderBy: {
        fullName: 'asc',
      },
    })

    // Add current year enrollment status to each student
    let studentsWithCurrentStatus = students.map(student => {
      const currentYearEnrollment = student.enrollments.find(
        e => e.academicYearId === activeYear?.id
      )

      return {
        ...student,
        currentYearEnrollmentStatus: currentYearEnrollment?.status || student.enrollmentStatus,
      }
    })

    // Filter by status after adding current year enrollment status
    if (status && status !== 'All Status') {
      studentsWithCurrentStatus = studentsWithCurrentStatus.filter(
        student => student.currentYearEnrollmentStatus === status
      )
    }

    return NextResponse.json(studentsWithCurrentStatus)
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

    // Normalize LRN - convert empty string to null
    const normalizedLrn = validatedData.lrn && validatedData.lrn.trim() !== ''
      ? validatedData.lrn.trim()
      : null

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

    // First try to find by LRN (only if LRN is provided)
    if (normalizedLrn) {
      existingStudent = await prisma.student.findUnique({
        where: { lrn: normalizedLrn },
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
      const { section, ...studentData } = validatedData
      student = await prisma.student.update({
        where: { id: existingStudent.id },
        data: {
          ...studentData,
          lrn: normalizedLrn,
          fullName,
          dateOfBirth: new Date(validatedData.dateOfBirth),
          sectionId: section || null,
          enrollmentStatus: 'PENDING', // Update student enrollment status to PENDING for re-enrollment
        },
      })

      // Create new enrollment record for active academic year
      const enrollment = await prisma.enrollment.create({
        data: {
          studentId: student.id,
          academicYearId: activeYear.id,
          schoolYear: activeYear.name,
          gradeLevel: validatedData.gradeLevel,
          sectionId: section || null,
          status: 'PENDING', // Set enrollment status to PENDING
        },
      })

      // Create notification for pending students (re-enrollment)
      try {
        const session = await auth()
        const adminId = session?.user?.id || session?.user?.email || 'system'

        await prisma.notification.create({
          data: {
            adminId: adminId,
            type: 'ENROLLMENT',
            title: 'Re-enrollment Pending',
            message: `${student.fullName} has been re-enrolled in ${student.gradeLevel} and is awaiting approval.`,
            studentId: student.id,
            enrollmentId: enrollment.id,
          },
        })
      } catch (notifError) {
        // Don't fail the enrollment if notification creation fails
        console.error('Failed to create notification:', notifError)
      }

      return NextResponse.json({ ...student, isReenrollment: true }, { status: 200 })
    }

    // Create new student if not exists
    const { section, ...studentData } = validatedData
    student = await prisma.student.create({
      data: {
        ...studentData,
        lrn: normalizedLrn,
        fullName,
        dateOfBirth: new Date(validatedData.dateOfBirth),
        sectionId: section || null,
        enrollmentStatus: 'PENDING', // Set initial enrollment status to PENDING
      },
    })

    // Create initial enrollment record for active academic year
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId: student.id,
        academicYearId: activeYear.id,
        schoolYear: activeYear.name,
        gradeLevel: validatedData.gradeLevel,
        sectionId: section || null,
        status: 'PENDING', // Set enrollment status to PENDING
      },
    })

    // Create notification for pending students
    try {
      const session = await auth()
      const adminId = session?.user?.id || session?.user?.email || 'system'

      await prisma.notification.create({
        data: {
          adminId: adminId,
          type: 'ENROLLMENT',
          title: 'New Pending Enrollment',
          message: `${student.fullName} has been enrolled in ${student.gradeLevel} and is awaiting approval.`,
          studentId: student.id,
          enrollmentId: enrollment.id,
        },
      })
    } catch (notifError) {
      // Don't fail the enrollment if notification creation fails
      console.error('Failed to create notification:', notifError)
    }

    return NextResponse.json({ ...student, isReenrollment: false }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    // Handle Prisma unique constraint errors
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'P2002') {
        const meta = 'meta' in error ? error.meta as any : null
        const fields = meta?.target || []

        if (fields.includes('lrn')) {
          return NextResponse.json(
            { error: 'A student with this LRN already exists. Please check the LRN or use a different one.' },
            { status: 409 }
          )
        }

        return NextResponse.json(
          { error: 'A student with this information already exists.' },
          { status: 409 }
        )
      }
    }

    console.error('Error creating student:', error)
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    )
  }
}
