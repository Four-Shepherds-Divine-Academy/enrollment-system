import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET active academic year
export async function GET() {
  try {
    const activeYear = await prisma.academicYear.findFirst({
      where: {
        isActive: true,
      },
    })

    if (!activeYear) {
      return NextResponse.json(
        { error: 'No active academic year found' },
        { status: 404 }
      )
    }

    return NextResponse.json(activeYear)
  } catch (error) {
    console.error('Error fetching active academic year:', error)
    return NextResponse.json(
      { error: 'Failed to fetch active academic year' },
      { status: 500 }
    )
  }
}
