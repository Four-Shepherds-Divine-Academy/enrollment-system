import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const optionalFeeUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  amount: z.number().nullable().optional(),
  category: z.enum([
    'ID_CARD',
    'UNIFORM',
    'BOOKS',
    'MISCELLANEOUS',
    'GRADUATION',
    'CERTIFICATION',
    'OTHER',
  ]).optional(),
  hasVariations: z.boolean().optional(),
  applicableGradeLevels: z.array(z.string()).optional(),
  academicYearId: z.string().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
  variations: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        amount: z.number().min(0),
      })
    )
    .optional(),
})

// GET single optional fee
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    const optionalFee = await prisma.optionalFee.findUnique({
      where: { id },
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
    })

    if (!optionalFee) {
      return NextResponse.json(
        { error: 'Optional fee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(optionalFee)
  } catch (error) {
    console.error('Error fetching optional fee:', error)
    return NextResponse.json(
      { error: 'Failed to fetch optional fee' },
      { status: 500 }
    )
  }
}

// PATCH update optional fee
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = optionalFeeUpdateSchema.parse(body)

    const { variations, ...feeData } = validatedData

    // If variations are provided, we need to handle create/update/delete
    if (variations !== undefined) {
      // Get existing variations
      const existingVariations = await prisma.optionalFeeVariation.findMany({
        where: { optionalFeeId: id },
      })

      const existingIds = existingVariations.map((v) => v.id)
      const providedIds = variations.filter((v) => v.id).map((v) => v.id!)

      // Delete removed variations
      const toDelete = existingIds.filter((id) => !providedIds.includes(id))
      if (toDelete.length > 0) {
        await prisma.optionalFeeVariation.deleteMany({
          where: { id: { in: toDelete } },
        })
      }

      // Update or create variations
      for (const variation of variations) {
        if (variation.id) {
          // Update existing
          await prisma.optionalFeeVariation.update({
            where: { id: variation.id },
            data: {
              name: variation.name,
              amount: variation.amount,
            },
          })
        } else {
          // Create new
          await prisma.optionalFeeVariation.create({
            data: {
              optionalFeeId: id,
              name: variation.name,
              amount: variation.amount,
            },
          })
        }
      }
    }

    // Update the optional fee
    const updatedFee = await prisma.optionalFee.update({
      where: { id },
      data: feeData,
      include: {
        variations: {
          orderBy: {
            amount: 'asc',
          },
        },
        academicYear: true,
      },
    })

    return NextResponse.json(updatedFee)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating optional fee:', error)
    return NextResponse.json(
      { error: 'Failed to update optional fee' },
      { status: 500 }
    )
  }
}

// DELETE optional fee
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params

    // Check if fee is assigned to any students
    const assignedCount = await prisma.studentOptionalFee.count({
      where: { optionalFeeId: id },
    })

    if (assignedCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete optional fee. It is currently assigned to ${assignedCount} student(s).`,
          assignedCount,
        },
        { status: 400 }
      )
    }

    await prisma.optionalFee.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Optional fee deleted successfully' })
  } catch (error) {
    console.error('Error deleting optional fee:', error)
    return NextResponse.json(
      { error: 'Failed to delete optional fee' },
      { status: 500 }
    )
  }
}
