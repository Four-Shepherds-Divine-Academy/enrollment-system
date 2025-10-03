import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // 'ENROLLMENT', 'SYSTEM', 'ALERT', or null for all
    const read = searchParams.get('read') // 'true', 'false', or null for all

    const where: any = {}

    if (type && type !== 'all') {
      where.type = type
    }

    if (read === 'true') {
      where.isRead = true
    } else if (read === 'false') {
      where.isRead = false
    }

    const notifications = await prisma.notification.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            lrn: true,
            gradeLevel: true,
            enrollmentStatus: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, title, message, studentId, enrollmentId } = body

    const notification = await prisma.notification.create({
      data: {
        adminId: session.user.id,
        type,
        title,
        message,
        studentId,
        enrollmentId,
      },
    })

    return NextResponse.json(notification)
  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}
