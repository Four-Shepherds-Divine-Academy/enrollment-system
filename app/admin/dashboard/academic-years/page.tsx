'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { toast } from 'sonner'
import { Pencil, Upload } from 'lucide-react'
import { BulkImportStudentsDialog } from '@/components/bulk-import-students-dialog'
import { Checkbox } from '@/components/ui/checkbox'

type AcademicYear = {
  id: string
  name: string
  startDate: string
  endDate: string | null
  isActive: boolean

  _count: {
    enrollments: number
  }
}

export default function AcademicYearsPage() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [importPreviousStudents, setImportPreviousStudents] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showCreateConfirm, setShowCreateConfirm] = useState(false)
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
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

  const { data: academicYears = [], isLoading } = useQuery<AcademicYear[]>({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const response = await fetch('/api/academic-years')
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; startDate: string; endDate?: string }) => {
      const response = await fetch('/api/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create')
      return response.json()
    },
    onSuccess: (newYear) => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] })
      setName('')
      setStartDate('')
      setEndDate('')
      setShowForm(false)
      setPendingCreateData(null)
      toast.success('Academic year created successfully!')

      // If import checkbox was checked, open import dialog
      if (importPreviousStudents) {
        setImportTargetYear(newYear)
        setShowImportDialog(true)
        setImportPreviousStudents(false)
      }
    },
  })

  const switchYearMutation = useMutation({
    mutationFn: async (yearId: string) => {
      const response = await fetch(`/api/academic-years/${yearId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'activate' }),
      })
      if (!response.ok) throw new Error('Failed to switch year')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] })
      toast.success('Academic year switched successfully!')
    },
  })

  const endYearMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/academic-years/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end' }),
      })
      if (!response.ok) throw new Error('Failed to end year')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] })
      toast.success('Academic year ended successfully!', {
        description: 'The academic year has been closed.',
      })
    },
  })

  const updateEndDateMutation = useMutation({
    mutationFn: async ({ id, endDate }: { id: string; endDate: string }) => {
      const response = await fetch(`/api/academic-years/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endDate }),
      })
      if (!response.ok) throw new Error('Failed to update')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      name,
      startDate,
      ...(endDate && { endDate }),
    }

    // Check if there's already an active year
    const activeYear = academicYears.find((y) => y.isActive)
    if (activeYear) {
      setPendingCreateData(data)
      setShowCreateConfirm(true)
    } else {
      createMutation.mutate(data)
    }
  }

  const handleConfirmCreate = () => {
    if (pendingCreateData) {
      createMutation.mutate(pendingCreateData)
      setShowCreateConfirm(false)
    }
  }

  const handleSwitchYear = (year: AcademicYear) => {
    setPendingActionYear(year)
    setShowSwitchConfirm(true)
  }

  const handleConfirmSwitch = () => {
    if (pendingActionYear) {
      switchYearMutation.mutate(pendingActionYear.id)
      setShowSwitchConfirm(false)
      setPendingActionYear(null)
    }
  }

  const handleEndYear = (year: AcademicYear) => {
    setPendingActionYear(year)
    setShowEndConfirm(true)
  }

  const handleConfirmEnd = () => {
    if (pendingActionYear) {
      endYearMutation.mutate(pendingActionYear.id)
      setShowEndConfirm(false)
      setPendingActionYear(null)
    }
  }

  const deleteYearMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/academic-years/${id}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete academic year')
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] })
      toast.success('Academic year deleted successfully!', {
        description: `Deleted ${data.deletedYear} with ${data.deletedEnrollments} enrollments`,
      })
    },
    onError: () => {
      toast.error('Failed to delete academic year')
    },
  })

  const handleDeleteYear = (year: AcademicYear) => {
    setPendingActionYear(year)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    if (pendingActionYear) {
      deleteYearMutation.mutate(pendingActionYear.id)
      setShowDeleteConfirm(false)
      setPendingActionYear(null)
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

  const editYearMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; startDate: string; endDate?: string }) => {
      const response = await fetch(`/api/academic-years/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          startDate: data.startDate,
          endDate: data.endDate || null,
        }),
      })
      if (!response.ok) throw new Error('Failed to update academic year')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['academic-years'] })
      toast.success('Academic year updated successfully!')
      setShowEditDialog(false)
      setEditData(null)
    },
    onError: () => {
      toast.error('Failed to update academic year')
    },
  })

  const handleSaveEdit = () => {
    if (editData) {
      editYearMutation.mutate({
        id: editData.id,
        name: editData.name,
        startDate: editData.startDate,
        endDate: editData.endDate || undefined,
      })
    }
  }

  const activeYear = academicYears.find((y) => y.isActive)

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
                  <TableCell colSpan={6} className="text-center">
                    Loading...
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
                            updateEndDateMutation.mutate({
                              id: year.id,
                              endDate: e.target.value,
                            })
                          }
                          placeholder="Set end date"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {year.isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                        {false && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Closed
                          </span>
                        )}
                        {!year.isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Inactive
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{year._count.enrollments}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditYear(year)}
                          disabled={editYearMutation.isPending}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {year.isActive && (
                          <>
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
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleEndYear(year)}
                              disabled={endYearMutation.isPending}
                            >
                              End Year
                            </Button>
                          </>
                        )}
                        {!year.isActive && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSwitchYear(year)}
                            disabled={switchYearMutation.isPending}
                            className="border-green-500 text-green-700 hover:bg-green-50"
                          >
                            Activate
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteYear(year)}
                          disabled={deleteYearMutation.isPending}
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
                  You can always switch back to a previous year using the "Switch to This Year"
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

      {/* Confirmation Dialog for Ending Year */}
      <AlertDialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End Academic Year?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <div className="font-semibold text-red-600">
                  ⚠️ This action cannot be undone!
                </div>
                <div className="mt-2">
                  Are you sure you want to end <strong>"{pendingActionYear?.name}"</strong>?
                </div>
                <div className="mt-2">
                  This will close enrollment for this academic year permanently.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmEnd}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, End Year
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
                  ({pendingActionYear?._count.enrollments || 0} enrollment records).
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
              disabled={editYearMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={editYearMutation.isPending}
            >
              {editYearMutation.isPending ? 'Saving...' : 'Save Changes'}
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
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['academic-years'] })
          }}
        />
      )}
    </div>
  )
}
