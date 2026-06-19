import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(password: string) {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log("Seeding database...");

  // Clean in dependency order (new models first)
  await prisma.sAR.deleteMany();
  await prisma.caseAction.deleteMany();
  await prisma.case.deleteMany();
  await prisma.uBO.deleteMany();
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
  await prisma.firm.deleteMany();

  // ============================================
  // 0. FIRM (multi-tenant)
  // ============================================
  const firm = await prisma.firm.create({
    data: {
      name: "PropComply Demo Agency Ltd",
      registrationNumber: "12345678",
      firmType: "estate_agency",
      riskAppetite: "standard",
      hmrcRegistration: "XAML00000100001",
      amlPolicyVersion: "v3.1",
      isActive: true,
    },
  });
  console.log(`Created firm: ${firm.name}`);

  // ============================================
  // 1. USERS (9 — including MLRO)
  // ============================================
  const [adminPwd, mlroPwd, compliancePwd, propertyPwd, identityPwd, riskPwd, partnerMgrPwd, partnerPwd, tenantPwd] =
    await Promise.all([
      hash("Admin@2024"),
      hash("MLRO@2024"),
      hash("Compliance@2024"),
      hash("Property@2024"),
      hash("Identity@2024"),
      hash("Risk@2024"),
      hash("PartnerMgr@2024"),
      hash("Partner@2024"),
      hash("Tenant@2024"),
    ]);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@propcomply.ai",
        name: "Sarah Mitchell",
        passwordHash: adminPwd,
        role: "platform_admin",
        firmId: firm.id,
        avatar: "SM",
        department: "Engineering",
        jobTitle: "Platform Administrator",
        phone: "+44 7700 100001",
        mfaEnabled: true,
        isActive: true,
        lastLoginAt: new Date("2024-06-20T09:30:00Z"),
      },
    }),
    // MLRO — designated Money Laundering Reporting Officer (MLR 2017 Reg 21)
    prisma.user.create({
      data: {
        email: "mlro@propcomply.ai",
        name: "Dr. Patricia Okonkwo",
        passwordHash: mlroPwd,
        role: "mlro",
        firmId: firm.id,
        avatar: "PO",
        department: "Compliance",
        jobTitle: "Money Laundering Reporting Officer (MLRO)",
        phone: "+44 7700 100009",
        mfaEnabled: true,
        isActive: true,
        lastLoginAt: new Date("2024-06-20T08:00:00Z"),
      },
    }),
    prisma.user.create({
      data: {
        email: "compliance@propcomply.ai",
        name: "David Chen",
        passwordHash: compliancePwd,
        role: "compliance_officer",
        firmId: firm.id,
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
        passwordHash: propertyPwd,
        role: "property_manager",
        firmId: firm.id,
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
        passwordHash: identityPwd,
        role: "identity_verifier",
        firmId: firm.id,
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
        passwordHash: riskPwd,
        role: "risk_analyst",
        firmId: firm.id,
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
        email: "partner-mgr@propcomply.ai",
        name: "Rachel Green",
        passwordHash: partnerMgrPwd,
        role: "partner_integration_manager",
        firmId: firm.id,
        avatar: "RG",
        department: "Partner Operations",
        jobTitle: "Partner Integration Manager",
        phone: "+44 7700 100006",
        mfaEnabled: false,
        isActive: true,
        lastLoginAt: new Date("2024-06-18T16:30:00Z"),
      },
    }),
    prisma.user.create({
      data: {
        email: "partner@barclays.ai",
        name: "Tom Henderson",
        passwordHash: partnerPwd,
        role: "partner_user",
        avatar: "TH",
        department: "Partner Relations",
        jobTitle: "External Partner (Barclays)",
        phone: "+44 7700 100007",
        mfaEnabled: false,
        isActive: true,
        lastLoginAt: new Date("2024-06-18T14:00:00Z"),
      },
    }),
    prisma.user.create({
      data: {
        email: "tenant@example.com",
        name: "James Wellington",
        passwordHash: tenantPwd,
        role: "tenant",
        firmId: firm.id,
        avatar: "JW",
        department: "Self-Service",
        jobTitle: "Tenant / Applicant",
        phone: "+44 7700 900123",
        mfaEnabled: false,
        isActive: true,
        lastLoginAt: new Date("2024-06-17T12:00:00Z"),
      },
    }),
    prisma.user.create({
      data: {
        email: "applicant@example.com",
        name: "Daniel Osei",
        passwordHash: tenantPwd,
        role: "tenant",
        firmId: firm.id,
        avatar: "DO",
        department: "Self-Service",
        jobTitle: "Prospective Tenant",
        phone: "+44 7700 900456",
        mfaEnabled: false,
        isActive: true,
        lastLoginAt: new Date("2024-06-18T09:00:00Z"),
      },
    }),
    // First-time applicant — NO identity profile yet, so they see the
    // "Start Onboarding" experience and build their profile from scratch.
    prisma.user.create({
      data: {
        email: "newtenant@example.com",
        name: "Olivia Bennett",
        passwordHash: tenantPwd,
        role: "tenant",
        firmId: firm.id,
        avatar: "OB",
        department: "Self-Service",
        jobTitle: "Prospective Tenant",
        phone: "+44 7700 900789",
        mfaEnabled: false,
        isActive: true,
      },
    }),
  ]);

  // Set MLRO on the firm
  await prisma.firm.update({
    where: { id: firm.id },
    data: { mlroId: users[1].id },
  });

  const [adminUser, mlroUser, complianceUser, propertyUser, identityUser, riskUser, partnerMgrUser, partnerUser, tenantUser, applicantUser] = users;
  console.log(`Created ${users.length} users (including MLRO)`);

  // ============================================
  // 2. IDENTITY PROFILES (8)
  // ============================================
  const profiles = await Promise.all([
    prisma.identityProfile.create({
      data: {
        firstName: "James", lastName: "Wellington",
        email: "j.wellington@outlook.com", phone: "+44 7700 900123",
        dateOfBirth: new Date("1985-03-15"), nationality: "GB",
        trustLevel: 5, trustScore: 94.7, status: "verified",
        consentGiven: true, gdprCompliant: true, userId: tenantUser.id,
      },
    }),
    prisma.identityProfile.create({
      data: {
        firstName: "Priya", lastName: "Sharma",
        email: "priya.sharma@gmail.com", phone: "+44 7911 123456",
        dateOfBirth: new Date("1992-07-22"), nationality: "IN",
        trustLevel: 4, trustScore: 82.3, status: "verified",
        consentGiven: true, gdprCompliant: true,
      },
    }),
    prisma.identityProfile.create({
      data: {
        firstName: "Hans", lastName: "Müller",
        email: "hans.mueller@web.de", phone: "+49 151 2345678",
        dateOfBirth: new Date("1978-11-08"), nationality: "DE",
        trustLevel: 3, trustScore: 68.5, status: "verified",
        consentGiven: true, gdprCompliant: true,
      },
    }),
    prisma.identityProfile.create({
      data: {
        firstName: "Amara", lastName: "Okafor",
        email: "amara.okafor@yahoo.co.uk", phone: "+44 7700 456789",
        dateOfBirth: new Date("1995-01-30"), nationality: "NG",
        trustLevel: 2, trustScore: 45.2, status: "pending",
        consentGiven: true, gdprCompliant: false,
      },
    }),
    prisma.identityProfile.create({
      data: {
        firstName: "Sofia", lastName: "Rossi",
        email: "sofia.rossi@libero.it", phone: "+39 333 9876543",
        dateOfBirth: new Date("1988-06-14"), nationality: "IT",
        trustLevel: 3, trustScore: 71.0, status: "verified",
        consentGiven: true, gdprCompliant: true,
      },
    }),
    prisma.identityProfile.create({
      data: {
        firstName: "Oleksandr", lastName: "Kovalenko",
        email: "o.kovalenko@ukr.net", phone: "+380 50 1112233",
        dateOfBirth: new Date("1990-09-25"), nationality: "UA",
        trustLevel: 1, trustScore: 28.4, status: "pending",
        consentGiven: false, gdprCompliant: false,
      },
    }),
    prisma.identityProfile.create({
      data: {
        firstName: "Margaret", lastName: "Thompson",
        email: "margaret.t@hotmail.co.uk", phone: "+44 7700 654321",
        dateOfBirth: new Date("1952-12-03"), nationality: "GB",
        trustLevel: 5, trustScore: 97.1, status: "verified",
        consentGiven: true, gdprCompliant: true,
      },
    }),
    prisma.identityProfile.create({
      data: {
        firstName: "Chen", lastName: "Wei",
        email: "chen.wei@163.com", phone: "+86 139 8765 4321",
        dateOfBirth: new Date("1993-04-18"), nationality: "CN",
        trustLevel: 0, trustScore: 12.6, status: "rejected",
        consentGiven: false, gdprCompliant: false,
      },
    }),
    // Daniel Osei — linked to the applicant@example.com tenant login.
    // Starts in_progress with outstanding checks so a reviewer can Approve him
    // and watch the result appear on his own "My Profile" view.
    prisma.identityProfile.create({
      data: {
        firstName: "Daniel", lastName: "Osei",
        email: "applicant@example.com", phone: "+44 7700 900456",
        dateOfBirth: new Date("1991-08-12"), nationality: "GB",
        trustLevel: 2, trustScore: 52.0, status: "in_progress",
        consentGiven: true, gdprCompliant: true, userId: applicantUser.id,
      },
    }),
  ]);
  console.log(`Created ${profiles.length} identity profiles`);

  // ============================================
  // 3. UBOs (corporate client example)
  // ============================================
  const [jamesProfile, priyaProfile, hansProfile, amaraProfile, sofiaProfile, oleksandrProfile, margaretProfile, chenProfile, danielProfile] = profiles;

  // ============================================
  // 2b. VERIFICATION RECORDS (Trust Ladder checks)
  // Pending/in_progress checks drive the verifier's "Pending Reviews" + Approve buttons.
  // ============================================
  await prisma.verificationRecord.createMany({
    data: [
      // Daniel Osei (in_progress) — two checks done, three outstanding -> awaiting reviewer approval
      { profileId: danielProfile.id, verificationType: "document", status: "passed", provider: "Onfido", confidence: 96, completedAt: new Date("2024-06-17T10:00:00Z") },
      { profileId: danielProfile.id, verificationType: "biometric_face", status: "verified", provider: "iProov", confidence: 92, completedAt: new Date("2024-06-17T10:05:00Z") },
      { profileId: danielProfile.id, verificationType: "liveness", status: "in_progress", provider: "iProov", confidence: 0 },
      { profileId: danielProfile.id, verificationType: "open_banking", status: "pending", provider: "TrueLayer", confidence: 0 },
      { profileId: danielProfile.id, verificationType: "income", status: "pending", provider: "TrueLayer", confidence: 0 },
      // Amara Okafor (pending) — also surfaces in Pending Reviews
      { profileId: amaraProfile.id, verificationType: "document", status: "in_progress", provider: "Onfido", confidence: 40 },
      { profileId: amaraProfile.id, verificationType: "biometric_face", status: "pending", provider: "iProov", confidence: 0 },
      // James Wellington (verified) — completed history shown on his My Profile
      { profileId: jamesProfile.id, verificationType: "document", status: "verified", provider: "Onfido", confidence: 99, completedAt: new Date("2024-01-20T09:00:00Z") },
      { profileId: jamesProfile.id, verificationType: "biometric_face", status: "verified", provider: "iProov", confidence: 97, completedAt: new Date("2024-02-10T09:00:00Z") },
      { profileId: jamesProfile.id, verificationType: "open_banking", status: "verified", provider: "Barclays", confidence: 95, completedAt: new Date("2024-01-22T09:00:00Z") },
      // Priya Sharma (verified)
      { profileId: priyaProfile.id, verificationType: "document", status: "verified", provider: "Onfido", confidence: 94, completedAt: new Date("2024-01-15T09:00:00Z") },
      { profileId: priyaProfile.id, verificationType: "biometric_face", status: "verified", provider: "iProov", confidence: 90, completedAt: new Date("2024-01-16T09:00:00Z") },
    ],
  });
  console.log("Created identity verification records");

  await prisma.uBO.create({
    data: {
      profileId: jamesProfile.id,
      name: "James Wellington",
      dateOfBirth: new Date("1985-03-15"),
      nationality: "GB",
      ownershipPercentage: 75.0,
      controlType: "shares",
      isPEP: false,
      isSanctioned: false,
      verificationStatus: "verified",
    },
  });
  console.log("Created 1 UBO record");

  // ============================================
  // 4. IDENTITY CREDENTIALS
  // ============================================
  const credentialsData = [
    { profileId: jamesProfile.id, credentialType: "passport", credentialValue: "GB-PP-53219014", trustLevel: 3, issuingCountry: "GB", issuingAuthority: "HM Passport Office", validFrom: new Date("2020-01-15"), validTo: new Date("2030-01-15"), verificationStatus: "verified", verifiedAt: new Date("2024-01-20") },
    { profileId: jamesProfile.id, credentialType: "biometric", credentialValue: "BIO-FACE-GB-78234", trustLevel: 4, issuingCountry: "GB", issuingAuthority: "UK Visas and Immigration", validFrom: new Date("2023-06-01"), validTo: new Date("2028-06-01"), verificationStatus: "verified", verifiedAt: new Date("2024-02-10") },
    { profileId: jamesProfile.id, credentialType: "banking", credentialValue: "OB-ACC-TOKEN-7821", trustLevel: 5, issuingCountry: "GB", issuingAuthority: "Barclays Bank", validFrom: new Date("2015-03-20"), validTo: null, verificationStatus: "verified", verifiedAt: new Date("2024-01-22") },
    { profileId: priyaProfile.id, credentialType: "passport", credentialValue: "IN-PP-K8321456", trustLevel: 3, issuingCountry: "IN", issuingAuthority: "Passport Seva", validFrom: new Date("2019-05-10"), validTo: new Date("2029-05-10"), verificationStatus: "verified", verifiedAt: new Date("2024-01-15") },
    { profileId: priyaProfile.id, credentialType: "visa", credentialValue: "GB-VISA-T2-901234", trustLevel: 2, issuingCountry: "GB", issuingAuthority: "Home Office", validFrom: new Date("2023-01-01"), validTo: new Date("2026-01-01"), verificationStatus: "verified", verifiedAt: new Date("2024-01-18") },
    { profileId: hansProfile.id, credentialType: "national_id", credentialValue: "DE-NID-T220001293", trustLevel: 3, issuingCountry: "DE", issuingAuthority: "Bundesdruckerei", validFrom: new Date("2018-06-01"), validTo: new Date("2028-06-01"), verificationStatus: "verified", verifiedAt: new Date("2024-04-02") },
    { profileId: amaraProfile.id, credentialType: "passport", credentialValue: "NG-PP-A8765432", trustLevel: 3, issuingCountry: "NG", issuingAuthority: "Nigeria Immigration Service", validFrom: new Date("2022-01-10"), validTo: new Date("2032-01-10"), verificationStatus: "pending", verifiedAt: null },
    { profileId: oleksandrProfile.id, credentialType: "passport", credentialValue: "UA-PP-FO123456", trustLevel: 3, issuingCountry: "UA", issuingAuthority: "SMS of Ukraine", validFrom: new Date("2021-04-01"), validTo: new Date("2031-04-01"), verificationStatus: "failed", verifiedAt: null },
    { profileId: margaretProfile.id, credentialType: "passport", credentialValue: "GB-PP-87654321", trustLevel: 3, issuingCountry: "GB", issuingAuthority: "HM Passport Office", validFrom: new Date("2019-08-01"), validTo: new Date("2029-08-01"), verificationStatus: "verified", verifiedAt: new Date("2024-01-05") },
    { profileId: chenProfile.id, credentialType: "passport", credentialValue: "CN-PP-E12345678", trustLevel: 3, issuingCountry: "CN", issuingAuthority: "Exit-Entry Administration", validFrom: new Date("2022-03-01"), validTo: new Date("2032-03-01"), verificationStatus: "expired", verifiedAt: null },
  ];
  const credentials = await Promise.all(credentialsData.map(c => prisma.identityCredential.create({ data: c })));
  console.log(`Created ${credentials.length} credentials`);

  // ============================================
  // 5. COMPLIANCE CHECKS
  // ============================================
  const complianceData = [
    { profileId: jamesProfile.id, checkType: "aml", status: "passed", riskRating: "low", checkProvider: "ComplyAdvantage", results: JSON.stringify({ pepMatch: false, sanctionsMatch: false }), reviewedBy: "system", reviewedAt: new Date("2024-01-20"), expiresAt: new Date("2025-01-20") },
    { profileId: jamesProfile.id, checkType: "kyc", status: "passed", riskRating: "low", checkProvider: "Onfido", results: JSON.stringify({ identityVerified: true }), reviewedBy: "system", reviewedAt: new Date("2024-01-20"), expiresAt: new Date("2025-01-20") },
    { profileId: jamesProfile.id, checkType: "right_to_rent", status: "passed", riskRating: "low", checkProvider: "Home Office", results: JSON.stringify({ shareCode: "R2R-ABC123", valid: true }), reviewedBy: "system", reviewedAt: new Date("2024-01-22"), expiresAt: new Date("2025-01-22") },
    { profileId: priyaProfile.id, checkType: "aml", status: "passed", riskRating: "low", checkProvider: "ComplyAdvantage", results: JSON.stringify({ pepMatch: false, sanctionsMatch: false }), reviewedBy: "system", reviewedAt: new Date("2024-01-15"), expiresAt: new Date("2025-01-15") },
    { profileId: priyaProfile.id, checkType: "edd", status: "passed", riskRating: "medium", checkProvider: "Internal", results: JSON.stringify({ sourceOfFunds: "employment", verified: true }), reviewedBy: mlroUser.id, reviewedAt: new Date("2024-01-18"), expiresAt: new Date("2025-01-18") },
    { profileId: amaraProfile.id, checkType: "aml", status: "in_progress", riskRating: "medium", checkProvider: "ComplyAdvantage", results: null, reviewedBy: null, reviewedAt: null, expiresAt: null },
    { profileId: oleksandrProfile.id, checkType: "sanctions", status: "escalated", riskRating: "critical", checkProvider: "ComplyAdvantage", results: JSON.stringify({ listsChecked: ["EU", "HMT", "UN"], hits: 1 }), reviewedBy: complianceUser.id, reviewedAt: new Date("2024-06-16"), expiresAt: null },
    { profileId: margaretProfile.id, checkType: "aml", status: "passed", riskRating: "low", checkProvider: "ComplyAdvantage", results: JSON.stringify({ pepMatch: false, sanctionsMatch: false }), reviewedBy: "system", reviewedAt: new Date("2024-01-05"), expiresAt: new Date("2025-01-05") },
  ];
  const complianceChecks = await Promise.all(complianceData.map(c => prisma.complianceCheck.create({ data: c })));
  console.log(`Created ${complianceChecks.length} compliance checks`);

  // ============================================
  // 6. RISK SCORES
  // ============================================
  const riskScoresData = [
    { profileId: jamesProfile.id, overallScore: 94.7, riskCategory: "low", fraudProbability: 0.02, identityRisk: 0.01, financialRisk: 0.03, behavioralRisk: 0.02, complianceRisk: 0.02, propertyRisk: 0.05, epcRating: "C", modelVersion: "v3.2.1" },
    { profileId: priyaProfile.id, overallScore: 78.3, riskCategory: "low", fraudProbability: 0.08, identityRisk: 0.05, financialRisk: 0.08, behavioralRisk: 0.06, complianceRisk: 0.10, propertyRisk: 0.10, modelVersion: "v3.2.1" },
    { profileId: hansProfile.id, overallScore: 72.0, riskCategory: "medium", fraudProbability: 0.12, identityRisk: 0.08, financialRisk: 0.15, behavioralRisk: 0.10, complianceRisk: 0.12, propertyRisk: 0.12, modelVersion: "v3.2.1" },
    { profileId: amaraProfile.id, overallScore: 42.5, riskCategory: "high", fraudProbability: 0.35, identityRisk: 0.28, financialRisk: 0.40, behavioralRisk: 0.32, complianceRisk: 0.38, propertyRisk: 0.30, modelVersion: "v3.2.1" },
    { profileId: oleksandrProfile.id, overallScore: 15.8, riskCategory: "critical", fraudProbability: 0.78, identityRisk: 0.82, financialRisk: 0.65, behavioralRisk: 0.71, complianceRisk: 0.88, propertyRisk: 0.50, modelVersion: "v3.2.1" },
    { profileId: margaretProfile.id, overallScore: 97.5, riskCategory: "low", fraudProbability: 0.01, identityRisk: 0.01, financialRisk: 0.01, behavioralRisk: 0.01, complianceRisk: 0.01, propertyRisk: 0.05, modelVersion: "v3.2.1" },
    { profileId: chenProfile.id, overallScore: 8.2, riskCategory: "critical", fraudProbability: 0.85, identityRisk: 0.90, financialRisk: 0.78, behavioralRisk: 0.82, complianceRisk: 0.88, propertyRisk: 0.60, modelVersion: "v3.2.1" },
  ];
  const riskScores = await Promise.all(riskScoresData.map(r => prisma.riskScore.create({ data: r })));
  console.log(`Created ${riskScores.length} risk scores`);

  // ============================================
  // 7. FRAUD ALERTS
  // ============================================
  await Promise.all([
    prisma.fraudAlert.create({ data: { alertType: "sanctions_match", severity: "critical", status: "investigating", description: "Potential EU sanctions list match for Oleksandr Kovalenko — 65% confidence", relatedProfileId: oleksandrProfile.id, assignedTo: complianceUser.id } }),
    prisma.fraudAlert.create({ data: { alertType: "document_fraud", severity: "high", status: "confirmed", description: "Chen Wei — expired passport submitted as valid document", relatedProfileId: chenProfile.id, assignedTo: adminUser.id } }),
  ]);
  console.log("Created 2 fraud alerts");

  // ============================================
  // 8. PROPERTIES (with EPC/HMO fields)
  // ============================================
  const properties = await Promise.all([
    prisma.property.create({
      data: {
        address: "42 Kensington Gardens Square", city: "London", postcode: "W2 4BA",
        propertyType: "residential", bedrooms: 2,
        epcRating: "C", hmoLicensed: false,
        landRegistryRef: "LR-WX123456",
        lastSalePrice: 850000, lastSaleDate: new Date("2021-05-15"),
        transactionType: "rental", complianceStatus: "compliant",
        lastInspection: new Date("2024-02-15"),
      },
    }),
    prisma.property.create({
      data: {
        address: "18 The Broadway", city: "Manchester", postcode: "M1 1BT",
        propertyType: "hmo", bedrooms: 5,
        epcRating: "E", hmoLicensed: true, hmoLicenceRef: "HMO-MCR-2023-0042",
        lastSalePrice: 320000,
        transactionType: "rental", complianceStatus: "under_review",
        lastInspection: new Date("2023-11-20"),
      },
    }),
    prisma.property.create({
      data: {
        address: "7 Park Lane", city: "Birmingham", postcode: "B1 1HQ",
        propertyType: "residential", bedrooms: 3,
        epcRating: "D", hmoLicensed: false,
        ownershipComplex: true,
        lastSalePrice: 425000, lastSaleDate: new Date("2023-02-01"),
        transactionType: "purchase", complianceStatus: "pending",
      },
    }),
  ]);
  console.log(`Created ${properties.length} properties`);

  // ============================================
  // 9. PROPERTY APPLICATIONS
  // ============================================
  await Promise.all([
    prisma.propertyApplication.create({ data: { propertyId: properties[0].id, profileId: jamesProfile.id, applicationType: "tenancy", status: "approved", complianceClear: true, riskClear: true, rightToRent: "verified", depositAmount: 3000, monthlyAmount: 2200, startDate: new Date("2024-02-01"), endDate: new Date("2025-01-31"), submittedAt: new Date("2024-01-20"), decidedAt: new Date("2024-01-28") } }),
    prisma.propertyApplication.create({ data: { propertyId: properties[1].id, profileId: amaraProfile.id, applicationType: "tenancy", status: "submitted", complianceClear: false, riskClear: false, rightToRent: "pending", depositAmount: 1200, monthlyAmount: 850, submittedAt: new Date("2024-06-01") } }),
    prisma.propertyApplication.create({ data: { propertyId: properties[2].id, profileId: oleksandrProfile.id, applicationType: "tenancy", status: "rejected", complianceClear: false, riskClear: false, rightToRent: "failed", depositAmount: 1800, monthlyAmount: 1200, submittedAt: new Date("2024-06-10"), decidedAt: new Date("2024-06-17") } }),
  ]);
  console.log("Created 3 property applications");

  // ============================================
  // 10. PARTNERS
  // ============================================
  const partners = await Promise.all([
    prisma.partner.create({ data: { name: "Barclays Bank PLC", partnerType: "bank", status: "active", apiEndpoint: "https://api.barclays.co.uk/openbanking/v3", integrationType: "api", trustRating: 95.0 } }),
    prisma.partner.create({ data: { name: "AXA Insurance UK", partnerType: "insurer", status: "active", apiEndpoint: "https://partner.axa.co.uk/api/v2", integrationType: "api", trustRating: 88.5 } }),
  ]);
  await prisma.user.update({ where: { id: partnerUser.id }, data: { partnerId: partners[0].id } });
  console.log(`Created ${partners.length} partners`);

  // ============================================
  // 11. CASES (CaseManagement — FR-CASE001)
  // ============================================
  const cases = await Promise.all([
    // Case 1 — cleared, low risk
    prisma.case.create({
      data: {
        firmId: firm.id,
        caseRef: "CASE-2024-000001",
        caseType: "individual",
        clientRole: "tenant",
        profileId: jamesProfile.id,
        status: "cleared",
        currentStep: "completed",
        ownerId: complianceUser.id,
        riskLevel: "low",
        eddRequired: false,
        mlroSignOffRequired: false,
        autoCleared: true,
        closedAt: new Date("2024-01-28"),
        closedReason: "All checks passed, risk within appetite",
      },
    }),
    // Case 2 — pending MLRO review (EDD complete, needs MLRO sign-off)
    prisma.case.create({
      data: {
        firmId: firm.id,
        caseRef: "CASE-2024-000002",
        caseType: "individual",
        clientRole: "tenant",
        profileId: priyaProfile.id,
        status: "pending_mlro",
        currentStep: "mlro_review",
        ownerId: complianceUser.id,
        riskLevel: "medium",
        eddRequired: true,
        eddCompletedAt: new Date("2024-01-18"),
        mlroSignOffRequired: true,
      },
    }),
    // Case 3 — open, high risk sanctions match
    prisma.case.create({
      data: {
        firmId: firm.id,
        caseRef: "CASE-2024-000003",
        caseType: "individual",
        clientRole: "tenant",
        profileId: oleksandrProfile.id,
        status: "pending_sar",
        currentStep: "sar_assessment",
        ownerId: mlroUser.id,
        riskLevel: "high",
        eddRequired: true,
        mlroSignOffRequired: true,
      },
    }),
  ]);
  console.log(`Created ${cases.length} cases`);

  // Case actions
  await Promise.all([
    prisma.caseAction.create({ data: { caseId: cases[0].id, actionType: "approve", performedBy: complianceUser.id, outcome: "cleared", notes: "Auto-cleared — all checks green" } }),
    prisma.caseAction.create({ data: { caseId: cases[1].id, actionType: "edd_complete", performedBy: complianceUser.id, outcome: "edd_passed", notes: "Source of funds verified — employment at Deloitte UK", nextOwner: mlroUser.id } }),
    prisma.caseAction.create({ data: { caseId: cases[1].id, actionType: "escalate", performedBy: complianceUser.id, outcome: "pending_mlro", notes: "Escalated to MLRO for sign-off on non-UK national EDD", nextOwner: mlroUser.id } }),
    prisma.caseAction.create({ data: { caseId: cases[2].id, actionType: "escalate", performedBy: complianceUser.id, outcome: "pending_sar", notes: "Potential EU sanctions match — escalated to MLRO for SAR assessment", nextOwner: mlroUser.id } }),
  ]);
  console.log("Created case actions");

  // ============================================
  // 12. SARs — RESTRICTED (tipping-off critical)
  // ============================================
  await prisma.sAR.create({
    data: {
      firmId: firm.id,
      caseId: cases[2].id,
      profileId: oleksandrProfile.id,
      sarRef: "SAR-2024-000001",
      draftContent: JSON.stringify({
        subject: "Oleksandr Kovalenko",
        grounds: "Potential match against EU Consolidated Sanctions List (65% confidence). Failed identity verification with suspicious liveness check failure. Transaction amount £1,200/month tenancy from an account with unclear source of funds.",
        requestedAction: "consent_to_proceed",
        aiAssisted: true,
      }),
      status: "pending_mlro",
      isRestricted: true,
    },
  });
  console.log("Created 1 SAR (pending MLRO review)");

  // ============================================
  // 13. AUDIT LOGS (hash chain seeded sequentially)
  // ============================================
  const auditEntries = [
    { action: "FIRM_CREATED", performedBy: adminUser.id, resource: "Firm", resourceId: firm.id, details: JSON.stringify({ firmName: firm.name }) },
    { profileId: jamesProfile.id, action: "PROFILE_CREATED", performedBy: "system", resource: "IdentityProfile", resourceId: jamesProfile.id, details: JSON.stringify({ source: "self_registration" }), ipAddress: "81.132.214.37" },
    { profileId: jamesProfile.id, action: "VERIFICATION_PASSED", performedBy: "Onfido", resource: "VerificationRecord", resourceId: "ver_doc_1", details: JSON.stringify({ type: "document", confidence: 0.99 }) },
    { profileId: jamesProfile.id, action: "COMPLIANCE_CHECK_PASSED", performedBy: "system", resource: "ComplianceCheck", details: JSON.stringify({ type: "aml", riskRating: "low" }) },
    { profileId: priyaProfile.id, action: "PROFILE_CREATED", performedBy: "system", resource: "IdentityProfile", resourceId: priyaProfile.id, details: JSON.stringify({ source: "self_registration" }), ipAddress: "86.154.22.11" },
    { profileId: priyaProfile.id, action: "EDD_INITIATED", performedBy: complianceUser.id, resource: "ComplianceCheck", details: JSON.stringify({ reason: "non_uk_national" }) },
    { profileId: priyaProfile.id, action: "EDD_COMPLETED", performedBy: mlroUser.id, resource: "Case", resourceId: cases[1].id, details: JSON.stringify({ outcome: "passed", notes: "SOF verified" }) },
    { profileId: oleksandrProfile.id, action: "PROFILE_CREATED", performedBy: "system", resource: "IdentityProfile", resourceId: oleksandrProfile.id, details: JSON.stringify({ source: "self_registration" }), ipAddress: "178.93.44.22" },
    { profileId: oleksandrProfile.id, action: "SANCTIONS_HIT", performedBy: "ComplyAdvantage", resource: "ComplianceCheck", details: JSON.stringify({ list: "EU_Consolidated", matchStrength: 0.65 }) },
    { profileId: oleksandrProfile.id, action: "FRAUD_ALERT_CREATED", performedBy: "system", resource: "FraudAlert", details: JSON.stringify({ severity: "critical", type: "sanctions_match" }) },
    { caseId: cases[2].id, action: "SAR_DRAFT_CREATED", performedBy: mlroUser.id, resource: "SAR", resourceId: "SAR-2024-000001", details: JSON.stringify({ aiAssisted: true }) },
    { action: "SYSTEM_CONFIG_UPDATED", performedBy: adminUser.id, resource: "PlatformConfig", details: JSON.stringify({ key: "risk_threshold_high", newValue: "35" }) },
  ];

  // Hash-chain the audit log
  const crypto = await import("crypto");
  let prevHash = "0".repeat(64);
  for (const entry of auditEntries) {
    const id = crypto.randomUUID();
    const timestamp = new Date();
    const chain = crypto.createHash("sha256").update(`${prevHash}|${id}|${entry.action}|${timestamp.toISOString()}`).digest("hex");
    await prisma.auditLog.create({
      data: {
        id,
        profileId: entry.profileId ?? null,
        caseId: entry.caseId ?? null,
        action: entry.action,
        performedBy: entry.performedBy ?? null,
        resource: entry.resource,
        resourceId: (entry as Record<string, unknown>).resourceId as string ?? null,
        details: entry.details ?? null,
        ipAddress: (entry as Record<string, unknown>).ipAddress as string ?? null,
        hashChain: chain,
        timestamp,
      },
    });
    prevHash = chain;
  }
  console.log(`Created ${auditEntries.length} hash-chained audit log entries`);

  // ============================================
  // 14. CONSENT RECORDS
  // ============================================
  await Promise.all([
    prisma.consentRecord.create({ data: { profileId: jamesProfile.id, consentType: "data_processing", granted: true, purpose: "Identity verification and compliance checks", legalBasis: "contract", expiresAt: new Date("2025-01-15") } }),
    prisma.consentRecord.create({ data: { profileId: priyaProfile.id, consentType: "data_processing", granted: true, purpose: "Identity verification and compliance checks", legalBasis: "contract", expiresAt: new Date("2025-01-10") } }),
    prisma.consentRecord.create({ data: { profileId: priyaProfile.id, consentType: "automated_decisions", granted: true, purpose: "Automated trust scoring and risk assessment", legalBasis: "consent", expiresAt: new Date("2025-01-10") } }),
  ]);
  console.log("Created 3 consent records");

  // ============================================
  // 15. PLATFORM CONFIG
  // ============================================
  await Promise.all([
    prisma.platformConfig.create({ data: { firmId: firm.id, key: "risk_threshold_high", value: "35", description: "Risk score threshold for high risk category" } }),
    prisma.platformConfig.create({ data: { firmId: firm.id, key: "edd_threshold", value: "medium", description: "Minimum risk level to trigger EDD" } }),
    prisma.platformConfig.create({ data: { firmId: firm.id, key: "compliance_check_schedule", value: JSON.stringify({ aml: "12m", kyc: "12m", sanctions: "daily" }), description: "Re-check intervals" } }),
  ]);
  console.log("Created 3 platform config entries");

  // ============================================
  // 16. NOTIFICATIONS
  // ============================================
  await Promise.all([
    prisma.notification.create({ data: { userId: adminUser.id, title: "System Alert", message: "Platform maintenance scheduled for tonight 02:00-04:00 GMT", type: "warning", category: "system", read: false } }),
    prisma.notification.create({ data: { userId: mlroUser.id, title: "SAR Pending Review", message: "A new Suspicious Activity Report requires your review (SAR-2024-000001)", type: "error", category: "compliance", read: false, isSarRelated: true } }),
    prisma.notification.create({ data: { userId: mlroUser.id, title: "EDD Sign-Off Required", message: "Case CASE-2024-000002 EDD is complete and requires your sign-off", type: "warning", category: "compliance", read: false } }),
    prisma.notification.create({ data: { userId: complianceUser.id, title: "Critical Sanctions Match", message: "Oleksandr Kovalenko flagged with EU Consolidated List hit at 65% confidence", type: "error", category: "risk", read: false } }),
    prisma.notification.create({ data: { userId: complianceUser.id, title: "AML Check Completed", message: "James Wellington AML screening completed — all clear", type: "success", category: "compliance", read: true } }),
    prisma.notification.create({ data: { userId: propertyUser.id, title: "New Application Submitted", message: "Amara Okafor submitted a tenancy application for 18 The Broadway, Manchester", type: "info", category: "property", read: false } }),
    prisma.notification.create({ data: { userId: tenantUser.id, title: "Application Approved", message: "Your tenancy application for 42 Kensington Gardens Square has been approved!", type: "success", category: "property", read: true } }),
  ]);
  console.log("Created 7 notifications");

  console.log("\n========================================");
  console.log("Seed completed successfully!");
  console.log("========================================");
  console.log("  Firm:                 1");
  console.log(`  Users:                ${users.length} (incl. MLRO)`);
  console.log(`  Identity Profiles:    ${profiles.length}`);
  console.log("  UBOs:                 1");
  console.log(`  Cases:                ${cases.length}`);
  console.log("  SARs:                 1");
  console.log("  Audit Logs:           hash-chained");
  console.log("========================================");
  console.log("\nSeed credentials:");
  console.log("  admin@propcomply.ai     Admin@2024");
  console.log("  mlro@propcomply.ai      MLRO@2024");
  console.log("  compliance@propcomply.ai  Compliance@2024");
  console.log("  property@propcomply.ai  Property@2024");
  console.log("  identity@propcomply.ai  Identity@2024  (verifier — approves applicants)");
  console.log("  tenant@example.com      Tenant@2024    (James Wellington — verified)");
  console.log("  applicant@example.com   Tenant@2024    (Daniel Osei — in progress, approve me!)");
  console.log("  newtenant@example.com   Tenant@2024    (Olivia Bennett — NO profile, first-time onboarding)");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
