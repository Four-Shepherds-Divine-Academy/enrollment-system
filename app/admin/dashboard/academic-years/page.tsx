'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Pencil, Upload, Loader2 } from 'lucide-react'
import { BulkImportStudentsDialog } from '@/components/bulk-import-students-dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { useAcademicYearsStore } from '@/store/academic-years-store'
import {
  useAcademicYears,
  useActiveAcademicYear,
  useCreateAcademicYear,
  useUpdateAcademicYear,
  useDeleteAcademicYear,
  useActivateAcademicYear,
} from '@/hooks/use-academic-years'

type AcademicYear = {
  id: string
  name: string
  startDate: Date
  endDate: Date | null
  isActive: boolean
  _count?: {
    enrollments: number
  }
}

export default function AcademicYearsPage() {
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [importPreviousStudents, setImportPreviousStudents] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showCreateConfirm, setShowCreateConfirm] = useState(false)
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importTargetYear, setImportTargetYear] = useState<AcademicYear | null>(null)
  const [pendingCreateData, setPendingCreateData] = useState<{
    name: string
    startDate: string
    endDate?: string
  } | null>(null)
  const [pendingActionYear, setPendingActionYear] = useState<AcademicYear | null>(null)
  const [editData, setEditData] = useState<{
    id: string
    name: string
    startDate: string
    endDate: string
  } | null>(null)

  // Track which year is being acted upon
  const [activatingYearId, setActivatingYearId] = useState<string | null>(null)
  const [deletingYearId, setDeletingYearId] = useState<string | null>(null)
  const [updatingYearId, setUpdatingYearId] = useState<string | null>(null)

  // Zustand store
  const { filters } = useAcademicYearsStore()

  // React Query hooks
  const { data: academicYears = [], isLoading } = useAcademicYears(filters)
  const { data: activeYear } = useActiveAcademicYear()
  const createMutation = useCreateAcademicYear()
  const updateMutation = useUpdateAcademicYear()
  const deleteMutation = useDeleteAcademicYear()
  const activateMutation = useActivateAcademicYear()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      name,
      startDate,
      ...(endDate && { endDate }),
    }

    // Check if there's already an active year
    if (activeYear) {
      setPendingCreateData(data)
      setShowCreateConfirm(true)
    } else {
      createMutation.mutate(data, {
        onSuccess: (newYear) => {
          setName('')
          setStartDate('')
          setEndDate('')
          setShowForm(false)
          setPendingCreateData(null)

          // If import checkbox was checked, open import dialog
          if (importPreviousStudents) {
            setImportTargetYear(newYear)
            setShowImportDialog(true)
            setImportPreviousStudents(false)
          }
        },
      })
    }
  }

  const handleConfirmCreate = () => {
    if (pendingCreateData) {
      createMutation.mutate(pendingCreateData, {
        onSuccess: (newYear) => {
          setName('')
          setStartDate('')
          setEndDate('')
          setShowForm(false)
          setShowCreateConfirm(false)
          setPendingCreateData(null)

          // If import checkbox was checked, open import dialog
          if (importPreviousStudents) {
            setImportTargetYear(newYear)
            setShowImportDialog(true)
            setImportPreviousStudents(false)
          }
        },
      })
    }
  }

  const handleSwitchYear = (year: AcademicYear) => {
    setPendingActionYear(year)
    setShowSwitchConfirm(true)
  }

  const handleConfirmSwitch = () => {
    if (pendingActionYear) {
      setActivatingYearId(pendingActionYear.id)
      activateMutation.mutate(pendingActionYear.id, {
        onSuccess: () => {
          setShowSwitchConfirm(false)
          setPendingActionYear(null)
          setActivatingYearId(null)
        },
        onError: () => {
          setActivatingYearId(null)
        }
      })
    }
  }

  const handleDeleteYear = (year: AcademicYear) => {
    setPendingActionYear(year)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    if (pendingActionYear) {
      setDeletingYearId(pendingActionYear.id)
      deleteMutation.mutate(pendingActionYear.id, {
        onSuccess: () => {
          setShowDeleteConfirm(false)
          setPendingActionYear(null)
          setDeletingYearId(null)
        },
        onError: () => {
          setDeletingYearId(null)
        }
      })
    }
  }

  const handleEditYear = (year: AcademicYear) => {
    setEditData({
      id: year.id,
      name: year.name,
      startDate: new Date(year.startDate).toISOString().split('T')[0],
      endDate: year.endDate ? new Date(year.endDate).toISOString().split('T')[0] : '',
    })
    setShowEditDialog(true)
  }

  const handleSaveEdit = () => {
    if (editData) {
      setUpdatingYearId(editData.id)
      updateMutation.mutate(
        {
          id: editData.id,
          data: {
            name: editData.name,
            startDate: editData.startDate,
            endDate: editData.endDate || null,
          },
        },
        {
          onSuccess: () => {
            setShowEditDialog(false)
            setEditData(null)
            setUpdatingYearId(null)
          },
          onError: () => {
            setUpdatingYearId(null)
          }
        }
      )
    }
  }

  const handleUpdateEndDate = (id: string, endDate: string) => {
    setUpdatingYearId(id)
    updateMutation.mutate({
      id,
      data: { endDate },
    }, {
      onSettled: () => {
        setUpdatingYearId(null)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Academic Years</h2>
          <p className="text-muted-foreground mt-1.5">
            Manage school academic years and enrollment periods
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="default">
          {showForm ? 'Cancel' : 'Create New Academic Year'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Academic Year</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Academic Year Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., 2024-2025"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              {academicYears.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="importStudents"
                        checked={importPreviousStudents}
                        onCheckedChange={(checked) =>
                          setImportPreviousStudents(checked as boolean)
                        }
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label
                          htmlFor="importStudents"
                          className="text-sm font-medium cursor-pointer"
                        >
                          Import students from previous academic year
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          After creating this year, you'll be able to select which students
                          to import and choose their grade level (advance, repeat, or graduate).
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {createMutation.isPending ? 'Creating...' : 'Create Academic Year'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Academic Years</CardTitle>
            <Badge variant="secondary" className="text-sm">
              {academicYears.length} {academicYears.length === 1 ? 'year' : 'years'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Year</TableHead>
                <TableHead className="font-semibold">Start Date</TableHead>
                <TableHead className="font-semibold">End Date</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Enrollments</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Loading academic years...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : academicYears.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="text-center py-12">
                    <p className="text-muted-foreground">
                      No academic years created yet. Create one to start enrolling students.
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                academicYears.map((year) => (
                  <TableRow key={year.id}>
                    <TableCell className="font-medium">{year.name}</TableCell>
                    <TableCell>
                      {new Date(year.startDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {year.endDate ? (
                        new Date(year.endDate).toLocaleDateString()
                      ) : (
                        <Input
                          type="date"
                          className="max-w-[160px] h-9"
                          onChange={(e) =>
                            handleUpdateEndDate(year.id, e.target.value)
                          }
                          placeholder="Set end date"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {year.isActive ? (
                        <Badge className="bg-green-100 text-green-700 border-green-300 hover:bg-green-100">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {year._count?.enrollments || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {year.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setImportTargetYear(year)
                              setShowImportDialog(true)
                            }}
                            disabled={activatingYearId !== null || deletingYearId !== null || updatingYearId !== null}
                            className="border-blue-500 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Import Students
                          </Button>
                        )}
                        {!year.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSwitchYear(year)}
                            disabled={activatingYearId !== null || deletingYearId !== null || updatingYearId !== null}
                            className="border-green-600 text-green-700 hover:bg-green-50 hover:text-green-800"
                          >
                            {activatingYearId === year.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Activate
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditYear(year)}
                          disabled={activatingYearId !== null || deletingYearId !== null || updatingYearId !== null}
                        >
                          {updatingYearId === year.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Pencil className="h-4 w-4 mr-2" />
                          )}
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteYear(year)}
                          disabled={activatingYearId !== null || deletingYearId !== null || updatingYearId !== null}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {deletingYearId === year.id && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Creating New Year */}
      <AlertDialog open={showCreateConfirm} onOpenChange={setShowCreateConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Academic Year?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <div className="font-semibold text-orange-600">
                  ⚠️ This will change the current active academic year!
                </div>
                <div>
                  Creating "{pendingCreateData?.name}" will automatically set it as the{' '}
                  <strong>new active academic year</strong> and deactivate the current year "
                  {activeYear?.name}".
                </div>
                <div>
                  All new student enrollments will be assigned to "{pendingCreateData?.name}" instead
                  of "{activeYear?.name}".
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  You can always switch back to a previous year using the "Activate"
                  button.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={createMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCreate}
              disabled={createMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Yes, Create New Year
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for Switching Year */}
      <AlertDialog open={showSwitchConfirm} onOpenChange={setShowSwitchConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch Active Academic Year?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <div>
                  Switch to <strong>"{pendingActionYear?.name}"</strong>?
                </div>
                <div className="mt-2">
                  This will make it the current active academic year for new enrollments.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={activateMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSwitch} disabled={activateMutation.isPending}>
              {activateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Yes, Switch Year
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for Deleting Year */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Academic Year?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <div className="mt-2">
                  Are you sure you want to delete <strong>"{pendingActionYear?.name}"</strong>?
                </div>
                <div className="mt-2">
                  This will delete the academic year and all related enrollments
                  ({pendingActionYear?._count?.enrollments || 0} enrollment records).
                </div>
                <div className="mt-2">
                  If you change your mind, you can restore this academic year within 30 days by going to the Recycle Bin.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Yes, Delete Year
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Academic Year Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Academic Year</DialogTitle>
          </DialogHeader>
          {editData && (
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">Academic Year Name *</Label>
                <Input
                  id="edit-name"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  placeholder="e.g., 2024-2025"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-startDate">Start Date *</Label>
                  <Input
                    id="edit-startDate"
                    type="date"
                    value={editData.startDate}
                    onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-endDate">End Date</Label>
                  <Input
                    id="edit-endDate"
                    type="date"
                    value={editData.endDate}
                    onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Students Dialog */}
      {importTargetYear && (
        <BulkImportStudentsDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          targetAcademicYear={importTargetYear}
          availableYears={academicYears.filter((y) => y.id !== importTargetYear.id)}
          onSuccess={() => {}}
        />
      )}
    </div>
  )
}
