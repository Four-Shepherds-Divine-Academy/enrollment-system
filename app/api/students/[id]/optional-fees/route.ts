import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const assignOptionalFeeSchema = z.object({
  optionalFeeId: z.string().min(1),
  academicYearId: z.string().min(1),
  selectedVariationId: z.string().optional(),
  amount: z.number().min(0),
})

// GET student's optional fees
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const academicYearId = searchParams.get('academicYearId')

    const where: any = { studentId: id }
    if (academicYearId) where.academicYearId = academicYearId

    const studentOptionalFees = await prisma.studentOptionalFee.findMany({
      where,
      include: {
        optionalFee: {
          include: {
            variations: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(studentOptionalFees)
  } catch (error) {
    console.error('Error fetching student optional fees:', error)
    return NextResponse.json(
      { error: 'Failed to fetch student optional fees' },
      { status: 500 }
    )
  }
}

// POST assign optional fee to student
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: studentId } = await params
    const body = await request.json()
    const validatedData = assignOptionalFeeSchema.parse(body)

    // Check if already assigned
    const existing = await prisma.studentOptionalFee.findUnique({
      where: {
        studentId_academicYearId_optionalFeeId: {
          studentId,
          academicYearId: validatedData.academicYearId,
          optionalFeeId: validatedData.optionalFeeId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'This optional fee is already assigned to the student' },
        { status: 409 }
      )
    }

    const studentOptionalFee = await prisma.studentOptionalFee.create({
      data: {
        studentId,
        ...validatedData,
      },
      include: {
        optionalFee: {
          include: {
            variations: true,
          },
        },
        academicYear: true,
      },
    })

    return NextResponse.json(studentOptionalFee, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error assigning optional fee:', error)
    return NextResponse.json(
      { error: 'Failed to assign optional fee' },
      { status: 500 }
    )
  }
}

// DELETE remove optional fee from student
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: studentId } = await params
    const { searchParams } = new URL(request.url)
    const optionalFeeId = searchParams.get('optionalFeeId')
    const academicYearId = searchParams.get('academicYearId')

    if (!optionalFeeId || !academicYearId) {
      return NextResponse.json(
        { error: 'optionalFeeId and academicYearId are required' },
        { status: 400 }
      )
    }

    await prisma.studentOptionalFee.delete({
      where: {
        studentId_academicYearId_optionalFeeId: {
          studentId,
          academicYearId,
          optionalFeeId,
        },
      },
    })

    return NextResponse.json({ message: 'Optional fee removed successfully' })
  } catch (error) {
    console.error('Error removing optional fee:', error)
    return NextResponse.json(
      { error: 'Failed to remove optional fee' },
      { status: 500 }
    )
  }
}
