import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

const FEES_QUERY_KEY = 'fees'
const PAYMENTS_QUERY_KEY = 'payments'
const PAYMENT_HISTORY_QUERY_KEY = 'payment-history'

// Fee Templates
export function useFeeTemplates(filters: {
  gradeLevel?: string
  academicYearId?: string
  search?: string
  category?: string
} = {}) {
  return useQuery({
    queryKey: [FEES_QUERY_KEY, 'templates', filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.gradeLevel) params.append('gradeLevel', filters.gradeLevel)
      if (filters.academicYearId) params.append('academicYearId', filters.academicYearId)
      if (filters.search) params.append('search', filters.search)
      if (filters.category) params.append('category', filters.category)

      const response = await fetch(`/api/fees/templates?${params.toString()}`, {
        cache: 'no-store', // Don't cache API responses
      })
      if (!response.ok) throw new Error('Failed to fetch fee templates')
      return response.json()
    },
    staleTime: 0, // Always consider data stale
    refetchOnMount: true, // Refetch when component mounts
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData,
  })
}

export function useFeeTemplate(id: string) {
  return useQuery({
    queryKey: [FEES_QUERY_KEY, 'templates', id],
    queryFn: async () => {
      const response = await fetch(`/api/fees/templates/${id}`, {
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('Failed to fetch fee template')
      return response.json()
    },
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  })
}

export function useCreateFeeTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/fees/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create fee template')
      }

      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [FEES_QUERY_KEY, 'templates'] })
      await queryClient.refetchQueries({ queryKey: [FEES_QUERY_KEY, 'templates'] })
      toast.success('Fee template created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateFeeTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/fees/templates/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update fee template')
      }

      return response.json()
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [FEES_QUERY_KEY, 'templates'] }),
        queryClient.invalidateQueries({ queryKey: [FEES_QUERY_KEY, 'templates', variables.id] })
      ])
      await queryClient.refetchQueries({ queryKey: [FEES_QUERY_KEY, 'templates'] })
      toast.success('Fee template updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteFeeTemplate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/fees/templates/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete fee template')
      }

      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [FEES_QUERY_KEY, 'templates'] })
      await queryClient.refetchQueries({ queryKey: [FEES_QUERY_KEY, 'templates'] })
      toast.success('Fee template deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// Student Fee Status
export function useStudentFeeStatus(
  studentId: string,
  academicYearId: string,
  filters?: {
    search?: string
    paymentMethod?: string
    dateFrom?: string
    dateTo?: string
  }
) {
  return useQuery({
    queryKey: [FEES_QUERY_KEY, 'status', studentId, academicYearId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ academicYearId })
      if (filters?.search) params.append('search', filters.search)
      if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod)
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters?.dateTo) params.append('dateTo', filters.dateTo)

      const response = await fetch(
        `/api/students/${studentId}/fee-status?${params.toString()}`,
        {
          cache: 'no-store',
        }
      )
      if (!response.ok) throw new Error('Failed to fetch fee status')
      return response.json()
    },
    enabled: !!studentId && !!academicYearId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData,
  })
}

export function useUpdateLatePaymentStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      studentId,
      academicYearId,
      isLatePayment,
      lateSince,
    }: {
      studentId: string
      academicYearId: string
      isLatePayment: boolean
      lateSince?: string | null
    }) => {
      const response = await fetch(
        `/api/students/${studentId}/fee-status?academicYearId=${academicYearId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isLatePayment, lateSince }),
        }
      )

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update late payment status')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [FEES_QUERY_KEY, 'status', variables.studentId, variables.academicYearId],
      })
      toast.success('Late payment status updated')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// Payments
export function useStudentPayments(
  studentId: string,
  academicYearId?: string,
  filters?: {
    search?: string
    paymentMethod?: string
  }
) {
  return useQuery({
    queryKey: [PAYMENTS_QUERY_KEY, studentId, academicYearId, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (academicYearId) params.append('academicYearId', academicYearId)
      if (filters?.search) params.append('search', filters.search)
      if (filters?.paymentMethod) params.append('paymentMethod', filters.paymentMethod)

      const response = await fetch(`/api/students/${studentId}/payments?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch payments')
      return response.json()
    },
    enabled: !!studentId,
    staleTime: 30 * 1000,
  })
}

