import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// PATCH - Restore item from recycle bin
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Get the recycle bin item
    const recycleBinItem = await prisma.recycleBin.findUnique({
      where: { id },
    })

    if (!recycleBinItem) {
      return NextResponse.json(
        { error: 'Item not found in recycle bin' },
        { status: 404 }
      )
    }

    const { entityType, entityId, entityData } = recycleBinItem
    const data = entityData as any

    // Restore based on entity type
    switch (entityType) {
      case 'student':
        // Extract enrollments and other nested data
        const { enrollments, section, payments, paymentAdjustments, feeStatus, refunds, notifications, ...studentData } = data

        // Create student without nested relations
        await prisma.student.create({
          data: {
            id: entityId,
            ...studentData,
            dateOfBirth: new Date(studentData.dateOfBirth),
            createdAt: new Date(studentData.createdAt),
            updatedAt: new Date(studentData.updatedAt),
          },
        })

        // Restore enrollments if they exist
        if (enrollments && Array.isArray(enrollments)) {
          for (const enrollment of enrollments) {
            await prisma.enrollment.create({
              data: {
                id: enrollment.id,
                studentId: entityId,
                academicYearId: enrollment.academicYearId,
                schoolYear: enrollment.schoolYear,
                gradeLevel: enrollment.gradeLevel,
                sectionId: enrollment.sectionId,
                status: enrollment.status,
                enrollmentDate: new Date(enrollment.enrollmentDate),
                createdAt: new Date(enrollment.createdAt),
                updatedAt: new Date(enrollment.updatedAt),
              },
            })
          }
        }
        break

      case 'section':
        // Extract nested relations
        const { students: sectionStudents, enrollments: sectionEnrollments, _count: sectionCount, ...sectionData } = data

        await prisma.section.create({
          data: {
            id: entityId,
            ...sectionData,
            createdAt: new Date(sectionData.createdAt),
            updatedAt: new Date(sectionData.updatedAt),
          },
        })
        break

      case 'academicYear':
        // Extract nested relations
        const { enrollments: yearEnrollments, feeTemplates, payments: yearPayments, paymentAdjustments: yearAdjustments, studentFeeStatuses, refunds: yearRefunds, _count: yearCount, ...yearData } = data

        await prisma.academicYear.create({
          data: {
            id: entityId,
            ...yearData,
            startDate: new Date(yearData.startDate),
            endDate: yearData.endDate ? new Date(yearData.endDate) : null,
            createdAt: new Date(yearData.createdAt),
            updatedAt: new Date(yearData.updatedAt),
          },
        })
        break

      case 'feeTemplate':
        // Extract nested relations
        const { breakdowns, academicYear, studentFeeStatuses: templateFeeStatuses, ...templateData } = data

        // Create fee template
        await prisma.feeTemplate.create({
          data: {
            id: entityId,
            ...templateData,
            createdAt: new Date(templateData.createdAt),
            updatedAt: new Date(templateData.updatedAt),
          },
        })

        // Restore fee breakdowns if they exist
        if (breakdowns && Array.isArray(breakdowns)) {
          for (const breakdown of breakdowns) {
            await prisma.feeBreakdown.create({
              data: {
                id: breakdown.id,
                feeTemplateId: entityId,
                description: breakdown.description,
                amount: breakdown.amount,
                category: breakdown.category,
                order: breakdown.order,
                isRefundable: breakdown.isRefundable,
                createdAt: new Date(breakdown.createdAt),
                updatedAt: new Date(breakdown.updatedAt),
              },
            })
          }
        }
        break

      case 'customRemark':
        await prisma.customRemark.create({
          data: {
            id: entityId,
            ...data,
            createdAt: new Date(data.createdAt),
            updatedAt: new Date(data.updatedAt),
          },
        })
        break

      default:
        return NextResponse.json(
          { error: `Unknown entity type: ${entityType}` },
          { status: 400 }
        )
    }

    // Remove from recycle bin
    await prisma.recycleBin.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error restoring item:', error)
    return NextResponse.json(
      { error: 'Failed to restore item' },
      { status: 500 }
    )
  }
}

// DELETE - Permanently delete item from recycle bin
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Delete the item from recycle bin
    await prisma.recycleBin.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error permanently deleting item:', error)
    return NextResponse.json(
      { error: 'Failed to permanently delete item' },
      { status: 500 }
    )
  }
}
