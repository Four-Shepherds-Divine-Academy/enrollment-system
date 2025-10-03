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
)

export type StudentFormData = z.infer<typeof studentSchema>
