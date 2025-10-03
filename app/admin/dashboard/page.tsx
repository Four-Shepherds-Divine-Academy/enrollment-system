import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  UserCheck,
  Clock,
  UserPlus,
  GraduationCap,
  TrendingUp,
  Calendar,
  MapPin
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'

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

  // Get all enrollments for the current academic year
  const currentYearEnrollments = await prisma.enrollment.findMany({
    where: {
      academicYearId: activeYear.id,
    },
    include: {
      student: {
        include: {
          section: true,
        },
      },
    },
  })

  // Get all sections
  const sections = await prisma.section.findMany({
    where: {
      isActive: true,
    },
    include: {
      _count: {
        select: {
          students: true,
        },
      },
    },
  })

  // Calculate statistics
  const totalStudents = new Set(currentYearEnrollments.map((e) => e.studentId)).size
  const enrolledStudents = currentYearEnrollments.filter(
    (e) => e.status === 'ENROLLED'
  ).length
  const pendingStudents = currentYearEnrollments.filter(
    (e) => e.status === 'PENDING'
  ).length
  const transferees = currentYearEnrollments.filter(
    (e) => e.student.isTransferee
  ).length

  // Gender distribution
  const maleStudents = currentYearEnrollments.filter(
    (e) => e.student.gender === 'Male'
  ).length
  const femaleStudents = currentYearEnrollments.filter(
    (e) => e.student.gender === 'Female'
  ).length

  // Grade level distribution with gender breakdown
  const gradeDistribution = await prisma.enrollment.groupBy({
    by: ['gradeLevel'],
    where: {
      academicYearId: activeYear.id,
    },
    _count: {
      id: true,
    },
  })

  // Get detailed grade distribution with gender
  const gradeDetails = await Promise.all(
    gradeDistribution.map(async (grade) => {
      const enrollments = currentYearEnrollments.filter(
        (e) => e.gradeLevel === grade.gradeLevel
      )
      const male = enrollments.filter((e) => e.student.gender === 'Male').length
      const female = enrollments.filter((e) => e.student.gender === 'Female').length

      return {
        gradeLevel: grade.gradeLevel,
        total: grade._count.id,
        male,
        female,
      }
    })
  )

  // Sort grade details
  const gradeOrder = [
    'Kinder 1', 'Kinder 2',
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'
  ]
  gradeDetails.sort((a, b) => gradeOrder.indexOf(a.gradeLevel) - gradeOrder.indexOf(b.gradeLevel))

  // Barangay distribution (top 5)
  const barangayMap = new Map<string, number>()
  currentYearEnrollments.forEach((e) => {
    const barangay = e.student.barangay || 'Unknown'
    barangayMap.set(barangay, (barangayMap.get(barangay) || 0) + 1)
  })
  const topBarangays = Array.from(barangayMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  // Section capacity analysis
  const sectionAnalysis = sections.map((section) => {
    const enrolledCount = currentYearEnrollments.filter(
      (e) => e.sectionId === section.id
    ).length
    const capacity = 40 // Assume max 40 students per section
    const percentage = (enrolledCount / capacity) * 100

    return {
      name: section.name,
      gradeLevel: section.gradeLevel,
      enrolled: enrolledCount,
      capacity,
      percentage: Math.min(percentage, 100),
    }
  }).filter((s) => s.enrolled > 0)

  // Group sections by grade level
  const sectionsByGrade = sectionAnalysis.reduce((acc, section) => {
    if (!acc[section.gradeLevel]) {
      acc[section.gradeLevel] = []
    }
    acc[section.gradeLevel].push(section)
    return acc
  }, {} as Record<string, typeof sectionAnalysis>)

  // Recent enrollments (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentEnrollments = await prisma.enrollment.count({
    where: {
      academicYearId: activeYear.id,
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
  })

  // Calculate enrollment rate
  const enrollmentRate = totalStudents > 0 ? (enrolledStudents / totalStudents) * 100 : 0

  const stats = [
    {
      title: 'Total Students',
      value: totalStudents,
      description: `SY ${activeYear.name}`,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: `+${recentEnrollments} this week`,
    },
    {
      title: 'Enrolled',
      value: enrolledStudents,
      description: 'Currently enrolled',
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: `${enrollmentRate.toFixed(1)}% enrollment rate`,
    },
    {
      title: 'Pending',
      value: pendingStudents,
      description: 'Awaiting approval',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      trend: pendingStudents > 0 ? 'Needs attention' : 'All processed',
    },
    {
      title: 'Transferees',
      value: transferees,
      description: 'From other schools',
      icon: UserPlus,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: `${totalStudents > 0 ? ((transferees / totalStudents) * 100).toFixed(1) : 0}% of total`,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
          <div className="flex items-center gap-2 mt-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <p className="text-gray-600">
              Academic Year: <span className="font-semibold text-gray-900">{activeYear.name}</span>
            </p>
            <Badge variant="default" className="ml-2">Active</Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Last updated</p>
          <p className="text-sm font-medium text-gray-900">
            {new Date().toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                <div className="mt-3 flex items-center text-xs">
                  <TrendingUp className="h-3 w-3 mr-1 text-gray-400" />
                  <span className="text-gray-600">{stat.trend}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Gender & Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gender Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gender Distribution
            </CardTitle>
            <CardDescription>Student population by gender</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Male Students</span>
                <span className="text-sm font-bold text-blue-600">{maleStudents}</span>
              </div>
              <Progress
                value={(maleStudents / totalStudents) * 100}
                className="h-3"
              />
              <p className="text-xs text-gray-500 mt-1">
                {totalStudents > 0 ? ((maleStudents / totalStudents) * 100).toFixed(1) : 0}% of total students
              </p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Female Students</span>
                <span className="text-sm font-bold text-pink-600">{femaleStudents}</span>
              </div>
              <Progress
                value={(femaleStudents / totalStudents) * 100}
                className="h-3"
              />
              <p className="text-xs text-gray-500 mt-1">
                {totalStudents > 0 ? ((femaleStudents / totalStudents) * 100).toFixed(1) : 0}% of total students
              </p>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Male to Female Ratio</span>
                <span className="text-sm font-bold text-gray-900">
                  {femaleStudents > 0 ? (maleStudents / femaleStudents).toFixed(2) : '0'} : 1
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Barangays */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Top Barangays
            </CardTitle>
            <CardDescription>Student distribution by location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topBarangays.map(([barangay, count], index) => (
                <div key={barangay}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <span className="text-sm font-medium text-gray-700">{barangay}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{count}</span>
                  </div>
                  <Progress
                    value={(count / totalStudents) * 100}
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {totalStudents > 0 ? ((count / totalStudents) * 100).toFixed(1) : 0}% of students
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grade Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Students by Grade Level
          </CardTitle>
          <CardDescription>Detailed breakdown with gender distribution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {gradeDetails.map((grade) => (
              <div
                key={grade.gradeLevel}
                className="p-4 border rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="text-2xl font-bold text-blue-600 text-center">
                  {grade.total}
                </div>
                <div className="text-xs text-gray-600 mt-1 text-center font-medium">
                  {grade.gradeLevel}
                </div>
                <div className="mt-3 pt-3 border-t space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Male</span>
                    <span className="font-medium text-blue-600">{grade.male}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Female</span>
                    <span className="font-medium text-pink-600">{grade.female}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Section Capacity */}
      {Object.keys(sectionsByGrade).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Section Capacity Overview</CardTitle>
            <CardDescription>Current enrollment vs maximum capacity per section</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(sectionsByGrade)
                .sort((a, b) => gradeOrder.indexOf(a[0]) - gradeOrder.indexOf(b[0]))
                .map(([gradeLevel, sections]) => (
                  <div key={gradeLevel}>
                    <h4 className="font-semibold text-sm text-gray-700 mb-3">{gradeLevel}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {sections.map((section) => (
                        <div key={`${section.gradeLevel}-${section.name}`} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              {section.name}
                            </span>
                            <span className="text-sm text-gray-600">
                              {section.enrolled}/{section.capacity}
                            </span>
                          </div>
                          <Progress
                            value={section.percentage}
                            className="h-2"
                          />
                          <p className="text-xs text-gray-500">
                            {section.percentage.toFixed(0)}% capacity
                            {section.percentage >= 90 && (
                              <Badge variant="destructive" className="ml-2 text-xs">Nearly Full</Badge>
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
