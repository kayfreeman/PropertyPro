import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.platformConfig.deleteMany();
  await prisma.consentRecord.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.partnerReferral.deleteMany();
  await prisma.partner.deleteMany();
  await prisma.propertyApplication.deleteMany();
  await prisma.property.deleteMany();
  await prisma.fraudAlert.deleteMany();
  await prisma.riskScore.deleteMany();
  await prisma.complianceCheck.deleteMany();
  await prisma.verificationRecord.deleteMany();
  await prisma.identityEvidence.deleteMany();
  await prisma.identityCredential.deleteMany();
  await prisma.identityProfile.deleteMany();

  // ============================================
  // 1. IDENTITY PROFILES (8)
  // ============================================
  const profiles = await Promise.all([
    prisma.identityProfile.create({
      data: {
        firstName: "James",
        lastName: "Wellington",
        email: "j.wellington@outlook.com",
        phone: "+44 7700 900123",
        dateOfBirth: "1985-03-15",
        nationality: "GB",
        trustLevel: 5,
        trustScore: 94.7,
        status: "verified",
        consentGiven: true,
        gdprCompliant: true,
      },
    }),
    prisma.identityProfile.create({
      data: {
        firstName: "Priya",
        lastName: "Sharma",
        email: "priya.sharma@gmail.com",
        phone: "+44 7911 123456",
        dateOfBirth: "1992-07-22",
        nationality: "IN",
        trustLevel: 4,
        trustScore: 82.3,
        status: "verified",
        consentGiven: true,
        gdprCompliant: true,
      },
    }),
    prisma.identityProfile.create({
      data: {
        firstName: "Hans",
        lastName: "Müller",
        email: "hans.mueller@web.de",
        phone: "+49 151 2345678",
        dateOfBirth: "1978-11-08",
        nationality: "DE",
        trustLevel: 3,
        trustScore: 68.5,
        status: "verified",
        consentGiven: true,
        gdprCompliant: true,
      },
    }),
    prisma.identityProfile.create({
      data: {
        firstName: "Amara",
        lastName: "Okafor",
        email: "amara.okafor@yahoo.co.uk",
        phone: "+44 7700 456789",
        dateOfBirth: "1995-01-30",
        nationality: "NG",
        trustLevel: 2,
        trustScore: 45.2,
        status: "pending",
        consentGiven: true,
        gdprCompliant: false,
      },
    }),
    prisma.identityProfile.create({
      data: {
        firstName: "Sofia",
        lastName: "Rossi",
        email: "sofia.rossi@libero.it",
        phone: "+39 333 9876543",
        dateOfBirth: "1988-06-14",
        nationality: "IT",
        trustLevel: 3,
        trustScore: 71.0,
        status: "verified",
        consentGiven: true,
        gdprCompliant: true,
      },
    }),
    prisma.identityProfile.create({
      data: {
        firstName: "Oleksandr",
        lastName: "Kovalenko",
        email: "o.kovalenko@ukr.net",
        phone: "+380 50 1112233",
        dateOfBirth: "1990-09-25",
        nationality: "UA",
        trustLevel: 1,
        trustScore: 28.4,
        status: "pending",
        consentGiven: false,
        gdprCompliant: false,
      },
    }),
    prisma.identityProfile.create({
      data: {
        firstName: "Margaret",
        lastName: "Thompson",
        email: "margaret.t@hotmail.co.uk",
        phone: "+44 7700 654321",
        dateOfBirth: "1952-12-03",
        nationality: "GB",
        trustLevel: 5,
        trustScore: 97.1,
        status: "verified",
        consentGiven: true,
        gdprCompliant: true,
      },
    }),
    prisma.identityProfile.create({
      data: {
        firstName: "Chen",
        lastName: "Wei",
        email: "chen.wei@163.com",
        phone: "+86 139 8765 4321",
        dateOfBirth: "1993-04-18",
        nationality: "CN",
        trustLevel: 0,
        trustScore: 12.6,
        status: "rejected",
        consentGiven: false,
        gdprCompliant: false,
      },
    }),
  ]);

  console.log(`Created ${profiles.length} identity profiles`);

  // ============================================
  // 2. IDENTITY CREDENTIALS (15+)
  // ============================================
  const credentialsData = [
    // James Wellington - Level 5 (full credentials)
    { profileId: profiles[0].id, credentialType: "passport", credentialValue: "GB-PP-53219014", trustLevel: 3, issuingCountry: "GB", issuingAuthority: "HM Passport Office", validFrom: new Date("2020-01-15"), validTo: new Date("2030-01-15"), verificationStatus: "verified", verifiedAt: new Date("2024-01-20") },
    { profileId: profiles[0].id, credentialType: "biometric", credentialValue: "BIO-FACE-GB-78234", trustLevel: 4, issuingCountry: "GB", issuingAuthority: "UK Visas and Immigration", validFrom: new Date("2023-06-01"), validTo: new Date("2028-06-01"), verificationStatus: "verified", verifiedAt: new Date("2024-02-10") },
    { profileId: profiles[0].id, credentialType: "banking", credentialValue: "OB-ACC-****7821", trustLevel: 5, issuingCountry: "GB", issuingAuthority: "Barclays Bank", validFrom: new Date("2015-03-20"), validTo: null, verificationStatus: "verified", verifiedAt: new Date("2024-01-22") },
    { profileId: profiles[0].id, credentialType: "employer", credentialValue: "EMP-HSBC-UK-4421", trustLevel: 4, issuingCountry: "GB", issuingAuthority: "HSBC UK", validFrom: new Date("2021-09-01"), validTo: null, verificationStatus: "verified", verifiedAt: new Date("2024-03-05") },

    // Priya Sharma - Level 4
    { profileId: profiles[1].id, credentialType: "passport", credentialValue: "IN-PP-K8321456", trustLevel: 3, issuingCountry: "IN", issuingAuthority: "Passport Seva", validFrom: new Date("2019-05-10"), validTo: new Date("2029-05-10"), verificationStatus: "verified", verifiedAt: new Date("2024-01-15") },
    { profileId: profiles[1].id, credentialType: "biometric", credentialValue: "BIO-FACE-IN-55432", trustLevel: 4, issuingCountry: "GB", issuingAuthority: "UK Visas and Immigration", validFrom: new Date("2023-08-15"), validTo: new Date("2028-08-15"), verificationStatus: "verified", verifiedAt: new Date("2024-02-28") },
    { profileId: profiles[1].id, credentialType: "visa", credentialValue: "GB-VISA-T2-901234", trustLevel: 2, issuingCountry: "GB", issuingAuthority: "Home Office", validFrom: new Date("2023-01-01"), validTo: new Date("2026-01-01"), verificationStatus: "verified", verifiedAt: new Date("2024-01-18") },
    { profileId: profiles[1].id, credentialType: "banking", credentialValue: "OB-ACC-****3492", trustLevel: 5, issuingCountry: "GB", issuingAuthority: "NatWest", validFrom: new Date("2023-02-01"), validTo: null, verificationStatus: "verified", verifiedAt: new Date("2024-03-10") },

    // Hans Müller - Level 3
    { profileId: profiles[2].id, credentialType: "national_id", credentialValue: "DE-NID-T220001293", trustLevel: 3, issuingCountry: "DE", issuingAuthority: "Bundesdruckerei", validFrom: new Date("2018-06-01"), validTo: new Date("2028-06-01"), verificationStatus: "verified", verifiedAt: new Date("2024-04-02") },
    { profileId: profiles[2].id, credentialType: "passport", credentialValue: "DE-PP-C0987654", trustLevel: 3, issuingCountry: "DE", issuingAuthority: "Bundesdruckerei", validFrom: new Date("2021-03-15"), validTo: new Date("2031-03-15"), verificationStatus: "verified", verifiedAt: new Date("2024-04-05") },

    // Amara Okafor - Level 2
    { profileId: profiles[3].id, credentialType: "passport", credentialValue: "NG-PP-A8765432", trustLevel: 3, issuingCountry: "NG", issuingAuthority: "Nigeria Immigration Service", validFrom: new Date("2022-01-10"), validTo: new Date("2032-01-10"), verificationStatus: "pending", verifiedAt: null },
    { profileId: profiles[3].id, credentialType: "residence_permit", credentialValue: "GB-RP-BRP-90123456", trustLevel: 2, issuingCountry: "GB", issuingAuthority: "Home Office", validFrom: new Date("2023-06-20"), validTo: new Date("2026-06-20"), verificationStatus: "pending", verifiedAt: null },

    // Sofia Rossi - Level 3
    { profileId: profiles[4].id, credentialType: "passport", credentialValue: "IT-PP-YB1234567", trustLevel: 3, issuingCountry: "IT", issuingAuthority: "Polizia di Stato", validFrom: new Date("2020-07-01"), validTo: new Date("2030-07-01"), verificationStatus: "verified", verifiedAt: new Date("2024-05-12") },
    { profileId: profiles[4].id, credentialType: "national_id", credentialValue: "IT-CF-RSSF88L45H501Z", trustLevel: 3, issuingCountry: "IT", issuingAuthority: "Agenzia delle Entrate", validFrom: new Date("2016-01-01"), validTo: null, verificationStatus: "verified", verifiedAt: new Date("2024-05-14") },

    // Oleksandr Kovalenko - Level 1
    { profileId: profiles[5].id, credentialType: "passport", credentialValue: "UA-PP-FO123456", trustLevel: 3, issuingCountry: "UA", issuingAuthority: "SMS of Ukraine", validFrom: new Date("2021-04-01"), validTo: new Date("2031-04-01"), verificationStatus: "failed", verifiedAt: null },

    // Margaret Thompson - Level 5
    { profileId: profiles[6].id, credentialType: "passport", credentialValue: "GB-PP-87654321", trustLevel: 3, issuingCountry: "GB", issuingAuthority: "HM Passport Office", validFrom: new Date("2019-08-01"), validTo: new Date("2029-08-01"), verificationStatus: "verified", verifiedAt: new Date("2024-01-05") },
    { profileId: profiles[6].id, credentialType: "government", credentialValue: "GOV-DBS-98765432", trustLevel: 5, issuingCountry: "GB", issuingAuthority: "DBS Check Service", validFrom: new Date("2023-11-01"), validTo: null, verificationStatus: "verified", verifiedAt: new Date("2024-01-06") },

    // Chen Wei - Level 0 (rejected)
    { profileId: profiles[7].id, credentialType: "passport", credentialValue: "CN-PP-E12345678", trustLevel: 3, issuingCountry: "CN", issuingAuthority: "Exit-Entry Administration", validFrom: new Date("2022-03-01"), validTo: new Date("2032-03-01"), verificationStatus: "expired", verifiedAt: null },
  ];

  const credentials = await Promise.all(
    credentialsData.map((c) => prisma.identityCredential.create({ data: c }))
  );
  console.log(`Created ${credentials.length} identity credentials`);

  // ============================================
  // 3. IDENTITY EVIDENCE (10+)
  // ============================================
  const evidenceData = [
    { profileId: profiles[0].id, evidenceType: "document", evidenceData: JSON.stringify({ type: "utility_bill", issuer: "British Gas", period: "2024-01" }), confidence: 0.97, source: "British Gas", verifiedBy: "system", verifiedAt: new Date("2024-01-25"), expiresAt: new Date("2024-07-25") },
    { profileId: profiles[0].id, evidenceType: "biometric", evidenceData: JSON.stringify({ type: "facial_recognition", livenessPassed: true, matchScore: 0.98 }), confidence: 0.98, source: "Onfido", verifiedBy: "Onfido AI", verifiedAt: new Date("2024-02-10"), expiresAt: null },
    { profileId: profiles[0].id, evidenceType: "institutional", evidenceData: JSON.stringify({ type: "bank_statement", provider: "Barclays", months: 3 }), confidence: 0.95, source: "Open Banking", verifiedBy: "Yolt", verifiedAt: new Date("2024-01-22"), expiresAt: new Date("2024-04-22") },
    { profileId: profiles[1].id, evidenceType: "document", evidenceData: JSON.stringify({ type: "visa_brp", biometricResidencePermit: true }), confidence: 0.93, source: "Home Office", verifiedBy: "UKVI", verifiedAt: new Date("2024-01-18"), expiresAt: new Date("2026-01-01") },
    { profileId: profiles[1].id, evidenceType: "biometric", evidenceData: JSON.stringify({ type: "facial_recognition", livenessPassed: true, matchScore: 0.95 }), confidence: 0.95, source: "Onfido", verifiedBy: "Onfido AI", verifiedAt: new Date("2024-02-28"), expiresAt: null },
    { profileId: profiles[2].id, evidenceType: "document", evidenceData: JSON.stringify({ type: "national_id_card", country: "DE" }), confidence: 0.91, source: "Bundesdruckerei", verifiedBy: "eID Provider", verifiedAt: new Date("2024-04-02"), expiresAt: new Date("2028-06-01") },
    { profileId: profiles[3].id, evidenceType: "document", evidenceData: JSON.stringify({ type: "passport_scan", country: "NG" }), confidence: 0.72, source: "Self-upload", verifiedBy: null, verifiedAt: null, expiresAt: null },
    { profileId: profiles[3].id, evidenceType: "behavioral", evidenceData: JSON.stringify({ type: "device_fingerprint", riskScore: 0.3 }), confidence: 0.68, source: "Device Intelligence", verifiedBy: null, verifiedAt: null, expiresAt: null },
    { profileId: profiles[4].id, evidenceType: "document", evidenceData: JSON.stringify({ type: "codice_fiscale", country: "IT" }), confidence: 0.92, source: "Agenzia delle Entrate", verifiedBy: "eID Provider", verifiedAt: new Date("2024-05-14"), expiresAt: null },
    { profileId: profiles[5].id, evidenceType: "document", evidenceData: JSON.stringify({ type: "passport_scan", country: "UA", qualityIssues: ["blurry_photo"] }), confidence: 0.45, source: "Self-upload", verifiedBy: null, verifiedAt: null, expiresAt: null },
    { profileId: profiles[6].id, evidenceType: "government", evidenceData: JSON.stringify({ type: "dbs_enhanced", level: "enhanced", certificateNumber: "DBS-E-98765" }), confidence: 0.99, source: "DBS Update Service", verifiedBy: "DBS", verifiedAt: new Date("2024-01-06"), expiresAt: null },
    { profileId: profiles[6].id, evidenceType: "document", evidenceData: JSON.stringify({ type: "council_tax", year: "2024/25", band: "E" }), confidence: 0.96, source: "Westminster Council", verifiedBy: "system", verifiedAt: new Date("2024-04-01"), expiresAt: new Date("2025-04-01") },
  ];

  const evidence = await Promise.all(
    evidenceData.map((e) => prisma.identityEvidence.create({ data: e }))
  );
  console.log(`Created ${evidence.length} identity evidence records`);

  // ============================================
  // 4. VERIFICATION RECORDS (10+)
  // ============================================
  const verificationsData = [
    { profileId: profiles[0].id, verificationType: "document", status: "passed", provider: "Onfido", result: JSON.stringify({ documentType: "passport", country: "GB", authenticity: 0.99 }), confidence: 0.99, attemptCount: 1, completedAt: new Date("2024-01-20") },
    { profileId: profiles[0].id, verificationType: "biometric_face", status: "passed", provider: "Onfido", result: JSON.stringify({ matchScore: 0.98, liveness: true }), confidence: 0.98, attemptCount: 1, completedAt: new Date("2024-02-10") },
    { profileId: profiles[0].id, verificationType: "open_banking", status: "passed", provider: "Yolt", result: JSON.stringify({ provider: "Barclays", accountAge: "9 years", avgBalance: "£4,200" }), confidence: 0.96, attemptCount: 1, completedAt: new Date("2024-01-22") },
    { profileId: profiles[0].id, verificationType: "income", status: "passed", provider: "Yolt", result: JSON.stringify({ annualIncome: "£78,500", source: "employment", consistency: 0.94 }), confidence: 0.94, attemptCount: 1, completedAt: new Date("2024-03-05") },
    { profileId: profiles[1].id, verificationType: "document", status: "passed", provider: "Onfido", result: JSON.stringify({ documentType: "passport", country: "IN", authenticity: 0.96 }), confidence: 0.96, attemptCount: 1, completedAt: new Date("2024-01-15") },
    { profileId: profiles[1].id, verificationType: "biometric_face", status: "passed", provider: "Onfido", result: JSON.stringify({ matchScore: 0.95, liveness: true }), confidence: 0.95, attemptCount: 1, completedAt: new Date("2024-02-28") },
    { profileId: profiles[1].id, verificationType: "employer", status: "passed", provider: "The Work Number", result: JSON.stringify({ employer: "Deloitte UK", role: "Senior Consultant", startDate: "2022-03-01" }), confidence: 0.91, attemptCount: 1, completedAt: new Date("2024-03-12") },
    { profileId: profiles[2].id, verificationType: "document", status: "passed", provider: "Jumio", result: JSON.stringify({ documentType: "national_id", country: "DE", authenticity: 0.93 }), confidence: 0.93, attemptCount: 1, completedAt: new Date("2024-04-02") },
    { profileId: profiles[2].id, verificationType: "liveness", status: "passed", provider: "Onfido", result: JSON.stringify({ livenessPassed: true, challengeType: "motion" }), confidence: 0.90, attemptCount: 1, completedAt: new Date("2024-04-03") },
    { profileId: profiles[3].id, verificationType: "document", status: "in_progress", provider: "Onfido", result: null, confidence: 0, attemptCount: 1, completedAt: null },
    { profileId: profiles[3].id, verificationType: "biometric_face", status: "pending", provider: "Onfido", result: null, confidence: 0, attemptCount: 0, completedAt: null },
    { profileId: profiles[5].id, verificationType: "document", status: "failed", provider: "Jumio", result: JSON.stringify({ reason: "image_quality_too_low", details: "Blurry photo, cannot read MRZ" }), confidence: 0.2, attemptCount: 3, completedAt: new Date("2024-06-15") },
    { profileId: profiles[5].id, verificationType: "liveness", status: "failed", provider: "Onfido", result: JSON.stringify({ reason: "liveness_check_failed", details: "Possible spoof detected" }), confidence: 0.15, attemptCount: 2, completedAt: new Date("2024-06-15") },
    { profileId: profiles[6].id, verificationType: "document", status: "passed", provider: "Onfido", result: JSON.stringify({ documentType: "passport", country: "GB", authenticity: 0.99 }), confidence: 0.99, attemptCount: 1, completedAt: new Date("2024-01-05") },
    { profileId: profiles[6].id, verificationType: "government", status: "passed", provider: "GOV.UK Verify", result: JSON.stringify({ service: "dbs_check", level: "enhanced" }), confidence: 0.99, attemptCount: 1, completedAt: new Date("2024-01-06") },
  ];

  const verifications = await Promise.all(
    verificationsData.map((v) => prisma.verificationRecord.create({ data: v }))
  );
  console.log(`Created ${verifications.length} verification records`);

  // ============================================
  // 5. COMPLIANCE CHECKS (20+)
  // ============================================
  const complianceData = [
    // James Wellington - fully compliant
    { profileId: profiles[0].id, checkType: "aml", status: "passed", riskRating: "low", checkProvider: "ComplyAdvantage", results: JSON.stringify({ pepMatch: false, sanctionsMatch: false, adverseMedia: false }), reviewedBy: "system", reviewedAt: new Date("2024-01-20"), expiresAt: new Date("2025-01-20") },
    { profileId: profiles[0].id, checkType: "kyc", status: "passed", riskRating: "low", checkProvider: "Onfido", results: JSON.stringify({ identityVerified: true, documentAuthentic: true }), reviewedBy: "system", reviewedAt: new Date("2024-01-20"), expiresAt: new Date("2025-01-20") },
    { profileId: profiles[0].id, checkType: "cdd", status: "passed", riskRating: "low", checkProvider: "Internal", results: JSON.stringify({ category: "simplified", riskFactors: [] }), reviewedBy: "compliance_team", reviewedAt: new Date("2024-01-21"), expiresAt: new Date("2025-01-21") },
    { profileId: profiles[0].id, checkType: "sanctions", status: "passed", riskRating: "low", checkProvider: "ComplyAdvantage", results: JSON.stringify({ listsChecked: ["OFAC", "EU", "UN", "HMT"], hits: 0 }), reviewedBy: "system", reviewedAt: new Date("2024-01-20"), expiresAt: new Date("2025-01-20") },
    { profileId: profiles[0].id, checkType: "right_to_rent", status: "passed", riskRating: "low", checkProvider: "Home Office", results: JSON.stringify({ shareCode: "R2R-ABC123", valid: true }), reviewedBy: "system", reviewedAt: new Date("2024-01-22"), expiresAt: new Date("2025-01-22") },

    // Priya Sharma - good compliance, some EDD needed
    { profileId: profiles[1].id, checkType: "aml", status: "passed", riskRating: "low", checkProvider: "ComplyAdvantage", results: JSON.stringify({ pepMatch: false, sanctionsMatch: false, adverseMedia: false }), reviewedBy: "system", reviewedAt: new Date("2024-01-15"), expiresAt: new Date("2025-01-15") },
    { profileId: profiles[1].id, checkType: "kyc", status: "passed", riskRating: "medium", checkProvider: "Onfido", results: JSON.stringify({ identityVerified: true, documentAuthentic: true, nationalityRisk: "medium" }), reviewedBy: "compliance_team", reviewedAt: new Date("2024-01-16"), expiresAt: new Date("2025-01-16") },
    { profileId: profiles[1].id, checkType: "cdd", status: "passed", riskRating: "medium", checkProvider: "Internal", results: JSON.stringify({ category: "standard", riskFactors: ["non_uk_national"] }), reviewedBy: "compliance_team", reviewedAt: new Date("2024-01-17"), expiresAt: new Date("2025-01-17") },
    { profileId: profiles[1].id, checkType: "edd", status: "passed", riskRating: "medium", checkProvider: "Internal", results: JSON.stringify({ enhancedDueDiligence: true, sourceOfFunds: "employment", sourceOfWealth: "verified" }), reviewedBy: "senior_compliance", reviewedAt: new Date("2024-01-18"), expiresAt: new Date("2025-01-18") },
    { profileId: profiles[1].id, checkType: "right_to_rent", status: "passed", riskRating: "low", checkProvider: "Home Office", results: JSON.stringify({ shareCode: "R2R-DEF456", valid: true }), reviewedBy: "system", reviewedAt: new Date("2024-01-18"), expiresAt: new Date("2026-01-01") },

    // Hans Müller - EU national, standard checks
    { profileId: profiles[2].id, checkType: "aml", status: "passed", riskRating: "low", checkProvider: "ComplyAdvantage", results: JSON.stringify({ pepMatch: false, sanctionsMatch: false }), reviewedBy: "system", reviewedAt: new Date("2024-04-02"), expiresAt: new Date("2025-04-02") },
    { profileId: profiles[2].id, checkType: "kyc", status: "passed", riskRating: "low", checkProvider: "Jumio", results: JSON.stringify({ identityVerified: true }), reviewedBy: "system", reviewedAt: new Date("2024-04-03"), expiresAt: new Date("2025-04-03") },
    { profileId: profiles[2].id, checkType: "sanctions", status: "passed", riskRating: "low", checkProvider: "ComplyAdvantage", results: JSON.stringify({ listsChecked: ["OFAC", "EU", "UN", "HMT"], hits: 0 }), reviewedBy: "system", reviewedAt: new Date("2024-04-02"), expiresAt: new Date("2025-04-02") },

    // Amara Okafor - pending, elevated risk
    { profileId: profiles[3].id, checkType: "aml", status: "in_progress", riskRating: "medium", checkProvider: "ComplyAdvantage", results: null, reviewedBy: null, reviewedAt: null, expiresAt: null },
    { profileId: profiles[3].id, checkType: "kyc", status: "in_progress", riskRating: "medium", checkProvider: "Onfido", results: null, reviewedBy: null, reviewedAt: null, expiresAt: null },
    { profileId: profiles[3].id, checkType: "cdd", status: "pending", riskRating: "high", checkProvider: "Internal", results: null, reviewedBy: null, reviewedAt: null, expiresAt: null },
    { profileId: profiles[3].id, checkType: "pep", status: "pending", riskRating: "medium", checkProvider: "ComplyAdvantage", results: null, reviewedBy: null, reviewedAt: null, expiresAt: null },
    { profileId: profiles[3].id, checkType: "right_to_rent", status: "pending", riskRating: "medium", checkProvider: "Home Office", results: null, reviewedBy: null, reviewedAt: null, expiresAt: null },

    // Sofia Rossi - EU, passed
    { profileId: profiles[4].id, checkType: "aml", status: "passed", riskRating: "low", checkProvider: "ComplyAdvantage", results: JSON.stringify({ pepMatch: false, sanctionsMatch: false }), reviewedBy: "system", reviewedAt: new Date("2024-05-12"), expiresAt: new Date("2025-05-12") },
    { profileId: profiles[4].id, checkType: "kyc", status: "passed", riskRating: "low", checkProvider: "Jumio", results: JSON.stringify({ identityVerified: true }), reviewedBy: "system", reviewedAt: new Date("2024-05-14"), expiresAt: new Date("2025-05-14") },

    // Oleksandr Kovalenko - failed checks
    { profileId: profiles[5].id, checkType: "aml", status: "failed", riskRating: "high", checkProvider: "ComplyAdvantage", results: JSON.stringify({ sanctionsMatch: true, list: "EU_Sanctions", matchStrength: 0.65 }), reviewedBy: "senior_compliance", reviewedAt: new Date("2024-06-16"), expiresAt: null },
    { profileId: profiles[5].id, checkType: "kyc", status: "failed", riskRating: "high", checkProvider: "Jumio", results: JSON.stringify({ identityVerified: false, documentQuality: "poor" }), reviewedBy: "compliance_team", reviewedAt: new Date("2024-06-16"), expiresAt: null },
    { profileId: profiles[5].id, checkType: "sanctions", status: "escalated", riskRating: "critical", checkProvider: "ComplyAdvantage", results: JSON.stringify({ listsChecked: ["OFAC", "EU", "UN", "HMT"], hits: 1, list: "EU_Sanctions" }), reviewedBy: "senior_compliance", reviewedAt: new Date("2024-06-16"), expiresAt: null },
    { profileId: profiles[5].id, checkType: "adverse_media", status: "in_progress", riskRating: "medium", checkProvider: "ComplyAdvantage", results: null, reviewedBy: null, reviewedAt: null, expiresAt: null },

    // Margaret Thompson - fully verified, exemplary
    { profileId: profiles[6].id, checkType: "aml", status: "passed", riskRating: "low", checkProvider: "ComplyAdvantage", results: JSON.stringify({ pepMatch: false, sanctionsMatch: false, adverseMedia: false }), reviewedBy: "system", reviewedAt: new Date("2024-01-05"), expiresAt: new Date("2025-01-05") },
    { profileId: profiles[6].id, checkType: "kyc", status: "passed", riskRating: "low", checkProvider: "Onfido", results: JSON.stringify({ identityVerified: true, documentAuthentic: true }), reviewedBy: "system", reviewedAt: new Date("2024-01-05"), expiresAt: new Date("2025-01-05") },
  ];

  const complianceChecks = await Promise.all(
    complianceData.map((c) => prisma.complianceCheck.create({ data: c }))
  );
  console.log(`Created ${complianceChecks.length} compliance checks`);

  // ============================================
  // 6. RISK SCORES (8)
  // ============================================
  const riskScoresData = [
    { profileId: profiles[0].id, overallScore: 94.7, riskCategory: "low", fraudProbability: 0.02, identityRisk: 0.01, financialRisk: 0.03, behavioralRisk: 0.02, complianceRisk: 0.02, riskFactors: JSON.stringify({ factors: [], notes: "Clean profile with extensive verification history" }), modelVersion: "v3.2.1", explainability: JSON.stringify({ topFactors: ["verified_government_credential", "open_banking_verified", "long_account_history"] }) },
    { profileId: profiles[1].id, overallScore: 78.3, riskCategory: "low", fraudProbability: 0.08, identityRisk: 0.05, financialRisk: 0.08, behavioralRisk: 0.06, complianceRisk: 0.10, riskFactors: JSON.stringify({ factors: ["non_uk_national", "recent_arrival"], notes: "Non-UK national with visa, well verified" }), modelVersion: "v3.2.1", explainability: JSON.stringify({ topFactors: ["visa_verified", "employer_confirmed", "banking_connected"] }) },
    { profileId: profiles[2].id, overallScore: 72.0, riskCategory: "medium", fraudProbability: 0.12, identityRisk: 0.08, financialRisk: 0.15, behavioralRisk: 0.10, complianceRisk: 0.12, riskFactors: JSON.stringify({ factors: ["eu_national_post_brexit", "limited_uk_credit_history"], notes: "EU national, standard risk" }), modelVersion: "v3.2.1", explainability: JSON.stringify({ topFactors: ["eu_id_verified", "limited_uk_presence"] }) },
    { profileId: profiles[3].id, overallScore: 42.5, riskCategory: "high", fraudProbability: 0.35, identityRisk: 0.28, financialRisk: 0.40, behavioralRisk: 0.32, complianceRisk: 0.38, riskFactors: JSON.stringify({ factors: ["incomplete_verification", "high_risk_nationality", "no_uk_credit_history", "pending_compliance"], notes: "Multiple risk indicators, pending verification" }), modelVersion: "v3.2.1", explainability: JSON.stringify({ topFactors: ["pending_compliance_checks", "high_risk_jurisdiction", "no_banking_verification"] }) },
    { profileId: profiles[4].id, overallScore: 74.0, riskCategory: "medium", fraudProbability: 0.10, identityRisk: 0.06, financialRisk: 0.12, behavioralRisk: 0.08, complianceRisk: 0.11, riskFactors: JSON.stringify({ factors: ["eu_national_post_brexit"], notes: "EU national with solid verification" }), modelVersion: "v3.2.1", explainability: JSON.stringify({ topFactors: ["national_id_verified", "passport_authentic"] }) },
    { profileId: profiles[5].id, overallScore: 15.8, riskCategory: "critical", fraudProbability: 0.78, identityRisk: 0.82, financialRisk: 0.65, behavioralRisk: 0.71, complianceRisk: 0.88, riskFactors: JSON.stringify({ factors: ["sanctions_potential_match", "failed_document_verification", "failed_liveness", "high_risk_jurisdiction", "no_consent"], notes: "Critical risk - potential sanctions match and failed verifications" }), modelVersion: "v3.2.1", explainability: JSON.stringify({ topFactors: ["sanctions_hit", "failed_liveness_check", "document_quality_failure"] }) },
    { profileId: profiles[6].id, overallScore: 97.5, riskCategory: "low", fraudProbability: 0.01, identityRisk: 0.01, financialRisk: 0.01, behavioralRisk: 0.01, complianceRisk: 0.01, riskFactors: JSON.stringify({ factors: [], notes: "Exemplary profile - government cleared, long UK history" }), modelVersion: "v3.2.1", explainability: JSON.stringify({ topFactors: ["dbs_enhanced_cleared", "government_verified", "very_long_history", "stable_financials"] }) },
    { profileId: profiles[7].id, overallScore: 8.2, riskCategory: "critical", fraudProbability: 0.85, identityRisk: 0.90, financialRisk: 0.78, behavioralRisk: 0.82, complianceRisk: 0.88, riskFactors: JSON.stringify({ factors: ["expired_document", "no_consent", "high_risk_jurisdiction", "rejected_status", "no_gdpr_compliance"], notes: "Rejected profile - expired documents, no consent" }), modelVersion: "v3.2.1", explainability: JSON.stringify({ topFactors: ["rejected_application", "expired_documents", "no_consent_given"] }) },
  ];

  const riskScores = await Promise.all(
    riskScoresData.map((r) => prisma.riskScore.create({ data: r }))
  );
  console.log(`Created ${riskScores.length} risk scores`);

  // ============================================
  // 7. FRAUD ALERTS (4)
  // ============================================
  const fraudAlertsData = [
    {
      alertType: "sanctions_match",
      severity: "critical",
      status: "investigating",
      description: "Potential sanctions list match detected for Oleksandr Kovalenko. EU Consolidated List hit with 65% match confidence. Requires immediate manual review.",
      evidenceRef: JSON.stringify({ profileId: profiles[5].id, checkId: "sanctions_check", matchDetails: { list: "EU_Consolidated", score: 0.65 } }),
      relatedProfileId: profiles[5].id,
      assignedTo: "Sarah Mitchell - Senior Compliance Officer",
      resolvedAt: null,
    },
    {
      alertType: "suspicious_behavior",
      severity: "high",
      status: "open",
      description: "Multiple failed verification attempts and potential document tampering detected for Amara Okafor. Document quality below threshold on resubmission.",
      evidenceRef: JSON.stringify({ profileId: profiles[3].id, verificationAttempts: 3, lastFailure: "document_quality" }),
      relatedProfileId: profiles[3].id,
      assignedTo: "David Chen - Compliance Analyst",
      resolvedAt: null,
    },
    {
      alertType: "document_fraud",
      severity: "high",
      status: "confirmed",
      description: "Chen Wei - expired passport submitted as valid document. Document was flagged as expired during verification. Profile has been rejected.",
      evidenceRef: JSON.stringify({ profileId: profiles[7].id, credentialId: "passport_credential", issue: "document_expired" }),
      relatedProfileId: profiles[7].id,
      assignedTo: "Sarah Mitchell - Senior Compliance Officer",
      resolvedAt: null,
    },
    {
      alertType: "identity_fraud",
      severity: "medium",
      status: "false_positive",
      description: "Initial facial recognition mismatch for Priya Sharma flagged as potential identity fraud. Upon manual review, mismatch attributed to photo age (5 years old). Cleared as false positive.",
      evidenceRef: JSON.stringify({ profileId: profiles[1].id, verificationId: "face_verification", mismatchScore: 0.72, resolution: "old_photo" }),
      relatedProfileId: profiles[1].id,
      assignedTo: "David Chen - Compliance Analyst",
      resolvedAt: new Date("2024-03-01"),
    },
  ];

  const fraudAlerts = await Promise.all(
    fraudAlertsData.map((f) => prisma.fraudAlert.create({ data: f }))
  );
  console.log(`Created ${fraudAlerts.length} fraud alerts`);

  // ============================================
  // 8. PROPERTIES (3)
  // ============================================
  const properties = await Promise.all([
    prisma.property.create({
      data: {
        address: "42 Kensington Gardens Square",
        city: "London",
        postcode: "W2 4BA",
        country: "GB",
        propertyType: "residential",
        bedrooms: 2,
        complianceStatus: "compliant",
        lastInspection: new Date("2024-02-15"),
      },
    }),
    prisma.property.create({
      data: {
        address: "18 The Broadway",
        city: "Manchester",
        postcode: "M1 1BT",
        country: "GB",
        propertyType: "hmo",
        bedrooms: 5,
        complianceStatus: "under_review",
        lastInspection: new Date("2023-11-20"),
      },
    }),
    prisma.property.create({
      data: {
        address: "7 Park Lane",
        city: "Birmingham",
        postcode: "B1 1HQ",
        country: "GB",
        propertyType: "residential",
        bedrooms: 3,
        complianceStatus: "pending",
        lastInspection: null,
      },
    }),
  ]);
  console.log(`Created ${properties.length} properties`);

  // ============================================
  // 9. PROPERTY APPLICATIONS (5)
  // ============================================
  const applicationsData = [
    { propertyId: properties[0].id, profileId: profiles[0].id, applicationType: "tenancy", status: "approved", complianceClear: true, riskClear: true, rightToRent: "verified", guarantorReplaced: false, depositAmount: 3000.00, monthlyAmount: 2200.00, startDate: new Date("2024-02-01"), endDate: new Date("2025-01-31"), submittedAt: new Date("2024-01-20"), decidedAt: new Date("2024-01-28") },
    { propertyId: properties[0].id, profileId: profiles[1].id, applicationType: "tenancy", status: "approved", complianceClear: true, riskClear: true, rightToRent: "verified", guarantorReplaced: true, depositAmount: 3600.00, monthlyAmount: 2200.00, startDate: new Date("2024-03-01"), endDate: new Date("2025-02-28"), submittedAt: new Date("2024-01-25"), decidedAt: new Date("2024-02-15") },
    { propertyId: properties[1].id, profileId: profiles[2].id, applicationType: "tenancy", status: "under_review", complianceClear: true, riskClear: false, rightToRent: "pending", guarantorReplaced: false, depositAmount: 1500.00, monthlyAmount: 950.00, startDate: null, endDate: null, submittedAt: new Date("2024-04-10"), decidedAt: null },
    { propertyId: properties[1].id, profileId: profiles[3].id, applicationType: "tenancy", status: "submitted", complianceClear: false, riskClear: false, rightToRent: "pending", guarantorReplaced: false, depositAmount: 1200.00, monthlyAmount: 850.00, startDate: null, endDate: null, submittedAt: new Date("2024-06-01"), decidedAt: null },
    { propertyId: properties[2].id, profileId: profiles[5].id, applicationType: "tenancy", status: "rejected", complianceClear: false, riskClear: false, rightToRent: "failed", guarantorReplaced: false, depositAmount: 1800.00, monthlyAmount: 1200.00, startDate: null, endDate: null, submittedAt: new Date("2024-06-10"), decidedAt: new Date("2024-06-17") },
  ];

  const applications = await Promise.all(
    applicationsData.map((a) => prisma.propertyApplication.create({ data: a }))
  );
  console.log(`Created ${applications.length} property applications`);

  // ============================================
  // 10. PARTNERS (4)
  // ============================================
  const partners = await Promise.all([
    prisma.partner.create({
      data: {
        name: "Barclays Bank PLC",
        partnerType: "bank",
        status: "active",
        apiEndpoint: "https://api.barclays.co.uk/openbanking/v3",
        integrationType: "api",
        trustRating: 95.0,
      },
    }),
    prisma.partner.create({
      data: {
        name: "AXA Insurance UK",
        partnerType: "insurer",
        status: "active",
        apiEndpoint: "https://partner.axa.co.uk/api/v2",
        integrationType: "api",
        trustRating: 88.5,
      },
    }),
    prisma.partner.create({
      data: {
        name: "Halifax Mortgage Services",
        partnerType: "mortgage_provider",
        status: "active",
        apiEndpoint: "https://api.halifax-mortgages.co.uk/v1",
        integrationType: "webhook",
        trustRating: 91.2,
      },
    }),
    prisma.partner.create({
      data: {
        name: "Wise (TransferWise)",
        partnerType: "remittance",
        status: "active",
        apiEndpoint: "https://api.wise.com/v2",
        integrationType: "api",
        trustRating: 87.0,
      },
    }),
  ]);
  console.log(`Created ${partners.length} partners`);

  // ============================================
  // 11. PARTNER REFERRALS (6)
  // ============================================
  const referralsData = [
    { partnerId: partners[0].id, profileId: profiles[0].id, referralType: "banking", status: "completed", referralData: JSON.stringify({ product: "Premier Current Account", referralCode: "BAR-PC-001" }) },
    { partnerId: partners[0].id, profileId: profiles[1].id, referralType: "banking", status: "accepted", referralData: JSON.stringify({ product: "International Account", referralCode: "BAR-IA-002" }) },
    { partnerId: partners[1].id, profileId: profiles[1].id, referralType: "insurance", status: "pending", referralData: JSON.stringify({ product: "Tenant Insurance", referralCode: "AXA-TI-001" }) },
    { partnerId: partners[2].id, profileId: profiles[6].id, referralType: "mortgage", status: "completed", referralData: JSON.stringify({ product: "Retirement Interest-Only Mortgage", referralCode: "HAL-RIO-001" }) },
    { partnerId: partners[3].id, profileId: profiles[1].id, referralType: "remittance", status: "sent", referralData: JSON.stringify({ product: "International Transfer", destinationCountry: "IN", referralCode: "WISE-IT-001" }) },
    { partnerId: partners[1].id, profileId: profiles[0].id, referralType: "insurance", status: "completed", referralData: JSON.stringify({ product: "Home Insurance", referralCode: "AXA-HI-001" }) },
  ];

  const referrals = await Promise.all(
    referralsData.map((r) => prisma.partnerReferral.create({ data: r }))
  );
  console.log(`Created ${referrals.length} partner referrals`);

  // ============================================
  // 12. AUDIT LOGS (20+)
  // ============================================
  const auditLogsData = [
    { profileId: profiles[0].id, action: "PROFILE_CREATED", performedBy: "system", resource: "IdentityProfile", resourceId: profiles[0].id, details: JSON.stringify({ source: "self_registration" }), ipAddress: "81.132.214.37", timestamp: new Date("2024-01-15T09:30:00Z") },
    { profileId: profiles[0].id, action: "DOCUMENT_UPLOADED", performedBy: "j.wellington@outlook.com", resource: "IdentityCredential", resourceId: "cred_passport_1", details: JSON.stringify({ type: "passport", country: "GB" }), ipAddress: "81.132.214.37", timestamp: new Date("2024-01-15T09:35:00Z") },
    { profileId: profiles[0].id, action: "VERIFICATION_PASSED", performedBy: "Onfido", resource: "VerificationRecord", resourceId: "ver_doc_1", details: JSON.stringify({ type: "document", confidence: 0.99 }), ipAddress: null, timestamp: new Date("2024-01-20T14:22:00Z") },
    { profileId: profiles[0].id, action: "COMPLIANCE_CHECK_PASSED", performedBy: "system", resource: "ComplianceCheck", resourceId: "comp_aml_1", details: JSON.stringify({ type: "aml", riskRating: "low" }), ipAddress: null, timestamp: new Date("2024-01-20T14:25:00Z") },
    { profileId: profiles[0].id, action: "TRUST_LEVEL_UPGRADED", performedBy: "system", resource: "IdentityProfile", resourceId: profiles[0].id, details: JSON.stringify({ from: 4, to: 5, reason: "All verifications passed" }), ipAddress: null, timestamp: new Date("2024-03-05T11:00:00Z") },
    { profileId: profiles[0].id, action: "OPEN_BANKING_CONNECTED", performedBy: "system", resource: "IdentityCredential", resourceId: "cred_banking_1", details: JSON.stringify({ provider: "Barclays" }), ipAddress: "81.132.214.37", timestamp: new Date("2024-01-22T10:15:00Z") },
    { profileId: profiles[1].id, action: "PROFILE_CREATED", performedBy: "system", resource: "IdentityProfile", resourceId: profiles[1].id, details: JSON.stringify({ source: "self_registration" }), ipAddress: "86.154.22.11", timestamp: new Date("2024-01-10T08:00:00Z") },
    { profileId: profiles[1].id, action: "VISA_VERIFIED", performedBy: "Home Office", resource: "IdentityCredential", resourceId: "cred_visa_1", details: JSON.stringify({ type: "Tier 2 General", validUntil: "2026-01-01" }), ipAddress: null, timestamp: new Date("2024-01-18T16:30:00Z") },
    { profileId: profiles[1].id, action: "GUARANTOR_REPLACED", performedBy: "compliance_team", resource: "PropertyApplication", resourceId: "app_2", details: JSON.stringify({ reason: "trust_score_sufficient", previousGuarantor: "external" }), ipAddress: null, timestamp: new Date("2024-02-10T09:00:00Z") },
    { profileId: profiles[3].id, action: "PROFILE_CREATED", performedBy: "system", resource: "IdentityProfile", resourceId: profiles[3].id, details: JSON.stringify({ source: "agent_referral" }), ipAddress: "92.23.67.89", timestamp: new Date("2024-05-28T14:20:00Z") },
    { profileId: profiles[3].id, action: "VERIFICATION_FAILED", performedBy: "Onfido", resource: "VerificationRecord", resourceId: "ver_doc_4", details: JSON.stringify({ type: "document", reason: "image_quality" }), ipAddress: null, timestamp: new Date("2024-06-01T11:45:00Z") },
    { profileId: profiles[5].id, action: "PROFILE_CREATED", performedBy: "system", resource: "IdentityProfile", resourceId: profiles[5].id, details: JSON.stringify({ source: "self_registration" }), ipAddress: "178.93.44.22", timestamp: new Date("2024-06-10T07:30:00Z") },
    { profileId: profiles[5].id, action: "SANCTIONS_HIT", performedBy: "ComplyAdvantage", resource: "ComplianceCheck", resourceId: "comp_sanctions_6", details: JSON.stringify({ list: "EU_Consolidated", matchStrength: 0.65 }), ipAddress: null, timestamp: new Date("2024-06-15T13:00:00Z") },
    { profileId: profiles[5].id, action: "FRAUD_ALERT_CREATED", performedBy: "system", resource: "FraudAlert", resourceId: "alert_1", details: JSON.stringify({ severity: "critical", type: "sanctions_match" }), ipAddress: null, timestamp: new Date("2024-06-15T13:05:00Z") },
    { profileId: profiles[6].id, action: "PROFILE_CREATED", performedBy: "system", resource: "IdentityProfile", resourceId: profiles[6].id, details: JSON.stringify({ source: "self_registration" }), ipAddress: "82.132.1.55", timestamp: new Date("2024-01-02T10:00:00Z") },
    { profileId: profiles[6].id, action: "GOVERNMENT_VERIFICATION", performedBy: "GOV.UK Verify", resource: "VerificationRecord", resourceId: "ver_gov_1", details: JSON.stringify({ service: "dbs_check", level: "enhanced" }), ipAddress: null, timestamp: new Date("2024-01-06T15:00:00Z") },
    { profileId: profiles[7].id, action: "PROFILE_CREATED", performedBy: "system", resource: "IdentityProfile", resourceId: profiles[7].id, details: JSON.stringify({ source: "self_registration" }), ipAddress: "220.181.38.148", timestamp: new Date("2024-05-15T06:00:00Z") },
    { profileId: profiles[7].id, action: "DOCUMENT_EXPIRED", performedBy: "system", resource: "IdentityCredential", resourceId: "cred_passport_8", details: JSON.stringify({ type: "passport", expiredDate: "2022-03-01" }), ipAddress: null, timestamp: new Date("2024-05-15T06:05:00Z") },
    { profileId: profiles[7].id, action: "PROFILE_REJECTED", performedBy: "senior_compliance", resource: "IdentityProfile", resourceId: profiles[7].id, details: JSON.stringify({ reason: "expired_documents_no_consent" }), ipAddress: null, timestamp: new Date("2024-05-20T14:00:00Z") },
    { profileId: null, action: "SYSTEM_CONFIG_UPDATED", performedBy: "admin", resource: "PlatformConfig", resourceId: "config_risk_threshold", details: JSON.stringify({ key: "risk_threshold_high", oldValue: "40", newValue: "35" }), ipAddress: "10.0.0.1", timestamp: new Date("2024-04-01T08:00:00Z") },
    { profileId: null, action: "COMPLIANCE_REPORT_GENERATED", performedBy: "system", resource: "Report", resourceId: "report_q1_2024", details: JSON.stringify({ period: "Q1 2024", type: "quarterly_compliance" }), ipAddress: null, timestamp: new Date("2024-04-05T00:00:00Z") },
    { profileId: profiles[2].id, action: "RIGHT_TO_RENT_CHECK_INITIATED", performedBy: "system", resource: "ComplianceCheck", resourceId: "comp_r2r_3", details: JSON.stringify({ nationality: "DE", euSettlement: "pending" }), ipAddress: null, timestamp: new Date("2024-04-10T09:30:00Z") },
  ];

  const auditLogs = await Promise.all(
    auditLogsData.map((a) => prisma.auditLog.create({ data: a }))
  );
  console.log(`Created ${auditLogs.length} audit logs`);

  // ============================================
  // 13. CONSENT RECORDS (5)
  // ============================================
  const consentData = [
    { profileId: profiles[0].id, consentType: "data_processing", granted: true, purpose: "Identity verification and compliance checks", legalBasis: "contract", expiresAt: new Date("2025-01-15") },
    { profileId: profiles[0].id, consentType: "third_party_sharing", granted: true, purpose: "Share verification results with property partners", legalBasis: "consent", expiresAt: new Date("2025-01-15") },
    { profileId: profiles[1].id, consentType: "data_processing", granted: true, purpose: "Identity verification and compliance checks", legalBasis: "contract", expiresAt: new Date("2025-01-10") },
    { profileId: profiles[1].id, consentType: "automated_decisions", granted: true, purpose: "Automated trust scoring and risk assessment", legalBasis: "consent", expiresAt: new Date("2025-01-10") },
    { profileId: profiles[3].id, consentType: "data_processing", granted: true, purpose: "Identity verification and compliance checks", legalBasis: "contract", withdrawnAt: new Date("2024-06-05"), expiresAt: new Date("2025-05-28") },
  ];

  const consentRecords = await Promise.all(
    consentData.map((c) => prisma.consentRecord.create({ data: c }))
  );
  console.log(`Created ${consentRecords.length} consent records`);

  // ============================================
  // 14. PLATFORM CONFIG (3)
  // ============================================
  const configData = [
    { key: "risk_threshold_high", value: "35", description: "Risk score threshold for high risk category (0-100 scale, below = high risk)" },
    { key: "trust_level_requirements", value: JSON.stringify({ 1: ["document"], 2: ["document", "biometric"], 3: ["document", "biometric", "banking"], 4: ["document", "biometric", "banking", "employer"], 5: ["document", "biometric", "banking", "employer", "government"] }), description: "Required credential types for each trust level" },
    { key: "compliance_check_schedule", value: JSON.stringify({ aml: "12m", kyc: "12m", cdd: "12m", edd: "6m", sanctions: "daily", pep: "6m", adverse_media: "6m", right_to_rent: "12m" }), description: "Re-check intervals for compliance checks (in months)" },
  ];

  const configs = await Promise.all(
    configData.map((c) => prisma.platformConfig.create({ data: c }))
  );
  console.log(`Created ${configs.length} platform config entries`);

  // ============================================
  // 14. USERS (7 — one per persona)
  // ============================================
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@propcomply.ai",
        name: "Sarah Mitchell",
        passwordHash: "Admin@2024",
        role: "platform_admin",
        avatar: "SM",
        department: "Engineering",
        jobTitle: "Platform Administrator",
        phone: "+44 7700 100001",
        mfaEnabled: true,
        isActive: true,
        lastLoginAt: new Date("2024-06-20T09:30:00Z"),
      },
    }),
    prisma.user.create({
      data: {
        email: "compliance@propcomply.ai",
        name: "David Chen",
        passwordHash: "Compliance@2024",
        role: "compliance_officer",
        avatar: "DC",
        department: "Compliance",
        jobTitle: "Senior Compliance Officer",
        phone: "+44 7700 100002",
        mfaEnabled: true,
        isActive: true,
        lastLoginAt: new Date("2024-06-20T10:15:00Z"),
      },
    }),
    prisma.user.create({
      data: {
        email: "property@propcomply.ai",
        name: "Emma Roberts",
        passwordHash: "Property@2024",
        role: "property_manager",
        avatar: "ER",
        department: "Property Operations",
        jobTitle: "Letting Agent & Property Manager",
        phone: "+44 7700 100003",
        mfaEnabled: false,
        isActive: true,
        lastLoginAt: new Date("2024-06-19T14:45:00Z"),
      },
    }),
    prisma.user.create({
      data: {
        email: "identity@propcomply.ai",
        name: "Alex Thompson",
        passwordHash: "Identity@2024",
        role: "identity_verifier",
        avatar: "AT",
        department: "Identity Operations",
        jobTitle: "Identity Verification Specialist",
        phone: "+44 7700 100004",
        mfaEnabled: true,
        isActive: true,
        lastLoginAt: new Date("2024-06-20T08:00:00Z"),
      },
    }),
    prisma.user.create({
      data: {
        email: "risk@propcomply.ai",
        name: "Michael Brown",
        passwordHash: "Risk@2024",
        role: "risk_analyst",
        avatar: "MB",
        department: "Risk & Analytics",
        jobTitle: "Senior Risk Analyst",
        phone: "+44 7700 100005",
        mfaEnabled: false,
        isActive: true,
        lastLoginAt: new Date("2024-06-20T11:20:00Z"),
      },
    }),
    prisma.user.create({
      data: {
        email: "partner@barclays.ai",
        name: "Rachel Green",
        passwordHash: "Partner@2024",
        role: "partner_user",
        avatar: "RG",
        department: "Partner Relations",
        jobTitle: "Partner Integration Manager",
        phone: "+44 7700 100006",
        mfaEnabled: false,
        isActive: true,
        lastLoginAt: new Date("2024-06-18T16:30:00Z"),
      },
    }),
    prisma.user.create({
      data: {
        email: "tenant@example.com",
        name: "James Wellington",
        passwordHash: "Tenant@2024",
        role: "tenant",
        avatar: "JW",
        department: "Self-Service",
        jobTitle: "Tenant / Applicant",
        phone: "+44 7700 900123",
        mfaEnabled: false,
        isActive: true,
        lastLoginAt: new Date("2024-06-17T12:00:00Z"),
      },
    }),
  ]);

  console.log(`Created ${users.length} users`);

  // ============================================
  // 15. NOTIFICATIONS (10+)
  // ============================================
  const notificationsData = [
    { userId: users[0].id, title: "System Alert", message: "Platform maintenance scheduled for tonight 02:00-04:00 GMT", type: "warning", category: "system", read: false },
    { userId: users[0].id, title: "New User Registered", message: "A new partner user account is pending activation", type: "info", category: "system", read: false },
    { userId: users[0].id, title: "Audit Report Ready", message: "Monthly compliance audit report for May 2024 is ready for review", type: "success", category: "compliance", read: false },
    { userId: users[1].id, title: "Critical Sanctions Match", message: "Oleksandr Kovalenko flagged with EU Consolidated List hit at 65% confidence", type: "error", category: "risk", read: false },
    { userId: users[1].id, title: "EDD Review Required", message: "Priya Sharma EDD check requires senior compliance officer review", type: "warning", category: "compliance", read: true },
    { userId: users[1].id, title: "AML Check Completed", message: "James Wellington AML screening completed — all clear", type: "success", category: "compliance", read: true },
    { userId: users[2].id, title: "New Application Submitted", message: "Amara Okafor submitted a tenancy application for 18 The Broadway, Manchester", type: "info", category: "property", read: false },
    { userId: users[2].id, title: "Right to Rent Expired", message: "Hans Müller Right to Rent check requires renewal", type: "warning", category: "property", read: false },
    { userId: users[4].id, title: "Fraud Alert Escalated", message: "Chen Wei document fraud alert confirmed — profile rejected", type: "error", category: "risk", read: false },
    { userId: users[5].id, title: "Referral Accepted", message: "Priya Sharma accepted the Barclays International Account referral", type: "success", category: "partner", read: true },
    { userId: users[5].id, title: "New Referral Opportunity", message: "James Wellington eligible for AXA Home Insurance referral", type: "info", category: "partner", read: false },
    { userId: users[6].id, title: "Application Approved", message: "Your tenancy application for 42 Kensington Gardens Square has been approved!", type: "success", category: "property", read: true },
    { userId: users[6].id, title: "Verification Request", message: "Please upload a recent utility bill to complete your identity verification", type: "info", category: "identity", read: false },
  ];

  const notifications = await Promise.all(
    notificationsData.map((n) => prisma.notification.create({ data: n }))
  );
  console.log(`Created ${notifications.length} notifications`);

  console.log("\n========================================");
  console.log("Seed completed successfully!");
  console.log("========================================");
  console.log(`  Users:                ${users.length}`);
  console.log(`  Notifications:        ${notifications.length}`);
  console.log(`  Identity Profiles:    ${profiles.length}`);
  console.log(`  Identity Credentials: ${credentials.length}`);
  console.log(`  Identity Evidence:    ${evidence.length}`);
  console.log(`  Verification Records: ${verifications.length}`);
  console.log(`  Compliance Checks:    ${complianceChecks.length}`);
  console.log(`  Risk Scores:          ${riskScores.length}`);
  console.log(`  Fraud Alerts:         ${fraudAlerts.length}`);
  console.log(`  Properties:           ${properties.length}`);
  console.log(`  Property Applications:${applications.length}`);
  console.log(`  Partners:             ${partners.length}`);
  console.log(`  Partner Referrals:    ${referrals.length}`);
  console.log(`  Audit Logs:           ${auditLogs.length}`);
  console.log(`  Consent Records:      ${consentRecords.length}`);
  console.log(`  Platform Configs:     ${configs.length}`);
  console.log("========================================");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
