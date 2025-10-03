import { getAllRemarkValues } from '@/lib/constants/student-remarks'

/**
 * Parse stored remarks string into custom text and checkbox values
 * Format: "customText|checkbox1,checkbox2,checkbox3"
 */
export function parseRemarks(remarks: string | null | undefined): {
  customText: string
  checkboxValues: string[]
} {
  if (!remarks) {
    return { customText: '', checkboxValues: [] }
  }

  // Handle old format (plain text without separator)
  if (!remarks.includes('|')) {
    // Check if it's a known checkbox value
    const allRemarkValues = getAllRemarkValues()
    const isKnownRemark = allRemarkValues.includes(remarks)

    if (isKnownRemark) {
      return { customText: '', checkboxValues: [remarks] }
    }

    // Treat as custom text
    return { customText: remarks, checkboxValues: [] }
  }

  const [customText, checkboxPart] = remarks.split('|')
  const checkboxValues = checkboxPart
    ? checkboxPart.split(',').filter((v) => v.trim())
    : []

  return {
    customText: customText.trim(),
    checkboxValues,
  }
}

/**
 * Combine custom text and checkbox values into storage format
 * Format: "customText|checkbox1,checkbox2,checkbox3"
 */
export function encodeRemarks(customText: string, checkboxValues: string[]): string {
  const cleanCustomText = customText.trim()
  const cleanCheckboxes = checkboxValues.filter((v) => v.trim())

  if (!cleanCustomText && cleanCheckboxes.length === 0) {
    return ''
  }

  if (!cleanCustomText) {
    return `|${cleanCheckboxes.join(',')}`
  }

  if (cleanCheckboxes.length === 0) {
    return `${cleanCustomText}|`
  }

  return `${cleanCustomText}|${cleanCheckboxes.join(',')}`
}

/**
 * Format remarks for display (plain text version)
 * Format: "(Admin NOTE: customText) Other Remarks: checkbox1, checkbox2"
 */
export function formatRemarksForDisplay(remarks: string | null | undefined): string {
  const { customText, checkboxValues } = parseRemarks(remarks)

  if (!customText && checkboxValues.length === 0) {
    return 'None'
  }

  const parts: string[] = []

  if (customText) {
    parts.push(`(Admin NOTE: ${customText})`)
  }

  if (checkboxValues.length > 0) {
    parts.push(`Other Remarks: ${checkboxValues.join(', ')}`)
  }

  return parts.join(' ')
}
