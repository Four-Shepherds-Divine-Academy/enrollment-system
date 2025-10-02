import { Gender, EnrollmentStatus, Section } from '@prisma/client'

// Student Types
export type Student = {
  id: string
  lrn: string | null
  firstName: string
  middleName: string | null
  lastName: string
  fullName: string
  gender: Gender
  contactNumber: string
  dateOfBirth: Date
  houseNumber: string | null
  street: string | null
  subdivision: string | null
  barangay: string
  city: string
  province: string
  zipCode: string | null
  parentGuardian: string
  gradeLevel: string
  section: Section | null
  enrollmentStatus: EnrollmentStatus
  isTransferee: boolean
  previousSchool: string | null
  remarks: string | null
  createdAt: Date
  updatedAt: Date
}

export type StudentFormData = {
  lrn?: string
  firstName: string
  middleName?: string
  lastName: string
  gender: Gender
  contactNumber: string
  dateOfBirth: Date
  houseNumber?: string
  street?: string
  subdivision?: string
  barangay: string
  city: string
  province: string
  zipCode?: string
  parentGuardian: string
  gradeLevel: string
  section?: Section
  enrollmentStatus?: EnrollmentStatus
  isTransferee?: boolean
  previousSchool?: string
  remarks?: string
}

// Academic Year Types
export type AcademicYear = {
  id: string
  name: string
  startDate: Date
  endDate: Date | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export type AcademicYearFormData = {
  name: string
  startDate: Date
  endDate?: Date
  isActive?: boolean
}

// Enrollment Types
export type Enrollment = {
  id: string
  studentId: string
  academicYearId: string
  schoolYear: string
  gradeLevel: string
  section: Section | null
  enrollmentDate: Date
  status: EnrollmentStatus
  createdAt: Date
  updatedAt: Date
}

export type EnrollmentWithStudent = Enrollment & {
  student: Student
}

export type EnrollmentWithRelations = Enrollment & {
  student: Student
  academicYear: AcademicYear
}

// Grade Section Types
export type GradeSection = {
  id: string
  academicYearId: string
  gradeLevel: string
  section: Section
  createdAt: Date
  updatedAt: Date
}

export type GradeSectionWithYear = GradeSection & {
  academicYear: AcademicYear
}

// Import Types
export type StudentImportData = {
  studentId: string
  gradeLevel: string
}

export type ImportStudentForDisplay = {
  id: string
  lrn: string | null
  fullName: string
  gradeLevel: string
  section: string | null
  currentGrade: string
  nextGrade: string
  selectedGrade?: string
}

export type FailedImport = {
  studentId: string
  studentName: string
  gradeLevel: string
  error: string
}

export type ImportProgress = {
  current: number
  total: number
  currentStudent: string
  succeeded: number
  failed: number
  skipped: number
}

// Admin Types
export type Admin = {
  id: string
  email: string
  password: string
  name: string
  role: string
  createdAt: Date
  updatedAt: Date
}

export type AdminWithoutPassword = Omit<Admin, 'password'>

// Notification Types
export type NotificationType = 'ENROLLMENT' | 'SYSTEM' | 'ALERT'

export type Notification = {
  id: string
  adminId: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  studentId: string | null
  enrollmentId: string | null
  createdAt: Date
  updatedAt: Date
}

export type NotificationWithRelations = Notification & {
  admin: AdminWithoutPassword
  student?: Student
}

// Report Types
export type GradeDistribution = {
  gradeLevel: string
  count: number
  male: number
  female: number
}

export type ReportData = {
  academicYear: string
  totalStudents: number
  enrolledStudents: number
  pendingStudents: number
  transferees: number
  gradeDistribution: GradeDistribution[]
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

// API Response Types
export type ApiResponse<T> = {
  data?: T
  error?: string
  message?: string
}

export type ImportResponse = {
  success: number
  skipped: number
  errors: string[]
  message?: string
}

// Form State Types
export type FormState<T> = {
  data: T
  errors: Partial<Record<keyof T, string>>
  isSubmitting: boolean
}

// Table Filter Types
export type FilterOptions = {
  search?: string
  gradeLevel?: string
  section?: Section
  enrollmentStatus?: EnrollmentStatus
  academicYear?: string
}

// Pagination Types
export type PaginationParams = {
  page: number
  pageSize: number
  total: number
}

export type PaginatedResponse<T> = {
  data: T[]
  pagination: PaginationParams
}
