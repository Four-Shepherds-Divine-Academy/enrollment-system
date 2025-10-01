import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding student data...')

  // Get active academic year
  const academicYear = await prisma.academicYear.findFirst({
    where: { isActive: true },
  })

  if (!academicYear) {
    console.error('No active academic year found. Please create one first.')
    return
  }

  console.log(`Using academic year: ${academicYear.name}`)

  // Sample students from the PDF
  const students = [
    // Kinder 1
    {
      firstName: 'Rom Ezequiel',
      middleName: 'A',
      lastName: 'Pamanian',
      gender: 'Male',
      dateOfBirth: new Date('2019-12-24'),
      contactNumber: '09398557421',
      houseNumber: 'B31 L2',
      subdivision: 'Steelhomes Subd.',
      barangay: 'San Luis',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Robert Pamanian',
      gradeLevel: 'Kinder 1',
      section: 'Enthusiasm',
      isTransferee: true,
      previousSchool: 'Nursery',
      remarks: 'enrolled-nursery',
    },
    {
      lrn: '494059240004',
      firstName: 'Ma. Cassandra',
      middleName: 'T',
      lastName: 'Mina',
      gender: 'Female',
      dateOfBirth: new Date('2017-11-26'),
      contactNumber: '09567602058',
      houseNumber: '1003 B34 L9',
      subdivision: 'BN2 PH2A',
      barangay: 'San Isidro',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Frances Anne S. Traqueña',
      gradeLevel: 'Kinder 1',
      section: 'Enthusiasm',
      remarks: 'K2 - temp K1',
    },
    {
      lrn: '494059240001',
      firstName: 'Francis Greyson',
      middleName: 'G',
      lastName: 'Serzo',
      gender: 'Male',
      dateOfBirth: new Date('2019-09-13'),
      contactNumber: '09065218894',
      houseNumber: 'B2 L15',
      barangay: 'San Isidro',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Federico Serzo',
      gradeLevel: 'Kinder 1',
      section: 'Enthusiasm',
      remarks: 'K2 - temp K1',
    },
    // Kinder 2
    {
      lrn: '494059240010',
      firstName: 'Carl Eduard',
      middleName: 'L',
      lastName: 'Bugnosen',
      gender: 'Male',
      dateOfBirth: new Date('2019-06-07'),
      contactNumber: '09171858965',
      houseNumber: 'Lot C B14',
      street: 'NHA Ave., Sitio Maligaya',
      barangay: 'San Isidro',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Jessa L. Bugnosen',
      gradeLevel: 'Kinder 2',
      section: 'Generosity',
    },
    {
      lrn: '494059240009',
      firstName: 'John Reaven',
      middleName: 'A',
      lastName: 'Lique',
      gender: 'Male',
      dateOfBirth: new Date('2019-04-20'),
      contactNumber: '09993898106',
      houseNumber: 'B17 LB',
      street: 'Manzanilla St.',
      subdivision: 'Sambaville',
      barangay: 'San Luis',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Mirzi Alarcon',
      gradeLevel: 'Kinder 2',
      section: 'Generosity',
      remarks: 'enrolled',
    },
    // Grade 1
    {
      lrn: '494059230004',
      firstName: 'Euan Mark',
      middleName: 'A',
      lastName: 'Abellar',
      gender: 'Male',
      dateOfBirth: new Date('2018-02-16'),
      contactNumber: '09613207634',
      houseNumber: 'B21 L20 PH2B',
      barangay: 'San Luis',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Christina A. Abellar',
      gradeLevel: 'Grade 1',
      section: 'Obedience',
    },
    {
      lrn: '494059230003',
      firstName: 'Sean Zion',
      middleName: 'B',
      lastName: 'Balacuit',
      gender: 'Male',
      dateOfBirth: new Date('2017-11-18'),
      contactNumber: '09305967756',
      houseNumber: 'B32 L5',
      subdivision: 'Sambaville',
      barangay: 'San Luis',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Roxan M. Balacuit',
      gradeLevel: 'Grade 1',
      section: 'Obedience',
      remarks: 'enrolled',
    },
    // Grade 2
    {
      lrn: '494059220024',
      firstName: 'Carl Vincent',
      middleName: 'C',
      lastName: 'Arda',
      gender: 'Male',
      dateOfBirth: new Date('2017-07-24'),
      contactNumber: '09399283865',
      houseNumber: 'B3 L16 Ph2B',
      subdivision: 'BN2',
      barangay: 'San Luis',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Jepherson D. Arda',
      gradeLevel: 'Grade 2',
      section: 'Hospitality',
      remarks: 'enrolled',
    },
    {
      lrn: '494059220027',
      firstName: 'Jeiyramme Dhenize',
      middleName: 'C',
      lastName: 'Lizano',
      gender: 'Female',
      dateOfBirth: new Date('2017-04-09'),
      contactNumber: '09335283367',
      houseNumber: 'B6 L10 PH5A',
      barangay: 'Dela Paz',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Jerome B. Lizano',
      gradeLevel: 'Grade 2',
      section: 'Hospitality',
      remarks: 'enrolled',
    },
    // Grade 3
    {
      lrn: '494059210002',
      firstName: 'Honeylyn',
      middleName: 'O',
      lastName: 'Butay',
      gender: 'Female',
      dateOfBirth: new Date('2016-06-11'),
      contactNumber: '09703106243',
      houseNumber: 'L19 B14',
      subdivision: 'BN2B',
      barangay: 'San Luis',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Jenelyn B. Oracoy',
      gradeLevel: 'Grade 3',
      section: 'Simplicity',
      remarks: 'enrolled',
    },
    {
      lrn: '109320210452',
      firstName: 'Sophia Celerine',
      middleName: 'C',
      lastName: 'Calubayan',
      gender: 'Female',
      dateOfBirth: new Date('2016-04-15'),
      contactNumber: '09159574548',
      houseNumber: '07 B14 L10 PH2b',
      barangay: 'San Luis',
      city: 'Antipolo City',
      province: 'Rizal',
      parentGuardian: 'Jackie Lou C. Calubayan',
      gradeLevel: 'Grade 3',
      section: 'Simplicity',
      remarks: 'enrolled',
    },
  ]

  for (const studentData of students) {
    const fullName = [
      studentData.firstName,
      studentData.middleName,
      studentData.lastName,
    ]
      .filter(Boolean)
      .join(' ')

    try {
      const student = await prisma.student.create({
        data: {
          ...studentData,
          fullName,
          enrollmentStatus: 'ENROLLED',
        },
      })

      // Create enrollment record
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          academicYearId: academicYear.id,
          schoolYear: academicYear.name,
          gradeLevel: studentData.gradeLevel,
          section: studentData.section,
          status: 'ENROLLED',
        },
      })

      console.log(`✓ Created: ${fullName} - ${studentData.gradeLevel}`)
    } catch (error: any) {
      console.error(`✗ Failed to create ${fullName}:`, error.message)
    }
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
