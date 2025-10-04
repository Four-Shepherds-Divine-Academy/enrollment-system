'use client'

import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Loader2, Search, Users, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'

type Student = {
  id: string
  lrn: string | null
  fullName: string
  gradeLevel: string
  section: string | null
  currentGrade: string
  nextGrade: string
  selectedGrade?: string // Grade level selected for import
}

type AcademicYear = {
  id: string
  name: string
  isActive: boolean
}

type FailedImport = {
  studentId: string
  studentName: string
  gradeLevel: string
  error: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetAcademicYear: AcademicYear
  availableYears: AcademicYear[]
  onSuccess: () => void
}

export function BulkImportStudentsDialog({
  open,
  onOpenChange,
  targetAcademicYear,
  availableYears,
  onSuccess,
}: Props) {
  const queryClient = useQueryClient()
  const [sourceYearId, setSourceYearId] = useState<string>('')
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(
    new Set()
  )
  const [studentGrades, setStudentGrades] = useState<Map<string, string>>(
    new Map()
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({
    current: 0,
    total: 0,
    currentStudent: '',
    succeeded: 0,
    failed: 0,
    skipped: 0,
  })
  const [failedImports, setFailedImports] = useState<FailedImport[]>([])
  const [retrying, setRetrying] = useState(false)

  const AVAILABLE_GRADES = [
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

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const response = await fetch(
        `/api/academic-years/${targetAcademicYear.id}/import-students?sourceYearId=${sourceYearId}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch students')
      }

      const data = await response.json()
      setStudents(data.students)

      // Initialize grade levels with suggested next grade
      const gradeMap = new Map<string, string>()
      data.students.forEach((student: Student) => {
        gradeMap.set(student.id, student.nextGrade)
      })
      setStudentGrades(gradeMap)
    } catch (error) {
      toast.error('Failed to fetch students from selected year')
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch students when source year changes
  useEffect(() => {
    if (sourceYearId && open) {
      void fetchStudents()
    } else {
      setStudents([])
      setSelectedStudentIds(new Set())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceYearId, open])

  const handleGradeChange = (studentId: string, grade: string) => {
    const newGrades = new Map(studentGrades)
    newGrades.set(studentId, grade)
    setStudentGrades(newGrades)
  }

  const handleSelectAll = () => {
    const filtered = getFilteredStudents()
    if (selectedStudentIds.size === filtered.length) {
      setSelectedStudentIds(new Set())
    } else {
      setSelectedStudentIds(new Set(filtered.map((s) => s.id)))
    }
  }

  const handleToggleStudent = (studentId: string) => {
    const newSelected = new Set(selectedStudentIds)
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId)
    } else {
      newSelected.add(studentId)
    }
    setSelectedStudentIds(newSelected)
  }

  const handleImport = async () => {
    if (selectedStudentIds.size === 0) {
      toast.error('Please select at least one student to import')
      return
    }

    // Validate all selected students have grade levels
    const studentsToImport = Array.from(selectedStudentIds).map((studentId) => {
      const gradeLevel = studentGrades.get(studentId)
      const student = students.find((s) => s.id === studentId)

      if (!gradeLevel) {
        throw new Error(`Grade level not set for ${student?.fullName || studentId}`)
      }

      return {
        studentId,
        gradeLevel,
      }
    })

    setImporting(true)
    setFailedImports([])
    setImportProgress({
      current: 0,
      total: studentsToImport.length,
      currentStudent: '',
      succeeded: 0,
      failed: 0,
      skipped: 0,
    })

    // Prevent page unload during import
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
      return ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    try {
      // Process students one by one with progress updates
      const results = {
        success: 0,
        skipped: 0,
        errors: [] as string[],
      }

      for (let i = 0; i < studentsToImport.length; i++) {
        const importStudent = studentsToImport[i]
        const student = students.find((s) => s.id === importStudent.studentId)

        // Update progress with current student
        setImportProgress({
          current: i + 1,
          total: studentsToImport.length,
          currentStudent: student?.fullName || '',
          succeeded: results.success,
          failed: results.errors.length,
          skipped: results.skipped,
        })

        try {
          // Import individual student
          const response = await fetch(
            `/api/academic-years/${targetAcademicYear.id}/import-students`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                students: [importStudent],
              }),
            }
          )

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Failed to import student')
          }

          // Update results
          if (data.success > 0) {
            results.success += data.success
          }
          if (data.skipped > 0) {
            results.skipped += data.skipped
          }
          if (data.errors && data.errors.length > 0) {
            results.errors.push(...data.errors)
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          results.errors.push(`${student?.fullName || importStudent.studentId}: ${errorMessage}`)

          // Track failed import for retry
          setFailedImports((prev) => [
            ...prev,
            {
              studentId: importStudent.studentId,
              studentName: student?.fullName || importStudent.studentId,
              gradeLevel: importStudent.gradeLevel,
              error: errorMessage,
            },
          ])
        }

        // Small delay to show progress (optional, can be removed for faster processing)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      // Show detailed results
      const successCount = results.success
      const skippedCount = results.skipped
      const errorCount = results.errors.length

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} student${successCount > 1 ? 's' : ''}`, {
          duration: 5000,
        })
      }

      if (skippedCount > 0) {
        toast.info(`${skippedCount} student${skippedCount > 1 ? 's were' : ' was'} already enrolled`, {
          duration: 5000,
        })
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} student${errorCount > 1 ? 's' : ''} failed to import`, {
          duration: 8000,
          description: 'Check the failed imports list below to retry',
        })
        console.error('Import errors:', results.errors)
      }

      // Invalidate queries to refresh data
      if (successCount > 0) {
        // Invalidate all related queries
        queryClient.invalidateQueries({ queryKey: ['students'] })
        queryClient.invalidateQueries({ queryKey: ['academicYears'] })
        queryClient.invalidateQueries({ queryKey: ['sections'] })
      }

      // Only close dialog if there were no errors
      if (errorCount === 0) {
        onSuccess()
        onOpenChange(false)

        // Reset state
        setSourceYearId('')
        setStudents([])
        setSelectedStudentIds(new Set())
        setStudentGrades(new Map())
        setSearchQuery('')
        setFailedImports([])
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error('Failed to import students', {
        description: errorMessage,
        duration: 8000,
      })
      console.error('Error importing students:', error)
    } finally {
      setImporting(false)
      setImportProgress({
        current: 0,
        total: 0,
        currentStudent: '',
        succeeded: 0,
        failed: 0,
        skipped: 0,
      })
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }

  const getFilteredStudents = () => {
    if (!searchQuery) return students

    const query = searchQuery.toLowerCase()
    return students.filter(
      (student) =>
        student.fullName.toLowerCase().includes(query) ||
        student.lrn?.toLowerCase().includes(query) ||
        student.currentGrade.toLowerCase().includes(query)
    )
  }

  const handleRetryFailed = async () => {
    if (failedImports.length === 0) return

    setRetrying(true)
    const results = {
      success: 0,
      errors: [] as FailedImport[],
    }

    for (const failedImport of failedImports) {
      try {
        const response = await fetch(
          `/api/academic-years/${targetAcademicYear.id}/import-students`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              students: [
                {
                  studentId: failedImport.studentId,
                  gradeLevel: failedImport.gradeLevel,
                },
              ],
            }),
          }
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to import student')
        }

        if (data.success > 0) {
          results.success++
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push({
          ...failedImport,
          error: errorMessage,
        })
      }

      await new Promise((resolve) => setTimeout(resolve, 100))
    }

    setRetrying(false)

    if (results.success > 0) {
      toast.success(`Successfully retried ${results.success} student${results.success > 1 ? 's' : ''}`)
    }

    if (results.errors.length > 0) {
      toast.error(`${results.errors.length} student${results.errors.length > 1 ? 's' : ''} still failed to import`)
      setFailedImports(results.errors)
    } else {
      setFailedImports([])
      onSuccess()
      onOpenChange(false)

      // Reset state
      setSourceYearId('')
      setStudents([])
      setSelectedStudentIds(new Set())
      setStudentGrades(new Map())
      setSearchQuery('')
    }
  }

  const filteredStudents = getFilteredStudents()
  const allSelected = filteredStudents.length > 0 && selectedStudentIds.size === filteredStudents.length

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        // Prevent closing dialog during import
        if (!open && importing) {
          toast.warning('Please wait for the import to complete before closing')
          return
        }
        onOpenChange(open)
      }}
    >
      <DialogContent
        className="max-w-[90vw] sm:max-w-[90vw] max-h-[85vh] flex flex-col"
        onPointerDownOutside={(e) => {
          // Prevent closing by clicking outside during import
          if (importing) {
            e.preventDefault()
            toast.warning('Please wait for the import to complete')
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing with Escape key during import
          if (importing) {
            e.preventDefault()
            toast.warning('Please wait for the import to complete')
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Import Students from Previous Year</DialogTitle>
          <DialogDescription>
            Select students to enroll in {targetAcademicYear.name}. You can adjust
            the grade level for each student (e.g., if they're repeating a grade or
            graduating).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 flex-1 overflow-hidden flex flex-col">
          {/* Source Year Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Source Academic Year</Label>
            <Select value={sourceYearId} onValueChange={setSourceYearId}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Choose academic year..." />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    <div className="flex items-center gap-2">
                      <span>{year.name}</span>
                      {year.isActive && (
                        <Badge variant="secondary" className="text-xs">Active</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search and Actions */}
          {sourceYearId && (
            <>
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, LRN, or grade..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleSelectAll}
                  disabled={loading || filteredStudents.length === 0}
                  className="shrink-0"
                >
                  {allSelected ? 'Unselect All' : 'Select All'}
                </Button>
              </div>

              {/* Student List */}
              <Card className="flex-1 overflow-hidden flex flex-col">
                <CardContent className="p-0 flex-1 overflow-y-auto">
                  {loading ? (
                    <div className="flex items-center justify-center h-64">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">Loading students...</p>
                      </div>
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                      <Users className="h-16 w-16 mb-4 text-muted-foreground/40" />
                      <p className="font-medium">No students available to import</p>
                      {searchQuery && (
                        <p className="text-sm mt-1">Try adjusting your search criteria</p>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {filteredStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
                        >
                          <Checkbox
                            checked={selectedStudentIds.has(student.id)}
                            onCheckedChange={() => handleToggleStudent(student.id)}
                            className="shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium truncate">{student.fullName}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap">
                                  {student.lrn && (
                                    <Badge variant="outline" className="font-mono text-xs">
                                      {student.lrn}
                                    </Badge>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <span className="font-medium">Current:</span>
                                    <span>{student.currentGrade}</span>
                                  </span>
                                  {student.section && (
                                    <>
                                      <span>•</span>
                                      <span>{student.section}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                  Enroll to:
                                </span>
                                <Select
                                  value={studentGrades.get(student.id) || student.nextGrade}
                                  onValueChange={(value) => handleGradeChange(student.id, value)}
                                >
                                  <SelectTrigger className="w-[140px] h-9">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {AVAILABLE_GRADES.map((grade) => (
                                      <SelectItem key={grade} value={grade}>
                                        {grade}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Summary */}
              {filteredStudents.length > 0 && (
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="text-sm font-medium">
                      <span className="text-primary text-lg">{selectedStudentIds.size}</span>
                      <span className="text-muted-foreground"> of </span>
                      <span className="text-foreground">{filteredStudents.length}</span>
                      <span className="text-muted-foreground"> students selected</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {importing && (
          <Separator />
        )}

        {importing && (
          <Card className="bg-muted/50">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">
                    Importing students...
                  </span>
                </div>
                <Badge variant="secondary">
                  {importProgress.current} / {importProgress.total}
                </Badge>
              </div>

              <Progress
                value={(importProgress.current / importProgress.total) * 100}
                className="h-2"
              />

              {importProgress.currentStudent && (
                <p className="text-sm text-muted-foreground truncate">
                  Processing: <span className="font-medium">{importProgress.currentStudent}</span>
                </p>
              )}

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{importProgress.succeeded} completed</span>
                </div>
                {importProgress.skipped > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">{importProgress.skipped} skipped</span>
                  </div>
                )}
                {importProgress.failed > 0 && (
                  <div className="flex items-center gap-1.5">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <span className="text-destructive">{importProgress.failed} failed</span>
                  </div>
                )}
              </div>

              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
                Please wait, do not close this window
              </p>
            </CardContent>
          </Card>
        )}

        {/* Failed Imports List */}
        {!importing && failedImports.length > 0 && (
          <>
            <Separator />
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-destructive">
                        Failed Imports ({failedImports.length})
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        The following students failed to import. Click retry to attempt again.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleRetryFailed}
                    disabled={retrying}
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                  >
                    {retrying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Retry All
                  </Button>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {failedImports.map((failed, index) => (
                    <Card key={index} className="border-destructive/20">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {failed.studentName}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Grade: {failed.gradeLevel}
                            </p>
                            <p className="text-xs text-destructive mt-1 flex items-start gap-1">
                              <XCircle className="h-3 w-3 shrink-0 mt-0.5" />
                              <span>{failed.error}</span>
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={async () => {
                          try {
                            const response = await fetch(
                              `/api/academic-years/${targetAcademicYear.id}/import-students`,
                              {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  students: [
                                    {
                                      studentId: failed.studentId,
                                      gradeLevel: failed.gradeLevel,
                                    },
                                  ],
                                }),
                              }
                            )

                            const data = await response.json()

                            if (!response.ok) {
                              throw new Error(data.error || 'Failed to import student')
                            }

                            toast.success(`Successfully imported ${failed.studentName}`)
                            setFailedImports((prev) =>
                              prev.filter((f) => f.studentId !== failed.studentId)
                            )

                            // If all failed imports are resolved, close dialog
                            if (failedImports.length === 1) {
                              onSuccess()
                              onOpenChange(false)
                              setSourceYearId('')
                              setStudents([])
                              setSelectedStudentIds(new Set())
                              setStudentGrades(new Map())
                              setSearchQuery('')
                            }
                          } catch (error) {
                            const errorMessage =
                              error instanceof Error ? error.message : 'Unknown error'
                            toast.error(`Failed to retry: ${errorMessage}`)
                          }
                        }}
                      >
                        Retry
                      </Button>
                    </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing || retrying}
          >
            {failedImports.length > 0 ? 'Close' : 'Cancel'}
          </Button>
          <Button
            onClick={handleImport}
            disabled={
              importing || retrying || selectedStudentIds.size === 0 || !sourceYearId
            }
          >
            {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {importing ? 'Importing...' : 'Import Students'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
