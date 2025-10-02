import type { PrismaClient as PrismaClientType } from '@prisma/client'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { execSync } from 'child_process'

const prisma: PrismaClientType = new PrismaClient()

async function main(): Promise<void> {
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
  try {
    execSync('tsx prisma/seed-2023-2024.ts', { stdio: 'inherit' })
  } catch (error) {
    console.error('Error seeding 2023-2024:', error)
  }

  console.log('\nSeeding 2024-2025 academic year...')
  try {
    execSync('tsx prisma/seed-2024-2025.ts', { stdio: 'inherit' })
  } catch (error) {
    console.error('Error seeding 2024-2025:', error)
  }

  console.log('\nSeeding 2025-2026 academic year...')
  try {
    execSync('tsx prisma/seed-2025-2026.ts', { stdio: 'inherit' })
  } catch (error) {
    console.error('Error seeding 2025-2026:', error)
  }

  console.log('\n✅ All seeds completed successfully!')
}

void main()
  .catch((e: Error) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
