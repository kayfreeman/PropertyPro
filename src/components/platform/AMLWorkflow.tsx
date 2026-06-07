'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  FileCheck,
  UserCheck,
  Search,
  AlertTriangle,
  Landmark,
  Newspaper,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Loader2,
  Upload,
  DollarSign,
  Lock,
  Unlock,
  AlertOctagon,
  FileWarning,
  Ban,
  Eye,
  Fingerprint,
  Globe,
  Zap,
  Shield,
  Flag,
  BarChart3,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, formatDateTime } from '@/lib/platform-data';
import { useApi } from '@/hooks/use-api';
import { TRUST_LEVELS, getStatusStyle } from '@/lib/platform-data';
import { getNationalityByCode } from '@/lib/countries';

// ── Step Definitions ──────────────────────────────────────
const STEPS = [
  { id: 1, name: 'Transaction Init', shortName: 'Init', icon: FileText, color: '#0d9488' },
  { id: 2, name: 'Identity Verification', shortName: 'KYC', icon: Fingerprint, color: '#0891b2' },
  { id: 3, name: 'Customer Due Diligence', shortName: 'CDD', icon: UserCheck, color: '#059669' },
  { id: 4, name: 'Watchlist Screening', shortName: 'Screen', icon: Search, color: '#d97706' },
  { id: 5, name: 'SoF & EDD', shortName: 'EDD', icon: DollarSign, color: '#dc2626' },
  { id: 6, name: 'Compliance Decision', shortName: 'Decision', icon: ShieldCheck, color: '#7c3aed' },
  { id: 7, name: 'SAR Generation', shortName: 'SAR', icon: FileWarning, color: '#be185d' },
];

// ── Identity & Trust Profile Types (from API) ────────────────
interface IdentityProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  trustLevel: number;
  trustScore: number;
  status: string;
  nationality: string | null;
  credentials: { id: string; credentialType: string; verificationStatus: string; validTo: string | null }[];
  verifications: { id: string; verificationType: string; status: string; confidence: number; completedAt: string | null }[];
}

interface IdentitiesResponse {
  identities: IdentityProfile[];
  total: number;
}

// ── Types ─────────────────────────────────────────────────
type StepStatus = 'pending' | 'active' | 'completed' | 'failed';

interface TransactionData {
  reference: string;
  propertyRef: string;
  transactionType: string;
  amount: number;
  initialized: boolean;
  initializedAt: string | null;
}

interface IdentityData {
  selectedProfile: string | null;
  profileName: string;
  kycStatus: 'pending' | 'verified' | 'failed';
  trustLevel: number;
  verified: boolean;
}

interface CDDData {
  triggered: boolean;
  riskClassification: 'simplified' | 'standard' | 'enhanced';
  riskFactors: string[];
  complete: boolean;
}

interface ScreeningData {
  running: boolean;
  sanctions: { status: 'pending' | 'scanning' | 'clear' | 'match' | 'potential_match'; details: string[] };
  pep: { status: 'pending' | 'scanning' | 'clear' | 'match' | 'potential_match'; details: string[] };
  adverseMedia: { status: 'pending' | 'scanning' | 'clear' | 'match' | 'potential_match'; details: string[] };
  provider: string;
  completedAt: string | null;
}

interface EDDData {
  required: boolean;
  sofVerified: boolean;
  sourceOfFunds: string;
  documents: string[];
  eddChecks: Record<string, boolean>;
  complete: boolean;
}

interface DecisionData {
  result: 'pending' | 'cleared' | 'flagged' | 'locked_down';
  amlRiskScore: number;
  decidedBy: string;
  decidedAt: string | null;
}

interface SARData {
  generated: boolean;
  reference: string;
  filedAt: string | null;
  status: 'not_required' | 'draft' | 'filed' | 'acknowledged';
  findings: string[];
}

