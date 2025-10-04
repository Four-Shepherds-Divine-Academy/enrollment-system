import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const feeTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  gradeLevel: z.string().min(1, 'Grade level is required'),
  academicYearId: z.string().min(1, 'Academic year is required'),
  totalAmount: z.number().min(0, 'Total amount must be positive'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  breakdowns: z
    .array(
      z.object({
        description: z.string().min(1, 'Description is required'),
        amount: z.number().min(0, 'Amount must be positive'),
        category: z.enum([
          'TUITION',
          'BOOKS',
          'UNIFORM',
          'LABORATORY',
          'LIBRARY',
          'ID_CARD',
          'EXAM',
          'REGISTRATION',
          'MISC',
        ]),
        order: z.number().default(0),
      })
    )
    .optional(),
})

// GET all fee templates
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const gradeLevel = searchParams.get('gradeLevel')
    const academicYearId = searchParams.get('academicYearId')
    const search = searchParams.get('search')
    const category = searchParams.get('category')

    const where: any = {}

    if (gradeLevel && gradeLevel !== 'all') where.gradeLevel = gradeLevel
    if (academicYearId) where.academicYearId = academicYearId

    // Search in name or description
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { not: null, contains: search, mode: 'insensitive' } },
      ]
    }

    // Filter by category (in breakdowns)
    if (category && category !== 'all') {
      where.breakdowns = {
        some: {
          category: category,
        },
      }
    }

    const templates = await prisma.feeTemplate.findMany({
      where,
      include: {
        breakdowns: {
          orderBy: {
            order: 'asc',
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
      orderBy: [
        { gradeLevel: 'asc' },
        { createdAt: 'desc' },
      ],
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching fee templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fee templates' },
      { status: 500 }
    )
  }
}

// POST create new fee template
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json()
    const validatedData = feeTemplateSchema.parse(body)

    // Check if template already exists for this grade and year
    const existing = await prisma.feeTemplate.findUnique({
      where: {
        gradeLevel_academicYearId: {
          gradeLevel: validatedData.gradeLevel,
          academicYearId: validatedData.academicYearId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        {
          error: `Fee template already exists for ${validatedData.gradeLevel} in this academic year`,
        },
        { status: 409 }
      )
    }

    const { breakdowns, ...templateData } = validatedData

    const template = await prisma.feeTemplate.create({
      data: {
        ...templateData,
        breakdowns: breakdowns
          ? {
              create: breakdowns,
            }
          : undefined,
      },
      include: {
        breakdowns: {
          orderBy: {
            order: 'asc',
          },
        },
        academicYear: true,
      },
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating fee template:', error)
    return NextResponse.json(
      { error: 'Failed to create fee template' },
      { status: 500 }
    )
  }
}
