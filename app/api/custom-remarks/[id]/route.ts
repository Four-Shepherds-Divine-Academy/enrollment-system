import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { auth } from '@/auth'

// PATCH update custom remark
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updateRemarkSchema = z.object({
      label: z.string().min(1, 'Label is required').optional(),
      category: z.string().min(1, 'Category is required').optional(),
      isActive: z.boolean().optional(),
      sortOrder: z.number().optional(),
    })

    const { id } = await params
    const body = await request.json()
    const validated = updateRemarkSchema.parse(body)

    // Check if remark exists
    const existing = await prisma.customRemark.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Custom remark not found' },
        { status: 404 }
      )
    }

    // Check for duplicate label if updating label or category
    if (validated.label || validated.category) {
      const duplicate = await prisma.customRemark.findFirst({
        where: {
          id: { not: id },
          label: validated.label || existing.label,
          category: validated.category || existing.category,
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'A remark with this label already exists in this category' },
          { status: 400 }
        )
      }
    }

    const remark = await prisma.customRemark.update({
      where: { id },
      data: validated,
    })

    return NextResponse.json(remark)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Error updating custom remark:', error)
    return NextResponse.json(
      { error: 'Failed to update custom remark' },
      { status: 500 }
    )
  }
}

// DELETE custom remark - Soft delete (move to recycle bin)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if remark exists
    const existing = await prisma.customRemark.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Custom remark not found' },
        { status: 404 }
      )
    }

    // Create snapshot for recycle bin
    const now = new Date()
    const permanentDeleteAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await prisma.recycleBin.create({
      data: {
        entityType: 'customRemark',
        entityId: id,
        entityData: existing,
        entityName: `${existing.label} (${existing.category})`,
        deletedBy: session.user.email || session.user.id,
        permanentDeleteAt,
      },
    })

    await prisma.customRemark.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting custom remark:', error)
    return NextResponse.json(
      { error: 'Failed to delete custom remark' },
      { status: 500 }
    )
  }
}
