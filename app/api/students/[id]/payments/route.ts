import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { auth } from '@/auth'

const paymentSchema = z.object({
  academicYearId: z.string().min(1, 'Academic year is required'),
  amountPaid: z.number().min(0.01, 'Amount must be greater than 0'),
  paymentDate: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'CHECK', 'BANK_TRANSFER', 'ONLINE', 'GCASH', 'PAYMAYA']).default('CASH'),
  referenceNumber: z.string().optional(),
  remarks: z.string().optional(),
  lineItems: z.array(z.object({
    feeBreakdownId: z.string(),
    amount: z.number().min(0.01),
  })).optional(),
})

const refundSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  refundAmount: z.number().min(0.01, 'Refund amount must be greater than 0'),
  refundReason: z.string().min(1, 'Refund reason is required'),
})

// GET student payment history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const academicYearId = searchParams.get('academicYearId')
    const search = searchParams.get('search')
    const paymentMethod = searchParams.get('paymentMethod')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: any = { studentId: id }
    if (academicYearId) where.academicYearId = academicYearId

    // Payment method filter
    if (paymentMethod && paymentMethod !== 'all') {
      where.paymentMethod = paymentMethod
    }

    // Date range filter (Philippine timezone UTC+8)
    if (dateFrom || dateTo) {
      where.paymentDate = {}
      if (dateFrom) {
        // Convert from Philippine date to UTC start of day
        const phDate = new Date(dateFrom)
        const utcStart = new Date(phDate.getTime() - (8 * 60 * 60 * 1000))
        where.paymentDate.gte = utcStart
      }
      if (dateTo) {
        // Convert from Philippine date to UTC end of day
        const phDate = new Date(dateTo)
        const utcEnd = new Date(phDate.getTime() + (24 * 60 * 60 * 1000) - 1 - (8 * 60 * 60 * 1000))
        where.paymentDate.lte = utcEnd
      }
    }

    // Search filter (fixed to handle null remarks)
    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        {
          remarks: {
            not: null,
            contains: search,
            mode: 'insensitive'
          }
        },
      ]
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
        lineItems: {
          include: {
            feeBreakdown: {
              select: {
                id: true,
                description: true,
                category: true,
                amount: true,
                isRefundable: true,
              },
            },
          },
        },
        refunds: {
          orderBy: {
            refundDate: 'asc',
          },
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    })

    return NextResponse.json(payments)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    )
  }
}

