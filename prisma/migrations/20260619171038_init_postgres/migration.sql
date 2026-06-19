-- CreateTable
CREATE TABLE "Firm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "registrationNumber" TEXT,
    "firmType" TEXT NOT NULL DEFAULT 'estate_agency',
    "mlroId" TEXT,
    "riskAppetite" TEXT NOT NULL DEFAULT 'standard',
    "amlPolicyVersion" TEXT,
    "hmrcRegistration" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Firm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityProfile" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "trustLevel" INTEGER NOT NULL DEFAULT 0,
    "trustScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "gdprCompliant" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentityProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityCredential" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "credentialType" TEXT NOT NULL,
    "credentialValue" TEXT NOT NULL,
    "trustLevel" INTEGER NOT NULL,
    "issuingCountry" TEXT,
    "issuingAuthority" TEXT,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "verifiedAt" TIMESTAMP(3),
    "evidenceHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IdentityCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IdentityEvidence" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "evidenceData" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IdentityEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRecord" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "verificationType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "provider" TEXT,
    "result" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UBO" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "ownershipPercentage" DOUBLE PRECISION NOT NULL,
    "controlType" TEXT NOT NULL DEFAULT 'shares',
    "isPEP" BOOLEAN NOT NULL DEFAULT false,
    "isSanctioned" BOOLEAN NOT NULL DEFAULT false,
    "companiesHouseRef" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UBO_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComplianceCheck" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "checkType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "riskRating" TEXT NOT NULL DEFAULT 'low',
    "checkProvider" TEXT,
    "results" TEXT,
    "evidenceRef" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComplianceCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Case" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "caseRef" TEXT NOT NULL,
    "caseType" TEXT NOT NULL,
    "clientRole" TEXT NOT NULL,
    "profileId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "currentStep" TEXT NOT NULL DEFAULT 'identity_verification',
    "ownerId" TEXT,
    "riskLevel" TEXT,
    "eddRequired" BOOLEAN NOT NULL DEFAULT false,
    "eddCompletedAt" TIMESTAMP(3),
    "mlroSignOffRequired" BOOLEAN NOT NULL DEFAULT false,
    "mlroSignedOffAt" TIMESTAMP(3),
    "mlroSignedOffBy" TEXT,
    "mlroNotes" TEXT,
    "autoCleared" BOOLEAN NOT NULL DEFAULT false,
    "closedAt" TIMESTAMP(3),
    "closedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Case_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseAction" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outcome" TEXT,
    "notes" TEXT,
    "nextOwner" TEXT,

    CONSTRAINT "CaseAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SAR" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "caseId" TEXT,
    "profileId" TEXT,
    "sarRef" TEXT NOT NULL,
    "draftContent" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isRestricted" BOOLEAN NOT NULL DEFAULT true,
    "mlroDecision" TEXT,
    "mlroDecidedAt" TIMESTAMP(3),
    "mlroDecidedBy" TEXT,
    "mlroNotes" TEXT,
    "filedAt" TIMESTAMP(3),
    "filingRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SAR_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskScore" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "overallScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskCategory" TEXT NOT NULL DEFAULT 'medium',
    "fraudProbability" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "identityRisk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "financialRisk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "behavioralRisk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "complianceRisk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "propertyRisk" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "epcRating" TEXT,
    "hmoFlag" BOOLEAN NOT NULL DEFAULT false,
    "ownershipComplexity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "riskFactors" TEXT,
    "modelVersion" TEXT,
    "explainability" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudAlert" (
    "id" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'open',
    "description" TEXT NOT NULL,
    "evidenceRef" TEXT,
    "relatedProfileId" TEXT,
    "assignedTo" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FraudAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'GB',
    "propertyType" TEXT NOT NULL,
    "bedrooms" INTEGER,
    "epcRating" TEXT,
    "hmoLicensed" BOOLEAN NOT NULL DEFAULT false,
    "hmoLicenceRef" TEXT,
    "landRegistryRef" TEXT,
    "lastSalePrice" DOUBLE PRECISION,
    "lastSaleDate" TIMESTAMP(3),
    "transactionType" TEXT,
    "ownershipComplex" BOOLEAN NOT NULL DEFAULT false,
    "complianceStatus" TEXT NOT NULL DEFAULT 'pending',
    "lastInspection" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyApplication" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "applicationType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "complianceClear" BOOLEAN NOT NULL DEFAULT false,
    "riskClear" BOOLEAN NOT NULL DEFAULT false,
    "rightToRent" TEXT NOT NULL DEFAULT 'pending',
    "guarantorReplaced" BOOLEAN NOT NULL DEFAULT false,
    "depositAmount" DOUBLE PRECISION,
    "monthlyAmount" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "PropertyApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "partnerType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "apiEndpoint" TEXT,
    "integrationType" TEXT,
    "trustRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerReferral" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "profileId" TEXT,
    "referralType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "referralData" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PartnerReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "profileId" TEXT,
    "caseId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "performedBy" TEXT,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "hashChain" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "profileId" TEXT,
    "userId" TEXT,
    "consentType" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "purpose" TEXT,
    "legalBasis" TEXT,
    "withdrawnAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'tenant',
    "firmId" TEXT,
    "avatar" TEXT,
    "department" TEXT,
    "jobTitle" TEXT,
    "phone" TEXT,
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "mfaVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "loginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "partnerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "device" TEXT,
    "browser" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "category" TEXT NOT NULL DEFAULT 'system',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "isSarRelated" BOOLEAN NOT NULL DEFAULT false,
    "actionUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformConfig" (
    "id" TEXT NOT NULL,
    "firmId" TEXT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingProcess" (
    "id" TEXT NOT NULL,
    "profileId" TEXT,
    "firmId" TEXT,
    "applicantEmail" TEXT NOT NULL,
    "applicantName" TEXT NOT NULL,
    "nationality" TEXT,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "registrationMethod" TEXT,
    "mfaEnforced" BOOLEAN NOT NULL DEFAULT false,
    "passportUploaded" BOOLEAN NOT NULL DEFAULT false,
    "visaUploaded" BOOLEAN NOT NULL DEFAULT false,
    "financialFilesUploaded" BOOLEAN NOT NULL DEFAULT false,
    "selfieCaptured" BOOLEAN NOT NULL DEFAULT false,
    "livenessScore" DOUBLE PRECISION,
    "faceMatchScore" DOUBLE PRECISION,
    "deepfakeScore" DOUBLE PRECISION,
    "biometricConfidence" DOUBLE PRECISION,
    "financialMonthsAnalyzed" INTEGER,
    "incomeStability" DOUBLE PRECISION,
    "spendingCoherence" DOUBLE PRECISION,
    "professionMatch" DOUBLE PRECISION,
    "sourceCountryDb" TEXT,
    "sourceCountryVerified" BOOLEAN NOT NULL DEFAULT false,
    "homeOfficeVerified" BOOLEAN NOT NULL DEFAULT false,
    "professionalRegistryVerified" BOOLEAN NOT NULL DEFAULT false,
    "biometricScore" DOUBLE PRECISION,
    "behaviouralScore" DOUBLE PRECISION,
    "jurisdictionalScore" DOUBLE PRECISION,
    "overallConfidenceScore" DOUBLE PRECISION,
    "gatewayPassed" BOOLEAN NOT NULL DEFAULT false,
    "gatewayResult" TEXT,
    "identityRisk" DOUBLE PRECISION,
    "amlRisk" DOUBLE PRECISION,
    "financialRisk" DOUBLE PRECISION,
    "tenancyRisk" DOUBLE PRECISION,
    "credentialIssued" BOOLEAN NOT NULL DEFAULT false,
    "credentialToken" TEXT,
    "agentReviewed" BOOLEAN NOT NULL DEFAULT false,
    "agentDecision" TEXT,
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnboardingProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AMLProcess" (
    "id" TEXT NOT NULL,
    "profileId" TEXT,
    "firmId" TEXT,
    "caseId" TEXT,
    "transactionRef" TEXT NOT NULL,
    "propertyRef" TEXT,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'initialized',
    "transactionType" TEXT,
    "transactionAmount" DOUBLE PRECISION,
    "identityVerified" BOOLEAN NOT NULL DEFAULT false,
    "kycComplete" BOOLEAN NOT NULL DEFAULT false,
    "cddComplete" BOOLEAN NOT NULL DEFAULT false,
    "riskClassification" TEXT,
    "sanctionsCheck" TEXT,
    "pepCheck" TEXT,
    "adverseMediaCheck" TEXT,
    "screeningProvider" TEXT,
    "screeningDate" TIMESTAMP(3),
    "eddRequired" BOOLEAN NOT NULL DEFAULT false,
    "sofVerified" BOOLEAN NOT NULL DEFAULT false,
    "sourceOfFunds" TEXT,
    "eddComplete" BOOLEAN NOT NULL DEFAULT false,
    "mlroSignOffRequired" BOOLEAN NOT NULL DEFAULT false,
    "mlroSignedOffAt" TIMESTAMP(3),
    "mlroSignedOffBy" TEXT,
    "decisionResult" TEXT,
    "amlRiskScore" DOUBLE PRECISION,
    "decidedBy" TEXT,
    "decidedAt" TIMESTAMP(3),
    "sarGenerated" BOOLEAN NOT NULL DEFAULT false,
    "sarReference" TEXT,
    "sarFiledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AMLProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RightToRentProcess" (
    "id" TEXT NOT NULL,
    "profileId" TEXT,
    "agentId" TEXT,
    "propertyId" TEXT,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "initiatedBy" TEXT,
    "checkReason" TEXT,
    "visaType" TEXT,
    "documentAuthentic" BOOLEAN NOT NULL DEFAULT false,
    "tamperingCheck" BOOLEAN NOT NULL DEFAULT false,
    "ocrConfidence" DOUBLE PRECISION,
    "visaGrantValid" BOOLEAN NOT NULL DEFAULT false,
    "ukResidenceData" BOOLEAN NOT NULL DEFAULT false,
    "immigrationPermissions" BOOLEAN NOT NULL DEFAULT false,
    "homeOfficeCheckDate" TIMESTAMP(3),
    "permanentRight" BOOLEAN NOT NULL DEFAULT false,
    "timeLimitedStatus" BOOLEAN NOT NULL DEFAULT false,
    "expiryDate" TIMESTAMP(3),
    "restrictions" TEXT,
    "complianceResult" TEXT,
    "rulesEngineResult" TEXT,
    "statutoryGuidelineMet" BOOLEAN NOT NULL DEFAULT false,
    "certificateIssued" BOOLEAN NOT NULL DEFAULT false,
    "certificateToken" TEXT,
    "evidenceTrailRef" TEXT,
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "monitoringActive" BOOLEAN NOT NULL DEFAULT false,
    "daysToExpiry" INTEGER,
    "lastAlertSent" TIMESTAMP(3),
    "alertStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RightToRentProcess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuarantorSubmission" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "applicationId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "housingTypes" TEXT NOT NULL,
    "passportRef" TEXT,
    "proofOfAddressRef" TEXT,
    "incomeProofRef" TEXT,
    "consentGiven" BOOLEAN NOT NULL DEFAULT false,
    "consentTimestamp" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuarantorSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IdentityProfile_email_key" ON "IdentityProfile"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Case_caseRef_key" ON "Case"("caseRef");

-- CreateIndex
CREATE UNIQUE INDEX "SAR_sarRef_key" ON "SAR"("sarRef");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_token_key" ON "UserSession"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PlatformConfig_firmId_key_key" ON "PlatformConfig"("firmId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "AMLProcess_transactionRef_key" ON "AMLProcess"("transactionRef");

-- AddForeignKey
ALTER TABLE "IdentityProfile" ADD CONSTRAINT "IdentityProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityCredential" ADD CONSTRAINT "IdentityCredential_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "IdentityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdentityEvidence" ADD CONSTRAINT "IdentityEvidence_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "IdentityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationRecord" ADD CONSTRAINT "VerificationRecord_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "IdentityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UBO" ADD CONSTRAINT "UBO_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "IdentityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComplianceCheck" ADD CONSTRAINT "ComplianceCheck_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "IdentityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Case" ADD CONSTRAINT "Case_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "IdentityProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseAction" ADD CONSTRAINT "CaseAction_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SAR" ADD CONSTRAINT "SAR_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SAR" ADD CONSTRAINT "SAR_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SAR" ADD CONSTRAINT "SAR_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "IdentityProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskScore" ADD CONSTRAINT "RiskScore_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "IdentityProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyApplication" ADD CONSTRAINT "PropertyApplication_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyApplication" ADD CONSTRAINT "PropertyApplication_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "IdentityProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerReferral" ADD CONSTRAINT "PartnerReferral_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "IdentityProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuarantorSubmission" ADD CONSTRAINT "GuarantorSubmission_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "IdentityProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
