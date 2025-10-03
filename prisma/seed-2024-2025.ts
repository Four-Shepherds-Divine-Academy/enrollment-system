import { PrismaClient } from '@prisma/client'
import { createSections, getSectionId } from './seed-helpers'

const prisma = new PrismaClient()

// Helper function to parse address
function parseAddress(address: string) {
  const parts = address.split(',').map((s) => s.trim())

  // Extract city and province
  const city = parts.find(p => p.includes('Antipolo')) || 'Antipolo City'
  const province = 'Rizal'

  // Extract barangay
  let barangay = 'San Luis'
  if (address.includes('San Isidro')) barangay = 'San Isidro'
  else if (address.includes('Dela Paz')) barangay = 'Dela Paz'
  else if (address.includes('San Jose')) barangay = 'San Jose'
  else if (address.includes('Inarawan')) barangay = 'Inarawan'
  else if (address.includes('San Juan')) barangay = 'San Juan'

  // Extract house number, street, subdivision
  const firstPart = parts[0] || ''
  let houseNumber = ''
  let street = ''
  let subdivision = ''

  if (firstPart) {
    // Try to extract block/lot info
    if (firstPart.match(/B\d+|L\d+|Block|Lot|Ph\d+/i)) {
      houseNumber = firstPart
    } else {
      street = firstPart
    }
  }

  // Check for subdivision in remaining parts
  if (parts.length > 1) {
    for (const part of parts) {
      if (part.match(/Subd|Village|BN2|Sambaville|Steelhomes/i) && !part.includes('A/C') && !part.includes('Brgy')) {
        subdivision = part
        break
      }
    }
  }

  return { houseNumber, street, subdivision, barangay, city, province }
}

