import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Vercel Cron Job - Automatic Recycle Bin Cleanup
 * Runs daily at midnight UTC to permanently delete items past their 30-day retention period
 *
 * This endpoint is protected by a CRON_SECRET environment variable
 * Configure in vercel.json with schedule: "0 0 * * *" (daily at midnight)
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET environment variable is not set')
      return NextResponse.json(
        { error: 'Cron job not configured' },
        { status: 500 }
      )
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('Unauthorized cron job access attempt')
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

    console.log(`[Cron] Recycle bin cleanup completed: ${result.count} items permanently deleted`)

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Permanently deleted ${result.count} expired items`,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('[Cron] Error cleaning up recycle bin:', error)
    return NextResponse.json(
      {
        error: 'Failed to clean up recycle bin',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
