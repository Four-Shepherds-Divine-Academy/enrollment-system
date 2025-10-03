import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const notifications = await prisma.notification.findMany({
    include: {
      student: {
        select: {
          fullName: true,
          gradeLevel: true,
          enrollmentStatus: true
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })

  console.log('Total notifications:', await prisma.notification.count())
  console.log('\nRecent notifications:')

  notifications.forEach(notif => {
    console.log(`\n- ${notif.title}`)
    console.log(`  Message: ${notif.message}`)
    console.log(`  Type: ${notif.type}`)
    console.log(`  Read: ${notif.isRead}`)
    console.log(`  Student: ${notif.student?.fullName || 'N/A'}`)
    console.log(`  Created: ${notif.createdAt}`)
  })

  const unread = await prisma.notification.count({ where: { isRead: false } })
  console.log(`\nUnread notifications: ${unread}`)
}

void main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
