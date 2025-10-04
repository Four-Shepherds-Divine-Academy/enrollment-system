import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/sections/[id] - Get a specific section
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const section = await prisma.section.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    return NextResponse.json(section);
  } catch (error) {
    console.error('Error fetching section:', error);
    return NextResponse.json(
      { error: 'Failed to fetch section' },
      { status: 500 }
    );
  }
}

// PATCH /api/sections/[id] - Update a section
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, gradeLevel, isActive } = body;

    // Check if section exists
    const existingSection = await prisma.section.findUnique({
      where: { id: params.id },
    });

    if (!existingSection) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // If updating name or gradeLevel, check for conflicts
    if ((name && name !== existingSection.name) || (gradeLevel && gradeLevel !== existingSection.gradeLevel)) {
      const conflictingSection = await prisma.section.findUnique({
        where: {
          name_gradeLevel: {
            name: name || existingSection.name,
            gradeLevel: gradeLevel || existingSection.gradeLevel,
          },
        },
      });

      if (conflictingSection && conflictingSection.id !== params.id) {
        return NextResponse.json(
          { error: 'Section with this name already exists for this grade level' },
          { status: 409 }
        );
      }
    }

    const section = await prisma.section.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(gradeLevel && { gradeLevel }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    return NextResponse.json(section);
  } catch (error) {
    console.error('Error updating section:', error);
    return NextResponse.json(
      { error: 'Failed to update section' },
      { status: 500 }
    );
  }
}

// DELETE /api/sections/[id] - Soft delete a section (move to recycle bin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if section has students
    const section = await prisma.section.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    if (section._count.students > 0) {
      return NextResponse.json(
        { error: 'Cannot delete section with enrolled students. Please reassign students first.' },
        { status: 400 }
      );
    }

    // Create snapshot for recycle bin
    const now = new Date();
    const permanentDeleteAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.recycleBin.create({
      data: {
        entityType: 'section',
        entityId: params.id,
        entityData: section,
        entityName: `${section.name} - ${section.gradeLevel}`,
        deletedBy: session.user?.email || session.user?.id,
        permanentDeleteAt,
      },
    });

    await prisma.section.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Section deleted successfully' });
  } catch (error) {
    console.error('Error deleting section:', error);
    return NextResponse.json(
      { error: 'Failed to delete section' },
      { status: 500 }
    );
  }
}
