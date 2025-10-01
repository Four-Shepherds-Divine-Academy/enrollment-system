import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const yearId = searchParams.get('yearId')

    if (!yearId) {
      return NextResponse.json(
        { error: 'Year ID is required' },
        { status: 400 }
      )
    }

    // Get academic year
    const academicYear = await prisma.academicYear.findUnique({
      where: { id: yearId },
    })

    if (!academicYear) {
      return NextResponse.json(
        { error: 'Academic year not found' },
        { status: 404 }
      )
    }

    // Get all enrollments for this year
    const enrollments = await prisma.enrollment.findMany({
      where: {
        academicYearId: yearId,
      },
      include: {
        student: true,
      },
    })

    // Get unique student IDs
    const studentIds = [...new Set(enrollments.map((e) => e.studentId))]

    // Get students data
    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
      },
      select: {
        id: true,
        lrn: true,
        fullName: true,
        gender: true,
        gradeLevel: true,
        section: true,
        barangay: true,
        city: true,
        enrollmentStatus: true,
        isTransferee: true,
      },
    })

    // Calculate statistics
    const totalStudents = students.length
    const enrolledStudents = students.filter((s) => s.enrollmentStatus === 'ENROLLED').length
    const pendingStudents = students.filter((s) => s.enrollmentStatus === 'PENDING').length
    const transferees = students.filter((s) => s.isTransferee).length

    // Calculate grade distribution
    const gradeMap = new Map<string, { count: number; male: number; female: number }>()

    students.forEach((student) => {
      const grade = student.gradeLevel
      const existing = gradeMap.get(grade) || { count: 0, male: 0, female: 0 }

      existing.count++
      if (student.gender === 'Male') existing.male++
      if (student.gender === 'Female') existing.female++

      gradeMap.set(grade, existing)
    })

    const gradeDistribution = Array.from(gradeMap.entries()).map(([gradeLevel, data]) => ({
      gradeLevel,
      ...data,
    }))

    // Sort by grade order
    const gradeOrder = [
      'Kinder 1', 'Kinder 2',
      'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
      'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'
    ]

    gradeDistribution.sort((a, b) => {
      const indexA = gradeOrder.indexOf(a.gradeLevel)
      const indexB = gradeOrder.indexOf(b.gradeLevel)
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })

    // Sort students by grade and name
    students.sort((a, b) => {
      const gradeA = gradeOrder.indexOf(a.gradeLevel)
      const gradeB = gradeOrder.indexOf(b.gradeLevel)
      if (gradeA !== gradeB) return gradeA - gradeB
      return a.fullName.localeCompare(b.fullName)
    })

    const reportData = {
      academicYear: academicYear.name,
      totalStudents,
      enrolledStudents,
      pendingStudents,
      transferees,
      gradeDistribution,
      students,
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
