import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH update optional fee amount
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; feeId: string }> }
): Promise<NextResponse> {
  try {
    const { id: studentId, feeId } = await params
    const body = await request.json()
    const { academicYearId, amount } = body

    if (!academicYearId || amount === undefined) {
      return NextResponse.json(
        { error: 'academicYearId and amount are required' },
        { status: 400 }
      )
    }

    // Update the optional fee amount
    const updatedFee = await prisma.studentOptionalFee.update({
      where: {
        studentId_academicYearId_optionalFeeId: {
          studentId,
          academicYearId,
          optionalFeeId: feeId,
        },
      },
      data: {
        amount,
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

    return NextResponse.json(updatedFee)
  } catch (error) {
    console.error('Error updating optional fee:', error)
    return NextResponse.json(
      { error: 'Failed to update optional fee' },
      { status: 500 }
    )
  }
}
