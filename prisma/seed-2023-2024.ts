import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { createSections, getSectionId } from './seed-helpers'

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

  // Create sections
  await createSections(prisma)

  // Create 2023-2024 academic year
  const academicYear = await prisma.academicYear.upsert({
    where: { name: '2023-2024' },
    update: {
      isActive: false,
    },
    create: {
      name: '2023-2024',
      startDate: new Date('2023-08-01'),
      endDate: new Date('2024-05-31'),
      isActive: false,
    },
  })
  console.log('Academic year created:', academicYear.name)

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

  // All students data
  const allStudentsData = [
    // Kindergarten 1 - Enthusiasm
    { lrn: null, name: 'Abinggosa, Earl Daven J.', gender: 'Male', contact: '0999468895', birthday: '2018-10-15', address: 'Ph3B, St. Anthony, Brgy. Inarawan, A/C', guardian: 'Aileen Abinggosa', gradeLevel: 'Kinder 1', section: 'Kinder 1 - Enthusiasm' },
    { lrn: null, name: 'Bugnosen, Carl Eduard L.', gender: 'Male', contact: '09171858965', birthday: '2019-06-07', address: 'Lot C B14, NHA Ave., Sitio Maliciava, San Isidro, A/C', guardian: 'Jessa L. Bugnosen', gradeLevel: 'Kinder 1', section: 'Kinder 1 - Enthusiasm' },
    { lrn: null, name: 'Lique, John Reaven A.', gender: 'Male', contact: '09993898106', birthday: '2019-04-20', address: 'B17 LB, Manzanilla St., Sambaville, San Luis, A/C', guardian: 'Mirzi Alarcon', gradeLevel: 'Kinder 1', section: 'Kinder 1 - Enthusiasm' },
    { lrn: null, name: 'Lim, Leanne Kaide Sarai R.', gender: 'Female', contact: '0935675686', birthday: '2019-01-01', address: 'San Luis, Antipolo City', guardian: 'Ninna Rossi S. Rodolfo', gradeLevel: 'Kinder 1', section: 'Kinder 1 - Enthusiasm' },
    { lrn: null, name: 'Javier, Miguel Sebastian C.', gender: 'Male', contact: '09073064920', birthday: '2019-06-05', address: '676 Sitio sapinit, San Juan, A/C', guardian: 'Alyssa Liel Rose G. Carisma', gradeLevel: 'Kinder 1', section: 'Kinder 1 - Enthusiasm' },
    { lrn: null, name: 'Serafin, Dream F.', gender: 'Male', contact: '09506358927', birthday: '2019-03-10', address: 'B16 L17 Ph2b, San Luis, Antipolo City', guardian: 'Maribel Serafin', gradeLevel: 'Kinder 1', section: 'Kinder 1 - Enthusiasm' },

    // Kindergarten 2 - Enthusiasm
    { lrn: '494059230004', name: 'Abellar, Euan Mark A.', gender: 'Male', contact: '09613207634', birthday: '2018-02-16', address: 'B21 L20 PH2B, Brgy. San Luis, A/C', guardian: 'Christina A. Abellar', gradeLevel: 'Kinder 2', section: 'Kinder 2 - Enthusiasm' },
    { lrn: '494059230003', name: 'Balacuit, Sean Zion B.', gender: 'Male', contact: '09305967756', birthday: '2017-11-18', address: 'B32 L5 Sambaville, San Luis, A/C', guardian: 'Roxan M. Balacuit', gradeLevel: 'Kinder 2', section: 'Kinder 2 - Enthusiasm' },
    { lrn: null, name: 'Virtucio, Marcus Achilles I.', gender: 'Male', contact: '09153622187', birthday: '2018-04-17', address: '#32 L2 B3 BN2, San Isidro, A/C', guardian: 'Margie A. Ibardolasa', gradeLevel: 'Kinder 2', section: 'Kinder 2 - Enthusiasm' },
    { lrn: null, name: 'Martins, Henrique', gender: 'Male', contact: '', birthday: '2018-01-02', address: 'B21 L12 San Isidro, A/C', guardian: 'Joyceann A. Martins', gradeLevel: 'Kinder 2', section: 'Kinder 2 - Enthusiasm' },
    { lrn: '494059230001', name: 'Retreta, Jannica Faith S.', gender: 'Female', contact: '09385530888', birthday: '2018-05-18', address: 'B15 L5 San Luis, A/C', guardian: 'Joy A. Salazar', gradeLevel: 'Kinder 2', section: 'Kinder 2 - Enthusiasm' },
    { lrn: '494059230002', name: 'Gagaza, Carly Louise C.', gender: 'Female', contact: '09098878856', birthday: '2018-05-31', address: '0341 Sitio Maagay I, Brgy. Inarawan, A/C', guardian: 'Reynalin P. Cagang', gradeLevel: 'Kinder 2', section: 'Kinder 2 - Enthusiasm' },
    { lrn: null, name: 'Toyco, Annber Dennise F.', gender: 'Female', contact: '09456908645', birthday: '2018-04-13', address: '950 B8 L61 Ph2, BN2, San Isidro, A/C', guardian: 'Bernardo T. Toyco', gradeLevel: 'Kinder 2', section: 'Kinder 2 - Enthusiasm' },

    // Grade 1 - Obedience
    { lrn: '494059220024', name: 'Arda, Carl Vincent C.', gender: 'Male', contact: '09399283865', birthday: '2017-07-24', address: 'B3 L16 Ph2B, BN2, San Luis, A/C', guardian: 'Jepherson D. Arda', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },
    { lrn: '494059220027', name: 'Lizano, Jeiyramme Dhenize C.', gender: 'Female', contact: '09335283367', birthday: '2017-04-09', address: 'B6 L10 PHSA Brgy. Dela Paz, A/C', guardian: 'Jerome B. Lizano', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },
    { lrn: '494059220020', name: 'Modanza, Keylyn Elisha B.', gender: 'Female', contact: '09611072052', birthday: '2016-11-24', address: 'B22 L30 PH2b San Luis, A/C', guardian: 'Rosalyn G. Modanza', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },
    { lrn: '494059220021', name: 'Subejano, Vershka Fraise D.', gender: 'Female', contact: '09276052177', birthday: '2016-11-07', address: 'B22 L27 Sitio Maligaya, San Luis, A/C', guardian: 'Jennifer D. Dormido', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },
    { lrn: '494059220018', name: 'Toyco, Annber Danielle F.', gender: 'Female', contact: '09456908645', birthday: '2017-02-26', address: 'Lot 8 861 Ph2 BN2 San Isidro, A/C', guardian: 'Anna Therese', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },
    { lrn: '494059220029', name: 'Vargas, Arkizha Loreen', gender: 'Female', contact: '09040596885', birthday: '2017-05-22', address: 'B12 L14 Sitio Maligaya, San Luis, A/C', guardian: 'Glorymhay M. Vargas', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },
    { lrn: '494059220023', name: 'Vestodio, Martina T.', gender: 'Female', contact: '09214904329', birthday: '2016-11-17', address: 'Puting Bato, San Luis, A/C', guardian: 'Sarahjane T. Lumantay', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },
    { lrn: '494059220017', name: 'Saldo, Angelo N.', gender: 'Male', contact: '09565149199', birthday: '2017-08-29', address: 'B2 L22 BN2 San Isidro, A/C', guardian: 'May Ann B. Napalan', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },
    { lrn: '494059220030', name: 'Remolona, Demree M.', gender: 'Female', contact: '09982737139', birthday: '2017-06-29', address: 'B2 L20 BN2 San Isidro, A/C', guardian: 'Rodante Remolona', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },
    { lrn: '494059220031', name: 'Obis, Miguel Khalel B.', gender: 'Male', contact: '09183297815', birthday: '2017-08-10', address: '1035 Sitio Maagay 2, Brgy. Inarawan A/C', guardian: 'Rubyjoy B. Obis', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience', remarks: 'kinder 2' },
    { lrn: '109321220287', name: 'Ibayan, Luke B.', gender: 'Male', contact: '09072852009', birthday: '2017-01-17', address: 'Maagay, Brgy. Inarawan, A/C', guardian: 'Melinda L. Baraquiel', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },
    { lrn: '109472220017', name: 'Igon-Egon, Eldelyn A.', gender: 'Female', contact: '09815414119', birthday: '2017-01-21', address: 'B10 L4 Steelhomes San Luis, A/C', guardian: 'Gloria A. Igon-Igon', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },
    { lrn: '494059220038', name: 'Datoon, Kyle Harrell', gender: 'Male', contact: '09498534219', birthday: '2016-01-12', address: 'N6 L3 Ph2b, Brgy. San Luis, A/C', guardian: 'Amy Talandron', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },
    { lrn: '494059220037', name: 'Ariola, Dean Casstiel K.', gender: 'Male', contact: '0963996441', birthday: '2016-04-08', address: 'NB19 L10 Ph2b, San Luis, A/C', guardian: 'Cristina b. Nuezca', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },
    { lrn: null, name: 'Villaflor, Prince Xavier T.', gender: 'Male', contact: '09164230209', birthday: '2017-05-30', address: 'B18 Excess Lot Sitio Maligaya, San Luis, A/C', guardian: 'Lovely Yen Villaflor', gradeLevel: 'Grade 1', section: 'Grade 1 - Obedience' },

    // Grade 2 - Hospitality
    { lrn: '494059210002', name: 'Butay, Honeylyn O.', gender: 'Female', contact: '09703106243', birthday: '2016-06-11', address: 'L19 B14, BN2B, San Luis, A/C', guardian: 'Jenelyn B. Oracoy', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality' },
    { lrn: '109320210452', name: 'Calubayan, Sophia Celerine C.', gender: 'Female', contact: '09159574548', birthday: '2016-04-15', address: '07 814 L10 PH2b, San Luis, A/C', guardian: 'Jackie Lou C. Calubayan', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality' },
    { lrn: '494059210001', name: 'Manligues, Vienne Hera Louise S.', gender: 'Female', contact: '09477430052', birthday: '2016-01-14', address: 'Block 14 Phase 2B BN2 Brgy. San Luis Antipolo City', guardian: 'Venus Rizza S. Manligues', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality' },
    { lrn: '494059210010', name: 'Pascual, Abijah Clemente L.', gender: 'Male', contact: '09063649621', birthday: '2016-10-28', address: 'Purok 4, Brgy. Calawis, Antipolo City', guardian: 'Charlemagne Rinier C. Pascual', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality', remarks: 'PASAY' },
    { lrn: '494059210031', name: 'Queyquep, Dan Jacob M.', gender: 'Male', contact: '09955153098', birthday: '2014-12-10', address: 'B16 Lot 3 Purok Imelda, Dela Paz, A/C', guardian: 'Aprille Rose M. Queyquep', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality', remarks: 'special class' },
    { lrn: '109320210121', name: 'Recato, Zeth Andrei Colin C.', gender: 'Male', contact: '09654768520', birthday: '2015-07-13', address: 'Blk 54 Lot 11 Phase 2 Bagong Nayon 2, San Isidro, A/C', guardian: 'Don S. Recato', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality' },
    { lrn: '494059210007', name: 'Santos, Ayesha Mae D.', gender: 'Female', contact: '0929488022', birthday: '2015-10-25', address: 'B17 L16 Ph2b, San Luis', guardian: 'Jean Meann T. Dela Cruz', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality' },
    { lrn: '109320210192', name: 'Sumagang, Zia Dionne A.', gender: 'Female', contact: '09477071408', birthday: '2015-12-06', address: 'B22 L5 Ph2B San Luis, A/C', guardian: 'Christine Arales', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality', remarks: 'special class' },
    { lrn: '402873210002', name: 'Ylanan, Key-Yumi V.', gender: 'Female', contact: '09387255594', birthday: '2016-06-28', address: 'Sitio Kubli Maagay 3, Inarowan, A/C', guardian: 'Bryan Ylanan', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality' },
    { lrn: '109336210040', name: 'Losantas, Amira Yael T.', gender: 'Female', contact: '09496630039', birthday: '2015-08-04', address: 'B23 L35 Peace Village PH3 San Luis, A/C', guardian: 'Jemar D. Losantas', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality' },
    { lrn: '136783200402', name: 'Montemayor, Lezcian Red S.', gender: 'Female', contact: '09286508055', birthday: '2015-10-10', address: 'Block 21 Lot 11 Brgy. San Luis, Antipolo City', guardian: 'Eden Seranilla', gradeLevel: 'Grade 2', section: 'Grade 2 - Hospitality' },

    // Grade 3 - Simplicity
    { lrn: '109320200041', name: 'Dioneda, Rhian Micah Ella F.', gender: 'Female', contact: '09057260851', birthday: '2015-03-19', address: '#89 B8 L16 BN2 San Isidro, A/C', guardian: 'Myra B. Fulgencio', gradeLevel: 'Grade 3', section: 'Grade 3 - Simplicity', remarks: 'bn2 elementary school' },
    { lrn: '494059210029', name: 'Enriquez, Krystal Scarlett L.', gender: 'Female', contact: '09212292407', birthday: '2014-09-19', address: 'B16 L45 Peace Village, San Luis, A/C', guardian: 'Aivy Labaguis', gradeLevel: 'Grade 3', section: 'Grade 3 - Simplicity' },
    { lrn: '501227200005', name: 'Guzman, Lheohann Dave V.', gender: 'Male', contact: '09129881097', birthday: '2015-02-20', address: 'B27 L6 PhilB San Luis, A/C', guardian: 'Roseann A. Verona', gradeLevel: 'Grade 3', section: 'Grade 3 - Simplicity' },
    { lrn: '494059200001', name: 'Montemayor, Iszaack Herb S.', gender: 'Male', contact: '09286508055', birthday: '2014-10-24', address: 'Block 21 Lot 11 Brgy. San Luis, Antipolo City', guardian: 'Eden Serranilla', gradeLevel: 'Grade 3', section: 'Grade 3 - Simplicity', remarks: 'Bangan Capayawan Integrated School - Zambales' },
    { lrn: '109320200662', name: 'Resurreccion, Paul Jeremiah S.', gender: 'Male', contact: '09668275335', birthday: '2015-09-28', address: '#170 B12 L22 Ph1 BN2 San Isidro A/C', guardian: 'Rose S. Resureccion', gradeLevel: 'Grade 3', section: 'Grade 3 - Simplicity' },
    { lrn: '494059190002', name: 'Saclao, Bienjamin C.', gender: 'Male', contact: '09107688034', birthday: '2014-06-22', address: 'B3 L4 Ph4A Dela Paz, A/C', guardian: 'Mary Joy Carniyan', gradeLevel: 'Grade 3', section: 'Grade 3 - Simplicity' },
    { lrn: '494507190006', name: 'Madelo, Rionna E', gender: 'Female', contact: '09350592772', birthday: '2014-07-20', address: 'B17 L11 BN2b, Brgy. San Luis, A/C', guardian: 'Emelyn Madelo', gradeLevel: 'Grade 3', section: 'Grade 3 - Simplicity' },
    { lrn: '107912210652', name: 'Valderrama, Alexandre lan C.', gender: 'Male', contact: '09686347108', birthday: '2015-01-26', address: 'L3 Ph2b, BN2b, Brgy. San Luis, A/c', guardian: 'May C. Valderrama', gradeLevel: 'Grade 3', section: 'Grade 3 - Simplicity' },
    { lrn: '109320200175', name: 'Bofell, Samantha Kian M.', gender: 'Female', contact: '09604042509', birthday: '2015-08-08', address: 'BS L17 Ph2B, San Luis, A/C', guardian: 'Jillianae Faye M.', gradeLevel: 'Grade 3', section: 'Grade 3 - Simplicity' },
    { lrn: '109320200430', name: 'Gorospe, Ernaiah S.', gender: 'Female', contact: '', birthday: '2014-09-08', address: 'San Luis, Antipolo City', guardian: 'Guardian Name', gradeLevel: 'Grade 3', section: 'Grade 3 - Simplicity' },

    // Grade 4 - Benevolence
    { lrn: '402939190001', name: 'Asakil, Datu Rayshan Aijaz P.', gender: 'Male', contact: '09218415728', birthday: '2014-08-04', address: 'B23 L14 PH2B, Brgy. San Luis, A/C', guardian: 'Roseanne P. Asakil', gradeLevel: 'Grade 4', section: 'Grade 4 - Benevolence' },
    { lrn: '494059190003', name: 'Bolivar, Casiuz Adriel M.', gender: 'Male', contact: '09665576207', birthday: '2014-08-23', address: 'B38 L2 Sambaville San Luis, A/C', guardian: 'Manilyn M. Bolivar', gradeLevel: 'Grade 4', section: 'Grade 4 - Benevolence' },
    { lrn: '494059190001', name: 'Dioneda, Xhian Justine F.', gender: 'Male', contact: '09057260851', birthday: '2013-09-29', address: '#89 Block 8 Lot 16 BN2, Brgy. San Isidro, Antipolo City', guardian: 'Myra B. Fulgencio', gradeLevel: 'Grade 4', section: 'Grade 4 - Benevolence' },
    { lrn: '494059180007', name: 'Milo, Cyrile Ace G.', gender: 'Male', contact: '09100968842', birthday: '2013-05-06', address: 'Phase 2 B Brgy. San Luis Antipolo City', guardian: 'Regine A. Gapol', gradeLevel: 'Grade 4', section: 'Grade 4 - Benevolence' },
    { lrn: '40217918003', name: 'Bustamante, Gabrielle James F.', gender: 'Male', contact: '09123036975', birthday: '2013-07-11', address: 'B10 L3 PH2 BN2, A/C', guardian: 'Jessalie C. Fuedan', gradeLevel: 'Grade 4', section: 'Grade 4 - Benevolence', remarks: 'Baleleng elem school, Sto. Tomas' },
    { lrn: '105210180025', name: 'Tamondong, Percious Zia', gender: 'Female', contact: '09284360480', birthday: '2013-04-15', address: 'B4 L9 San Isidro, A/C', guardian: 'Precious Zia H. Tamondong', gradeLevel: 'Grade 4', section: 'Grade 4 - Benevolence', remarks: 'Shepherds Angel Christian School of Antipolo, Inc.' },

    // Grade 5 - Sincerity
    { lrn: '136724180014', name: 'Abellar, Euna Mae A.', gender: 'Female', contact: '09613207634', birthday: '2013-07-04', address: 'B21 L20 PH2B, Brgy. San Luis, A/C', guardian: 'Christina A. Abellar', gradeLevel: 'Grade 5', section: 'Grade 5 - Sincerity' },
    { lrn: '409568180004', name: 'Basagre, Mark Gian M.', gender: 'Male', contact: '09186774329', birthday: '2013-02-22', address: 'BLOCK 20 LOT 36 PEACE VILLAGE', guardian: 'GLORIA BASAGRE', gradeLevel: 'Grade 5', section: 'Grade 5 - Sincerity' },
    { lrn: '409568180019', name: 'Belleza, Jillian Maxine', gender: 'Female', contact: '09564191874', birthday: '2012-04-09', address: 'B2 L32 Peace Vill., San Luis, A/C', guardian: 'Guardian Name', gradeLevel: 'Grade 5', section: 'Grade 5 - Sincerity' },
    { lrn: '494059180016', name: 'Cantorna, Jun Matthew J.', gender: 'Male', contact: '09260834666', birthday: '2012-10-19', address: 'B61 L11 BN2 Ph2, San Isidro A/C', guardian: 'Elineta F. Crisostomo', gradeLevel: 'Grade 5', section: 'Grade 5 - Sincerity', remarks: 'BN2 Elem School' },
    { lrn: '409568180011', name: 'Carillo, Sofia Nicole M.', gender: 'Female', contact: '09064670487', birthday: '2013-03-17', address: 'BLOCK 16 L10 PEACE VILLAGE', guardian: 'CHERRY ROSE CARILLO', gradeLevel: 'Grade 5', section: 'Grade 5 - Sincerity' },
    { lrn: '409568180005', name: 'Guzman, Drew Andrei D.', gender: 'Male', contact: '09216965894', birthday: '2012-10-19', address: 'B25 L33 PEACE VILLAGE', guardian: 'LARITA D. GUZMAN', gradeLevel: 'Grade 5', section: 'Grade 5 - Sincerity' },
    { lrn: '409568180020', name: 'Jumalon, Marcial Joel S.', gender: 'Male', contact: '09381657092', birthday: '2013-02-21', address: 'Kaysakat 1 Veterans, San Jose, A/C', guardian: 'Patrick J. Rayos', gradeLevel: 'Grade 5', section: 'Grade 5 - Sincerity' },
    { lrn: '494059180009', name: 'Soriano, Kayleigh N.', gender: 'Female', contact: '09214901459', birthday: '2013-03-06', address: 'Block 14 Phase 2B BN2 Brgy. San Luis City', guardian: 'Cezarah G. Nerio', gradeLevel: 'Grade 5', section: 'Grade 5 - Sincerity' },
    { lrn: '494059180005', name: 'Toyco, Berann Terence F.', gender: 'Male', contact: '09099042977', birthday: '2013-04-14', address: '950 Blk 61 Lot 8 Ph2, BN2, Antipolo City', guardian: 'Anna Therese Venus Fulo', gradeLevel: 'Grade 5', section: 'Grade 5 - Sincerity' },
    { lrn: '409568180003', name: 'Victorino, Rhiana Nicole L.', gender: 'Female', contact: '09282035554', birthday: '2013-05-30', address: 'Block 25, Lot 32 Peace Village, Brgy. San Luis, A/C', guardian: 'Jenilyn L. Victorino', gradeLevel: 'Grade 5', section: 'Grade 5 - Sincerity' },
    { lrn: '494059180057', name: 'Padilla, Ethan Mathew P.', gender: 'Male', contact: '09708027432', birthday: '2012-08-10', address: 'Excess Lot a Phase 2B BN2 Brgy. San Luis Antipolo City', guardian: 'Erlin P. Padilla', gradeLevel: 'Grade 5', section: 'Grade 5 - Sincerity' },
    { lrn: '109479180116', name: 'Datoon, Kaizen T.', gender: 'Male', contact: '09498534219', birthday: '2012-11-12', address: 'B6 L3 Ph2b, Sambaville San Luis, A /C', guardian: 'Amy Talandron', gradeLevel: 'Grade 5', section: 'Grade 5 - Sincerity', remarks: 'San Rafael Elem School, Montalban' },
    { lrn: '109320171070', name: 'Ugalde, Apple May V.', gender: 'Female', contact: '09101615536', birthday: '2010-05-05', address: 'B12 L15 Sitio Maligaya, San Luis, A/C', guardian: 'Deiam Joy Ugalde', gradeLevel: 'Grade 5', section: 'Grade 5 - Sincerity', remarks: 'BN2 ELEM SCHOOL' },

    // Grade 6 - Responsibility
    { lrn: '494059170056', name: 'Andales, Emmanuel Dwight G.', gender: 'Male', contact: '09171445916', birthday: '2012-06-29', address: 'Brgy. San Luis, Antipolo City', guardian: 'Carol B. Gratuito', gradeLevel: 'Grade 6', section: 'Grade 6 - Responsibility' },
    { lrn: '494036150013', name: 'Anqui, Khyrwyn Matheo B.', gender: 'Male', contact: '09266683671', birthday: '2011-03-17', address: 'B21 L4 Bagong Nayon 2, A/C', guardian: 'Emelie B. Anqui', gradeLevel: 'Grade 6', section: 'Grade 6 - Responsibility' },
    { lrn: '500334170056', name: 'Butay, Hidden Christian', gender: 'Male', contact: '09164873088', birthday: '2011-08-24', address: 'L39 814, BN2B, Brgy. San Luis, A/C', guardian: 'Jenelyn B. Oracoy', gradeLevel: 'Grade 6', section: 'Grade 6 - Responsibility' },
    { lrn: '494059180003', name: 'De Guzman, Reeanne Liz S.', gender: 'Female', contact: '09095943458', birthday: '2012-03-08', address: '#191 Block 14 Lot 3 BN2 Antipolo City', guardian: 'Marilou M. Mendones', gradeLevel: 'Grade 6', section: 'Grade 6 - Responsibility' },
    { lrn: '109320170155', name: 'Dequito, Xian Fernand G.', gender: 'Male', contact: '09694035204', birthday: '2012-04-16', address: '1334 Sitio Maagay 2, Brgy. Inarawan A/C', guardian: 'Editha Dequito', gradeLevel: 'Grade 6', section: 'Grade 6 - Responsibility' },
    { lrn: '494094170007', name: 'Icawat, Roent Jay O.', gender: 'Male', contact: '09672612425', birthday: '2012-05-20', address: 'B18 Excess Lot Ph2B, San Luis, A/C', guardian: 'Gemma I. Bermejo', gradeLevel: 'Grade 6', section: 'Grade 6 - Responsibility' },
    { lrn: '402939160024', name: 'Kondo, Hiroaki B.', gender: 'Male', contact: '095687069470', birthday: '2011-11-28', address: 'B3 L25B Sitio Epheta San Isidro A/C', guardian: 'Aigie Joy Baylon', gradeLevel: 'Grade 6', section: 'Grade 6 - Responsibility', remarks: 'bn2 elem school' },
    { lrn: '402939160034', name: 'Montemayor, Tiffany Hash S.', gender: 'Female', contact: '09286508055', birthday: '2011-10-22', address: 'Block 21 Lot 11 Brgy. San Luis, Antipolo City', guardian: 'Eden Serranilla', gradeLevel: 'Grade 6', section: 'Grade 6 - Responsibility', remarks: 'TS Cruz Elem School, Zambales' },
    { lrn: '494059170010', name: 'Obis, Matt Zaniel B.', gender: 'Male', contact: '09183297815', birthday: '2011-11-16', address: '1035 Sitio Maagay 2, Brgy. Inarawan A/C', guardian: 'Rubyjoy B. Obis', gradeLevel: 'Grade 6', section: 'Grade 6 - Responsibility', remarks: 'peace village elem school' },
    { lrn: '109320171051', name: 'Saldo, Angelica N.', gender: 'Female', contact: '09465473715', birthday: '2012-02-01', address: 'B2 L22 BN2 San Isidro, A/C', guardian: 'May Ann B. Napalan', gradeLevel: 'Grade 6', section: 'Grade 6 - Responsibility', remarks: 'bn2 elem school' },
    { lrn: '494059220036', name: 'Accad, Ralph Clarenz', gender: 'Male', contact: '09063091265', birthday: '2011-09-30', address: 'B20 L36 PH3 Peace Village, Brgy. San Luis, A/C', guardian: 'Cherita M. Accad', gradeLevel: 'Grade 6', section: 'Grade 6 - Responsibility', remarks: 'PVT EXAM' },

    // Grade 7 - Perseverance
    { lrn: '494044170038', name: 'Galura, James Manuel A.', gender: 'Male', contact: '09668672130', birthday: '2013-04-18', address: 'Purok Silangan, Brgy. Dela Paz, A/C', guardian: 'Miguela Galura', gradeLevel: 'Grade 7', section: 'Grade 7 - Perseverance' },
    { lrn: '494059160095', name: 'Agojo, Joshua Lemuel V.', gender: 'Male', contact: '09552550511', birthday: '2011-07-07', address: 'B23 L44 Peace Vill. PH3, San Luis, A/C', guardian: 'Melissa Agojo', gradeLevel: 'Grade 7', section: 'Grade 7 - Perseverance' },
    { lrn: '494059150026', name: 'Balmoria, Jerry B. Jr.', gender: 'Male', contact: '09196505619', birthday: '2010-01-09', address: '#78 Upper Sto. Niño, Sta. Cruz, A/C', guardian: 'Jerry P. Balmoria, Sr.', gradeLevel: 'Grade 7', section: 'Grade 7 - Perseverance' },
    { lrn: '109320160805', name: 'Remolona, Denmar M.', gender: 'Male', contact: '09982737139', birthday: '2011-02-03', address: 'B2 L20 BN2, PH2, San Isidro, A/C', guardian: 'Rodante G. Remolona', gradeLevel: 'Grade 7', section: 'Grade 7 - Perseverance' },
    { lrn: '109320160797', name: 'Smith, William Caden A.', gender: 'Male', contact: '09612085302', birthday: '2011-07-04', address: 'Block 21 Lo12 BNII Brgy. San Isidro A/C', guardian: 'Joyce Ann Arguelles', gradeLevel: 'Grade 7', section: 'Grade 7 - Perseverance' },
    { lrn: '114236150015', name: 'Bugnosen, Princess Charlotte L.', gender: 'Female', contact: '09171858965', birthday: '2010-09-16', address: 'Lot C B14, NHA Ave., Sitio Maligava Broy San Isidro A/C', guardian: 'Jessa L. Bugnosen', gradeLevel: 'Grade 7', section: 'Grade 7 - Perseverance' },
    { lrn: '109320170926', name: 'Santiago, Kalvyn Daniella L.', gender: 'Female', contact: '09212292402', birthday: '2010-05-07', address: 'B16 L45 Peace Village, San Luis, A/C', guardian: 'Aivy M. Labaguis', gradeLevel: 'Grade 7', section: 'Grade 7 - Perseverance', remarks: 'BN2 Elem School' },

    // Grade 8 - Integrity
    { lrn: '494059150025', name: 'Aquino, John Clare B.', gender: 'Male', contact: '09306805911', birthday: '2008-08-11', address: 'Annex 3 Sambaville, San Luis, A/C', guardian: 'Ma. Ave B. Aquino', gradeLevel: 'Grade 8', section: 'Grade 8 - Integrity' },
    { lrn: '485025150011', name: 'Roque, Daniella Sophia', gender: 'Female', contact: '09084381670', birthday: '2010-06-15', address: 'Block 5 BN2, Brgy. San Isidro, A/C', guardian: 'Rick F. Roque', gradeLevel: 'Grade 8', section: 'Grade 8 - Integrity', remarks: 'BN2 ElemSchool' },
    { lrn: '494059210011', name: 'Victorino, Rain Justine L.', gender: 'Male', contact: '09282035554', birthday: '2009-04-19', address: 'B25 L32 Peace village Phase 3 Brgy San Luis', guardian: 'Jenilyn Victorino', gradeLevel: 'Grade 8', section: 'Grade 8 - Integrity' },

    // Grade 9 - Optimism
    { lrn: '494055150100', name: 'Rolluqui, Nathanael John C.', gender: 'Male', contact: '09279647575', birthday: '2009-06-19', address: 'B13 L16 Dahlia St., Cherryhills Subd., San Luis, A/C', guardian: 'Mirasol C. Rolluqui', gradeLevel: 'Grade 9', section: 'Grade 9 - Optimism', remarks: 'Antipolo Natl High School' },
    { lrn: '494008150115', name: 'Sabiniano, Hazelle', gender: 'Female', contact: '09201258831', birthday: '2009-04-21', address: 'Sitio Maligaya Phase 2B Brgy. San Luis A/C', guardian: 'Lily M. Sabiniano', gradeLevel: 'Grade 9', section: 'Grade 9 - Optimism' },
    { lrn: '109336140301', name: 'Baliber, Jhasly S.', gender: 'Female', contact: '09295939056', birthday: '2009-08-24', address: 'Sitio Kaybagsik, San Luis, A/C', guardian: 'Janet S.Baliber', gradeLevel: 'Grade 9', section: 'Grade 9 - Optimism' },

    // Grade 10 - Dependability
    { lrn: '109342131486', name: 'Lloren, Rhay Phillip M.', gender: 'Male', contact: '09194643894', birthday: '2006-01-19', address: '143 Lot 15 Block 18 Phase 2B Brgy. SanLuis Antipolo City', guardian: 'Ma. Cecilia M. Lloren', gradeLevel: 'Grade 10', section: 'Grade 10 - Dependability' },
    { lrn: '105018130085', name: 'Magana, Sarah Joy B.', gender: 'Female', contact: '', birthday: '2008-01-01', address: 'San Luis, Antipolo City', guardian: 'Guardian Name', gradeLevel: 'Grade 10', section: 'Grade 10 - Dependability' },
    { lrn: '109320140827', name: 'Gorospe, Lucid Enala S.', gender: 'Female', contact: '', birthday: '2008-01-01', address: 'San Luis, Antipolo City', guardian: 'Guardian Name', gradeLevel: 'Grade 10', section: 'Grade 10 - Dependability' },
    { lrn: '136557130369', name: 'Toyco, Annber Dominique F.', gender: 'Female', contact: '09456908645', birthday: '2008-03-11', address: '950 Blk 61 Lot 8 Ph2, BN2, Antipolo', guardian: 'Anna Therese F. Toyco', gradeLevel: 'Grade 10', section: 'Grade 10 - Dependability' },
  ]

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

  console.log(`Creating ${allStudentsData.length} students...`)

  for (const data of allStudentsData) {
    const { firstName, middleName, lastName } = parseName(data.name)
    const fullName = `${firstName} ${middleName} ${lastName}`.replace(/\s+/g, ' ').trim()
    const address = parseAddress(data.address)

    const dateOfBirth = new Date(data.birthday)

    // Find existing student by LRN or fullName+dateOfBirth
    let student = null
    if (data.lrn) {
      student = await prisma.student.findUnique({
        where: { lrn: data.lrn },
      })
    }

    if (!student) {
      // Try to find by fullName and dateOfBirth
      student = await prisma.student.findUnique({
        where: {
          fullName_dateOfBirth: {
            fullName,
            dateOfBirth,
          },
        },
      })
    }

    if (student) {
      // Student exists - only update current grade/section if this is the active academic year
      if (academicYear.isActive) {
        const sectionId = await getSectionId(prisma, data.section, data.gradeLevel)
        await prisma.student.update({
          where: { id: student.id },
          data: {
            gradeLevel: data.gradeLevel,
            sectionId: sectionId,
            enrollmentStatus: 'ENROLLED',
          },
        })
      }
    } else {
      // Student doesn't exist - create new student
      const sectionId = await getSectionId(prisma, data.section, data.gradeLevel)
      student = await prisma.student.create({
        data: {
          lrn: data.lrn || null,
          firstName,
          middleName,
          lastName,
          fullName,
          gender: data.gender as 'Male' | 'Female',
          contactNumber: data.contact,
          dateOfBirth,
          houseNumber: address.houseNumber,
          street: address.street,
          barangay: address.barangay,
          city: address.city,
          province: address.province,
          parentGuardian: data.guardian,
          gradeLevel: data.gradeLevel,
          sectionId: sectionId,
          enrollmentStatus: 'ENROLLED',
          isTransferee: false,
          remarks: (data as any).remarks || null,
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
      const sectionId = await getSectionId(prisma, data.section, data.gradeLevel)

      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          academicYearId: academicYear.id,
          schoolYear: academicYear.name,
          gradeLevel: data.gradeLevel,
          sectionId: sectionId,
          status: 'ENROLLED',
        },
      })
      console.log(`✓ ${fullName} - ${data.gradeLevel} - ${data.section}`)
    } else {
      console.log(`• ${fullName} - Already enrolled`)
    }
  }

  console.log('\n✓ Seed completed successfully!')
  console.log(`Total students: ${allStudentsData.length}`)
  console.log(`Academic Year: ${academicYear.name}`)
}

void main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
