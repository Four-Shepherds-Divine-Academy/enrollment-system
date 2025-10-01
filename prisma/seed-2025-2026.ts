import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { mapSectionToEnum, GRADE_SECTION_MAPPINGS_2025_2026 } from './seed-helpers'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed for 2025-2026 academic year...')

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

  // Create 2025-2026 academic year (ACTIVE)
  const academicYear = await prisma.academicYear.upsert({
    where: { name: '2025-2026' },
    update: {},
    create: {
      name: '2025-2026',
      startDate: new Date('2025-08-01'),
      endDate: new Date('2026-05-31'),
      isActive: true,
    },
  })
  console.log('Academic year created:', academicYear.name)

  // Deactivate all other academic years
  await prisma.academicYear.updateMany({
    where: {
      NOT: { id: academicYear.id },
      isActive: true,
    },
    data: {
      isActive: false,
    },
  })
  console.log('Deactivated other academic years')

  // Helper function to parse address
  const parseAddress = (addressStr: string) => {
    const parts = addressStr.split(',').map(s => s.trim())
    return {
      houseNumber: parts[0] || '',
      street: parts.length > 3 ? parts.slice(1, -2).join(', ') : (parts[1] || ''),
      barangay: parts.length > 2 ? parts[parts.length - 2] : 'San Luis',
      city: parts[parts.length - 1] || 'Antipolo City',
      province: 'Rizal',
    }
  }

  // Helper to parse names
  const parseName = (fullName: string) => {
    const parts = fullName.split(',').map(s => s.trim())
    const lastName = parts[0]
    const restOfName = parts[1] ? parts[1].trim() : ''

    // Split rest of name into first and middle
    const nameParts = restOfName.split(' ')
    const firstName = nameParts[0] || ''
    const middleName = nameParts.slice(1).join(' ') || ''

    return { firstName, middleName, lastName }
  }

  // All students data for 2025-2026
  const allStudentsData = [
    // Kinder 2 - Generosity
    { lrn: null, name: 'Adorador, Fiyah Natalie', gender: 'Female', contact: '09814645414', birthday: '2020-01-01', address: 'B20 L11 PH2B, San Luis, A/C', guardian: 'Debbie B. Adorador', gradeLevel: 'Kinder 2', section: 'Kinder 2 - Generosity' },
    { lrn: null, name: 'Asakil, Amielle Shasmeen P.', gender: 'Female', contact: '09498560770', birthday: '2020-05-29', address: 'B23 L14 BN2 San Luis, A/C', guardian: 'Roseann Angel P. Asakil', gradeLevel: 'Kinder 2', section: 'Kinder 2 - Generosity' },
    { lrn: null, name: 'Carique, Anne Marvie A.', gender: 'Female', contact: '09631496609', birthday: '2020-11-04', address: 'B10 L11 Sambaville San Luis, A/C', guardian: 'Racquel Ann Andres', gradeLevel: 'Kinder 2', section: 'Kinder 2 - Generosity' },
    { lrn: null, name: 'Faduhilao, Naarah Ashtoreth', gender: 'Female', contact: '09817713525', birthday: '2020-08-17', address: 'B15 L30 Ph2 Peace Village, San Luis, A/C', guardian: 'Angel Rose Faduhilao', gradeLevel: 'Kinder 2', section: 'Kinder 2 - Generosity' },
    { lrn: null, name: 'Madriaga, Allyson Jazz D.', gender: 'Female', contact: '09560989518', birthday: '2020-01-27', address: 'B22 L15 PH2b, San Luis, A/C', guardian: 'Ellaine Joy Diones', gradeLevel: 'Kinder 2', section: 'Kinder 2 - Generosity' },
    { lrn: null, name: 'Manligues, Vin Hero Luis S.', gender: 'Male', contact: '09477430052', birthday: '2020-02-21', address: '#9 B14 L16, PH2B, San Luis, A/C', guardian: 'Venus Rizza S. Manligues', gradeLevel: 'Kinder 2', section: 'Kinder 2 - Generosity' },
    { lrn: null, name: 'Nolos, Sofia Althea C.', gender: 'Female', contact: '09950570271', birthday: '2020-07-20', address: '73 B4 L3 Ph2 BN2 San Isidro, A/C', guardian: 'Celine C. Cabartaña', gradeLevel: 'Kinder 2', section: 'Kinder 2 - Generosity' },
    { lrn: null, name: 'Pamanian, Rom Ezequiel A.', gender: 'Male', contact: '09398557421', birthday: '2019-12-24', address: 'B31 L2 Steelhomes Subd., San Luis, A/C', guardian: 'Robert Pamanian', gradeLevel: 'Kinder 2', section: 'Kinder 2 - Generosity' },
    { lrn: null, name: 'Parilla, Zia Mikhylle V.', gender: 'Female', contact: '09974061641', birthday: '2019-10-20', address: 'B7 L13 Steelhomes Subd., San Luis, A/C', guardian: 'Caryl Jane V. Parilla', gradeLevel: 'Kinder 2', section: 'Kinder 2 - Generosity' },
    { lrn: null, name: 'Plazo, Kiela Marie A.', gender: 'Female', contact: '09817686512', birthday: '2020-05-20', address: 'B13 L14 PH1 BN2, San Isidro, A/C', guardian: 'Karen Abenir', gradeLevel: 'Kinder 2', section: 'Kinder 2 - Generosity' },
    { lrn: null, name: 'Sabanal, Kye Caspian L.', gender: 'Male', contact: '09205918649', birthday: '2020-09-12', address: 'B9 Northville Bagong Nayon A/C', guardian: 'Jhe-Ann Lucero', gradeLevel: 'Kinder 2', section: 'Kinder 2 - Generosity' },
    { lrn: null, name: 'Subejano, Vryndelle D.', gender: 'Female', contact: '09569169398', birthday: '2020-11-06', address: 'B22 L27 BN2B, San Luis, A/C', guardian: 'Jennifer Dormido', gradeLevel: 'Kinder 2', section: 'Kinder 2 - Generosity' },
    { lrn: null, name: 'Tañola, Kyle Kristof O.', gender: 'Male', contact: '09514014492', birthday: '2020-07-25', address: 'Excess lot Phase 2B, Brgy San Luis', guardian: 'Sheena Ogao', gradeLevel: 'Kinder 2', section: 'Kinder 2 - Generosity' },
    { lrn: null, name: 'Valencia, Aaron Justin L.', gender: 'Male', contact: '09977723210', birthday: '2020-03-20', address: 'B1 L17 Tropical Palm, San Isidro, A/C', guardian: 'Joey Albert Valencia', gradeLevel: 'Kinder 2', section: 'Kinder 2 - Generosity' },

    // Grade 1 - Obedience
    { lrn: null, name: 'Bermejo, Kleya Mervie S.', gender: 'Female', contact: '09087122155', birthday: '2019-06-12', address: 'B18 L34 PH2b, San Luis, A/C', guardian: 'Jovie Soliven', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },
    { lrn: null, name: 'Bustamante, Gracelene Faye F.', gender: 'Female', contact: '09154649312', birthday: '2019-01-01', address: '#102 B10 L5 PH1 BN2 San Isidro, A/C', guardian: 'Jessalie F. Bustamante', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },
    { lrn: null, name: 'Lim, Leanne Kaide Sarai R.', gender: 'Female', contact: '09356765686', birthday: '2019-01-01', address: 'B8 L3 San Luis, A/C', guardian: 'Ninna Rossi S. Rodolfo', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },
    { lrn: null, name: 'Lique, John Reaven A.', gender: 'Male', contact: '09183228574', birthday: '2019-04-20', address: 'B17 LB, Manzanilla St., Sambaville, San Luis, A/C', guardian: 'Mirzi Alarcon', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },
    { lrn: null, name: 'Lucero, Aeisha Jane A.', gender: 'Female', contact: '09103709811', birthday: '2018-06-12', address: 'B38 L5, PH1 BN2, San Isidro, A/C', guardian: 'Joan Lucero', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },
    { lrn: null, name: 'Mina, Ma. Cassandra T.', gender: 'Female', contact: '09694090897', birthday: '2017-11-26', address: '1003 834 L9, BN2 PHZA San Isidro, A/C', guardian: 'Frances Anne S. Traqueña', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },
    { lrn: null, name: 'Peru, Andiana Jade N.', gender: 'Female', contact: '0963660348', birthday: '2019-04-09', address: 'B 24-1 L22, Ph3 Peace Village, San Luis, A/C', guardian: 'Crisanta Calapardo', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },
    { lrn: null, name: 'Serafin, Dream F.', gender: 'Male', contact: '09506358927', birthday: '2019-03-10', address: 'B16 L17 Ph2b, San Luis, Antipolo City', guardian: 'Maribel Serafin', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },
    { lrn: null, name: 'Sumera, Matheus Adriel B.', gender: 'Male', contact: '09321971378', birthday: '2018-11-06', address: 'B21 L65 Peace Village, San Luis, A/C', guardian: 'Ma. Bernadette Sumera', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },

    // Grade 2 - Hospitality
    { lrn: '494059230004', name: 'Abellar, Euan Mark A.', gender: 'Male', contact: '09613207634', birthday: '2018-02-16', address: 'B21 L20 PH2B, San Luis, A/C', guardian: 'Christina A. Abellar', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality' },
    { lrn: '494059230003', name: 'Balacuit, Sean Zion B.', gender: 'Male', contact: '09058481902', birthday: '2017-11-18', address: 'B32 L5 Sambaville, San Luis, A/C', guardian: 'Roxan M. Balacuit', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality' },
    { lrn: null, name: 'Dejumo, Miguel V.', gender: 'Male', contact: '09165678651', birthday: '2018-01-01', address: '257 Techno Road St., Dela Paz, A/C', guardian: 'Aiza Dejumo', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality' },
    { lrn: '494059230002', name: 'Gagaza, Carly Louise C.', gender: 'Female', contact: '09098878856', birthday: '2018-05-31', address: '0341 Sitio Maagay I, Inarawan, A/C', guardian: 'Reynalin P. Cagang', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality' },
    { lrn: null, name: 'Lucero, John Kevin A.', gender: 'Male', contact: '09103709811', birthday: '2017-10-29', address: 'B38 L5 Ph1 BN2, San Isidro, A/C', guardian: 'Joan A. Lucero', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality' },
    { lrn: null, name: 'Martins, Henrique A.', gender: 'Male', contact: '', birthday: '2018-01-02', address: 'B21 L12 San Isidro, A/C', guardian: 'Joyceann A. Martins', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality' },
    { lrn: null, name: 'Rejano, Aerin D.', gender: 'Female', contact: '09351968395', birthday: '2018-07-03', address: 'Block 14 Lot 18, BN2B, San Luis, A/C', guardian: 'Lowela B. De Castro', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality' },
    { lrn: null, name: 'Resurreccion, Isaiah Timothy S.', gender: 'Male', contact: '09668275335', birthday: '2018-01-05', address: '#170 B12 L22 Ph1 BN2 San Isidro A/C', guardian: 'Neil Resurreccion', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality' },
    { lrn: '494059230001', name: 'Retreta, Jannica Faith S.', gender: 'Female', contact: '09385530888', birthday: '2018-05-18', address: 'B15 L5 San Luis, A/C', guardian: 'Joy A. Salazar', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality' },
    { lrn: null, name: 'Toyco, Annber Dennise F.', gender: 'Female', contact: '09456908645', birthday: '2018-04-13', address: 'Lot 8 B61 Ph2 BN2 San Isidro, A/C', guardian: 'Bernardo T. Toyco', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality' },
    { lrn: null, name: 'Virtucio, Marcus Achilles I.', gender: 'Male', contact: '09153622187', birthday: '2018-04-17', address: '#32 L2 B3 BN2, San Isidro, A/C', guardian: 'Margie A. Ibardolasa', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality' },

    // Grade 3 - Simplicity
    { lrn: '494059220024', name: 'Arda, Carl Vincent C.', gender: 'Male', contact: '09399283865', birthday: '2017-07-24', address: 'B3 L16 Ph2B, BN2, San Luis, A/C', guardian: 'Jepherson D. Arda', gradeLevel: 'Grade 3', section: 'Grade 3 - Simplicity' },
    { lrn: '494059220037', name: 'Ariola, Dean Casstiel K.', gender: 'Male', contact: '0963996441', birthday: '2016-04-08', address: 'NB19 L10 Ph2b, San Luis, A/C', guardian: 'Cristina b. Nuezca', gradeLevel: 'Grade 3', section: 'Grade 3 - Simplicity' },
    { lrn: null, name: 'De Leon, Ethan John C.', gender: 'Male', contact: '09656589697', birthday: '2016-05-26', address: '932 862 L7 BN2 PH2, San Isidro, A/C', guardian: 'Jean C. Collado', gradeLevel: 'Grade 3', section: 'Grade 3 - Simplicity' },
    { lrn: '494059220027', name: 'Lizano, Jeiyramme Dhenize C.', gender: 'Female', contact: '09335283367', birthday: '2017-04-09', address: 'B6 L10 PH5A, Dela Paz, A/C', guardian: 'Jerome B. Lizano', gradeLevel: 'Grade 3', section: 'Grade 3 - Simplicity' },
    { lrn: null, name: 'Medinueta, Arlaine Reign D.', gender: 'Female', contact: '09307662507', birthday: '2017-07-12', address: 'Kaysakat, San Jose, A/C', guardian: 'Ruffalyn D. Mendinueta', gradeLevel: 'Grade 3', section: 'Grade 3 - Simplicity' },
    { lrn: '494059220020', name: 'Modanza, Keylyn Elisha B.', gender: 'Female', contact: '09611072052', birthday: '2016-11-24', address: 'B22 L30 PH2b San Luis, A/C', guardian: 'Rosalyn G. Modanza', gradeLevel: 'Grade 3', section: 'Grade 3 - Simplicity' },
    { lrn: '494059220031', name: 'Obis, Miguel Khalel B.', gender: 'Male', contact: '09959902495', birthday: '2017-08-10', address: '1035 Sitio Maagay 2, Inarawan A/C', guardian: 'Rubyjoy B. Obis', gradeLevel: 'Grade 3', section: 'Grade 3 - Simplicity' },
    { lrn: '494059220021', name: 'Subejano, Vershka Fraise D.', gender: 'Female', contact: '09276052177', birthday: '2016-11-07', address: 'B22 L27 Sitio Maligaya, San Luis, A/C', guardian: 'Jennifer D. Dormido', gradeLevel: 'Grade 3', section: 'Grade 3 - Simplicity' },
    { lrn: '494059220018', name: 'Toyco, Annber Danielle F.', gender: 'Female', contact: '09456908645', birthday: '2017-02-26', address: 'Lot 8 B61 Ph2 BN2 San Isidro, A/C', guardian: 'Anna Therese', gradeLevel: 'Grade 3', section: 'Grade 3 - Simplicity' },
    { lrn: '494059220029', name: 'Vargas, Arkizha Loreen', gender: 'Female', contact: '09040596885', birthday: '2017-05-22', address: 'B12 L14 Sitio Maligaya, San Luis, A/C', guardian: 'Glorymhay M. Vargas', gradeLevel: 'Grade 3', section: 'Grade 3 - Simplicity' },
    { lrn: '494059220023', name: 'Vestodio, Martina T.', gender: 'Female', contact: '09214904329', birthday: '2016-11-17', address: 'Puting Bato, San Luis, A/C', guardian: 'Sarahjane T. Lumantay', gradeLevel: 'Grade 3', section: 'Grade 3 - Simplicity' },

    // Grade 4 - Benevolence
    { lrn: '494059210002', name: 'Butay, Honeylyn O.', gender: 'Female', contact: '09703106243', birthday: '2016-06-11', address: 'L19 B14, BN2B, San Luis, A/C', guardian: 'Jenelyn B. Oracoy', gradeLevel: 'Grade 4', section: 'Grade 4 - Benevolence' },
    { lrn: '109320210452', name: 'Calubayan, Sophia Celerine C.', gender: 'Female', contact: '09159574548', birthday: '2016-04-15', address: '07 814 L10 PH2b, San Luis, A/C', guardian: 'Jackie Lou C. Calubayan', gradeLevel: 'Grade 4', section: 'Grade 4 - Benevolence' },
    { lrn: '109336210040', name: 'Losantas, Amira Yael T.', gender: 'Female', contact: '09496630039', birthday: '2015-08-04', address: 'B23 L35 Peace Village PH3 San Luis, A/C', guardian: 'Jemar D. Losantas', gradeLevel: 'Grade 4', section: 'Grade 4 - Benevolence' },
    { lrn: '494059210001', name: 'Manligues, Vienne Hera Louise S.', gender: 'Female', contact: '09477430052', birthday: '2016-01-14', address: 'Block 14 Phase 2B BN2, San Luis Antipolo City', guardian: 'Venus Rizza S. Manligues', gradeLevel: 'Grade 4', section: 'Grade 4 - Benevolence' },
    { lrn: '136783200402', name: 'Montemayor, Lezcian Red S.', gender: 'Female', contact: '09286508055', birthday: '2015-10-10', address: 'Block 21 Lot 11, San Luis, Antipolo City', guardian: 'Eden Seranilla', gradeLevel: 'Grade 4', section: 'Grade 4 - Benevolence' },
    { lrn: null, name: 'Pagsuyoin, Loise Jayanne B.', gender: 'Female', contact: '09486796596', birthday: '2016-07-23', address: 'San Isidro, Antipolo City', guardian: 'Lorie Joy Benipayo', gradeLevel: 'Grade 4', section: 'Grade 4 - Benevolence' },
    { lrn: '494059210031', name: 'Queyquep, Dan Jacob M.', gender: 'Male', contact: '09955153098', birthday: '2014-12-10', address: 'B16 Lot 3 Purok Imelda, Dela Paz, A/C', guardian: 'Aprille Rose M. Queyquep', gradeLevel: 'Grade 4', section: 'Grade 4 - Benevolence' },
    { lrn: '494059210007', name: 'Santos, Ayesha Mae D.', gender: 'Female', contact: '0929488022', birthday: '2015-10-25', address: 'B17 L16 Ph2b, San Luis', guardian: 'Jean Meann T. Dela Cruz', gradeLevel: 'Grade 4', section: 'Grade 4 - Benevolence' },
    { lrn: '109320210192', name: 'Sumagang, Zia Dionne A.', gender: 'Female', contact: '09477071408', birthday: '2015-12-06', address: 'B22 L5 Ph2B San Luis, A/C', guardian: 'Christine Arales', gradeLevel: 'Grade 4', section: 'Grade 4 - Benevolence' },
    { lrn: '402873210002', name: 'Ylanan, Key-Yumi V.', gender: 'Female', contact: '09387255594', birthday: '2016-06-28', address: 'Sitio Kubli Maagay 3, Inarawan, A/C', guardian: 'Bryan Ylanan', gradeLevel: 'Grade 4', section: 'Grade 4 - Benevolence' },

    // Grade 5 - Sincerity
    { lrn: null, name: 'Cancino, Atarah Mizsha', gender: 'Female', contact: '09260237790', birthday: '2015-06-24', address: 'B7 L1-2 Ph2B, San Luis, A/C', guardian: 'Reyjelyn Cancino', gradeLevel: 'Grade 5', section: 'Grade 5 - Sincerity' },
    { lrn: '109320200041', name: 'Dioneda, Rhian Micah Ella F.', gender: 'Female', contact: '09057260851', birthday: '2015-03-19', address: '#89 B8 L16 BN2 San Isidro, A/C', guardian: 'Myra B. Fulgencio', gradeLevel: 'Grade 5', section: 'Grade 5 - Sincerity' },
    { lrn: '494059210029', name: 'Enriquez, Krystal Scarlett L.', gender: 'Female', contact: '09212292407', birthday: '2014-09-19', address: 'B16 L45 Peace Village, San Luis, A/C', guardian: 'Aivy Labaguis', gradeLevel: 'Grade 5', section: 'Grade 5 - Sincerity' },
    { lrn: '494059200001', name: 'Montemayor, Iszaack Herb S.', gender: 'Male', contact: '09286508055', birthday: '2014-10-24', address: 'Block 21 Lot 11, San Luis, Antipolo City', guardian: 'Eden Serranilla', gradeLevel: 'Grade 5', section: 'Grade 5 - Sincerity' },
    { lrn: '109320200662', name: 'Resurreccion, Paul Jeremiah S.', gender: 'Male', contact: '09668275335', birthday: '2015-09-28', address: '#170 B12 L22 Ph1 BN2 San Isidro A/C', guardian: 'Rose S. Resureccion', gradeLevel: 'Grade 5', section: 'Grade 5 - Sincerity' },
    { lrn: '494059190002', name: 'Saclao, Bienjamin C.', gender: 'Male', contact: '09107688034', birthday: '2014-06-22', address: 'B3 L4 Ph4A Dela Paz, A/C', guardian: 'Mary Joy Carniyan', gradeLevel: 'Grade 5', section: 'Grade 5 - Sincerity' },
    { lrn: '107912210652', name: 'Valderrama, Alexandre lan C.', gender: 'Male', contact: '09686347108', birthday: '2015-01-26', address: 'L3 Ph2b, BN2b, San Luis, A/c', guardian: 'May C. Valderrama', gradeLevel: 'Grade 5', section: 'Grade 5 - Sincerity' },

    // Grade 6 - Responsibility
    { lrn: '402939190001', name: 'Asakil, Datu Rayshan Aijaz P.', gender: 'Male', contact: '09498560770', birthday: '2014-08-04', address: 'B23 L14 PH2B, San Luis, A/C', guardian: 'Roseanne P. Asakil', gradeLevel: 'Grade 6', section: 'Grade 6 - Responsibility' },
    { lrn: '494059190003', name: 'Bolivar, Casiuz Adriel M.', gender: 'Male', contact: '09665576207', birthday: '2014-08-23', address: 'B38 L2 Sambaville San Luis, A/C', guardian: 'Manilyn M. Bolivar', gradeLevel: 'Grade 6', section: 'Grade 6 - Responsibility' },
    { lrn: '40217918003', name: 'Bustamante, Gabrielle James F.', gender: 'Male', contact: '09154649312', birthday: '2013-07-11', address: 'B10 L3 PH2 BN2, A/C', guardian: 'Jessalie C. Fuedan', gradeLevel: 'Grade 6', section: 'Grade 6 - Responsibility' },
    { lrn: '494059190001', name: 'Dioneda, Xhian Justine F.', gender: 'Male', contact: '09057260851', birthday: '2013-09-29', address: '#89 Block 8 Lot 16 BN2, San Isidro, Antipolo City', guardian: 'Myra B. Fulgencio', gradeLevel: 'Grade 6', section: 'Grade 6 - Responsibility' },
    { lrn: '494059180007', name: 'Milo, Cyrile Ace G.', gender: 'Male', contact: '09100968842', birthday: '2013-05-06', address: 'Phase 2 B, San Luis Antipolo City', guardian: 'Regine A. Gapol', gradeLevel: 'Grade 6', section: 'Grade 6 - Responsibility' },
    { lrn: '105210180025', name: 'Tamondong, Percious Zia H.', gender: 'Female', contact: '09284360480', birthday: '2013-04-15', address: 'B4 L9 San Isidro, A/C', guardian: 'Precious Zia H. Tamondong', gradeLevel: 'Grade 6', section: 'Grade 6 - Responsibility' },

    // Grade 7 - Perseverance
    { lrn: '494036150013', name: 'Anqui, Khyrwyn Matheo B.', gender: 'Male', contact: '09266683671', birthday: '2011-03-17', address: 'B21 L4 Bagong Nayon 2, A/C', guardian: 'Emelie B. Anqui', gradeLevel: 'Grade 7', section: 'Grade 7 - Perseverance' },
    { lrn: '409568180004', name: 'Basagre, Mark Gian M.', gender: 'Male', contact: '09186774329', birthday: '2013-02-22', address: 'BLOCK 20 LOT 36 PEACE VILLAGE', guardian: 'GLORIA BASAGRE', gradeLevel: 'Grade 7', section: 'Grade 7 - Perseverance' },
    { lrn: '494059180016', name: 'Cantorna, Jun Matthew J.', gender: 'Male', contact: '09260834666', birthday: '2012-10-19', address: 'B61 L11 BN2 Ph2, San Isidro A/C', guardian: 'Elineta F. Crisostomo', gradeLevel: 'Grade 7', section: 'Grade 7 - Perseverance' },
    { lrn: '409568180020', name: 'Jumalon, Marcial Joel S.', gender: 'Male', contact: '09381657092', birthday: '2013-02-21', address: 'Kaysakat 1 Veterans, San Jose, A/C', guardian: 'Patrick J. Rayos', gradeLevel: 'Grade 7', section: 'Grade 7 - Perseverance' },
    { lrn: '494059180057', name: 'Padilla, Ethan Mathew P.', gender: 'Male', contact: '09708027432', birthday: '2012-08-10', address: 'Excess Lot a Phase 2B BN2, San Luis Antipolo City', guardian: 'Erlin P. Padilla', gradeLevel: 'Grade 7', section: 'Grade 7 - Perseverance' },
    { lrn: null, name: 'Tejano, Ayesha Kaye L.', gender: 'Female', contact: '09090280092', birthday: '2013-01-31', address: 'B4 L14 P3 Peace Village, San Luis, A/C', guardian: 'Ronalyn Tejano', gradeLevel: 'Grade 7', section: 'Grade 7 - Perseverance' },
    { lrn: '494059180005', name: 'Toyco, Berann Terence F.', gender: 'Male', contact: '09099042977', birthday: '2013-04-14', address: 'Lot 8 B61 Ph2 BN2 San Isidro, A/C', guardian: 'Anna Therese Venus Fulo', gradeLevel: 'Grade 7', section: 'Grade 7 - Perseverance' },
    { lrn: '409568180003', name: 'Victorino, Rhiana Nicole L.', gender: 'Female', contact: '09282035554', birthday: '2013-05-30', address: 'Block 25, Lot 32 Peace Village, San Luis, A/C', guardian: 'Jenilyn L. Victorino', gradeLevel: 'Grade 7', section: 'Grade 7 - Perseverance' },

    // Grade 8 - Integrity
    { lrn: '500334170056', name: 'Butay, Hidden Christian O.', gender: 'Male', contact: '09164873088', birthday: '2011-08-24', address: '139 B14, BN2B, San Luis, A/C', guardian: 'Jenelyn B. Oracoy', gradeLevel: 'Grade 8', section: 'Grade 8 - Integrity' },
    { lrn: '494094170007', name: 'Icawat, Roent Jay O.', gender: 'Male', contact: '09920453851', birthday: '2012-05-20', address: 'B18 Excess Lot Ph2B, San Luis, A/C', guardian: 'Gemma I. Bermejo', gradeLevel: 'Grade 8', section: 'Grade 8 - Integrity' },
    { lrn: '402939160034', name: 'Montemayor, Tiffany Hash S.', gender: 'Female', contact: '09286508055', birthday: '2011-10-22', address: 'Block 21 Lot 11, San Luis, Antipolo City', guardian: 'Eden Serranilla', gradeLevel: 'Grade 8', section: 'Grade 8 - Integrity' },
    { lrn: '494059170010', name: 'Obis, Matt Zaniel B.', gender: 'Male', contact: '09959902495', birthday: '2011-11-16', address: '1035 Sitio Maagay 2, Inarawan A/C', guardian: 'Rubyjoy B. Obis', gradeLevel: 'Grade 8', section: 'Grade 8 - Integrity' },

    // Grade 9 - Optimism
    { lrn: '494059160095', name: 'Agojo, Joshua Lemuel V.', gender: 'Male', contact: '09552550511', birthday: '2011-07-07', address: 'B23 L44 Peace Vill. PH3, San Luis, A/C', guardian: 'Melissa Agojo', gradeLevel: 'Grade 9', section: 'Grade 9 - Optimism' },
    { lrn: '494044170038', name: 'Galura, James Manuel A.', gender: 'Male', contact: '', birthday: '2013-04-18', address: 'Purok Silangan, Dela Paz, A/C', guardian: 'Miguela Galura', gradeLevel: 'Grade 9', section: 'Grade 9 - Optimism' },
    { lrn: '109320170926', name: 'Santiago, Kalvyn Daniella L.', gender: 'Female', contact: '09212292402', birthday: '2010-05-07', address: 'B16 L45 Peace Village, San Luis, A/C', guardian: 'Aivy M. Labaguis', gradeLevel: 'Grade 9', section: 'Grade 9 - Optimism' },
    { lrn: '109320160797', name: 'Smith, William Caden A.', gender: 'Male', contact: '09612085302', birthday: '2011-07-04', address: 'Block 21 Lo12 BNII, San Isidro A/C', guardian: 'Joyce Ann Arguelles', gradeLevel: 'Grade 9', section: 'Grade 9 - Optimism' },

    // Grade 10 - Dependability
    { lrn: '494059150025', name: 'Aquino, John Clare B.', gender: 'Male', contact: '09306805911', birthday: '2008-08-11', address: 'Annex 3 Sambaville, San Luis, A/C', guardian: 'Ma. Ave B. Aquino', gradeLevel: 'Grade 10', section: 'Grade 10 - Dependability' },
    { lrn: '485025150011', name: 'Roque, Daniella Sophia D.', gender: 'Female', contact: '09084381670', birthday: '2010-06-15', address: 'Block 5 BN2, San Isidro, A/C', guardian: 'Rick F. Roque', gradeLevel: 'Grade 10', section: 'Grade 10 - Dependability' },
    { lrn: '494059210011', name: 'Victorino, Rain Justine L.', gender: 'Male', contact: '09282035554', birthday: '2009-04-19', address: 'B25 L32 Peace village Phase 3, San Luis', guardian: 'Jenilyn Victorino', gradeLevel: 'Grade 10', section: 'Grade 10 - Dependability' },
  ]

  console.log(`Creating ${allStudentsData.length} students...`)

  for (const data of allStudentsData) {
    const { firstName, middleName, lastName } = parseName(data.name)
    const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim()
    const address = parseAddress(data.address)

    // Use upsert for students with LRN
    let student
    if (data.lrn) {
      student = await prisma.student.upsert({
        where: { lrn: data.lrn },
        update: {
          firstName,
          middleName,
          lastName,
          fullName,
          gender: data.gender as 'Male' | 'Female',
          contactNumber: data.contact,
          dateOfBirth: new Date(data.birthday),
          houseNumber: address.houseNumber,
          street: address.street,
          barangay: address.barangay,
          city: address.city,
          province: address.province,
          parentGuardian: data.guardian,
          gradeLevel: data.gradeLevel,
          enrollmentStatus: 'ENROLLED',
        },
        create: {
          lrn: data.lrn,
          firstName,
          middleName,
          lastName,
          fullName,
          gender: data.gender as 'Male' | 'Female',
          contactNumber: data.contact,
          dateOfBirth: new Date(data.birthday),
          houseNumber: address.houseNumber,
          street: address.street,
          barangay: address.barangay,
          city: address.city,
          province: address.province,
          parentGuardian: data.guardian,
          gradeLevel: data.gradeLevel,
          enrollmentStatus: 'ENROLLED',
          isTransferee: false,
        },
      })
    } else {
      // For students without LRN, create new record
      student = await prisma.student.create({
        data: {
          lrn: null,
          firstName,
          middleName,
          lastName,
          fullName,
          gender: data.gender as 'Male' | 'Female',
          contactNumber: data.contact,
          dateOfBirth: new Date(data.birthday),
          houseNumber: address.houseNumber,
          street: address.street,
          barangay: address.barangay,
          city: address.city,
          province: address.province,
          parentGuardian: data.guardian,
          gradeLevel: data.gradeLevel,
          enrollmentStatus: 'ENROLLED',
          isTransferee: false,
        },
      })
    }

    // Check if enrollment already exists
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: student.id,
        academicYearId: academicYear.id,
      },
    })

    if (!existingEnrollment) {
      const sectionEnum = mapSectionToEnum(data.section)
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          academicYearId: academicYear.id,
          schoolYear: academicYear.name,
          gradeLevel: data.gradeLevel,
          section: sectionEnum,
          status: 'ENROLLED',
        },
      })
      console.log(`✓ ${fullName} - ${data.gradeLevel} - ${sectionEnum}`)
    } else {
      console.log(`• ${fullName} - Already enrolled`)
    }
  }

  console.log('\n✓ Seed completed successfully!')
  console.log(`Total students: ${allStudentsData.length}`)
  console.log(`Academic Year: ${academicYear.name} (ACTIVE)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
