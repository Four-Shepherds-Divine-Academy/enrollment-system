import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed for 2023-2024 academic year...')

  // Create admin user
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
  console.log('Admin created:', admin.email)

  // Create 2023-2024 academic year
  const academicYear = await prisma.academicYear.upsert({
    where: { name: '2023-2024' },
    update: {},
    create: {
      name: '2023-2024',
      startDate: new Date('2023-08-01'),
      endDate: new Date('2024-05-31'),
      isActive: false,
      isClosed: true,
    },
  })
  console.log('Academic year created:', academicYear.name)

  // Kindergarten 1 - Enthusiasm students
  const kinder1Students = [
    {
      lrn: null,
      firstName: 'Earl Daven',
      middleName: 'J.',
      lastName: 'Abinggosa',
      gender: 'Male' as const,
      contactNumber: '0999468895',
      dateOfBirth: new Date('2018-10-15'),
      houseNumber: 'Ph3B',
      street: 'St. Anthony',
      barangay: 'Inarawan',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Aileen Abinggosa',
      gradeLevel: 'Kinder 1',
      section: 'Kinder 1 - Enthusiasm',
    },
    {
      lrn: null,
      firstName: 'Carl Eduard',
      middleName: 'L.',
      lastName: 'Bugnosen',
      gender: 'Male' as const,
      contactNumber: '09171858965',
      dateOfBirth: new Date('2019-06-07'),
      houseNumber: 'Lot C B14',
      street: 'NHA Ave., Sitio Maliciava',
      barangay: 'San Isidro',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Jessa L. Bugnosen',
      gradeLevel: 'Kinder 1',
      section: 'Kinder 1 - Enthusiasm',
    },
    {
      lrn: null,
      firstName: 'John Reaven',
      middleName: 'A.',
      lastName: 'Lique',
      gender: 'Male' as const,
      contactNumber: '09993898106',
      dateOfBirth: new Date('2019-04-20'),
      houseNumber: 'B17 LB',
      street: 'Manzanilla St., Sambaville',
      barangay: 'San Luis',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Mirzi Alarcon',
      gradeLevel: 'Kinder 1',
      section: 'Kinder 1 - Enthusiasm',
    },
    {
      lrn: null,
      firstName: 'Leanne Kaide Sarai',
      middleName: 'R.',
      lastName: 'Lim',
      gender: 'Female' as const,
      contactNumber: '0935675686',
      dateOfBirth: new Date('2019-01-01'),
      barangay: 'San Luis',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Ninna Rossi S. Rodolfo',
      gradeLevel: 'Kinder 1',
      section: 'Kinder 1 - Enthusiasm',
    },
    {
      lrn: null,
      firstName: 'Miguel Sebastian',
      middleName: 'C.',
      lastName: 'Javier',
      gender: 'Male' as const,
      contactNumber: '09073064920',
      dateOfBirth: new Date('2019-06-05'),
      houseNumber: '676',
      street: 'Sitio Sapinit',
      barangay: 'San Juan',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Alyssa Liel Rose G. Carisma',
      gradeLevel: 'Kinder 1',
      section: 'Kinder 1 - Enthusiasm',
    },
    {
      lrn: null,
      firstName: 'Dream',
      middleName: 'F.',
      lastName: 'Serafin',
      gender: 'Male' as const,
      contactNumber: '09506358927',
      dateOfBirth: new Date('2019-03-10'),
      houseNumber: 'B16 L17',
      street: 'Ph2b',
      barangay: 'San Luis',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Maribel Serafin',
      gradeLevel: 'Kinder 1',
      section: 'Kinder 1 - Enthusiasm',
    },
  ]

  // Kindergarten 2 - Enthusiasm students
  const kinder2Students = [
    {
      lrn: '494059230004',
      firstName: 'Euan Mark',
      middleName: 'A.',
      lastName: 'Abellar',
      gender: 'Male' as const,
      contactNumber: '09613207634',
      dateOfBirth: new Date('2018-02-16'),
      houseNumber: 'B21 L20',
      street: 'PH2B',
      barangay: 'San Luis',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Christina A. Abellar',
      gradeLevel: 'Kinder 2',
      section: 'Kinder 2 - Enthusiasm',
    },
    {
      lrn: '494059230003',
      firstName: 'Sean Zion',
      middleName: 'B.',
      lastName: 'Balacuit',
      gender: 'Male' as const,
      contactNumber: '09305967756',
      dateOfBirth: new Date('2017-11-18'),
      houseNumber: 'B32 L5',
      street: 'Sambaville',
      barangay: 'San Luis',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Roxan M. Balacuit',
      gradeLevel: 'Kinder 2',
      section: 'Kinder 2 - Enthusiasm',
    },
    {
      lrn: null,
      firstName: 'Marcus Achilles',
      middleName: '1.',
      lastName: 'Virtucio',
      gender: 'Male' as const,
      contactNumber: '09153622187',
      dateOfBirth: new Date('2018-04-17'),
      houseNumber: '#32 L2 B3',
      street: 'BN2',
      barangay: 'San Isidro',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Margie A. Ibardolasa',
      gradeLevel: 'Kinder 2',
      section: 'Kinder 2 - Enthusiasm',
    },
    {
      lrn: null,
      firstName: 'Henrique',
      middleName: '',
      lastName: 'Martins',
      gender: 'Male' as const,
      contactNumber: '',
      dateOfBirth: new Date('2018-01-02'),
      houseNumber: 'B21 L12',
      barangay: 'San Isidro',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Joyceann A. Martins',
      gradeLevel: 'Kinder 2',
      section: 'Kinder 2 - Enthusiasm',
    },
    {
      lrn: '494059230001',
      firstName: 'Jannica Faith',
      middleName: 'S.',
      lastName: 'Retreta',
      gender: 'Female' as const,
      contactNumber: '09385530888',
      dateOfBirth: new Date('2018-05-18'),
      houseNumber: 'B15 L5',
      barangay: 'San Luis',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Joy A. Salazar',
      gradeLevel: 'Kinder 2',
      section: 'Kinder 2 - Enthusiasm',
    },
    {
      lrn: '494059230002',
      firstName: 'Carly Louise',
      middleName: 'C.',
      lastName: 'Gagaza',
      gender: 'Female' as const,
      contactNumber: '09098878856',
      dateOfBirth: new Date('2018-05-31'),
      houseNumber: '0341',
      street: 'Sitio Maagay I',
      barangay: 'Inarawan',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Reynalin P. Cagang',
      gradeLevel: 'Kinder 2',
      section: 'Kinder 2 - Enthusiasm',
    },
    {
      lrn: null,
      firstName: 'Annber Dennise',
      middleName: 'F.',
      lastName: 'Toyco',
      gender: 'Female' as const,
      contactNumber: '09456908645',
      dateOfBirth: new Date('2018-04-13'),
      houseNumber: '950 B8 L61',
      street: 'Ph2, BN2',
      barangay: 'San Isidro',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Bernardo T. Toyco',
      gradeLevel: 'Kinder 2',
      section: 'Kinder 2 - Enthusiasm',
    },
  ]

  // Grade 1 - Obedience students
  const grade1Students = [
    {
      lrn: '494059220024',
      firstName: 'Carl Vincent',
      middleName: 'C.',
      lastName: 'Arda',
      gender: 'Male' as const,
      contactNumber: '09399283865',
      dateOfBirth: new Date('2017-07-24'),
      houseNumber: 'B3 L16',
      street: 'Ph2B, BN2',
      barangay: 'San Luis',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Jepherson D. Arda',
      gradeLevel: 'Grade 1',
      section: 'Grade 1 - Obedience',
    },
    {
      lrn: '494059220027',
      firstName: 'Jeiyramme Dhenize',
      middleName: 'C.',
      lastName: 'Lizano',
      gender: 'Female' as const,
      contactNumber: '09335283367',
      dateOfBirth: new Date('2017-04-09'),
      houseNumber: 'B6 L10',
      street: 'PHSA',
      barangay: 'Dela Paz',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Jerome B. Lizano',
      gradeLevel: 'Grade 1',
      section: 'Grade 1 - Obedience',
    },
    {
      lrn: '494059220020',
      firstName: 'Keylyn Elisha',
      middleName: 'B.',
      lastName: 'Modanza',
      gender: 'Female' as const,
      contactNumber: '09611072052',
      dateOfBirth: new Date('2016-11-24'),
      barangay: 'San Luis',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Mirasol C. Rolluqui',
      gradeLevel: 'Grade 1',
      section: 'Grade 1 - Obedience',
      remarks: 'Antipolo Natl High School',
    },
    {
      lrn: '494008150115',
      firstName: 'Hazelle',
      middleName: '',
      lastName: 'Sabiniano',
      gender: 'Female' as const,
      contactNumber: '09201258831',
      dateOfBirth: new Date('2009-04-21'),
      street: 'Sitio Maligaya Phase 2B',
      barangay: 'San Luis',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Lily M. Sabiniano',
      gradeLevel: 'Grade 1',
      section: 'Grade 1 - Obedience',
    },
    {
      lrn: '109336140301',
      firstName: 'Jhasly',
      middleName: 'S.',
      lastName: 'Baliber',
      gender: 'Female' as const,
      contactNumber: '09295939056',
      dateOfBirth: new Date('2009-08-24'),
      street: 'Sitio Kaybagsik',
      barangay: 'San Luis',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Janet S. Baliber',
      gradeLevel: 'Grade 1',
      section: 'Grade 1 - Obedience',
    },
  ]

  // Grade 10 - Dependability students
  const grade10Students = [
    {
      lrn: '109342131486',
      firstName: 'Rhay Phillip',
      middleName: 'M.',
      lastName: 'Lloren',
      gender: 'Male' as const,
      contactNumber: '09194643894',
      dateOfBirth: new Date('2006-01-19'),
      houseNumber: '143 Lot 15 Block 18',
      street: 'Phase 2B',
      barangay: 'San Luis',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Ma. Cecilia M. Lloren',
      gradeLevel: 'Grade 10',
      section: 'Grade 10 - Dependability',
    },
    {
      lrn: '105018130085',
      firstName: 'Sarah Joy',
      middleName: 'B.',
      lastName: 'Magana',
      gender: 'Female' as const,
      contactNumber: '',
      dateOfBirth: new Date('2008-01-01'),
      barangay: 'San Luis',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Guardian Name',
      gradeLevel: 'Grade 10',
      section: 'Grade 10 - Dependability',
    },
    {
      lrn: '109320140827',
      firstName: 'Lucid Enala',
      middleName: 'S.',
      lastName: 'Gorospe',
      gender: 'Female' as const,
      contactNumber: '',
      dateOfBirth: new Date('2008-01-01'),
      barangay: 'San Luis',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Guardian Name',
      gradeLevel: 'Grade 10',
      section: 'Grade 10 - Dependability',
    },
    {
      lrn: '136557130369',
      firstName: 'Annber Dominique',
      middleName: 'F.',
      lastName: 'Toyco',
      gender: 'Female' as const,
      contactNumber: '09456908645',
      dateOfBirth: new Date('2008-03-11'),
      houseNumber: '950 Blk 61 Lot 8',
      street: 'Ph2, BN2',
      barangay: 'San Isidro',
      city: 'Antipolo',
      province: 'Rizal',
      parentGuardian: 'Anna Therese F. Toyco',
      gradeLevel: 'Grade 10',
      section: 'Grade 10 - Dependability',
    },
  ]

  // Combine all students
  const allStudents = [
    ...kinder1Students,
    ...kinder2Students,
    ...grade1Students,
    ...grade10Students,
  ]

  // Create students and enrollments
  console.log(`Creating ${allStudents.length} students...`)

  for (const studentData of allStudents) {
    const { section, ...studentFields } = studentData
    const fullName = `${studentFields.firstName} ${studentFields.middleName ? studentFields.middleName + ' ' : ''}${studentFields.lastName}`.trim()

    // Use upsert to handle existing students
    let student
    if (studentFields.lrn) {
      student = await prisma.student.upsert({
        where: { lrn: studentFields.lrn },
        update: {
          ...studentFields,
          fullName,
          enrollmentStatus: 'ENROLLED',
        },
        create: {
          ...studentFields,
          fullName,
          enrollmentStatus: 'ENROLLED',
          isTransferee: false,
        },
      })
    } else {
      // For students without LRN, just create (they won't have unique constraint issues)
      student = await prisma.student.create({
        data: {
          ...studentFields,
          fullName,
          enrollmentStatus: 'ENROLLED',
          isTransferee: false,
        },
      })
    }

    // Check if enrollment already exists for this student in this academic year
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: student.id,
        academicYearId: academicYear.id,
      },
    })

    if (!existingEnrollment) {
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          academicYearId: academicYear.id,
          schoolYear: academicYear.name,
          gradeLevel: studentFields.gradeLevel,
          section: section,
          status: 'ENROLLED',
        },
      })
      console.log(`Created: ${fullName} - ${studentFields.gradeLevel}`)
    } else {
      console.log(`Skipped (already enrolled): ${fullName} - ${studentFields.gradeLevel}`)
    }
  }

  console.log('\nSeed completed successfully!')
  console.log(`Total students created: ${allStudents.length}`)
  console.log(`Academic Year: ${academicYear.name}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
