import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.admin.upsert({
    where: { email: 'admin@4sda.com' },
    update: {},
    create: {
      email: 'admin@4sda.com',
      password: hashedPassword,
      name: '4SDA Administrator',
      role: 'admin',
    },
  })

  console.log('Admin user created:', { email: admin.email, name: admin.name })
  console.log('Password: admin123')

  // Run individual seed files for academic years
  console.log('\nSeeding 2023-2024 academic year...')
  execSync('tsx prisma/seed-2023-2024-complete.ts', { stdio: 'inherit' })

  console.log('\nSeeding 2024-2025 academic year...')
  execSync('tsx prisma/seed-all-students.ts', { stdio: 'inherit' })

  console.log('\nSeeding 2025-2026 academic year...')
  execSync('tsx prisma/seed-2025-2026.ts', { stdio: 'inherit' })

  console.log('\n✅ All seeds completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
