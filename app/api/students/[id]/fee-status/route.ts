import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateStatusSchema = z.object({
  isLatePayment: z.boolean(),
  lateSince: z.string().optional().nullable(),
})

// GET student fee status
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

    if (!academicYearId) {
      return NextResponse.json(
        { error: 'Academic year ID is required' },
        { status: 400 }
      )
    }

    // Get or create fee status
    let feeStatus = await prisma.studentFeeStatus.findUnique({
      where: {
        studentId_academicYearId: {
          studentId: id,
          academicYearId,
        },
      },
      include: {
        feeTemplate: {
          include: {
            breakdowns: {
              orderBy: {
                order: 'asc',
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            fullName: true,
            gradeLevel: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    // If no fee status exists, create one
    if (!feeStatus) {
      const student = await prisma.student.findUnique({
        where: { id },
        select: { gradeLevel: true },
      })

      if (!student) {
        return NextResponse.json(
          { error: 'Student not found' },
          { status: 404 }
        )
      }

      const feeTemplate = await prisma.feeTemplate.findUnique({
        where: {
          gradeLevel_academicYearId: {
            gradeLevel: student.gradeLevel,
            academicYearId,
          },
        },
        include: {
          breakdowns: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      })

      feeStatus = await prisma.studentFeeStatus.create({
        data: {
          studentId: id,
          academicYearId,
          feeTemplateId: feeTemplate?.id,
          baseFee: feeTemplate?.totalAmount || 0,
          totalDue: feeTemplate?.totalAmount || 0,
          totalPaid: 0,
          balance: feeTemplate?.totalAmount || 0,
          totalAdjustments: 0,
          paymentStatus: 'UNPAID',
        },
        include: {
          feeTemplate: {
            include: {
              breakdowns: {
                orderBy: {
                  order: 'asc',
                },
              },
            },
          },
          student: {
            select: {
              id: true,
              fullName: true,
              gradeLevel: true,
            },
          },
          academicYear: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })
    }

    // Get payment history with filters
    const paymentWhere: any = {
      studentId: id,
      academicYearId,
    }

    // Payment method filter
    if (paymentMethod && paymentMethod !== 'all') {
      paymentWhere.paymentMethod = paymentMethod
    }

    // Date range filter (Philippine timezone UTC+8)
    if (dateFrom || dateTo) {
      paymentWhere.paymentDate = {}
      if (dateFrom) {
        // Convert from Philippine date to UTC start of day
        // Philippine midnight = UTC 16:00 previous day
        const phDate = new Date(dateFrom)
        const utcStart = new Date(phDate.getTime() - (8 * 60 * 60 * 1000))
        paymentWhere.paymentDate.gte = utcStart
      }
      if (dateTo) {
        // Convert from Philippine date to UTC end of day
        // Philippine 23:59:59 = UTC 15:59:59 same day
        const phDate = new Date(dateTo)
        const utcEnd = new Date(phDate.getTime() + (24 * 60 * 60 * 1000) - 1 - (8 * 60 * 60 * 1000))
        paymentWhere.paymentDate.lte = utcEnd
      }
    }

    // Search filter (fixed to handle null remarks)
    if (search) {
      paymentWhere.OR = [
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
      where: paymentWhere,
      include: {
        lineItems: {
          include: {
            feeBreakdown: {
              select: {
                id: true,
                description: true,
                category: true,
                amount: true,
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

    // Get adjustments
    const adjustments = await prisma.paymentAdjustment.findMany({
      where: {
        studentId: id,
        academicYearId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Recalculate totals to ensure accuracy (net of refunds)
    const totalPaid = payments.reduce((sum, payment) => {
      return sum + (payment.amountPaid - (payment.refundAmount || 0))
    }, 0)

    const totalAdjustments = adjustments.reduce((sum, adj) => {
      return sum + (adj.type === 'DISCOUNT' ? -adj.amount : adj.amount)
    }, 0)

    const baseFee = feeStatus.feeTemplate?.totalAmount || feeStatus.baseFee || 0
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

    return NextResponse.json({
      ...feeStatus,
      baseFee,
      totalAdjustments,
      totalDue,
      totalPaid,
      balance,
      paymentStatus,
      payments,
      adjustments,
    })
  } catch (error) {
    console.error('Error fetching fee status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fee status' },
      { status: 500 }
    )
  }
}

// PATCH update late payment status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const academicYearId = searchParams.get('academicYearId')

    if (!academicYearId) {
      return NextResponse.json(
        { error: 'Academic year ID is required' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validatedData = updateStatusSchema.parse(body)

    const feeStatus = await prisma.studentFeeStatus.update({
      where: {
        studentId_academicYearId: {
          studentId: id,
          academicYearId,
        },
      },
      data: {
        isLatePayment: validatedData.isLatePayment,
        lateSince: validatedData.lateSince
          ? new Date(validatedData.lateSince)
          : null,
      },
      include: {
        feeTemplate: {
          include: {
            breakdowns: true,
          },
        },
        student: true,
        academicYear: true,
      },
    })

    return NextResponse.json(feeStatus)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error updating fee status:', error)
    return NextResponse.json(
      { error: 'Failed to update fee status' },
      { status: 500 }
    )
  }
}
