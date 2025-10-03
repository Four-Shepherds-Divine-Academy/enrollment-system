'use client'

import { useActiveAcademicYear } from '@/hooks/use-academic-years'

export function ActiveYearBadge() {
  const { data: activeYear } = useActiveAcademicYear()

  if (!activeYear) return null

  return (
    <div className="hidden sm:flex items-center px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-300 rounded-lg">
      <span className="text-xs font-semibold text-green-700 mr-1">
        ACTIVE:
      </span>
      <span className="text-sm font-bold text-green-900">
        SY {activeYear.name}
      </span>
      <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
    </div>
  )
}
