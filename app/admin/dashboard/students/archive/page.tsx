'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft } from 'lucide-react'

type Student = {
  id: string
  lrn: string | null
  fullName: string
  gender: string
  gradeLevel: string
  section: string | null
  contactNumber: string
  houseNumber: string | null
  street: string | null
  subdivision: string | null
  barangay: string
  city: string
  parentGuardian: string
  enrollmentStatus: string
  enrollments: Array<{
    schoolYear: string
    gradeLevel: string
  }>
}

type AcademicYear = {
  id: string
  name: string
  isActive: boolean

}

export default function StudentsArchivePage() {
  const [selectedYearId, setSelectedYearId] = useState<string>('')

  const { data: academicYears = [] } = useQuery<AcademicYear[]>({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const response = await fetch('/api/academic-years')
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
  })

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await fetch('/api/students')
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
  })

  // Get past academic years (not active)
  const pastYears = academicYears.filter((y) => !y.isActive)
  const selectedYear = academicYears.find((y) => y.id === selectedYearId)

  // Filter students by selected year
  const filteredStudents = selectedYearId
    ? students.filter((student) =>
        student.enrollments.some((e) => e.schoolYear === selectedYear?.name)
      )
    : []

  // Group students by grade level and section
  const groupedStudents = filteredStudents.reduce((acc, student) => {
    const key = `${student.gradeLevel}${student.section ? ` - ${student.section}` : ''}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(student)
    return acc
  }, {} as Record<string, typeof filteredStudents>)

  // Sort the groups by grade level order
  const gradeOrder = [
    'Kinder 1',
    'Kinder 2',
    'Grade 1',
    'Grade 2',
    'Grade 3',
    'Grade 4',
    'Grade 5',
    'Grade 6',
    'Grade 7',
    'Grade 8',
    'Grade 9',
    'Grade 10',
  ]

  const sortedGroups = Object.entries(groupedStudents).sort((a, b) => {
    const gradeA = a[0].split(' - ')[0]
    const gradeB = b[0].split(' - ')[0]
    const indexA = gradeOrder.indexOf(gradeA)
    const indexB = gradeOrder.indexOf(gradeB)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => (window.location.href = '/admin/dashboard/students')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Current Year
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Student Archive</h2>
        <p className="text-gray-600 mt-1">
          View students from past academic years (Read-Only)
        </p>
      </div>

      {/* Year Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Academic Year</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <Label htmlFor="year">Academic Year</Label>
            <Select value={selectedYearId} onValueChange={setSelectedYearId}>
              <SelectTrigger id="year">
                <SelectValue placeholder="Select an academic year" />
              </SelectTrigger>
              <SelectContent>
                {pastYears.length === 0 ? (
                  <SelectItem value="none" disabled>
                    No past academic years available
                  </SelectItem>
                ) : (
                  pastYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      SY {year.name} {''}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {selectedYearId ? (
        <div className="space-y-6">
          {isLoading ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center">Loading...</p>
              </CardContent>
            </Card>
          ) : filteredStudents.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-gray-500">
                  No students found for this academic year
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <p className="text-sm text-blue-700">
                  <strong>Read-Only Mode:</strong> You are viewing archived student
                  records from SY {selectedYear?.name}. Editing and deletion are
                  disabled for past academic years.
                </p>
              </div>

              {sortedGroups.map(([groupKey, groupStudents]) => (
                <Card key={groupKey} className="border-2">
                  <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2">
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        {groupKey}
                      </span>
                      <span className="text-sm font-normal text-gray-600">
                        {groupStudents.length}{' '}
                        {groupStudents.length === 1 ? 'student' : 'students'}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold">LRN</TableHead>
                            <TableHead className="font-semibold">Name</TableHead>
                            <TableHead className="font-semibold">Gender</TableHead>
                            <TableHead className="font-semibold">Contact</TableHead>
                            <TableHead className="font-semibold">Address</TableHead>
                            <TableHead className="font-semibold">
                              Parent/Guardian
                            </TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {groupStudents.map((student, index) => (
                            <TableRow
                              key={student.id}
                              className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                            >
                              <TableCell className="font-mono text-sm">
                                {student.lrn || 'N/A'}
                              </TableCell>
                              <TableCell className="font-medium">
                                {student.fullName}
                              </TableCell>
                              <TableCell className="text-sm">
                                {student.gender}
                              </TableCell>
                              <TableCell className="text-sm">
                                {student.contactNumber}
                              </TableCell>
                              <TableCell className="text-sm max-w-xs">
                                <div className="truncate">
                                  {[
                                    student.houseNumber,
                                    student.street,
                                    student.subdivision,
                                    student.barangay,
                                    student.city,
                                  ]
                                    .filter(Boolean)
                                    .join(', ')}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm">
                                {student.parentGuardian}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
              ))}
            </>
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-gray-500">
              Select an academic year to view archived student records
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
