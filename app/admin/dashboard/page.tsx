import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminDashboardPage() {
  // Get active academic year
  const activeYear = await prisma.academicYear.findFirst({
    where: {
      isActive: true,
    },
  })

  if (!activeYear) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600 mt-1">Welcome to the admin dashboard</p>
        </div>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-center text-yellow-900">
              No active academic year. Please create an academic year to view dashboard statistics.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get students enrolled in the current academic year
  const currentYearEnrollments = await prisma.enrollment.findMany({
    where: {
      academicYearId: activeYear.id,
    },
    include: {
      student: true,
    },
  })

  const currentYearStudentIds = currentYearEnrollments.map((e) => e.studentId)
  const uniqueStudentIds = [...new Set(currentYearStudentIds)]

  const [totalStudents, enrolledStudents, pendingStudents, transferees, gradeDistribution] =
    await Promise.all([
      // Total students in current year
      Promise.resolve(uniqueStudentIds.length),
      // Enrolled students in current year
      prisma.student.count({
        where: {
          id: { in: uniqueStudentIds },
          enrollmentStatus: 'ENROLLED',
        },
      }),
      // Pending students in current year
      prisma.student.count({
        where: {
          id: { in: uniqueStudentIds },
          enrollmentStatus: 'PENDING',
        },
      }),
      // Transferees in current year
      prisma.student.count({
        where: {
          id: { in: uniqueStudentIds },
          isTransferee: true,
        },
      }),
      // Grade level distribution
      prisma.enrollment.groupBy({
        by: ['gradeLevel'],
        where: {
          academicYearId: activeYear.id,
        },
        _count: {
          id: true,
        },
      }),
    ])

  const stats = [
    {
      title: 'Total Students',
      value: totalStudents,
      description: `SY ${activeYear.name}`,
    },
    {
      title: 'Enrolled',
      value: enrolledStudents,
      description: 'Currently enrolled',
    },
    {
      title: 'Pending',
      value: pendingStudents,
      description: 'Awaiting approval',
    },
    {
      title: 'Transferees',
      value: transferees,
      description: 'From other schools',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-1">
          Academic Year: <span className="font-semibold">{activeYear.name}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grade Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Students by Grade Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {gradeDistribution
              .sort((a, b) => {
                const gradeOrder = ['Kinder 1', 'Kinder 2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10']
                return gradeOrder.indexOf(a.gradeLevel) - gradeOrder.indexOf(b.gradeLevel)
              })
              .map((grade) => (
                <div key={grade.gradeLevel} className="p-4 border rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{grade._count.id}</div>
                  <div className="text-xs text-gray-600 mt-1">{grade.gradeLevel}</div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