// ── Helpers ───────────────────────────────────────────────
function generateTransactionRef(): string {
  const prefix = 'AML';
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${ts}-${rand}`;
}

function generateSARRef(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `SAR-${ts}-${rand}`;
}

// ── AML Risk Score Gauge ─────────────────────────────────
function RiskScoreGauge({ score, size = 180 }: { score: number; size?: number }) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (s: number) => {
    if (s >= 75) return '#10b981';
    if (s >= 50) return '#f59e0b';
    if (s >= 25) return '#f97316';
    return '#ef4444';
  };

  const color = getColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl font-bold"
          style={{ color }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground font-medium">AML Risk Score</span>
      </div>
    </div>
  );
}

// ── Scanning Animation ────────────────────────────────────
function ScanningIndicator({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <Loader2 className="size-4 animate-spin" style={{ color }} />
      <span className="text-sm font-medium" style={{ color }}>{label}</span>
    </div>
  );
}

// ── Screening Result Badge ────────────────────────────────
function ScreeningBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string; label: string; icon: React.ReactNode }> = {
    pending: { color: '#94a3b8', bg: '#f1f5f9', label: 'Pending', icon: <Clock className="size-3.5" /> },
    scanning: { color: '#06b6d4', bg: '#ecfeff', label: 'Scanning', icon: <Loader2 className="size-3.5 animate-spin" /> },
    clear: { color: '#10b981', bg: '#ecfdf5', label: 'Clear', icon: <CheckCircle2 className="size-3.5" /> },
    match: { color: '#ef4444', bg: '#fef2f2', label: 'Match', icon: <XCircle className="size-3.5" /> },
    potential_match: { color: '#f59e0b', bg: '#fffbeb', label: 'Potential Match', icon: <AlertTriangle className="size-3.5" /> },
  };
  const c = config[status] || config.pending;
  return (
    <Badge className="text-xs font-medium border-0 gap-1" style={{ color: c.color, backgroundColor: c.bg }}>
      {c.icon}
      {c.label}
    </Badge>
  );
}

// ── Main Component ────────────────────────────────────────
export default function AMLWorkflow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepStatuses, setStepStatuses] = useState<Record<number, StepStatus>>({
    1: 'active', 2: 'pending', 3: 'pending', 4: 'pending', 5: 'pending', 6: 'pending', 7: 'pending',
  });

  // Fetch identity profiles from the Identity & Trust module
  const { data: identitiesData, isLoading: identitiesLoading } = useApi<IdentitiesResponse>('identities', '/api/identities');
  const identityProfiles = identitiesData?.identities ?? [];

  // Step data
  const [transaction, setTransaction] = useState<TransactionData>({
    reference: generateTransactionRef(),
    propertyRef: '',
    transactionType: '',
    amount: 0,
    initialized: false,
    initializedAt: null,
  });
  const [identity, setIdentity] = useState<IdentityData & { trustScore: number; nationality: string; verifications: { verificationType: string; status: string; confidence: number }[]; credentials: { credentialType: string; verificationStatus: string }[] }>({
    selectedProfile: null, profileName: '', kycStatus: 'pending', trustLevel: 0, verified: false,
    trustScore: 0, nationality: '', verifications: [], credentials: [],
  });
  const [cdd, setCDD] = useState<CDDData>({
    triggered: false, riskClassification: 'standard', riskFactors: [], complete: false,
  });
  const [screening, setScreening] = useState<ScreeningData>({
    running: false,
    sanctions: { status: 'pending', details: [] },
    pep: { status: 'pending', details: [] },
    adverseMedia: { status: 'pending', details: [] },
    provider: 'ComplyAdvantage',
    completedAt: null,
  });
  const [edd, setEDD] = useState<EDDData>({
    required: false, sofVerified: false, sourceOfFunds: '', documents: [], eddChecks: {}, complete: false,
  });
  const [decision, setDecision] = useState<DecisionData>({
    result: 'pending', amlRiskScore: 0, decidedBy: '', decidedAt: null,
  });
  const [sar, setSAR] = useState<SARData>({
    generated: false, reference: generateSARRef(), filedAt: null, status: 'not_required', findings: [],
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [screeningProgress, setScreeningProgress] = useState(0);

  // ── Step 1: Initialize Transaction ────────────────────
  const handleInitializeTransaction = useCallback(() => {
    setIsProcessing(true);
    setTimeout(() => {
      setTransaction(prev => ({
        ...prev,
        initialized: true,
        initializedAt: new Date().toISOString(),
      }));
      setStepStatuses(prev => ({ ...prev, 1: 'completed', 2: 'active' }));
      setCurrentStep(2);
      setIsProcessing(false);
    }, 1800);
  }, []);

  // ── Step 2: Identity Verification (feeds from Identity & Trust module) ──
  const handleVerifyIdentity = useCallback(() => {
    if (!identity.selectedProfile) return;
    setIsProcessing(true);
    setTimeout(() => {
      const profile = identityProfiles.find(p => p.id === identity.selectedProfile);
      if (profile) {
        const kycStatus = profile.status === 'verified' ? 'verified' as const : profile.status === 'rejected' || profile.status === 'failed' ? 'failed' as const : 'pending' as const;
        setIdentity(prev => ({
          ...prev,
          profileName: `${profile.firstName} ${profile.lastName}`,
          kycStatus,
          trustLevel: profile.trustLevel,
          trustScore: profile.trustScore,
          nationality: profile.nationality ?? '',
          verifications: profile.verifications.map(v => ({ verificationType: v.verificationType, status: v.status, confidence: v.confidence })),
          credentials: profile.credentials.map(c => ({ credentialType: c.credentialType, verificationStatus: c.verificationStatus })),
          verified: kycStatus === 'verified',
        }));
        if (kycStatus === 'verified') {
          setStepStatuses(prev => ({ ...prev, 2: 'completed', 3: 'active' }));
          setCurrentStep(3);
        }
      }
      setIsProcessing(false);
    }, 1500);
  }, [identity.selectedProfile, identityProfiles]);

  // ── Step 3: CDD ──────────────────────────────────────
  const handleTriggerCDD = useCallback(() => {
    setIsProcessing(true);
    setTimeout(() => {
      setCDD(prev => ({ ...prev, triggered: true }));
      setTimeout(() => {
        const hasHighRisk = identity.trustLevel < 2 || identity.kycStatus !== 'verified';
        const autoClassification = hasHighRisk ? 'enhanced' : 'standard';
        const autoFactors = hasHighRisk
          ? ['Low trust level', 'International transaction', 'High-value transaction']
          : ['Standard risk profile', 'Domestic transaction'];
        setCDD(prev => ({
          ...prev,
          riskClassification: autoClassification,
          riskFactors: autoFactors,
          complete: true,
        }));
        setStepStatuses(prev => ({ ...prev, 3: 'completed', 4: 'active' }));
        setCurrentStep(4);
        setIsProcessing(false);
      }, 2000);
    }, 800);
  }, [identity.trustLevel, identity.kycStatus]);

  // ── Step 4: Watchlist Screening ──────────────────────
  const handleRunScreening = useCallback(() => {
    setScreening(prev => ({ ...prev, running: true }));
    setScreeningProgress(0);

    // Phase 1: Sanctions
    setTimeout(() => {
      setScreening(prev => ({ ...prev, sanctions: { ...prev.sanctions, status: 'scanning' } }));
    }, 500);

    setTimeout(() => {
      setScreeningProgress(33);
      const sanctionResult = identity.trustLevel < 2 ? 'potential_match' : 'clear';
      setScreening(prev => ({
        ...prev,
        sanctions: {
          status: sanctionResult,
          details: sanctionResult === 'clear'
            ? ['OFAC SDN: No match', 'EU Consolidated: No match', 'UN Security Council: No match', 'HMT Sanctions: No match']
            : ['OFAC SDN: No match', 'EU Consolidated: No match', 'UN Security Council: Potential match found', 'HMT Sanctions: No match'],
        },
        pep: { ...prev.pep, status: 'scanning' },
      }));
    }, 2500);

    // Phase 2: PEP
    setTimeout(() => {
      setScreeningProgress(66);
      const pepResult = identity.trustLevel < 2 ? 'match' : 'clear';
      setScreening(prev => ({
        ...prev,
        pep: {
          status: pepResult,
          details: pepResult === 'clear'
            ? ['UK PEP Registry: No match', 'EU PEP Database: No match', 'Global PEP Watch: No match']
            : ['UK PEP Registry: No match', 'EU PEP Database: Match identified', 'Global PEP Watch: Associated match'],
        },
        adverseMedia: { ...prev.adverseMedia, status: 'scanning' },
      }));
    }, 4500);

    // Phase 3: Adverse Media
    setTimeout(() => {
      setScreeningProgress(100);
      const mediaResult = identity.trustLevel < 2 ? 'potential_match' : 'clear';
      setScreening(prev => ({
        ...prev,
        running: false,
        adverseMedia: {
          status: mediaResult,
          details: mediaResult === 'clear'
            ? ['Negative news: No results', 'Regulatory actions: None', 'Legal proceedings: None']
            : ['Negative news: 2 articles found', 'Regulatory actions: None', 'Legal proceedings: 1 pending case'],
        },
        completedAt: new Date().toISOString(),
      }));

      // Determine EDD requirement
      const hasMatch = sanctionResult !== 'clear' || pepResult !== 'clear' || mediaResult !== 'clear';
      setEDD(prev => ({ ...prev, required: hasMatch }));
      setStepStatuses(prev => ({ ...prev, 4: 'completed', 5: 'active' }));
      setCurrentStep(5);
    }, 6500);

    // Note: these values mirror the closure logic used inside timeouts above
    void (identity.trustLevel < 2 ? 'potential_match' : 'clear'); // sanctionResult
    void (identity.trustLevel < 2 ? 'match' : 'clear'); // pepResult
    void (identity.trustLevel < 2 ? 'potential_match' : 'clear'); // mediaResult
  }, [identity.trustLevel]);

  // ── Step 5: EDD ──────────────────────────────────────
  const handleCompleteEDD = useCallback(() => {
    setIsProcessing(true);
    setTimeout(() => {
      setEDD(prev => ({ ...prev, sofVerified: true, complete: true }));
      setStepStatuses(prev => ({ ...prev, 5: 'completed', 6: 'active' }));
      setCurrentStep(6);
      setIsProcessing(false);
    }, 1500);
  }, []);

  // ── Step 6: Compliance Decision ──────────────────────
  const handleComplianceDecision = useCallback(() => {
    setIsProcessing(true);
    setTimeout(() => {
      const hasSevereMatch = screening.sanctions.status === 'match' || screening.pep.status === 'match';
      const hasPotentialMatch = screening.sanctions.status === 'potential_match' || screening.pep.status === 'potential_match' || screening.adverseMedia.status === 'potential_match';

      let result: DecisionData;
      if (hasSevereMatch) {
        result = {
          result: 'locked_down',
          amlRiskScore: 15,
          decidedBy: 'AML System (Auto)',
          decidedAt: new Date().toISOString(),
        };
      } else if (hasPotentialMatch) {
        result = {
          result: 'flagged',
          amlRiskScore: 42,
          decidedBy: 'Compliance Officer — J. Morrison',
          decidedAt: new Date().toISOString(),
        };
      } else {
        result = {
          result: 'cleared',
          amlRiskScore: 85,
          decidedBy: 'AML System (Auto)',
          decidedAt: new Date().toISOString(),
        };
      }
      setDecision(result);
      setStepStatuses(prev => ({ ...prev, 6: 'completed', 7: 'active' }));
      setCurrentStep(7);
      setIsProcessing(false);
    }, 2000);
  }, [screening]);

  // ── Step 7: SAR Generation ──────────────────────────
  const handleGenerateSAR = useCallback(() => {
    setIsProcessing(true);
    setTimeout(() => {
      const findings: string[] = [];
      if (screening.sanctions.status === 'match' || screening.sanctions.status === 'potential_match') {
        findings.push('Sanctions watchlist potential match identified');
      }
      if (screening.pep.status === 'match' || screening.pep.status === 'potential_match') {
        findings.push('PEP registry match — politically exposed person association');
      }
      if (screening.adverseMedia.status === 'match' || screening.adverseMedia.status === 'potential_match') {
        findings.push('Adverse media monitoring returned negative news results');
      }
      if (edd.required) {
        findings.push('Enhanced due diligence triggered — source of funds verification incomplete');
      }
      findings.push(`Transaction amount: £${transaction.amount.toLocaleString()}`);

      setSAR(prev => ({
        ...prev,
        generated: true,
        filedAt: new Date().toISOString(),
        status: 'filed',
        findings,
      }));
      setStepStatuses(prev => ({ ...prev, 7: 'completed' }));
      setIsProcessing(false);
    }, 2000);
  }, [screening, edd.required, transaction.amount]);

  // ── Navigation ────────────────────────────────────────
  const canGoNext = () => {
    switch (currentStep) {
      case 1: return transaction.initialized;
      case 2: return identity.verified;
      case 3: return cdd.complete;
      case 4: return screening.completedAt !== null;
      case 5: return edd.complete || !edd.required;
      case 6: return decision.result !== 'pending';
      case 7: return true;
      default: return false;
    }
  };

  const canGoBack = () => currentStep > 1;

  // ── Render Step Content ──────────────────────────────
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <Step1Transaction
          transaction={transaction}
          setTransaction={setTransaction}
          onInitialize={handleInitializeTransaction}
          isProcessing={isProcessing}
        />;
      case 2:
        return <Step2Identity
          identity={identity}
          setIdentity={setIdentity}
          onVerify={handleVerifyIdentity}
          isProcessing={isProcessing}
          identityProfiles={identityProfiles}
          identitiesLoading={identitiesLoading}
        />;
      case 3:
        return <Step3CDD
          cdd={cdd}
          setCDD={setCDD}
          onTrigger={handleTriggerCDD}
          isProcessing={isProcessing}
        />;
      case 4:
        return <Step4Screening
          screening={screening}
          screeningProgress={screeningProgress}
          onRun={handleRunScreening}
        />;
      case 5:
        return <Step5EDD
          edd={edd}
          setEDD={setEDD}
          onComplete={handleCompleteEDD}
          isProcessing={isProcessing}
        />;
      case 6:
        return <Step6Decision
          decision={decision}
          screening={screening}
          onDecide={handleComplianceDecision}
          isProcessing={isProcessing}
          transaction={transaction}
          identity={identity}
        />;
      case 7:
        return <Step7SAR
          sar={sar}
          decision={decision}
          screening={screening}
          transaction={transaction}
          identity={identity}
          onGenerate={handleGenerateSAR}
          isProcessing={isProcessing}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Horizontal Pipeline Stepper ───────────────── */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
            {STEPS.map((step, idx) => {
              const status = stepStatuses[step.id];
              const isActive = currentStep === step.id;
              const isCompleted = status === 'completed';
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => {
                      if (isCompleted || isActive) setCurrentStep(step.id);
                    }}
                    className={`flex flex-col items-center gap-1.5 min-w-[60px] sm:min-w-[80px] group transition-all ${
                      isCompleted || isActive ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    <motion.div
                      className={`flex items-center justify-center rounded-full transition-all duration-300 ${
                        isActive
                          ? 'size-10 sm:size-12 ring-2 ring-offset-2'
                          : isCompleted
                          ? 'size-9 sm:size-10'
                          : 'size-8 sm:size-9 bg-muted'
                      }`}
                      style={{
                        backgroundColor: isActive ? step.color + '20' : isCompleted ? step.color : undefined,
                        borderColor: isActive ? step.color : undefined,
                        ringColor: isActive ? step.color : undefined,
                      }}
                      whileHover={isCompleted || isActive ? { scale: 1.1 } : {}}
                      whileTap={isCompleted || isActive ? { scale: 0.95 } : {}}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="size-5 text-white" />
                      ) : isActive ? (
                        <Icon className="size-5" style={{ color: step.color }} />
                      ) : (
                        <Icon className="size-4 text-muted-foreground" />
                      )}
                    </motion.div>
                    <span
                      className={`text-[10px] sm:text-xs font-medium text-center leading-tight ${
                        isActive ? '' : isCompleted ? 'text-emerald-700' : 'text-muted-foreground'
                      }`}
                      style={isActive ? { color: step.color } : undefined}
                    >
                      <span className="hidden sm:inline">{step.name}</span>
                      <span className="sm:hidden">{step.shortName}</span>
                    </span>
                    {isActive && (
                      <motion.div
                        className="h-0.5 w-8 rounded-full"
                        style={{ backgroundColor: step.color }}
                        layoutId="activeStepIndicator"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className="mx-1 sm:mx-2 mb-6">
                      <ChevronRight className={`size-4 ${isCompleted ? 'text-emerald-500' : 'text-muted-foreground/40'}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Overall Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Workflow Progress</span>
              <span>{Object.values(stepStatuses).filter(s => s === 'completed').length} / 7 steps complete</span>
            </div>
            <Progress
              value={(Object.values(stepStatuses).filter(s => s === 'completed').length / 7) * 100}
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Step Content ──────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>

      {/* ── Navigation Buttons ────────────────────────── */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          disabled={!canGoBack()}
          className="gap-2"
        >
          <ArrowLeft className="size-4" />
          Previous Step
        </Button>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            Step {currentStep} of 7
          </Badge>
        </div>
        <Button
          onClick={() => setCurrentStep(prev => Math.min(7, prev + 1))}
          disabled={!canGoNext() || currentStep >= 7}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          Next Step
          <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 1: Transaction Initialization
// ════════════════════════════════════════════════════════════
function Step1Transaction({
  transaction,
  setTransaction,
  onInitialize,
  isProcessing,
}: {
  transaction: TransactionData;
  setTransaction: React.Dispatch<React.SetStateAction<TransactionData>>;
  onInitialize: () => void;
  isProcessing: boolean;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-50">
              <FileText className="size-5 text-teal-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Transaction Initialization</CardTitle>
              <CardDescription>Create a unique transaction record for AML verification</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Transaction Reference</Label>
            <Input
              value={transaction.reference}
              readOnly
              className="bg-muted/50 font-mono text-sm"
            />
            <p className="text-[10px] text-muted-foreground">Auto-generated unique reference</p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Property Reference</Label>
            <Input
              placeholder="e.g., PROP-2024-00123"
              value={transaction.propertyRef}
              onChange={(e) => setTransaction(prev => ({ ...prev, propertyRef: e.target.value }))}
              disabled={transaction.initialized}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Transaction Type</Label>
            <Select
              value={transaction.transactionType}
              onValueChange={(val) => setTransaction(prev => ({ ...prev, transactionType: val }))}
              disabled={transaction.initialized}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select transaction type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="property_application">Property Application</SelectItem>
                <SelectItem value="real_estate_purchase">Real Estate Purchase</SelectItem>
                <SelectItem value="tenant_verification">Tenant Verification</SelectItem>
                <SelectItem value="landlord_registration">Landlord Registration</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Transaction Amount (£)</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="0.00"
                className="pl-9"
                value={transaction.amount || ''}
                onChange={(e) => setTransaction(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                disabled={transaction.initialized}
              />
            </div>
          </div>
          <Button
            onClick={onInitialize}
            disabled={isProcessing || transaction.initialized || !transaction.transactionType || !transaction.amount}
            className="w-full bg-teal-600 hover:bg-teal-700 gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Initializing Transaction...
              </>
            ) : transaction.initialized ? (
              <>
                <CheckCircle2 className="size-4" />
                Transaction Initialized
              </>
            ) : (
              <>
                <Zap className="size-4" />
                Initialize Transaction
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card className={transaction.initialized ? 'border-emerald-200 bg-emerald-50/30' : ''}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${transaction.initialized ? 'bg-emerald-100' : 'bg-muted'}`}>
              {transaction.initialized ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : (
                <Clock className="size-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">Transaction Summary</CardTitle>
              <CardDescription>
                {transaction.initialized ? 'Transaction created successfully' : 'Complete the form to initialize'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {transaction.initialized ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border p-3 bg-white">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Reference</p>
                  <p className="font-mono text-sm font-semibold mt-0.5">{transaction.reference}</p>
                </div>
                <div className="rounded-lg border p-3 bg-white">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Amount</p>
                  <p className="text-sm font-semibold mt-0.5">£{transaction.amount.toLocaleString()}</p>
                </div>
                <div className="rounded-lg border p-3 bg-white">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Type</p>
                  <p className="text-sm font-semibold mt-0.5 capitalize">{transaction.transactionType.replace(/_/g, ' ')}</p>
                </div>
                <div className="rounded-lg border p-3 bg-white">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Property Ref</p>
                  <p className="text-sm font-semibold mt-0.5">{transaction.propertyRef || 'N/A'}</p>
                </div>
              </div>
              <div className="rounded-lg border p-3 bg-white">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Initialized At</p>
                <p className="text-sm font-semibold mt-0.5">{transaction.initializedAt ? formatDateTime(transaction.initializedAt) : '—'}</p>
              </div>
              <Alert className="border-emerald-200 bg-emerald-50">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <AlertTitle className="text-emerald-800 text-sm">Transaction Ready</AlertTitle>
                <AlertDescription className="text-emerald-700 text-xs">
                  Proceed to identity verification integration.
                </AlertDescription>
              </Alert>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="size-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Fill in the transaction details and click Initialize</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 2: Identity Verification Integration (fed from Identity & Trust Module)
// ════════════════════════════════════════════════════════════
function Step2Identity({
  identity,
  setIdentity,
  onVerify,
  isProcessing,
  identityProfiles,
  identitiesLoading,
}: {
  identity: IdentityData & { trustScore: number; nationality: string; verifications: { verificationType: string; status: string; confidence: number }[]; credentials: { credentialType: string; verificationStatus: string }[] };
  setIdentity: React.Dispatch<React.SetStateAction<typeof identity>>;
  onVerify: () => void;
  isProcessing: boolean;
  identityProfiles: IdentityProfile[];
  identitiesLoading: boolean;
}) {
  const selectedApiProfile = identityProfiles.find(p => p.id === identity.selectedProfile);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Profile Selector */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-50">
              <Fingerprint className="size-5 text-cyan-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Identity Verification Integration</CardTitle>
              <CardDescription>Cross-reference verified identity from Identity & Trust module</CardDescription>
            </div>
          </div>
          {/* Identity Source Badge */}
          <div className="mt-2">
            <Badge className="text-[10px] gap-1 bg-teal-50 text-teal-700 border-teal-200 border">
              <ShieldCheck className="size-3" />
              Source: Identity & Trust Module
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Identity Profile</Label>
            {identitiesLoading ? (
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted/50">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading identity profiles...</span>
              </div>
            ) : (
              <Select
                value={identity.selectedProfile || ''}
                onValueChange={(val) => {
                  const profile = identityProfiles.find(p => p.id === val);
                  if (profile) {
                    const kycStatus = profile.status === 'verified' ? 'verified' as const : profile.status === 'rejected' || profile.status === 'failed' ? 'failed' as const : 'pending' as const;
                    setIdentity(prev => ({
                      ...prev,
                      selectedProfile: val,
                      profileName: `${profile.firstName} ${profile.lastName}`,
                      kycStatus,
                      trustLevel: profile.trustLevel,
                      trustScore: profile.trustScore,
                      nationality: profile.nationality ?? '',
                      verifications: profile.verifications.map(v => ({ verificationType: v.verificationType, status: v.status, confidence: v.confidence })),
                      credentials: profile.credentials.map(c => ({ credentialType: c.credentialType, verificationStatus: c.verificationStatus })),
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Search or select a profile..." />
                </SelectTrigger>
                <SelectContent>
                  {identityProfiles.length === 0 ? (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No identity profiles found. Create profiles in Identity & Trust first.
                    </div>
                  ) : (
                    identityProfiles.map((p) => {
                      const trustLevelData = TRUST_LEVELS[p.trustLevel] ?? TRUST_LEVELS[0];
                      return (
                        <SelectItem key={p.id} value={p.id}>
                          <div className="flex items-center gap-2">
                            <span>{p.firstName} {p.lastName}</span>
                            <Badge variant="outline" className="text-[10px] px-1" style={{ color: trustLevelData.color, borderColor: trustLevelData.color + '40', backgroundColor: trustLevelData.bgColor }}>
                              L{p.trustLevel}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] px-1" style={(() => { const s = getStatusStyle(p.status); return { color: s.color, borderColor: s.color + '40', backgroundColor: s.bgColor }; })()}>
                              {p.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Profile Preview - enriched with Identity & Trust data */}
          {identity.selectedProfile && selectedApiProfile && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">
                  {identity.profileName.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{identity.profileName}</p>
                  <p className="text-xs text-muted-foreground">{selectedApiProfile.email}</p>
                </div>
                <Badge className="text-[10px] gap-1 bg-teal-50 text-teal-700 border-teal-200 border shrink-0">
                  <ShieldCheck className="size-3" />
                  I&T Module
                </Badge>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">KYC Status</span>
                  <div className="mt-0.5">
                    <Badge
                      className="text-xs border-0"
                      style={{
                        color: identity.kycStatus === 'verified' ? '#10b981' : identity.kycStatus === 'failed' ? '#ef4444' : '#f59e0b',
                        backgroundColor: identity.kycStatus === 'verified' ? '#ecfdf5' : identity.kycStatus === 'failed' ? '#fef2f2' : '#fffbeb',
                      }}
                    >
                      {identity.kycStatus === 'verified' ? <CheckCircle2 className="size-3 mr-1" /> : identity.kycStatus === 'failed' ? <XCircle className="size-3 mr-1" /> : <Clock className="size-3 mr-1" />}
                      {identity.kycStatus.charAt(0).toUpperCase() + identity.kycStatus.slice(1)}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Trust Level</span>
                  <div className="mt-0.5">
                    <Badge className="text-xs border-0" style={{ color: (TRUST_LEVELS[identity.trustLevel] ?? TRUST_LEVELS[0]).color, backgroundColor: (TRUST_LEVELS[identity.trustLevel] ?? TRUST_LEVELS[0]).bgColor }}>
                      L{identity.trustLevel} — {(TRUST_LEVELS[identity.trustLevel] ?? TRUST_LEVELS[0]).name}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Trust Score</span>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Progress value={identity.trustScore} className="h-1.5 w-14" />
                    <span className="text-xs font-semibold">{identity.trustScore}</span>
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Nationality</span>
                  <div className="mt-0.5 text-xs font-medium">
                    {identity.nationality ? getNationalityByCode(identity.nationality) : '—'}
                  </div>
                </div>
              </div>

              {/* Verification records from Identity & Trust */}
              {identity.verifications.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-muted-foreground font-medium">Verification Records (from I&T Module)</span>
                  <div className="mt-1 space-y-1 max-h-24 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                    {identity.verifications.slice(0, 5).map((v, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{v.verificationType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                        <div className="flex items-center gap-1">
                          <Progress value={v.confidence} className="h-1 w-10" />
                          <span className="font-medium">{v.confidence}%</span>
                        </div>
                      </div>
                    ))}
                    {identity.verifications.length > 5 && (
                      <span className="text-[10px] text-muted-foreground">+{identity.verifications.length - 5} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* Credentials from Identity & Trust */}
              {identity.credentials.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-muted-foreground font-medium">Credentials (from I&T Module)</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {identity.credentials.slice(0, 4).map((c, i) => (
                      <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0" style={(() => { const s = getStatusStyle(c.verificationStatus); return { color: s.color, borderColor: s.color + '30', backgroundColor: s.bgColor }; })()}>
                        {c.credentialType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                    ))}
                    {identity.credentials.length > 4 && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{identity.credentials.length - 4}</Badge>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          <Button
            onClick={onVerify}
            disabled={isProcessing || !identity.selectedProfile || identity.verified}
            className="w-full bg-cyan-600 hover:bg-cyan-700 gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Verifying Identity...
              </>
            ) : identity.verified ? (
              <>
                <CheckCircle2 className="size-4" />
                Identity Verified
              </>
            ) : (
              <>
                <Shield className="size-4" />
                Verify Identity Integration
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Verification Result */}
      <Card className={identity.verified ? 'border-emerald-200 bg-emerald-50/30' : identity.kycStatus === 'failed' ? 'border-red-200 bg-red-50/30' : ''}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${identity.verified ? 'bg-emerald-100' : identity.kycStatus === 'failed' ? 'bg-red-100' : 'bg-muted'}`}>
              {identity.verified ? (
                <ShieldCheck className="size-5 text-emerald-600" />
              ) : identity.kycStatus === 'failed' ? (
                <AlertOctagon className="size-5 text-red-600" />
              ) : (
                <Fingerprint className="size-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">Verification Result</CardTitle>
              <CardDescription>
                {identity.verified ? 'Identity verified successfully' : identity.kycStatus === 'failed' ? 'Identity verification failed' : 'Awaiting verification'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {identity.selectedProfile ? (
            <div className="space-y-4">
              {/* KYC Status Indicators */}
              <div className="space-y-2">
                {[
                  { label: 'Document Verification', status: identity.kycStatus === 'verified' ? 'passed' : identity.kycStatus === 'failed' ? 'failed' : 'pending' },
                  { label: 'Biometric Check', status: identity.kycStatus === 'verified' ? 'passed' : identity.kycStatus === 'failed' ? 'failed' : 'pending' },
                  { label: 'Liveness Detection', status: identity.kycStatus === 'verified' ? 'passed' : 'pending' },
                  { label: 'Pep/Screening Baseline', status: identity.kycStatus === 'verified' ? 'passed' : 'pending' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{item.label}</span>
                    <Badge
                      className="text-xs border-0"
                      style={{
                        color: item.status === 'passed' ? '#10b981' : item.status === 'failed' ? '#ef4444' : '#f59e0b',
                        backgroundColor: item.status === 'passed' ? '#ecfdf5' : item.status === 'failed' ? '#fef2f2' : '#fffbeb',
                      }}
                    >
                      {item.status === 'passed' ? <CheckCircle2 className="size-3 mr-1" /> : item.status === 'failed' ? <XCircle className="size-3 mr-1" /> : <Clock className="size-3 mr-1" />}
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Badge>
                  </div>
                ))}
              </div>

              {/* Trust Level Badge */}
              <div className="rounded-lg border p-3 bg-white">
                <p className="text-xs text-muted-foreground mb-1">Trust Level Assessment</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Progress value={identity.trustLevel * 20} className="h-2" />
                  </div>
                  <Badge className="border-0 text-xs" style={{ color: '#0d9488', backgroundColor: '#f0fdfa' }}>
                    Level {identity.trustLevel} / 5
                  </Badge>
                </div>
              </div>

              {identity.verified && (
                <Alert className="border-emerald-200 bg-emerald-50">
                  <CheckCircle2 className="size-4 text-emerald-600" />
                  <AlertTitle className="text-emerald-800 text-sm">KYC Baseline Established</AlertTitle>
                  <AlertDescription className="text-emerald-700 text-xs">
                    Identity profile linked. Proceed to Customer Due Diligence.
                  </AlertDescription>
                </Alert>
              )}

              {identity.kycStatus === 'failed' && (
                <Alert className="border-red-200 bg-red-50">
                  <XCircle className="size-4 text-red-600" />
                  <AlertTitle className="text-red-800 text-sm">Verification Failed</AlertTitle>
                  <AlertDescription className="text-red-700 text-xs">
                    Identity could not be verified. Manual review required before proceeding.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Fingerprint className="size-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Select a profile to begin identity verification</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 3: Customer Due Diligence
// ════════════════════════════════════════════════════════════
function Step3CDD({
  cdd,
  setCDD,
  onTrigger,
  isProcessing,
}: {
  cdd: CDDData;
  setCDD: React.Dispatch<React.SetStateAction<CDDData>>;
  onTrigger: () => void;
  isProcessing: boolean;
}) {
  const riskFactorsList = [
    'High-value transaction',
    'International transaction',
    'Low trust level',
    'New customer relationship',
    'Cash-intensive business',
    'Complex ownership structure',
    'Sanctions-risk jurisdiction',
    'PEP association',
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50">
              <UserCheck className="size-5 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Customer Due Diligence</CardTitle>
              <CardDescription>Establish initial risk classification and CDD baseline</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!cdd.triggered ? (
            <Button onClick={onTrigger} disabled={isProcessing} className="w-full bg-emerald-600 hover:bg-emerald-700 gap-2">
              {isProcessing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Triggering CDD Assessment...
                </>
              ) : (
                <>
                  <UserCheck className="size-4" />
                  Trigger CDD Assessment
                </>
              )}
            </Button>
          ) : !cdd.complete ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-cyan-50 border border-cyan-200">
                <Loader2 className="size-5 text-cyan-600 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-cyan-800">CDD Assessment In Progress</p>
                  <p className="text-xs text-cyan-600">Analyzing risk factors and profile data...</p>
                </div>
              </div>
              <Progress value={65} className="h-2" />
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Risk Classification</Label>
                <Select
                  value={cdd.riskClassification}
                  onValueChange={(val) => setCDD(prev => ({ ...prev, riskClassification: val as 'simplified' | 'standard' | 'enhanced' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simplified">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-emerald-500" /> Simplified CDD
                      </span>
                    </SelectItem>
                    <SelectItem value="standard">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-amber-500" /> Standard CDD
                      </span>
                    </SelectItem>
                    <SelectItem value="enhanced">
                      <span className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-red-500" /> Enhanced CDD
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Risk Factors Identified</Label>
                <div className="space-y-2 rounded-lg border p-3 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                  {riskFactorsList.map((factor) => (
                    <div key={factor} className="flex items-center gap-2">
                      <Checkbox
                        id={`factor-${factor}`}
                        checked={cdd.riskFactors.includes(factor)}
                        onCheckedChange={(checked) => {
                          setCDD(prev => ({
                            ...prev,
                            riskFactors: checked
                              ? [...prev.riskFactors, factor]
                              : prev.riskFactors.filter(f => f !== factor),
                          }));
                        }}
                      />
                      <label htmlFor={`factor-${factor}`} className="text-sm cursor-pointer">{factor}</label>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* CDD Result */}
      <Card className={cdd.complete ? 'border-emerald-200 bg-emerald-50/30' : ''}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${cdd.complete ? 'bg-emerald-100' : 'bg-muted'}`}>
              {cdd.complete ? (
                <CheckCircle2 className="size-5 text-emerald-600" />
              ) : (
                <BarChart3 className="size-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <CardTitle className="text-lg">CDD Classification Result</CardTitle>
              <CardDescription>
                {cdd.complete ? 'Risk classification established' : 'Awaiting CDD assessment'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {cdd.complete ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="rounded-lg border-2 p-4" style={{
                borderColor: cdd.riskClassification === 'simplified' ? '#10b981' : cdd.riskClassification === 'standard' ? '#f59e0b' : '#ef4444',
                backgroundColor: cdd.riskClassification === 'simplified' ? '#ecfdf5' : cdd.riskClassification === 'standard' ? '#fffbeb' : '#fef2f2',
              }}>
                <div className="flex items-center gap-3 mb-2">
                  {cdd.riskClassification === 'simplified' ? <Shield className="size-6 text-emerald-600" /> :
                   cdd.riskClassification === 'standard' ? <AlertTriangle className="size-6 text-amber-600" /> :
                   <AlertOctagon className="size-6 text-red-600" />}
                  <div>
                    <p className="font-semibold capitalize">{cdd.riskClassification} CDD</p>
                    <p className="text-xs opacity-80">
                      {cdd.riskClassification === 'simplified' ? 'Low risk — simplified due diligence sufficient' :
                       cdd.riskClassification === 'standard' ? 'Medium risk — standard due diligence required' :
                       'High risk — enhanced due diligence mandatory'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Risk Factors</p>
                {cdd.riskFactors.map((factor, idx) => (
                  <motion.div
                    key={factor}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Flag className="size-3.5 text-amber-500" />
                    <span>{factor}</span>
                  </motion.div>
                ))}
              </div>

              <Alert className="border-emerald-200 bg-emerald-50">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <AlertTitle className="text-emerald-800 text-sm">CDD Complete</AlertTitle>
                <AlertDescription className="text-emerald-700 text-xs">
                  {cdd.riskClassification === 'enhanced'
                    ? 'Enhanced CDD classification — watchlist screening and EDD will be triggered.'
                    : 'Proceed to watchlist screening for global database checks.'}
                </AlertDescription>
              </Alert>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <BarChart3 className="size-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Trigger CDD assessment to establish risk classification</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 4: Watchlist Screening
// ════════════════════════════════════════════════════════════
function Step4Screening({
  screening,
  screeningProgress,
  onRun,
}: {
  screening: ScreeningData;
  screeningProgress: number;
  onRun: () => void;
}) {
  const screeningDatabases = [
    { name: 'OFAC SDN List', country: 'US', flag: '🇺🇸' },
    { name: 'EU Consolidated List', country: 'EU', flag: '🇪🇺' },
    { name: 'UN Security Council', country: 'UN', flag: '🇺🇳' },
    { name: 'HMT Sanctions List', country: 'UK', flag: '🇬🇧' },
  ];

  return (
    <div className="space-y-6">
      {/* Screening Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50">
                <Search className="size-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Watchlist Screening</CardTitle>
                <CardDescription>Automated screening across global databases, PEP registries, and adverse media</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                <Globe className="size-3 mr-1" />
                {screening.provider}
              </Badge>
              {!screening.running && !screening.completedAt && (
                <Button onClick={onRun} className="bg-amber-600 hover:bg-amber-700 gap-2">
                  <Search className="size-4" />
                  Run Screening
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        {screening.running && (
          <CardContent className="pb-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Screening Progress</span>
                <span>{screeningProgress}%</span>
              </div>
              <Progress value={screeningProgress} className="h-2" />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Three Screening Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sanctions Panel */}
        <Card className={`border-2 ${screening.sanctions.status === 'match' ? 'border-red-300' : screening.sanctions.status === 'potential_match' ? 'border-amber-300' : screening.sanctions.status === 'clear' ? 'border-emerald-200' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-red-100">
                  <Ban className="size-4 text-red-600" />
                </div>
                <CardTitle className="text-base">Sanctions</CardTitle>
              </div>
              <ScreeningBadge status={screening.sanctions.status} />
            </div>
            <CardDescription className="text-xs">OFAC, EU, UN, HMT watchlists</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {screeningDatabases.map((db) => (
                <div key={db.name} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{db.flag}</span>
                    <span className="text-xs font-medium">{db.name}</span>
                  </div>
                  {screening.sanctions.status === 'scanning' ? (
                    <Loader2 className="size-3.5 animate-spin text-cyan-500" />
                  ) : screening.sanctions.status === 'clear' ? (
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                  ) : screening.sanctions.status === 'match' ? (
                    <XCircle className="size-3.5 text-red-500" />
                  ) : screening.sanctions.status === 'potential_match' ? (
                    <AlertTriangle className="size-3.5 text-amber-500" />
                  ) : (
                    <Clock className="size-3.5 text-muted-foreground" />
                  )}
                </div>
              ))}
              {screening.sanctions.details.length > 0 && (
                <div className="mt-2 space-y-1">
                  {screening.sanctions.details.map((d, i) => (
                    <p key={i} className="text-[11px] text-muted-foreground">{d}</p>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PEP Panel */}
        <Card className={`border-2 ${screening.pep.status === 'match' ? 'border-red-300' : screening.pep.status === 'potential_match' ? 'border-amber-300' : screening.pep.status === 'clear' ? 'border-emerald-200' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-amber-100">
                  <Landmark className="size-4 text-amber-600" />
                </div>
                <CardTitle className="text-base">PEP Registry</CardTitle>
              </div>
              <ScreeningBadge status={screening.pep.status} />
            </div>
            <CardDescription className="text-xs">Politically Exposed Persons databases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {['UK PEP Registry', 'EU PEP Database', 'Global PEP Watch'].map((registry) => (
                <div key={registry} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <Landmark className="size-3 text-amber-500" />
                    <span className="text-xs font-medium">{registry}</span>
                  </div>
                  {screening.pep.status === 'scanning' ? (
                    <Loader2 className="size-3.5 animate-spin text-cyan-500" />
                  ) : screening.pep.status === 'clear' ? (
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                  ) : screening.pep.status === 'match' ? (
                    <XCircle className="size-3.5 text-red-500" />
                  ) : screening.pep.status === 'potential_match' ? (
                    <AlertTriangle className="size-3.5 text-amber-500" />
                  ) : (
                    <Clock className="size-3.5 text-muted-foreground" />
                  )}
                </div>
              ))}
              {screening.pep.details.length > 0 && (
                <div className="mt-2 space-y-1">
                  {screening.pep.details.map((d, i) => (
                    <p key={i} className="text-[11px] text-muted-foreground">{d}</p>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Adverse Media Panel */}
        <Card className={`border-2 ${screening.adverseMedia.status === 'match' ? 'border-red-300' : screening.adverseMedia.status === 'potential_match' ? 'border-amber-300' : screening.adverseMedia.status === 'clear' ? 'border-emerald-200' : ''}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-pink-100">
                  <Newspaper className="size-4 text-pink-600" />
                </div>
                <CardTitle className="text-base">Adverse Media</CardTitle>
              </div>
              <ScreeningBadge status={screening.adverseMedia.status} />
            </div>
            <CardDescription className="text-xs">News monitoring & negative press</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {['Negative News Scan', 'Regulatory Actions', 'Legal Proceedings'].map((source) => (
                <div key={source} className="flex items-center justify-between py-1.5 border-b last:border-0">
                  <div className="flex items-center gap-2">
                    <Newspaper className="size-3 text-pink-500" />
                    <span className="text-xs font-medium">{source}</span>
                  </div>
                  {screening.adverseMedia.status === 'scanning' ? (
                    <Loader2 className="size-3.5 animate-spin text-cyan-500" />
                  ) : screening.adverseMedia.status === 'clear' ? (
                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                  ) : screening.adverseMedia.status === 'match' ? (
                    <XCircle className="size-3.5 text-red-500" />
                  ) : screening.adverseMedia.status === 'potential_match' ? (
                    <AlertTriangle className="size-3.5 text-amber-500" />
                  ) : (
                    <Clock className="size-3.5 text-muted-foreground" />
                  )}
                </div>
              ))}
              {screening.adverseMedia.details.length > 0 && (
                <div className="mt-2 space-y-1">
                  {screening.adverseMedia.details.map((d, i) => (
                    <p key={i} className="text-[11px] text-muted-foreground">{d}</p>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Screening Timestamp */}
      {screening.completedAt && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Alert className={screening.sanctions.status === 'clear' && screening.pep.status === 'clear' && screening.adverseMedia.status === 'clear'
            ? 'border-emerald-200 bg-emerald-50'
            : 'border-amber-200 bg-amber-50'}>
            {screening.sanctions.status === 'clear' && screening.pep.status === 'clear' && screening.adverseMedia.status === 'clear'
              ? <CheckCircle2 className="size-4 text-emerald-600" />
              : <AlertTriangle className="size-4 text-amber-600" />}
            <AlertTitle className={screening.sanctions.status === 'clear' && screening.pep.status === 'clear' && screening.adverseMedia.status === 'clear'
              ? 'text-emerald-800 text-sm' : 'text-amber-800 text-sm'}>
              {screening.sanctions.status === 'clear' && screening.pep.status === 'clear' && screening.adverseMedia.status === 'clear'
                ? 'All Screenings Clear' : 'Screening Flags Detected'}
            </AlertTitle>
            <AlertDescription className={screening.sanctions.status === 'clear' && screening.pep.status === 'clear' && screening.adverseMedia.status === 'clear'
              ? 'text-emerald-700 text-xs' : 'text-amber-700 text-xs'}>
              Screening completed by {screening.provider} on {formatDateTime(screening.completedAt)}.
              {!(screening.sanctions.status === 'clear' && screening.pep.status === 'clear' && screening.adverseMedia.status === 'clear') &&
                ' Enhanced Due Diligence may be required.'}
            </AlertDescription>
          </Alert>
        </motion.div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 5: Source of Funds & Enhanced Due Diligence
// ════════════════════════════════════════════════════════════
function Step5EDD({
  edd,
  setEDD,
  onComplete,
  isProcessing,
}: {
  edd: EDDData;
  setEDD: React.Dispatch<React.SetStateAction<EDDData>>;
  onComplete: () => void;
  isProcessing: boolean;
}) {
  const eddChecks = [
    { id: 'identity_structure', label: 'Identity Structure Verification' },
    { id: 'source_wealth', label: 'Source of Wealth Verification' },
    { id: 'beneficial_ownership', label: 'Beneficial Ownership Analysis' },
    { id: 'transaction_pattern', label: 'Transaction Pattern Analysis' },
    { id: 'jurisdiction_risk', label: 'Jurisdiction Risk Assessment' },
    { id: 'business_relationship', label: 'Business Relationship Purpose' },
  ];

  const documentTypes = [
    'Bank Statements (6 months)',
    'Tax Returns',
    'Property Sale Agreement',
    'Investment Portfolio Statement',
    'Gift/Inheritance Declaration',
    'Business Financial Statements',
  ];

  if (!edd.required) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/30">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="size-16 text-emerald-500 mb-4" />
            <h3 className="text-lg font-semibold text-emerald-800">EDD Not Required</h3>
            <p className="text-sm text-emerald-700 mt-2 max-w-md">
              The watchlist screening returned clear results. Enhanced Due Diligence is not required for this transaction.
              You may proceed to the Compliance Decision step.
            </p>
            <Button
              onClick={onComplete}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 gap-2"
            >
              <CheckCircle2 className="size-4" />
              Proceed to Decision
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <DollarSign className="size-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Source of Funds & EDD</CardTitle>
              <CardDescription>High-risk signals detected — structural verification required</CardDescription>
            </div>
          </div>
          <Alert className="border-red-200 bg-red-50 mt-2">
            <AlertTriangle className="size-4 text-red-600" />
            <AlertTitle className="text-red-800 text-sm">EDD Escalation</AlertTitle>
            <AlertDescription className="text-red-700 text-xs">
              Watchlist screening triggered high-risk signals. Enhanced Due Diligence is mandatory under UK MLR 2017.
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Source of Funds Declaration</Label>
            <Select
              value={edd.sourceOfFunds}
              onValueChange={(val) => setEDD(prev => ({ ...prev, sourceOfFunds: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source of funds..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employment_income">Employment Income</SelectItem>
                <SelectItem value="property_sale">Property Sale Proceeds</SelectItem>
                <SelectItem value="investment_returns">Investment Returns</SelectItem>
                <SelectItem value="inheritance">Inheritance / Gift</SelectItem>
                <SelectItem value="business_profits">Business Profits</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
                <SelectItem value="other">Other (Specify)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Supporting Documents</Label>
            <div className="space-y-2 rounded-lg border p-3 max-h-40 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {documentTypes.map((doc) => (
                <div key={doc} className="flex items-center gap-2">
                  <Checkbox
                    id={`doc-${doc}`}
                    checked={edd.documents.includes(doc)}
                    onCheckedChange={(checked) => {
                      setEDD(prev => ({
                        ...prev,
                        documents: checked
                          ? [...prev.documents, doc]
                          : prev.documents.filter(d => d !== doc),
                      }));
                    }}
                  />
                  <label htmlFor={`doc-${doc}`} className="text-sm cursor-pointer flex items-center gap-1.5">
                    <Upload className="size-3 text-muted-foreground" />
                    {doc}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* EDD Checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50">
              <FileCheck className="size-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg">EDD Structural Verification</CardTitle>
              <CardDescription>Complete all required verification items</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {eddChecks.map((check) => (
              <div key={check.id} className="flex items-center gap-3 p-2 rounded-lg border">
                <Checkbox
                  id={check.id}
                  checked={edd.eddChecks[check.id] || false}
                  onCheckedChange={(checked) => {
                    setEDD(prev => ({
                      ...prev,
                      eddChecks: { ...prev.eddChecks, [check.id]: !!checked },
                    }));
                  }}
                />
                <label htmlFor={check.id} className="text-sm cursor-pointer flex-1">{check.label}</label>
                {edd.eddChecks[check.id] ? (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                ) : (
                  <Clock className="size-4 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-muted-foreground">
              {Object.values(edd.eddChecks).filter(Boolean).length} / {eddChecks.length} items verified
            </span>
            <Progress
              value={(Object.values(edd.eddChecks).filter(Boolean).length / eddChecks.length) * 100}
              className="h-1.5 w-24"
            />
          </div>

          <Button
            onClick={onComplete}
            disabled={isProcessing || !edd.sourceOfFunds || Object.values(edd.eddChecks).filter(Boolean).length < 4}
            className="w-full bg-amber-600 hover:bg-amber-700 gap-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Completing EDD...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-4" />
                Complete EDD Verification
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 6: Compliance Decision Routing
// ════════════════════════════════════════════════════════════
function Step6Decision({
  decision,
  screening,
  onDecide,
  isProcessing,
  transaction,
  identity,
}: {
  decision: DecisionData;
  screening: ScreeningData;
  onDecide: () => void;
  isProcessing: boolean;
  transaction: TransactionData;
  identity: IdentityData;
}) {
  const hasSevereMatch = screening.sanctions.status === 'match' || screening.pep.status === 'match';

  return (
    <div className="space-y-6">
      {/* Decision Visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Branch A: Severe Match */}
        <Card className={`border-2 ${hasSevereMatch ? 'border-red-300 bg-red-50/30' : 'border-muted bg-muted/20 opacity-50'}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${hasSevereMatch ? 'bg-red-100' : 'bg-muted'}`}>
                <Lock className={`size-5 ${hasSevereMatch ? 'text-red-600' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <CardTitle className="text-lg">Branch A: Lockdown</CardTitle>
                <CardDescription>Severe risk match detected</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertOctagon className="size-5" />
                  <span className="font-semibold text-sm">Lockdown Alert</span>
                </div>
                <p className="text-xs text-red-700">
                  Sanctions or PEP match identified. Profile must be locked down and routed to Case Management for immediate investigation.
                </p>
                <div className="space-y-1 mt-2">
                  {screening.sanctions.status === 'match' && (
                    <Badge className="text-xs border-0 bg-red-100 text-red-800">
                      <XCircle className="size-3 mr-1" /> Sanctions Match
                    </Badge>
                  )}
                  {screening.pep.status === 'match' && (
                    <Badge className="text-xs border-0 bg-red-100 text-red-800">
                      <XCircle className="size-3 mr-1" /> PEP Match
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Action: Freeze transaction, escalate to MLRO, route to Case Management
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Branch B: Clean */}
        <Card className={`border-2 ${!hasSevereMatch ? 'border-emerald-300 bg-emerald-50/30' : 'border-muted bg-muted/20 opacity-50'}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${!hasSevereMatch ? 'bg-emerald-100' : 'bg-muted'}`}>
                <Unlock className={`size-5 ${!hasSevereMatch ? 'text-emerald-600' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <CardTitle className="text-lg">Branch B: Clearance</CardTitle>
                <CardDescription>No severe risk — assign AML risk score</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 className="size-5" />
                  <span className="font-semibold text-sm">Compliance Clearance</span>
                </div>
                <p className="text-xs text-emerald-700">
                  No severe risk matches. Assign AML risk score and issue compliance clearance decision.
                </p>
                <div className="space-y-1 mt-2">
                  {screening.sanctions.status === 'clear' && (
                    <Badge className="text-xs border-0 bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="size-3 mr-1" /> Sanctions Clear
                    </Badge>
                  )}
                  {screening.pep.status === 'clear' && (
                    <Badge className="text-xs border-0 bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="size-3 mr-1" /> PEP Clear
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Action: Assign AML risk score, issue clearance, proceed
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Identity & Trust Module Feed Summary */}
      {identity.selectedProfile && (
        <Card className="border-teal-200 bg-teal-50/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-100">
                <ShieldCheck className="size-5 text-teal-600" />
              </div>
              <div>
                <CardTitle className="text-base">Identity & Trust Module Feed</CardTitle>
                <CardDescription>Data sourced from the Identity & Trust verification module</CardDescription>
              </div>
              <Badge className="ml-auto text-[10px] gap-1 bg-teal-50 text-teal-700 border-teal-200 border">
                <ShieldCheck className="size-3" />
                Live Feed
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border bg-white p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Subject</p>
                <p className="text-sm font-semibold mt-0.5">{identity.profileName || '—'}</p>
              </div>
              <div className="rounded-lg border bg-white p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Trust Level</p>
                <div className="mt-0.5">
                  <Badge className="text-[10px] border-0" style={{ color: (TRUST_LEVELS[identity.trustLevel] ?? TRUST_LEVELS[0]).color, backgroundColor: (TRUST_LEVELS[identity.trustLevel] ?? TRUST_LEVELS[0]).bgColor }}>
                    L{identity.trustLevel} — {(TRUST_LEVELS[identity.trustLevel] ?? TRUST_LEVELS[0]).name}
                  </Badge>
                </div>
              </div>
              <div className="rounded-lg border bg-white p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">KYC Status</p>
                <div className="mt-0.5">
                  <Badge className="text-[10px] border-0" style={{
                    color: identity.kycStatus === 'verified' ? '#10b981' : identity.kycStatus === 'failed' ? '#ef4444' : '#f59e0b',
                    backgroundColor: identity.kycStatus === 'verified' ? '#ecfdf5' : identity.kycStatus === 'failed' ? '#fef2f2' : '#fffbeb',
                  }}>
                    {identity.kycStatus.charAt(0).toUpperCase() + identity.kycStatus.slice(1)}
                  </Badge>
                </div>
              </div>
              <div className="rounded-lg border bg-white p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk Influence</p>
                <p className="text-xs font-medium mt-0.5 text-muted-foreground">
                  {identity.trustLevel >= 3 ? 'Low risk (high trust)' : identity.trustLevel >= 1 ? 'Standard risk' : 'High risk (low trust)'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decision Action */}
      {decision.result === 'pending' ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              <ShieldCheck className="size-12 text-violet-500" />
              <h3 className="text-lg font-semibold">Ready for Compliance Decision</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                Based on the screening results and due diligence findings, the system will determine the appropriate compliance routing.
              </p>
              <Button
                onClick={onDecide}
                disabled={isProcessing}
                className="bg-violet-600 hover:bg-violet-700 gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing Decision...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="size-4" />
                    Route Compliance Decision
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className={`border-2 ${decision.result === 'locked_down' ? 'border-red-300' : decision.result === 'cleared' ? 'border-emerald-300' : 'border-amber-300'}`}>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                {/* Risk Score Gauge */}
                <div className="flex flex-col items-center">
                  <RiskScoreGauge score={decision.amlRiskScore} />
                  <div className="mt-2 text-center">
                    <Badge
                      className="text-xs border-0 font-semibold"
                      style={{
                        color: decision.amlRiskScore >= 75 ? '#10b981' : decision.amlRiskScore >= 50 ? '#f59e0b' : decision.amlRiskScore >= 25 ? '#f97316' : '#ef4444',
                        backgroundColor: decision.amlRiskScore >= 75 ? '#ecfdf5' : decision.amlRiskScore >= 50 ? '#fffbeb' : decision.amlRiskScore >= 25 ? '#fff7ed' : '#fef2f2',
                      }}
                    >
                      {decision.amlRiskScore >= 75 ? 'Low Risk' : decision.amlRiskScore >= 50 ? 'Medium Risk' : decision.amlRiskScore >= 25 ? 'High Risk' : 'Critical Risk'}
                    </Badge>
                  </div>
                </div>

                {/* Decision Details */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {decision.result === 'cleared' ? 'Compliance Clearance Granted' :
                       decision.result === 'locked_down' ? 'Profile Locked Down' :
                       'Flagged for Review'}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {decision.result === 'cleared' ? 'Transaction cleared for processing.' :
                       decision.result === 'locked_down' ? 'Profile frozen — routed to Case Management.' :
                       'Requires manual compliance officer review.'}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Decision</span>
                      <Badge className="border-0 text-xs" style={{
                        color: decision.result === 'cleared' ? '#10b981' : decision.result === 'locked_down' ? '#ef4444' : '#f59e0b',
                        backgroundColor: decision.result === 'cleared' ? '#ecfdf5' : decision.result === 'locked_down' ? '#fef2f2' : '#fffbeb',
                      }}>
                        {decision.result.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Decided By</span>
                      <span className="font-medium">{decision.decidedBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Timestamp</span>
                      <span>{decision.decidedAt ? formatDateTime(decision.decidedAt) : '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Transaction</span>
                      <span className="font-mono text-xs">{transaction.reference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profile</span>
                      <span>{identity.profileName}</span>
                    </div>
                  </div>

                  {decision.result === 'cleared' && (
                    <Alert className="border-emerald-200 bg-emerald-50">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      <AlertTitle className="text-emerald-800 text-sm">Compliance Clearance Certificate</AlertTitle>
                      <AlertDescription className="text-emerald-700 text-xs">
                        AML verification complete. Clearance certificate issued for transaction {transaction.reference}.
                      </AlertDescription>
                    </Alert>
                  )}

                  {decision.result === 'locked_down' && (
                    <Alert className="border-red-200 bg-red-50">
                      <Lock className="size-4 text-red-600" />
                      <AlertTitle className="text-red-800 text-sm">Profile Lockdown Active</AlertTitle>
                      <AlertDescription className="text-red-700 text-xs">
                        All associated accounts frozen. Case Management notified. SAR generation mandatory.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// STEP 7: SAR Generation
// ════════════════════════════════════════════════════════════
function Step7SAR({
  sar,
  decision,
  screening,
  transaction,
  identity,
  onGenerate,
  isProcessing,
}: {
  sar: SARData;
  decision: DecisionData;
  screening: ScreeningData;
  transaction: TransactionData;
  identity: IdentityData;
  onGenerate: () => void;
  isProcessing: boolean;
}) {
  const isRequired = decision.result === 'locked_down' || decision.result === 'flagged';

  if (!isRequired) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/30">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <CheckCircle2 className="size-16 text-emerald-500 mb-4" />
            <h3 className="text-lg font-semibold text-emerald-800">SAR Not Required</h3>
            <p className="text-sm text-emerald-700 mt-2 max-w-md">
              The transaction has been cleared with no suspicious activity detected. A Suspicious Activity Report is not required.
            </p>
            <div className="mt-4 rounded-lg border border-emerald-200 bg-white p-4 text-left space-y-2 w-full max-w-sm">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Transaction</span>
                <span className="font-mono text-xs">{transaction.reference}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">AML Risk Score</span>
                <span className="font-semibold text-emerald-600">{decision.amlRiskScore}/100</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Decision</span>
                <Badge className="border-0 text-xs bg-emerald-100 text-emerald-800">Cleared</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* SAR Alert */}
      <Alert className="border-red-200 bg-red-50">
        <FileWarning className="size-4 text-red-600" />
        <AlertTitle className="text-red-800 text-sm">Suspicious Activity Detected</AlertTitle>
        <AlertDescription className="text-red-700 text-xs">
          Automated monitoring has detected potentially suspicious financial behavior. SAR generation is mandatory under UK MLR 2017 Regulation 20.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SAR Payload Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-50">
                <FileWarning className="size-5 text-pink-600" />
              </div>
              <div>
                <CardTitle className="text-lg">SAR Payload Preview</CardTitle>
                <CardDescription>Structured data for regulatory filing</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-muted/30 p-4 font-mono text-xs space-y-1 max-h-80 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              <p className="text-muted-foreground">{'{'}</p>
              <p className="ml-4"><span className="text-pink-600">&quot;sarReference&quot;</span>: <span className="text-emerald-600">&quot;{sar.reference}&quot;</span>,</p>
              <p className="ml-4"><span className="text-pink-600">&quot;transactionRef&quot;</span>: <span className="text-emerald-600">&quot;{transaction.reference}&quot;</span>,</p>
              <p className="ml-4"><span className="text-pink-600">&quot;subjectName&quot;</span>: <span className="text-emerald-600">&quot;{identity.profileName}&quot;</span>,</p>
              <p className="ml-4"><span className="text-pink-600">&quot;subjectNationality&quot;</span>: <span className="text-emerald-600">&quot;{identity.nationality ? getNationalityByCode(identity.nationality) : 'Unknown'}&quot;</span>,</p>
              <p className="ml-4"><span className="text-pink-600">&quot;transactionAmount&quot;</span>: <span className="text-amber-600">{transaction.amount}</span>,</p>
              <p className="ml-4"><span className="text-pink-600">&quot;decisionResult&quot;</span>: <span className="text-emerald-600">&quot;{decision.result}&quot;</span>,</p>
              <p className="ml-4"><span className="text-pink-600">&quot;amlRiskScore&quot;</span>: <span className="text-amber-600">{decision.amlRiskScore}</span>,</p>
              <p className="ml-4"><span className="text-pink-600">&quot;sanctionsResult&quot;</span>: <span className="text-emerald-600">&quot;{screening.sanctions.status}&quot;</span>,</p>
              <p className="ml-4"><span className="text-pink-600">&quot;pepResult&quot;</span>: <span className="text-emerald-600">&quot;{screening.pep.status}&quot;</span>,</p>
              <p className="ml-4"><span className="text-pink-600">&quot;adverseMediaResult&quot;</span>: <span className="text-emerald-600">&quot;{screening.adverseMedia.status}&quot;</span>,</p>
              <p className="ml-4"><span className="text-pink-600">&quot;findings&quot;</span>: [</p>
              {sar.findings.map((f, i) => (
                <p key={i} className="ml-8"><span className="text-emerald-600">&quot;{f}&quot;</span>{i < sar.findings.length - 1 ? ',' : ''}</p>
              ))}
              <p className="ml-4">],</p>
              <p className="ml-4"><span className="text-pink-600">&quot;status&quot;</span>: <span className="text-emerald-600">&quot;{sar.status}&quot;</span>,</p>
              <p className="ml-4"><span className="text-pink-600">&quot;filedAt&quot;</span>: <span className="text-emerald-600">&quot;{sar.filedAt || 'pending'}&quot;</span></p>
              <p>{'}'}</p>
            </div>
          </CardContent>
        </Card>

        {/* SAR Summary & Filing */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50">
                <AlertOctagon className="size-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-lg">SAR Summary</CardTitle>
                <CardDescription>Key findings and regulatory filing status</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filing Reference */}
            <div className="rounded-lg border p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Filing Reference</span>
                <span className="font-mono text-sm font-semibold">{sar.reference}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Status</span>
                <Badge
                  className="text-xs border-0"
                  style={{
                    color: sar.status === 'filed' ? '#10b981' : sar.status === 'acknowledged' ? '#06b6d4' : sar.status === 'draft' ? '#f59e0b' : '#94a3b8',
                    backgroundColor: sar.status === 'filed' ? '#ecfdf5' : sar.status === 'acknowledged' ? '#ecfeff' : sar.status === 'draft' ? '#fffbeb' : '#f1f5f9',
                  }}
                >
                  {sar.status === 'filed' ? <CheckCircle2 className="size-3 mr-1" /> :
                   sar.status === 'acknowledged' ? <CheckCircle2 className="size-3 mr-1" /> :
                   sar.status === 'draft' ? <Clock className="size-3 mr-1" /> :
                   <Clock className="size-3 mr-1" />}
                  {sar.status.charAt(0).toUpperCase() + sar.status.slice(1).replace(/_/g, ' ')}
                </Badge>
              </div>
              {sar.filedAt && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Filed At</span>
                  <span className="text-xs">{formatDateTime(sar.filedAt)}</span>
                </div>
              )}
            </div>

            {/* Key Findings */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Key Findings</p>
              {sar.findings.length > 0 ? sar.findings.map((finding, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="flex items-start gap-2 text-sm"
                >
                  <AlertTriangle className="size-4 text-amber-500 mt-0.5 shrink-0" />
                  <span>{finding}</span>
                </motion.div>
              )) : (
                <p className="text-sm text-muted-foreground">No findings recorded yet.</p>
              )}
            </div>

            <Separator />

            {/* Regulatory Reference */}
            <div className="rounded-lg bg-muted/30 p-3 space-y-1">
              <p className="text-xs font-medium">Regulatory Reference</p>
              <p className="text-[11px] text-muted-foreground">
                UK Money Laundering Regulations 2017, Regulation 20 — Duty to report suspicious activity to the National Crime Agency (NCA).
              </p>
            </div>

            {/* Generate Button */}
            {!sar.generated ? (
              <Button
                onClick={onGenerate}
                disabled={isProcessing}
                className="w-full bg-red-600 hover:bg-red-700 gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Generating SAR...
                  </>
                ) : (
                  <>
                    <FileWarning className="size-4" />
                    Generate & File SAR
                  </>
                )}
              </Button>
            ) : (
              <Alert className="border-emerald-200 bg-emerald-50">
                <CheckCircle2 className="size-4 text-emerald-600" />
                <AlertTitle className="text-emerald-800 text-sm">SAR Filed Successfully</AlertTitle>
                <AlertDescription className="text-emerald-700 text-xs">
                  Suspicious Activity Report {sar.reference} has been filed with the NCA. Await acknowledgment.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
