'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
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
import { Loader2 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useActiveAcademicYear } from '@/hooks/use-academic-years'
import { useCreateStudent } from '@/hooks/use-students'
import { useSections } from '@/hooks/use-sections'
import { usePhLocations } from '@/hooks/use-ph-locations'
import { StudentRemarksField } from '@/components/student-remarks-field'

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
  const router = useRouter()
  const [matchingStudents, setMatchingStudents] = useState<ExistingStudent[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [isPreviouslyEnrolled, setIsPreviouslyEnrolled] = useState(false)
  const [manualSearchQuery, setManualSearchQuery] = useState('')
  const [manualSearchResults, setManualSearchResults] = useState<any[]>([])
  const [isManualSearching, setIsManualSearching] = useState(false)

  // Refs for form sections to enable scroll-to-error
  const personalInfoRef = useRef<HTMLDivElement>(null)
  const contactAddressRef = useRef<HTMLDivElement>(null)
  const parentGuardianRef = useRef<HTMLDivElement>(null)
  const academicInfoRef = useRef<HTMLDivElement>(null)

  // React Query hooks
  const { data: activeYear, isLoading: loadingActiveYear } = useActiveAcademicYear()
  const createMutation = useCreateStudent()

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

  const form = useForm<StudentFormData>({
    // @ts-expect-error - Complex form type inference
    resolver: zodResolver(studentSchema),
    mode: 'onBlur', // Validate on blur
    reValidateMode: 'onChange', // Re-validate on change after first validation
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
      fatherName: '',
      fatherOccupation: '',
      fatherEmployer: '',
      fatherWorkContact: '',
      fatherMonthlySalary: undefined,
      motherName: '',
      motherOccupation: '',
      motherEmployer: '',
      motherWorkContact: '',
      motherMonthlySalary: undefined,
      guardianRelationship: '',
      emergencyContactName: '',
      emergencyContactNumber: '',
      emergencyContactRelationship: '',
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
  const selectedGradeLevel = form.watch('gradeLevel')

  // Fetch sections based on selected grade level
  const { data: sections = [], isLoading: loadingSections } = useSections({
    gradeLevel: selectedGradeLevel || '',
    status: 'active',
  })

  // Clear section when grade level changes and section is not available
  useEffect(() => {
    if (selectedGradeLevel) {
      const currentSection = form.getValues('section')
      if (currentSection && !sections.find((s: any) => s.id === currentSection)) {
        form.setValue('section', '')
      }
    } else {
      form.setValue('section', '')
    }
  }, [selectedGradeLevel, sections, form])

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

  // Scroll to first error field
  const scrollToError = () => {
    const errors = form.formState.errors

    // Define field order and their corresponding refs
    const fieldSections = [
      { fields: ['lrn', 'firstName', 'middleName', 'lastName', 'gender', 'dateOfBirth'], ref: personalInfoRef },
      { fields: ['contactNumber', 'houseNumber', 'street', 'subdivision', 'barangay', 'city', 'province', 'zipCode'], ref: contactAddressRef },
      { fields: ['parentGuardian', 'fatherName', 'fatherOccupation', 'fatherEmployer', 'fatherWorkContact', 'fatherMonthlySalary', 'motherName', 'motherOccupation', 'motherEmployer', 'motherWorkContact', 'motherMonthlySalary', 'guardianRelationship', 'emergencyContactName', 'emergencyContactNumber', 'emergencyContactRelationship'], ref: parentGuardianRef },
      { fields: ['gradeLevel', 'section', 'isTransferee', 'previousSchool', 'remarks'], ref: academicInfoRef },
    ]

    // Find the first section with an error
    for (const section of fieldSections) {
      const hasError = section.fields.some(field => errors[field as keyof typeof errors])
      if (hasError && section.ref.current) {
        section.ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Add a small offset to account for sticky headers
        setTimeout(() => {
          window.scrollBy(0, -100)
        }, 300)
        break
      }
    }
  }

  const onSubmit = (data: StudentFormData) => {
    createMutation.mutate(data, {
      onSuccess: (result) => {
        form.reset()
        setMatchingStudents([])
        setSelectedStudentId(null)
        toast.success('Student enrolled successfully!', {
          description: `${result.fullName} has been enrolled for ${result.gradeLevel}`,
          duration: 5000,
        })
        setTimeout(() => {
          router.push('/admin/dashboard/students')
        }, 1000)
      },
    })
  }

  const noActiveYear = !loadingActiveYear && !activeYear

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
            <form onSubmit={form.handleSubmit(onSubmit as any, scrollToError as any)} className="space-y-6">
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
            <div ref={personalInfoRef} className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>

              <FormField
                control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
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
                  control={form.control as any}
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
            <div ref={contactAddressRef} className="space-y-4">
              <h3 className="text-lg font-semibold">Contact & Address Information</h3>

              <FormField
                control={form.control as any}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="09123456789 or +639123456789" {...field} />
                    </FormControl>
                    <FormDescription>
                      Format: 09XXXXXXXXX or +639XXXXXXXXX
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
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
                  control={form.control as any}
                  name="province"
                  render={() => (
                    <FormItem>
                      <FormLabel>Province *</FormLabel>
                      <Select
                        value={selectedProvince}
                        onValueChange={(value) => {
                          setSelectedProvince(value)
                          const province = provinces.find(p => p.code === value)
                          form.setValue('province', province?.name || '')
                          form.setValue('city', '')
                          form.setValue('barangay', '')
                          setSelectedCity('')
                        }}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select province" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {provinces.map((province) => (
                            <SelectItem key={province.code} value={province.code}>
                              {province.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="city"
                  render={() => (
                    <FormItem>
                      <FormLabel>City/Municipality *</FormLabel>
                      <Select
                        value={selectedCity}
                        onValueChange={(value) => {
                          setSelectedCity(value)
                          const city = cities.find(c => c.code === value)
                          form.setValue('city', city?.name || '')
                          form.setValue('barangay', '')
                        }}
                        disabled={!selectedProvince}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={!selectedProvince ? "Select province first" : "Select city"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cities.map((city) => (
                            <SelectItem key={city.code} value={city.code}>
                              {city.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control as any}
                  name="barangay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barangay *</FormLabel>
                      {barangays.length > 0 ? (
                        <Select
                          value={barangays.find(b => b.name === field.value)?.code || ''}
                          onValueChange={(value) => {
                            const barangay = barangays.find(b => b.code === value)
                            form.setValue('barangay', barangay?.name || '')
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select barangay" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {barangays.map((barangay) => (
                              <SelectItem key={barangay.code} value={barangay.code}>
                                {barangay.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <FormControl>
                          <Input
                            {...field}
                            placeholder={!selectedCity ? "Select city first" : "Enter barangay"}
                            disabled={!selectedCity}
                          />
                        </FormControl>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
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

            {/* Parent/Guardian Information */}
            <div ref={parentGuardianRef} className="space-y-4">
              <h3 className="text-lg font-semibold">Parent/Guardian Information</h3>

              <FormField
                control={form.control as any}
                name="parentGuardian"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent/Guardian Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Maria Dela Cruz" {...field} />
                    </FormControl>
                    <FormDescription>
                      Primary contact person for this student
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Father's Information */}
              <div className="pt-4 border-t">
                <h4 className="text-md font-semibold mb-3 text-gray-700">Father's Information</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="fatherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Juan Dela Cruz" maxLength={100} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="fatherOccupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupation</FormLabel>
                        <FormControl>
                          <Input placeholder="Engineer" maxLength={100} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control as any}
                    name="fatherEmployer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employer/Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="ABC Corporation" maxLength={150} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="fatherWorkContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Contact Number</FormLabel>
                        <FormControl>
                          <Input placeholder="09123456789" maxLength={13} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4">
                  <FormField
                    control={form.control as any}
                    name="fatherMonthlySalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Income/Salary (₱)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="15000"
                            min="1"
                            max="10000000"
                            step="0.01"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Mother's Information */}
              <div className="pt-4 border-t">
                <h4 className="text-md font-semibold mb-3 text-gray-700">Mother's Information</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="motherName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Maria Santos" maxLength={100} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="motherOccupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occupation</FormLabel>
                        <FormControl>
                          <Input placeholder="Teacher" maxLength={100} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control as any}
                    name="motherEmployer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employer/Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="XYZ School" maxLength={150} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="motherWorkContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Work Contact Number</FormLabel>
                        <FormControl>
                          <Input placeholder="09123456789" maxLength={13} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4">
                  <FormField
                    control={form.control as any}
                    name="motherMonthlySalary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Income/Salary (₱)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="15000"
                            min="1"
                            max="10000000"
                            step="0.01"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Guardian Relationship */}
              <div className="pt-4 border-t">
                <FormField
                  control={form.control as any}
                  name="guardianRelationship"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Relationship to Student</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select relationship" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Father">Father</SelectItem>
                          <SelectItem value="Mother">Mother</SelectItem>
                          <SelectItem value="Grandfather">Grandfather</SelectItem>
                          <SelectItem value="Grandmother">Grandmother</SelectItem>
                          <SelectItem value="Uncle">Uncle</SelectItem>
                          <SelectItem value="Aunt">Aunt</SelectItem>
                          <SelectItem value="Sibling">Sibling</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Who is the primary guardian of this student?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Emergency Contact */}
              <div className="pt-4 border-t">
                <h4 className="text-md font-semibold mb-3 text-gray-700">Guardian Contact Information</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="emergencyContactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Pedro Santos" maxLength={100} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="emergencyContactNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Number</FormLabel>
                        <FormControl>
                          <Input placeholder="09123456789" maxLength={13} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="mt-4">
                  <FormField
                    control={form.control as any}
                    name="emergencyContactRelationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relationship to Student</FormLabel>
                        <FormControl>
                          <Input placeholder="Uncle, Aunt, Neighbor, etc." maxLength={50} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div ref={academicInfoRef} className="space-y-4">
              <h3 className="text-lg font-semibold">Academic Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <FormField
                  control={form.control as any}
                  name="gradeLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade Level *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
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
                  control={form.control as any}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedGradeLevel || loadingSections}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
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
                        </FormControl>
                        <SelectContent>
                          {sections.map((section: any) => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {!selectedGradeLevel && "Please select a grade level to view available sections"}
                        {selectedGradeLevel && sections.length === 0 && !loadingSections && "No sections configured for this grade level"}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control as any}
                name="isTransferee"
                render={() => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={isTransferee}
                        onCheckedChange={(checked) => form.setValue('isTransferee', checked as boolean)}
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
                  control={form.control as any}
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
                control={form.control as any}
                name="remarks"
                render={() => (
                  <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl>
                      <StudentRemarksField
                        value={form.watch('remarks') || ''}
                        onChange={(value) => form.setValue('remarks', value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {createMutation.isPending ? 'Enrolling...' : 'Enroll Student'}
            </Button>
          </form>
        </Form>
        )}
      </CardContent>
    </Card>
  )
}
