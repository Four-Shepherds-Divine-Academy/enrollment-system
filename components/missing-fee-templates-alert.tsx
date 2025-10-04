'use client'

import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle } from 'lucide-react'
import { useActiveAcademicYear } from '@/hooks/use-academic-years'
import { useFeeTemplates } from '@/hooks/use-fees'

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

export function MissingFeeTemplatesAlert() {
  const { data: activeYear, isLoading: isLoadingYear } = useActiveAcademicYear()
  const { data: templates = [], isLoading: isLoadingTemplates } = useFeeTemplates({
    academicYearId: activeYear?.id,
  })

  // Show skeleton while loading
  if (isLoadingYear || isLoadingTemplates) {
    return (
      <Alert>
        <Skeleton className="h-4 w-4 rounded" />
        <AlertTitle>
          <Skeleton className="h-5 w-48" />
        </AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <Skeleton className="h-4 w-64" />
          <div className="flex flex-wrap gap-1.5">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-8 w-40" />
        </AlertDescription>
      </Alert>
    )
  }

  // Don't show if no active year
  if (!activeYear) {
    return null
  }

  // Group templates by grade level
  const groupedTemplates = templates.reduce((acc: any, template: any) => {
    if (!acc[template.gradeLevel]) {
      acc[template.gradeLevel] = []
    }
    acc[template.gradeLevel].push(template)
    return acc
  }, {})

  // Check which grades are missing fee templates
  const missingGrades = GRADE_LEVELS.filter(grade => !groupedTemplates[grade])
  const hasMissingTemplates = missingGrades.length > 0

  if (!hasMissingTemplates) {
    return null
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Missing Fee Templates</AlertTitle>
      <AlertDescription className="mt-2 space-y-3">
        <p className="text-sm">
          {missingGrades.length} grade level{missingGrades.length !== 1 && 's'} missing templates for {activeYear.name}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {missingGrades.map(grade => (
            <Badge key={grade} variant="outline" className="text-xs">
              {grade}
            </Badge>
          ))}
        </div>

        <div>
          <Link href="/admin/dashboard/fees">
            <Button size="sm" variant="outline" className="h-8">
              Configure Templates
            </Button>
          </Link>
        </div>
      </AlertDescription>
    </Alert>
  )
}