async function main() {
  console.log('Seeding ALL student data from PDF...')

  // Create sections
  await createSections(prisma)

  // Get active academic year (2024-2025)
  let academicYear = await prisma.academicYear.findFirst({
    where: { name: '2024-2025' },
  })

  // Create academic year if it doesn't exist
  if (!academicYear) {
    academicYear = await prisma.academicYear.create({
      data: {
        name: '2024-2025',
        startDate: new Date('2024-06-01'),
        isActive: true,
      },
    })
    console.log('Created academic year: 2024-2025')
  }

  console.log(`Using academic year: ${academicYear.name}`)

  // All students from the PDF
  const students = [
    // KINDER 1 - ENTHUSIASM
    { lrn: null, name: 'Pamanian, Rom Ezequiel A.', gender: 'Male', contact: '09398557421', bday: '2019-12-24', address: 'B31 L2 Steelhomes Subd., San Luis, A/C', guardian: 'Robert Pamanian', grade: 'Kinder 1', section: 'Enthusiasm', remarks: 'enrolled-nursery' },
    { lrn: '494059240004', name: 'Mina, Ma. Cassandra T.', gender: 'Female', contact: '09567602058', bday: '2017-11-26', address: '1003 B34 L9, BN2 PH2A San Isidro, A/C', guardian: 'Frances Anne S. Traqueña', grade: 'Kinder 1', section: 'Enthusiasm', remarks: 'K2 - temp K1' },
    { lrn: '494059240001', name: 'Serzo, Francis Greyson G.', gender: 'Male', contact: '09065218894', bday: '2019-09-13', address: 'B2 L15, San Isidro, A/C', guardian: 'Federico Serzo', grade: 'Kinder 1', section: 'Enthusiasm', remarks: 'K2 - temp K1' },
    { lrn: '494059240002', name: 'Roxas, Ralphe Hezekiah B.', gender: 'Male', contact: '09178000546', bday: '2019-04-03', address: 'B4 L11 Ph2b, San Luis, A/C', guardian: 'Hazelyn Bantayan', grade: 'Kinder 1', section: 'Enthusiasm', remarks: 'K2 - temp K1' },
    { lrn: '494059240015', name: 'Vallejos, Luke Damielle C.', gender: 'Male', contact: '09569781995', bday: '2019-04-29', address: 'B28 L40 Peace Village, San Luis, A/C', guardian: 'Damasa Casauay', grade: 'Kinder 1', section: 'Enthusiasm', remarks: 'K2 - temp K1' },
    { lrn: '494059240014', name: 'Lucero, Aeisha Jane A.', gender: 'Female', contact: '09103709811', bday: '2018-06-12', address: 'B38 L5, PH1 BN2 Brgy. San Isidro, A/C', guardian: 'Joan Lucero', grade: 'Kinder 1', section: 'Enthusiasm', remarks: 'K2-Temp K1' },
    { lrn: '494059240003', name: 'Dela Umbria, Khayedee L.', gender: 'Female', contact: '09052114649', bday: '2019-05-15', address: 'B5 L9 Sitio Kaybagsik, San Luis, A/C', guardian: 'Bernadeth Dela Umbria', grade: 'Kinder 1', section: 'Enthusiasm', remarks: 'K2-Temp K1' },

    // KINDER 2 - GENEROSITY
    { lrn: '494059240010', name: 'Bugnosen, Carl Eduard L.', gender: 'Male', contact: '09171858965', bday: '2019-06-07', address: 'Lot C B14, NHA Ave., Sitio Maligaya, Brgy. San Isidro, A/C', guardian: 'Jessa L. Bugnosen', grade: 'Kinder 2', section: 'Generosity', remarks: null },
    { lrn: '494059240009', name: 'Lique, John Reaven A.', gender: 'Male', contact: '09993898106', bday: '2019-04-20', address: 'B17 LB, Manzanilla St., Sambaville, San Luis, A/C', guardian: 'Mirzi Alarcon', grade: 'Kinder 2', section: 'Generosity', remarks: 'enrolled' },
    { lrn: '494059240013', name: 'Lim, Leanne Kaide Sarai R.', gender: 'Female', contact: '0935675686', bday: '2019-01-01', address: 'B8 L3 San Luis, A/C', guardian: 'Ninna Rossi S. Rodolfo', grade: 'Kinder 2', section: 'Generosity', remarks: 'enrolled' },
    { lrn: '494059240011', name: 'Javier, Miguel Sebastian C.', gender: 'Male', contact: '09073064920', bday: '2019-06-05', address: '676 Sitio sapinit, San Juan, A/C', guardian: 'Alyssa Liel Rose G. Carisma', grade: 'Kinder 2', section: 'Generosity', remarks: 'enrolled' },
    { lrn: '494059240012', name: 'Serafin, Dream F.', gender: 'Male', contact: '09506358927', bday: '2019-03-10', address: 'B16 L17 Ph2b, San Luis, Antipolo City', guardian: 'Maribel Serafin', grade: 'Kinder 2', section: 'Generosity', remarks: 'enrolled' },
    { lrn: '494059240006', name: 'Bustamante, Gracelene Faye F.', gender: 'Female', contact: '09972576145', bday: '2019-01-01', address: '#102 B10 L5 PH1 BN2 San Isidro, A/C', guardian: 'Jessalie F. Bustamante', grade: 'Kinder 2', section: 'Generosity', remarks: 'enrolled' },
    { lrn: '494059240005', name: 'Sumera, Matheus Adriel B.', gender: 'Male', contact: '09321971378', bday: '2018-11-06', address: 'B21 L65 Peace Village, San Luis, A/C', guardian: 'Ma. Bernadette Sumera', grade: 'Kinder 2', section: 'Generosity', remarks: 'enrolled' },
    { lrn: '494059240008', name: 'Peru, Andiana Jade N.', gender: 'Female', contact: '09519584952', bday: '2019-04-09', address: 'B 24-1 L22, Ph3 Peace Village Brgy. San Luis, A/C', guardian: 'Crisanta Calapardo', grade: 'Kinder 2', section: 'Generosity', remarks: 'enrolled' },
    { lrn: '494059240007', name: 'Bermejo, Kleya Mervie S.', gender: 'Female', contact: '09087122155', bday: '2019-06-12', address: 'B18 L34 PH2b, Brgy. San Luis, A/C', guardian: 'Jovie Soliven', grade: 'Kinder 2', section: 'Generosity', remarks: 'enrolled' },
    { lrn: '494059240016', name: 'Bernardo, Ryle Dyllan M.', gender: 'Male', contact: '09151375689', bday: '2019-04-05', address: 'B34 L3 PH2a BN2, Brgy. San Isidro, A/C', guardian: 'Daisy Martinez', grade: 'Kinder 2', section: 'Generosity', remarks: 'enrolled' },

    // GRADE 1 - OBEDIENCE
    { lrn: '494059230004', name: 'Abellar, Euan Mark A.', gender: 'Male', contact: '09613207634', bday: '2018-02-16', address: 'B21 L20 PH2B, Brgy. San Luis, A/C', guardian: 'Christina A. Abellar', grade: 'Grade 1', section: 'Obedience', remarks: null },
    { lrn: '494059230003', name: 'Balacuit, Sean Zion B.', gender: 'Male', contact: '09305967756', bday: '2017-11-18', address: 'B32 L5 Sambaville, San Luis, A/C', guardian: 'Roxan M. Balacuit', grade: 'Grade 1', section: 'Obedience', remarks: 'enrolled' },
    { lrn: '494059230012', name: 'Virtucio, Marcus Achilles I.', gender: 'Male', contact: '09153622187', bday: '2018-04-17', address: '#32 L2 B3 BN2, San Isidro, A/C', guardian: 'Margie A. Ibardolasa', grade: 'Grade 1', section: 'Obedience', remarks: 'enrolled' },
    { lrn: '494059230013', name: 'Martins, Henrique', gender: 'Male', contact: null, bday: '2018-01-02', address: 'B21 L12 San Isidro, A/C', guardian: 'Joyceann A. Martins', grade: 'Grade 1', section: 'Obedience', remarks: null },
    { lrn: '494059230001', name: 'Retreta, Jannica Faith S.', gender: 'Female', contact: '09385530888', bday: '2018-05-18', address: 'B15 L5 San Luis, A/C', guardian: 'Joy A. Salazar', grade: 'Grade 1', section: 'Obedience', remarks: 'enrolled' },
    { lrn: '494059230002', name: 'Gagaza, Carly Louise C.', gender: 'Female', contact: '09098878856', bday: '2018-05-31', address: '0341 Sitio Maagay I, Brgy. Inarawan, A/C', guardian: 'Reynalin P. Cagang', grade: 'Grade 1', section: 'Obedience', remarks: 'enrolled' },
    { lrn: '494059230014', name: 'Toyco, Annber Dennise F.', gender: 'Female', contact: '09456908645', bday: '2018-04-13', address: 'Lot 8 B61 Ph2 BN2 San Isidro, A/C', guardian: 'Bernardo T. toyco', grade: 'Grade 1', section: 'Obedience', remarks: 'enrolled' },
    { lrn: '494036230010', name: 'Resurreccion, Isaiah Timothy S.', gender: 'Male', contact: '09668275335', bday: '2018-01-05', address: '#170 B12 L22 Ph1 BN2 San Isidro A/C', guardian: 'Neil Resurreccion', grade: 'Grade 1', section: 'Obedience', remarks: 'enrolled' },
    { lrn: '494059230019', name: 'Alcantara, Marcos James', gender: 'Male', contact: '09151641234', bday: '2018-09-30', address: 'Blk5 Lot17 BN2 PH2 Lower', guardian: 'Katrina Alcantara', grade: 'Grade 1', section: 'Obedience', remarks: 'enrolled' },
    { lrn: '109339230228', name: 'Nalog, Seth Zachary A.', gender: 'Male', contact: '09999002314', bday: '2018-09-13', address: 'Sitio Radar, Brgy. San Luis, A/C', guardian: 'Shanaia Ivy Albonia', grade: 'Grade 1', section: 'Obedience', remarks: 'enrolled' },
    { lrn: '494012230006', name: 'Lucero, John Kevin A.', gender: 'Male', contact: '09103709811', bday: '2017-10-29', address: 'B38 L5 Ph1 BN2, Brgy. San Isidro, A/C', guardian: 'Joan A. Lucero', grade: 'Grade 1', section: 'Obedience', remarks: 'enrolled' },
    { lrn: '132609230149', name: 'Rejano, Aerin D.', gender: 'Female', contact: null, bday: '2018-07-03', address: 'Block 14 Lot 18, BN2B, Brgy. San Luis, A/C', guardian: 'Lowela B. De Castro', grade: 'Grade 1', section: 'Obedience', remarks: 'enrolled' },

    // GRADE 2 - HOSPITALITY
    { lrn: '494059220024', name: 'Arda, Carl Vincent C.', gender: 'Male', contact: '09399283865', bday: '2017-07-24', address: 'B3 L16 Ph2B, BN2, San Luis, A/C', guardian: 'Jepherson D. Arda', grade: 'Grade 2', section: 'Hospitality', remarks: 'enrolled' },
    { lrn: '494059220027', name: 'Lizano, Jeiyramme Dhenize C.', gender: 'Female', contact: '09335283367', bday: '2017-04-09', address: 'B6 L10 PH5A Brgy. Dela Paz, A/C', guardian: 'Jerome B. Lizano', grade: 'Grade 2', section: 'Hospitality', remarks: 'enrolled' },
    { lrn: '494059220020', name: 'Modanza, Keylyn Elisha B.', gender: 'Female', contact: '09611072052', bday: '2016-11-24', address: 'B22 L30 PH2b San Luis, A/C', guardian: 'Rosalyn G. Modanza', grade: 'Grade 2', section: 'Hospitality', remarks: 'enrolled' },
    { lrn: '494059220021', name: 'Subejano, Vershka Fraise D.', gender: 'Female', contact: '09276052177', bday: '2016-11-07', address: 'B22 L27 Sitio Maligaya, San Luis, A/C', guardian: 'Jennifer D. Dormido', grade: 'Grade 2', section: 'Hospitality', remarks: 'enrolled' },
    { lrn: '494059220018', name: 'Toyco, Annber Danielle F.', gender: 'Female', contact: '09456908645', bday: '2017-02-26', address: 'Lot 8 B61 Ph2 BN2 San Isidro, A/C', guardian: 'Anna Therese', grade: 'Grade 2', section: 'Hospitality', remarks: null },
    { lrn: '494059220029', name: 'Vargas, Arkizha Loreen', gender: 'Female', contact: '09040596885', bday: '2017-05-22', address: 'B12 L14 Sitio Maligaya, San Luis, A/C', guardian: 'Glorymhay M. Vargas', grade: 'Grade 2', section: 'Hospitality', remarks: 'enrolled' },
    { lrn: '494059220023', name: 'Vestodio, Martina T.', gender: 'Female', contact: '09214904329', bday: '2016-11-17', address: 'Puting Bato, San Luis, A/C', guardian: 'Sarahjane T. Lumantay', grade: 'Grade 2', section: 'Hospitality', remarks: 'enrolled' },
    { lrn: '494059220030', name: 'Remolona, Demree M.', gender: 'Female', contact: '09982737139', bday: '2017-06-29', address: 'B2 L20 BN2 San Isidro, A/C', guardian: 'Rodante Remolona', grade: 'Grade 2', section: 'Hospitality', remarks: 'enrolled' },
    { lrn: '494059220031', name: 'Obis, Miguel Khalel B.', gender: 'Male', contact: '09183297815', bday: '2017-08-10', address: '1035 Sitio Maagay 2, Brgy. Inarawan A/C', guardian: 'Rubyjoy B. Obis', grade: 'Grade 2', section: 'Hospitality', remarks: null },
    { lrn: '109321220287', name: 'Ibayan, Luke B.', gender: 'Male', contact: '09072852009', bday: '2017-01-17', address: 'Maagay I Brgy. Inarawan, A/C', guardian: 'Melinda L. Baraquiel', grade: 'Grade 2', section: 'Hospitality', remarks: 'enrolled' },
    { lrn: '494059220037', name: 'Ariola, Dean Casstiel K.', gender: 'Male', contact: '0963996441', bday: '2016-04-08', address: 'NB19 L10 Ph2b, San Luis, A/C', guardian: 'Cristina b. Nuezca', grade: 'Grade 2', section: 'Hospitality', remarks: 'enrolled' },
    { lrn: '494059220011', name: 'Medinueta, Arlaine Reign D.', gender: 'Female', contact: '09307662507', bday: '2017-07-12', address: 'Kaysakat, Brgy. San Jose, A/C', guardian: 'Ruffalyn D. Mendinueta', grade: 'Grade 2', section: 'Hospitality', remarks: '09307662507' },
    { lrn: '105009220186', name: 'De Leon, Ethan John C.', gender: 'Male', contact: '09656589697', bday: '2016-05-26', address: '932 B62 L7 BN2 PH2, Brgy. San Isidro, A/C', guardian: 'Jean C. Collado', grade: 'Grade 2', section: 'Hospitality', remarks: null },

    // GRADE 3 - SIMPLICITY
    { lrn: '494059210002', name: 'Butay, Honeylyn O.', gender: 'Female', contact: '09703106243', bday: '2016-06-11', address: 'L19 B14, BN2B, San Luis, A/C', guardian: 'Jenelyn B. Oracoy', grade: 'Grade 3', section: 'Simplicity', remarks: 'enrolled' },
    { lrn: '109320210452', name: 'Calubayan, Sophia Celerine C.', gender: 'Female', contact: '09159574548', bday: '2016-04-15', address: '07 B14 L10 PH2b, San Luis, A/C', guardian: 'Jackie Lou C. Calubayan', grade: 'Grade 3', section: 'Simplicity', remarks: 'enrolled' },
    { lrn: '494059210001', name: 'Manligues, Vienne Hera Louise S.', gender: 'Female', contact: '09477430052', bday: '2016-01-14', address: 'Block 14 Phase 2B BN2 Brgy. San Luis Antipolo City', guardian: 'Venus Rizza S. Manligues', grade: 'Grade 3', section: 'Simplicity', remarks: 'enrolled' },
    { lrn: '494059210031', name: 'Queyquep, Dan Jacob M.', gender: 'Male', contact: '09955153098', bday: '2014-12-10', address: 'B16 Lot 3 Purok Imelda, Dela Paz, A/C', guardian: 'Aprille Rose M. Queyquep', grade: 'Grade 3', section: 'Simplicity', remarks: null },
    { lrn: '494059210007', name: 'Santos, Ayesha Mae D.', gender: 'Female', contact: '0929488022', bday: '2015-10-25', address: 'B17 L16 Ph2b, San Luis', guardian: 'Jean Meann T. Dela Cruz', grade: 'Grade 3', section: 'Simplicity', remarks: 'enrolled' },
    { lrn: '109320210192', name: 'Sumagang, Zia Dionne A.', gender: 'Female', contact: '09477071408', bday: '2015-12-06', address: 'B22 L5 Ph2B San Luis, A/C', guardian: 'Christine Arales', grade: 'Grade 3', section: 'Simplicity', remarks: 'enrolled' },
    { lrn: '402873210002', name: 'Ylanan, Key-Yumi V.', gender: 'Female', contact: '09387255594', bday: '2016-06-28', address: 'Sitio Kubli Maagay 3, Inarawan, A/C', guardian: 'Bryan Ylanan', grade: 'Grade 3', section: 'Simplicity', remarks: null },
    { lrn: '109336210040', name: 'Losantas, Amira Yael T.', gender: 'Female', contact: '09496630039', bday: '2015-08-04', address: 'B23 L35 Peace Village PH3 San Luis, A/C', guardian: 'Jemar D. Losantas', grade: 'Grade 3', section: 'Simplicity', remarks: 'enrolled' },
    { lrn: '136783200402', name: 'Montemayor, Lezcian Red S.', gender: 'Female', contact: '09286508055', bday: '2015-10-10', address: 'Block 21 Lot 11 Brgy. San Luis, Antipolo City', guardian: 'Eden Seranilla', grade: 'Grade 3', section: 'Simplicity', remarks: 'enrolled' },
    { lrn: '109320210887', name: 'Lampera, Khatelee Rhiane B.', gender: 'Female', contact: '09454213628', bday: '2015-10-02', address: 'Brgy. San Luis, Antipolo City', guardian: 'Jhorin O. Basa', grade: 'Grade 3', section: 'Simplicity', remarks: 'enrolled' },
    { lrn: '109321210492', name: 'Pagsuyoin, Liose Jayanne B.', gender: 'Female', contact: null, bday: '2016-07-23', address: 'Brgy. San Isidro, Antipolo City', guardian: null, grade: 'Grade 3', section: 'Simplicity', remarks: null },

    // GRADE 4 - BENEVOLENCE
    { lrn: '109320200041', name: 'Dioneda, Rhian Micah Ella F.', gender: 'Female', contact: '09057260851', bday: '2015-03-19', address: '#89 B8 L16 BN2 San Isidro, A/C', guardian: 'Myra B. Fulgencio', grade: 'Grade 4', section: 'Benevolence', remarks: 'enrolled' },
    { lrn: '494059210029', name: 'Enriquez, Krystal Scarlett L.', gender: 'Female', contact: '09212292407', bday: '2014-09-19', address: 'B16 L45 Peace Village, San Luis, A/C', guardian: 'Aivy Labaguis', grade: 'Grade 4', section: 'Benevolence', remarks: null },
    { lrn: '494059200001', name: 'Montemayor, Iszaack Herb S.', gender: 'Male', contact: '09286508055', bday: '2014-10-24', address: 'Block 21 Lot 11 Brgy. San Luis, Antipolo City', guardian: 'Eden Serranilla', grade: 'Grade 4', section: 'Benevolence', remarks: 'enrolled' },
    { lrn: '109320200662', name: 'Resurreccion, Paul Jeremiah S.', gender: 'Male', contact: '09668275335', bday: '2015-09-28', address: '#170 B12 L22 Ph1 BN2 San Isidro A/C', guardian: 'Rose S. Resureccion', grade: 'Grade 4', section: 'Benevolence', remarks: 'enrolled' },
    { lrn: '494059190002', name: 'Saclao, Bienjamin C.', gender: 'Male', contact: '09107688034', bday: '2014-06-22', address: 'B3 L4 Ph4A Dela Paz, A/C', guardian: 'Mary Joy Carniyan', grade: 'Grade 4', section: 'Benevolence', remarks: null },
    { lrn: '107912210652', name: 'Valderrama, Alexandre Ian C.', gender: 'Male', contact: '09686347108', bday: '2015-01-26', address: 'L3 Ph2b, BN2b, Brgy. San Luis, A/c', guardian: 'May C. Valderrama', grade: 'Grade 4', section: 'Benevolence', remarks: 'enrolled' },
    { lrn: '494059200003', name: 'Cancino, Atarah Mizsha', gender: 'Female', contact: '09260237790', bday: '2014-05-05', address: 'B7 L1-2 Ph2B, Brgy. San Luis, A/C', guardian: 'Reyjelyn Cancino', grade: 'Grade 4', section: 'Benevolence', remarks: null },

    // GRADE 5 - SINCERITY
    { lrn: '402939190001', name: 'Asakil, Datu Rayshan Aijaz P.', gender: 'Male', contact: '09218415728', bday: '2014-08-04', address: 'B23 L14 PH2B, Brgy. San Luis, A/C', guardian: 'Roseanne P. Asakil', grade: 'Grade 5', section: 'Sincerity', remarks: 'enrolled' },
    { lrn: '494059190003', name: 'Bolivar, Casiuz Adriel M.', gender: 'Male', contact: '09665576207', bday: '2014-08-23', address: 'B38 L2 Sambaville San Luis, A/C', guardian: 'Manilyn M. Bolivar', grade: 'Grade 5', section: 'Sincerity', remarks: null },
    { lrn: '494059190001', name: 'Dioneda, Xhian Justine F.', gender: 'Male', contact: '09057260851', bday: '2013-09-29', address: '#89 Block 8 Lot 16 BN2, Brgy. San Isidro, Antipolo City', guardian: 'Myra B. Fulgencio', grade: 'Grade 5', section: 'Sincerity', remarks: 'enrolled' },
    { lrn: '494059180007', name: 'Milo, Cyrile Ace G.', gender: 'Male', contact: '09100968842', bday: '2013-05-06', address: 'Phase 2 B Brgy. San Luis Antipolo City', guardian: 'Regine A. Gapol', grade: 'Grade 5', section: 'Sincerity', remarks: 'enrolled' },
    { lrn: '402179180003', name: 'Bustamante, Gabrielle James F.', gender: 'Male', contact: '09123036975', bday: '2013-07-11', address: 'B10 L3 PH2 BN2, A/C', guardian: 'Jessalie C. Fuedan', grade: 'Grade 5', section: 'Sincerity', remarks: 'enrolled' },
    { lrn: '105210180025', name: 'Tamondong, Percious Zia', gender: 'Female', contact: '09284360480', bday: '2013-04-15', address: 'B4 L9 San Isidro, A/C', guardian: 'Precious Zia H. Tamondong', grade: 'Grade 5', section: 'Sincerity', remarks: 'enrolled' },

    // GRADE 6 - RESPONSIBILITY
    { lrn: '136724180014', name: 'Abellar, Euna Mae A.', gender: 'Female', contact: '09613207634', bday: '2013-07-04', address: 'B21 L20 PH2B, Brgy. San Luis, A/C', guardian: 'Christina A. Abellar', grade: 'Grade 6', section: 'Responsibility', remarks: null },
    { lrn: '409568180004', name: 'Basagre, Mark Gian M.', gender: 'Male', contact: '09186774329', bday: '2013-02-22', address: 'BLOCK 20 LOT 36 PEACE VILLAGE', guardian: 'GLORIA BASAGRE', grade: 'Grade 6', section: 'Responsibility', remarks: null },
    { lrn: '409568180019', name: 'Belleza, Jillian Maxine', gender: 'Female', contact: '09564191874', bday: '2012-04-09', address: 'B2 L32 Peace Vill., San Luis, A/C', guardian: null, grade: 'Grade 6', section: 'Responsibility', remarks: 'enrolled' },
    { lrn: '494059180016', name: 'Cantorna, Jun Matthew J.', gender: 'Male', contact: '09260834666', bday: '2012-10-19', address: 'B61 L11 BN2 Ph2, San Isidro A/C', guardian: 'Elineta F. Crisostomo', grade: 'Grade 6', section: 'Responsibility', remarks: 'enrolled' },
    { lrn: '409568180011', name: 'Carillo, Sofia Nicole M.', gender: 'Female', contact: '09064670487', bday: '2013-03-17', address: 'BLOCK 16 L10 PEACE VILLAGE', guardian: 'CHERRY ROSE CARILLO', grade: 'Grade 6', section: 'Responsibility', remarks: 'enrolled' },
    { lrn: '409568180005', name: 'Guzman, Drew Andrei D.', gender: 'Male', contact: '09216965894', bday: '2012-10-19', address: 'B25 L33 PEACE VILLAGE', guardian: 'LARITA D. GUZMAN', grade: 'Grade 6', section: 'Responsibility', remarks: 'enrolled' },
    { lrn: '409568180020', name: 'Jumalon, Marcial Joel S.', gender: 'Male', contact: '09381657092', bday: '2013-02-21', address: 'Kaysakat 1 Veterans, San Jose, A/C', guardian: 'Patrick J. Rayos', grade: 'Grade 6', section: 'Responsibility', remarks: 'enrolled' },
    { lrn: '494059180009', name: 'Soriano, Kayleigh N.', gender: 'Female', contact: '09214901459', bday: '2013-03-06', address: 'Block 14 Phase 2B BN2 Brgy. San Luis Antipolo City', guardian: 'Cezarah G. Nerio', grade: 'Grade 6', section: 'Responsibility', remarks: 'enrolled' },
    { lrn: '494059180005', name: 'Toyco, Berann Terence F.', gender: 'Male', contact: '09099042977', bday: '2013-04-14', address: 'Lot 8 B61 Ph2 BN2 San Isidro, A/C', guardian: 'Anna Therese Venus Fulo', grade: 'Grade 6', section: 'Responsibility', remarks: 'enrolled' },
    { lrn: '409568180003', name: 'Victorino, Rhiana Nicole L.', gender: 'Female', contact: '09282035554', bday: '2013-05-30', address: 'Block 25, Lot 32 Peace Village, Brgy. San Luis, A/C', guardian: 'Jenilyn L. Victorino', grade: 'Grade 6', section: 'Responsibility', remarks: null },
    { lrn: '494059180057', name: 'Padilla, Ethan Mathew P.', gender: 'Male', contact: '09708027432', bday: '2012-08-10', address: 'Excess Lot a Phase 2B BN2 Brgy. San Luis Antipolo City', guardian: 'Erlin P. Padilla', grade: 'Grade 6', section: 'Responsibility', remarks: 'enrolled' },
    { lrn: '109320171070', name: 'Ugalde, Apple May V.', gender: 'Female', contact: '09101615536', bday: '2010-05-05', address: 'B12 L15 Sitio Maligaya, San Luis, A/C', guardian: 'Deiam Joy Ugalde', grade: 'Grade 6', section: 'Responsibility', remarks: 'enrolled' },
    { lrn: '494036150013', name: 'Anqui, Khyrwyn Matheo B.', gender: 'Male', contact: '09266683671', bday: '2011-03-17', address: 'B21 L4 Bagong Nayon 2, A/C', guardian: 'Emelie B. Anqui', grade: 'Grade 6', section: 'Responsibility', remarks: 'enrolled' },

    // GRADE 8
    { lrn: '500334170056', name: 'Butay, hidden christian', gender: 'Male', contact: '09164873088', bday: '2011-08-24', address: 'L39 B14, BN2B, Brgy. San Luis, A/C', guardian: 'Jenelyn B. Oracoy', grade: 'Grade 8', section: null, remarks: 'enrolled' },
    { lrn: '494094170007', name: 'Icawat, Roent Jay O.', gender: 'Male', contact: '09672612425', bday: '2012-05-20', address: 'B18 Excess Lot Ph2B, San Luis, A/C', guardian: 'Gemma I. Bermejo', grade: 'Grade 8', section: null, remarks: 'enrolled' },
    { lrn: '402939160034', name: 'Montemayor, Tiffany Hash S.', gender: 'Female', contact: '09286508055', bday: '2011-10-22', address: 'Block 21 Lot 11 Brgy. San Luis, Antipolo City', guardian: 'Eden Serranilla', grade: 'Grade 8', section: null, remarks: 'enrolled' },
    { lrn: '494059170010', name: 'Obis, Matt Zaniel B.', gender: 'Male', contact: '09183297815', bday: '2011-11-16', address: '1035 Sitio Maagay 2, Brgy. Inarawan A/C', guardian: 'Rubyjoy B. Obis', grade: 'Grade 8', section: null, remarks: null },
    { lrn: '494059220036', name: 'Accad, Ralph Clarenz', gender: 'Male', contact: '09958875646', bday: '2011-09-30', address: 'B20 L36 PH3 Peace Village, Brgy. San Luis, A/C', guardian: 'Raissa Calriz Accad', grade: 'Grade 8', section: null, remarks: null },

    // GRADE 9
    { lrn: '494044170038', name: 'Galura, James Manuel A.', gender: 'Male', contact: '09668672130', bday: '2013-04-18', address: 'Purok Silangan, Brgy. Dela Paz, A/C', guardian: 'Miguela Galura', grade: 'Grade 9', section: null, remarks: "provide pvt from 494044 - Children's Garden School of Antipolo City, Inc." },
    { lrn: '494059160095', name: 'Agojo, Joshua Lemuel V.', gender: 'Male', contact: '09552550511', bday: '2011-07-07', address: 'B23 L44 Peace Vill. PH3, San Luis, A/C', guardian: 'Melissa Agojo', grade: 'Grade 9', section: null, remarks: 'enrolled' },
    { lrn: '109320160805', name: 'Remolona, Denmar M.', gender: 'Male', contact: '09982737139', bday: '2011-02-03', address: 'B2 L20 BN2, PH2, San Isidro, A/C', guardian: 'Rodante G. Remolona', grade: 'Grade 9', section: null, remarks: 'enrolled' },
    { lrn: '109320160797', name: 'Smith, William Caden A.', gender: 'Male', contact: '09612085302', bday: '2011-07-04', address: 'Block 21 Lo12 BNII Brgy. San Isidro A/C', guardian: 'Joyce Ann Arguelles', grade: 'Grade 9', section: null, remarks: null },
    { lrn: '114236150015', name: 'Bugnosen, Princess Charlotte L.', gender: 'Female', contact: '09171858965', bday: '2010-09-16', address: 'Lot C B14, NHA Ave., Sitio Maligaya, Brgy. San Isidro, A/C', guardian: 'Jessa L. Bugnosen', grade: 'Grade 9', section: null, remarks: null },
    { lrn: '109320170926', name: 'Santiago, Kalvyn Daniella L.', gender: 'Female', contact: '09212292402', bday: '2010-05-07', address: 'B16 L45 Peace Village, San Luis, A/C', guardian: 'Aivy M. Labaguis', grade: 'Grade 9', section: null, remarks: null },

    // GRADE 10
    { lrn: '494059150025', name: 'Aquino, John Clare B.', gender: 'Male', contact: '09306805911', bday: '2008-08-11', address: 'Annex 3 Sambaville, San Luis, A/C', guardian: 'Ma. Ave B. Aquino', grade: 'Grade 10', section: null, remarks: 'enrolled' },
    { lrn: '485025150011', name: 'Roque, Daniella Sophia', gender: 'Female', contact: '09084381670', bday: '2010-06-15', address: 'Block 5 BN2, Brgy. San Isidro, A/C', guardian: 'Rick F. Roque', grade: 'Grade 10', section: null, remarks: 'enrolled' },
    { lrn: '494059210011', name: 'Victorino, Rain Justine L.', gender: 'Male', contact: '09282035554', bday: '2009-04-19', address: 'B25 L32 Peace village Phase 3 Brgy San Luis', guardian: 'Jenilyn Victorino', grade: 'Grade 10', section: null, remarks: null },

    // GRADE 10 - DEPENDABILITY
    { lrn: '494055150100', name: 'Rolluqui, Nathanael John C.', gender: 'Male', contact: '09279647575', bday: '2009-06-19', address: 'B13 L16 Dahlia St., Cherryhills Subd., San Luis, A/C', guardian: 'Mirasol C. Rolluqui', grade: 'Grade 10', section: 'Dependability', remarks: 'enrolled' },
    { lrn: '494008150115', name: 'Sabiniano, Hazelle', gender: 'Female', contact: '09201258831', bday: '2009-04-21', address: 'Sitio Maligaya Phase 2B Brgy. San Luis A/C', guardian: 'Lily M. Sabiniano', grade: 'Grade 10', section: 'Dependability', remarks: 'enrolled' },
    { lrn: '425740150044', name: 'Obis, Reiza Tenshi Faith B.', gender: 'Female', contact: '091762298758', bday: '2009-04-14', address: '1305 Sitio Maagay 2, Brgy. Inarawan, A/C', guardian: 'Ruby Joy B. Obis', grade: 'Grade 10', section: 'Dependability', remarks: 'enrolled' },
  ]

  let created = 0
  let failed = 0

  for (const s of students) {
    try {
      // Parse name
      const nameParts = s.name.split(',').map((p) => p.trim())
      let lastName = ''
      let firstName = ''
      let middleName = ''

      if (nameParts.length >= 2) {
        lastName = nameParts[0]
        const rest = nameParts[1].split(' ').filter(Boolean)

        // Last part with just letter or ending with . is middle name
        if (rest.length > 1 && (rest[rest.length - 1].length <= 2 || rest[rest.length - 1].endsWith('.'))) {
          middleName = rest[rest.length - 1].replace('.', '')
          firstName = rest.slice(0, -1).join(' ')
        } else {
          firstName = rest.join(' ')
        }
      }

      const fullName = [firstName, middleName, lastName].filter(Boolean).join(' ')

      // Parse address
      const addr = parseAddress(s.address)

      // Parse date
      const dateOfBirth = new Date(s.bday)

      // Get section ID if section is provided
      const sectionId = s.section ? await getSectionId(prisma, s.section, s.grade) : null

      // Find existing student by LRN or fullName+dateOfBirth
      let student = null
      if (s.lrn) {
        student = await prisma.student.findUnique({
          where: { lrn: s.lrn },
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
          await prisma.student.update({
            where: { id: student.id },
            data: {
              gradeLevel: s.grade,
              sectionId: sectionId,
              enrollmentStatus: 'ENROLLED',
            },
          })
        }
      } else {
        // Student doesn't exist - create new student
        student = await prisma.student.create({
          data: {
            lrn: s.lrn || null,
            firstName,
            middleName: middleName || null,
            lastName,
            fullName,
            gender: s.gender as 'Male' | 'Female',
            contactNumber: s.contact || '00000000000',
            dateOfBirth,
            houseNumber: addr.houseNumber || null,
            street: addr.street || null,
            subdivision: addr.subdivision || null,
            barangay: addr.barangay,
            city: addr.city,
            province: addr.province,
            zipCode: null,
            parentGuardian: s.guardian || 'N/A',
            gradeLevel: s.grade,
            sectionId: sectionId,
            enrollmentStatus: 'ENROLLED',
            isTransferee: false,
            previousSchool: null,
            remarks: s.remarks || null,
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
        // Create enrollment record for this academic year
        await prisma.enrollment.create({
          data: {
            studentId: student.id,
            academicYearId: academicYear.id,
            schoolYear: academicYear.name,
            gradeLevel: s.grade,
            sectionId: sectionId,
            status: 'ENROLLED',
          },
        })
      }

      created++
      console.log(`✓ Created: ${fullName} - ${s.grade}${s.section ? ' ' + s.section : ''}`)
    } catch (error: any) {
      failed++
      console.error(`✗ Failed to create ${s.name}:`, error.message)
    }
  }

  console.log('\n=== Seeding Complete ===')
  console.log(`Total students: ${students.length}`)
  console.log(`Successfully created: ${created}`)
  console.log(`Failed: ${failed}`)
}

void main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => void prisma.$disconnect())