// POST record new payment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: studentId } = await params
    const body = await request.json()
    const validatedData = paymentSchema.parse(body)

    const session = await auth()
    const createdBy = session?.user?.id || session?.user?.email || 'system'

    // Validate line items to prevent overpayment
    if (validatedData.lineItems && validatedData.lineItems.length > 0) {
      // Get all existing payments for this student and academic year
      const existingPayments = await prisma.payment.findMany({
        where: {
          studentId,
          academicYearId: validatedData.academicYearId,
        },
        include: {
          lineItems: true,
          refunds: true,
        },
      })

      // Calculate already paid amounts per breakdown
      const paidByBreakdown: Record<string, number> = {}
      existingPayments.forEach(payment => {
        if (payment.lineItems && payment.lineItems.length > 0) {
          payment.lineItems.forEach(lineItem => {
            if (!paidByBreakdown[lineItem.feeBreakdownId]) {
              paidByBreakdown[lineItem.feeBreakdownId] = 0
            }
            paidByBreakdown[lineItem.feeBreakdownId] += lineItem.amount
          })
        }
        // Subtract refunds proportionally
        if (payment.refunds && payment.refunds.length > 0) {
          payment.refunds.forEach(refund => {
            if (payment.lineItems && payment.lineItems.length > 0) {
              const totalPaid = payment.lineItems.reduce((sum, item) => sum + item.amount, 0)
              payment.lineItems.forEach(lineItem => {
                const proportion = lineItem.amount / totalPaid
                const refundAmount = refund.amount * proportion
                if (paidByBreakdown[lineItem.feeBreakdownId]) {
                  paidByBreakdown[lineItem.feeBreakdownId] -= refundAmount
                }
              })
            }
          })
        }
      })

      // Validate each line item
      for (const item of validatedData.lineItems) {
        const breakdown = await prisma.feeBreakdown.findUnique({
          where: { id: item.feeBreakdownId },
          select: { amount: true, description: true },
        })

        if (!breakdown) {
          return NextResponse.json(
            { error: `Fee breakdown ${item.feeBreakdownId} not found` },
            { status: 400 }
          )
        }

        const alreadyPaid = paidByBreakdown[item.feeBreakdownId] || 0
        const remainingBalance = breakdown.amount - alreadyPaid

        if (item.amount > remainingBalance) {
          return NextResponse.json(
            {
              error: `Payment amount for "${breakdown.description}" exceeds remaining balance of ₱${remainingBalance.toFixed(2)}. Already paid: ₱${alreadyPaid.toFixed(2)}`
            },
            { status: 400 }
          )
        }
      }
    }

    // Create payment record with line items
    const payment = await prisma.payment.create({
      data: {
        studentId,
        academicYearId: validatedData.academicYearId,
        amountPaid: validatedData.amountPaid,
        paymentDate: validatedData.paymentDate
          ? new Date(validatedData.paymentDate)
          : new Date(),
        paymentMethod: validatedData.paymentMethod,
        referenceNumber: validatedData.referenceNumber,
        remarks: validatedData.remarks,
        createdBy,
        lineItems: validatedData.lineItems
          ? {
              create: await Promise.all(
                validatedData.lineItems.map(async (item) => {
                  const feeBreakdown = await prisma.feeBreakdown.findUnique({
                    where: { id: item.feeBreakdownId },
                    select: { description: true },
                  })
                  return {
                    feeBreakdownId: item.feeBreakdownId,
                    amount: item.amount,
                    description: feeBreakdown?.description || 'Unknown Fee',
                  }
                })
              ),
            }
          : undefined,
      },
      include: {
        academicYear: true,
        lineItems: {
          include: {
            feeBreakdown: true,
          },
        },
      },
    })

    // Update or create student fee status
    await updateStudentFeeStatus(studentId, validatedData.academicYearId)

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating payment:', error)
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    )
  }
}

