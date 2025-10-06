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
} from 'lucide-react'
import { useActiveAcademicYear } from '@/hooks/use-academic-years'
import {
  useStudentFeeStatus,
  useRecordPayment,
  useRefundPayment,
  useCreateAdjustment,
  useUpdateLatePaymentStatus,
  useUpdatePaymentRemarks
} from '@/hooks/use-fees'
import { useStudent } from '@/hooks/use-students'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { exportStudentPaymentHistory } from '@/lib/pdf-export'

export default function StudentPaymentsPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [adjustmentDialogOpen, setAdjustmentDialogOpen] = useState(false)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [editRemarksDialogOpen, setEditRemarksDialogOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [paymentRemarks, setPaymentRemarks] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<'DISCOUNT' | 'ADDITIONAL'>('DISCOUNT')
  const [adjustmentAmount, setAdjustmentAmount] = useState('')
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [adjustmentDescription, setAdjustmentDescription] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [selectedLineItems, setSelectedLineItems] = useState<Record<string, number>>({}) // feeBreakdownId -> amount
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

  const toggleLineItem = (feeBreakdownId: string, amount: number) => {
    setSelectedLineItems(prev => {
      const newItems = { ...prev }
      if (newItems[feeBreakdownId]) {
        delete newItems[feeBreakdownId]
      } else {
        newItems[feeBreakdownId] = amount
      }
      return newItems
    })
  }

  const updateLineItemAmount = (feeBreakdownId: string, amount: number) => {
    setSelectedLineItems(prev => ({
      ...prev,
      [feeBreakdownId]: amount
    }))
  }

  const calculateSelectedTotal = () => {
    return Object.values(selectedLineItems).reduce((sum, amount) => sum + amount, 0)
  }

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

    const lineItemsArray = Object.entries(selectedLineItems).map(([feeBreakdownId, amount]) => ({
      feeBreakdownId,
      amount
    }))

    const amount = lineItemsArray.length > 0 ? calculateSelectedTotal() : parseFormattedNumber(paymentAmount)

    // Validate payment amount
    if (amount <= 0) {
      setPaymentError("Payment amount must be greater than zero")
      toast.error("Invalid Amount", {
        description: "Payment amount must be greater than zero.",
      })
      return
    }

    if (feeStatus && amount > feeStatus.balance) {
      setPaymentError(`Payment amount cannot exceed the remaining balance of ${formatCurrency(feeStatus.balance)}`)
      toast.error("Amount Exceeds Balance", {
        description: `Payment amount cannot exceed the remaining balance of ${formatCurrency(feeStatus.balance)}.`,
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
          lineItems: lineItemsArray.length > 0 ? lineItemsArray : undefined,
        },
      })

      toast.success("Payment Recorded Successfully", {
        description: `Payment of ${formatCurrency(amount)} has been processed.`,
      })

      setPaymentDialogOpen(false)
      setPaymentAmount('')
      setReferenceNumber('')
      setPaymentRemarks('')
      setSelectedLineItems({})
      setPaymentError('')
    } catch (error) {
      setPaymentError("There was an error recording the payment")
      toast.error("Payment Failed", {
        description: "There was an error recording the payment. Please try again.",
      })
    }
  }

  const handlePayFullBalance = () => {
    if (feeStatus?.balance) {
      setPaymentAmount(formatNumberInput(feeStatus.balance.toString()))
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

    const netPayment = selectedPayment.amountPaid - selectedPayment.refundAmount

    if (amount > netPayment) {
      setRefundError(`Refund amount cannot exceed the net payment of ${formatCurrency(netPayment)}`)
      toast.error("Amount Exceeds Payment", {
        description: `Refund amount cannot exceed the net payment of ${formatCurrency(netPayment)}.`,
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

  // Check if fee template has non-refundable items
  const hasNonRefundableFees = feeStatus?.feeTemplate?.breakdowns?.some(
    (breakdown: any) => breakdown.isRefundable === false
  ) || false

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
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
        {hasNonRefundableFees && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <span className="font-medium">Non-Refundable Fees:</span> This fee template contains items that cannot be refunded. Refund functionality is disabled for payments.
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Due */}
              <div className="space-y-1">
                <p className="text-sm text-slate-600">Total Due</p>
                <p className="text-2xl font-medium text-slate-900">{formatCurrency(feeStatus?.totalDue || 0)}</p>
              </div>

              {/* Total Paid */}
              <div className="space-y-1">
                <p className="text-sm text-slate-600">Total Paid</p>
                <p className="text-2xl font-medium text-green-700">{formatCurrency(feeStatus?.totalPaid || 0)}</p>
              </div>

              {/* Balance Due */}
              <div className="space-y-1">
                <p className="text-sm text-slate-600">Balance</p>
                <p className={`text-2xl font-medium ${
                  feeStatus?.balance && feeStatus.balance > 0 ? 'text-red-700' : 'text-green-700'
                }`}>
                  {formatCurrency(feeStatus?.balance || 0)}
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
            disabled={isNotEnrolled || hasNoFeeTemplate || !feeStatus?.balance || feeStatus.balance <= 0}
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
                          <TableCell className="max-w-xs">
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
                        <TableCell className="max-w-xs">
                          <div className="space-y-2">
                            {payment.remarks && (
                              <div className="text-sm text-slate-700">{payment.remarks}</div>
                            )}
                            {payment.lineItems && payment.lineItems.length > 0 && (
                              <div className="bg-slate-50 rounded-lg p-2 space-y-1.5">
                                <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                  Line Items
                                </div>
                                {payment.lineItems.map((item: any) => (
                                  <div key={item.id} className="flex justify-between gap-3 text-xs">
                                    <span className="text-slate-700">• {item.description}</span>
                                    <span className="font-mono font-medium text-slate-900">
                                      {formatCurrency(item.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
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
                                  onClick={() => !hasNonRefundableFees && openRefundDialog(payment)}
                                  disabled={hasNonRefundableFees}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Minus className="h-3 w-3 mr-1" />
                                  Refund
                                </Button>
                                {hasNonRefundableFees && (
                                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    This is marked as a non-refundable field
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
                            <TableCell className="max-w-xs">
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
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Processing payment for {student?.fullName}
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto space-y-4">
              {/* Balance Info */}
              {feeStatus && feeStatus.balance > 0 && (
                <div className="bg-slate-50 border rounded-lg p-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Current Balance:</span>
                    <span className="font-medium">{formatCurrency(feeStatus.balance)}</span>
                  </div>
                </div>
              )}

              {/* Line Items Selection */}
              {feeStatus?.feeTemplate?.breakdowns && feeStatus.feeTemplate.breakdowns.length > 0 && feeStatus.balance > 0 && (
                <div className="space-y-2">
                  <Label>Select Fee Items to Pay (Optional)</Label>
                  <div className="border rounded-lg divide-y max-h-[300px] overflow-y-auto">
                    {feeStatus.feeTemplate.breakdowns.map((breakdown: any) => {
                      const isSelected = selectedLineItems[breakdown.id] !== undefined
                      const selectedAmount = selectedLineItems[breakdown.id] || breakdown.amount

                      return (
                        <div key={breakdown.id} className="p-3 hover:bg-slate-50">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleLineItem(breakdown.id, breakdown.amount)}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-medium text-sm">{breakdown.description}</span>
                                <Badge variant="outline" className="text-xs shrink-0">
                                  {breakdown.category}
                                </Badge>
                              </div>
                              <div className="text-xs text-slate-600 mt-1">
                                Full Amount: {formatCurrency(breakdown.amount)}
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
                                    onChange={(e) => updateLineItemAmount(breakdown.id, parseFormattedNumber(e.target.value))}
                                    className="mt-1 h-8 text-sm font-mono"
                                  />
                                  <p className="text-xs text-slate-500 mt-1">
                                    Max: {formatCurrency(breakdown.amount)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
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
                feeStatus && feeStatus.balance <= 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <p className="text-sm font-medium text-green-800">
                      This student has fully paid all fees. No additional payments are needed.
                    </p>
                  </div>
                )
              )}

              {/* Manual Amount (only if no line items selected and balance > 0) */}
              {Object.keys(selectedLineItems).length === 0 && feeStatus && feeStatus.balance > 0 && (
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

              {feeStatus && feeStatus.balance > 0 && (
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
                }}
                disabled={recordPaymentMutation.isPending}
              >
                Cancel
              </Button>
              {feeStatus && feeStatus.balance > 0 ? (
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
                  <div className="flex justify-between items-center text-sm border-t pt-2">
                    <span className="text-slate-600 font-medium">Available to Refund:</span>
                    <span className="font-semibold">{formatCurrency(selectedPayment.amountPaid - (selectedPayment.refundAmount || 0))}</span>
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
                        Max: {formatCurrency(selectedPayment.amountPaid - (selectedPayment.refundAmount || 0))}
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
      </div>
    </div>
  )
}
