const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkEntranceFees() {
  try {
    const entranceFees = await prisma.feeBreakdown.findMany({
      where: {
        description: {
          contains: 'Entrance',
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        description: true,
        amount: true,
        isRefundable: true,
        feeTemplate: {
          select: {
            gradeLevel: true,
            academicYear: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    console.log('\n=== Entrance Fee Breakdowns in Database ===\n')
    console.log(JSON.stringify(entranceFees, null, 2))
    console.log('\n=== Summary ===')
    console.log(`Total entrance fees found: ${entranceFees.length}`)
    console.log(`Non-refundable: ${entranceFees.filter(f => f.isRefundable === false).length}`)
    console.log(`Refundable: ${entranceFees.filter(f => f.isRefundable === true).length}`)

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkEntranceFees()
