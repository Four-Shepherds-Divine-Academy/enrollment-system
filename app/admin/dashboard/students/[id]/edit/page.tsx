'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { studentSchema } from '@/lib/validations/student'
import { z } from 'zod'
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
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useStudent, useUpdateStudent } from '@/hooks/use-students'
import { useSections } from '@/hooks/use-sections'
import { usePhLocations } from '@/hooks/use-ph-locations'
import { StudentRemarksField } from '@/components/student-remarks-field'

type StudentFormData = z.infer<typeof studentSchema>

type Student = StudentFormData & {
  id: string
  fullName: string
  createdAt: string
  updatedAt: string
}

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

export default function EditStudentPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string
  const [sectionValue, setSectionValue] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<StudentFormData>({
    // @ts-expect-error - Type mismatch between duplicate react-hook-form types in node_modules
    resolver: zodResolver(studentSchema),
  })

  const isTransferee = watch('isTransferee')
  const selectedGradeLevel = watch('gradeLevel')

  // React Query hooks
  const { data: student, isLoading } = useStudent(studentId)
  const updateMutation = useUpdateStudent()
  const { data: sections = [], isLoading: loadingSections } = useSections({
    gradeLevel: selectedGradeLevel || '',
    status: 'active',
  })

  // Philippine locations hook
  const {
    provinces,
    cities,
    barangays,
    selectedProvince,
    selectedCity,
    setSelectedProvince,
    setSelectedCity,
  } = usePhLocations()

  // Populate form when student data is loaded
  useEffect(() => {
    if (student) {
      // Set basic fields first
      Object.entries(student).forEach(([key, value]) => {
        if (key === 'dateOfBirth') {
          setValue(key as any, new Date(value).toISOString().split('T')[0])
        } else if (key === 'section') {
          // Skip section here, we'll handle it separately
          return
        } else if (key in studentSchema.shape) {
          setValue(key as any, value ?? '')
        }
      })

      // Handle section separately - set the section ID if it exists
      if (student.section && typeof student.section === 'object') {
        const secId = student.section.id
        setValue('section', secId)
        setSectionValue(secId)
      } else if (student.sectionId) {
        setValue('section', student.sectionId)
        setSectionValue(student.sectionId)
      }

      // Initialize location dropdowns based on student data
      if (student.province) {
        const province = provinces.find(p => p.name === student.province)
        if (province) {
          setSelectedProvince(province.code)
        }
      }
      if (student.city) {
        const city = cities.find(c => c.name === student.city)
        if (city) {
          setSelectedCity(city.code)
        }
      }
    }
  }, [student, setValue, provinces, cities, setSelectedProvince, setSelectedCity])

  const onSubmit = (data: StudentFormData) => {
    updateMutation.mutate(
      { id: studentId, data },
      {
        onSuccess: () => {
          toast.success('Student updated successfully')
          router.push('/admin/dashboard/students')
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin/dashboard/students')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Student</h2>
            <p className="text-sm text-gray-600 mt-1">Update student information</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/admin/dashboard/students')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="edit-student-form"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {updateMutation.isPending ? 'Updating...' : 'Update Student'}
          </Button>
        </div>
      </div>

      <form id="edit-student-form" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-lg">Student Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <h3 className="font-semibold text-base text-gray-900">Personal Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="firstName" {...register('firstName')} className="h-10" />
                  {errors.firstName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="middleName" className="text-sm font-medium">Middle Name</Label>
                  <Input id="middleName" {...register('middleName')} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="lastName" {...register('lastName')} className="h-10" />
                  {errors.lastName && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="lrn" className="text-sm font-medium">LRN</Label>
                  <Input id="lrn" {...register('lrn')} className="h-10 font-mono" />
                  {errors.lrn && (
                    <p className="text-xs text-red-500 mt-1">{errors.lrn.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium">
                    Gender <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => setValue('gender', value as any)}
                    defaultValue={student?.gender}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.gender.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth" className="text-sm font-medium">
                    Date of Birth <span className="text-red-500">*</span>
                  </Label>
                  <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} className="h-10" />
                  {errors.dateOfBirth && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.dateOfBirth.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <h3 className="font-semibold text-base text-gray-900">Address Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="houseNumber" className="text-sm font-medium">House Number</Label>
                  <Input id="houseNumber" {...register('houseNumber')} className="h-10" placeholder="e.g., Lot 123 or Unit 4B" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="street" className="text-sm font-medium">Street</Label>
                  <Input id="street" {...register('street')} className="h-10" placeholder="e.g., Rizal Street" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subdivision" className="text-sm font-medium">Subdivision</Label>
                  <Input id="subdivision" {...register('subdivision')} className="h-10" placeholder="e.g., Green Valley" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="province" className="text-sm font-medium">
                    Province <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedProvince}
                    onValueChange={(value) => {
                      setSelectedProvince(value)
                      const province = provinces.find(p => p.code === value)
                      setValue('province', province?.name || '')
                      setValue('city', '')
                      setValue('barangay', '')
                      setSelectedCity('')
                    }}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province.code} value={province.code}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.province && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.province.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm font-medium">
                    City / Municipality <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedCity}
                    onValueChange={(value) => {
                      setSelectedCity(value)
                      const city = cities.find(c => c.code === value)
                      setValue('city', city?.name || '')
                      setValue('barangay', '')
                    }}
                    disabled={!selectedProvince}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder={!selectedProvince ? "Select province first" : "Select city"} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.code} value={city.code}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.city && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.city.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barangay" className="text-sm font-medium">
                    Barangay <span className="text-red-500">*</span>
                  </Label>
                  {barangays.length > 0 ? (
                    <Select
                      value={barangays.find(b => b.name === watch('barangay'))?.code || ''}
                      onValueChange={(value) => {
                        const barangay = barangays.find(b => b.code === value)
                        setValue('barangay', barangay?.name || '')
                      }}
                    >
                      <SelectTrigger className="h-10 w-full">
                        <SelectValue placeholder="Select barangay" />
                      </SelectTrigger>
                      <SelectContent>
                        {barangays.map((barangay) => (
                          <SelectItem key={barangay.code} value={barangay.code}>
                            {barangay.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="barangay"
                      {...register('barangay')}
                      className="h-10"
                      placeholder={!selectedCity ? "Select city first" : "Enter barangay"}
                      disabled={!selectedCity}
                    />
                  )}
                  {errors.barangay && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.barangay.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input id="zipCode" {...register('zipCode')} />
                </div>
              </div>
            </div>

            {/* Contact & Guardian */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <h3 className="font-semibold text-base text-gray-900">Contact & Guardian Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="contactNumber">
                    Contact Number <span className="text-red-500">*</span>
                  </Label>
                  <Input id="contactNumber" {...register('contactNumber')} />
                  {errors.contactNumber && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.contactNumber.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="parentGuardian">
                    Parent/Guardian <span className="text-red-500">*</span>
                  </Label>
                  <Input id="parentGuardian" {...register('parentGuardian')} />
                  {errors.parentGuardian && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.parentGuardian.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Enrollment Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <h3 className="font-semibold text-base text-gray-900">Enrollment Details</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="gradeLevel">
                    Grade Level <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => setValue('gradeLevel', value)}
                    defaultValue={student?.gradeLevel}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Select grade level" />
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
                    <p className="text-sm text-red-500 mt-1">
                      {errors.gradeLevel.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="section">Section</Label>
                  <Select
                    onValueChange={(value) => {
                      setValue('section', value)
                      setSectionValue(value)
                    }}
                    value={sectionValue || undefined}
                    disabled={!selectedGradeLevel || loadingSections}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue
                        placeholder={
                          !selectedGradeLevel
                            ? "Select grade level first"
                            : loadingSections
                            ? "Loading sections..."
                            : sections.length === 0
                            ? "No sections available"
                            : "Select section"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.map((section: any) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!selectedGradeLevel && (
                    <p className="text-sm text-gray-500 mt-1">
                      Please select a grade level to view available sections
                    </p>
                  )}
                  {selectedGradeLevel && sections.length === 0 && !loadingSections && (
                    <p className="text-sm text-gray-500 mt-1">
                      No sections configured for this grade level
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="enrollmentStatus">
                    Enrollment Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => setValue('enrollmentStatus', value as any)}
                    defaultValue={student?.enrollmentStatus}
                  >
                    <SelectTrigger className="h-10 w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ENROLLED">Enrolled</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                      <SelectItem value="DROPPED">Dropped</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.enrollmentStatus && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.enrollmentStatus.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isTransferee"
                  checked={isTransferee}
                  onCheckedChange={(checked) =>
                    setValue('isTransferee', checked as boolean)
                  }
                />
                <Label htmlFor="isTransferee" className="cursor-pointer">
                  Is Transferee?
                </Label>
              </div>

              {isTransferee && (
                <div>
                  <Label htmlFor="previousSchool">Previous School</Label>
                  <Input
                    id="previousSchool"
                    {...register('previousSchool')}
                    placeholder="Enter previous school name"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <StudentRemarksField
                  value={watch('remarks') || ''}
                  onChange={(value) => setValue('remarks', value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
