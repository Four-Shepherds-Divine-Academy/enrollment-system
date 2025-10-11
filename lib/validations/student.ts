import { z } from 'zod'

export const studentSchema = z.object({
  lrn: z.string().optional(),
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  gender: z.enum(['Male', 'Female'], { message: 'Gender is required' }),
  contactNumber: z
    .string()
    .min(1, 'Contact number is required')
    .regex(
      /^(09|\+639)\d{9}$/,
      'Invalid Philippine mobile number. Format: 09XXXXXXXXX or +639XXXXXXXXX'
    ),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),

  // Philippine Address System
  houseNumber: z.string().optional(),
  street: z.string().optional(),
  subdivision: z.string().optional(),
  barangay: z.string().min(1, 'Barangay is required'),
  city: z.string().min(1, 'City is required'),
  province: z.string().min(1, 'Province is required'),
  zipCode: z.string().optional(),

  parentGuardian: z.string().min(1, 'Parent/Guardian name is required'),

  // Father's Information
  fatherName: z.string().trim().min(2, 'Father\'s name must be at least 2 characters').max(100, 'Father\'s name must not exceed 100 characters').optional().or(z.literal('')),
  fatherOccupation: z.string().trim().max(100, 'Occupation must not exceed 100 characters').optional().or(z.literal('')),
  fatherEmployer: z.string().trim().max(150, 'Employer name must not exceed 150 characters').optional().or(z.literal('')),
  fatherWorkContact: z.string().trim().optional().refine(
    (val) => !val || val === '' || /^(09|\+639)\d{9}$/.test(val),
    'Invalid Philippine mobile number. Format: 09XXXXXXXXX or +639XXXXXXXXX'
  ).or(z.literal('')),
  fatherMonthlySalary: z.coerce.number().positive('Salary must be a positive number').max(10000000, 'Salary value is too large').optional().or(z.literal('')).transform(val => val === '' ? undefined : val),

  // Mother's Information
  motherName: z.string().trim().min(2, 'Mother\'s name must be at least 2 characters').max(100, 'Mother\'s name must not exceed 100 characters').optional().or(z.literal('')),
  motherOccupation: z.string().trim().max(100, 'Occupation must not exceed 100 characters').optional().or(z.literal('')),
  motherEmployer: z.string().trim().max(150, 'Employer name must not exceed 150 characters').optional().or(z.literal('')),
  motherWorkContact: z.string().trim().optional().refine(
    (val) => !val || val === '' || /^(09|\+639)\d{9}$/.test(val),
    'Invalid Philippine mobile number. Format: 09XXXXXXXXX or +639XXXXXXXXX'
  ).or(z.literal('')),
  motherMonthlySalary: z.coerce.number().positive('Salary must be a positive number').max(10000000, 'Salary value is too large').optional().or(z.literal('')).transform(val => val === '' ? undefined : val),

  // Guardian Relationship
  guardianRelationship: z.string().optional(),

  // Guardian Contact Information (Emergency Contact)
  emergencyContactName: z.string().trim().min(2, 'Contact name must be at least 2 characters').max(100, 'Contact name must not exceed 100 characters').optional().or(z.literal('')),
  emergencyContactNumber: z.string().trim().optional().refine(
    (val) => !val || val === '' || /^(09|\+639)\d{9}$/.test(val),
    'Invalid Philippine mobile number. Format: 09XXXXXXXXX or +639XXXXXXXXX'
  ).or(z.literal('')),
  emergencyContactRelationship: z.string().trim().max(50, 'Relationship must not exceed 50 characters').optional().or(z.literal('')),

  gradeLevel: z.string().min(1, 'Grade level is required'),
  section: z.string().optional(),
  enrollmentStatus: z.enum(['ENROLLED', 'PENDING', 'TRANSFERRED', 'DROPPED']).optional(),
  isTransferee: z.boolean().default(false),
  previousSchool: z.string().optional(),
  remarks: z.string().optional(),
}).refine(
  (data) => {
    // If transferee, previous school is required
    if (data.isTransferee && !data.previousSchool) {
      return false
    }
    return true
  },
  {
    message: 'Previous school is required for transferees',
    path: ['previousSchool'],
  }
).refine(
  (data) => {
    // If emergency contact number is provided, name must also be provided
    if (data.emergencyContactNumber && data.emergencyContactNumber.trim() !== '' &&
        (!data.emergencyContactName || data.emergencyContactName.trim() === '')) {
      return false
    }
    return true
  },
  {
    message: 'Contact name is required when contact number is provided',
    path: ['emergencyContactName'],
  }
).refine(
  (data) => {
    // If emergency contact name is provided, number must also be provided
    if (data.emergencyContactName && data.emergencyContactName.trim() !== '' &&
        (!data.emergencyContactNumber || data.emergencyContactNumber.trim() === '')) {
      return false
    }
    return true
  },
  {
    message: 'Contact number is required when contact name is provided',
    path: ['emergencyContactNumber'],
  }
)

export type StudentFormData = z.infer<typeof studentSchema>
