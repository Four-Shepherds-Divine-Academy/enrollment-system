import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST mark optional fee as paid
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; feeId: string }> }
): Promise<NextResponse> {
  try {
    const { id: studentId, feeId } = await params
    const body = await request.json()
    const { academicYearId, amountPaid } = body

    if (!academicYearId) {
      return NextResponse.json(
        { error: 'academicYearId is required' },
        { status: 400 }
      )
    }

    // Get the fee first to get the current amount
    const fee = await prisma.studentOptionalFee.findUnique({
      where: {
        studentId_academicYearId_optionalFeeId: {
          studentId,
          academicYearId,
          optionalFeeId: feeId,
        },
      },
    })

    if (!fee) {
      return NextResponse.json(
        { error: 'Optional fee not found' },
        { status: 404 }
      )
    }

    // Calculate new paid amount
    const paymentAmount = amountPaid || fee.amount
    const newPaidAmount = (fee.paidAmount || 0) + paymentAmount

    // Check if payment exceeds total amount
    if (newPaidAmount > fee.amount) {
      return NextResponse.json(
        { error: 'Payment amount exceeds total fee amount' },
        { status: 400 }
      )
    }

    // Mark as paid only if full amount is paid
    const isFullyPaid = newPaidAmount >= fee.amount

    // Update the optional fee with new paid amount
    const updatedFee = await prisma.studentOptionalFee.update({
      where: {
        studentId_academicYearId_optionalFeeId: {
          studentId,
          academicYearId,
          optionalFeeId: feeId,
        },
      },
      data: {
        isPaid: isFullyPaid,
        paidAmount: newPaidAmount,
      },
    })

    return NextResponse.json({
      message: isFullyPaid ? 'Optional fee marked as paid' : 'Partial payment recorded',
      fee: updatedFee
    })
  } catch (error) {
    console.error('Error marking optional fee as paid:', error)
    return NextResponse.json(
      { error: 'Failed to mark optional fee as paid' },
      { status: 500 }
    )
  }
}
