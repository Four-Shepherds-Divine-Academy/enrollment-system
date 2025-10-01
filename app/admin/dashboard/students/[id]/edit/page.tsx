'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
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
import { ArrowLeft } from 'lucide-react'

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

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
  })

  const isTransferee = watch('isTransferee')

  // Fetch student data
  const { data: student, isLoading } = useQuery<Student>({
    queryKey: ['student', studentId],
    queryFn: async () => {
      const response = await fetch(`/api/students/${studentId}`)
      if (!response.ok) throw new Error('Failed to fetch student')
      return response.json()
    },
  })

  // Populate form when student data is loaded
  useEffect(() => {
    if (student) {
      Object.entries(student).forEach(([key, value]) => {
        if (key === 'dateOfBirth') {
          setValue(key as any, new Date(value).toISOString().split('T')[0])
        } else if (key in studentSchema.shape) {
          setValue(key as any, value ?? '')
        }
      })
    }
  }, [student, setValue])

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: StudentFormData) => {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update student')
      }
      return response.json()
    },
    onSuccess: () => {
      toast.success('Student updated successfully')
      router.push('/admin/dashboard/students')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const onSubmit = (data: StudentFormData) => {
    updateMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/dashboard/students')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Students
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Edit Student</h2>
          <p className="text-gray-600 mt-1">Update student information</p>
        </div>
        <div className="flex gap-4">
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
            {updateMutation.isPending ? 'Updating...' : 'Update Student'}
          </Button>
        </div>
      </div>

      <form id="edit-student-form" onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="firstName">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="firstName" {...register('firstName')} />
                  {errors.firstName && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="middleName">Middle Name</Label>
                  <Input id="middleName" {...register('middleName')} />
                </div>
                <div>
                  <Label htmlFor="lastName">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input id="lastName" {...register('lastName')} />
                  {errors.lastName && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="lrn">LRN</Label>
                  <Input id="lrn" {...register('lrn')} />
                  {errors.lrn && (
                    <p className="text-sm text-red-500 mt-1">{errors.lrn.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="gender">
                    Gender <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => setValue('gender', value as any)}
                    defaultValue={student?.gender}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.gender && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.gender.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">
                    Date of Birth <span className="text-red-500">*</span>
                  </Label>
                  <Input id="dateOfBirth" type="date" {...register('dateOfBirth')} />
                  {errors.dateOfBirth && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.dateOfBirth.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="houseNumber">House Number</Label>
                  <Input id="houseNumber" {...register('houseNumber')} />
                </div>
                <div>
                  <Label htmlFor="street">Street</Label>
                  <Input id="street" {...register('street')} />
                </div>
                <div>
                  <Label htmlFor="subdivision">Subdivision</Label>
                  <Input id="subdivision" {...register('subdivision')} />
                </div>
                <div>
                  <Label htmlFor="barangay">
                    Barangay <span className="text-red-500">*</span>
                  </Label>
                  <Input id="barangay" {...register('barangay')} />
                  {errors.barangay && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.barangay.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="city">
                    City <span className="text-red-500">*</span>
                  </Label>
                  <Input id="city" {...register('city')} />
                  {errors.city && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.city.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="province">
                    Province <span className="text-red-500">*</span>
                  </Label>
                  <Input id="province" {...register('province')} />
                  {errors.province && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.province.message}
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
              <h3 className="font-semibold text-lg">Contact & Guardian Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <h3 className="font-semibold text-lg">Enrollment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="gradeLevel">
                    Grade Level <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => setValue('gradeLevel', value)}
                    defaultValue={student?.gradeLevel}
                  >
                    <SelectTrigger>
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
                  <Input id="section" {...register('section')} />
                </div>
                <div>
                  <Label htmlFor="enrollmentStatus">
                    Enrollment Status <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    onValueChange={(value) => setValue('enrollmentStatus', value as any)}
                    defaultValue={student?.enrollmentStatus}
                  >
                    <SelectTrigger>
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
                <Input id="remarks" {...register('remarks')} />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
