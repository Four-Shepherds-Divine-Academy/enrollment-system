import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { prepopulateAcademicYearData } from '@/lib/academic-year-helpers'

const academicYearSchema = z.object({
  name: z.string().min(1, 'Academic year name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
})

// GET all academic years
export async function GET() {
  try {
    const academicYears = await prisma.academicYear.findMany({
      orderBy: {
        startDate: 'desc',
      },
      include: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    })

    return NextResponse.json(academicYears)
  } catch (error) {
    console.error('Error fetching academic years:', error)
    return NextResponse.json(
      { error: 'Failed to fetch academic years' },
      { status: 500 }
    )
  }
}

// POST create new academic year
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = academicYearSchema.parse(body)

    // Check if there's already an active academic year
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    })

    // Deactivate previous active year if creating a new one
    if (activeYear) {
      await prisma.academicYear.update({
        where: { id: activeYear.id },
        data: { isActive: false },
      })
    }

    const academicYear = await prisma.academicYear.create({
      data: {
        name: validatedData.name,
        startDate: new Date(validatedData.startDate),
        endDate: validatedData.endDate
          ? new Date(validatedData.endDate)
          : null,
        isActive: true,
      },
    })

    // Prepopulate data for the new academic year
    const prepopulationSummary = await prepopulateAcademicYearData(academicYear.id)

    return NextResponse.json(
      {
        academicYear,
        prepopulation: prepopulationSummary,
        message: 'Academic year created successfully with prepopulated data',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating academic year:', error)
    return NextResponse.json(
      { error: 'Failed to create academic year' },
      { status: 500 }
    )
  }
}
