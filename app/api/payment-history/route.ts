import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all students' payment status
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const academicYearId = searchParams.get('academicYearId')
    const paymentStatus = searchParams.get('paymentStatus')
    const gradeLevel = searchParams.get('gradeLevel')

    if (!academicYearId) {
      return NextResponse.json(
        { error: 'Academic year ID is required' },
        { status: 400 }
      )
    }

    // First, get all students who are not DROPPED
    const studentWhere: any = {
      enrollmentStatus: {
        not: 'DROPPED'
      }
    }

    if (gradeLevel && gradeLevel !== 'All Grades') {
      studentWhere.gradeLevel = gradeLevel
    }

    const students = await prisma.student.findMany({
      where: studentWhere,
      select: {
        id: true,
        fullName: true,
        gradeLevel: true,
        contactNumber: true,
      },
    })

    // Get all existing fee statuses in a single query
    const existingStatuses = await prisma.studentFeeStatus.findMany({
      where: {
        academicYearId,
        studentId: {
          in: students.map(s => s.id)
        }
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            gradeLevel: true,
            contactNumber: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
        feeTemplate: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // Create a map of existing statuses by studentId for quick lookup
    const existingStatusMap = new Map(
      existingStatuses.map(status => [status.studentId, status])
    )

    // Find students that don't have a fee status yet
    const studentsNeedingStatus = students.filter(
      student => !existingStatusMap.has(student.id)
    )

    // Batch create missing fee statuses
    const newStatuses = []
    if (studentsNeedingStatus.length > 0) {
      // Get all fee templates in one query
      const feeTemplates = await prisma.feeTemplate.findMany({
        where: {
          academicYearId,
          gradeLevel: {
            in: [...new Set(studentsNeedingStatus.map(s => s.gradeLevel))]
          }
        },
      })

      const feeTemplateMap = new Map(
        feeTemplates.map(template => [template.gradeLevel, template])
      )

      // Create fee statuses for students that need them using upsert
      for (const student of studentsNeedingStatus) {
        try {
          const feeTemplate = feeTemplateMap.get(student.gradeLevel)

          const status = await prisma.studentFeeStatus.upsert({
            where: {
              studentId_academicYearId: {
                studentId: student.id,
                academicYearId,
              },
            },
            create: {
              studentId: student.id,
              academicYearId,
              feeTemplateId: feeTemplate?.id,
              baseFee: feeTemplate?.totalAmount || 0,
              totalDue: feeTemplate?.totalAmount || 0,
              totalPaid: 0,
              balance: feeTemplate?.totalAmount || 0,
              totalAdjustments: 0,
              paymentStatus: 'UNPAID',
            },
            update: {},
            include: {
              student: {
                select: {
                  id: true,
                  fullName: true,
                  gradeLevel: true,
                  contactNumber: true,
                },
              },
              academicYear: {
                select: {
                  id: true,
                  name: true,
                },
              },
              feeTemplate: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          })

          newStatuses.push(status)
        } catch (error: any) {
          console.error(`Error upserting fee status for student ${student.id}:`, error)
        }
      }
    }

    // Combine existing and newly created statuses
    const allStatuses = [...existingStatuses, ...newStatuses]

    // Apply payment status filter if specified
    let filteredStatuses = allStatuses
    if (paymentStatus && paymentStatus !== 'ALL') {
      filteredStatuses = filteredStatuses.filter(s => s.paymentStatus === paymentStatus)
    }

    // Sort by grade level and name
    const gradeOrder = ['Kinder 1', 'Kinder 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']

    filteredStatuses.sort((a, b) => {
      const aIndex = gradeOrder.indexOf(a.student.gradeLevel)
      const bIndex = gradeOrder.indexOf(b.student.gradeLevel)

      // If both grades are in the order list, compare by index
      if (aIndex !== -1 && bIndex !== -1) {
        if (aIndex !== bIndex) return aIndex - bIndex
      } else if (aIndex !== -1) {
        return -1 // a is in list, b is not, a comes first
      } else if (bIndex !== -1) {
        return 1 // b is in list, a is not, b comes first
      }

      // If grades are the same or both not in list, sort by name
      return a.student.fullName.localeCompare(b.student.fullName)
    })

    return NextResponse.json(filteredStatuses)
  } catch (error) {
    console.error('Error fetching payment history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    )
  }
}
