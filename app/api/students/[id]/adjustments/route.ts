import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { auth } from '@/auth'

const adjustmentSchema = z.object({
  academicYearId: z.string().min(1, 'Academic year is required'),
  type: z.enum(['DISCOUNT', 'ADDITIONAL']),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  reason: z.string().min(1, 'Reason is required'),
  description: z.string().optional(),
})

// GET student adjustments
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

    const adjustments = await prisma.paymentAdjustment.findMany({
      where,
      include: {
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

    return NextResponse.json(adjustments)
  } catch (error) {
    console.error('Error fetching adjustments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch adjustments' },
      { status: 500 }
    )
  }
}

// POST create adjustment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: studentId } = await params
    const body = await request.json()
    const validatedData = adjustmentSchema.parse(body)

    const session = await auth()
    const createdBy = session?.user?.id || session?.user?.email || 'system'

    const adjustment = await prisma.paymentAdjustment.create({
      data: {
        studentId,
        academicYearId: validatedData.academicYearId,
        type: validatedData.type,
        amount: validatedData.amount,
        reason: validatedData.reason,
        description: validatedData.description,
        createdBy,
      },
      include: {
        academicYear: true,
      },
    })

    // Update student fee status
    await updateStudentFeeStatus(studentId, validatedData.academicYearId)

    return NextResponse.json(adjustment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error creating adjustment:', error)
    return NextResponse.json(
      { error: 'Failed to create adjustment' },
      { status: 500 }
    )
  }
}

// Helper function to update student fee status
async function updateStudentFeeStatus(
  studentId: string,
  academicYearId: string
) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { gradeLevel: true },
  })

  if (!student) return

  const feeTemplate = await prisma.feeTemplate.findUnique({
    where: {
      gradeLevel_academicYearId: {
        gradeLevel: student.gradeLevel,
        academicYearId,
      },
    },
  })

  const payments = await prisma.payment.findMany({
    where: {
      studentId,
      academicYearId,
    },
    select: {
      amountPaid: true,
      refundAmount: true,
    },
  })

  const totalPaid = payments.reduce((sum, payment) => {
    return sum + (payment.amountPaid - payment.refundAmount)
  }, 0)

  const adjustments = await prisma.paymentAdjustment.findMany({
    where: {
      studentId,
      academicYearId,
    },
  })

  const totalAdjustments = adjustments.reduce((sum, adj) => {
    return sum + (adj.type === 'DISCOUNT' ? -adj.amount : adj.amount)
  }, 0)

  const baseFee = feeTemplate?.totalAmount || 0
  const totalDue = baseFee + totalAdjustments
  const balance = totalDue - totalPaid

  let paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERPAID' = 'UNPAID'
  if (totalPaid === 0) {
    paymentStatus = 'UNPAID'
  } else if (totalPaid >= totalDue) {
    paymentStatus = totalPaid > totalDue ? 'OVERPAID' : 'PAID'
  } else {
    paymentStatus = 'PARTIAL'
  }

  const lastPayment = await prisma.payment.findFirst({
    where: {
      studentId,
      academicYearId,
    },
    orderBy: {
      paymentDate: 'desc',
    },
    select: {
      paymentDate: true,
    },
  })

  await prisma.studentFeeStatus.upsert({
    where: {
      studentId_academicYearId: {
        studentId,
        academicYearId,
      },
    },
    update: {
      totalAdjustments,
      totalDue,
      balance,
      paymentStatus,
    },
    create: {
      studentId,
      academicYearId,
      feeTemplateId: feeTemplate?.id,
      baseFee,
      totalAdjustments,
      totalDue,
      totalPaid,
      balance,
      paymentStatus,
      lastPaymentDate: lastPayment?.paymentDate,
    },
  })
}
