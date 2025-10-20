import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateRemarksSchema = z.object({
  remarks: z.string().optional().nullable(),
})

// PATCH update payment remarks only
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
): Promise<NextResponse> {
  try {
    const { id: studentId, paymentId } = await params
    const body = await request.json()
    const validatedData = updateRemarksSchema.parse(body)

    // Verify payment belongs to student
    const existingPayment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: { studentId: true },
    })

    if (!existingPayment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    if (existingPayment.studentId !== studentId) {
      return NextResponse.json(
        { error: 'Payment does not belong to this student' },
        { status: 400 }
      )
    }

    // Update only remarks field
    const updatedPayment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        remarks: validatedData.remarks,
      },
      include: {
        academicYear: true,
        lineItems: {
          include: {
            feeBreakdown: true,
          },
        },
        refunds: {
          orderBy: {
            refundDate: 'asc',
          },
        },
      },
    })

    return NextResponse.json(updatedPayment)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating payment remarks:', error)
    return NextResponse.json(
      { error: 'Failed to update payment remarks' },
      { status: 500 }
    )
  }
}
