import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// GET all items in recycle bin with filters
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const entityType = searchParams.get('entityType')
    const search = searchParams.get('search')

    const where: any = {}

    // Filter by entity type
    if (entityType && entityType !== 'all') {
      where.entityType = entityType
    }

    // Search by entity name
    if (search) {
      where.entityName = {
        contains: search,
        mode: 'insensitive',
      }
    }

    const items = await prisma.recycleBin.findMany({
      where,
      orderBy: {
        deletedAt: 'desc',
      },
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching recycle bin items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recycle bin items' },
      { status: 500 }
    )
  }
}

// POST - Clean up expired items (items past 30 days)
export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()

    // Delete all items where permanentDeleteAt is in the past
    const result = await prisma.recycleBin.deleteMany({
      where: {
        permanentDeleteAt: {
          lte: now,
        },
      },
    })

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Permanently deleted ${result.count} expired items`,
    })
  } catch (error) {
    console.error('Error cleaning up recycle bin:', error)
    return NextResponse.json(
      { error: 'Failed to clean up recycle bin' },
      { status: 500 }
    )
  }
}
