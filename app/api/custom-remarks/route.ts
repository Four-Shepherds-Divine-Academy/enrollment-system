import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { auth } from '@/auth'
import { parseRemarks } from '@/lib/utils/format-remarks'

const createRemarkSchema = z.object({
  label: z.string().min(1, 'Label is required'),
  category: z.string().min(1, 'Category is required'),
  sortOrder: z.number().optional(),
})

// GET all custom remarks
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const remarks = await prisma.customRemark.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
        { label: 'asc' },
      ],
    })

    // Get all students to count how many have each remark
    const students = await prisma.student.findMany({
      select: {
        remarks: true,
      },
    })

    // Count students for each remark
    const remarksWithCounts = remarks.map((remark) => {
      const count = students.filter((student) => {
        if (!student.remarks) return false
        const { checkboxValues } = parseRemarks(student.remarks)
        return checkboxValues.includes(remark.label)
      }).length

      return {
        ...remark,
        studentCount: count,
      }
    })

    return NextResponse.json(remarksWithCounts)
  } catch (error) {
    console.error('Error fetching custom remarks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch custom remarks' },
      { status: 500 }
    )
  }
}

// POST create new custom remark
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createRemarkSchema.parse(body)

    // Check for duplicates
    const existing = await prisma.customRemark.findFirst({
      where: {
        label: validated.label,
        category: validated.category,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'A remark with this label already exists in this category' },
        { status: 400 }
      )
    }

    const remark = await prisma.customRemark.create({
      data: {
        ...validated,
        createdBy: session.user.email || session.user.name,
      },
    })

    return NextResponse.json(remark, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating custom remark:', error)
    return NextResponse.json(
      { error: 'Failed to create custom remark' },
      { status: 500 }
    )
  }
}
