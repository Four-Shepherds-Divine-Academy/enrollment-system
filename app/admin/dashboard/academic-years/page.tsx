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
      activateMutation.mutate(pendingActionYear.id, {
        onSuccess: () => {
          setShowSwitchConfirm(false)
          setPendingActionYear(null)
        },
      })
    }
  }

  const handleDeleteYear = (year: AcademicYear) => {
    setPendingActionYear(year)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    if (pendingActionYear) {
      deleteMutation.mutate(pendingActionYear.id, {
        onSuccess: () => {
          setShowDeleteConfirm(false)
          setPendingActionYear(null)
        },
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
          },
        }
      )
    }
  }

  const handleUpdateEndDate = (id: string, endDate: string) => {
    updateMutation.mutate({
      id,
      data: { endDate },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Academic Years</h2>
          <p className="text-gray-600 mt-1">
            Manage school academic years and enrollment periods
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'Create New Academic Year'}
          </Button>
        </div>
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
                <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <Checkbox
                    id="importStudents"
                    checked={importPreviousStudents}
                    onCheckedChange={(checked) =>
                      setImportPreviousStudents(checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="importStudents"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Import students from previous academic year
                    </Label>
                    <p className="text-xs text-gray-600 mt-1">
                      After creating this year, you'll be able to select which students
                      to import and choose their grade level (advance, repeat, or graduate).
                    </p>
                  </div>
                </div>
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
        <CardHeader>
          <CardTitle>Academic Years ({academicYears.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Year</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrollments</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  </TableCell>
                </TableRow>
              ) : academicYears.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    No academic years created yet. Create one to start enrolling students.
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
                        <input
                          type="date"
                          className="border rounded px-2 py-1 text-sm"
                          onChange={(e) =>
                            handleUpdateEndDate(year.id, e.target.value)
                          }
                          placeholder="Set end date"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {year.isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border-green-300">
                            Active
                          </span>
                        )}
                        {!year.isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 border-yellow-300">
                            Inactive
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{year._count?.enrollments || 0}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditYear(year)}
                          disabled={updateMutation.isPending}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {year.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setImportTargetYear(year)
                              setShowImportDialog(true)
                            }}
                            className="border-blue-500 text-blue-700 hover:bg-blue-50"
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            Import Students
                          </Button>
                        )}
                        {!year.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSwitchYear(year)}
                            disabled={activateMutation.isPending}
                            className="border-green-500 text-green-700 hover:bg-green-50"
                          >
                            Activate
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteYear(year)}
                          disabled={deleteMutation.isPending}
                          className="border-red-500 text-red-700 hover:bg-red-50"
                        >
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCreate}
              className="bg-orange-600 hover:bg-orange-700"
            >
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSwitch}>
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
                <div className="font-semibold text-red-600">
                  ⚠️ This action cannot be undone!
                </div>
                <div className="mt-2">
                  Are you sure you want to delete <strong>"{pendingActionYear?.name}"</strong>?
                </div>
                <div className="mt-2">
                  This will permanently delete the academic year and all related enrollments
                  ({pendingActionYear?._count?.enrollments || 0} enrollment records).
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Note: This is intended for testing purposes only.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
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
