import { PrismaClient } from '@prisma/client'

/**
 * Section definitions for all grade levels
 */
export const SECTION_DEFINITIONS = [
  // Kinder sections
  { name: 'Enthusiasm', gradeLevel: 'Kinder 1' },
  { name: 'Enthusiasm', gradeLevel: 'Kinder 2' },
  { name: 'Generosity', gradeLevel: 'Kinder 2' },

  // Elementary sections
  { name: 'Obedience', gradeLevel: 'Grade 1' },
  { name: 'Hospitality', gradeLevel: 'Grade 2' },
  { name: 'Simplicity', gradeLevel: 'Grade 3' },
  { name: 'Benevolence', gradeLevel: 'Grade 4' },
  { name: 'Sincerity', gradeLevel: 'Grade 5' },
  { name: 'Responsibility', gradeLevel: 'Grade 6' },

  // Junior High sections
  { name: 'Perseverance', gradeLevel: 'Grade 7' },
  { name: 'Integrity', gradeLevel: 'Grade 8' },
  { name: 'Perseverance', gradeLevel: 'Grade 9' },
  { name: 'Integrity', gradeLevel: 'Grade 10' },
]

/**
 * Creates all section records in the database
 */
export async function createSections(prisma: PrismaClient) {
  console.log('Creating sections...')

  for (const sectionDef of SECTION_DEFINITIONS) {
    await prisma.section.upsert({
      where: {
        name_gradeLevel: {
          name: sectionDef.name,
          gradeLevel: sectionDef.gradeLevel,
        },
      },
      update: {},
      create: {
        name: sectionDef.name,
        gradeLevel: sectionDef.gradeLevel,
        isActive: true,
      },
    })
  }

  console.log(`✓ Created ${SECTION_DEFINITIONS.length} sections`)
}

/**
 * Gets section ID by name and grade level
 */
export async function getSectionId(
  prisma: PrismaClient,
  sectionText: string | null,
  gradeLevel: string
): Promise<string | null> {
  // Handle null or empty section text
  if (!sectionText || sectionText.trim() === '') {
    return null
  }

  // Extract section name from text like "Grade 1 - Obedience"
  const sectionName = sectionText.split(' - ')[1]?.trim() || sectionText.trim()

  const section = await prisma.section.findUnique({
    where: {
      name_gradeLevel: {
        name: sectionName,
        gradeLevel: gradeLevel,
      },
    },
  })

  return section?.id || null
}

/**
 * Maps old section strings to section names
 */
export function extractSectionName(sectionText: string): string {
  const sectionName = sectionText.split(' - ')[1]?.trim() || sectionText.trim()

  // Map of valid section names
  const validSections = [
    'Enthusiasm',
    'Generosity',
    'Obedience',
    'Hospitality',
    'Simplicity',
    'Benevolence',
    'Sincerity',
    'Responsibility',
    'Perseverance',
    'Integrity',
  ]

  return validSections.includes(sectionName) ? sectionName : 'Enthusiasm'
}
