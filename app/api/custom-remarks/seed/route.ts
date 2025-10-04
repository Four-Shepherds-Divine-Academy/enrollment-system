import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { STUDENT_REMARK_CATEGORIES } from '@/lib/constants/student-remarks'

// POST seed predefined remarks into database
export async function POST(): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let createdCount = 0
    let skippedCount = 0

    // Insert all predefined remarks
    for (const category of STUDENT_REMARK_CATEGORIES) {
      for (let i = 0; i < category.remarks.length; i++) {
        const remarkLabel = category.remarks[i]

        // Check if already exists
        const existing = await prisma.customRemark.findFirst({
          where: {
            label: remarkLabel,
            category: category.id,
          },
        })

        if (existing) {
          skippedCount++
          continue
        }

        // Create the remark
        await prisma.customRemark.create({
          data: {
            label: remarkLabel,
            category: category.id,
            sortOrder: i,
            createdBy: 'System',
            isActive: true,
          },
        })

        createdCount++
      }
    }

    return NextResponse.json({
      success: true,
      created: createdCount,
      skipped: skippedCount,
      message: `Seeded ${createdCount} remarks, skipped ${skippedCount} existing remarks`,
    })
  } catch (error) {
    console.error('Error seeding custom remarks:', error)
    return NextResponse.json(
      { error: 'Failed to seed custom remarks' },
      { status: 500 }
    )
  }
}
