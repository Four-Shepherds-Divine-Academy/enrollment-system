import { EnrollmentForm } from '@/components/enrollment-form'

export default function AdminEnrollPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Enroll New Student</h2>
        <p className="text-gray-600 mt-1">
          Add a new student or re-enroll an existing student
        </p>
      </div>

      <EnrollmentForm />
    </div>
  )
}
