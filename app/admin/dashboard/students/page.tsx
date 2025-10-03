'use client'

import { useState, useMemo, useEffect } from 'react'
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
import { Pencil, Trash2, Eye, ArrowRightLeft, Loader2, User, MapPin, Phone, GraduationCap, History, FileText } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { useStudentsStore } from '@/store/students-store'
import { useStudents, useDeleteStudent, useSwitchStudent } from '@/hooks/use-students'
import { useActiveAcademicYear } from '@/hooks/use-academic-years'
import { useSections } from '@/hooks/use-sections'
import { parseRemarks } from '@/lib/utils/format-remarks'
import { STUDENT_REMARK_CATEGORIES } from '@/lib/constants/student-remarks'

type Student = {
  id: string
  lrn: string | null
  fullName: string
  gradeLevel: string
  section: {
    id: string
    name: string
    gradeLevel: string
  } | null
  contactNumber: string
  city: string
  province: string
  enrollmentStatus: string
  isTransferee: boolean
  previousSchool: string | null
  gender: string
  houseNumber: string | null
  street: string | null
  subdivision: string | null
  barangay: string
  parentGuardian: string
  remarks?: string | null
  enrollments: Array<{
    schoolYear: string
    gradeLevel: string
    section: {
      id: string
      name: string
      gradeLevel: string
    } | null
    status: string
    enrollmentDate: string
  }>
}

