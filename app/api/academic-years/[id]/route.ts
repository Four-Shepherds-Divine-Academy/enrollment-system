import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { setActiveAcademicYear } from '@/lib/academic-year'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

const fullUpdateSchema = z.object({
  name: z.string().min(1),
  startDate: z.string(),
  endDate: z.string().nullable().optional(),
})

// PUT update academic year (full update)
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await _request.json()
    const validatedData = fullUpdateSchema.parse(body)

    const academicYear = await prisma.academicYear.update({
      where: { id },
      data: {
        name: validatedData.name,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : null,
      },
    })

    return NextResponse.json(academicYear)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating academic year:', error)
    return NextResponse.json(
      { error: 'Failed to update academic year' },
      { status: 500 }
    )
  }
}

// PATCH update academic year
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()
    const validatedData = updateSchema.parse(body)

    const data: any = {}

    // Update name if provided
    if (validatedData.name) {
      data.name = validatedData.name
    }

    // Update startDate if provided
    if (validatedData.startDate) {
      data.startDate = new Date(validatedData.startDate)
    }

    // Update endDate if provided (can be null)
    if (validatedData.endDate !== undefined) {
      data.endDate = validatedData.endDate ? new Date(validatedData.endDate) : null
    }

    // If setting to active, use the utility function to ensure only one active year
    if (validatedData.isActive === true) {
      await setActiveAcademicYear(id)

      // Apply other updates if any
      if (Object.keys(data).length > 0) {
        await prisma.academicYear.update({
          where: { id },
          data,
        })
      }

      const academicYear = await prisma.academicYear.findUnique({
        where: { id },
      })
      return NextResponse.json(academicYear)
    } else if (typeof validatedData.isActive === 'boolean') {
      data.isActive = validatedData.isActive
    }

    const academicYear = await prisma.academicYear.update({
      where: { id },
      data,
    })

    return NextResponse.json(academicYear)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating academic year:', error)
    return NextResponse.json(
      { error: 'Failed to update academic year' },
      { status: 500 }
    )
  }
}

// POST end or activate academic year
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    console.log('Received request for academic year ID:', id)

    const { action } = await request.json()
    console.log('Action:', action)

    if (action === 'end') {
      const academicYear = await prisma.academicYear.update({
        where: { id },
        data: {
          isActive: false,
          endDate: new Date(),
        },
      })

      return NextResponse.json({
        ...academicYear,
        message: 'Academic year ended successfully',
      })
    }

    if (action === 'activate') {
      console.log('Activating academic year:', id)

      // Use utility function to ensure only one active year
      await setActiveAcademicYear(id)

      const academicYear = await prisma.academicYear.findUnique({
        where: { id },
      })
      console.log('Activated year:', academicYear?.name)

      return NextResponse.json({
        ...academicYear,
        message: 'Academic year activated successfully',
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating academic year:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      {
        error: 'Failed to update academic year',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

// DELETE academic year - Soft delete (move to recycle bin)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    console.log('Deleting academic year ID:', id)

    // Check if academic year exists
    const academicYear = await prisma.academicYear.findUnique({
      where: { id },
      include: {
        _count: {
          select: { enrollments: true }
        }
      }
    })

    if (!academicYear) {
      return NextResponse.json(
        { error: 'Academic year not found' },
        { status: 404 }
      )
    }

    console.log(`Found academic year: ${academicYear.name} with ${academicYear._count.enrollments} enrollments`)

    // Create snapshot for recycle bin
    const now = new Date()
    const permanentDeleteAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await prisma.recycleBin.create({
      data: {
        entityType: 'academicYear',
        entityId: id,
        entityData: academicYear,
        entityName: academicYear.name,
        deletedBy: 'admin', // Could be enhanced to get actual user from session
        permanentDeleteAt,
      },
    })

    // Delete all related records in the correct order to avoid foreign key constraints

    // 1. Delete student fee statuses for this academic year
    const deletedFeeStatuses = await prisma.studentFeeStatus.deleteMany({
      where: { academicYearId: id }
    })
    console.log(`Deleted ${deletedFeeStatuses.count} student fee statuses`)

    // 2. Delete payments for this academic year
    const deletedPayments = await prisma.payment.deleteMany({
      where: { academicYearId: id }
    })
    console.log(`Deleted ${deletedPayments.count} payments`)

    // 3. Delete student optional fees for this academic year
    const deletedOptionalFees = await prisma.studentOptionalFee.deleteMany({
      where: { academicYearId: id }
    })
    console.log(`Deleted ${deletedOptionalFees.count} student optional fees`)

    // 4. Delete payment adjustments for this academic year
    const deletedAdjustments = await prisma.paymentAdjustment.deleteMany({
      where: { academicYearId: id }
    })
    console.log(`Deleted ${deletedAdjustments.count} payment adjustments`)

    // 5. Delete refunds for this academic year
    const deletedRefunds = await prisma.refund.deleteMany({
      where: { academicYearId: id }
    })
    console.log(`Deleted ${deletedRefunds.count} refunds`)

    // 6. Delete fee templates for this academic year
    const deletedFeeTemplates = await prisma.feeTemplate.deleteMany({
      where: { academicYearId: id }
    })
    console.log(`Deleted ${deletedFeeTemplates.count} fee templates`)

    // 7. Delete enrollments for this academic year
    const deletedEnrollments = await prisma.enrollment.deleteMany({
      where: { academicYearId: id }
    })
    console.log(`Deleted ${deletedEnrollments.count} enrollments`)

    // 8. Finally, delete the academic year itself
    await prisma.academicYear.delete({
      where: { id }
    })
    console.log(`Deleted academic year: ${academicYear.name}`)

    return NextResponse.json({
      message: 'Academic year and all related records deleted successfully',
      deletedYear: academicYear.name,
      deletedEnrollments: deletedEnrollments.count,
      deletedFeeStatuses: deletedFeeStatuses.count,
      deletedPayments: deletedPayments.count,
      deletedOptionalFees: deletedOptionalFees.count,
      deletedAdjustments: deletedAdjustments.count,
      deletedRefunds: deletedRefunds.count,
      deletedFeeTemplates: deletedFeeTemplates.count,
    })
  } catch (error) {
    console.error('Error deleting academic year:', error)
    return NextResponse.json(
      {
        error: 'Failed to delete academic year',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
