'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserPlus,
  FileUp,
  ScanFace,
  TrendingUp,
  Globe,
  GitMerge,
  ShieldCheck,
  AlertTriangle,
  KeyRound,
  UserCheck,
  CheckCircle2,
  Circle,
  Clock,
  ChevronRight,
  ChevronLeft,
  Mail,
  Chrome,
  Monitor,
  Shield,
  Upload,
  FileText,
  CreditCard,
  Camera,
  Eye,
  BarChart3,
  Landmark,
  Fingerprint,
  Award,
  QrCode,
  Lock,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Building2,
  XCircle,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CountrySelect, { CountryNameSelect } from '@/components/ui/country-select';
import { getNationalityByCode } from '@/lib/countries';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WizardState {
  // Step 1
  email: string;
  firstName: string;
  lastName: string;
  nationality: string;
  registrationMethod: 'email' | 'google' | 'microsoft';
  mfaEnabled: boolean;
  accountCreated: boolean;
  // Step 2
  passportUploaded: boolean;
  visaUploaded: boolean;
  financialFilesUploaded: boolean;
  passportProgress: number;
  visaProgress: number;
  financialProgress: number;
  // Step 3
  selfieCaptured: boolean;
  livenessScore: number;
  faceMatchScore: number;
  deepfakeScore: number;
  biometricConfidence: number;
  biometricComplete: boolean;
  // Step 4
  financialMonths: 3 | 6 | 12 | 24;
  incomeStability: number;
  spendingCoherence: number;
  professionMatch: number;
  financialComplete: boolean;
  // Step 5
  sourceCountry: string;
  sourceCountryDbResult: 'pending' | 'verified' | 'failed' | 'not_available';
  homeOfficeResult: 'pending' | 'verified' | 'failed' | 'not_available';
  professionalRegistryResult: 'pending' | 'verified' | 'failed' | 'not_available';
  jurisdictionalComplete: boolean;
  // Step 6
  biometricDomainScore: number;
  behaviouralDomainScore: number;
  jurisdictionalDomainScore: number;
  overallConfidenceScore: number;
  fusionComplete: boolean;
  // Step 7
  gatewayPassed: boolean;
  gatewayResult: 'pending' | 'auto_certified' | 'manual_review';
  // Step 8
  identityRisk: number;
  amlRisk: number;
  financialRisk: number;
  tenancyRisk: number;
  riskComplete: boolean;
  // Step 9
  credentialIssued: boolean;
  credentialToken: string;
  credentialExpiry: string;
  // Step 10
  agentReviewStatus: 'pending' | 'in_review' | 'approved' | 'rejected' | 'more_evidence';
  reviewedBy: string;
}

// ─── Step Definitions ────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, title: 'Account Registration', icon: UserPlus, description: 'Register & MFA enforcement' },
  { id: 2, title: 'Identity Evidence', icon: FileUp, description: 'Upload identity documents' },
  { id: 3, title: 'Biometric Verification', icon: ScanFace, description: 'Liveness & face match' },
  { id: 4, title: 'Financial Behaviour', icon: TrendingUp, description: 'Financial data analysis' },
  { id: 5, title: 'Cross-Jurisdictional', icon: Globe, description: 'Multi-jurisdiction checks' },
  { id: 6, title: 'Triple Source Fusion', icon: GitMerge, description: 'Corroboration engine' },
  { id: 7, title: 'Confidence Gateway', icon: ShieldCheck, description: 'Score threshold check' },
  { id: 8, title: 'Risk Assessment', icon: AlertTriangle, description: 'Risk vector analysis' },
  { id: 9, title: 'Credential Issuance', icon: KeyRound, description: 'Generate & issue credential' },
  { id: 10, title: 'Agent Review', icon: UserCheck, description: 'Final digital review' },
];



// ─── Circular Gauge Component ────────────────────────────────────────────────

function CircularGauge({
  value,
  size = 120,
  strokeWidth = 8,
  color = '#10b981',
  label,
  sublabel,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
  sublabel?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center" style={{ width: size, height: size }}>
        <span className="text-2xl font-bold" style={{ color }}>{Math.round(value)}</span>
        {sublabel && <span className="text-[10px] text-muted-foreground">{sublabel}</span>}
      </div>
      {label && <span className="text-xs font-medium text-muted-foreground mt-1">{label}</span>}
    </div>
  );
}

// ─── Risk Gauge Component ────────────────────────────────────────────────────

function RiskGauge({ value, label }: { value: number; label: string }) {
  const getColor = (v: number) => {
    if (v >= 75) return '#10b981';
    if (v >= 50) return '#f59e0b';
    if (v >= 25) return '#f97316';
    return '#ef4444';
  };
  const getCategory = (v: number) => {
    if (v >= 75) return 'Low';
    if (v >= 50) return 'Medium';
    if (v >= 25) return 'High';
    return 'Critical';
  };

  const color = getColor(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Badge
          variant="outline"
          className="text-[10px] px-1.5 py-0"
          style={{ backgroundColor: color + '18', color, borderColor: color }}
        >
          {getCategory(value)}
        </Badge>
      </div>
      <div className="relative h-2 w-full rounded-full bg-muted">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <div className="text-right text-xs font-semibold" style={{ color }}>{value}/100</div>
    </div>
  );
}

// ─── Database Check Indicator ────────────────────────────────────────────────

