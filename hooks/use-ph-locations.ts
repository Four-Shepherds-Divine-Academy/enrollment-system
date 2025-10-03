import { useState, useMemo } from 'react'

// Philippine Regions, Provinces, Cities, and Barangays
// Using a subset for common locations - can be expanded with full PSGC data

export interface Region {
  code: string
  name: string
}

export interface Province {
  code: string
  name: string
  regionCode: string
}

export interface City {
  code: string
  name: string
  provinceCode: string
}

export interface Barangay {
  code: string
  name: string
  cityCode: string
}

// Sample data for NCR and nearby regions (can be expanded)
const REGIONS: Region[] = [
  { code: '130000000', name: 'National Capital Region (NCR)' },
  { code: '030000000', name: 'Central Luzon (Region III)' },
  { code: '040000000', name: 'CALABARZON (Region IV-A)' },
]

const PROVINCES: Province[] = [
  // NCR - treated as a "province" for simplicity
  { code: '1300000000', name: 'Metro Manila', regionCode: '130000000' },

  // Central Luzon
  { code: '0314000000', name: 'Bulacan', regionCode: '030000000' },
  { code: '0315000000', name: 'Nueva Ecija', regionCode: '030000000' },
  { code: '0316000000', name: 'Pampanga', regionCode: '030000000' },
  { code: '0321000000', name: 'Bataan', regionCode: '030000000' },
  { code: '0369000000', name: 'Tarlac', regionCode: '030000000' },
  { code: '0377000000', name: 'Zambales', regionCode: '030000000' },
  { code: '0341000000', name: 'Aurora', regionCode: '030000000' },

  // CALABARZON
  { code: '0410000000', name: 'Batangas', regionCode: '040000000' },
  { code: '0421000000', name: 'Cavite', regionCode: '040000000' },
  { code: '0434000000', name: 'Laguna', regionCode: '040000000' },
  { code: '0456000000', name: 'Quezon', regionCode: '040000000' },
  { code: '0458000000', name: 'Rizal', regionCode: '040000000' },
]

const CITIES: City[] = [
  // Metro Manila Cities
  { code: '137601000', name: 'Caloocan City', provinceCode: '1300000000' },
  { code: '137602000', name: 'Las Piñas City', provinceCode: '1300000000' },
  { code: '137603000', name: 'Makati City', provinceCode: '1300000000' },
  { code: '137604000', name: 'Malabon City', provinceCode: '1300000000' },
  { code: '137605000', name: 'Mandaluyong City', provinceCode: '1300000000' },
  { code: '137606000', name: 'Manila', provinceCode: '1300000000' },
  { code: '137607000', name: 'Marikina City', provinceCode: '1300000000' },
  { code: '137608000', name: 'Muntinlupa City', provinceCode: '1300000000' },
  { code: '137609000', name: 'Navotas City', provinceCode: '1300000000' },
  { code: '137610000', name: 'Parañaque City', provinceCode: '1300000000' },
  { code: '137611000', name: 'Pasay City', provinceCode: '1300000000' },
  { code: '137612000', name: 'Pasig City', provinceCode: '1300000000' },
  { code: '137613000', name: 'Pateros', provinceCode: '1300000000' },
  { code: '137614000', name: 'Quezon City', provinceCode: '1300000000' },
  { code: '137615000', name: 'San Juan City', provinceCode: '1300000000' },
  { code: '137616000', name: 'Taguig City', provinceCode: '1300000000' },
  { code: '137617000', name: 'Valenzuela City', provinceCode: '1300000000' },

  // Rizal Cities
  { code: '045801000', name: 'Antipolo City', provinceCode: '0458000000' },
  { code: '045802000', name: 'Angono', provinceCode: '0458000000' },
  { code: '045803000', name: 'Binangonan', provinceCode: '0458000000' },
  { code: '045804000', name: 'Cainta', provinceCode: '0458000000' },
  { code: '045805000', name: 'Cardona', provinceCode: '0458000000' },
  { code: '045806000', name: 'Jala-Jala', provinceCode: '0458000000' },
  { code: '045807000', name: 'Rodriguez (Montalban)', provinceCode: '0458000000' },
  { code: '045808000', name: 'Morong', provinceCode: '0458000000' },
  { code: '045809000', name: 'Pililla', provinceCode: '0458000000' },
  { code: '045810000', name: 'San Mateo', provinceCode: '0458000000' },
  { code: '045811000', name: 'Tanay', provinceCode: '0458000000' },
  { code: '045812000', name: 'Taytay', provinceCode: '0458000000' },
  { code: '045813000', name: 'Teresa', provinceCode: '0458000000' },
]

