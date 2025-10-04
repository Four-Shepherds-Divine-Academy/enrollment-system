'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export type RecycleBinItem = {
  id: string
  entityType: string
  entityId: string
  entityData: any
  entityName: string
  deletedBy: string | null
  deletedAt: string
  permanentDeleteAt: string
  createdAt: string
  updatedAt: string
}

export type RecycleBinFilters = {
  entityType?: string
  search?: string
}

// Fetch recycle bin items with filters
export function useRecycleBinItems(filters?: RecycleBinFilters) {
  return useQuery<RecycleBinItem[]>({
    queryKey: ['recycle-bin', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters?.entityType && filters.entityType !== 'all') {
        params.append('entityType', filters.entityType)
      }
      if (filters?.search) {
        params.append('search', filters.search)
      }

      const url = `/api/recycle-bin${params.toString() ? `?${params.toString()}` : ''}`
      const res = await fetch(url, {
        cache: 'no-store', // Don't cache API responses
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch recycle bin items')
      }
      return res.json()
    },
    staleTime: 0, // Always consider data stale
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gains focus
  })
}

// Restore item from recycle bin
export function useRestoreItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/recycle-bin/${id}`, {
        method: 'PATCH',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to restore item')
      }
      return res.json()
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['recycle-bin'] })

      // Snapshot the previous value
      const previousItems = queryClient.getQueriesData({ queryKey: ['recycle-bin'] })

      // Optimistically update to remove the item
      queryClient.setQueriesData({ queryKey: ['recycle-bin'] }, (old: RecycleBinItem[] | undefined) => {
        if (!old) return []
        return old.filter((item) => item.id !== id)
      })

      return { previousItems }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['recycle-bin'] })
      // Invalidate other queries that might be affected
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['sections'] })
      queryClient.invalidateQueries({ queryKey: ['academic-years'] })
      queryClient.invalidateQueries({ queryKey: ['fee-templates'] })
      queryClient.invalidateQueries({ queryKey: ['custom-remarks'] })
      toast.success('Item restored successfully')
    },
    onError: (error, id, context) => {
      // Rollback on error
      if (context?.previousItems) {
        context.previousItems.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast.error(error instanceof Error ? error.message : 'Failed to restore item')
    },
  })
}

// Permanently delete item from recycle bin
export function usePermanentlyDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/recycle-bin/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to permanently delete item')
      }
      return res.json()
    },
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['recycle-bin'] })

      // Snapshot the previous value
      const previousItems = queryClient.getQueriesData({ queryKey: ['recycle-bin'] })

      // Optimistically update to remove the item
      queryClient.setQueriesData({ queryKey: ['recycle-bin'] }, (old: RecycleBinItem[] | undefined) => {
        if (!old) return []
        return old.filter((item) => item.id !== id)
      })

      return { previousItems }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recycle-bin'] })
      toast.success('Item permanently deleted')
    },
    onError: (error, id, context) => {
      // Rollback on error
      if (context?.previousItems) {
        context.previousItems.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
      toast.error(error instanceof Error ? error.message : 'Failed to permanently delete item')
    },
  })
}

// Cleanup expired items (past 30 days)
export function useCleanupExpired() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/recycle-bin', {
        method: 'POST',
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to cleanup expired items')
      }
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['recycle-bin'] })
      toast.success(data.message || 'Expired items cleaned up successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to cleanup expired items')
    },
  })
}
