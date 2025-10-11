const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkPaymentLineItems() {
  try {
    // Find payments with entrance fee line items
    const payments = await prisma.payment.findMany({
      where: {
        amountPaid: 3000 // Entrance fee amount
      },
      include: {
        lineItems: {
          include: {
            feeBreakdown: {
              select: {
                id: true,
                description: true,
                isRefundable: true
              }
            }
          }
        },
        student: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      take: 5 // Just check first 5
    })

    console.log('\n=== Payments with ₱3,000 (likely entrance fees) ===\n')

    payments.forEach((payment, index) => {
      console.log(`\nPayment #${index + 1}:`)
      console.log(`  Student: ${payment.student.firstName} ${payment.student.lastName}`)
      console.log(`  Amount: ₱${payment.amountPaid}`)
      console.log(`  Date: ${payment.paymentDate}`)
      console.log(`  Line Items Count: ${payment.lineItems.length}`)

      if (payment.lineItems.length > 0) {
        console.log('  Line Items:')
        payment.lineItems.forEach((item, i) => {
          console.log(`    ${i + 1}. ${item.description} - ₱${item.amount}`)
          console.log(`       feeBreakdownId: ${item.feeBreakdownId}`)
          console.log(`       feeBreakdown exists: ${!!item.feeBreakdown}`)
          if (item.feeBreakdown) {
            console.log(`       feeBreakdown.description: ${item.feeBreakdown.description}`)
            console.log(`       feeBreakdown.isRefundable: ${item.feeBreakdown.isRefundable}`)
          }
        })
      } else {
        console.log('  ⚠️  NO LINE ITEMS ATTACHED')
      }
    })

    console.log(`\n=== Summary ===`)
    console.log(`Total payments checked: ${payments.length}`)
    console.log(`Payments with line items: ${payments.filter(p => p.lineItems.length > 0).length}`)
    console.log(`Payments without line items: ${payments.filter(p => p.lineItems.length === 0).length}`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkPaymentLineItems()
