'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePaymentHistory } from '@/hooks/use-fees'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, Download, Printer, Users, TrendingUp, UserCheck, UserX, DollarSign, Receipt, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

type AcademicYear = {
  id: string
  name: string
  isActive: boolean
}

type ReportData = {
  academicYear: string
  totalStudents: number
  enrolledStudents: number
  pendingStudents: number
  transferees: number
  gradeDistribution: Array<{
    gradeLevel: string
    count: number
    male: number
    female: number
  }>
  students: Array<{
    id: string
    lrn: string | null
    fullName: string
    gender: string
    gradeLevel: string
    section: string | null
    barangay: string
    city: string
    enrollmentStatus: string
  }>
}

// Chart colors
const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  male: '#3b82f6',
  female: '#ec4899',
}

export default function ReportsPage() {
  const [selectedYearId, setSelectedYearId] = useState<string>('')
  const [activeTab, setActiveTab] = useState('enrollment')

  // Set page title
  useEffect(() => {
    document.title = '4SDA - Reports'
  }, [])

  const { data: academicYears = [] } = useQuery<AcademicYear[]>({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const response = await fetch('/api/academic-years')
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
  })

  const activeYear = academicYears.find((y) => y.isActive)

  // Fetch payment history for selected year
  const { data: paymentHistory = [] } = usePaymentHistory({
    academicYearId: selectedYearId || activeYear?.id,
  })

  const { data: reportData, isLoading } = useQuery<ReportData>({
    queryKey: ['report', selectedYearId],
    queryFn: async () => {
      const yearId = selectedYearId || activeYear?.id
      if (!yearId) throw new Error('No year selected')
      const response = await fetch(`/api/reports?yearId=${yearId}`)
      if (!response.ok) throw new Error('Failed to fetch report')
      return response.json()
    },
    enabled: !!selectedYearId || !!activeYear,
  })

  // Calculate payment statistics
  const paymentStats = {
    totalCollected: paymentHistory.reduce((sum: number, r: any) => sum + r.totalPaid, 0),
    totalDue: paymentHistory.reduce((sum: number, r: any) => sum + r.totalDue, 0),
    paid: paymentHistory.filter((r: any) => r.paymentStatus === 'PAID').length,
    partial: paymentHistory.filter((r: any) => r.paymentStatus === 'PARTIAL').length,
    unpaid: paymentHistory.filter((r: any) => r.paymentStatus === 'UNPAID').length,
    late: paymentHistory.filter((r: any) => r.isLatePayment).length,
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount)
  }

  // Prepare payment status data for pie chart
  const paymentStatusData = [
    { name: 'Paid', value: paymentStats.paid },
    { name: 'Partial', value: paymentStats.partial },
    { name: 'Unpaid', value: paymentStats.unpaid },
  ].filter(item => item.value > 0)

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    if (!reportData) return

    // Create CSV content
    const headers = ['LRN', 'Name', 'Gender', 'Grade Level', 'Section', 'Barangay', 'City', 'Status']
    const rows = reportData.students.map((s) => [
      s.lrn || 'N/A',
      s.fullName,
      s.gender,
      s.gradeLevel,
      s.section || 'N/A',
      s.barangay,
      s.city,
      s.enrollmentStatus,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `enrollment-report-${reportData.academicYear}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast.success('Report exported successfully!')
  }

  // Prepare enrollment status data for pie chart
  const enrollmentStatusData = reportData
    ? [
        { name: 'Enrolled', value: reportData.enrolledStudents },
        { name: 'Pending', value: reportData.pendingStudents },
      ]
    : []

  // Prepare gender distribution data
  const genderData = reportData
    ? [
        {
          name: 'Male',
          value: reportData.gradeDistribution.reduce((sum, g) => sum + g.male, 0),
        },
        {
          name: 'Female',
          value: reportData.gradeDistribution.reduce((sum, g) => sum + g.female, 0),
        },
      ]
    : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
          <p className="text-muted-foreground">
            View enrollment and payment analytics
          </p>
        </div>
        <div className="flex gap-2 print:hidden">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleExportCSV} disabled={!reportData} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Year Selector */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-lg">Select Academic Year</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="year">Academic Year</Label>
              <Select
                value={selectedYearId || activeYear?.id}
                onValueChange={setSelectedYearId}
              >
                <SelectTrigger id="year">
                  <SelectValue placeholder="Select year..." />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name} {year.isActive && '(Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {activeYear && (
              <Button
                variant="outline"
                onClick={() => setSelectedYearId(activeYear.id)}
              >
                Use Current Year
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">Loading report...</p>
            </div>
          </CardContent>
        </Card>
      ) : reportData ? (
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="enrollment">
                <Users className="h-4 w-4 mr-2" />
                Enrollment Reports
              </TabsTrigger>
              <TabsTrigger value="payment">
                <DollarSign className="h-4 w-4 mr-2" />
                Payment Reports
              </TabsTrigger>
            </TabsList>

            <TabsContent value="enrollment" className="space-y-6">
              {/* Report Header */}
              <Card className="border-none bg-gradient-to-r from-blue-600 to-indigo-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <FileText className="h-5 w-5" />
                    Enrollment Report - SY {reportData.academicYear}
                  </CardTitle>
                  <CardDescription className="text-blue-100">
                    Generated on {new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </CardDescription>
                </CardHeader>
              </Card>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Students
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.totalStudents}
                </div>
                <p className="text-xs text-muted-foreground mt-1">All enrolled students</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Enrolled
                  </CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reportData.enrolledStudents}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {reportData.totalStudents > 0
                    ? Math.round((reportData.enrolledStudents / reportData.totalStudents) * 100)
                    : 0}% of total
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-yellow-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending
                  </CardTitle>
                  <UserX className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {reportData.pendingStudents}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {reportData.totalStudents > 0
                    ? Math.round((reportData.pendingStudents / reportData.totalStudents) * 100)
                    : 0}% of total
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Transferees
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {reportData.transferees}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {reportData.totalStudents > 0
                    ? Math.round((reportData.transferees / reportData.totalStudents) * 100)
                    : 0}% of total
                </p>
              </CardContent>
            </Card>
          </div>

              {/* Enrollment Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Enrollment Status Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Enrollment Status Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={enrollmentStatusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(props: any) => {
                            const { name, percent } = props;
                            return `${name}: ${(percent * 100).toFixed(0)}%`;
                          }}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill={COLORS.success} />
                          <Cell fill={COLORS.warning} />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Gender Distribution Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Gender Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={genderData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(props: any) => {
                            const { name, percent } = props;
                            return `${name}: ${(percent * 100).toFixed(0)}%`;
                          }}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          <Cell fill={COLORS.male} />
                          <Cell fill={COLORS.female} />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Grade Distribution Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Students by Grade Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={reportData.gradeDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="gradeLevel" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="male" fill={COLORS.male} name="Male" />
                      <Bar dataKey="female" fill={COLORS.female} name="Female" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="payment" className="space-y-6">
              {/* Payment Report Header */}
              <Card className="border-none bg-gradient-to-r from-green-600 to-emerald-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <DollarSign className="h-5 w-5" />
                    Payment Statistics - SY {reportData?.academicYear}
                  </CardTitle>
                  <CardDescription className="text-green-100">
                    Generated on {new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Payment Statistics */}
              {paymentHistory.length > 0 ? (
                <>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Collected
                      </CardTitle>
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(paymentStats.totalCollected)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">From all students</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Total Due
                      </CardTitle>
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(paymentStats.totalDue)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {paymentStats.totalDue > 0
                        ? Math.round((paymentStats.totalCollected / paymentStats.totalDue) * 100)
                        : 0}% collected
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-green-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Fully Paid
                      </CardTitle>
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {paymentStats.paid}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {paymentHistory.length > 0
                        ? Math.round((paymentStats.paid / paymentHistory.length) * 100)
                        : 0}% of students
                    </p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Late Payments
                      </CardTitle>
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {paymentStats.late}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Need attention</p>
                  </CardContent>
                </Card>
              </div>

                  {/* Payment Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Payment Status Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={paymentStatusData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(props: any) => {
                              const { name, percent } = props;
                              return `${name}: ${(percent * 100).toFixed(0)}%`;
                            }}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            <Cell fill={COLORS.success} />
                            <Cell fill={COLORS.warning} />
                            <Cell fill={COLORS.danger} />
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <DollarSign className="h-12 w-12 text-muted-foreground" />
                      <p className="text-muted-foreground">No payment data available for this academic year</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center gap-2">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Select an academic year to view reports</p>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  )
}
