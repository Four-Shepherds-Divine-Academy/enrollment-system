'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FileText, Download, Printer, Users, TrendingUp, UserCheck, UserX } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts'

type AcademicYear = {
  id: string
  name: string
  isActive: boolean
}

type ReportData = {
  academicYear: string
  totalStudents: number
  enrolledStudents: number
  pendingStudents: number
  transferees: number
  gradeDistribution: Array<{
    gradeLevel: string
    count: number
    male: number
    female: number
  }>
  students: Array<{
    id: string
    lrn: string | null
    fullName: string
    gender: string
    gradeLevel: string
    section: string | null
    barangay: string
    city: string
    enrollmentStatus: string
  }>
}

// Chart colors
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  male: '#3b82f6',
  female: '#ec4899',
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function ReportsPage() {
  const [selectedYearId, setSelectedYearId] = useState<string>('')

  const { data: academicYears = [] } = useQuery<AcademicYear[]>({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const response = await fetch('/api/academic-years')
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
  })

  const activeYear = academicYears.find((y) => y.isActive)

  const { data: reportData, isLoading } = useQuery<ReportData>({
    queryKey: ['report', selectedYearId],
    queryFn: async () => {
      const yearId = selectedYearId || activeYear?.id
      if (!yearId) throw new Error('No year selected')
      const response = await fetch(`/api/reports?yearId=${yearId}`)
      if (!response.ok) throw new Error('Failed to fetch report')
      return response.json()
    },
    enabled: !!selectedYearId || !!activeYear,
  })

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    if (!reportData) return

    // Create CSV content
    const headers = ['LRN', 'Name', 'Gender', 'Grade Level', 'Section', 'Barangay', 'City', 'Status']
    const rows = reportData.students.map((s) => [
      s.lrn || 'N/A',
      s.fullName,
      s.gender,
      s.gradeLevel,
      s.section || 'N/A',
      s.barangay,
      s.city,
      s.enrollmentStatus,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `enrollment-report-${reportData.academicYear}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success('Report exported successfully!')
  }

  // Prepare enrollment status data for pie chart
  const enrollmentStatusData = reportData
    ? [
        { name: 'Enrolled', value: reportData.enrolledStudents },
        { name: 'Pending', value: reportData.pendingStudents },
      ]
    : []

  // Prepare gender distribution data
  const genderData = reportData
    ? [
        {
          name: 'Male',
          value: reportData.gradeDistribution.reduce((sum, g) => sum + g.male, 0),
        },
        {
          name: 'Female',
          value: reportData.gradeDistribution.reduce((sum, g) => sum + g.female, 0),
        },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Enrollment Reports</h2>
          <p className="text-muted-foreground">
            Comprehensive analytics and reports for academic year enrollments
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleExportCSV} disabled={!reportData} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Year Selector */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-lg">Select Academic Year</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="year">Academic Year</Label>
              <Select
                value={selectedYearId || activeYear?.id}
                onValueChange={setSelectedYearId}
              >
                <SelectTrigger id="year">
                  <SelectValue placeholder="Select year..." />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name} {year.isActive && '(Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {activeYear && (
              <Button
                variant="outline"
                onClick={() => setSelectedYearId(activeYear.id)}
              >
                Use Current Year
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Loading report...</p>
            </div>
          </CardContent>
        </Card>
      ) : reportData ? (
        <>
          {/* Report Header */}
          <Card className="border-none bg-gradient-to-r from-blue-600 to-indigo-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="h-5 w-5" />
                Enrollment Report - SY {reportData.academicYear}
              </CardTitle>
              <CardDescription className="text-blue-100">
                Generated on {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Students
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.totalStudents}
                </div>
                <p className="text-xs text-muted-foreground mt-1">All enrolled students</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Enrolled
                  </CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reportData.enrolledStudents}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {reportData.totalStudents > 0
                    ? Math.round((reportData.enrolledStudents / reportData.totalStudents) * 100)
                    : 0}% of total
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending
                  </CardTitle>
                  <UserX className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {reportData.pendingStudents}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {reportData.totalStudents > 0
                    ? Math.round((reportData.pendingStudents / reportData.totalStudents) * 100)
                    : 0}% of total
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Transferees
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {reportData.transferees}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {reportData.totalStudents > 0
                    ? Math.round((reportData.transferees / reportData.totalStudents) * 100)
                    : 0}% of total
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enrollment Status Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enrollment Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={enrollmentStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill={COLORS.success} />
                      <Cell fill={COLORS.warning} />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gender Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gender Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      <Cell fill={COLORS.male} />
                      <Cell fill={COLORS.female} />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Grade Distribution Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Students by Grade Level</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={reportData.gradeDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="gradeLevel" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="male" fill={COLORS.male} name="Male" />
                  <Bar dataKey="female" fill={COLORS.female} name="Female" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Grade Distribution Table */}
          <Card>
            <CardHeader>
              <CardTitle>Detailed Grade Level Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade Level</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Male</TableHead>
                    <TableHead className="text-right">Female</TableHead>
                    <TableHead className="text-right">% of Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.gradeDistribution.map((grade) => (
                    <TableRow key={grade.gradeLevel}>
                      <TableCell className="font-medium">{grade.gradeLevel}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {grade.count}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                          {grade.male}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="border-pink-200 bg-pink-50 text-pink-700">
                          {grade.female}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {reportData.totalStudents > 0
                          ? ((grade.count / reportData.totalStudents) * 100).toFixed(1)
                          : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold border-t-2">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">
                      {reportData.gradeDistribution.reduce((sum, g) => sum + g.count, 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
                        {reportData.gradeDistribution.reduce((sum, g) => sum + g.male, 0)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="border-pink-200 bg-pink-50 text-pink-700">
                        {reportData.gradeDistribution.reduce((sum, g) => sum + g.female, 0)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">100%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Student List */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Student List ({reportData.students.length} students)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>LRN</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Grade Level</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-mono text-sm">
                          {student.lrn || 'N/A'}
                        </TableCell>
                        <TableCell className="font-medium">{student.fullName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn(
                            student.gender === 'Male' && 'border-blue-200 bg-blue-50 text-blue-700',
                            student.gender === 'Female' && 'border-pink-200 bg-pink-50 text-pink-700'
                          )}>
                            {student.gender}
                          </Badge>
                        </TableCell>
                        <TableCell>{student.gradeLevel}</TableCell>
                        <TableCell>{student.section || 'N/A'}</TableCell>
                        <TableCell className="text-sm">
                          {student.barangay}, {student.city}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              student.enrollmentStatus === 'ENROLLED'
                                ? 'default'
                                : student.enrollmentStatus === 'PENDING'
                                ? 'secondary'
                                : 'outline'
                            }
                            className={cn(
                              student.enrollmentStatus === 'ENROLLED' && 'bg-green-100 text-green-800 hover:bg-green-100',
                              student.enrollmentStatus === 'PENDING' && 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                            )}
                          >
                            {student.enrollmentStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-2">
              <FileText className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">Select an academic year to generate report</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
