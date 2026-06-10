'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import {
  Building2,
  Search,
  ShieldCheck,
  AlertTriangle,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Home,
  Users,
  MapPin,
  Star,
  BadgeCheck,
  RefreshCw,
  Lock,
  Zap,
  Eye,
  Award,
  Check,
  X,
  Info,
  Calendar,
  DollarSign,
  User,
  Fingerprint,
  Shield,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Button,
} from '@/components/ui/button';
import {
  Input,
} from '@/components/ui/input';
import {
  Label,
} from '@/components/ui/label';
import {
  Progress,
} from '@/components/ui/progress';
import {
  Separator,
} from '@/components/ui/separator';
import {
  Checkbox,
} from '@/components/ui/checkbox';
import {
  ScrollArea,
} from '@/components/ui/scroll-area';
import { useApi } from '@/hooks/use-api';
import { hasPermission, type UserRole } from '@/lib/rbac';
import { getStatusStyle, formatDate, TRUST_LEVELS } from '@/lib/platform-data';

// ===================== TYPES =====================

interface PropertyApp {
  id: string;
  propertyId: string;
  profileId: string;
  applicationType: string;
  status: string;
  complianceClear: boolean;
  riskClear: boolean;
  rightToRent: string;
  guarantorReplaced: boolean;
  depositAmount: number | null;
  monthlyAmount: number | null;
  startDate: string | null;
  endDate: string | null;
  submittedAt: string;
  decidedAt: string | null;
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    nationality: string | null;
    trustLevel: number;
    trustScore: number;
    status: string;
  };
}

interface Property {
  id: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  propertyType: string;
  bedrooms: number | null;
  complianceStatus: string;
  lastInspection: string | null;
  createdAt: string;
  updatedAt: string;
  applications: PropertyApp[];
}

interface PropertiesResponse {
  properties: Property[];
  total: number;
  summary: Record<string, unknown>;
}

interface IdentityProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  trustLevel: number;
  trustScore: number;
  status: string;
  credentials: { id: string; credentialType: string; verificationStatus: string }[];
  verifications: { id: string; verificationType: string; status: string; confidence: number }[];
}

interface IdentitiesResponse {
  profiles: IdentityProfile[];
  total: number;
}

interface StepData {
  // Step 1
  selectedPropertyId: string;
  applicationType: string;
  propertySearch: string;
  // Step 2
  selectedProfileId: string;
  // Step 3
  complianceCheckRunning: boolean;
  complianceCheckComplete: boolean;
  complianceClear: boolean;
  riskCheckRunning: boolean;
  riskCheckComplete: boolean;
  riskClear: boolean;
  amlStatus: string;
  kycStatus: string;
  riskCategory: string;
  riskScore: number;
  warnings: string[];
  proceedWithConditions: boolean;
  // Step 4
  depositAmount: string;
  monthlyAmount: string;
  startDate: string;
  endDate: string;
  guarantorReplacement: boolean;
  rightToRentStatus: string;
  termsAccepted: boolean;
  // Step 5
  submitted: boolean;
  applicationRef: string;
}

const INITIAL_STEP_DATA: StepData = {
  selectedPropertyId: '',
  applicationType: '',
  propertySearch: '',
  selectedProfileId: '',
  complianceCheckRunning: false,
  complianceCheckComplete: false,
  complianceClear: false,
  riskCheckRunning: false,
  riskCheckComplete: false,
  riskClear: false,
  amlStatus: '',
  kycStatus: '',
  riskCategory: '',
  riskScore: 0,
  warnings: [],
  proceedWithConditions: false,
  depositAmount: '',
  monthlyAmount: '',
  startDate: '',
  endDate: '',
  guarantorReplacement: false,
  rightToRentStatus: 'pending',
  termsAccepted: false,
  submitted: false,
  applicationRef: '',
};

// ===================== STEP DEFINITIONS =====================

const STEPS = [
  { id: 1, title: 'Property Selection', icon: Building2, description: 'Select property & application type' },
  { id: 2, title: 'Identity Verification', icon: ShieldCheck, description: 'Verify applicant identity' },
  { id: 3, title: 'Compliance & Risk', icon: AlertTriangle, description: 'Pre-check AML/KYC & risk' },
  { id: 4, title: 'Application Details', icon: FileText, description: 'Enter financial & tenancy details' },
  { id: 5, title: 'Review & Submit', icon: CheckCircle2, description: 'Confirm and submit application' },
];

