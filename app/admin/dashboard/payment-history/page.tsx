'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
import { Badge } from '@/components/ui/badge'
import { Loader2, DollarSign, Eye, CheckCircle2, Clock, AlertCircle, Search, X } from 'lucide-react'
import { useActiveAcademicYear } from '@/hooks/use-academic-years'
import { usePaymentHistory } from '@/hooks/use-fees'
import { format, differenceInDays } from 'date-fns'

const GRADE_LEVELS = [
  'All Grades',
  'Kinder 1',
  'Kinder 2',
  'Grade 1',
  'Grade 2',
  'Grade 3',
  'Grade 4',
  'Grade 5',
  'Grade 6',
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
]

export default function PaymentHistoryPage() {
  const router = useRouter()
  const [gradeFilter, setGradeFilter] = useState('All Grades')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [netPaymentFilter, setNetPaymentFilter] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  const { data: activeYear } = useActiveAcademicYear()
  const { data: paymentHistory = [], isLoading } = usePaymentHistory({
    academicYearId: activeYear?.id,
    gradeLevel: gradeFilter,
    paymentStatus: statusFilter,
  })

  // Set page title
  useEffect(() => {
    document.title = '4SDA - Payment History'
  }, [])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Filter by search query and net payment (client-side)
  const filteredPaymentHistory = useMemo(() => {
    let filtered = paymentHistory

    // Apply search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase()
      filtered = filtered.filter((record: any) => {
        const fullName = record.student.fullName.toLowerCase()
        const contact = record.student.contactNumber.toLowerCase()
        return fullName.includes(searchLower) || contact.includes(searchLower)
      })
    }

    // Apply net payment filter
    if (netPaymentFilter !== 'ALL') {
      filtered = filtered.filter((record: any) => {
        const netPayment = record.totalPaid - (record.totalAdjustments || 0)

        switch (netPaymentFilter) {
          case 'POSITIVE':
            return netPayment > 0
          case 'ZERO':
            return netPayment === 0
          case 'WITH_REFUNDS':
            return record.totalAdjustments && record.totalAdjustments < 0
          default:
            return true
        }
      })
    }

    return filtered
  }, [paymentHistory, debouncedSearch, netPaymentFilter])

  // Calculate days overdue
  const getDaysOverdue = (record: any) => {
    if (!record.isLatePayment || !record.lateSince) return 0
    return differenceInDays(new Date(), new Date(record.lateSince))
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      PAID: { color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle2 },
      PARTIAL: { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock },
      UNPAID: { color: 'bg-red-100 text-red-700 border-red-300', icon: AlertCircle },
      OVERPAID: { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: DollarSign },
    }
    const config = variants[status] || variants.UNPAID
    const Icon = config.icon

    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const getEnrollmentStatusBadge = (status: string | null | undefined) => {
    // Default to PENDING if no enrollment status for current year
    const displayStatus = status || 'PENDING'

    const variants: Record<string, string> = {
      ENROLLED: 'bg-green-100 text-green-700 border-green-300',
      PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      TRANSFERRED: 'bg-blue-100 text-blue-700 border-blue-300',
      DROPPED: 'bg-gray-100 text-gray-700 border-gray-300',
    }

    return (
      <Badge variant="outline" className={variants[displayStatus] || 'bg-gray-100 text-gray-700 border-gray-300'}>
        {displayStatus}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount)
  }

  // Group by grade level (using filtered data)
  const groupedByGrade = filteredPaymentHistory.reduce((acc: any, record: any) => {
    const grade = record.student.gradeLevel
    if (!acc[grade]) {
      acc[grade] = []
    }
    acc[grade].push(record)
    return acc
  }, {})

  // Calculate statistics (using filtered data, excluding non-enrolled students from payment totals)
  const enrolledRecords = filteredPaymentHistory.filter((r: any) => r.currentYearEnrollmentStatus === 'ENROLLED')

  const stats = {
    total: filteredPaymentHistory.length,
    paid: enrolledRecords.filter((r: any) => r.paymentStatus === 'PAID').length,
    partial: enrolledRecords.filter((r: any) => r.paymentStatus === 'PARTIAL').length,
    unpaid: enrolledRecords.filter((r: any) => r.paymentStatus === 'UNPAID').length,
    late: enrolledRecords.filter((r: any) => r.isLatePayment).length,
    totalCollected: enrolledRecords.reduce((sum: number, r: any) => sum + r.totalPaid, 0),
    totalDue: enrolledRecords.reduce((sum: number, r: any) => sum + r.totalDue, 0),
  }

  if (!activeYear) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">No active academic year found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
        <p className="text-gray-600 mt-1">
          View all students' payment status for {activeYear.name}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-700">Fully Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-yellow-700">Partial</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{stats.partial}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-700">Unpaid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">{stats.unpaid}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-700">Late Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{stats.late}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalCollected)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Due</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold">{formatCurrency(stats.totalDue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="search"
                  placeholder="Search by name or contact..."
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
            </div>

            {/* Grade Filter */}
            <div className="flex-1">
              <Label htmlFor="grade">Grade Level</Label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger id="grade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GRADE_LEVELS.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="flex-1">
              <Label htmlFor="status">Payment Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                  <SelectItem value="OVERPAID">Overpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Net Payment Filter */}
            <div className="flex-1">
              <Label htmlFor="netPayment">Net Payment</Label>
              <Select value={netPaymentFilter} onValueChange={setNetPaymentFilter}>
                <SelectTrigger id="netPayment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Payments</SelectItem>
                  <SelectItem value="POSITIVE">With Payments</SelectItem>
                  <SelectItem value="ZERO">Zero Balance</SelectItem>
                  <SelectItem value="WITH_REFUNDS">With Refunds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Records */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : paymentHistory.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            No payment records found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByGrade).map(([grade, records]: [string, any]) => (
            <Card key={grade}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {grade} ({records.length} students)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Enrollment Status</TableHead>
                      <TableHead className="text-right">Total Due</TableHead>
                      <TableHead className="text-right">Total Paid</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead>Last Payment</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((record: any) => {
                      const daysOverdue = getDaysOverdue(record)
                      const isNotEnrolled = record.currentYearEnrollmentStatus !== 'ENROLLED'

                      return (
                        <TableRow key={record.id} className={record.isLatePayment && !isNotEnrolled ? 'bg-red-50' : ''}>
                          <TableCell className="font-medium">
                            {record.student.fullName}
                            {record.isLatePayment && !isNotEnrolled && (
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="destructive" className="text-xs">
                                  LATE
                                </Badge>
                                {daysOverdue > 0 && (
                                  <span className="text-xs text-red-600 font-medium">
                                    {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
                                  </span>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {record.student.contactNumber}
                          </TableCell>
                          <TableCell>
                            {getEnrollmentStatusBadge(record.currentYearEnrollmentStatus)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {isNotEnrolled ? '-' : formatCurrency(record.totalDue)}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            {isNotEnrolled ? '-' : formatCurrency(record.totalPaid)}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${
                            isNotEnrolled ? '' : record.balance > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {isNotEnrolled ? '-' : formatCurrency(record.balance)}
                          </TableCell>
                          <TableCell>
                            {isNotEnrolled ? '-' : getStatusBadge(record.paymentStatus)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {isNotEnrolled ? '-' : record.lastPaymentDate
                              ? format(new Date(record.lastPaymentDate), 'PP')
                              : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/dashboard/students/${record.student.id}/payments`)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