// Sample barangays for common cities
const BARANGAYS: Barangay[] = [
  // Antipolo City, Rizal
  { code: '045801001', name: 'Bagong Nayon', cityCode: '045801000' },
  { code: '045801002', name: 'Beverly Hills', cityCode: '045801000' },
  { code: '045801003', name: 'Calawis', cityCode: '045801000' },
  { code: '045801004', name: 'Cupang', cityCode: '045801000' },
  { code: '045801005', name: 'Dalig', cityCode: '045801000' },
  { code: '045801006', name: 'Dela Paz', cityCode: '045801000' },
  { code: '045801007', name: 'Inarawan', cityCode: '045801000' },
  { code: '045801008', name: 'Mambugan', cityCode: '045801000' },
  { code: '045801009', name: 'Mayamot', cityCode: '045801000' },
  { code: '045801010', name: 'San Isidro', cityCode: '045801000' },
  { code: '045801011', name: 'San Jose', cityCode: '045801000' },
  { code: '045801012', name: 'San Juan', cityCode: '045801000' },
  { code: '045801013', name: 'San Luis', cityCode: '045801000' },
  { code: '045801014', name: 'San Roque', cityCode: '045801000' },
  { code: '045801015', name: 'Santa Cruz', cityCode: '045801000' },

  // Quezon City
  { code: '137614001', name: 'Bagong Pag-asa', cityCode: '137614000' },
  { code: '137614002', name: 'Batasan Hills', cityCode: '137614000' },
  { code: '137614003', name: 'Commonwealth', cityCode: '137614000' },
  { code: '137614004', name: 'Cubao', cityCode: '137614000' },
  { code: '137614005', name: 'Diliman', cityCode: '137614000' },
  { code: '137614006', name: 'Fairview', cityCode: '137614000' },
  { code: '137614007', name: 'Kamuning', cityCode: '137614000' },
  { code: '137614008', name: 'Novaliches', cityCode: '137614000' },
  { code: '137614009', name: 'Project 6', cityCode: '137614000' },
  { code: '137614010', name: 'Tandang Sora', cityCode: '137614000' },

  // Manila
  { code: '137606001', name: 'Binondo', cityCode: '137606000' },
  { code: '137606002', name: 'Ermita', cityCode: '137606000' },
  { code: '137606003', name: 'Intramuros', cityCode: '137606000' },
  { code: '137606004', name: 'Malate', cityCode: '137606000' },
  { code: '137606005', name: 'Paco', cityCode: '137606000' },
  { code: '137606006', name: 'Pandacan', cityCode: '137606000' },
  { code: '137606007', name: 'Port Area', cityCode: '137606000' },
  { code: '137606008', name: 'Quiapo', cityCode: '137606000' },
  { code: '137606009', name: 'Sampaloc', cityCode: '137606000' },
  { code: '137606010', name: 'San Miguel', cityCode: '137606000' },
]

export function usePhLocations() {
  const [selectedProvince, setSelectedProvince] = useState<string>('')
  const [selectedCity, setSelectedCity] = useState<string>('')

  // Get filtered cities based on selected province
  const cities = useMemo(() => {
    if (!selectedProvince) return []
    return CITIES.filter(city => city.provinceCode === selectedProvince)
  }, [selectedProvince])

  // Get filtered barangays based on selected city
  const barangays = useMemo(() => {
    if (!selectedCity) return []
    return BARANGAYS.filter(brgy => brgy.cityCode === selectedCity)
  }, [selectedCity])

  return {
    regions: REGIONS,
    provinces: PROVINCES,
    cities,
    barangays,
    selectedProvince,
    selectedCity,
    setSelectedProvince,
    setSelectedCity,
  }
}
