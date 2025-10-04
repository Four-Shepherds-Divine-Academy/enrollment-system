import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

interface Student {
  fullName: string
  lrn: string | null
  gradeLevel: string
  section: string | null
}

interface FeeStatus {
  baseFee: number
  totalDue: number
  totalPaid: number
  balance: number
  totalAdjustments: number
  paymentStatus: string
  academicYear: {
    name: string
  }
  feeTemplate: {
    name: string
  } | null
}

interface Payment {
  id: string
  amountPaid: number
  paymentDate: Date
  paymentMethod: string
  referenceNumber: string | null
  remarks: string | null
  refundAmount?: number
  lineItems?: Array<{
    id: string
    amount: number
    description?: string
    feeBreakdown?: {
      id: string
      description: string
      category: string
      amount: number
    }
  }>
  refunds?: Array<{
    id: string
    amount: number
    refundAmount: number
    refundDate: Date
    refundReason: string
    reason?: string
  }>
}

interface Adjustment {
  id: string
  type: 'DISCOUNT' | 'ADDITIONAL'
  amount: number
  reason: string
  description: string | null
  createdAt: Date
}

export function exportStudentPaymentHistory(
  student: Student,
  feeStatus: FeeStatus,
  payments: Payment[],
  adjustments: Adjustment[]
) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  const margin = 14

  // Header with background
  doc.setFillColor(59, 130, 246)
  doc.rect(0, 0, pageWidth, 35, 'F')

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('PAYMENT HISTORY REPORT', margin, 15)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy hh:mm a')}`, margin, 25)

  // Reset text color
  doc.setTextColor(0, 0, 0)

  // Student Information Section
  let yPos = 45
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Student Information', margin, yPos)

  yPos += 8
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  // Create a more structured info layout
  const studentInfo = [
    { label: 'Name:', value: student.fullName },
    { label: 'LRN:', value: student.lrn || 'N/A' },
    { label: 'Grade Level:', value: student.gradeLevel },
    { label: 'Section:', value: student.section || 'Not Assigned' },
    { label: 'Academic Year:', value: feeStatus.academicYear.name },
  ]

  studentInfo.forEach((info) => {
    doc.setFont('helvetica', 'bold')
    doc.text(info.label, margin, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(info.value, margin + 35, yPos)
    yPos += 6
  })

  // Helper function to format amounts
  const formatAmount = (amount: number) => {
    const parts = amount.toFixed(2).split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return 'PHP ' + parts.join('.')
  }

  // Fee Summary
  yPos += 8
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Fee Summary', margin, yPos)

  yPos += 8
  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Amount']],
    body: [
      ['Total Amount Due', formatAmount(feeStatus.totalDue)],
      ['Total Amount Paid', formatAmount(feeStatus.totalPaid)],
      ['Remaining Balance', formatAmount(feeStatus.balance)],
    ],
    theme: 'plain',
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
    },
    styles: {
      fontSize: 10,
      cellPadding: { top: 4, right: 6, bottom: 4, left: 6 },
      lineColor: [220, 220, 220],
      lineWidth: 0.5,
    },
    columnStyles: {
      0: { cellWidth: 90, fontStyle: 'bold', textColor: [40, 40, 40] },
      1: { cellWidth: 'auto', halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: function(data: any) {
      // Add alternating row colors
      if (data.row.index >= 0 && data.row.index % 2 === 0) {
        data.cell.styles.fillColor = [249, 250, 251]
      }

      // Color code the amounts
      if (data.column.index === 1 && data.row.index >= 0) {
        const rowIndex = data.row.index
        if (rowIndex === 0) {
          data.cell.styles.textColor = [59, 130, 246]
        } else if (rowIndex === 1) {
          data.cell.styles.textColor = [34, 197, 94]
        } else if (rowIndex === 2) {
          data.cell.styles.textColor = feeStatus.balance > 0 ? [239, 68, 68] : [34, 197, 94]
        }
      }
    },
  })

  // Adjustments Table
  if (adjustments.length > 0) {
    yPos = (doc as any).lastAutoTable.finalY + 12
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Adjustments', margin, yPos)

    yPos += 8
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Type', 'Amount', 'Reason']],
      body: adjustments.map((adj) => [
        format(new Date(adj.createdAt), 'MMM dd, yyyy'),
        adj.type === 'DISCOUNT' ? 'Discount' : 'Additional',
        formatAmount(adj.amount),
        adj.reason,
      ]),
      theme: 'plain',
      headStyles: {
        fillColor: [245, 245, 245],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 9,
        cellPadding: { top: 3, right: 5, bottom: 3, left: 5 },
      },
      styles: {
        fontSize: 9,
        cellPadding: { top: 3, right: 5, bottom: 3, left: 5 },
        lineColor: [220, 220, 220],
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: 24 },
        2: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
        3: { cellWidth: 'auto' },
      },
      didParseCell: function(data: any) {
        // Add alternating row colors
        if (data.row.index >= 0 && data.row.index % 2 === 0) {
          data.cell.styles.fillColor = [249, 250, 251]
        }

        // Color code adjustment amounts
        if (data.column.index === 2 && data.row.index >= 0) {
          const adj = adjustments[data.row.index]
          data.cell.styles.textColor = adj.type === 'DISCOUNT' ? [34, 197, 94] : [239, 68, 68]
        }
      },
    })
  }

  // Payment Transactions - Detailed view
  yPos = (doc as any).lastAutoTable.finalY + 12

  // Check if we need a new page
  if (yPos > 240) {
    doc.addPage()
    yPos = 25
  }

  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Payment Transactions', margin, yPos)

  yPos += 8

  if (payments.length > 0) {
    // Build comprehensive payment table data
    const tableData: any[] = []

    payments.forEach((payment, index) => {
      const refundTotal = payment.refunds?.reduce((sum, r) => sum + (r.refundAmount || r.amount), 0) || 0
      const netAmount = payment.amountPaid - refundTotal

      // Payment header row
      tableData.push([
        {
          content: `Payment #${index + 1}`,
          colSpan: 3,
          styles: {
            fontStyle: 'bold',
            fillColor: [59, 130, 246],
            textColor: [255, 255, 255],
            fontSize: 9
          }
        }
      ])

      // Payment details row
      tableData.push([
        `${format(new Date(payment.paymentDate), 'MMM dd, yyyy')}`,
        `${payment.paymentMethod}`,
        `${payment.referenceNumber || 'N/A'}`,
      ])

      // Line items if available
      if (payment.lineItems && payment.lineItems.length > 0) {
        payment.lineItems.forEach((item) => {
          tableData.push([
            {
              content: `  • ${item.description || item.feeBreakdown?.description || 'N/A'}`,
              colSpan: 2,
              styles: { textColor: [70, 70, 70], fontSize: 8 }
            },
            {
              content: formatAmount(item.amount),
              styles: { textColor: [34, 197, 94], fontStyle: 'bold', halign: 'right' }
            }
          ])
        })
      }

      // Refunds if available
      if (payment.refunds && payment.refunds.length > 0) {
        payment.refunds.forEach((refund) => {
          tableData.push([
            {
              content: `  Refund: ${format(new Date(refund.refundDate), 'MMM dd, yyyy')} - ${refund.refundReason || refund.reason || 'N/A'}`,
              colSpan: 2,
              styles: { textColor: [180, 50, 50], fontSize: 8, fontStyle: 'italic' }
            },
            {
              content: `-${formatAmount(refund.refundAmount || refund.amount)}`,
              styles: { textColor: [239, 68, 68], fontStyle: 'bold', halign: 'right' }
            }
          ])
        })
      }

      // Payment summary
      tableData.push([
        {
          content: 'Amount Paid:',
          colSpan: 2,
          styles: { fontStyle: 'bold', textColor: [40, 40, 40], fontSize: 8 }
        },
        {
          content: formatAmount(payment.amountPaid),
          styles: { fontStyle: 'bold', textColor: [34, 197, 94], halign: 'right' }
        }
      ])

      if (refundTotal > 0) {
        tableData.push([
          {
            content: 'Total Refunded:',
            colSpan: 2,
            styles: { fontStyle: 'bold', textColor: [40, 40, 40], fontSize: 8 }
          },
          {
            content: formatAmount(refundTotal),
            styles: { fontStyle: 'bold', textColor: [239, 68, 68], halign: 'right' }
          }
        ])
      }

      tableData.push([
        {
          content: 'Net Amount:',
          colSpan: 2,
          styles: { fontStyle: 'bold', textColor: [40, 40, 40], fontSize: 9 }
        },
        {
          content: formatAmount(netAmount),
          styles: { fontStyle: 'bold', textColor: [59, 130, 246], halign: 'right', fontSize: 9 }
        }
      ])

      // Remarks if available
      if (payment.remarks) {
        tableData.push([
          {
            content: `Remarks: ${payment.remarks}`,
            colSpan: 3,
            styles: { fontStyle: 'italic', textColor: [100, 100, 100], fontSize: 7 }
          }
        ])
      }

      // Spacing row between payments
      if (index < payments.length - 1) {
        tableData.push([
          {
            content: '',
            colSpan: 3,
            styles: { fillColor: [255, 255, 255], minCellHeight: 3 }
          }
        ])
      }
    })

    // Render the complete table
    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Method', 'Reference']],
      body: tableData,
      theme: 'plain',
      headStyles: {
        fillColor: [245, 245, 245],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      },
      styles: {
        fontSize: 8,
        cellPadding: { top: 2, right: 4, bottom: 2, left: 4 },
        lineColor: [220, 220, 220],
        lineWidth: 0.5,
      },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 30 },
        2: { cellWidth: 'auto' },
      },
    })
  } else {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 100, 100)
    doc.text('No payment transactions recorded.', margin, yPos)
    doc.setTextColor(0, 0, 0)
  }

  // Footer
  const pageCount = doc.internal.pages.length - 1
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }

  // Save the PDF
  const fileName = `Payment_History_${student.fullName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`
  doc.save(fileName)
}
