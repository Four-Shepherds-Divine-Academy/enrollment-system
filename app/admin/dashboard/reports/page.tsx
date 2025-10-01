'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
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
import { FileText, Download, Printer } from 'lucide-react'
import { toast } from 'sonner'

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Enrollment Reports</h2>
          <p className="text-gray-600 mt-1">
            Generate comprehensive reports for any academic year
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button onClick={handlePrint} variant="outline">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleExportCSV} disabled={!reportData}>
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
          <CardContent className="py-8">
            <p className="text-center text-gray-500">Loading report...</p>
          </CardContent>
        </Card>
      ) : reportData ? (
        <>
          {/* Report Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Enrollment Report - SY {reportData.academicYear}
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">
                  {reportData.totalStudents}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Enrolled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {reportData.enrolledStudents}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {reportData.pendingStudents}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Transferees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {reportData.transferees}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Grade Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribution by Grade Level</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grade Level</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Male</TableHead>
                    <TableHead className="text-right">Female</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.gradeDistribution.map((grade) => (
                    <TableRow key={grade.gradeLevel}>
                      <TableCell className="font-medium">{grade.gradeLevel}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {grade.count}
                      </TableCell>
                      <TableCell className="text-right">{grade.male}</TableCell>
                      <TableCell className="text-right">{grade.female}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-gray-50 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">
                      {reportData.gradeDistribution.reduce((sum, g) => sum + g.count, 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {reportData.gradeDistribution.reduce((sum, g) => sum + g.male, 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {reportData.gradeDistribution.reduce((sum, g) => sum + g.female, 0)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Student List */}
          <Card>
            <CardHeader>
              <CardTitle>Complete Student List</CardTitle>
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
                        <TableCell>{student.gender}</TableCell>
                        <TableCell>{student.gradeLevel}</TableCell>
                        <TableCell>{student.section || 'N/A'}</TableCell>
                        <TableCell className="text-sm">
                          {student.barangay}, {student.city}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              student.enrollmentStatus === 'ENROLLED'
                                ? 'bg-green-100 text-green-800'
                                : student.enrollmentStatus === 'PENDING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {student.enrollmentStatus}
                          </span>
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
          <CardContent className="py-8">
            <p className="text-center text-gray-500">Select an academic year to generate report</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