function DbCheckIndicator({ label, result }: { label: string; result: string }) {
  const config: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
    verified: { icon: <CheckCircle2 className="size-4" />, color: '#10b981', bgColor: '#ecfdf5' },
    pending: { icon: <Clock className="size-4" />, color: '#f59e0b', bgColor: '#fffbeb' },
    failed: { icon: <AlertTriangle className="size-4" />, color: '#ef4444', bgColor: '#fef2f2' },
    not_available: { icon: <Circle className="size-4" />, color: '#94a3b8', bgColor: '#f1f5f9' },
  };
  const c = config[result] || config.pending;

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium" style={{ color: c.color }}>
          {result.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </span>
        <div className="flex size-7 items-center justify-center rounded-full" style={{ backgroundColor: c.bgColor, color: c.color }}>
          {c.icon}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function VerifyMeOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);

  const [state, setState] = useState<WizardState>({
    email: '',
    firstName: '',
    lastName: '',
    nationality: '',
    registrationMethod: 'email',
    mfaEnabled: false,
    accountCreated: false,
    passportUploaded: false,
    visaUploaded: false,
    financialFilesUploaded: false,
    passportProgress: 0,
    visaProgress: 0,
    financialProgress: 0,
    selfieCaptured: false,
    livenessScore: 0,
    faceMatchScore: 0,
    deepfakeScore: 0,
    biometricConfidence: 0,
    biometricComplete: false,
    financialMonths: 12,
    incomeStability: 0,
    spendingCoherence: 0,
    professionMatch: 0,
    financialComplete: false,
    sourceCountry: '',
    sourceCountryDbResult: 'pending',
    homeOfficeResult: 'pending',
    professionalRegistryResult: 'pending',
    jurisdictionalComplete: false,
    biometricDomainScore: 0,
    behaviouralDomainScore: 0,
    jurisdictionalDomainScore: 0,
    overallConfidenceScore: 0,
    fusionComplete: false,
    gatewayPassed: false,
    gatewayResult: 'pending',
    identityRisk: 0,
    amlRisk: 0,
    financialRisk: 0,
    tenancyRisk: 0,
    riskComplete: false,
    credentialIssued: false,
    credentialToken: '',
    credentialExpiry: '',
    agentReviewStatus: 'pending',
    reviewedBy: '',
  });

  const updateState = useCallback(<K extends keyof WizardState>(key: K, value: WizardState[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
  }, []);

  // ─── Step simulation functions ───────────────────────────────────────────

  const simulateUpload = useCallback((progressKey: keyof WizardState, completeKey: keyof WizardState) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        updateState(progressKey, 100 as WizardState[keyof WizardState]);
        updateState(completeKey, true as WizardState[keyof WizardState]);
      } else {
        updateState(progressKey, Math.round(progress) as WizardState[keyof WizardState]);
      }
    }, 300);
  }, [updateState]);

  const simulateBiometric = useCallback(() => {
    updateState('selfieCaptured', true);
    setTimeout(() => updateState('livenessScore', 94), 800);
    setTimeout(() => updateState('faceMatchScore', 91), 1600);
    setTimeout(() => updateState('deepfakeScore', 97), 2400);
    setTimeout(() => {
      const confidence = Math.round((94 * 0.35 + 91 * 0.35 + 97 * 0.3));
      updateState('biometricConfidence', confidence);
      updateState('biometricComplete', true);
    }, 3200);
  }, [updateState]);

  const simulateFinancial = useCallback(() => {
    setTimeout(() => updateState('incomeStability', 82), 600);
    setTimeout(() => updateState('spendingCoherence', 76), 1200);
    setTimeout(() => updateState('professionMatch', 88), 1800);
    setTimeout(() => updateState('financialComplete', true), 2400);
  }, [updateState]);

  const simulateJurisdictional = useCallback(() => {
    setTimeout(() => updateState('sourceCountryDbResult', 'verified'), 1000);
    setTimeout(() => updateState('homeOfficeResult', 'verified'), 2000);
    setTimeout(() => updateState('professionalRegistryResult', 'not_available'), 3000);
    setTimeout(() => updateState('jurisdictionalComplete', true), 3500);
  }, [updateState]);

  const simulateFusion = useCallback(() => {
    if (state.biometricComplete) {
      updateState('biometricDomainScore', state.biometricConfidence);
    } else {
      updateState('biometricDomainScore', 72);
    }
    setTimeout(() => {
      if (state.financialComplete) {
        updateState('behaviouralDomainScore', Math.round((state.incomeStability + state.spendingCoherence + state.professionMatch) / 3));
      } else {
        updateState('behaviouralDomainScore', 68);
      }
    }, 800);
    setTimeout(() => {
      const jurScore = state.sourceCountryDbResult === 'verified' ? 85 : state.sourceCountryDbResult === 'not_available' ? 55 : 40;
      updateState('jurisdictionalDomainScore', jurScore);
    }, 1600);
    setTimeout(() => {
      const overall = Math.round(
        state.biometricDomainScore * 0.35 +
        state.behaviouralDomainScore * 0.35 +
        (state.sourceCountryDbResult === 'verified' ? 85 : 55) * 0.30
      );
      updateState('overallConfidenceScore', overall);
      updateState('fusionComplete', true);
    }, 2400);
  }, [state.biometricComplete, state.biometricConfidence, state.financialComplete, state.incomeStability, state.spendingCoherence, state.professionMatch, state.sourceCountryDbResult, state.biometricDomainScore, state.behaviouralDomainScore, updateState]);

  const simulateGateway = useCallback(() => {
    const passed = state.overallConfidenceScore >= 80;
    updateState('gatewayPassed', passed);
    updateState('gatewayResult', passed ? 'auto_certified' : 'manual_review');
  }, [state.overallConfidenceScore, updateState]);

  const simulateRisk = useCallback(() => {
    setTimeout(() => updateState('identityRisk', 88), 400);
    setTimeout(() => updateState('amlRisk', 92), 800);
    setTimeout(() => updateState('financialRisk', 79), 1200);
    setTimeout(() => updateState('tenancyRisk', 85), 1600);
    setTimeout(() => updateState('riskComplete', true), 2000);
  }, [updateState]);

  const simulateCredential = useCallback(() => {
    const token = `VME-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiry = new Date();
    expiry.setFullYear(expiry.getFullYear() + 1);
    updateState('credentialIssued', true);
    updateState('credentialToken', token);
    updateState('credentialExpiry', expiry.toISOString().split('T')[0]);
  }, [updateState]);

  // ─── Auto-run simulations when entering steps ────────────────────────────

  useEffect(() => {
    if (currentStep === 3 && !state.selfieCaptured) {
      const timer = setTimeout(() => simulateBiometric(), 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, state.selfieCaptured, simulateBiometric]);

  useEffect(() => {
    if (currentStep === 4 && !state.financialComplete) {
      const timer = setTimeout(() => simulateFinancial(), 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, state.financialComplete, simulateFinancial]);

  useEffect(() => {
    if (currentStep === 5 && state.sourceCountry && !state.jurisdictionalComplete) {
      const timer = setTimeout(() => simulateJurisdictional(), 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, state.sourceCountry, state.jurisdictionalComplete, simulateJurisdictional]);

  useEffect(() => {
    if (currentStep === 6 && !state.fusionComplete) {
      const timer = setTimeout(() => simulateFusion(), 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, state.fusionComplete, simulateFusion]);

  useEffect(() => {
    if (currentStep === 7 && state.gatewayResult === 'pending') {
      const timer = setTimeout(() => simulateGateway(), 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, state.gatewayResult, simulateGateway]);

  useEffect(() => {
    if (currentStep === 8 && !state.riskComplete) {
      const timer = setTimeout(() => simulateRisk(), 500);
      return () => clearTimeout(timer);
    }
  }, [currentStep, state.riskComplete, simulateRisk]);

  useEffect(() => {
    if (currentStep === 9 && !state.credentialIssued) {
      const timer = setTimeout(() => simulateCredential(), 800);
      return () => clearTimeout(timer);
    }
  }, [currentStep, state.credentialIssued, simulateCredential]);

  // ─── Navigation ─────────────────────────────────────────────────────────

  const goNext = () => {
    if (currentStep < 10) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev + 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const goPrev = () => {
    if (currentStep > 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentStep(prev => prev - 1);
        setIsAnimating(false);
      }, 200);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return state.accountCreated;
      case 2: return state.passportUploaded;
      case 3: return state.biometricComplete;
      case 4: return state.financialComplete;
      case 5: return state.jurisdictionalComplete;
      case 6: return state.fusionComplete;
      case 7: return state.gatewayResult !== 'pending';
      case 8: return state.riskComplete;
      case 9: return state.credentialIssued;
      case 10: return state.agentReviewStatus === 'approved';
      default: return false;
    }
  };

  // ─── Step Content Renderers ─────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="Enter first name"
            value={state.firstName}
            onChange={e => updateState('firstName', e.target.value)}
            disabled={state.accountCreated}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Enter last name"
            value={state.lastName}
            onChange={e => updateState('lastName', e.target.value)}
            disabled={state.accountCreated}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="applicant@example.com"
          value={state.email}
          onChange={e => updateState('email', e.target.value)}
          disabled={state.accountCreated}
        />
      </div>
      <div className="space-y-2">
        <Label>Nationality</Label>
        <CountrySelect
          value={state.nationality}
          onValueChange={v => updateState('nationality', v)}
          placeholder="Search nationality..."
          disabled={state.accountCreated}
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <Label>Registration Method</Label>
        <RadioGroup
          value={state.registrationMethod}
          onValueChange={v => updateState('registrationMethod', v as WizardState['registrationMethod'])}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          disabled={state.accountCreated}
        >
          {[
            { value: 'email', label: 'Email', icon: <Mail className="size-4" />, desc: 'Standard email registration' },
            { value: 'google', label: 'Google', icon: <Chrome className="size-4" />, desc: 'Google SSO' },
            { value: 'microsoft', label: 'Microsoft', icon: <Monitor className="size-4" />, desc: 'Microsoft SSO' },
          ].map(method => (
            <label
              key={method.value}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                state.registrationMethod === method.value
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                  : 'hover:bg-muted/50'
              } ${state.accountCreated ? 'opacity-60 pointer-events-none' : ''}`}
            >
              <RadioGroupItem value={method.value} />
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{method.icon}</span>
                <div>
                  <div className="text-sm font-medium">{method.label}</div>
                  <div className="text-[10px] text-muted-foreground">{method.desc}</div>
                </div>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Shield className="size-4" />
          </div>
          <div>
            <div className="text-sm font-medium">Multi-Factor Authentication</div>
            <div className="text-xs text-muted-foreground">Enforce MFA for enhanced security</div>
          </div>
        </div>
        <Switch
          checked={state.mfaEnabled}
          onCheckedChange={v => updateState('mfaEnabled', v)}
          disabled={state.accountCreated}
        />
      </div>

      {!state.accountCreated ? (
        <Button
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={() => updateState('accountCreated', true)}
          disabled={!state.email || !state.firstName || !state.lastName}
        >
          <UserPlus className="mr-2 size-4" />
          Create Account
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 rounded-lg bg-emerald-50 border border-emerald-200 p-4"
        >
          <CheckCircle2 className="size-5 text-emerald-600" />
          <div>
            <div className="text-sm font-semibold text-emerald-800">Account Created Successfully</div>
            <div className="text-xs text-emerald-600">
              {state.mfaEnabled ? 'MFA is enabled — TOTP authenticator configured' : 'MFA is not enabled — consider enabling for security'}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-5">
      {[
        {
          key: 'passport' as const,
          label: 'Passport / Travel Document',
          desc: 'Biometric passport data page',
          icon: <FileText className="size-5" />,
          uploaded: state.passportUploaded,
          progress: state.passportProgress,
          uploadFn: () => simulateUpload('passportProgress', 'passportUploaded'),
          color: '#0d9488',
          bgColor: '#f0fdfa',
        },
        {
          key: 'visa' as const,
          label: 'Visa / Residence Permit',
          desc: 'UK visa or residence permit document',
          icon: <Globe className="size-5" />,
          uploaded: state.visaUploaded,
          progress: state.visaProgress,
          uploadFn: () => simulateUpload('visaProgress', 'visaUploaded'),
          color: '#f59e0b',
          bgColor: '#fffbeb',
        },
        {
          key: 'financial' as const,
          label: 'Financial Files',
          desc: 'Bank statements, payslips, tax returns',
          icon: <CreditCard className="size-5" />,
          uploaded: state.financialFilesUploaded,
          progress: state.financialProgress,
          uploadFn: () => simulateUpload('financialProgress', 'financialFilesUploaded'),
          color: '#8b5cf6',
          bgColor: '#f5f3ff',
        },
      ].map(doc => (
        <div key={doc.key} className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg" style={{ backgroundColor: doc.bgColor, color: doc.color }}>
                {doc.icon}
              </div>
              <div>
                <div className="text-sm font-medium">{doc.label}</div>
                <div className="text-xs text-muted-foreground">{doc.desc}</div>
              </div>
            </div>
            {doc.uploaded ? (
              <Badge className="text-[10px] bg-emerald-100 text-emerald-700 border-emerald-200">
                <CheckCircle2 className="mr-1 size-3" /> Uploaded
              </Badge>
            ) : doc.progress > 0 ? (
              <Badge className="text-[10px] bg-cyan-100 text-cyan-700 border-cyan-200">
                <Upload className="mr-1 size-3" /> Uploading...
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px]">Pending</Badge>
            )}
          </div>

          {doc.progress > 0 && !doc.uploaded && (
            <Progress value={doc.progress} className="h-2" />
          )}

          {!doc.uploaded && doc.progress === 0 && (
            <button
              onClick={doc.uploadFn}
              className="w-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-muted-foreground hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/30 transition-colors cursor-pointer"
            >
              <Upload className="size-6 mb-2" />
              <span className="text-sm font-medium">Click to upload or drag and drop</span>
              <span className="text-[10px] mt-1">PDF, JPG, PNG up to 10MB</span>
            </button>
          )}

          {doc.uploaded && (
            <div className="flex items-center gap-2 rounded-md bg-emerald-50/50 p-2 text-xs text-emerald-700">
              <FileText className="size-3" />
              <span>document_{doc.key}.pdf — {Math.round(Math.random() * 500 + 200)}KB</span>
            </div>
          )}
        </div>
      ))}

      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-xs text-amber-800">
            <strong>Required:</strong> At minimum, a passport or travel document must be uploaded to proceed. Visa/residence permit is required for non-UK/EU nationals.
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Selfie capture simulation */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="size-40 rounded-full border-4 border-dashed border-emerald-300 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 overflow-hidden">
            {state.selfieCaptured ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center"
              >
                <ScanFace className="size-12 text-emerald-600" />
                <CheckCircle2 className="size-5 text-emerald-500 -mt-1" />
              </motion.div>
            ) : (
              <div className="flex flex-col items-center text-muted-foreground">
                <Camera className="size-8 mb-1" />
                <span className="text-[10px]">Capturing...</span>
              </div>
            )}
          </div>
          {/* Animated scanning ring */}
          {state.selfieCaptured && !state.biometricComplete && (
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-emerald-400"
              animate={{ scale: [1, 1.1, 1], opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          )}
        </div>
        <span className="text-sm font-medium">
          {state.selfieCaptured ? 'Selfie captured — Processing biometrics...' : 'Initiating selfie capture...'}
        </span>
      </div>

      {/* Biometric scores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Liveness Detection', score: state.livenessScore, icon: <Eye className="size-4" />, color: '#10b981' },
          { label: 'Face Match Score', score: state.faceMatchScore, icon: <ScanFace className="size-4" />, color: '#0d9488' },
          { label: 'Deepfake Validation', score: state.deepfakeScore, icon: <Fingerprint className="size-4" />, color: '#06b6d4' },
        ].map(metric => (
          <div key={metric.label} className="rounded-lg border p-4 text-center space-y-2">
            <div className="flex items-center justify-center gap-2" style={{ color: metric.color }}>
              {metric.icon}
              <span className="text-xs font-medium">{metric.label}</span>
            </div>
            <div className="text-2xl font-bold" style={{ color: metric.color }}>
              {metric.score > 0 ? `${metric.score}%` : '—'}
            </div>
            <Progress value={metric.score} className="h-1.5" />
          </div>
        ))}
      </div>

      {/* Overall biometric confidence */}
      {state.biometricComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-lg border-2 border-emerald-200 bg-emerald-50/50 p-6"
        >
          <span className="text-sm font-medium text-emerald-800 mb-3">Biometric Confidence Score</span>
          <CircularGauge
            value={state.biometricConfidence}
            size={140}
            strokeWidth={10}
            color="#10b981"
            sublabel="Biometric"
          />
          <div className="mt-3 text-xs text-muted-foreground text-center">
            Weighted fusion: Liveness (35%) + Face Match (35%) + Deepfake (30%)
          </div>
        </motion.div>
      )}

      {/* Cryptographic cross-match note */}
      <div className="rounded-lg bg-teal-50 border border-teal-200 p-3">
        <div className="flex items-start gap-2">
          <Lock className="size-4 text-teal-600 mt-0.5 shrink-0" />
          <div className="text-xs text-teal-800">
            <strong>Cryptographic Cross-Match:</strong> Selfie biometric template is cryptographically compared against the passport photo chip data and UK visa biometric record. All biometric data is encrypted at rest using AES-256-GCM.
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Historical Financial Data Period</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[3, 6, 12, 24].map(months => (
            <button
              key={months}
              onClick={() => updateState('financialMonths', months as WizardState['financialMonths'])}
              className={`rounded-lg border p-3 text-center transition-all cursor-pointer ${
                state.financialMonths === months
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                  : 'hover:bg-muted/50'
              }`}
            >
              <div className="text-lg font-bold">{months}</div>
              <div className="text-[10px] text-muted-foreground">months</div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border p-4 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <BarChart3 className="size-4 text-emerald-600" />
          Financial Behaviour Analysis Results
        </div>

        {[
          { label: 'Income Stability', score: state.incomeStability, color: '#10b981', desc: 'Consistency of income over the analysis period' },
          { label: 'Spending Coherence', score: state.spendingCoherence, color: '#0d9488', desc: 'Spending patterns aligned with declared profile' },
          { label: 'Profession Match', score: state.professionMatch, color: '#06b6d4', desc: 'Financial data consistent with stated profession' },
        ].map(metric => (
          <div key={metric.label} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm">{metric.label}</span>
              <span className="text-xs text-muted-foreground">{metric.desc}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative h-2.5 flex-1 rounded-full bg-muted">
                <motion.div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{ backgroundColor: metric.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${metric.score}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <span className="text-sm font-semibold w-10 text-right" style={{ color: metric.color }}>
                {metric.score > 0 ? `${metric.score}%` : '—'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {state.financialComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 rounded-lg border p-4"
          style={{
            backgroundColor: ((state.incomeStability + state.spendingCoherence + state.professionMatch) / 3) >= 70 ? '#ecfdf5' : '#fffbeb',
            borderColor: ((state.incomeStability + state.spendingCoherence + state.professionMatch) / 3) >= 70 ? '#a7f3d0' : '#fde68a',
          }}
        >
          {((state.incomeStability + state.spendingCoherence + state.professionMatch) / 3) >= 70 ? (
            <CheckCircle2 className="size-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="size-5 text-amber-600" />
          )}
          <div>
            <div className="text-sm font-semibold">
              Coherence Result: {((state.incomeStability + state.spendingCoherence + state.professionMatch) / 3) >= 70 ? 'PASS' : 'REVIEW'}
            </div>
            <div className="text-xs text-muted-foreground">
              Average financial coherence: {Math.round((state.incomeStability + state.spendingCoherence + state.professionMatch) / 3)}% — {((state.incomeStability + state.spendingCoherence + state.professionMatch) / 3) >= 70 ? 'Financial behaviour is consistent with declared profile' : 'Some anomalies detected — manual review recommended'}
            </div>
          </div>
        </motion.div>
      )}

      <div className="rounded-lg bg-cyan-50 border border-cyan-200 p-3">
        <div className="flex items-start gap-2">
          <CreditCard className="size-4 text-cyan-600 mt-0.5 shrink-0" />
          <div className="text-xs text-cyan-800">
            <strong>Open Banking Integration:</strong> Financial data is ingested via secure Open Banking APIs (FCA regulated). All data is processed in compliance with UK GDPR and PSD2.
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Source Country for Database Verification</Label>
        <CountryNameSelect
          value={state.sourceCountry}
          onValueChange={v => updateState('sourceCountry', v)}
          placeholder="Search source country..."
        />
      </div>

      {state.sourceCountry && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className="text-sm font-medium flex items-center gap-2">
            <Globe className="size-4 text-teal-600" />
            Cross-Jurisdictional Validation Results
          </div>

          <DbCheckIndicator
            label={
              state.sourceCountry === 'NG' ? 'NIN (National Identification Number)' :
              state.sourceCountry === 'IN' ? 'Aadhaar Verification' :
              state.sourceCountry === 'PK' ? 'NADRA (National Database & Registration Authority)' :
              state.sourceCountry === 'BD' ? 'NID (National Identity Card)' :
              state.sourceCountry === 'GH' ? 'Ghana Card Verification' :
              state.sourceCountry === 'KE' ? 'Huduma Namba Verification' :
              state.sourceCountry === 'PH' ? 'PhilSys (Philippine Identification System)' :
              state.sourceCountry === 'CN' ? 'National ID Card (居民身份证)' :
              state.sourceCountry === 'BR' ? 'CPF (Cadastro de Pessoas Físicas)' :
              state.sourceCountry === 'AE' ? 'UAE National ID' :
              state.sourceCountry === 'SA' ? 'National ID (الهوية الوطنية)' :
              `National ID Database (${getNationalityByCode(state.sourceCountry)})`
            }
            result={state.sourceCountryDbResult}
          />
          <DbCheckIndicator label="UK Home Office Visa Grant Data" result={state.homeOfficeResult} />
          <DbCheckIndicator label="Professional / Academic Registry" result={state.professionalRegistryResult} />
        </motion.div>
      )}

      {state.jurisdictionalComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border p-4"
          style={{
            backgroundColor: state.sourceCountryDbResult === 'verified' ? '#ecfdf5' : '#fffbeb',
            borderColor: state.sourceCountryDbResult === 'verified' ? '#a7f3d0' : '#fde68a',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Landmark className="size-4 text-teal-600" />
            <span className="text-sm font-semibold">Jurisdictional Verification Summary</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {state.sourceCountryDbResult === 'verified' && state.homeOfficeResult === 'verified'
              ? 'Both source country database and UK Home Office records verified. Cross-jurisdictional identity confirmed.'
              : state.homeOfficeResult === 'verified'
              ? 'UK Home Office records verified. Source country database verification pending or unavailable.'
              : 'Partial verification — additional evidence may be required for full jurisdictional corroboration.'}
          </div>
        </motion.div>
      )}

      <div className="rounded-lg bg-teal-50 border border-teal-200 p-3">
        <div className="flex items-start gap-2">
          <Globe className="size-4 text-teal-600 mt-0.5 shrink-0" />
          <div className="text-xs text-teal-800">
            <strong>Cross-Jurisdictional:</strong> Source country databases are queried via secure inter-governmental data sharing agreements. UK Home Office validation uses the Visa Grant Database (VGD) and Immigration System records.
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        The Triple Source Corroboration Engine aggregates data from three independent domains and applies a weighted fusion algorithm to compute the overall Confidence Score.
      </div>

      {/* Three domain score cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: 'Biometric Domain',
            score: state.biometricDomainScore,
            weight: '35%',
            icon: <ScanFace className="size-5" />,
            color: '#10b981',
            bgColor: '#ecfdf5',
            items: ['Liveness Detection', 'Face Match', 'Deepfake Validation'],
          },
          {
            label: 'Behavioural Domain',
            score: state.behaviouralDomainScore,
            weight: '35%',
            icon: <TrendingUp className="size-5" />,
            color: '#0d9488',
            bgColor: '#f0fdfa',
            items: ['Income Stability', 'Spending Coherence', 'Profession Match'],
          },
          {
            label: 'Jurisdictional Domain',
            score: state.jurisdictionalDomainScore,
            weight: '30%',
            icon: <Globe className="size-5" />,
            color: '#06b6d4',
            bgColor: '#ecfeff',
            items: ['Source Country DB', 'Home Office', 'Professional Registry'],
          },
        ].map(domain => (
          <motion.div
            key={domain.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: domain.bgColor, color: domain.color }}>
                {domain.icon}
              </div>
              <div>
                <div className="text-sm font-medium">{domain.label}</div>
                <div className="text-[10px] text-muted-foreground">Weight: {domain.weight}</div>
              </div>
            </div>
            <div className="text-center">
              <span className="text-3xl font-bold" style={{ color: domain.color }}>
                {domain.score > 0 ? domain.score : '—'}
              </span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>
            <div className="space-y-1">
              {domain.items.map(item => (
                <div key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="size-1 rounded-full" style={{ backgroundColor: domain.color }} />
                  {item}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Fusion visualization */}
      {state.fusionComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-lg border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <GitMerge className="size-5 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-800">Weighted Fusion Result</span>
          </div>

          {/* Animated merging lines */}
          <div className="flex items-center gap-4 mb-4">
            {[state.biometricDomainScore, state.behaviouralDomainScore, state.jurisdictionalDomainScore].map((score, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.2 }}
                  className="flex size-10 items-center justify-center rounded-full bg-white border-2 shadow-sm text-xs font-bold"
                  style={{ borderColor: ['#10b981', '#0d9488', '#06b6d4'][i], color: ['#10b981', '#0d9488', '#06b6d4'][i] }}
                >
                  {score || '—'}
                </motion.div>
                <ArrowRight className="size-3 text-muted-foreground rotate-90" />
              </div>
            ))}
          </div>

          <CircularGauge
            value={state.overallConfidenceScore}
            size={160}
            strokeWidth={12}
            color={state.overallConfidenceScore >= 80 ? '#10b981' : state.overallConfidenceScore >= 60 ? '#f59e0b' : '#ef4444'}
            sublabel="Confidence"
          />

          <div className="mt-4 text-xs text-muted-foreground text-center max-w-sm">
            Fusion formula: (Biometric × 0.35) + (Behavioural × 0.35) + (Jurisdictional × 0.30) = <strong>{state.overallConfidenceScore}</strong>
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderStep7 = () => (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        The Confidence Gateway applies a threshold of 80 to the overall Confidence Score. Scores at or above 80 result in automatic certification; scores below 80 are routed to manual review.
      </div>

      {/* Large score display with threshold */}
      <div className="flex flex-col items-center rounded-lg border-2 p-8"
        style={{
          borderColor: state.gatewayResult === 'auto_certified' ? '#a7f3d0' : state.gatewayResult === 'manual_review' ? '#fde68a' : '#e2e8f0',
          backgroundColor: state.gatewayResult === 'auto_certified' ? '#ecfdf5' : state.gatewayResult === 'manual_review' ? '#fffbeb' : '#f8fafc',
        }}
      >
        <div className="text-sm font-medium text-muted-foreground mb-4">Overall Confidence Score</div>

        <div className="relative mb-6">
          <CircularGauge
            value={state.overallConfidenceScore}
            size={180}
            strokeWidth={14}
            color={state.overallConfidenceScore >= 80 ? '#10b981' : '#f59e0b'}
            sublabel="out of 100"
          />
        </div>

        {/* Threshold line */}
        <div className="w-full max-w-xs space-y-2">
          <div className="relative h-3 rounded-full bg-muted">
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{ backgroundColor: state.overallConfidenceScore >= 80 ? '#10b981' : '#f59e0b' }}
              initial={{ width: 0 }}
              animate={{ width: `${state.overallConfidenceScore}%` }}
              transition={{ duration: 1 }}
            />
            {/* Threshold marker at 80% */}
            <div className="absolute top-1/2 -translate-y-1/2" style={{ left: '80%' }}>
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-5 bg-red-400" />
                <span className="text-[9px] font-bold text-red-500 mt-0.5">80</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0</span>
            <span className="text-red-500 font-medium">Threshold: 80</span>
            <span>100</span>
          </div>
        </div>
      </div>

      {/* Gateway result */}
      {state.gatewayResult !== 'pending' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          {state.gatewayPassed ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-emerald-300 bg-emerald-50 p-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10, delay: 0.2 }}
                className="flex size-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg"
              >
                <Award className="size-8 text-white" />
              </motion.div>
              <div className="text-lg font-bold text-emerald-800">AUTO CERTIFIED</div>
              <div className="text-sm text-emerald-600 text-center">
                VerifyMe Global Certified — Confidence Score {state.overallConfidenceScore} meets the threshold of 80
              </div>
              <Badge className="bg-emerald-600 text-white px-4 py-1 text-sm">
                <Sparkles className="mr-1 size-4" /> VerifyMe Global Certified
              </Badge>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-lg border-2 border-amber-300 bg-amber-50 p-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10, delay: 0.2 }}
                className="flex size-16 items-center justify-center rounded-full bg-amber-500 shadow-lg"
              >
                <AlertTriangle className="size-8 text-white" />
              </motion.div>
              <div className="text-lg font-bold text-amber-800">MANUAL REVIEW REQUIRED</div>
              <div className="text-sm text-amber-600 text-center">
                Confidence Score {state.overallConfidenceScore} is below the threshold of 80. Application routed to Manual Review Workflow.
              </div>
              <div className="flex items-center gap-2 text-xs text-amber-700">
                <ArrowRight className="size-3" />
                Routed to: Compliance Review Queue
              </div>
            </div>
          )}
        </motion.div>
      )}

      <div className="rounded-lg bg-muted/50 p-3">
        <div className="text-xs text-muted-foreground">
          <strong>Gateway Logic:</strong> IF Score ≥ 80 → Auto-certified &quot;VerifyMe Global Certified&quot;. IF Score &lt; 80 → Routed to Manual Review Workflow with assigned compliance officer. The threshold is configurable per regulatory requirements.
        </div>
      </div>
    </div>
  );

  const renderStep8 = () => (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Explainable AI computes risk scores across four key vectors. Each score (0-100, where 100 = lowest risk) is generated with full evidence traceability and decision rationale.
      </div>

      {/* Four risk vector cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { label: 'Identity Risk', score: state.identityRisk, icon: <ScanFace className="size-5" />, color: '#0d9488', desc: 'Identity fraud probability & document authenticity' },
          { label: 'AML Risk', score: state.amlRisk, icon: <Shield className="size-5" />, color: '#10b981', desc: 'Anti-money laundering screening & source of funds' },
          { label: 'Financial Risk', score: state.financialRisk, icon: <CreditCard className="size-5" />, color: '#f59e0b', desc: 'Financial stability & payment reliability' },
          { label: 'Tenancy Risk', score: state.tenancyRisk, icon: <Building2 className="size-5" />, color: '#8b5cf6', desc: 'Tenancy default probability & rental history' },
        ].map(risk => (
          <motion.div
            key={risk.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-8 items-center justify-center rounded-lg" style={{ backgroundColor: risk.color + '18', color: risk.color }}>
                  {risk.icon}
                </div>
                <div>
                  <div className="text-sm font-medium">{risk.label}</div>
                  <div className="text-[10px] text-muted-foreground">{risk.desc}</div>
                </div>
              </div>
            </div>
            <RiskGauge value={risk.score} label="Score" />
          </motion.div>
        ))}
      </div>

      {/* Overall risk assessment */}
      {state.riskComplete && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border p-5"
        >
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="size-5 text-emerald-600" />
            <span className="text-sm font-semibold">Overall Risk Assessment</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            {[
              { label: 'Identity', score: state.identityRisk },
              { label: 'AML', score: state.amlRisk },
              { label: 'Financial', score: state.financialRisk },
              { label: 'Tenancy', score: state.tenancyRisk },
            ].map(r => (
              <div key={r.label} className="rounded-md bg-muted/50 p-2 text-center">
                <div className="text-lg font-bold" style={{ color: r.score >= 75 ? '#10b981' : r.score >= 50 ? '#f59e0b' : '#ef4444' }}>{r.score}</div>
                <div className="text-[10px] text-muted-foreground">{r.label}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Eye className="size-3" />
            <strong>Explainability:</strong> All risk scores are computed with full evidence traceability. Each factor contributing to the score can be audited, and the decision rationale is available for regulatory review.
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderStep9 = () => (
    <div className="space-y-6">
      {!state.credentialIssued ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          >
            <KeyRound className="size-10 text-emerald-500" />
          </motion.div>
          <span className="text-sm text-muted-foreground">Generating encrypted credential...</span>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-6"
        >
          {/* Credential generated animation */}
          <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              className="flex size-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg"
            >
              <KeyRound className="size-8 text-white" />
            </motion.div>
            <div className="text-lg font-bold text-emerald-800">Credential Generated & Issued</div>
            <div className="text-sm text-emerald-600 text-center">Secure portable identity profile created</div>
          </div>

          {/* Credential details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Lock className="size-4 text-emerald-600" />
                Encrypted Credential Token
              </div>
              <div className="rounded-md bg-muted p-3 font-mono text-xs break-all">
                {state.credentialToken}
              </div>
              <div className="text-[10px] text-muted-foreground">
                AES-256-GCM encrypted | SHA-256 hashed | Tamper-evident
              </div>
            </div>

            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <QrCode className="size-4 text-teal-600" />
                QR Code / Verification URL
              </div>
              <div className="flex items-center justify-center rounded-md bg-white border p-4 h-24">
                {/* QR code placeholder */}
                <div className="grid grid-cols-8 gap-0.5">
                  {Array.from({ length: 64 }).map((_, i) => (
                    <div
                      key={i}
                      className={`size-3 rounded-[1px] ${Math.random() > 0.4 ? 'bg-emerald-700' : 'bg-white'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground text-center">
                Scan to verify credential authenticity
              </div>
            </div>
          </div>

          {/* Portable identity profile summary */}
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <UserCheck className="size-4 text-teal-600" />
              Portable Identity Profile Summary
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Name', value: `${state.firstName} ${state.lastName}` },
                { label: 'Confidence', value: `${state.overallConfidenceScore}%` },
                { label: 'Certification', value: state.gatewayPassed ? 'Certified' : 'Under Review' },
                { label: 'Risk Level', value: Math.min(state.identityRisk, state.amlRisk, state.financialRisk, state.tenancyRisk) >= 75 ? 'Low' : 'Medium' },
              ].map(item => (
                <div key={item.label} className="rounded-md bg-muted/50 p-2">
                  <div className="text-[10px] text-muted-foreground">{item.label}</div>
                  <div className="text-sm font-semibold">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Expiry and validity */}
          <div className="flex items-center gap-4 rounded-lg border p-4">
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <Clock className="size-5" />
            </div>
            <div>
              <div className="text-sm font-medium">Credential Validity</div>
              <div className="text-xs text-muted-foreground">
                Issued: {new Date().toLocaleDateString('en-GB')} | Expires: {state.credentialExpiry} | Valid for 12 months from issuance
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderStep10 = () => (
    <div className="space-y-6">
      {/* Verification URL */}
      <div className="rounded-lg border p-4 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <ExternalLink className="size-4 text-teal-600" />
          Verification URL
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-md bg-muted p-2.5 font-mono text-xs break-all">
            https://verify.propcomply.ai/v/{state.credentialToken || 'pending'}
          </div>
          <Button size="sm" variant="outline" className="shrink-0">
            <ExternalLink className="size-3 mr-1" /> Copy
          </Button>
        </div>
        <div className="text-[10px] text-muted-foreground">
          This URL exposes the applicant&apos;s profile and verification status via the Property Compliance Portal
        </div>
      </div>

      {/* Agent review status */}
      <div className="rounded-lg border-2 p-6"
        style={{
          borderColor: state.agentReviewStatus === 'approved' ? '#a7f3d0' : state.agentReviewStatus === 'rejected' ? '#fecaca' : state.agentReviewStatus === 'in_review' ? '#bae6fd' : '#e2e8f0',
          backgroundColor: state.agentReviewStatus === 'approved' ? '#ecfdf5' : state.agentReviewStatus === 'rejected' ? '#fef2f2' : state.agentReviewStatus === 'in_review' ? '#f0f9ff' : '#f8fafc',
        }}
      >
        <div className="flex flex-col items-center gap-3">
          {state.agentReviewStatus === 'approved' ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="flex size-16 items-center justify-center rounded-full bg-emerald-500 shadow-lg"
              >
                <CheckCircle2 className="size-8 text-white" />
              </motion.div>
              <div className="text-lg font-bold text-emerald-800">APPROVED</div>
              <div className="text-sm text-emerald-600 text-center">
                Profile approved by letting agent / property manager. VerifyMe Global certification is now active.
              </div>
              <Badge className="bg-emerald-600 text-white px-4 py-1 text-sm">
                <Sparkles className="mr-1 size-4" /> Certification Active
              </Badge>
            </>
          ) : state.agentReviewStatus === 'rejected' ? (
            <>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex size-16 items-center justify-center rounded-full bg-red-500 shadow-lg"
              >
                <XCircle className="size-8 text-white" />
              </motion.div>
              <div className="text-lg font-bold text-red-800">REJECTED</div>
              <div className="text-sm text-red-600 text-center">
                Application rejected. Additional evidence or clarification may be required.
              </div>
            </>
          ) : state.agentReviewStatus === 'in_review' ? (
            <>
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex size-16 items-center justify-center rounded-full bg-sky-500 shadow-lg"
              >
                <Eye className="size-8 text-white" />
              </motion.div>
              <div className="text-lg font-bold text-sky-800">IN REVIEW</div>
              <div className="text-sm text-sky-600 text-center">
                Your profile is currently being reviewed by an agent. You will be notified of the decision.
              </div>
            </>
          ) : state.agentReviewStatus === 'more_evidence' ? (
            <>
              <div className="flex size-16 items-center justify-center rounded-full bg-amber-500 shadow-lg">
                <HelpCircle className="size-8 text-white" />
              </div>
              <div className="text-lg font-bold text-amber-800">MORE EVIDENCE NEEDED</div>
              <div className="text-sm text-amber-600 text-center">
                The reviewing agent has requested additional documentation. Please upload the requested evidence.
              </div>
            </>
          ) : (
            <>
              <div className="flex size-16 items-center justify-center rounded-full bg-slate-200">
                <Clock className="size-8 text-slate-500" />
              </div>
              <div className="text-lg font-bold text-slate-700">PENDING REVIEW</div>
              <div className="text-sm text-slate-500 text-center">
                Awaiting assignment to a letting agent or property manager for final digital review.
              </div>
            </>
          )}
        </div>
      </div>

      {/* Simulated agent review interface */}
      {state.agentReviewStatus !== 'approved' && state.agentReviewStatus !== 'rejected' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border p-4 space-y-3"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <UserCheck className="size-4 text-teal-600" />
            Agent Review Actions (Simulated)
          </div>
          <div className="text-xs text-muted-foreground">
            In production, these actions would be performed by an authorised letting agent or property manager via the Property Compliance Portal.
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                updateState('agentReviewStatus', 'in_review');
                setTimeout(() => {
                  updateState('agentReviewed', true);
                  updateState('agentDecision', 'approved');
                  updateState('reviewedBy', 'Agent Smith (Letting Agent)');
                  updateState('agentReviewStatus', 'approved');
                }, 2000);
              }}
              disabled={state.agentReviewStatus === 'in_review'}
            >
              <ThumbsUp className="mr-1 size-4" />
              {state.agentReviewStatus === 'in_review' ? 'Reviewing...' : 'Approve'}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                updateState('agentReviewStatus', 'rejected');
                updateState('agentReviewed', true);
                updateState('agentDecision', 'rejected');
                updateState('reviewedBy', 'Agent Smith (Letting Agent)');
              }}
            >
              <ThumbsDown className="mr-1 size-4" />
              Reject
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                updateState('agentReviewStatus', 'more_evidence');
              }}
            >
              <HelpCircle className="mr-1 size-4" />
              Request More Evidence
            </Button>
          </div>
        </motion.div>
      )}

      {/* Reviewed by info */}
      {state.reviewedBy && (
        <div className="rounded-lg bg-muted/50 p-3">
          <div className="text-xs text-muted-foreground">
            <strong>Reviewed by:</strong> {state.reviewedBy} | <strong>Decision:</strong> {state.agentDecision?.replace(/_/g, ' ')} | <strong>Date:</strong> {new Date().toLocaleDateString('en-GB')}
          </div>
        </div>
      )}
    </div>
  );

  // ─── Step renderer map ──────────────────────────────────────────────────

  const stepRenderers: Record<number, () => React.ReactNode> = {
    1: renderStep1,
    2: renderStep2,
    3: renderStep3,
    4: renderStep4,
    5: renderStep5,
    6: renderStep6,
    7: renderStep7,
    8: renderStep8,
    9: renderStep9,
    10: renderStep10,
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Left: Vertical Stepper */}
      <div className="lg:w-72 shrink-0">
        <Card className="lg:sticky lg:top-20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Onboarding Progress</CardTitle>
            <CardDescription>
              Step {currentStep} of 10 — {STEPS[currentStep - 1].title}
            </CardDescription>
            <Progress value={(currentStep / 10) * 100} className="h-2 mt-2" />
          </CardHeader>
          <CardContent>
            <nav className="space-y-1">
              {STEPS.map((step) => {
                const isCompleted = currentStep > step.id;
                const isCurrent = currentStep === step.id;
                const Icon = step.icon;

                return (
                  <button
                    key={step.id}
                    onClick={() => {
                      if (step.id <= currentStep) {
                        setIsAnimating(true);
                        setTimeout(() => {
                          setCurrentStep(step.id);
                          setIsAnimating(false);
                        }, 200);
                      }
                    }}
                    disabled={step.id > currentStep}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all ${
                      isCurrent
                        ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                        : isCompleted
                        ? 'text-emerald-600 hover:bg-emerald-50/50 cursor-pointer'
                        : 'text-muted-foreground opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex size-8 items-center justify-center rounded-full border-2 transition-all ${
                          isCompleted
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : isCurrent
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                            : 'border-muted-foreground/30 text-muted-foreground/50'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="size-4" />
                        ) : (
                          <Icon className="size-3.5" />
                        )}
                      </div>
                      {step.id < 10 && (
                        <div className={`w-0.5 h-4 mt-1 ${isCompleted ? 'bg-emerald-400' : 'bg-muted-foreground/15'}`} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-medium truncate">{step.title}</div>
                      <div className="text-[10px] text-muted-foreground truncate hidden sm:block">{step.description}</div>
                    </div>
                    {isCurrent && (
                      <span className="ml-auto size-1.5 rounded-full bg-emerald-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>
      </div>

      {/* Right: Step Content */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                    {(() => { const Icon = STEPS[currentStep - 1].icon; return <Icon className="size-5" />; })()}
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      Step {currentStep}: {STEPS[currentStep - 1].title}
                    </CardTitle>
                    <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {stepRenderers[currentStep]?.()}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="mr-1 size-4" />
            Previous
          </Button>

          <div className="flex items-center gap-1.5">
            {STEPS.map((step) => (
              <div
                key={step.id}
                className={`size-2 rounded-full transition-all ${
                  currentStep === step.id
                    ? 'bg-emerald-500 size-3'
                    : currentStep > step.id
                    ? 'bg-emerald-300'
                    : 'bg-muted-foreground/20'
                }`}
              />
            ))}
          </div>

          {currentStep < 10 ? (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={goNext}
              disabled={!canProceed() || isAnimating}
            >
              Next
              <ChevronRight className="ml-1 size-4" />
            </Button>
          ) : (
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={state.agentReviewStatus !== 'approved'}
              onClick={() => {
                // Complete - could navigate or show success
              }}
            >
              <Sparkles className="mr-1 size-4" />
              Complete Onboarding
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
