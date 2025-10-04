'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Trash2, RotateCcw, Search, Filter, RefreshCw } from 'lucide-react'
import {
  useRecycleBinItems,
  useRestoreItem,
  usePermanentlyDeleteItem,
  useCleanupExpired,
  type RecycleBinItem,
} from '@/hooks/use-recycle-bin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function RecycleBinPage() {
  const [entityType, setEntityType] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<RecycleBinItem | null>(null)
  const [restoringItemId, setRestoringItemId] = useState<string | null>(null)
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null)

  const { data: items = [], isLoading, isFetching, refetch } = useRecycleBinItems({ entityType, search })
  const restoreMutation = useRestoreItem()
  const deleteMutation = usePermanentlyDeleteItem()
  const cleanupMutation = useCleanupExpired()

  const isAnyOperationInProgress =
    restoringItemId !== null ||
    deletingItemId !== null ||
    cleanupMutation.isPending

  const handleRefresh = () => {
    refetch()
  }

  const handleRestoreClick = (item: RecycleBinItem) => {
    setSelectedItem(item)
    setRestoreDialogOpen(true)
  }

  const handleDeleteClick = (item: RecycleBinItem) => {
    setSelectedItem(item)
    setDeleteDialogOpen(true)
  }

  const handleRestoreConfirm = async () => {
    if (!selectedItem) return

    setRestoringItemId(selectedItem.id)
    try {
      await restoreMutation.mutateAsync(selectedItem.id)
      setRestoreDialogOpen(false)
      setSelectedItem(null)
    } finally {
      setRestoringItemId(null)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return

    setDeletingItemId(selectedItem.id)
    try {
      await deleteMutation.mutateAsync(selectedItem.id)
      setDeleteDialogOpen(false)
      setSelectedItem(null)
    } finally {
      setDeletingItemId(null)
    }
  }

  const handleCleanupExpired = async () => {
    await cleanupMutation.mutateAsync()
  }

  const getEntityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      student: 'Student',
      section: 'Section',
      academicYear: 'Academic Year',
      feeTemplate: 'Fee Template',
      customRemark: 'Custom Remark',
    }
    return labels[type] || type
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recycle Bin</h1>
          <p className="text-muted-foreground mt-1">
            Deleted items are kept for 30 days before permanent deletion
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={isAnyOperationInProgress || isFetching}
            variant="outline"
            size="icon"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            onClick={handleCleanupExpired}
            disabled={isAnyOperationInProgress}
            variant="outline"
          >
            {cleanupMutation.isPending ? 'Cleaning up...' : 'Cleanup Expired Items'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Filter and search deleted items</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-64">
              <Select value={entityType} onValueChange={setEntityType}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="section">Sections</SelectItem>
                  <SelectItem value="academicYear">Academic Years</SelectItem>
                  <SelectItem value="feeTemplate">Fee Templates</SelectItem>
                  <SelectItem value="customRemark">Custom Remarks</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Deleted Items {isLoading ? '(...)' : `(${items.length})`}
            {isFetching && !isLoading && (
              <span className="ml-2 text-sm text-muted-foreground">(refreshing...)</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Deleted At</TableHead>
                    <TableHead>Permanent Delete On</TableHead>
                    <TableHead>Deleted By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-36" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-24" />
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trash2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No deleted items found</p>
              <p className="text-sm">Items you delete will appear here for 30 days</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Deleted At</TableHead>
                    <TableHead>Permanent Delete On</TableHead>
                    <TableHead>Deleted By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.entityName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-secondary">
                          {getEntityTypeLabel(item.entityType)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.deletedAt), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.permanentDeleteAt), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{item.deletedBy || 'System'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRestoreClick(item)}
                            disabled={isAnyOperationInProgress}
                          >
                            {restoringItemId === item.id ? (
                              <>Restoring...</>
                            ) : (
                              <>
                                <RotateCcw className="h-4 w-4 mr-1" />
                                Restore
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteClick(item)}
                            disabled={isAnyOperationInProgress}
                          >
                            {deletingItemId === item.id ? (
                              <>Deleting...</>
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-1" />
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Restore Confirmation Dialog */}
      <AlertDialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Item</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  Are you sure you want to restore{' '}
                  <span className="font-semibold">{selectedItem?.entityName}</span>?
                </p>
                <p className="mt-2">
                  This will move the item back to its original location and remove it from
                  the recycle bin.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoringItemId !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRestoreConfirm}
              disabled={restoringItemId !== null}
            >
              {restoringItemId !== null ? 'Restoring...' : 'Restore'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Item</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  Are you sure you want to permanently delete{' '}
                  <span className="font-semibold">{selectedItem?.entityName}</span>?
                </p>
                <p className="mt-2 text-destructive font-semibold">
                  This action cannot be undone. The item will be permanently deleted and
                  cannot be recovered.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingItemId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deletingItemId !== null}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingItemId !== null ? 'Deleting...' : 'Delete Permanently'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
