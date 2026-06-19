// Property-specific risk scoring — FR-PRS002
// Factors: EPC rating, HMO status, ownership complexity, transaction value

export type EPCRating = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';

// EPC risk weights: poor rating = higher risk (potential under-the-table lettings, non-compliant landlords)
const EPC_RISK: Record<EPCRating, number> = {
  A: 0.0,
  B: 0.05,
  C: 0.10,
  D: 0.20,
  E: 0.35,
  F: 0.55,
  G: 0.75,
};

export interface PropertyRiskInput {
  epcRating?: EPCRating | null;
  hmoLicensed?: boolean;
  propertyType?: string;
  ownershipComplex?: boolean;
  lastSalePrice?: number | null;
  transactionAmount?: number | null;
  transactionType?: string | null; // purchase | rental
}

export interface PropertyRiskResult {
  propertyRisk: number;   // 0-1 (higher = more risk)
  epcRisk: number;
  hmoRisk: number;
  ownershipRisk: number;
  valueRisk: number;
  riskFactors: string[];
}

export function scorePropertyRisk(input: PropertyRiskInput): PropertyRiskResult {
  const factors: string[] = [];

  // EPC risk
  const epcRisk = input.epcRating ? EPC_RISK[input.epcRating] ?? 0.2 : 0.15;
  if (input.epcRating && ['F', 'G'].includes(input.epcRating)) {
    factors.push(`EPC rating ${input.epcRating} — property may be unlettable under MEES`);
  }

  // HMO risk
  let hmoRisk = 0;
  if (input.propertyType === 'hmo') {
    hmoRisk = input.hmoLicensed ? 0.1 : 0.5;
    if (!input.hmoLicensed) {
      factors.push('HMO property without valid licence — regulatory risk');
    }
  }

  // Ownership complexity
  const ownershipRisk = input.ownershipComplex ? 0.4 : 0;
  if (input.ownershipComplex) {
    factors.push('Complex ownership structure — enhanced CDD required');
  }

  // Transaction value risk (high-value = elevated ML risk per FATF threshold)
  const amount = input.transactionAmount ?? input.lastSalePrice ?? 0;
  let valueRisk = 0;
  if (amount > 1_000_000) {
    valueRisk = 0.3;
    factors.push('High-value transaction (>£1M) — enhanced scrutiny required');
  } else if (amount > 500_000) {
    valueRisk = 0.15;
    factors.push('Elevated transaction value (>£500k)');
  }

  // Weighted composite
  const propertyRisk = Math.min(
    1,
    epcRisk * 0.2 + hmoRisk * 0.3 + ownershipRisk * 0.3 + valueRisk * 0.2
  );

  return { propertyRisk, epcRisk, hmoRisk, ownershipRisk, valueRisk, riskFactors: factors };
}

// Determine if property factors trigger EDD
export function requiresPropertyEDD(result: PropertyRiskResult): boolean {
  return result.propertyRisk >= 0.35 || result.hmoRisk >= 0.4 || result.ownershipRisk >= 0.3;
}
