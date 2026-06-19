// Mock EPC Register lookup — FR-PRS002
// Real integration: https://epc.opendatacommunities.org/
// Used for property risk scoring (MEES compliance, lettability checks)

export type EPCRating = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

export interface EPCRecord {
  lodgementDate: string;
  expiryDate: string;
  currentEnergyRating: EPCRating;
  currentEnergyEfficiency: number; // SAP score 1-100
  potentialEnergyRating: EPCRating;
  potentialEnergyEfficiency: number;
  propertyType: string;
  builtForm: string;
  address: string;
  postcode: string;
  lmkKey: string; // EPC certificate reference
  meesCompliant: boolean; // Minimum Energy Efficiency Standards (E or above for lettings)
  meesBand: 'compliant' | 'borderline' | 'non_compliant'; // E=borderline for rental market
}

// Mock data keyed by postcode for deterministic testing
const EPC_BY_POSTCODE: Record<string, EPCRating> = {
  'E14 5AB': 'B',
  'SW1A 1AA': 'C',
  'M1 1AA': 'D',
  'LS1 1AA': 'D',
  'B1 1AA': 'E',
  'BD1 1AA': 'F',
  'IM1 1AA': 'G',  // Isle of Man — non-compliant
};

export async function lookupEPC(postcode: string, address?: string): Promise<EPCRecord | null> {
  await delay(180);

  const clean = postcode.trim().toUpperCase();
  const rating: EPCRating = EPC_BY_POSTCODE[clean] ?? randomRating();
  const sapScore = sapForRating(rating);

  return {
    lodgementDate: '2023-01-15',
    expiryDate: '2033-01-15',
    currentEnergyRating: rating,
    currentEnergyEfficiency: sapScore,
    potentialEnergyRating: upgradedRating(rating),
    potentialEnergyEfficiency: Math.min(100, sapScore + 12),
    propertyType: 'Flat',
    builtForm: 'Mid-Floor',
    address: address ?? `1 Test Street, ${clean}`,
    postcode: clean,
    lmkKey: `EPC-${clean.replace(' ', '')}-${Date.now()}`,
    meesCompliant: !['F', 'G'].includes(rating),
    meesBand: rating === 'E' ? 'borderline' : ['F', 'G'].includes(rating) ? 'non_compliant' : 'compliant',
  };
}

function sapForRating(rating: EPCRating): number {
  const sap: Record<EPCRating, number> = {
    A: 92, B: 81, C: 69, D: 55, E: 39, F: 26, G: 12,
  };
  return sap[rating];
}

function upgradedRating(rating: EPCRating): EPCRating {
  const upgrade: Record<EPCRating, EPCRating> = {
    A: 'A', B: 'A', C: 'B', D: 'C', E: 'D', F: 'E', G: 'F',
  };
  return upgrade[rating];
}

function randomRating(): EPCRating {
  const ratings: EPCRating[] = ['B', 'C', 'C', 'D', 'D', 'D', 'E'];
  return ratings[Math.floor(Math.random() * ratings.length)];
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
