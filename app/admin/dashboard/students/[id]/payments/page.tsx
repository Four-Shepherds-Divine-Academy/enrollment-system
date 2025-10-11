'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import {
  ArrowLeft,
  DollarSign,
  Plus,
  Minus,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  X,
  Calendar,
  Pencil,
  FileDown,
  Trash2,
  Edit,
  Check,
  Eye,
} from 'lucide-react'
import { useActiveAcademicYear } from '@/hooks/use-academic-years'
import {
  useStudentFeeStatus,
  useRecordPayment,
  useRefundPayment,
  useCreateAdjustment,
  useUpdateLatePaymentStatus,
  useUpdatePaymentRemarks,
  useOptionalFees,
  useStudentOptionalFees,
  useAssignOptionalFee,
  useRemoveOptionalFee,
} from '@/hooks/use-fees'
import { useQueryClient } from '@tanstack/react-query'
import { useStudent } from '@/hooks/use-students'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { exportStudentPaymentHistory } from '@/lib/pdf-export'

export default function StudentPaymentsPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string
  const queryClient = useQueryClient()

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [editRemarksDialogOpen, setEditRemarksDialogOpen] = useState(false)
  const [optionalFeeDialogOpen, setOptionalFeeDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [selectedOptionalFees, setSelectedOptionalFees] = useState<Record<string, { selected: boolean; variationId?: string; quantity: number }>>({})
  const [assigningFees, setAssigningFees] = useState(false)
  const [editingOptionalFeeId, setEditingOptionalFeeId] = useState<string | null>(null)
  const [editQuantity, setEditQuantity] = useState(1)
  const [deletingOptionalFeeId, setDeletingOptionalFeeId] = useState<string | null>(null)
  const [savingOptionalFeeId, setSavingOptionalFeeId] = useState<string | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [feeToDelete, setFeeToDelete] = useState<any>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [paymentRemarks, setPaymentRemarks] = useState('')
  const [feeItemSearch, setFeeItemSearch] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<'DISCOUNT' | 'ADDITIONAL'>('DISCOUNT')
  const [adjustmentAmount, setAdjustmentAmount] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [adjustmentDescription, setAdjustmentDescription] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [selectedLineItems, setSelectedLineItems] = useState<Record<string, number>>({}) // feeBreakdownId -> amount
  const [optionalFeeQuantities, setOptionalFeeQuantities] = useState<Record<string, number>>({}) // optionalFeeId -> quantity
  const [editRemarks, setEditRemarks] = useState('')

  // Error states
  const [paymentError, setPaymentError] = useState('')
  const [refundError, setRefundError] = useState('')
  const [adjustmentError, setAdjustmentError] = useState('')

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all')
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('all') // all, payments, refunds
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const { data: activeYear } = useActiveAcademicYear()
  const { data: student } = useStudent(studentId)
  const { data: feeStatus, isLoading, isFetching } = useStudentFeeStatus(
    studentId,
    activeYear?.id || '',
    {
      search: debouncedSearch,
      paymentMethod: paymentMethodFilter !== 'all' ? paymentMethodFilter : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }
  )

  // Set page title
  useEffect(() => {
    document.title = '4SDA - Student Payments'
  }, [])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const recordPaymentMutation = useRecordPayment()
  const refundPaymentMutation = useRefundPayment()
  const createAdjustmentMutation = useCreateAdjustment()
  const updateLateMutation = useUpdateLatePaymentStatus()
  const updateRemarksMutation = useUpdatePaymentRemarks()

  // Optional fees
  const { data: optionalFees = [] } = useOptionalFees({
    academicYearId: activeYear?.id,
    gradeLevel: student?.gradeLevel,
    isActive: true,
  })
  const { data: studentOptionalFees = [] } = useStudentOptionalFees(studentId, activeYear?.id)
  const assignOptionalFeeMutation = useAssignOptionalFee()
  const removeOptionalFeeMutation = useRemoveOptionalFee()

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return debouncedSearch ||
           paymentMethodFilter !== 'all' ||
           transactionTypeFilter !== 'all' ||
           dateFrom ||
           dateTo
  }, [debouncedSearch, paymentMethodFilter, transactionTypeFilter, dateFrom, dateTo])

  // Filter payments based on transaction type (client-side)
  const filteredPayments = useMemo(() => {
    if (!feeStatus?.payments) return []

    return feeStatus.payments.map((payment: any) => {
      if (transactionTypeFilter === 'payments') {
        // Return payment without refunds
        return { ...payment, refunds: [] }
      } else if (transactionTypeFilter === 'refunds') {
        // Return only refunds
        return { ...payment, amountPaid: 0 }
      } else if (transactionTypeFilter === 'net') {
        // Mark as net-only view
        return { ...payment, showNetOnly: true }
      }
      // Return everything
      return payment
    }).filter((payment: any) => {
      // Filter out payments with no data
      if (transactionTypeFilter === 'refunds') {
        return payment.refunds && payment.refunds.length > 0
      }
      return true
    })
  }, [feeStatus?.payments, transactionTypeFilter])

  // Format number with commas
  const formatNumberInput = (value: string): string => {
    // Remove all non-digit characters
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    // Add commas
    return parseInt(digits, 10).toLocaleString('en-US')
  }

  // Parse formatted number back to number
  const parseFormattedNumber = (value: string): number => {
    return parseFloat(value.replace(/,/g, '')) || 0
  }

  const toggleLineItem = (feeBreakdownId: string, amount: number, isOptional: boolean = false, unitPrice: number = 0, maxQuantity: number = 1) => {
    setSelectedLineItems(prev => {
      const newItems = { ...prev }
      const key = isOptional ? `optional-${feeBreakdownId}` : feeBreakdownId
      if (newItems[key]) {
        delete newItems[key]
        // Also remove quantity tracking for optional fees
        if (isOptional) {
          setOptionalFeeQuantities(prevQty => {
            const newQty = { ...prevQty }
            delete newQty[feeBreakdownId]
            return newQty
          })
        }
      } else {
        // For optional fees, use max quantity * unit price as default
        const defaultAmount = isOptional ? unitPrice * maxQuantity : amount
        newItems[key] = defaultAmount
        // Initialize quantity for optional fees (default to max quantity)
        if (isOptional) {
          setOptionalFeeQuantities(prevQty => ({
            ...prevQty,
            [feeBreakdownId]: maxQuantity
          }))
        }
      }
      return newItems
    })
  }

  const updateOptionalFeeQuantity = (feeId: string, quantity: number, unitPrice: number, maxQuantity: number) => {
    const clampedQuantity = Math.max(1, Math.min(quantity, maxQuantity))
    setOptionalFeeQuantities(prev => ({
      ...prev,
      [feeId]: clampedQuantity
    }))
    // Update the amount based on quantity
    const key = `optional-${feeId}`
    setSelectedLineItems(prev => ({
      ...prev,
      [key]: unitPrice * clampedQuantity
    }))
  }

  const updateLineItemAmount = (feeBreakdownId: string, amount: number, isOptional: boolean = false) => {
    const key = isOptional ? `optional-${feeBreakdownId}` : feeBreakdownId

    // For base fee breakdowns, validate against remaining balance
    if (!isOptional) {
      const breakdown = feeStatus?.feeTemplate?.breakdowns?.find((b: any) => b.id === feeBreakdownId)
      if (breakdown) {
        const paidAmount = paidByBreakdown[feeBreakdownId] || 0
        const remainingBalance = breakdown.amount - paidAmount
        // Cap the amount at remaining balance
        amount = Math.min(amount, remainingBalance)
      }
    }

    setSelectedLineItems(prev => ({
      ...prev,
      [key]: amount
    }))
  }

  const calculateSelectedTotal = () => {
    return Object.values(selectedLineItems).reduce((sum, amount) => sum + amount, 0)
  }

  // Calculate how much has been paid for each fee breakdown
  const calculatePaidAmountByBreakdown = () => {
    const paidAmounts: Record<string, number> = {}

    if (!feeStatus?.payments) return paidAmounts

    // Iterate through all payments
    feeStatus.payments.forEach((payment: any) => {
      if (payment.lineItems && payment.lineItems.length > 0) {
        // Payment has line items - track exact amounts paid per breakdown
        payment.lineItems.forEach((lineItem: any) => {
          const breakdownId = lineItem.feeBreakdownId
          if (!paidAmounts[breakdownId]) {
            paidAmounts[breakdownId] = 0
          }
          paidAmounts[breakdownId] += lineItem.amount
        })
      }
    })

    // Subtract refunds
    feeStatus.payments.forEach((payment: any) => {
      if (payment.refunds && payment.refunds.length > 0) {
        payment.refunds.forEach((refund: any) => {
          // For refunds, we need to proportionally reduce paid amounts
          // This is a simplified approach - deduct refund from paid items proportionally
          if (payment.lineItems && payment.lineItems.length > 0) {
            const totalPaid = payment.lineItems.reduce((sum: number, item: any) => sum + item.amount, 0)
            payment.lineItems.forEach((lineItem: any) => {
              const breakdownId = lineItem.feeBreakdownId
              const proportion = lineItem.amount / totalPaid
              const refundAmount = refund.amount * proportion
              if (paidAmounts[breakdownId]) {
                paidAmounts[breakdownId] -= refundAmount
              }
            })
          }
        })
      }
    })

    return paidAmounts
  }

  const paidByBreakdown = useMemo(() => calculatePaidAmountByBreakdown(), [feeStatus?.payments])

  const generateReferenceNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase()
    const studentPrefix = studentId.substring(0, 6).toUpperCase()
    const random = Math.random().toString(36).substring(2, 4).toUpperCase()
    return `PAY-${studentPrefix}-${timestamp}-${random}`
  }

  const handleExportPDF = () => {
    if (!student || !feeStatus) return

    try {
      exportStudentPaymentHistory(
        {
          fullName: student.fullName,
          lrn: student.lrn,
          gradeLevel: student.gradeLevel,
          section: student.section?.name || null,
        },
        feeStatus,
        feeStatus.payments || [],
        feeStatus.adjustments || []
      )

      toast.success('PDF Exported', {
        description: 'Payment history has been exported successfully.',
      })
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Export Failed', {
        description: 'Failed to export payment history to PDF.',
      })
    }
  }

  const handleRecordPayment = async () => {
    if (!activeYear) return

    // Clear previous errors
    setPaymentError('')

    // Separate optional fees from base fees
    const optionalFeePayments: Array<{ id: string; amount: number }> = []
    const baseLineItems: Array<{ feeBreakdownId: string; amount: number }> = []

    Object.entries(selectedLineItems).forEach(([key, amount]) => {
      if (key.startsWith('optional-')) {
        const optionalFeeId = key.replace('optional-', '')
        optionalFeePayments.push({ id: optionalFeeId, amount })
      } else {
        baseLineItems.push({ feeBreakdownId: key, amount })
      }
    })

    const amount = Object.keys(selectedLineItems).length > 0 ? calculateSelectedTotal() : parseFormattedNumber(paymentAmount)

    // Validate payment amount
    if (amount <= 0) {
      setPaymentError("Payment amount must be greater than zero")
      toast.error("Invalid Amount", {
        description: "Payment amount must be greater than zero.",
      })
      return
    }

    if (feeStatus && amount > adjustedBalance) {
      setPaymentError(`Payment amount cannot exceed the remaining balance of ${formatCurrency(adjustedBalance)}`)
      toast.error("Amount Exceeds Balance", {
        description: `Payment amount cannot exceed the remaining balance of ${formatCurrency(adjustedBalance)}.`,
      })
      return
    }

    // Auto-generate reference number if not provided
    const finalReferenceNumber = referenceNumber || generateReferenceNumber()

    try {
      await recordPaymentMutation.mutateAsync({
        studentId,
        data: {
          academicYearId: activeYear.id,
          amountPaid: amount,
          paymentMethod,
          referenceNumber: finalReferenceNumber,
          remarks: paymentRemarks || undefined,
          lineItems: baseLineItems.length > 0 ? baseLineItems : undefined,
        },
      })

      // Mark optional fees as paid (or partially paid)
      if (optionalFeePayments.length > 0) {
        for (const optionalFeePayment of optionalFeePayments) {
          try {
            await fetch(`/api/students/${studentId}/optional-fees/${optionalFeePayment.id}/pay`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                academicYearId: activeYear.id,
                amountPaid: optionalFeePayment.amount
              }),
            })
          } catch (error) {
            console.error(`Error processing optional fee payment ${optionalFeePayment.id}:`, error)
          }
        }

        // Invalidate optional fees cache to reflect payment status
        await queryClient.invalidateQueries({
          queryKey: ['optional-fees', 'student', studentId]
        })
      }

      toast.success("Payment Recorded Successfully", {
        description: `Payment of ${formatCurrency(amount)} has been processed.`,
      })

      setPaymentDialogOpen(false)
      setPaymentAmount('')
      setReferenceNumber('')
      setPaymentRemarks('')
      setSelectedLineItems({})
      setOptionalFeeQuantities({})
      setFeeItemSearch('')
      setPaymentError('')
    } catch (error) {
      setPaymentError("There was an error recording the payment")
      toast.error("Payment Failed", {
        description: "There was an error recording the payment. Please try again.",
      })
    }
  }

  const handlePayFullBalance = () => {
    if (adjustedBalance > 0) {
      setPaymentAmount(formatNumberInput(adjustedBalance.toString()))
      setPaymentDialogOpen(true)
    }
  }

  const handleCreateAdjustment = async () => {
    if (!activeYear || !adjustmentAmount || !adjustmentReason) return

    // Clear previous errors
    setAdjustmentError('')

    const amount = parseFormattedNumber(adjustmentAmount)

    if (amount <= 0) {
      setAdjustmentError("Adjustment amount must be greater than zero")
      toast.error("Invalid Amount", {
        description: "Adjustment amount must be greater than zero.",
      })
      return
    }

    try {
      await createAdjustmentMutation.mutateAsync({
        studentId,
        data: {
          academicYearId: activeYear.id,
          type: adjustmentType,
          amount,
          reason: adjustmentReason,
          description: adjustmentDescription || undefined,
        },
      })

      toast.success("Adjustment Created", {
        description: `${adjustmentType === 'DISCOUNT' ? 'Discount' : 'Additional fee'} of ${formatCurrency(amount)} has been applied.`,
      })

      setAdjustmentDialogOpen(false)
      setAdjustmentAmount('')
      setAdjustmentReason('')
      setAdjustmentDescription('')
      setAdjustmentError('')
    } catch (error) {
      setAdjustmentError("There was an error creating the adjustment")
      toast.error("Adjustment Failed", {
        description: "There was an error creating the adjustment. Please try again.",
      })
    }
  }

  const handleToggleLatePayment = async () => {
    if (!activeYear || !feeStatus) return

    await updateLateMutation.mutateAsync({
      studentId,
      academicYearId: activeYear.id,
      isLatePayment: !feeStatus.isLatePayment,
      lateSince: !feeStatus.isLatePayment ? new Date().toISOString() : null,
    })
  }

  const handleRefundPayment = async () => {
    if (!selectedPayment || !refundAmount || !refundReason) return

    // Clear previous errors
    setRefundError('')

    const amount = parseFormattedNumber(refundAmount)

    if (amount <= 0) {
      setRefundError("Refund amount must be greater than zero")
      toast.error("Invalid Amount", {
        description: "Refund amount must be greater than zero.",
      })
      return
    }

    const maxRefundable = getMaxRefundableAmount(selectedPayment)

    if (amount > maxRefundable) {
      setRefundError(`Refund amount cannot exceed the refundable portion of ${formatCurrency(maxRefundable)}`)
      toast.error("Amount Exceeds Refundable Limit", {
        description: `Refund amount cannot exceed the refundable portion of ${formatCurrency(maxRefundable)}.`,
      })
      return
    }

    try {
      await refundPaymentMutation.mutateAsync({
        studentId,
        data: {
          paymentId: selectedPayment.id,
          refundAmount: amount,
          refundReason,
        },
      })

      toast.success("Refund Processed", {
        description: `Refund of ${formatCurrency(amount)} has been processed.`,
      })

      setRefundDialogOpen(false)
      setSelectedPayment(null)
      setRefundAmount('')
      setRefundReason('')
      setRefundError('')
    } catch (error) {
      setRefundError("There was an error processing the refund")
      toast.error("Refund Failed", {
        description: "There was an error processing the refund. Please try again.",
      })
    }
  }

  const openRefundDialog = (payment: any) => {
    setSelectedPayment(payment)
    setRefundAmount('')
    setRefundReason('')
    setRefundError('')
    setRefundDialogOpen(true)
  }

  // Calculate maximum refundable amount for a payment based on its line items
  const getMaxRefundableAmount = (payment: any) => {
    if (!payment) return 0

    // Calculate refundable amount from line items
    let refundableAmount = payment.amountPaid

    if (payment.lineItems && payment.lineItems.length > 0) {
      // Payment has line items - use them to calculate refundability
      // Only include items that are explicitly marked as refundable (true) or have no feeBreakdown info
      // Items explicitly marked as non-refundable (false) are excluded
      const refundableItems = payment.lineItems.filter((item: any) => {
        // If no feeBreakdown or isRefundable is undefined/null, treat as refundable (default behavior)
        if (!item.feeBreakdown || item.feeBreakdown.isRefundable === undefined || item.feeBreakdown.isRefundable === null) {
          return true
        }
        // Otherwise, only include if explicitly true
        return item.feeBreakdown.isRefundable === true
      })

      refundableAmount = refundableItems.reduce((sum: number, item: any) => sum + item.amount, 0)
    } else {
      // Payment doesn't have line items
      // If the fee template has non-refundable items, we can't determine what this payment
      // was for, so we must block refunds to be safe (user needs to verify manually)
      if (refundableInfo.hasNonRefundableItems) {
        refundableAmount = 0
      }
      // Otherwise, if all items are refundable, allow full refund
    }

    // Subtract already refunded amount
    const totalRefunded = payment.refundAmount || 0
    return Math.max(0, refundableAmount - totalRefunded)
  }

  // Get reason why payment cannot be refunded
  const getRefundBlockedReason = (payment: any) => {
    if (!payment) return ''

    if (payment.lineItems && payment.lineItems.length > 0) {
      const hasAnyRefundable = payment.lineItems.some((item: any) => item.feeBreakdown?.isRefundable !== false)
      if (!hasAnyRefundable) {
        return 'All items in this payment are non-refundable'
      }
      return 'No refundable amount remaining'
    } else {
      if (refundableInfo.hasNonRefundableItems) {
        return 'Cannot verify refundability - payment missing line item details'
      }
      return 'No refundable amount remaining'
    }
  }

  const openEditRemarksDialog = (payment: any) => {
    setSelectedPayment(payment)
    setEditRemarks(payment.remarks || '')
    setEditRemarksDialogOpen(true)
  }

  const handleUpdateRemarks = async () => {
    if (!selectedPayment) return

    try {
      await updateRemarksMutation.mutateAsync({
        studentId,
        paymentId: selectedPayment.id,
        remarks: editRemarks || null,
      })

      toast.success("Remarks Updated", {
        description: "Payment remarks have been updated successfully.",
      })

      setEditRemarksDialogOpen(false)
      setSelectedPayment(null)
      setEditRemarks('')
    } catch (error) {
      toast.error("Update Failed", {
        description: "There was an error updating the payment remarks. Please try again.",
      })
    }
  }

  const toggleOptionalFee = (feeId: string) => {
    setSelectedOptionalFees(prev => {
      const newSelected = { ...prev }
      if (newSelected[feeId]) {
        delete newSelected[feeId]
      } else {
        newSelected[feeId] = { selected: true, quantity: 1 }
      }
      return newSelected
    })
  }

  const setFeeVariation = (feeId: string, variationId: string) => {
    setSelectedOptionalFees(prev => ({
      ...prev,
      [feeId]: {
        ...prev[feeId],
        variationId,
      },
    }))
  }

  const setFeeQuantity = (feeId: string, quantity: number) => {
    setSelectedOptionalFees(prev => ({
      ...prev,
      [feeId]: {
        ...prev[feeId],
        quantity: Math.max(1, quantity),
      },
    }))
  }

  const getSelectedFeesTotal = () => {
    let total = 0
    Object.entries(selectedOptionalFees).forEach(([feeId, selection]) => {
      if (!selection.selected) return

      const fee = optionalFees.find((f: any) => f.id === feeId)
      if (!fee) return

      const quantity = selection.quantity || 1

      if (fee.hasVariations && selection.variationId) {
        const variation = fee.variations?.find((v: any) => v.id === selection.variationId)
        total += (variation?.amount || 0) * quantity
      } else if (!fee.hasVariations) {
        total += (fee.amount || 0) * quantity
      }
    })
    return total
  }

  const handleAssignOptionalFees = async () => {
    if (!activeYear || Object.keys(selectedOptionalFees).length === 0) return

    setAssigningFees(true)
    const feesToAssign = Object.entries(selectedOptionalFees).filter(([_, selection]) => selection.selected)

    try {
      // Assign each selected fee
      for (const [feeId, selection] of feesToAssign) {
        const fee = optionalFees.find((f: any) => f.id === feeId)
        if (!fee) continue

        // Skip if fee has variations but none selected
        if (fee.hasVariations && !selection.variationId) continue

        const quantity = selection.quantity || 1

        let unitAmount = 0
        if (fee.hasVariations && selection.variationId) {
          const variation = fee.variations?.find((v: any) => v.id === selection.variationId)
          unitAmount = variation?.amount || 0
        } else {
          unitAmount = fee.amount || 0
        }

        const totalAmount = unitAmount * quantity

        await assignOptionalFeeMutation.mutateAsync({
          studentId,
          data: {
            optionalFeeId: feeId,
            academicYearId: activeYear.id,
            selectedVariationId: selection.variationId,
            amount: totalAmount,
          },
        })
      }

      toast.success('Optional Fees Assigned', {
        description: `${feesToAssign.length} fee(s) have been assigned successfully.`,
      })

      setOptionalFeeDialogOpen(false)
      setSelectedOptionalFees({})
    } catch (error) {
      // Errors handled by individual mutations
    } finally {
      setAssigningFees(false)
    }
  }

  const handleDeleteClick = (fee: any) => {
    setFeeToDelete(fee)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!activeYear || !feeToDelete) return

    setDeletingOptionalFeeId(feeToDelete.optionalFeeId)
    try {
      await removeOptionalFeeMutation.mutateAsync({
        studentId,
        optionalFeeId: feeToDelete.optionalFeeId,
        academicYearId: activeYear.id,
      })
      setDeleteConfirmOpen(false)
      setFeeToDelete(null)
    } catch (error) {
      // Error handled by mutation
    } finally {
      setDeletingOptionalFeeId(null)
    }
  }

  const handleCancelDelete = () => {
    setDeleteConfirmOpen(false)
    setFeeToDelete(null)
  }

  const handleEditOptionalFee = (fee: any) => {
    setEditingOptionalFeeId(fee.id)
    // Calculate quantity from amount (amount / unit price)
    let unitPrice = 0
    if (fee.optionalFee.hasVariations && fee.selectedVariationId) {
      const variation = fee.optionalFee.variations?.find((v: any) => v.id === fee.selectedVariationId)
      unitPrice = variation?.amount || 0
    } else {
      unitPrice = fee.optionalFee.amount || 0
    }
    const quantity = unitPrice > 0 ? Math.round(fee.amount / unitPrice) : 1
    setEditQuantity(quantity)
  }

  const handleSaveOptionalFeeEdit = async (fee: any) => {
    if (!activeYear || editQuantity < 1) return

    // Calculate new amount
    let unitPrice = 0
    if (fee.optionalFee.hasVariations && fee.selectedVariationId) {
      const variation = fee.optionalFee.variations?.find((v: any) => v.id === fee.selectedVariationId)
      unitPrice = variation?.amount || 0
    } else {
      unitPrice = fee.optionalFee.amount || 0
    }
    const newAmount = unitPrice * editQuantity

    setSavingOptionalFeeId(fee.optionalFeeId)

    try {
      const response = await fetch(`/api/students/${studentId}/optional-fees/${fee.optionalFeeId}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicYearId: activeYear.id,
          amount: newAmount,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update optional fee')
      }

      // Invalidate React Query cache to refetch data
      await queryClient.invalidateQueries({
        queryKey: ['optional-fees', 'student', studentId]
      })
      await queryClient.invalidateQueries({
        queryKey: ['fees', 'status', studentId]
      })

      toast.success('Quantity Updated', {
        description: `Optional fee quantity has been updated to ${editQuantity}.`,
      })

      setEditingOptionalFeeId(null)
    } catch (error) {
      toast.error('Update Failed', {
        description: 'Failed to update optional fee quantity.',
      })
    } finally {
      setSavingOptionalFeeId(null)
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      PAID: 'bg-green-100 text-green-800',
      PARTIAL: 'bg-amber-100 text-amber-800',
      UNPAID: 'bg-red-100 text-red-800',
      OVERPAID: 'bg-blue-100 text-blue-800',
    }
    const className = variants[status] || variants.UNPAID

    return (
      <Badge className={className}>
        {status}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount)
  }

  // Calculate refundable portion of fees
  const refundableInfo = useMemo(() => {
    if (!feeStatus?.feeTemplate?.breakdowns) {
      return { hasNonRefundableItems: false, refundablePercentage: 1, refundableAmount: 0, nonRefundableAmount: 0 }
    }

    const breakdowns = feeStatus.feeTemplate.breakdowns
    const totalAmount = feeStatus.totalDue || 0
    const refundableAmount = breakdowns
      .filter((b: any) => b.isRefundable !== false)
      .reduce((sum: number, b: any) => sum + b.amount, 0)
    const nonRefundableAmount = breakdowns
      .filter((b: any) => b.isRefundable === false)
      .reduce((sum: number, b: any) => sum + b.amount, 0)

    return {
      hasNonRefundableItems: nonRefundableAmount > 0,
      refundablePercentage: totalAmount > 0 ? refundableAmount / totalAmount : 1,
      refundableAmount,
      nonRefundableAmount,
    }
  }, [feeStatus?.feeTemplate?.breakdowns, feeStatus?.totalDue])

  // Calculate optional fees totals
  const optionalFeesTotal = useMemo(() => {
    return studentOptionalFees.reduce((sum: number, fee: any) => sum + fee.amount, 0)
  }, [studentOptionalFees])

  const unpaidOptionalFeesTotal = useMemo(() => {
    return studentOptionalFees.reduce((sum: number, fee: any) => {
      const remaining = fee.amount - (fee.paidAmount || 0)
      return sum + remaining
    }, 0)
  }, [studentOptionalFees])

  const paidOptionalFeesTotal = useMemo(() => {
    return studentOptionalFees.reduce((sum: number, fee: any) => sum + (fee.paidAmount || 0), 0)
  }, [studentOptionalFees])

  // Adjusted totals including optional fees
  const adjustedTotalDue = (feeStatus?.totalDue || 0) + optionalFeesTotal
  const adjustedTotalPaid = (feeStatus?.totalPaid || 0) + paidOptionalFeesTotal
  const adjustedBalance = (feeStatus?.balance || 0) + unpaidOptionalFeesTotal

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!activeYear) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">No active academic year found</p>
      </div>
    )
  }

  if (!feeStatus) {
    return (
      <div className="min-h-screen bg-slate-50 pb-12">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-6 space-y-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <p className="text-gray-500 mb-2">Loading fee information...</p>
              <Loader2 className="h-6 w-6 animate-spin text-gray-400 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Check if student is not enrolled (check this FIRST)
  const isNotEnrolled = student?.enrollmentStatus !== 'ENROLLED'

  // Check if fee template exists (but only show this alert if student IS enrolled)
  const hasNoFeeTemplate = !feeStatus?.feeTemplate && !isNotEnrolled

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 pt-6 space-y-6">
        {/* Header Section */}
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-3"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Student
          </Button>
          <h1 className="text-2xl font-semibold text-slate-900">
            Payment Management
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            {student?.fullName} • {activeYear.name}
          </p>
        </div>

        {/* No Fee Template Warning */}
        {hasNoFeeTemplate && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">No Fee Template Available:</span> There is no fee template configured for {student?.gradeLevel}. Payments cannot be processed until a template is created.
                </p>
                <Link href="/admin/dashboard/fees">
                  <Button size="sm" variant="outline" className="mt-1">
                    Create Fee Template
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Student Not Enrolled Warning */}
        {isNotEnrolled && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>
                  <span className="font-medium">Student Not Enrolled:</span> {student?.fullName} has a status of <Badge variant="outline" className="ml-1">{student?.enrollmentStatus}</Badge>. Payments can only be processed for enrolled students.
                </p>
                <p className="text-sm">
                  Please enroll this student first before creating payments.
                </p>
                <Link href={`/admin/dashboard/students/${studentId}/edit`}>
                  <Button size="sm" variant="outline" className="mt-1">
                    Enroll Student
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Late Payment Warning */}
        {feeStatus?.isLatePayment && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <span className="font-medium">Late Payment:</span> Payment overdue since {feeStatus.lateSince && format(new Date(feeStatus.lateSince), 'PPP')}
            </AlertDescription>
          </Alert>
        )}

        {/* Non-Refundable Fees Warning */}
        {refundableInfo.hasNonRefundableItems && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <span className="font-medium">Partial Refundability:</span> This fee template contains {formatCurrency(refundableInfo.nonRefundableAmount)} in non-refundable items. Refundable items ({formatCurrency(refundableInfo.refundableAmount)}) can be refunded at 100%, but non-refundable items cannot be refunded.
            </AlertDescription>
          </Alert>
        )}

        {/* Account Summary Card */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-medium">Account Summary</CardTitle>
                <CardDescription>Payment status and balance overview</CardDescription>
              </div>
              {feeStatus && getPaymentStatusBadge(feeStatus.paymentStatus)}
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Total Due */}
              <div className="space-y-1">
                <p className="text-sm text-slate-600">Total Due</p>
                <p className="text-2xl font-medium text-slate-900">{formatCurrency(adjustedTotalDue)}</p>
              </div>

              {/* Total Paid */}
              <div className="space-y-1">
                <p className="text-sm text-slate-600">Total Paid</p>
                <p className="text-2xl font-medium text-green-700">{formatCurrency(adjustedTotalPaid)}</p>
              </div>

              {/* Balance Due */}
              <div className="space-y-1">
                <p className="text-sm text-slate-600">Balance</p>
                <p className={`text-2xl font-medium ${
                  adjustedBalance > 0 ? 'text-red-700' : 'text-green-700'
                }`}>
                  {formatCurrency(adjustedBalance)}
                </p>
              </div>

              {/* Adjustments */}
              <div className="space-y-1">
                <p className="text-sm text-slate-600">Adjustments</p>
                <p className="text-2xl font-medium text-slate-900">{formatCurrency(feeStatus?.totalAdjustments || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Optional Fees */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-medium">Optional Fees</CardTitle>
                <CardDescription>Additional fees assigned to this student</CardDescription>
              </div>
              <Button
                size="sm"
                onClick={() => setOptionalFeeDialogOpen(true)}
                disabled={isNotEnrolled || hasNoFeeTemplate}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Optional Fee
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {studentOptionalFees && studentOptionalFees.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fee Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentOptionalFees.map((item: any) => {
                    const isEditing = editingOptionalFeeId === item.id
                    const isDeleting = deletingOptionalFeeId === item.optionalFeeId
                    const isSaving = savingOptionalFeeId === item.optionalFeeId

                    // Calculate unit price and quantity
                    let unitPrice = 0
                    if (item.optionalFee.hasVariations && item.selectedVariationId) {
                      const variation = item.optionalFee.variations?.find((v: any) => v.id === item.selectedVariationId)
                      unitPrice = variation?.amount || 0
                    } else {
                      unitPrice = item.optionalFee.amount || 0
                    }
                    const quantity = unitPrice > 0 ? Math.round(item.amount / unitPrice) : 1

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.optionalFee.name}
                          {item.selectedVariationId && item.optionalFee.variations && (
                            <div className="text-xs text-slate-600 mt-1">
                              {item.optionalFee.variations.find((v: any) => v.id === item.selectedVariationId)?.name}
                            </div>
                          )}
                          {!item.isPaid && quantity > 1 && (
                            <div className="text-xs text-slate-500 mt-1">
                              Quantity: {quantity}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {item.optionalFee.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {item.optionalFee.category.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-2">
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => setEditQuantity(Math.max(1, editQuantity - 1))}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Input
                                  type="number"
                                  min="1"
                                  value={editQuantity}
                                  onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                                  className="h-7 w-14 text-center text-xs"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className="h-7 w-7 p-0"
                                  onClick={() => setEditQuantity(editQuantity + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="text-xs text-slate-600">×</span>
                              <span className="font-medium text-xs">{formatCurrency(unitPrice)}</span>
                              <span className="text-xs text-slate-600">=</span>
                              <span className="font-bold">{formatCurrency(unitPrice * editQuantity)}</span>
                            </div>
                          ) : (
                            <div className="font-medium">
                              {formatCurrency(item.amount)}
                              {!item.isPaid && quantity > 1 && (
                                <div className="text-xs text-slate-500 mt-0.5">
                                  {formatCurrency(unitPrice)} × {quantity}
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.isPaid ? (
                            <Badge className="bg-green-100 text-green-800">
                              Paid
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-amber-800 border-amber-300">
                              Unpaid
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            {isEditing ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSaveOptionalFeeEdit(item)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  disabled={isSaving}
                                >
                                  {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingOptionalFeeId(null)}
                                  className="text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                                  disabled={isSaving}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                {!item.isPaid && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditOptionalFee(item)}
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    disabled={isDeleting}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteClick(item)}
                                  disabled={isDeleting || removeOptionalFeeMutation.isPending}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  {isDeleting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <p>No optional fees assigned yet</p>
                <p className="text-sm mt-1">Click "Add Optional Fee" to assign fees to this student</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Fee Breakdown */}
        {feeStatus?.feeTemplate && (
          <Card className="border shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-medium">Fee Breakdown</CardTitle>
              <CardDescription>{feeStatus.feeTemplate.name}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Refundable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeStatus.feeTemplate.breakdowns.map((breakdown: any) => (
                    <TableRow key={breakdown.id}>
                      <TableCell className="font-medium">{breakdown.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {breakdown.category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(breakdown.amount)}</TableCell>
                      <TableCell className="text-center">
                        {breakdown.isRefundable ? (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Yes
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                            No
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="font-medium">Base Fee Total</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(feeStatus.baseFee)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <Button
            onClick={() => {
              setPaymentDialogOpen(true)
              setPaymentError('')
            }}
            className="w-full"
            disabled={isNotEnrolled || hasNoFeeTemplate}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
          <Button
            onClick={handlePayFullBalance}
            variant="outline"
            disabled={isNotEnrolled || hasNoFeeTemplate || adjustedBalance <= 0}
            className="w-full"
          >
            Pay Full Balance
          </Button>
          <Button
            onClick={() => {
              setAdjustmentDialogOpen(true)
              setAdjustmentError('')
            }}
            variant="outline"
            className="w-full"
            disabled={isNotEnrolled || hasNoFeeTemplate}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Adjustment
          </Button>
          <Button
            onClick={handleToggleLatePayment}
            variant={feeStatus?.isLatePayment ? 'destructive' : 'outline'}
            disabled={isNotEnrolled || hasNoFeeTemplate || updateLateMutation.isPending}
            className="w-full"
          >
            {updateLateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {feeStatus?.isLatePayment ? 'Remove Late Flag' : 'Mark as Late'}
          </Button>
        </div>

        {/* Payment History */}
        <Card className="border shadow-sm">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-medium">Payment History</CardTitle>
                <CardDescription>All payment transactions for this academic year</CardDescription>
              </div>
              <Button
                onClick={handleExportPDF}
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={!feeStatus?.payments || feeStatus.payments.length === 0}
              >
                <FileDown className="h-4 w-4" />
                Export to PDF
              </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by reference or remarks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Payment Method Filter */}
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CHECK">Check</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                  <SelectItem value="GCASH">GCash</SelectItem>
                  <SelectItem value="PAYMAYA">PayMaya</SelectItem>
                  <SelectItem value="ONLINE">Online Payment</SelectItem>
                </SelectContent>
              </Select>

              {/* Transaction Type Filter */}
              <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="payments">Payments Only</SelectItem>
                  <SelectItem value="refunds">Refunds Only</SelectItem>
                  <SelectItem value="net">Net Payments</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Label htmlFor="dateFrom" className="text-xs text-slate-600 mb-1 block">
                  From Date
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex-1">
                <Label htmlFor="dateTo" className="text-xs text-slate-600 mb-1 block">
                  To Date
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    min={dateFrom}
                    className="pl-10"
                  />
                </div>
              </div>
              {(dateFrom || dateTo) && (
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateFrom('')
                      setDateTo('')
                    }}
                    className="w-full sm:w-auto"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear Dates
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0 relative">
            {/* Loading overlay */}
            {isFetching && !isLoading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
                <div className="bg-white rounded-lg shadow-lg p-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">Loading...</span>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : filteredPayments && filteredPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Reference</TableHead>
                    <TableHead className="font-semibold">Remarks</TableHead>
                    <TableHead className="text-right font-semibold">Amount</TableHead>
                    <TableHead className="text-right font-semibold">Balance</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-center font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.flatMap((payment: any) => {
                    const totalRefunded = payment.refunds?.reduce((sum: number, r: any) => sum + r.amount, 0) || 0
                    const netAmount = payment.amountPaid - totalRefunded
                    const isFullyRefunded = payment.refunds && totalRefunded >= payment.amountPaid
                    const hasRefunds = payment.refunds && payment.refunds.length > 0
                    const isPartiallyRefunded = hasRefunds && !isFullyRefunded

                    const rows = []

                    // If showing net only, return simplified row
                    if (payment.showNetOnly) {
                      return [
                        <TableRow
                          key={payment.id}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <TableCell className="font-medium">
                            {format(new Date(payment.paymentDate), 'MMM dd, yyyy')}
                            <div className="text-xs text-slate-500">
                              {format(new Date(payment.paymentDate), 'h:mm a')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs font-medium border-slate-600 text-slate-700 bg-slate-50">
                              NET PAYMENT
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-mono text-xs bg-slate-100 px-2 py-1 rounded inline-block">
                              {payment.referenceNumber || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {payment.remarks && (
                              <div className="text-sm text-slate-700">{payment.remarks}</div>
                            )}
                            {hasRefunds && (
                              <div className="text-xs text-slate-500 mt-1">
                                {totalRefunded > 0 ? `Includes ${formatCurrency(totalRefunded)} in refunds` : ''}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className={`font-semibold text-base ${isFullyRefunded ? 'text-red-700' : 'text-green-700'}`}>
                              {formatCurrency(payment.amountPaid)}
                            </div>
                            {hasRefunds && totalRefunded > 0 && (
                              <div className="text-xs text-slate-500 mt-0.5">
                                - {formatCurrency(totalRefunded)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className={`text-lg font-bold ${isFullyRefunded ? 'text-red-700' : netAmount > 0 ? 'text-green-700' : 'text-slate-700'}`}>
                              {formatCurrency(netAmount)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isFullyRefunded ? (
                              <Badge variant="destructive" className="font-semibold">
                                FULLY REFUNDED
                              </Badge>
                            ) : isPartiallyRefunded ? (
                              <Badge className="bg-orange-100 text-orange-700 border-orange-300 font-semibold">
                                PARTIALLY REFUNDED
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-700 border-green-300">
                                Paid
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/admin/dashboard/students/${student?.id}/payments`)}
                              className="text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ]
                    }

                    // Main payment row
                    rows.push(
                      <TableRow
                        key={payment.id}
                        className={`hover:bg-slate-50 transition-colors ${hasRefunds ? 'border-b-0' : ''}`}
                      >
                        <TableCell className="font-medium">
                          {format(new Date(payment.paymentDate), 'MMM dd, yyyy')}
                          <div className="text-xs text-slate-500">
                            {format(new Date(payment.paymentDate), 'h:mm a')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs font-medium border-green-600 text-green-700 bg-green-50">
                            {payment.paymentMethod.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-mono text-xs bg-slate-100 px-2 py-1 rounded inline-block">
                            {payment.referenceNumber || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            {payment.remarks && (
                              <div className="text-sm text-slate-700">{payment.remarks}</div>
                            )}
                            {payment.lineItems && payment.lineItems.length > 0 ? (
                              <div className="bg-slate-50 rounded-lg p-2.5 space-y-0.5">
                                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                                  Line Items
                                </div>
                                {payment.lineItems.map((item: any) => {
                                  const category = item.feeBreakdown?.category || 'MISC'
                                  const categoryColors: Record<string, string> = {
                                    TUITION: 'text-blue-600 bg-blue-50',
                                    REGISTRATION: 'text-purple-600 bg-purple-50',
                                    BOOKS: 'text-green-600 bg-green-50',
                                    MISC: 'text-slate-600 bg-slate-50',
                                    LAB: 'text-orange-600 bg-orange-50',
                                  }

                                  return (
                                    <div key={item.id} className="flex items-center gap-2 flex-wrap py-1">
                                      <span className="text-xs font-medium text-slate-700">
                                        • {item.description}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className={`text-xs px-1.5 py-0.5 ${categoryColors[category] || categoryColors.MISC}`}
                                      >
                                        {category.replace('_', ' ')}
                                      </Badge>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              refundableInfo.hasNonRefundableItems && (
                                <Badge variant="outline" className="text-xs border-amber-600 text-amber-700 bg-amber-50">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  No line items - refunds restricted
                                </Badge>
                              )
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-semibold text-green-700 text-base">
                            +{formatCurrency(payment.amountPaid)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="font-bold text-slate-900 text-base">
                            {formatCurrency(payment.amountPaid)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {!hasRefunds && (
                            <Badge className="bg-green-100 text-green-700 border-green-300">
                              Paid
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditRemarksDialog(payment)}
                              className="text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            {!isFullyRefunded ? (
                              <div className="relative group inline-block">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openRefundDialog(payment)}
                                  disabled={getMaxRefundableAmount(payment) <= 0}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Minus className="h-3 w-3 mr-1" />
                                  Refund
                                </Button>
                                {getMaxRefundableAmount(payment) <= 0 && (
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    {getRefundBlockedReason(payment)}
                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )

                    // Individual refund rows
                    if (hasRefunds) {
                      let runningBalance = payment.amountPaid
                      payment.refunds.forEach((refund: any, index: number) => {
                        runningBalance -= refund.amount
                        const isLastRefund = index === payment.refunds.length - 1

                        rows.push(
                          <TableRow
                            key={`${payment.id}-refund-${refund.id}`}
                            className={`bg-red-50/30 hover:bg-red-50/50 transition-colors border-l-4 border-red-400 ${!isLastRefund ? 'border-b-0' : ''}`}
                          >
                            <TableCell className="font-medium pl-8">
                              {format(new Date(refund.refundDate), 'MMM dd, yyyy')}
                              <div className="text-xs text-slate-500">
                                {format(new Date(refund.refundDate), 'h:mm a')}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive" className="text-xs font-medium">
                                REFUND
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-mono text-xs bg-red-100 px-2 py-1 rounded inline-block text-red-700">
                                {refund.referenceNumber || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium text-red-700">
                                {refund.reason}
                              </div>
                              <div className="text-xs text-slate-600 mt-1">
                                Original Ref: {payment.referenceNumber || 'N/A'}
                              </div>
                              {refund.remarks && (
                                <div className="text-xs text-slate-500 mt-1">
                                  {refund.remarks}
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-semibold text-red-700 text-base">
                                -{formatCurrency(refund.amount)}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="font-bold text-slate-900 text-base">
                                {formatCurrency(runningBalance)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs text-slate-400">—</span>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-xs text-slate-400">—</span>
                            </TableCell>
                          </TableRow>
                        )
                      })

                      // Add summary row for the payment group
                      rows.push(
                        <TableRow
                          key={`${payment.id}-summary`}
                          className="bg-slate-100 border-t-2 border-slate-300 font-semibold"
                        >
                          <TableCell colSpan={4} className="text-right pr-4">
                            <span className="text-sm uppercase tracking-wide">Net Amount:</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="text-sm text-slate-600">
                              Total Refunded: -{formatCurrency(totalRefunded)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className={`text-lg font-bold ${isFullyRefunded ? 'text-red-700' : 'text-green-700'}`}>
                              {formatCurrency(netAmount)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isFullyRefunded ? (
                              <Badge variant="destructive" className="font-semibold">
                                FULLY REFUNDED
                              </Badge>
                            ) : isPartiallyRefunded ? (
                              <Badge className="bg-orange-100 text-orange-700 border-orange-300 font-semibold">
                                PARTIALLY REFUNDED
                              </Badge>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-xs text-slate-400">—</span>
                          </TableCell>
                        </TableRow>
                      )
                    }

                    return rows
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="py-12 text-center text-slate-500">
                <p>{hasActiveFilters ? 'No results matching filters' : 'No payments recorded yet'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Adjustments History */}
        {feeStatus?.adjustments && feeStatus.adjustments.length > 0 && (
          <Card className="border shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-medium">Fee Adjustments</CardTitle>
              <CardDescription>Discounts and additional fees applied to this account</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {feeStatus.adjustments.map((adjustment: any) => (
                    <TableRow key={adjustment.id}>
                      <TableCell>{format(new Date(adjustment.createdAt), 'PPP')}</TableCell>
                      <TableCell className="font-medium">{adjustment.reason}</TableCell>
                      <TableCell>
                        <Badge className={adjustment.type === 'DISCOUNT' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {adjustment.type === 'DISCOUNT' ? (
                            <Minus className="h-3 w-3 mr-1" />
                          ) : (
                            <Plus className="h-3 w-3 mr-1" />
                          )}
                          {adjustment.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{adjustment.description || '-'}</TableCell>
                      <TableCell className={`text-right font-medium ${
                        adjustment.type === 'DISCOUNT' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {adjustment.type === 'DISCOUNT' ? '-' : '+'}{formatCurrency(adjustment.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Record Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={(open) => {
          setPaymentDialogOpen(open)
          if (!open) {
            setFeeItemSearch('')
            setSelectedLineItems({})
            setOptionalFeeQuantities({})
          }
        }}>
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Processing payment for {student?.fullName}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Balance Info */}
              {adjustedBalance > 0 && (
                <div className="bg-slate-50 border rounded-lg p-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Current Balance:</span>
                    <span className="font-medium">{formatCurrency(adjustedBalance)}</span>
                  </div>
                </div>
              )}

              {/* Line Items Selection */}
              {(feeStatus?.feeTemplate?.breakdowns || studentOptionalFees.some((f: any) => !f.isPaid || (f.paidAmount < f.amount))) && adjustedBalance > 0 && (
                <div className="space-y-2">
                  <Label>Select Fee Items to Pay (Optional)</Label>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      type="text"
                      placeholder="Search fee items..."
                      value={feeItemSearch}
                      onChange={(e) => setFeeItemSearch(e.target.value)}
                      className="pl-9 h-9"
                    />
                  </div>

                  <div className="border rounded-lg max-h-[300px] overflow-y-auto overflow-x-hidden pr-1">
                    <div className="divide-y pr-2">
                    {/* Base Fee Breakdowns */}
                    {feeStatus?.feeTemplate?.breakdowns && feeStatus.feeTemplate.breakdowns
                      .filter((breakdown: any) => {
                        // Filter by search
                        const matchesSearch = breakdown.description.toLowerCase().includes(feeItemSearch.toLowerCase()) ||
                          breakdown.category.toLowerCase().includes(feeItemSearch.toLowerCase())

                        // Filter out fully paid items
                        const paidAmount = paidByBreakdown[breakdown.id] || 0
                        const isFullyPaid = paidAmount >= breakdown.amount

                        return matchesSearch && !isFullyPaid
                      })
                      .map((breakdown: any) => {
                      const paidAmount = paidByBreakdown[breakdown.id] || 0
                      const remainingBalance = breakdown.amount - paidAmount
                      const isSelected = selectedLineItems[breakdown.id] !== undefined
                      const selectedAmount = selectedLineItems[breakdown.id] || remainingBalance

                      return (
                        <div key={breakdown.id} className="p-3 hover:bg-slate-50">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleLineItem(breakdown.id, remainingBalance, false)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-sm">{breakdown.description}</span>
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {breakdown.category}
                                </Badge>
                              </div>
                              <div className="text-xs text-slate-600 mt-1 space-y-0.5">
                                <div>Full Amount: {formatCurrency(breakdown.amount)}</div>
                                {paidAmount > 0 && (
                                  <>
                                    <div className="text-green-600">Paid: {formatCurrency(paidAmount)}</div>
                                    <div className="font-medium text-orange-600">Remaining: {formatCurrency(remainingBalance)}</div>
                                  </>
                                )}
                              </div>
                              {isSelected && (
                                <div className="mt-2">
                                  <Label htmlFor={`amount-${breakdown.id}`} className="text-xs">
                                    Amount to Pay
                                  </Label>
                                  <Input
                                    id={`amount-${breakdown.id}`}
                                    type="text"
                                    value={formatNumberInput(selectedAmount.toString())}
                                    onChange={(e) => updateLineItemAmount(breakdown.id, parseFormattedNumber(e.target.value), false)}
                                    className="mt-1 h-8 text-sm font-mono"
                                  />
                                  <p className="text-xs text-slate-500 mt-1">
                                    Max: {formatCurrency(remainingBalance)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Optional Fees (Unpaid or Partially Paid) */}
                    {studentOptionalFees
                      .filter((fee: any) => !fee.isPaid || (fee.paidAmount < fee.amount))
                      .filter((fee: any) =>
                        fee.optionalFee.name.toLowerCase().includes(feeItemSearch.toLowerCase()) ||
                        fee.optionalFee.category.toLowerCase().includes(feeItemSearch.toLowerCase())
                      )
                      .map((optFee: any) => {
                      const key = `optional-${optFee.id}`
                      const isSelected = selectedLineItems[key] !== undefined
                      const selectedAmount = selectedLineItems[key] || optFee.amount

                      // Calculate unit price and remaining balance
                      let unitPrice = 0
                      if (optFee.optionalFee.hasVariations && optFee.selectedVariationId) {
                        const variation = optFee.optionalFee.variations?.find((v: any) => v.id === optFee.selectedVariationId)
                        unitPrice = variation?.amount || 0
                      } else {
                        unitPrice = optFee.optionalFee.amount || 0
                      }

                      const totalQuantity = unitPrice > 0 ? Math.floor(optFee.amount / unitPrice) : 1
                      const paidAmount = optFee.paidAmount || 0
                      const remainingBalance = optFee.amount - paidAmount
                      const maxQuantity = unitPrice > 0 ? Math.floor(remainingBalance / unitPrice) : 1
                      const currentQuantity = optionalFeeQuantities[optFee.id] || maxQuantity

                      return (
                        <div key={optFee.id} className="p-3 hover:bg-slate-50 bg-primary/5">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleLineItem(optFee.id, remainingBalance, true, unitPrice, maxQuantity)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{optFee.optionalFee.name}</span>
                                  <Badge className="text-xs shrink-0 bg-primary text-primary-foreground">
                                    OPTIONAL
                                  </Badge>
                                </div>
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {optFee.optionalFee.category.replace('_', ' ')}
                                </Badge>
                              </div>
                              <div className="space-y-1 mt-1">
                                <div className="text-xs text-slate-600">
                                  Total: {formatCurrency(optFee.amount)} ({totalQuantity} {totalQuantity === 1 ? 'item' : 'items'} @ {formatCurrency(unitPrice)} each)
                                </div>
                                {paidAmount > 0 && (
                                  <div className="text-xs">
                                    <span className="text-green-600 font-medium">Paid: {formatCurrency(paidAmount)}</span>
                                    {' • '}
                                    <span className="text-amber-600 font-medium">Balance: {formatCurrency(remainingBalance)} ({maxQuantity} {maxQuantity === 1 ? 'item' : 'items'} remaining)</span>
                                  </div>
                                )}
                                {optFee.selectedVariationId && optFee.optionalFee.variations && (
                                  <div className="text-xs text-slate-600">
                                    {optFee.optionalFee.variations.find((v: any) => v.id === optFee.selectedVariationId)?.name}
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <div className="mt-3 space-y-2">
                                  <Label htmlFor={`quantity-${optFee.id}`} className="text-xs">
                                    Quantity to Pay
                                  </Label>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => updateOptionalFeeQuantity(optFee.id, currentQuantity - 1, unitPrice, maxQuantity)}
                                      disabled={currentQuantity <= 1}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <Input
                                      id={`quantity-${optFee.id}`}
                                      type="number"
                                      min="1"
                                      max={maxQuantity}
                                      value={currentQuantity}
                                      onChange={(e) => updateOptionalFeeQuantity(optFee.id, parseInt(e.target.value) || 1, unitPrice, maxQuantity)}
                                      className="h-8 w-20 text-center font-mono"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      onClick={() => updateOptionalFeeQuantity(optFee.id, currentQuantity + 1, unitPrice, maxQuantity)}
                                      disabled={currentQuantity >= maxQuantity}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                    <span className="text-xs text-slate-600">
                                      / {maxQuantity} max
                                    </span>
                                  </div>
                                  <div className="bg-slate-50 border rounded p-2">
                                    <div className="text-xs text-slate-600">
                                      Amount to pay: <span className="font-bold text-slate-900">{formatCurrency(unitPrice * currentQuantity)}</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* No Results Message */}
                    {feeItemSearch &&
                      (!feeStatus?.feeTemplate?.breakdowns?.filter((breakdown: any) =>
                        breakdown.description.toLowerCase().includes(feeItemSearch.toLowerCase()) ||
                        breakdown.category.toLowerCase().includes(feeItemSearch.toLowerCase())
                      ).length) &&
                      (!studentOptionalFees
                        .filter((fee: any) => !fee.isPaid || (fee.paidAmount < fee.amount))
                        .filter((fee: any) =>
                          fee.optionalFee.name.toLowerCase().includes(feeItemSearch.toLowerCase()) ||
                          fee.optionalFee.category.toLowerCase().includes(feeItemSearch.toLowerCase())
                        ).length) && (
                      <div className="p-8 text-center text-slate-500">
                        <Search className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                        <p className="font-medium">No fee items found</p>
                        <p className="text-sm mt-1">Try adjusting your search</p>
                      </div>
                    )}
                    </div>
                  </div>

                  {Object.keys(selectedLineItems).length > 0 && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">Selected Items Total:</span>
                        <span className="font-bold text-primary">{formatCurrency(calculateSelectedTotal())}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* No Fee Template Notice */}
              {hasNoFeeTemplate ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="space-y-3">
                    <p className="font-semibold">No Fee Template Available for {student?.gradeLevel}</p>
                    <p className="text-sm">
                      There is no payment reference to be made for {student?.fullName}.
                      A fee template must be created for {student?.gradeLevel} before payments can be processed.
                    </p>
                    <div className="pt-2">
                      <Link href="/admin/dashboard/fees">
                        <Button size="sm" variant="outline">
                          Create Fee Template for {student?.gradeLevel}
                        </Button>
                      </Link>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                /* Fully Paid Notice */
                adjustedBalance <= 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-sm font-medium text-green-800">
                      This student has fully paid all fees. No additional payments are needed.
                    </p>
                  </div>
                )
              )}

              {/* Manual Amount (only if no line items selected and balance > 0) */}
              {Object.keys(selectedLineItems).length === 0 && adjustedBalance > 0 && (
                <div>
                  <Label htmlFor="amount" className={paymentError ? 'text-red-600' : ''}>
                    Payment Amount *
                  </Label>
                  <Input
                    id="amount"
                    type="text"
                    value={paymentAmount}
                    onChange={(e) => {
                      setPaymentAmount(formatNumberInput(e.target.value))
                      setPaymentError('')
                    }}
                    placeholder="0"
                    className={`font-mono ${paymentError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  {paymentError && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {paymentError}
                    </p>
                  )}
                </div>
              )}

              {adjustedBalance > 0 && (
                <>
                  <div>
                    <Label htmlFor="method">Payment Method *</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="CHECK">Check</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                        <SelectItem value="GCASH">GCash</SelectItem>
                        <SelectItem value="PAYMAYA">PayMaya</SelectItem>
                        <SelectItem value="ONLINE">Online Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="reference">Reference Number</Label>
                    <Input
                      id="reference"
                      value={referenceNumber}
                      readOnly
                      disabled
                      placeholder="Auto-generated upon submission"
                      className="font-mono text-sm bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      System will automatically generate a unique reference number
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="remarks">Remarks</Label>
                    <Textarea
                      id="remarks"
                      value={paymentRemarks}
                      onChange={(e) => setPaymentRemarks(e.target.value)}
                      placeholder="Add notes about this payment (optional)"
                      rows={3}
                    />
                  </div>
                </>
              )}
            </div>

            <DialogFooter className="gap-2 border-t pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setPaymentDialogOpen(false)
                  setSelectedLineItems({})
                  setOptionalFeeQuantities({})
                  setFeeItemSearch('')
                }}
                disabled={recordPaymentMutation.isPending}
              >
                Cancel
              </Button>
              {adjustedBalance > 0 ? (
                <Button
                  onClick={handleRecordPayment}
                  disabled={(Object.keys(selectedLineItems).length === 0 && !paymentAmount) || recordPaymentMutation.isPending}
                >
                  {recordPaymentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Record Payment {Object.keys(selectedLineItems).length > 0 && `(${formatCurrency(calculateSelectedTotal())})`}
                </Button>
              ) : (
                <Button disabled>
                  No Balance to Pay
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Adjustment Dialog */}
        <Dialog open={adjustmentDialogOpen} onOpenChange={setAdjustmentDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add Adjustment</DialogTitle>
              <DialogDescription>
                Apply a discount or additional fee to the account
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="type">Adjustment Type *</Label>
                <Select value={adjustmentType} onValueChange={(v: any) => setAdjustmentType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISCOUNT">Discount (Reduce Fee)</SelectItem>
                    <SelectItem value="ADDITIONAL">Additional Fee (Increase Fee)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="adj-amount" className={adjustmentError ? 'text-red-600' : ''}>
                  Amount *
                </Label>
                <Input
                  id="adj-amount"
                  type="text"
                  value={adjustmentAmount}
                  onChange={(e) => {
                    setAdjustmentAmount(formatNumberInput(e.target.value))
                    setAdjustmentError('')
                  }}
                  placeholder="0"
                  className={`font-mono ${adjustmentError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                />
                {adjustmentError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {adjustmentError}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="reason">Reason *</Label>
                <Input
                  id="reason"
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g., Sibling Discount, Late Fee, Scholarship"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={adjustmentDescription}
                  onChange={(e) => setAdjustmentDescription(e.target.value)}
                  placeholder="Add additional details about this adjustment (optional)"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setAdjustmentDialogOpen(false)}
                disabled={createAdjustmentMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAdjustment}
                disabled={!adjustmentAmount || !adjustmentReason || createAdjustmentMutation.isPending}
              >
                {createAdjustmentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Adjustment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Refund Payment Dialog */}
        <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Refund Payment</DialogTitle>
              <DialogDescription>
                Process a refund for this payment
              </DialogDescription>
            </DialogHeader>

            {selectedPayment && (
              <>
                {/* Payment Info */}
                <div className="bg-slate-50 border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Payment Date:</span>
                    <span className="font-medium">{format(new Date(selectedPayment.paymentDate), 'PPP')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Original Amount:</span>
                    <span className="font-medium">{formatCurrency(selectedPayment.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Already Refunded:</span>
                    <span className="font-medium text-red-600">{formatCurrency(selectedPayment.refundAmount || 0)}</span>
                  </div>
                  {(() => {
                    // Calculate payment-specific refundability
                    if (selectedPayment.lineItems && selectedPayment.lineItems.length > 0) {
                      // Use same logic as getMaxRefundableAmount
                      const refundableItems = selectedPayment.lineItems.filter((item: any) => {
                        if (!item.feeBreakdown || item.feeBreakdown.isRefundable === undefined || item.feeBreakdown.isRefundable === null) {
                          return true
                        }
                        return item.feeBreakdown.isRefundable === true
                      })

                      const nonRefundableItems = selectedPayment.lineItems.filter((item: any) =>
                        item.feeBreakdown?.isRefundable === false
                      )

                      const refundableAmount = refundableItems.reduce((sum: number, item: any) => sum + item.amount, 0)
                      const nonRefundableAmount = nonRefundableItems.reduce((sum: number, item: any) => sum + item.amount, 0)

                      if (nonRefundableItems.length > 0) {
                        return (
                          <>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-600">Refundable Items:</span>
                              <span className="font-medium text-green-600">{formatCurrency(refundableAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-600">Non-Refundable Items:</span>
                              <span className="font-medium text-red-600">{formatCurrency(nonRefundableAmount)}</span>
                            </div>
                          </>
                        )
                      }
                    }
                    return null
                  })()}
                  <div className="flex justify-between items-center text-sm border-t pt-2">
                    <span className="text-slate-600 font-medium">Maximum Refundable:</span>
                    <span className="font-semibold text-green-600">{formatCurrency(getMaxRefundableAmount(selectedPayment))}</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="refund-amount" className={refundError ? 'text-red-600' : ''}>
                      Refund Amount *
                    </Label>
                    <Input
                      id="refund-amount"
                      type="text"
                      value={refundAmount}
                      onChange={(e) => {
                        setRefundAmount(formatNumberInput(e.target.value))
                        setRefundError('')
                      }}
                      placeholder="0"
                      className={`font-mono ${refundError ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    {refundError ? (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {refundError}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 mt-1">
                        Max: {formatCurrency(getMaxRefundableAmount(selectedPayment))}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="refund-reason">Reason for Refund *</Label>
                    <Textarea
                      id="refund-reason"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="Enter the reason for this refund..."
                      rows={3}
                    />
                  </div>
                </div>
              </>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setRefundDialogOpen(false)}
                disabled={refundPaymentMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRefundPayment}
                disabled={!refundAmount || !refundReason || refundPaymentMutation.isPending}
              >
                {refundPaymentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Process Refund
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Remarks Dialog */}
        <Dialog open={editRemarksDialogOpen} onOpenChange={setEditRemarksDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Payment Remarks</DialogTitle>
              <DialogDescription>
                Update the remarks for this payment
              </DialogDescription>
            </DialogHeader>

            {selectedPayment && (
              <>
                {/* Payment Info */}
                <div className="bg-slate-50 border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Payment Date:</span>
                    <span className="font-medium">{format(new Date(selectedPayment.paymentDate), 'PPP')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Amount:</span>
                    <span className="font-medium">{formatCurrency(selectedPayment.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Reference:</span>
                    <span className="font-mono text-xs">{selectedPayment.referenceNumber || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-remarks">Remarks</Label>
                  <Textarea
                    id="edit-remarks"
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    placeholder="Enter remarks for this payment (optional)..."
                    rows={4}
                  />
                  <p className="text-xs text-slate-500">
                    You can only edit the remarks field. All other payment details are locked.
                  </p>
                </div>
              </>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setEditRemarksDialogOpen(false)}
                disabled={updateRemarksMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateRemarks}
                disabled={updateRemarksMutation.isPending}
              >
                {updateRemarksMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update Remarks
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Optional Fee Dialog */}
        <Dialog open={optionalFeeDialogOpen} onOpenChange={setOptionalFeeDialogOpen}>
          <DialogContent className="sm:max-w-[750px] max-h-[85vh] flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle>Add Optional Fees</DialogTitle>
              <DialogDescription>
                Select fees to assign to {student?.fullName}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {optionalFees && optionalFees.length > 0 ? (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-base">Available Fees</Label>
                    <div className="border rounded-lg divide-y">
                      {optionalFees.map((fee: any) => {
                        const isSelected = selectedOptionalFees[fee.id]?.selected
                        const selectedVariation = selectedOptionalFees[fee.id]?.variationId
                        const quantity = selectedOptionalFees[fee.id]?.quantity || 1

                        return (
                          <div key={fee.id} className="p-4 hover:bg-slate-50">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                id={`fee-${fee.id}`}
                                checked={isSelected}
                                onCheckedChange={() => toggleOptionalFee(fee.id)}
                                className="mt-1"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1">
                                    <Label
                                      htmlFor={`fee-${fee.id}`}
                                      className="font-medium cursor-pointer"
                                    >
                                      {fee.name}
                                    </Label>
                                    {fee.description && (
                                      <p className="text-sm text-slate-600 mt-1">
                                        {fee.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge variant="outline" className="text-xs">
                                        {fee.category.replace('_', ' ')}
                                      </Badge>
                                      {!fee.hasVariations && (
                                        <span className="text-sm font-medium text-slate-700">
                                          {formatCurrency(fee.amount)} each
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Show controls if fee is selected */}
                                {isSelected && (
                                  <div className="mt-3 space-y-3">
                                    {/* Variations dropdown if applicable */}
                                    {fee.hasVariations && fee.variations?.length > 0 && (
                                      <div>
                                        <Label htmlFor={`variation-${fee.id}`} className="text-xs text-slate-600">
                                          Select Option *
                                        </Label>
                                        <Select
                                          value={selectedVariation || ''}
                                          onValueChange={(value) => setFeeVariation(fee.id, value)}
                                        >
                                          <SelectTrigger id={`variation-${fee.id}`} className="mt-1">
                                            <SelectValue placeholder="Choose an option" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {fee.variations.map((variation: any) => (
                                              <SelectItem key={variation.id} value={variation.id}>
                                                <div className="flex items-center justify-between w-full gap-4">
                                                  <span>{variation.name}</span>
                                                  <span className="text-xs text-slate-600 font-medium">
                                                    {formatCurrency(variation.amount)}
                                                  </span>
                                                </div>
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}

                                    {/* Quantity input */}
                                    <div>
                                      <Label htmlFor={`quantity-${fee.id}`} className="text-xs text-slate-600">
                                        Quantity
                                      </Label>
                                      <div className="flex items-center gap-2 mt-1">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          onClick={() => setFeeQuantity(fee.id, quantity - 1)}
                                          disabled={quantity <= 1}
                                        >
                                          <Minus className="h-3 w-3" />
                                        </Button>
                                        <Input
                                          id={`quantity-${fee.id}`}
                                          type="number"
                                          min="1"
                                          value={quantity}
                                          onChange={(e) => setFeeQuantity(fee.id, parseInt(e.target.value) || 1)}
                                          className="h-8 w-20 text-center"
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="h-8 w-8 p-0"
                                          onClick={() => setFeeQuantity(fee.id, quantity + 1)}
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Selected Fees Summary */}
                  {Object.keys(selectedOptionalFees).length > 0 && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <h4 className="font-medium text-sm mb-3">Selected Fees Summary</h4>
                      <div className="space-y-2">
                        {Object.entries(selectedOptionalFees).map(([feeId, selection]) => {
                          const fee = optionalFees.find((f: any) => f.id === feeId)
                          if (!fee || !selection.selected) return null

                          let unitAmount = 0
                          let variationName = ''
                          const quantity = selection.quantity || 1

                          if (fee.hasVariations && selection.variationId) {
                            const variation = fee.variations?.find((v: any) => v.id === selection.variationId)
                            unitAmount = variation?.amount || 0
                            variationName = variation?.name || ''
                          } else if (!fee.hasVariations) {
                            unitAmount = fee.amount || 0
                          }

                          const totalAmount = unitAmount * quantity

                          return (
                            <div key={feeId} className="flex justify-between items-start text-sm">
                              <div className="flex-1">
                                <div className="font-medium">{fee.name}</div>
                                <div className="text-xs text-slate-600 mt-0.5">
                                  {variationName && <span>{variationName} • </span>}
                                  <span>{formatCurrency(unitAmount)} × {quantity}</span>
                                </div>
                              </div>
                              <span className="font-medium">{formatCurrency(totalAmount)}</span>
                            </div>
                          )
                        })}
                        <div className="border-t pt-2 mt-2 flex justify-between items-center font-bold">
                          <span>Total</span>
                          <span className="text-lg text-primary">{formatCurrency(getSelectedFeesTotal())}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-slate-500">
                  <p>No optional fees available for this grade level</p>
                  <p className="text-sm mt-1">Optional fees must be created first before they can be assigned</p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 border-t px-6 py-4">
              <Button
                variant="outline"
                onClick={() => {
                  setOptionalFeeDialogOpen(false)
                  setSelectedOptionalFees({})
                }}
                disabled={assigningFees}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignOptionalFees}
                disabled={
                  Object.keys(selectedOptionalFees).length === 0 ||
                  Object.entries(selectedOptionalFees).some(([feeId, selection]) => {
                    if (!selection.selected) return false
                    const fee = optionalFees.find((f: any) => f.id === feeId)
                    return fee?.hasVariations && !selection.variationId
                  }) ||
                  assigningFees
                }
              >
                {assigningFees && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Assign {Object.keys(selectedOptionalFees).length > 0 ? `${Object.keys(selectedOptionalFees).length} Fee(s)` : 'Fees'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove this optional fee?
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {feeToDelete && (
                <div className="space-y-2">
                  <div className="flex items-start justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{feeToDelete.optionalFee?.name}</p>
                      {feeToDelete.optionalFee?.description && (
                        <p className="text-sm text-slate-600 mt-1">
                          {feeToDelete.optionalFee.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {feeToDelete.optionalFee?.category?.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm font-medium">
                          {formatCurrency(feeToDelete.amount)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      This action cannot be undone. The optional fee will be removed from the student's record.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={handleCancelDelete}
                disabled={deletingOptionalFeeId !== null}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDelete}
                disabled={deletingOptionalFeeId !== null}
              >
                {deletingOptionalFeeId !== null && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Delete Fee
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
