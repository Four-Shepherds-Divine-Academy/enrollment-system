import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  totalAmount: z.number().min(0).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  breakdowns: z
    .array(
      z.object({
        id: z.string().optional(),
        description: z.string().min(1),
        amount: z.number().min(0),
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

// GET single fee template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const template = await prisma.feeTemplate.findUnique({
      where: { id },
      include: {
        breakdowns: {
          orderBy: {
            order: 'asc',
          },
        },
        academicYear: true,
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Fee template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching fee template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fee template' },
      { status: 500 }
    )
  }
}

// PUT update fee template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateSchema.parse(body)

    const { breakdowns, ...templateData } = validatedData

    // If breakdowns are provided, update them
    if (breakdowns) {
      // Delete existing breakdowns
      await prisma.feeBreakdown.deleteMany({
        where: { feeTemplateId: id },
      })

      // Create new breakdowns
      await prisma.feeBreakdown.createMany({
        data: breakdowns.map((b) => ({
          feeTemplateId: id,
          description: b.description,
          amount: b.amount,
          category: b.category,
          order: b.order,
        })),
      })
    }

    const template = await prisma.feeTemplate.update({
      where: { id },
      data: templateData,
      include: {
        breakdowns: {
          orderBy: {
            order: 'asc',
          },
        },
        academicYear: true,
      },
    })

    return NextResponse.json(template)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating fee template:', error)
    return NextResponse.json(
      { error: 'Failed to update fee template' },
      { status: 500 }
    )
  }
}

// DELETE fee template - Soft delete (move to recycle bin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    // Check if any students are using this template
    const studentsUsingTemplate = await prisma.studentFeeStatus.count({
      where: { feeTemplateId: id },
    })

    if (studentsUsingTemplate > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete fee template. ${studentsUsingTemplate} student(s) are currently using this template.`,
        },
        { status: 409 }
      )
    }

    // Get full template data for recycle bin
    const template = await prisma.feeTemplate.findUnique({
      where: { id },
      include: {
        breakdowns: true,
        academicYear: true,
      },
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Fee template not found' },
        { status: 404 }
      )
    }

    // Create snapshot for recycle bin
    const now = new Date()
    const permanentDeleteAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await prisma.recycleBin.create({
      data: {
        entityType: 'feeTemplate',
        entityId: id,
        entityData: template,
        entityName: template.name,
        deletedBy: 'admin', // Could be enhanced to get actual user from session
        permanentDeleteAt,
      },
    })

    await prisma.feeTemplate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting fee template:', error)
    return NextResponse.json(
      { error: 'Failed to delete fee template' },
      { status: 500 }
    )
  }
}
