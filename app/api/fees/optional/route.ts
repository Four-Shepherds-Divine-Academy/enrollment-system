import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const optionalFeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  amount: z.number().nullable(),
  category: z.enum([
    'ID_CARD',
    'UNIFORM',
    'BOOKS',
    'MISCELLANEOUS',
    'GRADUATION',
    'CERTIFICATION',
    'OTHER',
  ]),
  hasVariations: z.boolean().default(false),
  applicableGradeLevels: z.array(z.string()).default([]),
  academicYearId: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
  variations: z
    .array(
      z.object({
        name: z.string().min(1),
        amount: z.number().min(0),
      })
    )
    .optional(),
})

// GET all optional fees
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const academicYearId = searchParams.get('academicYearId')
    const gradeLevel = searchParams.get('gradeLevel')
    const category = searchParams.get('category')
    const isActive = searchParams.get('isActive')
    const search = searchParams.get('search')

    const where: any = {}

    if (academicYearId) where.academicYearId = academicYearId
    if (category) where.category = category
    if (isActive) where.isActive = isActive === 'true'

    // Search filter - search in name and description
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Filter by grade level - show if applicableGradeLevels is empty or includes the grade
    if (gradeLevel) {
      // If search exists, we need to combine with AND
      if (search) {
        where.AND = [
          { OR: where.OR }, // Search condition
          {
            OR: [
              { applicableGradeLevels: { isEmpty: true } },
              { applicableGradeLevels: { has: gradeLevel } },
            ],
          },
        ]
        delete where.OR
      } else {
        where.OR = [
          { applicableGradeLevels: { isEmpty: true } },
          { applicableGradeLevels: { has: gradeLevel } },
        ]
      }
    }

    const optionalFees = await prisma.optionalFee.findMany({
      where,
      include: {
        variations: {
          orderBy: {
            amount: 'asc',
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json(optionalFees)
  } catch (error) {
    console.error('Error fetching optional fees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch optional fees' },
      { status: 500 }
    )
  }
}

// POST create new optional fee
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const validatedData = optionalFeeSchema.parse(body)

    const { variations, ...feeData } = validatedData

    const optionalFee = await prisma.optionalFee.create({
      data: {
        ...feeData,
        variations: variations
          ? {
              create: variations,
            }
          : undefined,
      },
      include: {
        variations: true,
        academicYear: true,
      },
    })

    return NextResponse.json(optionalFee, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating optional fee:', error)
    return NextResponse.json(
      { error: 'Failed to create optional fee' },
      { status: 500 }
    )
  }
}
