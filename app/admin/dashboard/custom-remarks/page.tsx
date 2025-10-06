'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, Download } from 'lucide-react'
import { toast } from 'sonner'
import {
  useCustomRemarks,
  useCreateCustomRemark,
  useUpdateCustomRemark,
  useDeleteCustomRemark,
  useStudentsByRemark,
  type CustomRemark,
} from '@/hooks/use-custom-remarks'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'payment', label: 'Payment-Related' },
  { value: 'documents', label: 'Document-Related' },
  { value: 'behavioral', label: 'Behavioral' },
  { value: 'administrative', label: 'Administrative' },
  { value: 'special', label: 'Special Cases' },
  { value: 'custom', label: 'Custom' },
]

export default function CustomRemarksPage() {
  const [showDialog, setShowDialog] = useState(false)
  const [editingRemark, setEditingRemark] = useState<CustomRemark | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<CustomRemark | null>(null)
  const [deactivateConfirm, setDeactivateConfirm] = useState<CustomRemark | null>(null)
  const [editConfirm, setEditConfirm] = useState<CustomRemark | null>(null)
  const [showInactive, setShowInactive] = useState(false)
  const [isSeeding, setIsSeeding] = useState(false)
  const [selectedRemarkForStudents, setSelectedRemarkForStudents] = useState<string | null>(null)
  const [showStudentsModal, setShowStudentsModal] = useState(false)

  // Loading states for individual buttons
  const [togglingRemarkId, setTogglingRemarkId] = useState<string | null>(null)
  const [deletingRemarkId, setDeletingRemarkId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    label: '',
    category: 'custom',
    sortOrder: 0,
  })
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [customCategoryName, setCustomCategoryName] = useState('')

  const { data: remarks = [], isLoading } = useCustomRemarks(!showInactive)
  const createMutation = useCreateCustomRemark()
  const updateMutation = useUpdateCustomRemark()
  const deleteMutation = useDeleteCustomRemark()
  const { data: studentsWithRemark = [], isLoading: isLoadingStudents } = useStudentsByRemark(selectedRemarkForStudents)

  // Set page title
  useEffect(() => {
    document.title = '4SDA - Custom Remarks'
  }, [])

  const handleOpenDialog = (remark?: CustomRemark) => {
    if (remark) {
      // If editing, check if it affects students
      if (remark.studentCount && remark.studentCount > 0) {
        setEditConfirm(remark)
      } else {
        proceedToEdit(remark)
      }
    } else {
      setEditingRemark(null)
      setIsCustomCategory(false)
      setCustomCategoryName('')
      setFormData({
        label: '',
        category: 'custom',
        sortOrder: 0,
      })
      setShowDialog(true)
    }
  }

  const proceedToEdit = (remark: CustomRemark) => {
    setEditingRemark(remark)
    const isPredefinedCategory = CATEGORIES.some(c => c.value === remark.category)
    setIsCustomCategory(!isPredefinedCategory)
    setCustomCategoryName(isPredefinedCategory ? '' : remark.category)
    setFormData({
      label: remark.label,
      category: isPredefinedCategory ? remark.category : 'new',
      sortOrder: remark.sortOrder,
    })
    setShowDialog(true)
    setEditConfirm(null)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingRemark(null)
    setIsCustomCategory(false)
    setCustomCategoryName('')
    setFormData({
      label: '',
      category: 'custom',
      sortOrder: 0,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const finalCategory = isCustomCategory ? customCategoryName : formData.category

    if (editingRemark) {
      await updateMutation.mutateAsync({
        id: editingRemark.id,
        data: {
          ...formData,
          category: finalCategory,
        },
      })
    } else {
      await createMutation.mutateAsync({
        ...formData,
        category: finalCategory,
      })
    }

    handleCloseDialog()
  }

  const handleToggleActive = (remark: CustomRemark) => {
    // If remark has students and is being deactivated, show confirmation
    if (remark.isActive && remark.studentCount && remark.studentCount > 0) {
      setDeactivateConfirm(remark)
    } else {
      proceedToToggleActive(remark)
    }
  }

  const proceedToToggleActive = async (remark: CustomRemark) => {
    setTogglingRemarkId(remark.id)
    try {
      await updateMutation.mutateAsync({
        id: remark.id,
        data: { isActive: !remark.isActive },
      })
      setDeactivateConfirm(null)
    } finally {
      setTogglingRemarkId(null)
    }
  }

  const handleDelete = async () => {
    if (deleteConfirm) {
      setDeletingRemarkId(deleteConfirm.id)
      try {
        await deleteMutation.mutateAsync(deleteConfirm.id)
        setDeleteConfirm(null)
      } finally {
        setDeletingRemarkId(null)
      }
    }
  }

  const handleSeedRemarks = async () => {
    setIsSeeding(true)
    try {
      const response = await fetch('/api/custom-remarks/seed', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to seed remarks')
      }

      const result = await response.json()
      toast.success(result.message || 'Remarks seeded successfully')

      // Refresh the remarks list
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to seed remarks')
    } finally {
      setIsSeeding(false)
    }
  }

  const handleViewStudents = (remarkLabel: string) => {
    setSelectedRemarkForStudents(remarkLabel)
    setShowStudentsModal(true)
  }

  const handleCloseStudentsModal = () => {
    setShowStudentsModal(false)
    setSelectedRemarkForStudents(null)
  }

  const groupedRemarks = remarks.reduce((acc, remark) => {
    if (!acc[remark.category]) {
      acc[remark.category] = []
    }
    acc[remark.category].push(remark)
    return acc
  }, {} as Record<string, CustomRemark[]>)

  // Check if any operation is in progress
  const isAnyOperationInProgress = togglingRemarkId !== null || deletingRemarkId !== null || createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Manage Remarks</h2>
          <p className="text-muted-foreground mt-1.5">
            Manage student remark options and categories
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSeedRemarks}
            disabled={isSeeding || isAnyOperationInProgress}
          >
            {isSeeding ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Seed Predefined
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowInactive(!showInactive)}
            disabled={isAnyOperationInProgress}
          >
            {showInactive ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {showInactive ? 'Hide Inactive' : 'Show Inactive'}
          </Button>
          <Button onClick={() => handleOpenDialog()} disabled={isAnyOperationInProgress}>
            <Plus className="h-4 w-4 mr-2" />
            Add Remark
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : remarks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No remarks found. Click "Seed Predefined" to load default remarks or add your own.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedRemarks).map(([category, categoryRemarks]) => {
            const categoryInfo = CATEGORIES.find((c) => c.value === category)

            return (
              <Card key={category}>
                <CardHeader className="border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">
                      {categoryInfo?.label || category}
                    </CardTitle>
                    <Badge variant="secondary">
                      {categoryRemarks.length} {categoryRemarks.length === 1 ? 'remark' : 'remarks'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="font-semibold">Label</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold">Students</TableHead>
                        <TableHead className="font-semibold">Created By</TableHead>
                        <TableHead className="font-semibold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryRemarks.map((remark) => (
                        <TableRow key={remark.id}>
                          <TableCell className="font-medium">{remark.label}</TableCell>
                          <TableCell>
                            <Badge variant={remark.isActive ? 'default' : 'secondary'}>
                              {remark.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {remark.studentCount !== undefined && remark.studentCount > 0 ? (
                              <button
                                onClick={() => handleViewStudents(remark.label)}
                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                              >
                                {remark.studentCount}
                              </button>
                            ) : (
                              <span className="text-muted-foreground">0</span>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {remark.createdBy || 'System'}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleActive(remark)}
                                disabled={isAnyOperationInProgress}
                              >
                                {togglingRemarkId === remark.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {remark.isActive ? 'Deactivating...' : 'Activating...'}
                                  </>
                                ) : remark.isActive ? (
                                  <>
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Activate
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDialog(remark)}
                                disabled={isAnyOperationInProgress}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteConfirm(remark)}
                                disabled={isAnyOperationInProgress}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                {deletingRemarkId === remark.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingRemark ? 'Edit Remark' : 'Add Remark'}
            </DialogTitle>
            <DialogDescription>
              {editingRemark
                ? 'Update the remark details.'
                : 'Create a new remark that can be used for students.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="label">Label *</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                placeholder="e.g., Pending SF9"
                required
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="customCategoryToggle"
                  checked={isCustomCategory}
                  onChange={(e) => setIsCustomCategory(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="customCategoryToggle" className="font-normal cursor-pointer">
                  Create new category
                </Label>
              </div>

              {isCustomCategory ? (
                <div>
                  <Label htmlFor="customCategory">Custom Category Name *</Label>
                  <Input
                    id="customCategory"
                    value={customCategoryName}
                    onChange={(e) => setCustomCategoryName(e.target.value)}
                    placeholder="e.g., Health-Related"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter a unique category name
                  </p>
                </div>
              ) : (
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                id="sortOrder"
                type="number"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Lower numbers appear first
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingRemark ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Remark?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                {deleteConfirm?.studentCount && deleteConfirm.studentCount > 0 ? (
                  <>
                    <div className="text-base font-semibold text-red-600">
                      This will affect{' '}
                      <span className="font-bold">{deleteConfirm.studentCount}</span> student
                      {deleteConfirm.studentCount !== 1 ? 's' : ''} who currently have this remark.
                    </div>
                    <div>
                      This will remove the remark from all affected student records.
                    </div>
                    <div className="font-medium">
                      Are you sure you want to delete "{deleteConfirm?.label}"?
                    </div>
                    <div className="text-sm">
                      If you change your mind, you can restore this remark within 30 days by going to the Recycle Bin.
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-medium">
                      Are you sure you want to delete "{deleteConfirm?.label}"?
                    </div>
                    <div className="text-sm">
                      If you change your mind, you can restore this remark within 30 days by going to the Recycle Bin.
                    </div>
                  </>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingRemarkId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deletingRemarkId !== null}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deletingRemarkId !== null && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={!!deactivateConfirm} onOpenChange={() => setDeactivateConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Remark?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div className="text-base font-semibold text-orange-600">
                  This will affect{' '}
                  <span className="font-bold">{deactivateConfirm?.studentCount}</span> student
                  {deactivateConfirm?.studentCount !== 1 ? 's' : ''} who currently have this remark.
                </div>
                <div>
                  This will <span className="font-semibold">not delete</span> the remark, only hide it from selection.
                  When activated again, the remark will still show on affected students.
                </div>
                <div className="font-medium">
                  Are you sure you want to deactivate "{deactivateConfirm?.label}"?
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={togglingRemarkId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deactivateConfirm && proceedToToggleActive(deactivateConfirm)}
              disabled={togglingRemarkId !== null}
            >
              {togglingRemarkId !== null && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Confirmation Dialog */}
      <AlertDialog open={!!editConfirm} onOpenChange={() => setEditConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Remark?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <div className="text-base font-semibold text-orange-600">
                  This will affect{' '}
                  <span className="font-bold">{editConfirm?.studentCount}</span> student
                  {editConfirm?.studentCount !== 1 ? 's' : ''} who currently have this remark.
                </div>
                <div>
                  Editing this remark will change it on all affected student records.
                </div>
                <div className="font-medium">
                  Are you sure you want to continue editing "{editConfirm?.label}"?
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => editConfirm && proceedToEdit(editConfirm)}
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Students Modal */}
      <Dialog open={showStudentsModal} onOpenChange={handleCloseStudentsModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Students with "{selectedRemarkForStudents}"</DialogTitle>
            <DialogDescription>
              {studentsWithRemark.length} student{studentsWithRemark.length !== 1 ? 's' : ''} found
            </DialogDescription>
          </DialogHeader>

          {isLoadingStudents ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : studentsWithRemark.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No students found with this remark.
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>LRN</TableHead>
                    <TableHead>Grade Level</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentsWithRemark.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.lrn}</TableCell>
                      <TableCell>{student.gradeLevel}</TableCell>
                      <TableCell>{student.section}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/dashboard/students/${student.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseStudentsModal}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
