import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET endpoint for searching students by name or LRN (for re-enrollment)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''

    if (query.length < 2) {
      return NextResponse.json([])
    }

    const students = await prisma.student.findMany({
      where: {
        OR: [
          {
            fullName: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            firstName: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            lastName: {
              contains: query,
              mode: 'insensitive',
            },
          },
          {
            lrn: {
              contains: query,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        enrollments: {
          include: {
            academicYear: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      take: 10,
      orderBy: {
        lastName: 'asc',
      },
    })

    return NextResponse.json(students)
  } catch (error) {
    console.error('Error searching students:', error)
    return NextResponse.json(
      { error: 'Failed to search students' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, middleName, lastName, dateOfBirth } = body

    // Build full name
    const fullName = [firstName, middleName, lastName]
      .filter(Boolean)
      .join(' ')

    // Search for matching students
    const students = await prisma.student.findMany({
      where: {
        OR: [
          // Exact full name match
          {
            fullName: {
              equals: fullName,
              mode: 'insensitive',
            },
          },
          // First and last name match
          {
            AND: [
              {
                firstName: {
                  equals: firstName,
                  mode: 'insensitive',
                },
              },
              {
                lastName: {
                  equals: lastName,
                  mode: 'insensitive',
                },
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        lrn: true,
        fullName: true,
        dateOfBirth: true,
        gradeLevel: true,
        barangay: true,
        city: true,
        enrollmentStatus: true,
        enrollments: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          select: {
            schoolYear: true,
            gradeLevel: true,
          },
        },
      },
    })

    // If date of birth provided, filter by that too
    const filteredStudents = dateOfBirth
      ? students.filter(
          (s) =>
            s.dateOfBirth.toISOString().split('T')[0] ===
            new Date(dateOfBirth).toISOString().split('T')[0]
        )
      : students

    return NextResponse.json(filteredStudents)
  } catch (error) {
    console.error('Error searching students:', error)
    return NextResponse.json(
      { error: 'Failed to search students' },
      { status: 500 }
    )
  }
}
