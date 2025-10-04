import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

export type CustomRemark = {
  id: string
  label: string
  category: string
  isActive: boolean
  sortOrder: number
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
  studentCount?: number
}

export type StudentWithRemark = {
  id: string
  name: string
  lrn: string
  gradeLevel: string
  section: string
}

export type CreateCustomRemarkInput = {
  label: string
  category: string
  sortOrder?: number
}

export type UpdateCustomRemarkInput = {
  label?: string
  category?: string
  isActive?: boolean
  sortOrder?: number
}

// Fetch all custom remarks
export function useCustomRemarks(activeOnly = true) {
  return useQuery<CustomRemark[]>({
    queryKey: ['custom-remarks', { activeOnly }],
    queryFn: async () => {
      const response = await fetch(`/api/custom-remarks?activeOnly=${activeOnly}`)
      if (!response.ok) {
        throw new Error('Failed to fetch custom remarks')
      }
      return response.json()
    },
  })
}

// Create custom remark
export function useCreateCustomRemark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateCustomRemarkInput) => {
      const response = await fetch('/api/custom-remarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create custom remark')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-remarks'] })
      toast.success('Custom remark created successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    },
  })
}

// Update custom remark
export function useUpdateCustomRemark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCustomRemarkInput }) => {
      const response = await fetch(`/api/custom-remarks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update custom remark')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-remarks'] })
      toast.success('Custom remark updated successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    },
  })
}

// Delete custom remark
export function useDeleteCustomRemark() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/custom-remarks/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete custom remark')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-remarks'] })
      toast.success('Custom remark deleted successfully')
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    },
  })
}

// Fetch students with a specific remark
export function useStudentsByRemark(remarkLabel: string | null) {
  return useQuery<StudentWithRemark[]>({
    queryKey: ['students-by-remark', remarkLabel],
    queryFn: async () => {
      if (!remarkLabel) return []

      const response = await fetch(`/api/custom-remarks/students?label=${encodeURIComponent(remarkLabel)}`)
      if (!response.ok) {
        throw new Error('Failed to fetch students')
      }
      return response.json()
    },
    enabled: !!remarkLabel,
  })
}
