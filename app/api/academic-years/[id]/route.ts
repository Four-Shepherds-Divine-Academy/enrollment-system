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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params
    const body = await request.json()
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
        { error: 'Validation failed', details: error.errors },
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
        { error: 'Validation failed', details: error.errors },
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

// DELETE academic year and all related records (testing only)
export async function DELETE(
  request: NextRequest,
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

    // Delete all enrollments for this academic year (cascade should handle this, but being explicit)
    const deletedEnrollments = await prisma.enrollment.deleteMany({
      where: { academicYearId: id }
    })
    console.log(`Deleted ${deletedEnrollments.count} enrollments`)

    // Delete all notifications related to this academic year's enrollments
    // Note: Notifications are linked to students, not directly to academic years
    // But we can clean up orphaned notifications if needed in the future

    // Delete the academic year itself
    await prisma.academicYear.delete({
      where: { id }
    })
    console.log(`Deleted academic year: ${academicYear.name}`)

    return NextResponse.json({
      message: 'Academic year and all related records deleted successfully',
      deletedYear: academicYear.name,
      deletedEnrollments: deletedEnrollments.count
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
