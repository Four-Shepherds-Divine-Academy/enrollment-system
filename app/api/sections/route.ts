import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

// GET /api/sections - Get all sections with server-side filtering and sorting
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const gradeLevel = searchParams.get('gradeLevel');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'gradeLevel';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const status = searchParams.get('status'); // 'active', 'inactive', 'all'

    const where: any = {};

    // Grade level filter
    if (gradeLevel && gradeLevel !== 'all') {
      where.gradeLevel = gradeLevel;
    }

    // Active/Inactive filter
    if (activeOnly) {
      where.isActive = true;
    } else if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    // Search filter (name or grade level)
    if (search && search.trim() !== '') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { gradeLevel: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy clause
    const orderBy: any = [];

    if (sortBy === 'name') {
      orderBy.push({ name: sortOrder });
    } else if (sortBy === 'gradeLevel') {
      orderBy.push({ gradeLevel: sortOrder });
      orderBy.push({ name: 'asc' }); // Secondary sort by name
    } else if (sortBy === 'students') {
      // For sorting by student count, we'll need to handle this differently
      // We'll sort in memory after fetching
    } else if (sortBy === 'status') {
      orderBy.push({ isActive: sortOrder === 'asc' ? 'desc' : 'asc' }); // Reverse for better UX
      orderBy.push({ name: 'asc' });
    } else {
      // Default sorting
      orderBy.push({ gradeLevel: 'asc' });
      orderBy.push({ name: 'asc' });
    }

    // Get active academic year to filter students
    const activeYear = await prisma.academicYear.findFirst({
      where: { isActive: true },
    });

    // Debug: Check how many students have sections assigned
    const totalStudentsWithSections = await prisma.student.count({
      where: {
        sectionId: { not: null },
        ...(activeYear && {
          enrollments: {
            some: {
              academicYearId: activeYear.id,
            },
          },
        }),
      },
    });
    console.log(`\nTotal students with sections assigned in active year: ${totalStudentsWithSections}`);

    // First, get all sections
    const sectionsRaw = await prisma.section.findMany({
      where,
      orderBy: orderBy.length > 0 ? orderBy : undefined,
    });

    // Manually count students for each section
    let sections = await Promise.all(
      sectionsRaw.map(async (section) => {
        const studentCount = await prisma.student.count({
          where: {
            sectionId: section.id,
            ...(activeYear && {
              enrollments: {
                some: {
                  academicYearId: activeYear.id,
                },
              },
            }),
          },
        });

        // Debug first section
        if (section.name === 'Enthusiasm' && section.gradeLevel === 'Kinder 1') {
          const students = await prisma.student.findMany({
            where: {
              sectionId: section.id,
              ...(activeYear && {
                enrollments: {
                  some: {
                    academicYearId: activeYear.id,
                  },
                },
              }),
            },
            select: {
              id: true,
              fullName: true,
              sectionId: true,
              enrollments: {
                where: activeYear ? { academicYearId: activeYear.id } : {},
                select: {
                  id: true,
                  academicYearId: true,
                  schoolYear: true,
                },
              },
            },
          });
          console.log(`\nSection: ${section.name} ${section.gradeLevel}`);
          console.log(`Section ID: ${section.id}`);
          console.log(`Active Year: ${activeYear?.name}`);
          console.log(`Student Count: ${studentCount}`);
          console.log('Students:', JSON.stringify(students, null, 2));
        }

        return {
          ...section,
          _count: {
            students: studentCount,
          },
        };
      })
    );

    // Custom grade level order
    const gradeOrder = [
      'Kinder 1', 'Kinder 2',
      'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
      'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
    ];

    // Sort by student count if requested (in-memory sort)
    if (sortBy === 'students') {
      sections = sections.sort((a, b) => {
        const countA = a._count.students;
        const countB = b._count.students;
        return sortOrder === 'asc' ? countA - countB : countB - countA;
      });
    } else if (sortBy === 'gradeLevel') {
      // Custom sort for grade levels
      sections = sections.sort((a, b) => {
        const indexA = gradeOrder.indexOf(a.gradeLevel);
        const indexB = gradeOrder.indexOf(b.gradeLevel);
        const gradeCompare = sortOrder === 'asc'
          ? (indexA === -1 ? 1 : indexB === -1 ? -1 : indexA - indexB)
          : (indexA === -1 ? -1 : indexB === -1 ? 1 : indexB - indexA);

        // If same grade level, sort by name
        if (gradeCompare === 0) {
          return a.name.localeCompare(b.name);
        }
        return gradeCompare;
      });
    }

    return NextResponse.json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sections' },
      { status: 500 }
    );
  }
}

// POST /api/sections - Create a new section
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, gradeLevel } = body;

    if (!name || !gradeLevel) {
      return NextResponse.json(
        { error: 'Name and grade level are required' },
        { status: 400 }
      );
    }

    // Check if section already exists for this grade level
    const existingSection = await prisma.section.findUnique({
      where: {
        name_gradeLevel: {
          name,
          gradeLevel,
        },
      },
    });

    if (existingSection) {
      return NextResponse.json(
        { error: 'Section already exists for this grade level' },
        { status: 409 }
      );
    }

    const section = await prisma.section.create({
      data: {
        name,
        gradeLevel,
      },
      include: {
        _count: {
          select: {
            students: true,
          },
        },
      },
    });

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error('Error creating section:', error);
    return NextResponse.json(
      { error: 'Failed to create section' },
      { status: 500 }
    );
  }
}
