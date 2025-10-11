'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { ArrowLeft, Search, X, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type Student = {
  id: string
  lrn: string | null
  fullName: string
  gender: string
  gradeLevel: string
  section: {
    id: string
    name: string
    gradeLevel: string
  } | null
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
    status: string
    section: {
      id: string
      name: string
      gradeLevel: string
    } | null
  }>
}

type AcademicYear = {
  id: string
  name: string
  isActive: boolean
}

const GRADE_LEVELS = [
  'All Grades',
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

export default function StudentsArchivePage() {
  const [selectedYearId, setSelectedYearId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [gradeLevelFilter, setGradeLevelFilter] = useState('All Grades')

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Reset search when year changes
  useEffect(() => {
    setSearchQuery('')
    setDebouncedSearch('')
    setGradeLevelFilter('All Grades')
  }, [selectedYearId])

  // Set page title
  useEffect(() => {
    document.title = '4SDA - Student Archive'
  }, [])

  // Fetch academic years with caching
  const { data: academicYears = [] } = useQuery<AcademicYear[]>({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const response = await fetch('/api/academic-years')
      if (!response.ok) throw new Error('Failed to fetch academic years')
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  })

  // Fetch archived students with server-side filtering
  const { data: students = [], isLoading, isFetching } = useQuery<Student[]>({
    queryKey: ['students-archive', selectedYearId, debouncedSearch, gradeLevelFilter],
    queryFn: async () => {
      if (!selectedYearId) return []

      const params = new URLSearchParams({
        academicYearId: selectedYearId,
      })

      if (debouncedSearch) {
        params.append('search', debouncedSearch)
      }

      if (gradeLevelFilter !== 'All Grades') {
        params.append('gradeLevel', gradeLevelFilter)
      }

      const response = await fetch(`/api/students/archive?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch students')
      return response.json()
    },
    enabled: !!selectedYearId, // Only fetch when year is selected
    staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  })

  // Get past academic years (not active)
  const pastYears = academicYears.filter((y) => !y.isActive)
  const selectedYear = academicYears.find((y) => y.id === selectedYearId)

  // Group students by grade level and section
  const groupedStudents = students.reduce((acc, student) => {
    const sectionName = student.enrollments[0]?.section?.name || student.section?.name
    const key = `${student.gradeLevel}${sectionName ? ` - ${sectionName}` : ''}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(student)
    return acc
  }, {} as Record<string, typeof students>)

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

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Academic Year Selector */}
            <div>
              <Label htmlFor="year">Academic Year *</Label>
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
                        SY {year.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Grade Level Filter */}
            <div>
              <Label htmlFor="grade">Grade Level</Label>
              <Select
                value={gradeLevelFilter}
                onValueChange={setGradeLevelFilter}
                disabled={!selectedYearId}
              >
                <SelectTrigger id="grade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="search"
                  placeholder="Name, LRN, City, Guardian..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={!selectedYearId}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active filters indicator */}
          {selectedYearId && (debouncedSearch || gradeLevelFilter !== 'All Grades') && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <span className="font-medium">Active filters:</span>
              {debouncedSearch && (
                <Badge variant="secondary">Search: "{debouncedSearch}"</Badge>
              )}
              {gradeLevelFilter !== 'All Grades' && (
                <Badge variant="secondary">Grade: {gradeLevelFilter}</Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setGradeLevelFilter('All Grades')
                }}
                className="h-6 px-2 text-xs"
              >
                Clear filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {selectedYearId ? (
        <div className="space-y-6 relative">
          {/* Background fetching indicator */}
          {isFetching && !isLoading && (
            <div className="absolute top-0 right-0 z-10">
              <div className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-md text-sm flex items-center gap-2 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Updating...
              </div>
            </div>
          )}

          {isLoading ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center">Loading...</p>
              </CardContent>
            </Card>
          ) : students.length === 0 ? (
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
