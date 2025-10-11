'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
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
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  AlertCircle,
  Search,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useActiveAcademicYear } from '@/hooks/use-academic-years'
import {
  useFeeTemplates,
  useCreateFeeTemplate,
  useUpdateFeeTemplate,
  useDeleteFeeTemplate,
  useOptionalFees,
  useCreateOptionalFee,
  useUpdateOptionalFee,
  useDeleteOptionalFee,
} from '@/hooks/use-fees'

const GRADE_LEVELS = [
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

const FEE_CATEGORIES = [
  { value: 'TUITION', label: 'Tuition' },
  { value: 'BOOKS', label: 'Books' },
  { value: 'UNIFORM', label: 'Uniform' },
  { value: 'LABORATORY', label: 'Laboratory' },
  { value: 'LIBRARY', label: 'Library' },
  { value: 'ID_CARD', label: 'ID Card' },
  { value: 'EXAM', label: 'Examination' },
  { value: 'REGISTRATION', label: 'Registration' },
  { value: 'MISC', label: 'Miscellaneous' },
]

const OPTIONAL_FEE_CATEGORIES = [
  { value: 'ID_CARD', label: 'ID Card' },
  { value: 'UNIFORM', label: 'Uniform' },
  { value: 'BOOKS', label: 'Books' },
  { value: 'MISCELLANEOUS', label: 'Miscellaneous' },
  { value: 'GRADUATION', label: 'Graduation' },
  { value: 'CERTIFICATION', label: 'Certification' },
  { value: 'OTHER', label: 'Other' },
]

type Breakdown = {
  id?: string
  description: string
  amount: number
  category: string
  order: number
  isRefundable: boolean
}

export default function FeesManagementPage() {
  const [activeTab, setActiveTab] = useState('templates')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  const [templateToDelete, setTemplateToDelete] = useState<any>(null)

  // Track which template is being acted upon
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null)
  const [updatingTemplateId, setUpdatingTemplateId] = useState<string | null>(null)

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [gradeLevelFilter, setGradeLevelFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Optional fees search and filter states
  const [optionalFeeSearchQuery, setOptionalFeeSearchQuery] = useState('')
  const [debouncedOptionalFeeSearch, setDebouncedOptionalFeeSearch] = useState('')
  const [optionalFeeCategoryFilter, setOptionalFeeCategoryFilter] = useState('all')

  // Form state
  const [name, setName] = useState('')
  const [gradeLevel, setGradeLevel] = useState('')
  const [description, setDescription] = useState('')
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([])

  // Optional Fee states
  const [optionalFeeDialogOpen, setOptionalFeeDialogOpen] = useState(false)
  const [optionalFeeDeleteDialogOpen, setOptionalFeeDeleteDialogOpen] = useState(false)
  const [editingOptionalFee, setEditingOptionalFee] = useState<any>(null)
  const [optionalFeeToDelete, setOptionalFeeToDelete] = useState<any>(null)
  const [deletingOptionalFeeId, setDeletingOptionalFeeId] = useState<string | null>(null)

  // Optional Fee form state
  const [optionalFeeName, setOptionalFeeName] = useState('')
  const [optionalFeeDescription, setOptionalFeeDescription] = useState('')
  const [optionalFeeAmount, setOptionalFeeAmount] = useState<number | null>(null)
  const [optionalFeeCategory, setOptionalFeeCategory] = useState('OTHER')
  const [hasVariations, setHasVariations] = useState(false)
  const [variations, setVariations] = useState<Array<{ id?: string; name: string; amount: number }>>([])
  const [applicableGradeLevels, setApplicableGradeLevels] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)

  // Validation errors
  const [errors, setErrors] = useState<{
    name?: string
    gradeLevel?: string
    breakdowns?: { [key: number]: { description?: string; amount?: string } }
  }>({})

  // Set page title
  useEffect(() => {
    document.title = '4SDA - Fee Management'
  }, [])

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Debounce optional fee search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOptionalFeeSearch(optionalFeeSearchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [optionalFeeSearchQuery])

  const { data: activeYear } = useActiveAcademicYear()
  const { data: templates = [], isLoading, isFetching } = useFeeTemplates({
    academicYearId: activeYear?.id,
    search: debouncedSearch || undefined,
    gradeLevel: gradeLevelFilter !== 'all' ? gradeLevelFilter : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
  })

  const { data: optionalFees = [], isLoading: isLoadingOptionalFees } = useOptionalFees({
    academicYearId: activeYear?.id,
    search: debouncedOptionalFeeSearch || undefined,
    category: optionalFeeCategoryFilter !== 'all' ? optionalFeeCategoryFilter : undefined,
    isActive: undefined,
  })

  const createMutation = useCreateFeeTemplate()
  const updateMutation = useUpdateFeeTemplate()
  const deleteMutation = useDeleteFeeTemplate()

  const createOptionalFeeMutation = useCreateOptionalFee()
  const updateOptionalFeeMutation = useUpdateOptionalFee()
  const deleteOptionalFeeMutation = useDeleteOptionalFee()

  const addBreakdown = () => {
    setBreakdowns([
      ...breakdowns,
      {
        description: '',
        amount: 0,
        category: 'TUITION',
        order: breakdowns.length,
        isRefundable: true,
      },
    ])
  }

  const removeBreakdown = (index: number) => {
    setBreakdowns(breakdowns.filter((_, i) => i !== index))
  }

  const updateBreakdown = (index: number, field: string, value: any) => {
    const updated = [...breakdowns]
    updated[index] = { ...updated[index], [field]: value }
    setBreakdowns(updated)
  }

  const calculateTotal = () => {
    return breakdowns.reduce((sum, b) => sum + (parseFloat(b.amount as any) || 0), 0)
  }

  const handleOpenDialog = (template?: any) => {
    if (template) {
      setEditingTemplate(template)
      setName(template.name)
      setGradeLevel(template.gradeLevel)
      setDescription(template.description || '')
      setBreakdowns(
        template.breakdowns.map((b: any) => ({
          id: b.id,
          description: b.description,
          amount: b.amount,
          category: b.category,
          order: b.order,
        }))
      )
    } else {
      setEditingTemplate(null)
      setName('')
      setGradeLevel('')
      setDescription('')
      setBreakdowns([])
    }
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingTemplate(null)
    setName('')
    setGradeLevel('')
    setDescription('')
    setBreakdowns([])
    setErrors({})
  }

  const validateForm = () => {
    const newErrors: typeof errors = {}

    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Template name is required'
    }

    // Validate grade level
    if (!gradeLevel) {
      newErrors.gradeLevel = 'Grade level is required'
    }

    // Check if we have at least one breakdown
    if (breakdowns.length === 0) {
      toast.error('Please add at least one fee breakdown item')
      setErrors(newErrors)
      return false
    }

    // Validate breakdowns
    const breakdownErrors: { [key: number]: { description?: string; amount?: string } } = {}
    breakdowns.forEach((breakdown, index) => {
      const itemErrors: { description?: string; amount?: string } = {}

      if (!breakdown.description.trim()) {
        itemErrors.description = 'Description is required'
      }

      const amount = parseFloat(breakdown.amount as any)
      if (isNaN(amount) || amount <= 0) {
        itemErrors.amount = 'Amount must be greater than 0'
      }

      if (Object.keys(itemErrors).length > 0) {
        breakdownErrors[index] = itemErrors
      }
    })

    if (Object.keys(breakdownErrors).length > 0) {
      newErrors.breakdowns = breakdownErrors
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!activeYear) {
      toast.error('No active academic year found')
      return
    }

    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors in the form')
      return
    }

    // Filter out empty breakdowns
    const validBreakdowns = breakdowns.filter(
      (b) => b.description.trim() !== '' && parseFloat(b.amount as any) > 0
    )

    const data = {
      name,
      gradeLevel,
      academicYearId: activeYear.id,
      description,
      totalAmount: calculateTotal(),
      breakdowns: validBreakdowns.map((b, index) => ({
        description: b.description,
        amount: parseFloat(b.amount as any),
        category: b.category,
        order: index,
      })),
    }

    if (editingTemplate) {
      setUpdatingTemplateId(editingTemplate.id)
      try {
        await updateMutation.mutateAsync({
          id: editingTemplate.id,
          data,
        })
        handleCloseDialog()
      } finally {
        setUpdatingTemplateId(null)
      }
    } else {
      await createMutation.mutateAsync(data)
      handleCloseDialog()
    }
  }

  const handleDelete = async () => {
    if (templateToDelete) {
      setDeletingTemplateId(templateToDelete.id)
      try {
        await deleteMutation.mutateAsync(templateToDelete.id)
        setDeleteDialogOpen(false)
        setTemplateToDelete(null)
      } finally {
        setDeletingTemplateId(null)
      }
    }
  }

  // Optional fee handlers
  const handleOpenOptionalFeeDialog = (fee?: any) => {
    if (fee) {
      setEditingOptionalFee(fee)
      setOptionalFeeName(fee.name)
      setOptionalFeeDescription(fee.description || '')
      setOptionalFeeAmount(fee.amount)
      setOptionalFeeCategory(fee.category)
      setHasVariations(fee.hasVariations)
      setVariations(fee.variations || [])
      setApplicableGradeLevels(fee.applicableGradeLevels || [])
      setIsActive(fee.isActive)
    } else {
      setEditingOptionalFee(null)
      setOptionalFeeName('')
      setOptionalFeeDescription('')
      setOptionalFeeAmount(null)
      setOptionalFeeCategory('OTHER')
      setHasVariations(false)
      setVariations([])
      setApplicableGradeLevels([])
      setIsActive(true)
    }
    setOptionalFeeDialogOpen(true)
  }

  const handleCloseOptionalFeeDialog = () => {
    setOptionalFeeDialogOpen(false)
    setEditingOptionalFee(null)
    setOptionalFeeName('')
    setOptionalFeeDescription('')
    setOptionalFeeAmount(null)
    setOptionalFeeCategory('OTHER')
    setHasVariations(false)
    setVariations([])
    setApplicableGradeLevels([])
    setIsActive(true)
  }

  const handleSaveOptionalFee = async () => {
    if (!activeYear) {
      toast.error('No active academic year found')
      return
    }

    if (!optionalFeeName.trim()) {
      toast.error('Please enter a name for the optional fee')
      return
    }

    if (!hasVariations && (optionalFeeAmount === null || optionalFeeAmount <= 0)) {
      toast.error('Please enter a valid amount')
      return
    }

    if (hasVariations && variations.length === 0) {
      toast.error('Please add at least one variation')
      return
    }

    const data = {
      name: optionalFeeName,
      description: optionalFeeDescription,
      amount: hasVariations ? null : optionalFeeAmount,
      category: optionalFeeCategory,
      hasVariations,
      variations: hasVariations ? variations : [],
      applicableGradeLevels,
      academicYearId: activeYear.id,
      isActive,
    }

    try {
      if (editingOptionalFee) {
        await updateOptionalFeeMutation.mutateAsync({
          id: editingOptionalFee.id,
          data,
        })
      } else {
        await createOptionalFeeMutation.mutateAsync(data)
      }
      handleCloseOptionalFeeDialog()
    } catch (error) {
      // Error handled by mutation
    }
  }

  const handleDeleteOptionalFee = async () => {
    if (optionalFeeToDelete) {
      setDeletingOptionalFeeId(optionalFeeToDelete.id)
      try {
        await deleteOptionalFeeMutation.mutateAsync(optionalFeeToDelete.id)
        setOptionalFeeDeleteDialogOpen(false)
        setOptionalFeeToDelete(null)
      } catch (error: any) {
        // Show specific error message if available
        if (error?.message) {
          toast.error(error.message)
        }
      } finally {
        setDeletingOptionalFeeId(null)
      }
    }
  }

  const addVariation = () => {
    setVariations([...variations, { name: '', amount: 0 }])
  }

  const removeVariation = (index: number) => {
    setVariations(variations.filter((_, i) => i !== index))
  }

  const updateVariation = (index: number, field: 'name' | 'amount', value: any) => {
    const updated = [...variations]
    updated[index] = { ...updated[index], [field]: value }
    setVariations(updated)
  }

  const toggleGradeLevel = (gradeLevel: string) => {
    if (applicableGradeLevels.includes(gradeLevel)) {
      setApplicableGradeLevels(applicableGradeLevels.filter((g) => g !== gradeLevel))
    } else {
      setApplicableGradeLevels([...applicableGradeLevels, gradeLevel])
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount)
  }

  const groupedTemplates = templates.reduce((acc: any, template: any) => {
    if (!acc[template.gradeLevel]) {
      acc[template.gradeLevel] = []
    }
    acc[template.gradeLevel].push(template)
    return acc
  }, {})

  if (!activeYear) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">No active academic year found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fee Management</h2>
          <p className="text-gray-600 mt-1">
            Manage fees for {activeYear.name}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="templates">Fee Templates</TabsTrigger>
          <TabsTrigger value="optional">Optional Fees</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Fee Template
            </Button>
          </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Search & Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="search"
                  placeholder="Search by name or description..."
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

            {/* Grade Level Filter */}
            <div>
              <Label htmlFor="grade-filter">Grade Level</Label>
              <Select value={gradeLevelFilter} onValueChange={setGradeLevelFilter}>
                <SelectTrigger id="grade-filter">
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {GRADE_LEVELS.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category Filter */}
            <div>
              <Label htmlFor="category-filter">Fee Category</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger id="category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {FEE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filters indicator */}
          {(debouncedSearch || gradeLevelFilter !== 'all' || categoryFilter !== 'all') && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
              <span className="font-medium">Active filters:</span>
              {debouncedSearch && <Badge variant="secondary">Search: "{debouncedSearch}"</Badge>}
              {gradeLevelFilter !== 'all' && <Badge variant="secondary">Grade: {gradeLevelFilter}</Badge>}
              {categoryFilter !== 'all' && (
                <Badge variant="secondary">
                  Category: {FEE_CATEGORIES.find(c => c.value === categoryFilter)?.label}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setGradeLevelFilter('all')
                  setCategoryFilter('all')
                }}
                className="h-6 px-2 text-xs"
              >
                Clear all
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            {(debouncedSearch || gradeLevelFilter !== 'all' || categoryFilter !== 'all') ? (
              <div className="space-y-2">
                <p className="font-medium">No results matching filters</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            ) : (
              'No fee templates created yet. Click "Create Fee Template" to get started.'
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="relative space-y-4">
          {/* Loading overlay */}
          {isFetching && !isLoading && (
            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-start justify-center pt-8">
              <div className="bg-white rounded-lg shadow-lg p-3 flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-medium">Updating...</span>
              </div>
            </div>
          )}

          {GRADE_LEVELS.map((grade) => {
            const gradeFees = groupedTemplates[grade]
            if (!gradeFees) return null

            return (
              <Card key={grade}>
                <CardHeader>
                  <CardTitle className="text-lg">{grade}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {gradeFees.map((template: any) => (
                    <div key={template.id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{template.name}</h3>
                          {template.isActive && <Badge variant="default">Active</Badge>}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(template)}
                            disabled={deletingTemplateId !== null || updatingTemplateId !== null || createMutation.isPending}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTemplateToDelete(template)
                              setDeleteDialogOpen(true)
                            }}
                            disabled={deletingTemplateId !== null || updatingTemplateId !== null || createMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>

                      {template.description && (
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      )}

                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="w-[180px]">Category</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right w-[150px]">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {template.breakdowns.map((breakdown: any) => (
                              <TableRow key={breakdown.id}>
                                <TableCell>
                                  <Badge variant="outline" className="font-normal">
                                    {breakdown.category}
                                  </Badge>
                                </TableCell>
                                <TableCell className="font-medium">{breakdown.description}</TableCell>
                                <TableCell className="text-right font-medium">
                                  {formatCurrency(breakdown.amount)}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/30 font-bold border-t-2">
                              <TableCell colSpan={2} className="text-lg">
                                Total
                              </TableCell>
                              <TableCell className="text-right text-lg">
                                {formatCurrency(template.totalAmount)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
        </TabsContent>

        <TabsContent value="optional" className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={() => handleOpenOptionalFeeDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Optional Fee
            </Button>
          </div>

          {/* Search and Filters for Optional Fees */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Search & Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search */}
                <div>
                  <Label htmlFor="optional-fee-search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="optional-fee-search"
                      placeholder="Search by name or description..."
                      value={optionalFeeSearchQuery}
                      onChange={(e) => setOptionalFeeSearchQuery(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {optionalFeeSearchQuery && (
                      <button
                        onClick={() => setOptionalFeeSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Category Filter */}
                <div>
                  <Label htmlFor="optional-fee-category-filter">Category</Label>
                  <Select
                    value={optionalFeeCategoryFilter}
                    onValueChange={setOptionalFeeCategoryFilter}
                  >
                    <SelectTrigger id="optional-fee-category-filter">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {OPTIONAL_FEE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active filters indicator */}
              {(debouncedOptionalFeeSearch || optionalFeeCategoryFilter !== 'all') && (
                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                  <span className="font-medium">Active filters:</span>
                  {debouncedOptionalFeeSearch && (
                    <Badge variant="secondary">
                      Search: "{debouncedOptionalFeeSearch}"
                    </Badge>
                  )}
                  {optionalFeeCategoryFilter !== 'all' && (
                    <Badge variant="secondary">
                      Category:{' '}
                      {OPTIONAL_FEE_CATEGORIES.find(
                        (c) => c.value === optionalFeeCategoryFilter
                      )?.label}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setOptionalFeeSearchQuery('')
                      setOptionalFeeCategoryFilter('all')
                    }}
                    className="h-6 px-2 text-xs"
                  >
                    Clear all
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {isLoadingOptionalFees ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : optionalFees.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                {debouncedOptionalFeeSearch || optionalFeeCategoryFilter !== 'all' ? (
                  <div className="space-y-2">
                    <p className="font-medium">No results matching filters</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  'No optional fees created yet. Click "Create Optional Fee" to get started.'
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="text-lg">Optional Fees</CardTitle>
                <CardDescription>
                  Optional fees that can be assigned to students
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="font-semibold w-[280px]">Name</TableHead>
                        <TableHead className="font-semibold w-[140px]">Category</TableHead>
                        <TableHead className="font-semibold w-[240px]">Amount / Variations</TableHead>
                        <TableHead className="font-semibold w-[200px]">Grade Levels</TableHead>
                        <TableHead className="font-semibold w-[100px]">Status</TableHead>
                        <TableHead className="font-semibold text-right w-[180px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {optionalFees.map((fee: any) => (
                        <TableRow
                          key={fee.id}
                          className="hover:bg-muted/40 transition-colors border-b"
                        >
                          <TableCell className="py-4">
                            <div className="space-y-1">
                              <div className="font-semibold text-base text-gray-900">
                                {fee.name}
                              </div>
                              {fee.description && (
                                <div className="text-sm text-muted-foreground line-clamp-2">
                                  {fee.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              variant="outline"
                              className="font-medium text-xs px-2.5 py-1"
                            >
                              {OPTIONAL_FEE_CATEGORIES.find((c) => c.value === fee.category)
                                ?.label || fee.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            {fee.hasVariations ? (
                              <div className="space-y-1.5">
                                {fee.variations.map((variation: any) => (
                                  <div
                                    key={variation.id}
                                    className="flex items-center gap-2 text-sm bg-slate-50 rounded px-2 py-1 border border-slate-200"
                                  >
                                    <span className="font-medium text-gray-700 min-w-[100px]">
                                      {variation.name}:
                                    </span>
                                    <span className="font-semibold text-primary">
                                      {formatCurrency(variation.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-base font-bold text-primary">
                                {formatCurrency(fee.amount)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            {fee.applicableGradeLevels.length === 0 ? (
                              <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-800 border-blue-200 font-medium"
                              >
                                All grades
                              </Badge>
                            ) : fee.applicableGradeLevels.length <= 3 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {fee.applicableGradeLevels.map((grade: string) => (
                                  <Badge
                                    key={grade}
                                    variant="secondary"
                                    className="text-xs font-medium px-2 py-0.5"
                                  >
                                    {grade}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="text-xs font-medium"
                                title={fee.applicableGradeLevels.join(', ')}
                              >
                                {fee.applicableGradeLevels.length} grades
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            {fee.isActive ? (
                              <Badge
                                variant="default"
                                className="bg-green-600 hover:bg-green-700 font-medium"
                              >
                                Active
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-gray-200 text-gray-700 font-medium"
                              >
                                Inactive
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenOptionalFeeDialog(fee)}
                                disabled={
                                  deletingOptionalFeeId !== null ||
                                  createOptionalFeeMutation.isPending ||
                                  updateOptionalFeeMutation.isPending
                                }
                                className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                              >
                                <Pencil className="h-4 w-4 mr-1.5" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setOptionalFeeToDelete(fee)
                                  setOptionalFeeDeleteDialogOpen(true)
                                }}
                                disabled={
                                  deletingOptionalFeeId === fee.id ||
                                  createOptionalFeeMutation.isPending ||
                                  updateOptionalFeeMutation.isPending
                                }
                                className="hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                              >
                                {deletingOptionalFeeId === fee.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                    Deleting...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="h-4 w-4 mr-1.5" />
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
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="!max-w-[95vw] w-[95vw] max-h-[95vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 pt-5 pb-3 border-b">
            <DialogTitle className="text-xl">
              {editingTemplate ? 'Edit Fee Template' : 'Create Fee Template'}
            </DialogTitle>
            <DialogDescription className="text-sm">
              Define the fee structure and breakdown for a specific grade level
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-4 flex-1 min-h-0 overflow-hidden flex flex-col">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className={errors.name ? 'text-red-600' : ''}>
                  Template Name *
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    if (errors.name) {
                      setErrors({ ...errors, name: undefined })
                    }
                  }}
                  placeholder="e.g., Grade 1 Tuition 2024-2025"
                  className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1">{errors.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade" className={errors.gradeLevel ? 'text-red-600' : ''}>
                  Grade Level *
                </Label>
                <Select
                  value={gradeLevel}
                  onValueChange={(value) => {
                    setGradeLevel(value)
                    if (errors.gradeLevel) {
                      setErrors({ ...errors, gradeLevel: undefined })
                    }
                  }}
                >
                  <SelectTrigger className={errors.gradeLevel ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_LEVELS.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.gradeLevel && (
                  <p className="text-xs text-red-600 mt-1">{errors.gradeLevel}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
              />
            </div>

            <Separator />

            <div className="flex-1 min-h-0 flex flex-col gap-3">
              <div className="flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 className="font-semibold text-base">Fee Breakdown</h3>
                  <p className="text-xs text-muted-foreground">
                    Add individual fee items that make up the total cost
                  </p>
                </div>
                <Button type="button" variant="default" size="sm" onClick={addBreakdown}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Line Item
                </Button>
              </div>

              {breakdowns.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-lg bg-muted/20">
                  <p className="text-muted-foreground text-sm">
                    No breakdown items yet. Click "Add Line Item" to add fees.
                  </p>
                </div>
              ) : (
                <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-2 pb-2">
                  {breakdowns.map((breakdown, index) => {
                    const hasError = errors.breakdowns?.[index]
                    return (
                      <div key={index} className="border rounded-lg p-4 bg-card">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-12 gap-4 items-start">
                              <div className="col-span-5 space-y-2">
                                <Label className={hasError?.description ? 'text-red-600' : ''}>
                                  Description *
                                </Label>
                                <Input
                                  value={breakdown.description}
                                  onChange={(e) => {
                                    updateBreakdown(index, 'description', e.target.value)
                                    if (hasError?.description) {
                                      const newErrors = { ...errors }
                                      if (newErrors.breakdowns?.[index]) {
                                        delete newErrors.breakdowns[index].description
                                        if (Object.keys(newErrors.breakdowns[index]).length === 0) {
                                          delete newErrors.breakdowns[index]
                                        }
                                      }
                                      setErrors(newErrors)
                                    }
                                  }}
                                  placeholder="e.g., Tuition Fee"
                                  className={hasError?.description ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                />
                                {hasError?.description && (
                                  <p className="text-xs text-red-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {hasError.description}
                                  </p>
                                )}
                              </div>
                              <div className="col-span-4 space-y-2">
                                <Label>Category *</Label>
                                <Select
                                  value={breakdown.category}
                                  onValueChange={(v) => updateBreakdown(index, 'category', v)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {FEE_CATEGORIES.map((cat) => (
                                      <SelectItem key={cat.value} value={cat.value}>
                                        {cat.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="col-span-3 space-y-2">
                                <Label className={hasError?.amount ? 'text-red-600' : ''}>
                                  Amount *
                                </Label>
                                <Input
                                  type="number"
                                  step="1"
                                  min="0"
                                  value={breakdown.amount}
                                  onChange={(e) => {
                                    updateBreakdown(index, 'amount', e.target.value)
                                    if (hasError?.amount) {
                                      const newErrors = { ...errors }
                                      if (newErrors.breakdowns?.[index]) {
                                        delete newErrors.breakdowns[index].amount
                                        if (Object.keys(newErrors.breakdowns[index]).length === 0) {
                                          delete newErrors.breakdowns[index]
                                        }
                                      }
                                      setErrors(newErrors)
                                    }
                                  }}
                                  placeholder="0"
                                  className={hasError?.amount ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                />
                                {hasError?.amount && (
                                  <p className="text-xs text-red-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {hasError.amount}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`refundable-${index}`}
                                checked={breakdown.isRefundable ?? true}
                                onCheckedChange={(checked) => updateBreakdown(index, 'isRefundable', checked)}
                              />
                              <Label
                                htmlFor={`refundable-${index}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                Allow refunds for this fee item
                              </Label>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBreakdown(index)}
                            className="flex-shrink-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {breakdowns.length > 0 && (
            <div className="bg-background border-t border-b border-primary/20 px-6 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-primary">₱</span>
                  <span className="text-base font-semibold">Total Fee</span>
                </div>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="px-6 py-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDialog}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="min-w-[100px]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={
                !name ||
                !gradeLevel ||
                breakdowns.length === 0 ||
                createMutation.isPending ||
                updateMutation.isPending
              }
              className="min-w-[150px]"
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Fee Template?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p>
                  Are you sure you want to delete the fee template "{templateToDelete?.name}"?
                </p>
                <p className="mt-2">
                  If you change your mind, you can restore this template within 30 days by going to the Recycle Bin.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Optional Fee Create/Edit Dialog */}
      <Dialog open={optionalFeeDialogOpen} onOpenChange={setOptionalFeeDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOptionalFee ? 'Edit Optional Fee' : 'Create Optional Fee'}
            </DialogTitle>
            <DialogDescription>
              {editingOptionalFee
                ? 'Update the details of this optional fee'
                : 'Create a new optional fee that can be assigned to students'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="optionalFeeName">Name *</Label>
                <Input
                  id="optionalFeeName"
                  value={optionalFeeName}
                  onChange={(e) => setOptionalFeeName(e.target.value)}
                  placeholder="e.g., School Uniform"
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label htmlFor="optionalFeeDescription">Description</Label>
                <Textarea
                  id="optionalFeeDescription"
                  value={optionalFeeDescription}
                  onChange={(e) => setOptionalFeeDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="optionalFeeCategory">Category *</Label>
                <Select value={optionalFeeCategory} onValueChange={setOptionalFeeCategory}>
                  <SelectTrigger id="optionalFeeCategory">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPTIONAL_FEE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={(checked) => setIsActive(checked as boolean)}
                  />
                  <Label htmlFor="isActive" className="font-normal cursor-pointer">
                    Active (available for assignment)
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            {/* Variations Toggle */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasVariations"
                  checked={hasVariations}
                  onCheckedChange={(checked) => {
                    setHasVariations(checked as boolean)
                    if (checked && variations.length === 0) {
                      setVariations([{ name: '', amount: 0 }])
                    }
                  }}
                />
                <Label htmlFor="hasVariations" className="font-normal cursor-pointer">
                  This fee has variations (e.g., different sizes or types)
                </Label>
              </div>

              {hasVariations ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Variations *</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addVariation}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Variation
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {variations.map((variation, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Input
                            value={variation.name}
                            onChange={(e) =>
                              updateVariation(index, 'name', e.target.value)
                            }
                            placeholder="e.g., Small, Medium, Large"
                          />
                        </div>
                        <div className="w-32">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={variation.amount}
                            onChange={(e) =>
                              updateVariation(
                                index,
                                'amount',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="Amount"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeVariation(index)}
                          disabled={variations.length === 1}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="optionalFeeAmount">Amount *</Label>
                  <Input
                    id="optionalFeeAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={optionalFeeAmount || ''}
                    onChange={(e) =>
                      setOptionalFeeAmount(
                        e.target.value ? parseFloat(e.target.value) : null
                      )
                    }
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Grade Levels */}
            <div className="space-y-3">
              <Label>Applicable Grade Levels (leave empty for all grades)</Label>
              <div className="grid grid-cols-3 gap-2">
                {GRADE_LEVELS.map((grade) => (
                  <div key={grade} className="flex items-center space-x-2">
                    <Checkbox
                      id={`grade-${grade}`}
                      checked={applicableGradeLevels.includes(grade)}
                      onCheckedChange={() => toggleGradeLevel(grade)}
                    />
                    <Label
                      htmlFor={`grade-${grade}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {grade}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseOptionalFeeDialog}
              disabled={
                createOptionalFeeMutation.isPending ||
                updateOptionalFeeMutation.isPending
              }
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveOptionalFee}
              disabled={
                !optionalFeeName.trim() ||
                (!hasVariations && (optionalFeeAmount === null || optionalFeeAmount <= 0)) ||
                (hasVariations && variations.length === 0) ||
                createOptionalFeeMutation.isPending ||
                updateOptionalFeeMutation.isPending
              }
            >
              {(createOptionalFeeMutation.isPending ||
                updateOptionalFeeMutation.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingOptionalFee ? 'Update Optional Fee' : 'Create Optional Fee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Optional Fee Delete Confirmation */}
      <AlertDialog
        open={optionalFeeDeleteDialogOpen}
        onOpenChange={setOptionalFeeDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Optional Fee?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Are you sure you want to delete the optional fee "
                  {optionalFeeToDelete?.name}"?
                </p>

                {optionalFeeToDelete && (
                  <div className="rounded-lg bg-muted p-3 space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Category:</span>{' '}
                      {OPTIONAL_FEE_CATEGORIES.find(
                        (c) => c.value === optionalFeeToDelete.category
                      )?.label || optionalFeeToDelete.category}
                    </div>
                    {optionalFeeToDelete.hasVariations ? (
                      <div>
                        <span className="font-medium">Variations:</span>
                        <ul className="list-disc list-inside ml-2 mt-1">
                          {optionalFeeToDelete.variations?.map((v: any) => (
                            <li key={v.id}>
                              {v.name}: {formatCurrency(v.amount)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div>
                        <span className="font-medium">Amount:</span>{' '}
                        {formatCurrency(optionalFeeToDelete.amount)}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Warning</p>
                    <p>
                      This action cannot be undone if the fee is currently assigned to
                      students. The delete will fail if there are active assignments.
                    </p>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteOptionalFeeMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteOptionalFee}
              disabled={deleteOptionalFeeMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteOptionalFeeMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
