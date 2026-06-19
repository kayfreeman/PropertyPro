// Mock Identity Document Verification — FR-IDV001
// Simulates: document authenticity, liveness, face match, biometric confidence
// Real providers: Onfido, Jumio, Yoti, iProov

export type DocumentType = 'passport' | 'driving_licence' | 'national_id' | 'biometric_residence_permit';

export interface IDVRequest {
  documentType: DocumentType;
  documentRef?: string; // simulated upload token
  selfieRef?: string;
  dateOfBirth?: string;
  nationality?: string;
}

export interface IDVResult {
  passed: boolean;
  overallConfidence: number; // 0-1
  documentAuthentic: boolean;
  tamperingDetected: boolean;
  livenessScore: number;     // 0-1
  faceMatchScore: number;    // 0-1
  deepfakeScore: number;     // 0-1 (lower = more likely deepfake)
  ocrConfidence: number;     // 0-1
  extractedData: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    documentNumber?: string;
    nationality?: string;
    expiryDate?: string;
  };
  riskSignals: string[];
  provider: string;
  verificationId: string;
  completedAt: string;
}

export async function verifyDocument(req: IDVRequest): Promise<IDVResult> {
  await delay(350);

  // Simulate occasional failures for testing
  const shouldFail = req.documentRef?.includes('FAIL') ?? false;
  const isExpired = req.documentRef?.includes('EXPIRED') ?? false;

  const livenessScore = shouldFail ? 0.31 : 0.87 + Math.random() * 0.12;
  const faceMatchScore = shouldFail ? 0.44 : 0.85 + Math.random() * 0.14;
  const deepfakeScore = shouldFail ? 0.15 : 0.82 + Math.random() * 0.17;
  const ocrConfidence = isExpired ? 0.92 : 0.88 + Math.random() * 0.11;
  const documentAuthentic = !shouldFail && !isExpired;
  const overallConfidence = (livenessScore + faceMatchScore + deepfakeScore + ocrConfidence) / 4;

  const riskSignals: string[] = [];
  if (livenessScore < 0.6) riskSignals.push('Low liveness score — possible spoofing');
  if (faceMatchScore < 0.7) riskSignals.push('Face match confidence below threshold');
  if (deepfakeScore < 0.5) riskSignals.push('Deepfake indicators detected');
  if (isExpired) riskSignals.push('Document past expiry date');
  if (!documentAuthentic) riskSignals.push('Document authenticity check failed');

  return {
    passed: documentAuthentic && overallConfidence >= 0.75,
    overallConfidence,
    documentAuthentic,
    tamperingDetected: shouldFail,
    livenessScore,
    faceMatchScore,
    deepfakeScore,
    ocrConfidence,
    extractedData: {
      firstName: 'Test',
      lastName: 'Applicant',
      dateOfBirth: req.dateOfBirth ?? '1990-01-01',
      documentNumber: `MOCK${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
      nationality: req.nationality ?? 'GBR',
      expiryDate: isExpired ? '2023-01-01' : '2030-12-31',
    },
    riskSignals,
    provider: 'PropComply Mock IDV v1',
    verificationId: `IDV-${Date.now()}`,
    completedAt: new Date().toISOString(),
  };
}

function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}