// PATCH refund a payment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id: studentId } = await params
    const body = await request.json()
    const validatedData = refundSchema.parse(body)

    const session = await auth()
    const refundedBy = session?.user?.id || session?.user?.email || 'system'

    // Get the payment with existing refunds
    const payment = await prisma.payment.findUnique({
      where: { id: validatedData.paymentId },
      include: {
        refunds: true,
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    if (payment.studentId !== studentId) {
      return NextResponse.json(
        { error: 'Payment does not belong to this student' },
        { status: 400 }
      )
    }

    // Calculate refundable portion of payment based on line items
    const paymentWithLineItems = await prisma.payment.findUnique({
      where: { id: validatedData.paymentId },
      include: {
        lineItems: {
          include: {
            feeBreakdown: {
              select: {
                isRefundable: true,
              },
            },
          },
        },
        refunds: true,
      },
    })

    if (!paymentWithLineItems) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Calculate refundable amount from line items
    let refundableAmount = paymentWithLineItems.amountPaid
    if (paymentWithLineItems.lineItems && paymentWithLineItems.lineItems.length > 0) {
      // Payment has line items - use them to determine refundability
      // Only include items that are explicitly marked as refundable (true) or have no feeBreakdown info
      // Items explicitly marked as non-refundable (false) are EXCLUDED
      refundableAmount = paymentWithLineItems.lineItems
        .filter((item) => {
          // If no feeBreakdown or isRefundable is undefined/null, treat as refundable (default)
          if (!item.feeBreakdown || item.feeBreakdown.isRefundable === undefined || item.feeBreakdown.isRefundable === null) {
            return true
          }
          // Otherwise, only include if explicitly true
          return item.feeBreakdown.isRefundable === true
        })
        .reduce((sum, item) => sum + item.amount, 0)
    } else {
      // Payment doesn't have line items - check fee template to determine if refunds are allowed
      // Get the student's grade level and fee template
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { gradeLevel: true },
      })

      if (student) {
        const feeTemplate = await prisma.feeTemplate.findUnique({
          where: {
            gradeLevel_academicYearId: {
              gradeLevel: student.gradeLevel,
              academicYearId: payment.academicYearId,
            },
          },
          include: {
            breakdowns: {
              select: {
                isRefundable: true,
              },
            },
          },
        })

        // If template has any non-refundable items, block refunds for payments without line items
        // (we can't determine what the payment was for)
        if (feeTemplate?.breakdowns.some((breakdown) => breakdown.isRefundable === false)) {
          refundableAmount = 0
        }
      }
    }

    // Calculate total refunded so far
    const totalRefunded = paymentWithLineItems.refunds.reduce((sum, refund) => sum + refund.amount, 0)
    const maxRefundableAmount = refundableAmount - totalRefunded

    if (maxRefundableAmount <= 0) {
      return NextResponse.json(
        { error: 'This payment has no refundable amount remaining (all refundable items have been refunded or payment contains only non-refundable items).' },
        { status: 400 }
      )
    }

    if (validatedData.refundAmount > maxRefundableAmount) {
      return NextResponse.json(
        { error: `Refund amount cannot exceed the refundable portion of ${maxRefundableAmount}. This payment includes non-refundable fee items.` },
        { status: 400 }
      )
    }

    // Generate refund reference number
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 4).toUpperCase()
    const refundReference = `REF-${studentId.substring(0, 6).toUpperCase()}-${timestamp}-${random}`

    // Create refund record
    const refund = await prisma.refund.create({
      data: {
        paymentId: validatedData.paymentId,
        studentId,
        academicYearId: payment.academicYearId,
        amount: validatedData.refundAmount,
        reason: validatedData.refundReason,
        referenceNumber: refundReference,
        refundedBy,
      },
    })

    // Update payment's deprecated refund fields for backward compatibility
    const newTotalRefunded = totalRefunded + validatedData.refundAmount
    const isFullyRefunded = newTotalRefunded >= payment.amountPaid

    await prisma.payment.update({
      where: { id: validatedData.paymentId },
      data: {
        isRefunded: isFullyRefunded,
        refundAmount: newTotalRefunded,
        refundDate: new Date(),
        refundReason: validatedData.refundReason,
        refundedBy,
      },
    })

    // Update student fee status
    await updateStudentFeeStatus(studentId, payment.academicYearId)

    return NextResponse.json(refund)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error processing refund:', error)
    return NextResponse.json(
      { error: 'Failed to process refund' },
      { status: 500 }
    )
  }
}

// Helper function to update student fee status
async function updateStudentFeeStatus(
  studentId: string,
  academicYearId: string
) {
  // Get student info
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { gradeLevel: true },
  })

  if (!student) return

  // Get fee template for this grade level
  const feeTemplate = await prisma.feeTemplate.findUnique({
    where: {
      gradeLevel_academicYearId: {
        gradeLevel: student.gradeLevel,
        academicYearId,
      },
    },
  })

  // Calculate total payments (net of refunds)
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

  // Calculate total adjustments
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

  // Determine payment status
  let paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERPAID' = 'UNPAID'
  if (totalPaid === 0) {
    paymentStatus = 'UNPAID'
  } else if (totalPaid >= totalDue) {
    paymentStatus = totalPaid > totalDue ? 'OVERPAID' : 'PAID'
  } else {
    paymentStatus = 'PARTIAL'
  }

  // Get last payment date
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

  // Upsert student fee status
  await prisma.studentFeeStatus.upsert({
    where: {
      studentId_academicYearId: {
        studentId,
        academicYearId,
      },
    },
    update: {
      totalPaid,
      balance,
      paymentStatus,
      lastPaymentDate: lastPayment?.paymentDate,
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
