// Mock HMRC AML Supervision lookup — FR-AML002
// Checks if an estate/letting agent is registered with HMRC for AML supervision
// Real integration: HMRC AML Supervision Register (no public API — manual check)

export interface HMRCRegistration {
  registrationNumber: string;
  businessName: string;
  registeredAddress: string;
  registrationDate: string;
  status: 'active' | 'expired' | 'revoked' | 'pending';
  supervisoryBody: 'HMRC' | 'FCA' | 'RICS' | 'NAEA' | 'ARLA';
  expiryDate?: string;
  riskRating?: 'low' | 'medium' | 'high';
}

const MOCK_REGISTRATIONS: Record<string, HMRCRegistration> = {
  'XAML00000100001': {
    registrationNumber: 'XAML00000100001',
    businessName: 'PropComply Demo Agency Ltd',
    registeredAddress: '10 Canary Wharf, London, E14 5AB',
    registrationDate: '2021-04-01',
    status: 'active',
    supervisoryBody: 'HMRC',
    riskRating: 'low',
  },
  'XAML00000100002': {
    registrationNumber: 'XAML00000100002',
    businessName: 'Expired Letting Agency Ltd',
    registeredAddress: '5 High Street, Manchester, M1 1AA',
    registrationDate: '2019-01-01',
    expiryDate: '2022-01-01',
    status: 'expired',
    supervisoryBody: 'HMRC',
    riskRating: 'high',
  },
};

export async function lookupHMRCRegistration(
  registrationNumber: string
): Promise<HMRCRegistration | null> {
  await delay(200);
  return MOCK_REGISTRATIONS[registrationNumber.toUpperCase()] ?? null;
}

export async function verifyFirmAMLRegistration(
  firmName: string,
  registrationNumber?: string
): Promise<{
  verified: boolean;
  registration?: HMRCRegistration;
  riskFlag?: string;
}> {
  await delay(250);

  if (registrationNumber) {
    const reg = await lookupHMRCRegistration(registrationNumber);
    if (!reg) {
      return { verified: false, riskFlag: 'Registration number not found on HMRC AML register' };
    }
    if (reg.status !== 'active') {
      return { verified: false, registration: reg, riskFlag: `AML registration status: ${reg.status}` };
    }
    return { verified: true, registration: reg };
  }

  // Without a reg number, return unverified
  return { verified: false, riskFlag: 'No HMRC AML registration number provided' };
}

// Source of funds verification (simplified mock)
export interface SOFVerification {
  sourceType: 'employment' | 'savings' | 'property_sale' | 'inheritance' | 'investment' | 'other';
  verified: boolean;
  confidence: number;
  evidenceRequired: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

export async function verifySourceOfFunds(
  sourceType: string,
  amount: number
): Promise<SOFVerification> {
  await delay(150);

  const highRisk = amount > 500_000 || sourceType === 'other';
  const evidenceRequired: string[] = [];

  if (sourceType === 'employment') evidenceRequired.push('3 months payslips', 'employment contract');
  if (sourceType === 'savings') evidenceRequired.push('6 months bank statements');
  if (sourceType === 'property_sale') evidenceRequired.push('completion statement', 'Land Registry entry');
  if (sourceType === 'inheritance') evidenceRequired.push('probate documents', 'solicitor letter');
  if (sourceType === 'investment') evidenceRequired.push('investment portfolio statements', 'CGT records');
  if (sourceType === 'other') evidenceRequired.push('detailed written explanation', 'supporting documentation');

  return {
    sourceType: sourceType as SOFVerification['sourceType'],
    verified: !highRisk,
    confidence: highRisk ? 0.4 : 0.85,
    evidenceRequired,
    riskLevel: highRisk ? 'high' : amount > 100_000 ? 'medium' : 'low',
  };
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
