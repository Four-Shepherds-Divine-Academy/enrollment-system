import { Section } from '@prisma/client'

/**
 * Maps old section strings to Section enum values
 */
export function mapSectionToEnum(sectionText: string): Section | null {
  const sectionName = sectionText.split(' - ')[1]?.trim() || sectionText.trim()

  switch (sectionName) {
    case 'Enthusiasm':
      return Section.Enthusiasm
    case 'Generosity':
      return Section.Generosity
    case 'Obedience':
      return Section.Obedience
    case 'Hospitality':
      return Section.Hospitality
    case 'Simplicity':
      return Section.Simplicity
    case 'Benevolence':
      return Section.Benevolence
    case 'Sincerity':
      return Section.Sincerity
    case 'Responsibility':
      return Section.Responsibility
    case 'Perseverance':
      return Section.Perseverance
    case 'Integrity':
      return Section.Integrity
    case 'Optimism':
      return Section.Optimism
    case 'Dependability':
      return Section.Dependability
    default:
      return null
  }
}

/**
 * Grade level to section mappings for each academic year
 */
export const GRADE_SECTION_MAPPINGS_2023_2024 = {
  'Kinder 1': [Section.Enthusiasm],
  'Kinder 2': [Section.Enthusiasm],
  'Grade 1': [Section.Obedience],
  'Grade 2': [Section.Hospitality],
  'Grade 3': [Section.Simplicity],
  'Grade 4': [Section.Benevolence],
  'Grade 5': [Section.Sincerity],
  'Grade 6': [Section.Responsibility],
  'Grade 7': [Section.Perseverance],
  'Grade 8': [Section.Integrity],
  'Grade 9': [Section.Optimism],
  'Grade 10': [Section.Dependability],
}

export const GRADE_SECTION_MAPPINGS_2025_2026 = {
  'Kinder 2': [Section.Generosity],
  'Grade 1': [Section.Obedience],
  'Grade 2': [Section.Hospitality],
  'Grade 3': [Section.Simplicity],
  'Grade 4': [Section.Benevolence],
  'Grade 5': [Section.Sincerity],
  'Grade 6': [Section.Responsibility],
  'Grade 7': [Section.Perseverance],
  'Grade 8': [Section.Integrity],
  'Grade 9': [Section.Optimism],
  'Grade 10': [Section.Dependability],
}