export function useRecordPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      studentId,
      data,
    }: {
      studentId: string
      data: {
        academicYearId: string
        amountPaid: number
        paymentDate?: string
        paymentMethod: string
        referenceNumber?: string
        remarks?: string
      }
    }) => {
      const response = await fetch(`/api/students/${studentId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to record payment')
      }

      return response.json()
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [PAYMENTS_QUERY_KEY, variables.studentId] }),
        queryClient.invalidateQueries({
          queryKey: [FEES_QUERY_KEY, 'status', variables.studentId],
        }),
        queryClient.invalidateQueries({ queryKey: ['students'] })
      ])
      await queryClient.refetchQueries({
        queryKey: [FEES_QUERY_KEY, 'status', variables.studentId],
      })
      toast.success('Payment recorded successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useRefundPayment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      studentId,
      data,
    }: {
      studentId: string
      data: {
        paymentId: string
        refundAmount: number
        refundReason: string
      }
    }) => {
      const response = await fetch(`/api/students/${studentId}/payments`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process refund')
      }

      return response.json()
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [PAYMENTS_QUERY_KEY, variables.studentId] }),
        queryClient.invalidateQueries({
          queryKey: [FEES_QUERY_KEY, 'status', variables.studentId],
        }),
        queryClient.invalidateQueries({ queryKey: ['students'] })
      ])
      await queryClient.refetchQueries({
        queryKey: [FEES_QUERY_KEY, 'status', variables.studentId],
      })
      toast.success('Refund processed successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdatePaymentRemarks() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      studentId,
      paymentId,
      remarks,
    }: {
      studentId: string
      paymentId: string
      remarks: string | null
    }) => {
      const response = await fetch(`/api/students/${studentId}/payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ remarks }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update payment remarks')
      }

      return response.json()
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [PAYMENTS_QUERY_KEY, variables.studentId] }),
        queryClient.invalidateQueries({
          queryKey: [FEES_QUERY_KEY, 'status', variables.studentId],
        }),
      ])
      await queryClient.refetchQueries({
        queryKey: [FEES_QUERY_KEY, 'status', variables.studentId],
      })
      toast.success('Payment remarks updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// Payment Adjustments
export function useStudentAdjustments(studentId: string, academicYearId?: string) {
  return useQuery({
    queryKey: [FEES_QUERY_KEY, 'adjustments', studentId, academicYearId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (academicYearId) params.append('academicYearId', academicYearId)

      const response = await fetch(`/api/students/${studentId}/adjustments?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch adjustments')
      return response.json()
    },
    enabled: !!studentId,
    staleTime: 30 * 1000,
  })
}

export function useCreateAdjustment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      studentId,
      data,
    }: {
      studentId: string
      data: {
        academicYearId: string
        type: 'DISCOUNT' | 'ADDITIONAL'
        amount: number
        reason: string
        description?: string
      }
    }) => {
      const response = await fetch(`/api/students/${studentId}/adjustments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create adjustment')
      }

      return response.json()
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [FEES_QUERY_KEY, 'adjustments', variables.studentId],
        }),
        queryClient.invalidateQueries({
          queryKey: [FEES_QUERY_KEY, 'status', variables.studentId],
        }),
        queryClient.invalidateQueries({ queryKey: ['students'] })
      ])
      await queryClient.refetchQueries({
        queryKey: [FEES_QUERY_KEY, 'status', variables.studentId],
      })
      toast.success('Adjustment created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// Payment History (All Students)
export function usePaymentHistory(filters: {
  academicYearId?: string
  paymentStatus?: string
  gradeLevel?: string
} = {}) {
  return useQuery({
    queryKey: [PAYMENT_HISTORY_QUERY_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.academicYearId) params.append('academicYearId', filters.academicYearId)
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus)
      if (filters.gradeLevel) params.append('gradeLevel', filters.gradeLevel)

      const response = await fetch(`/api/payment-history?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch payment history')
      return response.json()
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  })
}

// Optional Fees
const OPTIONAL_FEES_QUERY_KEY = 'optional-fees'

export function useOptionalFees(filters: {
  academicYearId?: string
  gradeLevel?: string
  category?: string
  isActive?: boolean
  search?: string
} = {}) {
  return useQuery({
    queryKey: [OPTIONAL_FEES_QUERY_KEY, filters],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (filters.academicYearId) params.append('academicYearId', filters.academicYearId)
      if (filters.gradeLevel) params.append('gradeLevel', filters.gradeLevel)
      if (filters.category) params.append('category', filters.category)
      if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString())
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/fees/optional?${params.toString()}`, {
        cache: 'no-store',
      })
      if (!response.ok) throw new Error('Failed to fetch optional fees')
      return response.json()
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData,
  })
}

export function useStudentOptionalFees(studentId: string, academicYearId?: string) {
  return useQuery({
    queryKey: [OPTIONAL_FEES_QUERY_KEY, 'student', studentId, academicYearId],
    queryFn: async () => {
      const params = new URLSearchParams()
      if (academicYearId) params.append('academicYearId', academicYearId)

      const response = await fetch(`/api/students/${studentId}/optional-fees?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch student optional fees')
      return response.json()
    },
    enabled: !!studentId,
    staleTime: 30 * 1000,
  })
}

export function useAssignOptionalFee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      studentId,
      data,
    }: {
      studentId: string
      data: {
        optionalFeeId: string
        academicYearId: string
        selectedVariationId?: string
        amount: number
      }
    }) => {
      const response = await fetch(`/api/students/${studentId}/optional-fees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to assign optional fee')
      }

      return response.json()
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [OPTIONAL_FEES_QUERY_KEY, 'student', variables.studentId]
        }),
        queryClient.invalidateQueries({
          queryKey: [FEES_QUERY_KEY, 'status', variables.studentId],
        }),
      ])
      await queryClient.refetchQueries({
        queryKey: [OPTIONAL_FEES_QUERY_KEY, 'student', variables.studentId],
      })
      toast.success('Optional fee assigned successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useRemoveOptionalFee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      studentId,
      optionalFeeId,
      academicYearId,
    }: {
      studentId: string
      optionalFeeId: string
      academicYearId: string
    }) => {
      const params = new URLSearchParams()
      params.append('optionalFeeId', optionalFeeId)
      params.append('academicYearId', academicYearId)

      const response = await fetch(`/api/students/${studentId}/optional-fees?${params.toString()}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove optional fee')
      }

      return response.json()
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [OPTIONAL_FEES_QUERY_KEY, 'student', variables.studentId]
        }),
        queryClient.invalidateQueries({
          queryKey: [FEES_QUERY_KEY, 'status', variables.studentId],
        }),
      ])
      await queryClient.refetchQueries({
        queryKey: [OPTIONAL_FEES_QUERY_KEY, 'student', variables.studentId],
      })
      toast.success('Optional fee removed successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

// Admin-level Optional Fee Management
export function useCreateOptionalFee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/fees/optional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create optional fee')
      }

      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [OPTIONAL_FEES_QUERY_KEY] })
      await queryClient.refetchQueries({ queryKey: [OPTIONAL_FEES_QUERY_KEY] })
      toast.success('Optional fee created successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateOptionalFee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/fees/optional/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update optional fee')
      }

      return response.json()
    },
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: [OPTIONAL_FEES_QUERY_KEY] }),
        queryClient.invalidateQueries({ queryKey: [OPTIONAL_FEES_QUERY_KEY, variables.id] })
      ])
      await queryClient.refetchQueries({ queryKey: [OPTIONAL_FEES_QUERY_KEY] })
      toast.success('Optional fee updated successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteOptionalFee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/fees/optional/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete optional fee')
      }

      return response.json()
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [OPTIONAL_FEES_QUERY_KEY] })
      await queryClient.refetchQueries({ queryKey: [OPTIONAL_FEES_QUERY_KEY] })
      toast.success('Optional fee deleted successfully')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })
}
