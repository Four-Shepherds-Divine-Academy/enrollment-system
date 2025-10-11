import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

// GET archived students with server-side filtering and search
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const academicYearId = searchParams.get('academicYearId')
    const search = searchParams.get('search')
    const gradeLevel = searchParams.get('gradeLevel')

    // Require academic year ID
    if (!academicYearId) {
      return NextResponse.json(
        { error: 'Academic year ID is required' },
        { status: 400 }
      )
    }

    // Build where clause
    const where: Prisma.StudentWhereInput = {
      // Only students enrolled in the specified academic year
      enrollments: {
        some: {
          academicYearId: academicYearId,
        },
      },
    }

    // Grade level filter
    if (gradeLevel && gradeLevel !== 'All Grades') {
      where.gradeLevel = gradeLevel
    }

    // Search filter (name, LRN, city)
    if (search && search.trim() !== '') {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { lrn: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { parentGuardian: { contains: search, mode: 'insensitive' } },
      ]
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
        section: {
          select: {
            id: true,
            name: true,
            gradeLevel: true,
          },
        },
        enrollments: {
          where: {
            academicYearId: academicYearId,
          },
          select: {
            schoolYear: true,
            gradeLevel: true,
            status: true,
            section: {
              select: {
                id: true,
                name: true,
                gradeLevel: true,
              },
            },
          },
        },
      },
      orderBy: {
        fullName: 'asc',
      },
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error('Error fetching archived students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch archived students' },
      { status: 500 }
    )
  }
}
