export type RemarkCategory = {
  id: string
  label: string
  remarks: string[]
}

export const STUDENT_REMARK_CATEGORIES: RemarkCategory[] = [
  {
    id: 'payment',
    label: 'Payment-Related',
    remarks: [
      'Not Paid',
      'Partial Payment',
      'Overdue Payment',
      'Scholarship',
      'Financial Aid',
    ],
  },
  {
    id: 'documents',
    label: 'Document-Related',
    remarks: [
      'Missing Documents',
      'Pending Form 137',
      'Pending Good Moral',
      'Pending PSA',
      'Pending Report Card',
      'Pending Transfer Credentials',
      'Pending SF9',
      'Pending SF10',
    ],
  },
  {
    id: 'behavioral',
    label: 'Behavioral',
    remarks: ['Parent Conference Required'],
  },
  {
    id: 'administrative',
    label: 'Administrative',
    remarks: [
      'Transfer Student',
      'Returning Student',
      'New Student',
      'Late Enrollment',
      'Section Assignment Pending',
    ],
  },
  {
    id: 'special',
    label: 'Special Cases',
    remarks: ['Special Needs', 'Sibling Discount', 'Early Bird Discount'],
  },
]

// Get all possible remark values as a flat array
export const getAllRemarkValues = (): string[] => {
  return STUDENT_REMARK_CATEGORIES.flatMap((category) => category.remarks)
}

// Get remark category by id
export const getRemarkCategory = (id: string): RemarkCategory | undefined => {
  return STUDENT_REMARK_CATEGORIES.find((category) => category.id === id)
}
