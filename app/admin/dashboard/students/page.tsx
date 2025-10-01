'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Pencil, Trash2, Eye, History, GraduationCap, ArrowRightLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

type Student = {
  id: string
  lrn: string | null
  fullName: string
  gradeLevel: string
  section: string | null
  contactNumber: string
  city: string
  enrollmentStatus: string
  isTransferee: boolean
  previousSchool: string | null
  gender: string
  houseNumber: string | null
  street: string | null
  subdivision: string | null
  barangay: string
  parentGuardian: string
  enrollments: Array<{
    schoolYear: string
    gradeLevel: string
    section: string | null
    status: string
    enrollmentDate: string
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

export default function StudentsListPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [gradeFilter, setGradeFilter] = useState('All Grades')
  const [statusFilter, setStatusFilter] = useState('All Status')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false)
  const [newGradeLevel, setNewGradeLevel] = useState('')
  const [newSection, setNewSection] = useState('')
  const queryClient = useQueryClient()

  // Debounce search query - 500ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: academicYears = [] } = useQuery<AcademicYear[]>({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const response = await fetch('/api/academic-years')
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
  })

  // Get active academic year
  const activeYear = academicYears.find((y) => y.isActive)

  // Build query params
  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (gradeFilter && gradeFilter !== 'All Grades') params.set('gradeLevel', gradeFilter)
    if (statusFilter && statusFilter !== 'All Status') params.set('status', statusFilter)
    if (activeYear) params.set('academicYear', activeYear.name)
    return params.toString()
  }, [debouncedSearch, gradeFilter, statusFilter, activeYear])

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['students', queryParams],
    queryFn: async () => {
      const response = await fetch(`/api/students?${queryParams}`)
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
    enabled: !!activeYear, // Only fetch when we have an active year
  })

  // Filter students by active year (server already filters by search/grade/status)
  const filteredStudents = students.filter((student) => {
    if (!activeYear) return false
    return student.enrollments.some((e) => e.schoolYear === activeYear.name)
  })

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
    'Kinder 1', 'Kinder 2',
    'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
    'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'
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


  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE',
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete student')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student deleted successfully')
      setDeleteDialogOpen(false)
      setStudentToDelete(null)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (studentToDelete) {
      deleteMutation.mutate(studentToDelete.id)
    }
  }

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student)
    setViewDetailsOpen(true)
  }

  const handleSwitchClick = (student: Student) => {
    setSelectedStudent(student)
    setNewGradeLevel(student.gradeLevel)
    setNewSection(student.section || '')
    setSwitchDialogOpen(true)
  }

  const switchMutation = useMutation({
    mutationFn: async (data: { studentId: string; gradeLevel: string; section: string }) => {
      const response = await fetch(`/api/students/${data.studentId}/switch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gradeLevel: data.gradeLevel,
          section: data.section,
        }),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to switch student')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] })
      toast.success('Student switched successfully')
      setSwitchDialogOpen(false)
      setViewDetailsOpen(false)
      setSelectedStudent(null)
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const handleSwitchConfirm = () => {
    if (selectedStudent) {
      switchMutation.mutate({
        studentId: selectedStudent.id,
        gradeLevel: newGradeLevel,
        section: newSection,
      })
    }
  }

  const canEditStudent = (student: Student) => {
    if (!activeYear) return false
    // Academic year is active
    return student.enrollments.some(
      (e) => e.schoolYear === activeYear.name
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">All Students - SY {activeYear?.name || 'N/A'}</h2>
          <p className="text-gray-600 mt-1">
            Viewing students enrolled in current academic year
          </p>
        </div>
        <div>
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/admin/dashboard/students/archive')}
          >
            View Past Years
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Input
                  id="search"
                  placeholder="Name, LRN, or City..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery !== debouncedSearch && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="grade">Grade Level</Label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger id="grade">
                  <SelectValue placeholder="All grades" />
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

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Status">All Status</SelectItem>
                  <SelectItem value="ENROLLED">Enrolled</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                  <SelectItem value="DROPPED">Dropped</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
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
                {searchQuery || gradeFilter !== 'All Grades' || statusFilter !== 'All Status'
                  ? 'No students match your search criteria'
                  : 'No students enrolled yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedGroups.map(([groupKey, groupStudents]) => (
            <Card key={groupKey} className="border-2">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">{groupKey}</span>
                  <span className="text-sm font-normal text-gray-600">
                    {groupStudents.length} {groupStudents.length === 1 ? 'student' : 'students'}
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
                        <TableHead className="font-semibold">Parent/Guardian</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="text-right font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupStudents.map((student, index) => (
                        <TableRow key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <TableCell className="font-mono text-sm">
                            {student.lrn || 'N/A'}
                          </TableCell>
                          <TableCell className="font-medium">{student.fullName}</TableCell>
                          <TableCell className="text-sm">{student.gender}</TableCell>
                          <TableCell className="text-sm">
                            {student.contactNumber}
                          </TableCell>
                          <TableCell className="text-sm max-w-xs">
                            <div className="truncate">
                              {[student.houseNumber, student.street, student.subdivision, student.barangay, student.city]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{student.parentGuardian}</TableCell>
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
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(student)}
                                title="View Details & History"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSwitchClick(student)}
                                title="Switch Section/Grade"
                              >
                                <ArrowRightLeft className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.location.href = `/admin/dashboard/students/${student.id}/edit`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(student)}
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Student Details & Enrollment History Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[85vw] xl:max-w-[1600px] w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Student Details
            </DialogTitle>
          </DialogHeader>

          {selectedStudent && (
            <div className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Full Name</Label>
                      <p className="text-sm font-medium">{selectedStudent.fullName}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">LRN</Label>
                      <p className="text-sm font-medium font-mono">{selectedStudent.lrn || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Gender</Label>
                      <p className="text-sm font-medium">{selectedStudent.gender}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Contact Number</Label>
                      <p className="text-sm font-medium">{selectedStudent.contactNumber}</p>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label className="text-sm text-muted-foreground">Address</Label>
                      <p className="text-sm font-medium">
                        {[selectedStudent.houseNumber, selectedStudent.street, selectedStudent.subdivision, selectedStudent.barangay, selectedStudent.city]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Parent/Guardian</Label>
                      <p className="text-sm font-medium">{selectedStudent.parentGuardian}</p>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm text-muted-foreground">Current Status</Label>
                      <Badge
                        variant={
                          selectedStudent.enrollmentStatus === 'ENROLLED'
                            ? 'success'
                            : selectedStudent.enrollmentStatus === 'PENDING'
                            ? 'warning'
                            : 'outline'
                        }
                      >
                        {selectedStudent.enrollmentStatus}
                      </Badge>
                    </div>
                    {selectedStudent.isTransferee && (
                      <div className="space-y-1 md:col-span-3">
                        <Label className="text-sm text-muted-foreground">Previous School</Label>
                        <p className="text-sm font-medium">{selectedStudent.previousSchool}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Enrollment History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Enrollment History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedStudent.enrollments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No enrollment history</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedStudent.enrollments
                        .sort((a, b) => new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime())
                        .map((enrollment, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-4 p-4 rounded-lg border hover:bg-accent transition-colors"
                        >
                          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <span className="text-lg font-bold text-primary">
                              {enrollment.schoolYear.split('-')[0].slice(-2)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="text-sm font-semibold">{enrollment.schoolYear}</h4>
                              <Badge
                                variant={
                                  enrollment.status === 'ENROLLED'
                                    ? 'success'
                                    : enrollment.status === 'PENDING'
                                    ? 'warning'
                                    : 'outline'
                                }
                              >
                                {enrollment.status}
                              </Badge>
                            </div>
                            <div className="space-y-0.5 text-sm text-muted-foreground">
                              <p>
                                <span className="font-medium">Grade Level:</span> {enrollment.gradeLevel}
                                {enrollment.section && ` - ${enrollment.section}`}
                              </p>
                              <p>
                                <span className="font-medium">Enrolled:</span>{' '}
                                {new Date(enrollment.enrollmentDate).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}

                      {!selectedStudent.isTransferee && selectedStudent.enrollments.length > 0 && (
                        <div className="flex items-start gap-3 p-4 rounded-lg bg-muted mt-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <GraduationCap className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">
                              Total Years at School: {selectedStudent.enrollments.length}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              Enrolled since {selectedStudent.enrollments[selectedStudent.enrollments.length - 1]?.schoolYear}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {studentToDelete?.fullName} and all their enrollment records.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Switch Section/Grade Dialog */}
      <Dialog open={switchDialogOpen} onOpenChange={setSwitchDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Switch Student Section/Grade</DialogTitle>
            <DialogDescription>
              Update {selectedStudent?.fullName}&apos;s grade level and section
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="currentInfo" className="text-sm text-muted-foreground">
                  Current: {selectedStudent.gradeLevel}
                  {selectedStudent.section && ` - ${selectedStudent.section}`}
                </Label>
              </div>
              <div>
                <Label htmlFor="newGradeLevel">Grade Level *</Label>
                <Select value={newGradeLevel} onValueChange={setNewGradeLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_LEVELS.filter((g) => g !== 'All Grades').map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="newSection">Section</Label>
                <Input
                  id="newSection"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  placeholder="e.g., Enthusiasm, Obedience"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSwitchDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSwitchConfirm} disabled={switchMutation.isPending}>
              {switchMutation.isPending ? 'Switching...' : 'Switch Student'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
