'use client'

import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { STUDENT_REMARK_CATEGORIES } from '@/lib/constants/student-remarks'
import { parseRemarks, encodeRemarks } from '@/lib/utils/format-remarks'

type StudentRemarksFieldProps = {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function StudentRemarksField({
  value,
  onChange,
  disabled = false,
}: StudentRemarksFieldProps) {
  const { customText, checkboxValues } = parseRemarks(value)
  const [localCustomText, setLocalCustomText] = useState(customText)
  const [localCheckboxValues, setLocalCheckboxValues] = useState<string[]>(checkboxValues)

  // Update local state when value prop changes
  useEffect(() => {
    const parsed = parseRemarks(value)
    setLocalCustomText(parsed.customText)
    setLocalCheckboxValues(parsed.checkboxValues)
  }, [value])

  const handleCustomTextChange = (text: string) => {
    setLocalCustomText(text)
    const encoded = encodeRemarks(text, localCheckboxValues)
    onChange(encoded)
  }

  const handleCheckboxChange = (remarkValue: string, checked: boolean) => {
    let newCheckboxValues: string[]

    if (checked) {
      newCheckboxValues = [...localCheckboxValues, remarkValue]
    } else {
      newCheckboxValues = localCheckboxValues.filter((v) => v !== remarkValue)
    }

    setLocalCheckboxValues(newCheckboxValues)
    const encoded = encodeRemarks(localCustomText, newCheckboxValues)
    onChange(encoded)
  }

  return (
    <div className="space-y-4">
      {/* Custom Text Field */}
      <div className="space-y-2">
        <Label htmlFor="custom-remarks">Custom Notes</Label>
        <Textarea
          id="custom-remarks"
          value={localCustomText}
          onChange={(e) => handleCustomTextChange(e.target.value)}
          disabled={disabled}
          placeholder="Enter any custom notes here..."
          className="min-h-[80px]"
        />
        <p className="text-xs text-muted-foreground">
          Custom notes will appear as: (Admin NOTE: your text)
        </p>
      </div>

      {/* Checkbox Remarks in Single Card */}
      <div className="space-y-2">
        <Label>Predefined Remarks</Label>
        <Card>
          <CardContent className="p-4">
            <div className="space-y-6">
              {STUDENT_REMARK_CATEGORIES.map((category, index) => (
                <div key={category.id}>
                  {index > 0 && <Separator className="mb-6" />}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">
                      {category.label}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {category.remarks.map((remark) => {
                        const isChecked = localCheckboxValues.includes(remark)

                        return (
                          <div
                            key={remark}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`remark-${remark}`}
                              checked={isChecked}
                              onCheckedChange={(checked) =>
                                handleCheckboxChange(remark, checked === true)
                              }
                              disabled={disabled}
                            />
                            <label
                              htmlFor={`remark-${remark}`}
                              className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {remark}
                            </label>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">
          Selected remarks will appear as: Other Remarks: item1, item2, item3
        </p>
      </div>
    </div>
  )
}
