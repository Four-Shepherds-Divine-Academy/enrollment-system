import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { parseRemarks } from '@/lib/utils/format-remarks'

// GET students with a specific remark
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const remarkLabel = searchParams.get('label')

    if (!remarkLabel) {
      return NextResponse.json({ error: 'Remark label is required' }, { status: 400 })
    }

    // Get all students
    const students = await prisma.student.findMany({
      select: {
        id: true,
        firstName: true,
        middleName: true,
        lastName: true,
        lrn: true,
        gradeLevel: true,
        section: {
          select: {
            name: true,
          },
        },
        remarks: true,
      },
    })

    // Filter students who have this remark
    const studentsWithRemark = students.filter((student) => {
      if (!student.remarks) return false

      const { checkboxValues } = parseRemarks(student.remarks)
      return checkboxValues.includes(remarkLabel)
    })

    // Format the response
    const formattedStudents = studentsWithRemark.map((student) => ({
      id: student.id,
      name: `${student.firstName} ${student.middleName ? student.middleName + ' ' : ''}${student.lastName}`,
      lrn: student.lrn,
      gradeLevel: student.gradeLevel,
      section: student.section?.name || 'Not Assigned',
    }))

    return NextResponse.json(formattedStudents)
  } catch (error) {
    console.error('Error fetching students by remark:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}