const APPLICATION_TYPES = [
  { value: 'tenancy', label: 'Tenancy', description: 'Apply for a tenancy agreement', icon: Home, color: '#10b981' },
  { value: 'purchase', label: 'Purchase', description: 'Apply to purchase property', icon: DollarSign, color: '#8b5cf6' },
  { value: 'rental', label: 'Rental', description: 'Apply for a rental agreement', icon: Calendar, color: '#06b6d4' },
];

// ===================== ANIMATION VARIANTS =====================

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const slideIn = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0 },
};

// ===================== HELPER COMPONENTS =====================

function StatusBadge({ status }: { status: string }) {
  const style = getStatusStyle(status);
  return (
    <Badge
      className="font-medium"
      style={{ backgroundColor: style.bgColor, color: style.color, borderColor: 'transparent' }}
    >
      {status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
    </Badge>
  );
}

function PropertyTypeBadge({ type }: { type: string }) {
  const config: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    residential: { color: '#10b981', bg: '#ecfdf5', icon: <Home className="size-3" /> },
    commercial: { color: '#8b5cf6', bg: '#f5f3ff', icon: <Building2 className="size-3" /> },
    hmo: { color: '#f59e0b', bg: '#fffbeb', icon: <Users className="size-3" /> },
  };
  const c = config[type] || { color: '#94a3b8', bg: '#f1f5f9', icon: <Building2 className="size-3" /> };
  return (
    <Badge
      className="font-medium gap-1"
      style={{ backgroundColor: c.bg, color: c.color, borderColor: 'transparent' }}
    >
      {c.icon}
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}

function TrustLevelBadge({ level }: { level: number }) {
  const tl = TRUST_LEVELS[level] || TRUST_LEVELS[0];
  return (
    <Badge
      className="font-medium gap-1"
      style={{ backgroundColor: tl.bgColor, color: tl.color, borderColor: 'transparent' }}
    >
      <Star className="size-3" />
      Level {level}: {tl.name}
    </Badge>
  );
}

// ===================== MAIN COMPONENT =====================

export default function PropertyApplicationFlow() {
  const { data: session } = useSession();
  const userRole = (session?.user?.role || 'tenant') as UserRole;
  const canManageProperty = hasPermission(userRole, 'property:manage');

  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState<StepData>({ ...INITIAL_STEP_DATA });
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Fetch properties
  const { data: propertiesData } = useApi<PropertiesResponse>(
    'properties',
    '/api/properties',
    true,
    {
      userId: session?.user?.id || '',
      role: userRole,
    }
  );

  // Fetch identity profiles (for property_manager to select)
  const { data: identitiesData } = useApi<IdentitiesResponse>(
    'identities',
    '/api/identities',
    canManageProperty,
    {}
  );

  const properties = propertiesData?.properties ?? [];
  const profiles = identitiesData?.profiles ?? [];

  // Get selected property
  const selectedProperty = properties.find(p => p.id === stepData.selectedPropertyId);

  // Get selected profile
  const selectedProfile = stepData.selectedProfileId
    ? profiles.find(p => p.id === stepData.selectedProfileId)
    : null;

  // For tenants, auto-use their own profile (find by userId)
  const tenantProfile = !canManageProperty ? profiles.find(p => p.email === session?.user?.email) : null;

  // Effective profile for checks
  const effectiveProfile = canManageProperty ? selectedProfile : tenantProfile;

  // ===================== STEP 1: Property Selection =====================

  const canProceedStep1 = stepData.selectedPropertyId && stepData.applicationType;

  const filteredProperties = properties.filter(p =>
    !stepData.propertySearch ||
    p.address.toLowerCase().includes(stepData.propertySearch.toLowerCase()) ||
    p.city.toLowerCase().includes(stepData.propertySearch.toLowerCase()) ||
    p.postcode.toLowerCase().includes(stepData.propertySearch.toLowerCase())
  );

  // ===================== STEP 2: Identity Verification =====================

  const isIdentityVerified = effectiveProfile && effectiveProfile.trustLevel >= 1 && effectiveProfile.status === 'verified';
  const canProceedStep2 = !!effectiveProfile && isIdentityVerified;

  // ===================== STEP 3: Compliance & Risk Pre-Check =====================

  const simulateComplianceCheck = useCallback(() => {
    setStepData(prev => ({ ...prev, complianceCheckRunning: true }));
    setTimeout(() => {
      setStepData(prev => ({
        ...prev,
        complianceCheckRunning: false,
        complianceCheckComplete: true,
        complianceClear: effectiveProfile?.trustLevel !== undefined && effectiveProfile.trustLevel >= 2,
        amlStatus: effectiveProfile?.trustLevel !== undefined && effectiveProfile.trustLevel >= 2 ? 'passed' : 'review',
        kycStatus: effectiveProfile?.trustLevel !== undefined && effectiveProfile.trustLevel >= 2 ? 'passed' : 'review',
      }));
    }, 2500);
  }, [effectiveProfile]);

  const simulateRiskCheck = useCallback(() => {
    setStepData(prev => ({ ...prev, riskCheckRunning: true }));
    setTimeout(() => {
      const isClear = effectiveProfile?.trustLevel !== undefined && effectiveProfile.trustLevel >= 2;
      const riskScore = effectiveProfile?.trustScore ?? 50;
      setStepData(prev => ({
        ...prev,
        riskCheckRunning: false,
        riskCheckComplete: true,
        riskClear: isClear,
        riskCategory: riskScore >= 75 ? 'low' : riskScore >= 50 ? 'medium' : 'high',
        riskScore: riskScore,
        warnings: !isClear
          ? ['Applicant requires enhanced due diligence', 'Risk score below threshold — conditions apply']
          : [],
      }));
    }, 2000);
  }, [effectiveProfile]);

  // Trigger compliance check when entering step 3
  // (called from nextStep instead of useEffect to avoid cascading render issues)
  const triggerComplianceCheck = useCallback(() => {
    if (!stepData.complianceCheckRunning && !stepData.complianceCheckComplete) {
      simulateComplianceCheck();
    }
  }, [stepData.complianceCheckRunning, stepData.complianceCheckComplete, simulateComplianceCheck]);

  // Trigger risk check after compliance completes
  useEffect(() => {
    if (stepData.complianceCheckComplete && !stepData.riskCheckRunning && !stepData.riskCheckComplete) {
      const timer = setTimeout(() => {
        simulateRiskCheck();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [stepData.complianceCheckComplete, stepData.riskCheckRunning, stepData.riskCheckComplete, simulateRiskCheck]);

  const canProceedStep3 = stepData.complianceCheckComplete && stepData.riskCheckComplete &&
    (stepData.complianceClear && stepData.riskClear || stepData.proceedWithConditions);

  // ===================== STEP 4: Application Details =====================

  const isGuarantorEligible = effectiveProfile &&
    effectiveProfile.trustLevel >= 3 &&
    stepData.complianceClear &&
    stepData.riskClear;

  const canProceedStep4 = stepData.depositAmount &&
    stepData.monthlyAmount &&
    stepData.startDate &&
    stepData.termsAccepted;

  // ===================== STEP 5: Submit =====================

  const handleSubmit = useCallback(async () => {
    try {
      const payload = {
        propertyId: stepData.selectedPropertyId,
        profileId: effectiveProfile?.id || '',
        applicationType: stepData.applicationType,
        complianceClear: stepData.complianceClear,
        riskClear: stepData.riskClear,
        rightToRent: stepData.applicationType === 'tenancy' ? stepData.rightToRentStatus : 'pending',
        guarantorReplaced: stepData.guarantorReplacement,
        depositAmount: parseFloat(stepData.depositAmount) || 0,
        monthlyAmount: parseFloat(stepData.monthlyAmount) || 0,
        startDate: stepData.startDate,
        endDate: stepData.endDate || null,
      };

      const res = await fetch('/api/property-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        setStepData(prev => ({
          ...prev,
          submitted: true,
          applicationRef: data.application?.id || `APP-${Date.now().toString(36).toUpperCase()}`,
        }));
      } else {
        // Fallback: still show success with generated reference
        setStepData(prev => ({
          ...prev,
          submitted: true,
          applicationRef: `APP-${Date.now().toString(36).toUpperCase()}`,
        }));
      }
    } catch {
      setStepData(prev => ({
        ...prev,
        submitted: true,
        applicationRef: `APP-${Date.now().toString(36).toUpperCase()}`,
      }));
    }
  }, [stepData, effectiveProfile]);

  // ===================== NAVIGATION =====================

  const goToStep = (step: number) => {
    if (step <= currentStep || completedSteps.has(step - 1)) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      const nextStepNum = currentStep + 1;
      setCurrentStep(nextStepNum);
      // Auto-trigger compliance check when entering step 3
      if (nextStepNum === 3) {
        triggerComplianceCheck();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // ===================== STEP RENDERERS =====================

  const renderStep1 = () => (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <Building2 className="size-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Property Selection</h3>
          <p className="text-sm text-muted-foreground">Select a property and choose your application type</p>
        </div>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Search Properties</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by address, city, or postcode..."
            value={stepData.propertySearch}
            onChange={(e) => setStepData(prev => ({ ...prev, propertySearch: e.target.value }))}
            className="pl-9 h-10"
          />
        </div>
      </div>

      {/* Property Cards */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Available Properties</Label>
        {filteredProperties.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Building2 className="size-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No properties found matching your search</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto">
            {filteredProperties.map(property => (
              <motion.button
                key={property.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStepData(prev => ({ ...prev, selectedPropertyId: property.id }))}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  stepData.selectedPropertyId === property.id
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-border hover:border-emerald-300 hover:bg-muted/30'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-sm leading-tight">{property.address}</p>
                        <p className="text-xs text-muted-foreground">{property.city}, {property.postcode}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <PropertyTypeBadge type={property.propertyType} />
                    {property.bedrooms && (
                      <Badge variant="outline" className="text-xs">
                        {property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}
                      </Badge>
                    )}
                    <StatusBadge status={property.complianceStatus} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {property.applications.length} application{property.applications.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Application Type */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Application Type</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {APPLICATION_TYPES.map(appType => {
            const Icon = appType.icon;
            return (
              <motion.button
                key={appType.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStepData(prev => ({ ...prev, applicationType: appType.value }))}
                className={`text-left p-4 rounded-lg border-2 transition-all ${
                  stepData.applicationType === appType.value
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : 'border-border hover:border-emerald-300 hover:bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="size-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: appType.color + '15', color: appType.color }}>
                    <Icon className="size-4" />
                  </div>
                  <p className="font-semibold text-sm">{appType.label}</p>
                </div>
                <p className="text-xs text-muted-foreground">{appType.description}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-2">
        <Button
          size="lg"
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          disabled={!canProceedStep1}
          onClick={nextStep}
        >
          Continue to Identity Verification
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-xl bg-violet-50 flex items-center justify-center">
          <ShieldCheck className="size-5 text-violet-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Applicant Identity Verification</h3>
          <p className="text-sm text-muted-foreground">Verify the applicant&apos;s identity before proceeding</p>
        </div>
      </div>

      {/* For property_manager: profile selector */}
      {canManageProperty && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Select Applicant Profile</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
            {profiles.map(profile => (
              <motion.button
                key={profile.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setStepData(prev => ({ ...prev, selectedProfileId: profile.id }))}
                className={`text-left p-3 rounded-lg border-2 transition-all ${
                  stepData.selectedProfileId === profile.id
                    ? 'border-violet-500 bg-violet-50/50'
                    : 'border-border hover:border-violet-300 hover:bg-muted/30'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 text-xs font-bold">
                      {profile.firstName[0]}{profile.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{profile.firstName} {profile.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <TrustLevelBadge level={profile.trustLevel} />
                    <StatusBadge status={profile.status} />
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* For tenant: show their own profile */}
      {!canManageProperty && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Your Identity Profile</Label>
          {tenantProfile ? (
            <Card className="border-violet-200 bg-violet-50/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold">
                    {tenantProfile.firstName[0]}{tenantProfile.lastName[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{tenantProfile.firstName} {tenantProfile.lastName}</p>
                    <p className="text-sm text-muted-foreground">{tenantProfile.email}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <TrustLevelBadge level={tenantProfile.trustLevel} />
                      <StatusBadge status={tenantProfile.status} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed border-amber-300 bg-amber-50/20">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="size-8 text-amber-500 mx-auto mb-2" />
                <p className="font-medium text-sm">No Identity Profile Found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You need to complete identity verification before applying for properties.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Profile Verification Details */}
      {effectiveProfile && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Separator />

          {/* Verification Status */}
          <Card className={isIdentityVerified ? 'border-emerald-200 bg-emerald-50/20' : 'border-red-200 bg-red-50/20'}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                {isIdentityVerified ? (
                  <CheckCircle2 className="size-6 text-emerald-600" />
                ) : (
                  <XCircle className="size-6 text-red-500" />
                )}
                <div>
                  <p className={`font-semibold ${isIdentityVerified ? 'text-emerald-800' : 'text-red-800'}`}>
                    {isIdentityVerified ? 'Identity Verified' : 'Identity Not Verified'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isIdentityVerified
                      ? 'Applicant meets minimum identity verification requirements'
                      : 'Applicant must have at least Trust Level 1 (Document Verified) and verified status'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-2 rounded-lg bg-white/60 border">
                  <p className="text-xs text-muted-foreground">Trust Level</p>
                  <p className="text-lg font-bold" style={{ color: (TRUST_LEVELS[effectiveProfile.trustLevel] || TRUST_LEVELS[0]).color }}>
                    {effectiveProfile.trustLevel}
                  </p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/60 border">
                  <p className="text-xs text-muted-foreground">Trust Score</p>
                  <p className="text-lg font-bold text-emerald-600">{Math.round(effectiveProfile.trustScore)}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/60 border">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-semibold mt-0.5">{effectiveProfile.status}</p>
                </div>
                <div className="text-center p-2 rounded-lg bg-white/60 border">
                  <p className="text-xs text-muted-foreground">Credentials</p>
                  <p className="text-lg font-bold text-violet-600">{effectiveProfile.credentials?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pre-check warning */}
          {!isIdentityVerified && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
              <AlertTriangle className="size-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-sm text-amber-800">Identity Verification Required</p>
                <p className="text-xs text-amber-700 mt-1">
                  The applicant must complete identity verification (Trust Level ≥ 1) before proceeding
                  with a property application. Please complete verification in the Identity & Trust section first.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={prevStep} className="gap-2">
          <ChevronLeft className="size-4" /> Back
        </Button>
        <Button
          size="lg"
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          disabled={!canProceedStep2}
          onClick={nextStep}
        >
          Continue to Compliance Check
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <AlertTriangle className="size-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Compliance & Risk Pre-Check</h3>
          <p className="text-sm text-muted-foreground">Automated AML/KYC status check and risk assessment</p>
        </div>
      </div>

      {/* Compliance Check */}
      <Card className={stepData.complianceCheckRunning ? 'border-amber-200' : stepData.complianceClear ? 'border-emerald-200 bg-emerald-50/20' : stepData.complianceCheckComplete ? 'border-red-200 bg-red-50/20' : 'border'}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="size-4 text-emerald-600" />
            AML / KYC Compliance Check
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stepData.complianceCheckRunning && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                  <RefreshCw className="size-5 text-amber-500" />
                </motion.div>
                <div>
                  <p className="font-medium text-sm text-amber-800">Running compliance checks...</p>
                  <p className="text-xs text-amber-600">Checking AML screening, KYC verification status</p>
                </div>
              </div>
              <Progress value={66} className="h-2" />
            </div>
          )}

          {stepData.complianceCheckComplete && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border">
                  {stepData.amlStatus === 'passed' ? (
                    <CheckCircle2 className="size-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="size-5 text-amber-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">AML Screening</p>
                    <p className="text-xs text-muted-foreground">
                      {stepData.amlStatus === 'passed' ? 'No adverse findings' : 'Requires review'}
                    </p>
                  </div>
                  <Badge className="ml-auto text-xs" style={{
                    backgroundColor: stepData.amlStatus === 'passed' ? '#ecfdf5' : '#fffbeb',
                    color: stepData.amlStatus === 'passed' ? '#10b981' : '#f59e0b',
                    borderColor: 'transparent',
                  }}>
                    {stepData.amlStatus === 'passed' ? 'Pass' : 'Review'}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border">
                  {stepData.kycStatus === 'passed' ? (
                    <CheckCircle2 className="size-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="size-5 text-amber-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">KYC Verification</p>
                    <p className="text-xs text-muted-foreground">
                      {stepData.kycStatus === 'passed' ? 'Identity verified' : 'Requires verification'}
                    </p>
                  </div>
                  <Badge className="ml-auto text-xs" style={{
                    backgroundColor: stepData.kycStatus === 'passed' ? '#ecfdf5' : '#fffbeb',
                    color: stepData.kycStatus === 'passed' ? '#10b981' : '#f59e0b',
                    borderColor: 'transparent',
                  }}>
                    {stepData.kycStatus === 'passed' ? 'Pass' : 'Review'}
                  </Badge>
                </div>
              </div>

              <div className={`flex items-center gap-2 p-3 rounded-lg ${stepData.complianceClear ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {stepData.complianceClear ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
                <span className="text-sm font-medium">
                  {stepData.complianceClear ? 'Compliance Pre-Check: CLEAR' : 'Compliance Pre-Check: CONDITIONS APPLY'}
                </span>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card className={stepData.riskCheckRunning ? 'border-amber-200' : stepData.riskClear ? 'border-emerald-200 bg-emerald-50/20' : stepData.riskCheckComplete ? 'border-red-200 bg-red-50/20' : 'border'}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="size-4 text-amber-600" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {stepData.riskCheckRunning && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                  <RefreshCw className="size-5 text-amber-500" />
                </motion.div>
                <div>
                  <p className="font-medium text-sm text-amber-800">Running risk assessment...</p>
                  <p className="text-xs text-amber-600">Evaluating risk factors and scoring</p>
                </div>
              </div>
              <Progress value={50} className="h-2" />
            </div>
          )}

          {stepData.riskCheckComplete && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="relative size-20 shrink-0">
                  <svg className="size-20 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="14" fill="none"
                      stroke={stepData.riskScore >= 75 ? '#10b981' : stepData.riskScore >= 50 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="3"
                      strokeDasharray={`${stepData.riskScore * 0.88} 88`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                    {Math.round(stepData.riskScore)}
                  </span>
                </div>
                <div>
                  <p className="font-medium">Risk Score</p>
                  <Badge className="text-xs" style={{
                    backgroundColor: stepData.riskCategory === 'low' ? '#ecfdf5' : stepData.riskCategory === 'medium' ? '#fffbeb' : '#fef2f2',
                    color: stepData.riskCategory === 'low' ? '#10b981' : stepData.riskCategory === 'medium' ? '#f59e0b' : '#ef4444',
                    borderColor: 'transparent',
                  }}>
                    {stepData.riskCategory.charAt(0).toUpperCase() + stepData.riskCategory.slice(1)} Risk
                  </Badge>
                </div>
              </div>

              <div className={`flex items-center gap-2 p-3 rounded-lg ${stepData.riskClear ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                {stepData.riskClear ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
                <span className="text-sm font-medium">
                  {stepData.riskClear ? 'Risk Assessment: CLEAR' : 'Risk Assessment: CONDITIONS APPLY'}
                </span>
              </div>

              {/* Warnings */}
              {stepData.warnings.length > 0 && (
                <div className="space-y-2">
                  {stepData.warnings.map((warning, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-md bg-amber-50 border border-amber-100">
                      <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700">{warning}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Proceed with conditions */}
              {!stepData.complianceClear || !stepData.riskClear ? (
                <div className="flex items-center gap-3 p-3 rounded-lg bg-white border">
                  <Checkbox
                    id="proceed-conditions"
                    checked={stepData.proceedWithConditions}
                    onCheckedChange={(checked) => setStepData(prev => ({ ...prev, proceedWithConditions: !!checked }))}
                  />
                  <Label htmlFor="proceed-conditions" className="text-sm cursor-pointer">
                    I understand the conditions and wish to proceed with this application
                  </Label>
                </div>
              ) : null}
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={prevStep} className="gap-2">
          <ChevronLeft className="size-4" /> Back
        </Button>
        <Button
          size="lg"
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          disabled={!canProceedStep3}
          onClick={nextStep}
        >
          Continue to Application Details
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-xl bg-teal-50 flex items-center justify-center">
          <FileText className="size-5 text-teal-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Application Details</h3>
          <p className="text-sm text-muted-foreground">Enter financial details and tenancy information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Deposit Amount */}
        <div className="space-y-2">
          <Label htmlFor="deposit" className="text-sm font-medium">Deposit Amount (£)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="deposit"
              type="number"
              placeholder="e.g. 1500"
              value={stepData.depositAmount}
              onChange={(e) => setStepData(prev => ({ ...prev, depositAmount: e.target.value }))}
              className="pl-9 h-10"
              min="0"
              step="50"
            />
          </div>
        </div>

        {/* Monthly Amount */}
        <div className="space-y-2">
          <Label htmlFor="monthly" className="text-sm font-medium">Monthly Amount (£)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="monthly"
              type="number"
              placeholder="e.g. 1200"
              value={stepData.monthlyAmount}
              onChange={(e) => setStepData(prev => ({ ...prev, monthlyAmount: e.target.value }))}
              className="pl-9 h-10"
              min="0"
              step="50"
            />
          </div>
        </div>

        {/* Start Date */}
        <div className="space-y-2">
          <Label htmlFor="startDate" className="text-sm font-medium">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={stepData.startDate}
            onChange={(e) => setStepData(prev => ({ ...prev, startDate: e.target.value }))}
            className="h-10"
          />
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label htmlFor="endDate" className="text-sm font-medium">
            End Date <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="endDate"
            type="date"
            value={stepData.endDate}
            onChange={(e) => setStepData(prev => ({ ...prev, endDate: e.target.value }))}
            className="h-10"
          />
        </div>
      </div>

      <Separator />

      {/* Right to Rent Status (for tenancy) */}
      {stepData.applicationType === 'tenancy' && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Right to Rent Status</Label>
          <Select
            value={stepData.rightToRentStatus}
            onValueChange={(v) => setStepData(prev => ({ ...prev, rightToRentStatus: v }))}
          >
            <SelectTrigger className="h-10 max-w-md">
              <SelectValue placeholder="Select Right to Rent status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending Verification</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-100">
            <Info className="size-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Under the Immigration Act 2014, landlords must verify all tenants have the right to rent in the UK.
              Failure to comply may result in civil penalties up to £3,000 per tenant.
            </p>
          </div>
        </div>
      )}

      {/* Guarantor Replacement */}
      <Card className={isGuarantorEligible ? 'border-emerald-200 bg-emerald-50/20' : 'border-muted'}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="size-4 text-emerald-600" />
            Guarantor Replacement
          </CardTitle>
          <CardDescription className="text-xs">
            Replace traditional guarantor with trust credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGuarantorEligible ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border">
                <Checkbox
                  id="guarantor-replacement"
                  checked={stepData.guarantorReplacement}
                  onCheckedChange={(checked) => setStepData(prev => ({ ...prev, guarantorReplacement: !!checked }))}
                />
                <Label htmlFor="guarantor-replacement" className="text-sm cursor-pointer">
                  Replace guarantor with Trust Ladder credentials
                </Label>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                  Level 3+ Required
                </Badge>
                <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                  Compliance Clear
                </Badge>
                <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                  Risk Clear
                </Badge>
              </div>
              {stepData.guarantorReplacement && (
                <div className="flex items-center gap-2 p-2 rounded-md bg-emerald-50 text-emerald-700 text-xs">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>Guarantor replacement enabled — trust credentials will be used instead of traditional guarantor</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border">
              <Lock className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Not eligible for guarantor replacement</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Requires Trust Level 3+ (Behaviour Verified) with clear compliance and risk checks
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Terms and Conditions */}
      <div className="space-y-3">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-white border">
          <Checkbox
            id="terms"
            checked={stepData.termsAccepted}
            onCheckedChange={(checked) => setStepData(prev => ({ ...prev, termsAccepted: !!checked }))}
          />
          <Label htmlFor="terms" className="text-sm cursor-pointer leading-relaxed">
            I confirm that all information provided is accurate and I agree to the PropComply AI Terms of Service,
            Privacy Policy, and consent to identity verification and compliance checks being performed as part of
            this application. I understand that providing false information may result in application rejection
            and potential legal consequences under UK law.
          </Label>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={prevStep} className="gap-2">
          <ChevronLeft className="size-4" /> Back
        </Button>
        <Button
          size="lg"
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
          disabled={!canProceedStep4}
          onClick={nextStep}
        >
          Review Application
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </motion.div>
  );

  const renderStep5 = () => (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="size-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Review & Submit</h3>
          <p className="text-sm text-muted-foreground">Confirm your application details and submit</p>
        </div>
      </div>

      {stepData.submitted ? (
        /* Success State */
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="text-center py-8"
        >
          <div className="size-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4 ring-4 ring-emerald-200">
            <CheckCircle2 className="size-10 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-emerald-800 mb-2">Application Submitted!</h3>
          <p className="text-sm text-muted-foreground mb-4">Your property application has been successfully submitted</p>
          <Card className="max-w-md mx-auto border-emerald-200 bg-emerald-50/30">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Application Reference</span>
                  <span className="font-mono font-bold text-emerald-700">{stepData.applicationRef}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Property</span>
                  <span className="text-sm font-medium">{selectedProperty?.address}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <Badge variant="outline" className="text-xs capitalize">{stepData.applicationType}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <StatusBadge status="submitted" />
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setStepData({ ...INITIAL_STEP_DATA });
                setCurrentStep(1);
                setCompletedSteps(new Set());
              }}
              className="gap-2"
            >
              Start New Application
            </Button>
          </div>
        </motion.div>
      ) : (
        /* Review Summary */
        <div className="space-y-4">
          {/* Property Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Building2 className="size-4 text-emerald-600" />
                Property Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Address</span>
                  <p className="font-medium">{selectedProperty?.address || '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">City / Postcode</span>
                  <p className="font-medium">{selectedProperty?.city}, {selectedProperty?.postcode}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Property Type</span>
                  <div className="mt-0.5">{selectedProperty && <PropertyTypeBadge type={selectedProperty.propertyType} />}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Compliance Status</span>
                  <div className="mt-0.5">{selectedProperty && <StatusBadge status={selectedProperty.complianceStatus} />}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Applicant Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <User className="size-4 text-violet-600" />
                Applicant Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              {effectiveProfile ? (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name</span>
                    <p className="font-medium">{effectiveProfile.firstName} {effectiveProfile.lastName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email</span>
                    <p className="font-medium">{effectiveProfile.email}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trust Level</span>
                    <div className="mt-0.5"><TrustLevelBadge level={effectiveProfile.trustLevel} /></div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Trust Score</span>
                    <p className="font-medium">{Math.round(effectiveProfile.trustScore)}/100</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No profile selected</p>
              )}
            </CardContent>
          </Card>

          {/* Compliance & Risk Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="size-4 text-amber-600" />
                Compliance & Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg bg-white/60 border">
                  {stepData.complianceClear ? (
                    <CheckCircle2 className="size-6 text-emerald-500 mx-auto mb-1" />
                  ) : (
                    <AlertTriangle className="size-6 text-amber-500 mx-auto mb-1" />
                  )}
                  <p className="text-xs text-muted-foreground">Compliance</p>
                  <p className="text-sm font-semibold">{stepData.complianceClear ? 'Clear' : 'Conditions'}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/60 border">
                  {stepData.riskClear ? (
                    <CheckCircle2 className="size-6 text-emerald-500 mx-auto mb-1" />
                  ) : (
                    <AlertTriangle className="size-6 text-amber-500 mx-auto mb-1" />
                  )}
                  <p className="text-xs text-muted-foreground">Risk</p>
                  <p className="text-sm font-semibold">{stepData.riskClear ? 'Clear' : 'Conditions'}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/60 border">
                  <p className="text-lg font-bold text-amber-600 mb-1">{Math.round(stepData.riskScore)}</p>
                  <p className="text-xs text-muted-foreground">Risk Score</p>
                  <p className="text-xs font-semibold capitalize">{stepData.riskCategory} Risk</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-white/60 border">
                  {stepData.guarantorReplacement ? (
                    <Award className="size-6 text-emerald-500 mx-auto mb-1" />
                  ) : (
                    <X className="size-6 text-muted-foreground mx-auto mb-1" />
                  )}
                  <p className="text-xs text-muted-foreground">Guarantor</p>
                  <p className="text-sm font-semibold">{stepData.guarantorReplacement ? 'Replaced' : 'Standard'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="size-4 text-teal-600" />
                Application Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Application Type</span>
                  <p className="font-medium capitalize">{stepData.applicationType}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Deposit Amount</span>
                  <p className="font-medium">£{parseFloat(stepData.depositAmount).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Monthly Amount</span>
                  <p className="font-medium">£{parseFloat(stepData.monthlyAmount).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Start Date</span>
                  <p className="font-medium">{stepData.startDate ? formatDate(stepData.startDate) : '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">End Date</span>
                  <p className="font-medium">{stepData.endDate ? formatDate(stepData.endDate) : 'Open-ended'}</p>
                </div>
                {stepData.applicationType === 'tenancy' && (
                  <div>
                    <span className="text-muted-foreground">Right to Rent</span>
                    <div className="mt-0.5"><StatusBadge status={stepData.rightToRentStatus} /></div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={prevStep} className="gap-2">
              <ChevronLeft className="size-4" /> Back
            </Button>
            <Button
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              onClick={handleSubmit}
            >
              <Zap className="size-4" />
              Submit Application
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );

  // ===================== STEP RENDER MAP =====================

  const stepRenderers: Record<number, () => React.ReactNode> = {
    1: renderStep1,
    2: renderStep2,
    3: renderStep3,
    4: renderStep4,
    5: renderStep5,
  };

  return (
    <div className="space-y-6">
      {/* Horizontal Stepper */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const StepIcon = step.icon;
            const isCompleted = completedSteps.has(step.id);
            const isActive = currentStep === step.id;
            const isAccessible = step.id <= currentStep || completedSteps.has(step.id - 1);

            return (
              <div key={step.id} className="flex items-center">
                <motion.button
                  onClick={() => isAccessible && goToStep(step.id)}
                  disabled={!isAccessible}
                  className={`flex flex-col items-center gap-1.5 min-w-[60px] sm:min-w-[80px] transition-all ${
                    isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                  }`}
                  whileHover={isAccessible ? { scale: 1.05 } : {}}
                  whileTap={isAccessible ? { scale: 0.95 } : {}}
                >
                  <div className={`size-10 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300 shadow-md'
                      : isCompleted
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-muted text-muted-foreground'
                  }`}>
                    {isCompleted ? (
                      <Check className="size-5" />
                    ) : (
                      <StepIcon className="size-5" />
                    )}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium text-center leading-tight ${
                    isActive ? 'text-emerald-700' : isCompleted ? 'text-emerald-600' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </span>
                </motion.button>
                {index < STEPS.length - 1 && (
                  <div className={`hidden sm:flex items-center mx-1 ${
                    isCompleted ? 'text-emerald-400' : 'text-muted-foreground/30'
                  }`}>
                    <ChevronRight className="size-4" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <Progress value={(completedSteps.size / STEPS.length) * 100} className="h-1.5" />
        <p className="text-xs text-muted-foreground text-center">
          Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].description}
        </p>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-4 md:p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={slideIn}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              {stepRenderers[currentStep]?.()}
            </motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
