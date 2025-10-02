'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { studentSchema, type StudentFormData } from '@/lib/validations/student'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { useState, useEffect } from 'react'

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

type ExistingStudent = {
  id: string
  lrn: string | null
  fullName: string
  dateOfBirth: Date
  gradeLevel: string
  barangay: string
  city: string
  enrollmentStatus: string
  enrollments: Array<{
    schoolYear: string
    gradeLevel: string
  }>
}

export function EnrollmentForm() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const [matchingStudents, setMatchingStudents] = useState<ExistingStudent[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [activeYear, setActiveYear] = useState<{ name: string } | null>(null)
  const [noActiveYear, setNoActiveYear] = useState(false)
  const [isPreviouslyEnrolled, setIsPreviouslyEnrolled] = useState(false)
  const [manualSearchQuery, setManualSearchQuery] = useState('')
  const [manualSearchResults, setManualSearchResults] = useState<any[]>([])
  const [isManualSearching, setIsManualSearching] = useState(false)

  // Check for active academic year
  useEffect(() => {
    const checkActiveYear = async () => {
      try {
        const response = await fetch('/api/academic-years/active')
        if (response.ok) {
          const data = await response.json()
          setActiveYear(data)
          setNoActiveYear(false)
        } else {
          setNoActiveYear(true)
        }
      } catch (_error) {
        setNoActiveYear(true)
      }
    }
    void checkActiveYear()
  }, [])

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      lrn: '',
      firstName: '',
      middleName: '',
      lastName: '',
      contactNumber: '',
      dateOfBirth: '',
      houseNumber: '',
      street: '',
      subdivision: '',
      barangay: '',
      city: '',
      province: '',
      zipCode: '',
      parentGuardian: '',
      gradeLevel: '',
      section: '',
      isTransferee: false,
      previousSchool: '',
      remarks: '',
    },
  })

  const isTransferee = form.watch('isTransferee')
  const firstName = form.watch('firstName')
  const middleName = form.watch('middleName')
  const lastName = form.watch('lastName')
  const dateOfBirth = form.watch('dateOfBirth')

  // Search for existing students when name changes (disabled when manually searching)
  useEffect(() => {
    const searchStudents = async () => {
      if (isPreviouslyEnrolled || !firstName || !lastName) {
        setMatchingStudents([])
        if (!isPreviouslyEnrolled) {
          setSelectedStudentId(null)
        }
        return
      }

      setIsSearching(true)
      try {
        const response = await fetch('/api/students/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName,
            middleName,
            lastName,
            dateOfBirth,
          }),
        })

        if (response.ok) {
          const students = await response.json()
          setMatchingStudents(students)
          if (students.length === 0) {
            setSelectedStudentId(null)
          }
        }
      } catch (error) {
        console.error('Error searching students:', error)
      } finally {
        setIsSearching(false)
      }
    }

    const debounce = setTimeout(() => void searchStudents(), 500)
    return () => clearTimeout(debounce)
  }, [firstName, middleName, lastName, dateOfBirth, isPreviouslyEnrolled])

  // Manual search for previously enrolled students
  useEffect(() => {
    if (!isPreviouslyEnrolled || manualSearchQuery.length < 2) {
      setManualSearchResults([])
      return
    }

    const searchManually = async () => {
      setIsManualSearching(true)
      try {
        const response = await fetch(`/api/students/search?q=${encodeURIComponent(manualSearchQuery)}`)
        if (response.ok) {
          const students = await response.json()
          setManualSearchResults(students)
        }
      } catch (error) {
        console.error('Error searching students:', error)
      } finally {
        setIsManualSearching(false)
      }
    }

    const debounce = setTimeout(() => void searchManually(), 500)
    return () => clearTimeout(debounce)
  }, [manualSearchQuery, isPreviouslyEnrolled])

  // Auto-fill form when manually searched student is selected
  const handleManualStudentSelect = (student: any) => {
    // Fill all form fields with existing student data
    form.setValue('lrn', student.lrn || '')
    form.setValue('firstName', student.firstName)
    form.setValue('middleName', student.middleName || '')
    form.setValue('lastName', student.lastName)
    form.setValue('gender', student.gender)
    form.setValue('dateOfBirth', new Date(student.dateOfBirth).toISOString().split('T')[0])
    form.setValue('contactNumber', student.contactNumber)
    form.setValue('houseNumber', student.houseNumber || '')
    form.setValue('street', student.street || '')
    form.setValue('subdivision', student.subdivision || '')
    form.setValue('barangay', student.barangay)
    form.setValue('city', student.city)
    form.setValue('province', student.province)
    form.setValue('zipCode', student.zipCode || '')
    form.setValue('parentGuardian', student.parentGuardian)

    // Set the selected student ID for re-enrollment
    setSelectedStudentId(student.id)
    setManualSearchResults([])
    setManualSearchQuery('')
  }

  // Auto-fill form when student is selected
  useEffect(() => {
    if (selectedStudentId) {
      const student = matchingStudents.find((s) => s.id === selectedStudentId)
      if (student) {
        // User confirmed they want to re-enroll this student
        // LRN will be used to update the existing record
        form.setValue('lrn', student.lrn || '')
      }
    }
  }, [selectedStudentId, matchingStudents, form])

  const createStudent = useMutation({
    mutationFn: async (data: StudentFormData) => {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create student')
      }

      return response.json()
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['students'] })
      form.reset()
      setMatchingStudents([])
      setSelectedStudentId(null)
      toast.success('Student enrolled successfully!', {
        description: `${data.fullName} has been enrolled for ${data.gradeLevel}`,
        duration: 5000,
      })
      setTimeout(() => {
        router.push('/admin/dashboard/students')
      }, 1000)
    },
    onError: (error) => {
      console.error('Error enrolling student:', error)
      toast.error('Failed to enroll student', {
        description: error.message || 'Please check the form and try again.',
        duration: 5000,
      })
    },
  })

  const onSubmit = (data: StudentFormData) => {
    createStudent.mutate(data)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Student Enrollment Form</CardTitle>
        {activeYear && (
          <p className="text-sm text-gray-600 mt-2">
            Enrolling for Academic Year: <span className="font-semibold">{activeYear.name}</span>
          </p>
        )}
      </CardHeader>
      <CardContent>
        {noActiveYear ? (
          <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-md text-center">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              No Active Academic Year
            </h3>
            <p className="text-yellow-700 mb-4">
              An academic year must be created before enrolling students. Please contact an
              administrator to create an academic year.
            </p>
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Previously Enrolled Checkbox */}
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="previouslyEnrolled"
                      checked={isPreviouslyEnrolled}
                      onCheckedChange={(checked) => {
                        setIsPreviouslyEnrolled(checked as boolean)
                        if (!checked) {
                          setManualSearchQuery('')
                          setManualSearchResults([])
                          setSelectedStudentId(null)
                        }
                      }}
                    />
                    <div className="space-y-1">
                      <label
                        htmlFor="previouslyEnrolled"
                        className="text-sm font-semibold text-blue-900 cursor-pointer"
                      >
                        Previously Enrolled Student
                      </label>
                      <p className="text-xs text-blue-700">
                        Check this box to search and re-enroll an existing student from a previous year
                      </p>
                    </div>
                  </div>

                  {isPreviouslyEnrolled && (
                    <div className="mt-4 space-y-3">
                      <div className="relative">
                        <Input
                          placeholder="Search by name or LRN..."
                          value={manualSearchQuery}
                          onChange={(e) => setManualSearchQuery(e.target.value)}
                          className="pr-10"
                        />
                        {isManualSearching && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>

                      {manualSearchResults.length > 0 && (
                        <div className="space-y-2 max-h-80 overflow-y-auto border rounded-md p-2 bg-white">
                          {manualSearchResults.map((student) => (
                            <button
                              key={student.id}
                              type="button"
                              onClick={() => handleManualStudentSelect(student)}
                              className="w-full text-left p-3 border rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                              <div className="font-semibold text-gray-900">
                                {student.fullName}
                              </div>
                              <div className="text-sm text-gray-600 mt-1 space-y-0.5">
                                <div>LRN: {student.lrn || 'N/A'}</div>
                                <div>Grade Level: {student.gradeLevel}</div>
                                <div>
                                  Location: {student.barangay}, {student.city}
                                </div>
                                {student.enrollments?.[0] && (
                                  <div className="text-blue-600 font-medium">
                                    Last Enrolled: {student.enrollments[0].academicYear.name} - {student.enrollments[0].gradeLevel}
                                  </div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {selectedStudentId && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-sm text-green-700 font-semibold">
                            ✓ Student selected. Update the grade level and section below, then submit to re-enroll.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Existing Student Match Warning */}
              {matchingStudents.length > 0 && !isPreviouslyEnrolled && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md space-y-3">
                <div className="flex items-start">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900">
                      Existing Student(s) Found
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      We found {matchingStudents.length} student(s) with a similar name.
                      Select one below if you're re-enrolling an existing student, or continue
                      to create a new record.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {matchingStudents.map((student) => (
                    <label
                      key={student.id}
                      className={`flex items-start p-3 border rounded-md cursor-pointer transition-colors ${
                        selectedStudentId === student.id
                          ? 'border-blue-500 bg-blue-100'
                          : 'border-gray-200 hover:border-blue-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="existingStudent"
                        value={student.id}
                        checked={selectedStudentId === student.id}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1 text-sm">
                        <div className="font-medium text-gray-900">
                          {student.fullName}
                        </div>
                        <div className="text-gray-600 mt-1 space-y-0.5">
                          <div>LRN: {student.lrn || 'N/A'}</div>
                          <div>
                            DOB: {new Date(student.dateOfBirth).toLocaleDateString()}
                          </div>
                          <div>
                            Location: {student.barangay}, {student.city}
                          </div>
                          {student.enrollments[0] && (
                            <div className="text-blue-600">
                              Last Enrolled: {student.enrollments[0].schoolYear} -{' '}
                              {student.enrollments[0].gradeLevel}
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                {selectedStudentId && (
                  <div className="text-sm text-green-700 font-medium">
                    ✓ This student will be re-enrolled with updated information
                  </div>
                )}
              </div>
            )}

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>

              <FormField
                control={form.control}
                name="lrn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LRN (Learner Reference Number)</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional" {...field} readOnly={!!selectedStudentId} />
                    </FormControl>
                    {selectedStudentId && (
                      <FormDescription className="text-blue-600">
                        Auto-filled from existing student record
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Juan" {...field} readOnly={isPreviouslyEnrolled && !!selectedStudentId} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} readOnly={isPreviouslyEnrolled && !!selectedStudentId} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Dela Cruz" {...field} readOnly={isPreviouslyEnrolled && !!selectedStudentId} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select gender" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Contact & Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact & Address Information</h3>

              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="09123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="houseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>House/Block/Lot Number</FormLabel>
                      <FormControl>
                        <Input placeholder="B31 L2" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street/Sitio</FormLabel>
                      <FormControl>
                        <Input placeholder="Sitio Maligaya" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subdivision"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subdivision/Village</FormLabel>
                      <FormControl>
                        <Input placeholder="Peace Village" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="barangay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barangay *</FormLabel>
                      <FormControl>
                        <Input placeholder="San Luis" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City/Municipality *</FormLabel>
                      <FormControl>
                        <Input placeholder="Antipolo City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="province"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Province *</FormLabel>
                      <FormControl>
                        <Input placeholder="Rizal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zipCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="1870" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Guardian Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Guardian Information</h3>

              <FormField
                control={form.control}
                name="parentGuardian"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent/Guardian Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Maria Dela Cruz" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Academic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Academic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gradeLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade Level *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select grade level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GRADE_LEVELS.map((level) => (
                            <SelectItem key={level} value={level}>
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Enthusiasm, Obedience"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isTransferee"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Is this student a transferee from another school?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {isTransferee && (
                <FormField
                  control={form.control}
                  name="previousSchool"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Previous School *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Name of previous school"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <Input placeholder="Optional remarks" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createStudent.isPending}
            >
              {createStudent.isPending ? 'Enrolling...' : 'Enroll Student'}
            </Button>
          </form>
        </Form>
        )}
      </CardContent>
    </Card>
  )
}