// Helper function to format full address
function formatAddress(student: Student): string {
  const parts = [
    student.houseNumber,
    student.street,
    student.subdivision,
    student.barangay,
    student.city,
    student.province,
  ].filter(Boolean)

  return parts.join(', ')
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
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null)
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false)
  const [newGradeLevel, setNewGradeLevel] = useState('')
  const [newSection, setNewSection] = useState('')

  // Zustand store - only for UI state
  const { filters, setSearchQuery, setGradeLevel, setStatus, setRemark } = useStudentsStore()

  // Generate remark options dynamically
  const remarkOptions = useMemo(() => {
    const allRemarks = STUDENT_REMARK_CATEGORIES.flatMap(category =>
      category.remarks.map(remark => ({
        value: remark,
        label: remark,
        category: category.label
      }))
    )
    return [{ value: 'All Remarks', label: 'All Remarks', category: '' }, ...allRemarks]
  }, [])

  // React Query hooks
  const { data: activeYear } = useActiveAcademicYear()

  // Pass all filters to the API (server-side filtering)
  const { data: students = [], isLoading } = useStudents({
    searchQuery: filters.searchQuery,
    gradeLevel: filters.gradeLevel,
    status: filters.status,
    remark: filters.remark,
    academicYear: filters.academicYear,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  })

  const deleteMutation = useDeleteStudent()
  const switchMutation = useSwitchStudent()

  // Fetch sections based on selected grade level
  const { data: sections = [], isLoading: loadingSections } = useSections({
    gradeLevel: newGradeLevel || '',
    status: 'active',
  })

  // Clear section when grade level changes
  useEffect(() => {
    if (newGradeLevel) {
      setNewSection('')
    }
  }, [newGradeLevel])

  // Group students by grade level and section (already filtered by API)
  const groupedStudents = students.reduce((acc, student) => {
    const key = `${student.gradeLevel}${student.section ? ` - ${student.section.name}` : ''}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(student)
    return acc
  }, {} as Record<string, Student[]>)

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

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (studentToDelete) {
      deleteMutation.mutate(studentToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false)
          setStudentToDelete(null)
        },
      })
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

  const handleSwitchConfirm = () => {
    if (selectedStudent && activeYear) {
      switchMutation.mutate(
        {
          id: selectedStudent.id,
          targetYearId: activeYear.id,
          gradeLevel: newGradeLevel,
          section: newSection,
        },
        {
          onSuccess: () => {
            setSwitchDialogOpen(false)
            setSelectedStudent(null)
          },
        }
      )
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; className: string }> = {
      ENROLLED: { variant: 'default', className: 'bg-green-100 text-green-700 border-green-300' },
      PENDING: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
      DROPPED: { variant: 'destructive', className: 'bg-red-100 text-red-700 border-red-300' },
    }
    const config = variants[status] || variants.PENDING
    return (
      <Badge variant={config.variant} className={config.className}>
        {status}
      </Badge>
    )
  }

  if (!activeYear) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">No active academic year. Please create one first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Students</h2>
        <p className="text-gray-600 mt-1">
          Manage students for {activeYear.name}
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search by name, LRN, or city..."
                value={filters.searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="grade">Grade Level</Label>
              <Select value={filters.gradeLevel} onValueChange={setGradeLevel}>
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
            <div className="w-full md:w-48">
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Status">All Status</SelectItem>
                  <SelectItem value="ENROLLED">Enrolled</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="DROPPED">Dropped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Label htmlFor="remark">Remarks</Label>
              <Select value={filters.remark} onValueChange={setRemark}>
                <SelectTrigger id="remark">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {remarkOptions.map((option, index) => (
                    <SelectItem key={index} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : sortedGroups.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No students found
          </CardContent>
        </Card>
      ) : (
        sortedGroups.map(([group, groupStudents]) => (
          <Card key={group}>
            <CardHeader>
              <CardTitle className="text-lg">
                {group} ({groupStudents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>LRN</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="max-w-sm">Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-sm">
                        {student.lrn || 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {student.fullName}
                        {student.isTransferee && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Transferee
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{student.gender}</TableCell>
                      <TableCell>{student.contactNumber}</TableCell>
                      <TableCell className="max-w-sm">
                        <div className="break-words whitespace-normal">
                          {formatAddress(student)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(student.enrollmentStatus)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewDetails(student)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/admin/dashboard/students/${student.id}/edit`)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSwitchClick(student)}
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(student)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))
      )}

      {/* View Details Dialog */}
      <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
        <DialogContent className="sm:max-w-5xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <User className="h-5 w-5" />
              Student Details
            </DialogTitle>
            <DialogDescription>
              Complete information and enrollment history
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <User className="h-4 w-4" />
                  <span>Personal Information</span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 pl-6">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Full Name</p>
                    <p className="text-sm font-medium">{selectedStudent.fullName}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">LRN</p>
                    <p className="text-sm font-medium font-mono">{selectedStudent.lrn || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Gender</p>
                    <p className="text-sm font-medium">{selectedStudent.gender}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Status</p>
                    {getStatusBadge(selectedStudent.enrollmentStatus)}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Contact Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <Phone className="h-4 w-4" />
                  <span>Contact Information</span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 pl-6">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Contact Number</p>
                    <p className="text-sm font-medium">{selectedStudent.contactNumber}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Parent/Guardian</p>
                    <p className="text-sm font-medium">{selectedStudent.parentGuardian}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Address */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <MapPin className="h-4 w-4" />
                  <span>Address</span>
                </div>
                <div className="pl-6">
                  <p className="text-sm font-medium leading-relaxed">
                    {[
                      selectedStudent.houseNumber && `Lot ${selectedStudent.houseNumber}`,
                      selectedStudent.street,
                      selectedStudent.subdivision,
                      selectedStudent.barangay,
                      selectedStudent.city,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Current Enrollment */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <GraduationCap className="h-4 w-4" />
                  <span>Current Enrollment</span>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 pl-6">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Grade Level</p>
                    <p className="text-sm font-medium">{selectedStudent.gradeLevel}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">Section</p>
                    <p className="text-sm font-medium">
                      {selectedStudent.section?.name || 'Not Assigned'}
                    </p>
                  </div>
                  {selectedStudent.isTransferee && (
                    <div className="col-span-2 space-y-1">
                      <p className="text-xs text-gray-500">Previous School</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Transferee</Badge>
                        <p className="text-sm font-medium">
                          {selectedStudent.previousSchool || 'N/A'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Remarks */}
              {selectedStudent.remarks && (() => {
                const { customText, checkboxValues } = parseRemarks(selectedStudent.remarks)
                const hasRemarks = customText || checkboxValues.length > 0

                if (!hasRemarks) return null

                return (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                        <FileText className="h-4 w-4" />
                        <span>Remarks</span>
                      </div>
                      <div className="pl-6 space-y-3">
                        {customText && (
                          <div>
                            <p className="text-sm">
                              <span className="font-bold">(Admin NOTE: {customText})</span>
                            </p>
                          </div>
                        )}
                        {checkboxValues.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Other Remarks:</p>
                            <div className="flex flex-wrap gap-2">
                              {checkboxValues.map((remark, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {remark}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )
              })()}

              {/* Enrollment History */}
              {selectedStudent.enrollments && selectedStudent.enrollments.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <History className="h-4 w-4" />
                      <span>Enrollment History</span>
                    </div>
                    <div className="pl-6 space-y-2">
                      {selectedStudent.enrollments
                        .sort((a, b) => new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime())
                        .map((enrollment, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">SY {enrollment.schoolYear}</p>
                                <span className="text-gray-300">•</span>
                                <p className="text-sm text-gray-600">{enrollment.gradeLevel}</p>
                                {enrollment.section && (
                                  <>
                                    <span className="text-gray-300">•</span>
                                    <p className="text-sm text-gray-600">{enrollment.section.name}</p>
                                  </>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Enrolled: {new Date(enrollment.enrollmentDate).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={
                                enrollment.status === 'ENROLLED'
                                  ? 'bg-green-50 text-green-700 border-green-300'
                                  : enrollment.status === 'PENDING'
                                  ? 'bg-yellow-50 text-yellow-700 border-yellow-300'
                                  : 'bg-gray-50 text-gray-700 border-gray-300'
                              }
                            >
                              {enrollment.status}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDetailsOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setViewDetailsOpen(false)
              if (selectedStudent) {
                router.push(`/admin/dashboard/students/${selectedStudent.id}/edit`)
              }
            }}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Switch Grade/Section Dialog */}
      <Dialog open={switchDialogOpen} onOpenChange={setSwitchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Switch Grade/Section</DialogTitle>
            <DialogDescription>
              Update student&apos;s grade level and section
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="newGrade">Grade Level</Label>
              <Select value={newGradeLevel} onValueChange={setNewGradeLevel}>
                <SelectTrigger id="newGrade">
                  <SelectValue />
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
              <Select
                value={newSection}
                onValueChange={setNewSection}
                disabled={!newGradeLevel || loadingSections}
              >
                <SelectTrigger id="newSection">
                  <SelectValue
                    placeholder={
                      !newGradeLevel
                        ? "Select grade level first"
                        : loadingSections
                        ? "Loading sections..."
                        : sections.length === 0
                        ? "No sections available"
                        : "Select section"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section: any) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSwitchDialogOpen(false)}
              disabled={switchMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSwitchConfirm}
              disabled={switchMutation.isPending}
            >
              {switchMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Switch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {studentToDelete?.fullName}. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
