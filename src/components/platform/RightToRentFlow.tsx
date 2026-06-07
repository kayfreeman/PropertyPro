'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  FileText,
  ScanFace,
  Building2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Upload,
  ChevronRight,
  ChevronLeft,
  Search,
  Check,
  X,
  AlertCircle,
  Award,
  FileCheck,
  Bell,
  BellRing,
  Eye,
  Download,
  Zap,
  Lock,
  RefreshCw,
  Activity,
  Timer,
  Globe,
  Landmark,
  Fingerprint,
  ShieldCheck,
  BadgeCheck,
  FileBadge,
  TrendingUp,
  Radio,
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
  Switch,
} from '@/components/ui/switch';
import {
  ScrollArea,
} from '@/components/ui/scroll-area';
import { formatDate } from '@/lib/platform-data';

// ===================== TYPES =====================

interface RTRStepData {
  // Step 1
  initiatorName: string;
  applicantSearch: string;
  selectedApplicant: string;
  selectedProperty: string;
  checkReason: string;
  // Step 2
  visaType: string;
  documentUploaded: boolean;
  ocrProcessing: boolean;
  ocrComplete: boolean;
  documentAuthentic: boolean | null;
  tamperingDetected: boolean | null;
  ocrConfidence: number;
  // Step 3
  homeOfficeConnecting: boolean;
  homeOfficeComplete: boolean;
  visaGrantValid: boolean | null;
  ukResidenceData: boolean | null;
  immigrationPermissions: boolean | null;
  homeOfficeCheckDate: string | null;
  homeOfficeReference: string | null;
  // Step 4
  permanentRight: boolean | null;
  timeLimitedStatus: boolean | null;
  visaExpiryDate: string | null;
  restrictions: string[];
  // Step 5
  rulesEngineRunning: boolean;
  rulesEngineComplete: boolean;
  complianceResult: 'pass' | 'fail' | 'review' | null;
  statutoryGuidelineMet: boolean | null;
  riskAssessmentSummary: string | null;
  guidelineChecks: { name: string; passed: boolean }[];
  // Step 6
  evidenceGenerating: boolean;
  evidenceGenerated: boolean;
  certificateIssued: boolean;
  certificateToken: string | null;
  evidenceTrailRef: string | null;
  issuedAt: string | null;
  certificateExpiresAt: string | null;
  // Step 7
  monitoringActive: boolean;
  daysToExpiry: number | null;
  alertStatus: 'none' | 'warning' | 'critical' | 'expired' | null;
  alertHistory: { date: string; type: string; message: string }[];
}

const INITIAL_STEP_DATA: RTRStepData = {
  initiatorName: '',
  applicantSearch: '',
  selectedApplicant: '',
  selectedProperty: '',
  checkReason: '',
  visaType: '',
  documentUploaded: false,
  ocrProcessing: false,
  ocrComplete: false,
  documentAuthentic: null,
  tamperingDetected: null,
  ocrConfidence: 0,
  homeOfficeConnecting: false,
  homeOfficeComplete: false,
  visaGrantValid: null,
  ukResidenceData: null,
  immigrationPermissions: null,
  homeOfficeCheckDate: null,
  homeOfficeReference: null,
  permanentRight: null,
  timeLimitedStatus: null,
  visaExpiryDate: null,
  restrictions: [],
  rulesEngineRunning: false,
  rulesEngineComplete: false,
  complianceResult: null,
  statutoryGuidelineMet: null,
  riskAssessmentSummary: null,
  guidelineChecks: [],
  evidenceGenerating: false,
  evidenceGenerated: false,
  certificateIssued: false,
  certificateToken: null,
  evidenceTrailRef: null,
  issuedAt: null,
  certificateExpiresAt: null,
  monitoringActive: false,
  daysToExpiry: null,
  alertStatus: null,
  alertHistory: [],
};

// ===================== STEP DEFINITIONS =====================

const STEPS = [
  { id: 1, title: 'Initiate Check', icon: Search, description: 'Initiate formal Right to Rent verification' },
  { id: 2, title: 'Visa Ingestion & OCR', icon: ScanFace, description: 'Document upload and authenticity validation' },
  { id: 3, title: 'Home Office Validation', icon: Landmark, description: 'State authority infrastructure check' },
  { id: 4, title: 'Status & Visa Verification', icon: ShieldCheck, description: 'Immigration status parsing & verification' },
  { id: 5, title: 'Risk & Compliance', icon: AlertTriangle, description: 'Rules engine & statutory assessment' },
  { id: 6, title: 'Evidence & Certification', icon: Award, description: 'Immutable proof & certificate issuance' },
  { id: 7, title: 'Expiry Monitoring', icon: Bell, description: 'Continuous lifecycle tracking & alerts' },
];

// Mock applicant data
const MOCK_APPLICANTS = [
  { id: 'app-1', name: 'Priya Sharma', nationality: 'Indian', visa: 'Tier 2 General' },
  { id: 'app-2', name: 'Lars Eriksson', nationality: 'Swedish', visa: 'EU Settlement Scheme' },
  { id: 'app-3', name: 'Chen Wei', nationality: 'Chinese', visa: 'Student Visa (Tier 4)' },
  { id: 'app-4', name: 'Amina Hassan', nationality: 'Somali', visa: 'Indefinite Leave to Remain' },
  { id: 'app-5', name: 'Katarina Novak', nationality: 'Croatian', visa: 'EU Settlement (Pre-Settled)' },
];

const MOCK_PROPERTIES = [
  { id: 'prop-1', address: '14 Baker Street', city: 'London', postcode: 'W1U 3BW' },
  { id: 'prop-2', address: '42 Oxford Road', city: 'Manchester', postcode: 'M1 5WH' },
  { id: 'prop-3', address: '8 Royal Mile', city: 'Edinburgh', postcode: 'EH1 1QS' },
];

const VISA_TYPES = [
  { value: 'tier2', label: 'Tier 2 (General) Work Visa' },
  { value: 'tier4', label: 'Tier 4 (Student) Visa' },
  { value: 'eu_settled', label: 'EU Settlement Scheme (Settled)' },
  { value: 'eu_pre_settled', label: 'EU Settlement Scheme (Pre-Settled)' },
  { value: 'resident_permit', label: 'UK Residence Permit' },
  { value: 'ilr', label: 'Indefinite Leave to Remain' },
  { value: 'spouse', label: 'Spouse / Partner Visa' },
  { value: 'global_talent', label: 'Global Talent Visa' },
];

const CHECK_REASONS = [
  { value: 'new_tenancy', label: 'New Tenancy Application' },
  { value: 'renewal', label: 'Tenancy Renewal' },
  { value: 'statutory_repeat', label: 'Statutory Repeat Check' },
  { value: 'compliance_audit', label: 'Compliance Audit' },
  { value: 'change_circumstance', label: 'Change in Circumstance' },
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

// ===================== MAIN COMPONENT =====================

export default function RightToRentFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState<RTRStepData>({ ...INITIAL_STEP_DATA });
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Step 1 handlers
  const canProceedStep1 = stepData.initiatorName && stepData.selectedApplicant && stepData.selectedProperty && stepData.checkReason;

  // Step 2 simulation
  const simulateOCR = useCallback(() => {
    setStepData(prev => ({ ...prev, ocrProcessing: true, documentUploaded: true }));
    setTimeout(() => {
      setStepData(prev => ({
        ...prev,
        ocrProcessing: false,
        ocrComplete: true,
        documentAuthentic: true,
        tamperingDetected: false,
        ocrConfidence: 96.4,
      }));
    }, 3000);
  }, []);

  // Step 3 simulation
  const simulateHomeOffice = useCallback(() => {
    setStepData(prev => ({ ...prev, homeOfficeConnecting: true }));
    setTimeout(() => {
      setStepData(prev => ({ ...prev, visaGrantValid: true }));
    }, 1200);
    setTimeout(() => {
      setStepData(prev => ({ ...prev, ukResidenceData: true }));
    }, 2400);
    setTimeout(() => {
      setStepData(prev => ({ ...prev, immigrationPermissions: true }));
    }, 3600);
    setTimeout(() => {
      setStepData(prev => ({
        ...prev,
        homeOfficeConnecting: false,
        homeOfficeComplete: true,
        homeOfficeCheckDate: new Date().toISOString(),
        homeOfficeReference: 'HO-RTR-' + Date.now().toString(36).toUpperCase(),
      }));
    }, 4500);
  }, []);

  // Step 4 simulation
  const simulateStatusVerification = useCallback(() => {
    const visaType = stepData.visaType;
    const isPermanent = visaType === 'ilr' || visaType === 'eu_settled' || visaType === 'resident_permit';
    const isTimeLimited = !isPermanent;

    setTimeout(() => {
      setStepData(prev => ({
        ...prev,
        permanentRight: isPermanent,
        timeLimitedStatus: isTimeLimited,
        visaExpiryDate: isTimeLimited
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : null,
        restrictions: isTimeLimited
          ? ['Must maintain valid visa status', 'No access to public funds', 'Employment restricted to visa conditions', 'Must notify Home Office of address changes']
          : ['Must notify Home Office of address changes'],
      }));
    }, 1500);
  }, [stepData.visaType]);

  // Step 5 simulation
  const simulateRiskAssessment = useCallback(() => {
    setStepData(prev => ({ ...prev, rulesEngineRunning: true }));
    setTimeout(() => {
      const checks = [
        { name: 'Identity Verification Complete', passed: true },
        { name: 'Document Authenticity Confirmed', passed: true },
        { name: 'Home Office Validation Positive', passed: stepData.visaGrantValid === true },
        { name: 'No Adverse Immigration History', passed: true },
        { name: 'Compliant with Immigration Act 2014 s.22', passed: true },
        { name: 'Right to Rent Status Confirmed', passed: stepData.permanentRight === true || stepData.timeLimitedStatus === true },
        { name: 'No Active Deportation Order', passed: true },
        { name: 'Visa Within Valid Period', passed: true },
      ];
      setStepData(prev => ({
        ...prev,
        rulesEngineRunning: false,
        rulesEngineComplete: true,
        complianceResult: checks.every(c => c.passed) ? 'pass' : 'review',
        statutoryGuidelineMet: checks.every(c => c.passed),
        riskAssessmentSummary: checks.every(c => c.passed)
          ? 'All statutory requirements met. Applicant qualifies for Right to Rent certification.'
          : 'Some statutory checks require manual review. Escalated to compliance officer.',
        guidelineChecks: checks,
      }));
    }, 3500);
  }, [stepData.visaGrantValid, stepData.permanentRight, stepData.timeLimitedStatus]);

  // Step 6 simulation
  const simulateEvidenceGeneration = useCallback(() => {
    setStepData(prev => ({ ...prev, evidenceGenerating: true }));
    setTimeout(() => {
      setStepData(prev => ({
        ...prev,
        evidenceGenerating: false,
        evidenceGenerated: true,
        evidenceTrailRef: 'ET-' + Date.now().toString(36).toUpperCase(),
      }));
    }, 2500);
  }, []);

  const issueCertificate = useCallback(() => {
    setStepData(prev => ({
      ...prev,
      certificateIssued: true,
      certificateToken: 'RTR-CERT-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      issuedAt: new Date().toISOString(),
      certificateExpiresAt: prev.visaExpiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    }));
  }, []);

  // Step 7 simulation
  const activateMonitoring = useCallback(() => {
    const daysLeft = stepData.visaExpiryDate
      ? Math.max(0, Math.ceil((new Date(stepData.visaExpiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 365;

    const alertStatusVal: 'none' | 'warning' | 'critical' | 'expired' =
      daysLeft > 90 ? 'none' : daysLeft > 30 ? 'warning' : daysLeft > 0 ? 'critical' : 'expired';

    setStepData(prev => ({
      ...prev,
      monitoringActive: true,
      daysToExpiry: daysLeft,
      alertStatus: alertStatusVal,
      alertHistory: [
        { date: new Date().toISOString(), type: 'activation', message: 'Continuous monitoring activated' },
        { date: new Date(Date.now() - 86400000 * 30).toISOString(), type: 'info', message: 'Visa status confirmed active — no changes detected' },
        { date: new Date(Date.now() - 86400000 * 60).toISOString(), type: 'info', message: 'Periodic Home Office check completed — status unchanged' },
      ],
    }));
  }, [stepData.visaExpiryDate]);

  // Auto-trigger simulations when entering steps
  useEffect(() => {
    if (currentStep === 4 && stepData.permanentRight === null && !stepData.timeLimitedStatus) {
      simulateStatusVerification();
    }
  }, [currentStep, stepData.permanentRight, stepData.timeLimitedStatus, simulateStatusVerification]);

  // Navigation
  const goToStep = (step: number) => {
    if (step <= currentStep || completedSteps.has(step - 1)) {
      setCurrentStep(step);
    }
  };

  const nextStep = () => {
    if (currentStep < 7) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(prev => prev + 1);
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
        <div className="size-10 rounded-xl bg-teal-50 flex items-center justify-center">
          <Search className="size-5 text-teal-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Initiate Right to Rent Check</h3>
          <p className="text-sm text-muted-foreground">Begin formal verification under Immigration Act 2014 Section 22</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Initiator Info */}
        <div className="space-y-2">
          <Label htmlFor="initiator" className="text-sm font-medium">Initiator Name</Label>
          <Input
            id="initiator"
            placeholder="Enter agent or landlord name"
            value={stepData.initiatorName}
            onChange={(e) => setStepData(prev => ({ ...prev, initiatorName: e.target.value }))}
            className="h-10"
          />
          <p className="text-xs text-muted-foreground">The person or organisation requesting this check</p>
        </div>

        {/* Check Reason */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Check Reason</Label>
          <Select
            value={stepData.checkReason}
            onValueChange={(v) => setStepData(prev => ({ ...prev, checkReason: v }))}
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select reason for check" />
            </SelectTrigger>
            <SelectContent>
              {CHECK_REASONS.map(r => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Applicant Selector */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Applicant Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, nationality, or visa type..."
            value={stepData.applicantSearch}
            onChange={(e) => setStepData(prev => ({ ...prev, applicantSearch: e.target.value }))}
            className="pl-9 h-10"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MOCK_APPLICANTS
            .filter(a => !stepData.applicantSearch ||
              a.name.toLowerCase().includes(stepData.applicantSearch.toLowerCase()) ||
              a.nationality.toLowerCase().includes(stepData.applicantSearch.toLowerCase()) ||
              a.visa.toLowerCase().includes(stepData.applicantSearch.toLowerCase()))
            .map(applicant => (
              <motion.button
                key={applicant.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStepData(prev => ({ ...prev, selectedApplicant: applicant.id }))}
                className={`text-left p-3 rounded-lg border-2 transition-all ${
                  stepData.selectedApplicant === applicant.id
                    ? 'border-teal-500 bg-teal-50/50'
                    : 'border-border hover:border-teal-300 hover:bg-muted/30'
                }`}
              >
                <p className="font-medium text-sm">{applicant.name}</p>
                <p className="text-xs text-muted-foreground">{applicant.nationality}</p>
                <Badge variant="outline" className="mt-1.5 text-[10px]">{applicant.visa}</Badge>
              </motion.button>
            ))}
        </div>
      </div>

      <Separator />

      {/* Property Selector */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Property</Label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {MOCK_PROPERTIES.map(property => (
            <motion.button
              key={property.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStepData(prev => ({ ...prev, selectedProperty: property.id }))}
              className={`text-left p-3 rounded-lg border-2 transition-all ${
                stepData.selectedProperty === property.id
                    ? 'border-teal-500 bg-teal-50/50'
                    : 'border-border hover:border-teal-300 hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-sm">{property.address}</p>
                  <p className="text-xs text-muted-foreground">{property.city}, {property.postcode}</p>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Initiate Button */}
      <div className="flex justify-end pt-2">
        <Button
          size="lg"
          className="bg-teal-600 hover:bg-teal-700 text-white gap-2"
          disabled={!canProceedStep1}
          onClick={nextStep}
        >
          Initiate Right to Rent Check
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-xl bg-cyan-50 flex items-center justify-center">
          <ScanFace className="size-5 text-cyan-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Visa Ingestion & OCR Validation</h3>
          <p className="text-sm text-muted-foreground">Upload documentation for automated authenticity and tampering checks</p>
        </div>
      </div>

      {/* Visa Type Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Visa / Immigration Type</Label>
        <Select
          value={stepData.visaType}
          onValueChange={(v) => setStepData(prev => ({ ...prev, visaType: v }))}
        >
          <SelectTrigger className="h-10 max-w-md">
            <SelectValue placeholder="Select visa or immigration status type" />
          </SelectTrigger>
          <SelectContent>
            {VISA_TYPES.map(v => (
              <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Document Upload Zone */}
      {!stepData.documentUploaded && (
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="border-2 border-dashed border-teal-300 rounded-xl p-8 text-center cursor-pointer hover:bg-teal-50/30 transition-colors"
          onClick={simulateOCR}
        >
          <Upload className="size-10 text-teal-400 mx-auto mb-3" />
          <p className="font-medium text-sm">Upload Visa / Residence Permit / EUSS Record</p>
          <p className="text-xs text-muted-foreground mt-1">
            Drag and drop or click to browse — PDF, JPG, PNG accepted (max 10MB)
          </p>
          <Badge variant="outline" className="mt-3 text-[10px]">
            <Lock className="size-3 mr-1" />
            End-to-end encrypted upload
          </Badge>
        </motion.div>
      )}

      {/* OCR Processing Animation */}
      {stepData.ocrProcessing && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Card className="border-cyan-200 bg-cyan-50/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <RefreshCw className="size-6 text-cyan-600" />
                  </motion.div>
                </div>
                <div>
                  <p className="font-semibold text-cyan-800">OCR Processing In Progress</p>
                  <p className="text-sm text-cyan-600">Extracting text, validating structure, checking authenticity...</p>
                </div>
              </div>
              <Progress value={66} className="h-2" />
              <div className="flex items-center gap-4 mt-3 text-xs text-cyan-700">
                <span className="flex items-center gap-1"><Check className="size-3" /> Text extraction</span>
                <span className="flex items-center gap-1"><Check className="size-3" /> Structure validation</span>
                <span className="flex items-center gap-1"><RefreshCw className="size-3 animate-spin" /> Authenticity check</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* OCR Results */}
      {stepData.ocrComplete && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Authenticity */}
            <Card className={`border-2 ${stepData.documentAuthentic ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'}`}>
              <CardContent className="p-4 text-center">
                {stepData.documentAuthentic ? (
                  <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2" />
                ) : (
                  <XCircle className="size-8 text-red-500 mx-auto mb-2" />
                )}
                <p className="font-semibold text-sm">{stepData.documentAuthentic ? 'Authentic' : 'Suspect'}</p>
                <p className="text-xs text-muted-foreground">Document Authenticity</p>
              </CardContent>
            </Card>

            {/* Tampering */}
            <Card className={`border-2 ${!stepData.tamperingDetected ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-200 bg-red-50/30'}`}>
              <CardContent className="p-4 text-center">
                {!stepData.tamperingDetected ? (
                  <Shield className="size-8 text-emerald-500 mx-auto mb-2" />
                ) : (
                  <AlertTriangle className="size-8 text-red-500 mx-auto mb-2" />
                )}
                <p className="font-semibold text-sm">{!stepData.tamperingDetected ? 'No Tampering' : 'Tampered'}</p>
                <p className="text-xs text-muted-foreground">Tampering Detection</p>
              </CardContent>
            </Card>

            {/* Confidence */}
            <Card className="border-2 border-teal-200 bg-teal-50/30">
              <CardContent className="p-4 text-center">
                <div className="relative size-16 mx-auto mb-2">
                  <svg className="size-16 -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <circle
                      cx="18" cy="18" r="14" fill="none" stroke="#14b8a6" strokeWidth="3"
                      strokeDasharray={`${stepData.ocrConfidence * 0.88} 88`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-teal-700">
                    {stepData.ocrConfidence}%
                  </span>
                </div>
                <p className="font-semibold text-sm">OCR Confidence</p>
                <p className="text-xs text-muted-foreground">Extraction Accuracy</p>
              </CardContent>
            </Card>
          </div>

          {/* Proceed */}
          <div className="flex justify-end pt-2">
            <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white gap-2" onClick={nextStep}>
              Continue to Home Office Validation
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </motion.div>
      )}

      {/* Back button when processing */}
      {!stepData.ocrComplete && stepData.documentUploaded && (
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={prevStep} className="gap-2">
            <ChevronLeft className="size-4" /> Back
          </Button>
        </div>
      )}

      {!stepData.documentUploaded && !stepData.ocrProcessing && (
        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={prevStep} className="gap-2">
            <ChevronLeft className="size-4" /> Back
          </Button>
          <Button className="bg-teal-600 hover:bg-teal-700 text-white gap-2" disabled={!stepData.visaType}>
            Upload & Process
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <Landmark className="size-5 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Home Office Validation</h3>
          <p className="text-sm text-muted-foreground">Contact state authority infrastructure to verify visa and immigration data</p>
        </div>
      </div>

      {/* Start connection */}
      {!stepData.homeOfficeConnecting && !stepData.homeOfficeComplete && (
        <Card className="border-2 border-dashed border-amber-300 bg-amber-50/20">
          <CardContent className="p-8 text-center">
            <Globe className="size-12 text-amber-400 mx-auto mb-3" />
            <p className="font-medium">Connect to Home Office API</p>
            <p className="text-sm text-muted-foreground mt-1">
              Verify visa grant validity, historical UK residence data, and immigration permissions
            </p>
            <Button
              className="mt-4 bg-amber-600 hover:bg-amber-700 text-white gap-2"
              onClick={simulateHomeOffice}
            >
              <Radio className="size-4" /> Establish Connection
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Connection Animation */}
      {stepData.homeOfficeConnecting && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Card className="border-amber-200 bg-amber-50/30">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <Radio className="size-5 text-amber-600" />
                </motion.div>
                <p className="font-semibold text-amber-800">Connecting to Home Office...</p>
              </div>

              {/* Visa Grant */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border">
                {stepData.visaGrantValid === null ? (
                  <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }}>
                    <Clock className="size-5 text-amber-500" />
                  </motion.div>
                ) : (
                  <CheckCircle2 className="size-5 text-emerald-500" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">Visa Grant Validity</p>
                  <p className="text-xs text-muted-foreground">
                    {stepData.visaGrantValid === null ? 'Checking...' : stepData.visaGrantValid ? 'Visa grant confirmed valid' : 'Visa grant not confirmed'}
                  </p>
                </div>
                {stepData.visaGrantValid !== null && (
                  <Badge className="text-[10px]" style={{ backgroundColor: '#ecfdf5', color: '#10b981', borderColor: 'transparent' }}>Verified</Badge>
                )}
              </div>

              {/* UK Residence */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border">
                {stepData.ukResidenceData === null ? (
                  <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }}>
                    <Clock className="size-5 text-amber-500" />
                  </motion.div>
                ) : (
                  <CheckCircle2 className="size-5 text-emerald-500" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">UK Residence Data</p>
                  <p className="text-xs text-muted-foreground">
                    {stepData.ukResidenceData === null ? 'Checking...' : stepData.ukResidenceData ? 'Historical residence data verified' : 'No residence data found'}
                  </p>
                </div>
                {stepData.ukResidenceData !== null && (
                  <Badge className="text-[10px]" style={{ backgroundColor: '#ecfdf5', color: '#10b981', borderColor: 'transparent' }}>Verified</Badge>
                )}
              </div>

              {/* Immigration Permissions */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white/60 border">
                {stepData.immigrationPermissions === null ? (
                  <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.2, repeat: Infinity }}>
                    <Clock className="size-5 text-amber-500" />
                  </motion.div>
                ) : (
                  <CheckCircle2 className="size-5 text-emerald-500" />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">Immigration Permissions</p>
                  <p className="text-xs text-muted-foreground">
                    {stepData.immigrationPermissions === null ? 'Checking...' : stepData.immigrationPermissions ? 'Immigration permissions confirmed' : 'Immigration permissions not confirmed'}
                  </p>
                </div>
                {stepData.immigrationPermissions !== null && (
                  <Badge className="text-[10px]" style={{ backgroundColor: '#ecfdf5', color: '#10b981', borderColor: 'transparent' }}>Verified</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Complete Result */}
      {stepData.homeOfficeComplete && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          <Card className="border-emerald-200 bg-emerald-50/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle2 className="size-6 text-emerald-600" />
                <div>
                  <p className="font-semibold text-emerald-800">Home Office Validation Complete</p>
                  <p className="text-sm text-emerald-600">All checks passed — visa and immigration status verified</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Check Date:</span>
                  <p className="font-medium">{stepData.homeOfficeCheckDate ? formatDate(stepData.homeOfficeCheckDate) : '—'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Reference:</span>
                  <p className="font-medium font-mono text-xs">{stepData.homeOfficeReference}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={prevStep} className="gap-2">
              <ChevronLeft className="size-4" /> Back
            </Button>
            <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white gap-2" onClick={nextStep}>
              Continue to Status Verification
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <ShieldCheck className="size-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Status & Visa Verification</h3>
          <p className="text-sm text-muted-foreground">Parse immigration restrictions and determine right to rent status</p>
        </div>
      </div>

      {/* Loading state */}
      {stepData.permanentRight === null && !stepData.timeLimitedStatus && (
        <Card className="border-emerald-200 bg-emerald-50/20">
          <CardContent className="p-8 text-center">
            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
              <Fingerprint className="size-10 text-emerald-400 mx-auto" />
            </motion.div>
            <p className="font-medium mt-3">Parsing Immigration Status...</p>
            <p className="text-sm text-muted-foreground mt-1">Distinguishing between permanent and time-limited status parameters</p>
          </CardContent>
        </Card>
      )}

      {/* Status Result */}
      {stepData.permanentRight !== null && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Immigration Status Badge */}
          <div className="flex flex-col items-center gap-4 py-4">
            {stepData.permanentRight ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="flex flex-col items-center"
              >
                <div className="size-20 rounded-full bg-emerald-100 flex items-center justify-center mb-3 ring-4 ring-emerald-200">
                  <BadgeCheck className="size-10 text-emerald-600" />
                </div>
                <Badge className="text-sm px-4 py-1.5 font-semibold" style={{ backgroundColor: '#ecfdf5', color: '#10b981', borderColor: 'transparent' }}>
                  Permanent Right to Rent
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">No time limitation on right to rent in the UK</p>
              </motion.div>
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="flex flex-col items-center"
              >
                <div className="size-20 rounded-full bg-amber-100 flex items-center justify-center mb-3 ring-4 ring-amber-200">
                  <Timer className="size-10 text-amber-600" />
                </div>
                <Badge className="text-sm px-4 py-1.5 font-semibold" style={{ backgroundColor: '#fffbeb', color: '#d97706', borderColor: 'transparent' }}>
                  Time-Limited Status
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  Right to rent valid until {stepData.visaExpiryDate ? formatDate(stepData.visaExpiryDate) : 'visa expiry'}
                </p>
              </motion.div>
            )}
          </div>

          <Separator />

          {/* Visa Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Visa Type</p>
                <p className="font-medium text-sm">{VISA_TYPES.find(v => v.value === stepData.visaType)?.label || stepData.visaType}</p>
              </CardContent>
            </Card>
            {stepData.visaExpiryDate && (
              <Card className="border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Visa Expiry Date</p>
                  <p className="font-medium text-sm text-amber-600">{formatDate(stepData.visaExpiryDate)}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Restrictions */}
          {stepData.restrictions.length > 0 && (
            <Card className="border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="size-4 text-amber-500" />
                  Parsed Restrictions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {stepData.restrictions.map((r, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-2 text-sm"
                    >
                      <span className="size-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                      {r}
                    </motion.li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          <Card className="border-teal-200 bg-teal-50/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-teal-600" />
                <p className="text-sm font-medium text-teal-800">
                  Status Verification Complete — {stepData.permanentRight ? 'Permanent right confirmed' : 'Time-limited status verified with expiry tracking'}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={prevStep} className="gap-2">
              <ChevronLeft className="size-4" /> Back
            </Button>
            <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white gap-2" onClick={nextStep}>
              Continue to Risk Assessment
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const renderStep5 = () => (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-xl bg-orange-50 flex items-center justify-center">
          <AlertTriangle className="size-5 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Risk & Compliance Assessment</h3>
          <p className="text-sm text-muted-foreground">Internal rules engine evaluates against statutory UK Home Office compliance guidelines</p>
        </div>
      </div>

      {/* Start Assessment */}
      {!stepData.rulesEngineRunning && !stepData.rulesEngineComplete && (
        <Card className="border-2 border-dashed border-orange-300 bg-orange-50/20">
          <CardContent className="p-8 text-center">
            <Zap className="size-12 text-orange-400 mx-auto mb-3" />
            <p className="font-medium">Run Compliance Rules Engine</p>
            <p className="text-sm text-muted-foreground mt-1">
              Evaluate returned metadata against statutory UK Home Office compliance guidelines
            </p>
            <Button
              className="mt-4 bg-orange-600 hover:bg-orange-700 text-white gap-2"
              onClick={simulateRiskAssessment}
            >
              <Zap className="size-4" /> Run Assessment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Rules Engine Running */}
      {stepData.rulesEngineRunning && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <Card className="border-orange-200 bg-orange-50/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                  <Zap className="size-5 text-orange-600" />
                </motion.div>
                <div>
                  <p className="font-semibold text-orange-800">Rules Engine Processing</p>
                  <p className="text-sm text-orange-600">Evaluating statutory compliance guidelines...</p>
                </div>
              </div>
              <Progress value={45} className="h-2" />
              <p className="text-xs text-orange-600 mt-2">Checking 8 statutory guidelines against validation metadata...</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Assessment Complete */}
      {stepData.rulesEngineComplete && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Result Badge */}
          <div className="flex justify-center py-2">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className={`flex items-center gap-3 px-6 py-3 rounded-full ${
                stepData.complianceResult === 'pass'
                  ? 'bg-emerald-100 ring-2 ring-emerald-300'
                  : stepData.complianceResult === 'review'
                  ? 'bg-amber-100 ring-2 ring-amber-300'
                  : 'bg-red-100 ring-2 ring-red-300'
              }`}
            >
              {stepData.complianceResult === 'pass' && <CheckCircle2 className="size-6 text-emerald-600" />}
              {stepData.complianceResult === 'review' && <AlertCircle className="size-6 text-amber-600" />}
              {stepData.complianceResult === 'fail' && <XCircle className="size-6 text-red-600" />}
              <span className={`font-bold text-lg ${
                stepData.complianceResult === 'pass' ? 'text-emerald-700' :
                stepData.complianceResult === 'review' ? 'text-amber-700' : 'text-red-700'
              }`}>
                {stepData.complianceResult === 'pass' ? 'COMPLIANT' :
                 stepData.complianceResult === 'review' ? 'REVIEW REQUIRED' : 'NON-COMPLIANT'}
              </span>
            </motion.div>
          </div>

          {/* Statutory Guidelines Checklist */}
          <Card className="border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileCheck className="size-4 text-teal-600" />
                Statutory Guidelines Checklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stepData.guidelineChecks.map((check, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-white border"
                  >
                    {check.passed ? (
                      <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                    ) : (
                      <XCircle className="size-4 text-red-500 shrink-0" />
                    )}
                    <span className="text-sm flex-1">{check.name}</span>
                    <Badge
                      className="text-[10px]"
                      style={{
                        backgroundColor: check.passed ? '#ecfdf5' : '#fef2f2',
                        color: check.passed ? '#10b981' : '#ef4444',
                        borderColor: 'transparent',
                      }}
                    >
                      {check.passed ? 'Pass' : 'Fail'}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Risk Summary */}
          <Card className="border-teal-200 bg-teal-50/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <Activity className="size-5 text-teal-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-teal-800">Risk Assessment Summary</p>
                  <p className="text-sm text-teal-700 mt-1">{stepData.riskAssessmentSummary}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px] border-teal-200 text-teal-700">
                      Statutory: {stepData.statutoryGuidelineMet ? 'Met' : 'Not Met'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={prevStep} className="gap-2">
              <ChevronLeft className="size-4" /> Back
            </Button>
            <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white gap-2" onClick={nextStep}>
              Continue to Evidence Generation
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const renderStep6 = () => (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-xl bg-teal-50 flex items-center justify-center">
          <Award className="size-5 text-teal-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Evidence Generation & Certification</h3>
          <p className="text-sm text-muted-foreground">Create immutable proof of validation and issue Right to Rent Certificate</p>
        </div>
      </div>

      {/* Generate Evidence */}
      {!stepData.evidenceGenerating && !stepData.evidenceGenerated && (
        <Card className="border-2 border-dashed border-teal-300 bg-teal-50/20">
          <CardContent className="p-8 text-center">
            <FileBadge className="size-12 text-teal-400 mx-auto mb-3" />
            <p className="font-medium">Generate Evidence Trail</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create immutable proof of validation check and structured compliance evidence trail
            </p>
            <Button
              className="mt-4 bg-teal-600 hover:bg-teal-700 text-white gap-2"
              onClick={simulateEvidenceGeneration}
            >
              <Lock className="size-4" /> Generate Evidence
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Evidence Generating */}
      {stepData.evidenceGenerating && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-teal-200 bg-teal-50/30">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                  <Lock className="size-5 text-teal-600" />
                </motion.div>
                <div>
                  <p className="font-semibold text-teal-800">Generating Immutable Evidence Trail...</p>
                  <p className="text-sm text-teal-600">Logging proof, creating compliance chain, preparing certificate</p>
                </div>
              </div>
              <Progress value={60} className="h-2" />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Evidence Generated */}
      {stepData.evidenceGenerated && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Evidence Trail */}
          <Card className="border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lock className="size-4 text-teal-600" />
                Immutable Proof Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-xs bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Check className="size-3 text-emerald-500" />
                  <span className="text-muted-foreground">[{new Date().toISOString()}]</span> Evidence trail created
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3 text-emerald-500" />
                  <span className="text-muted-foreground">[{new Date().toISOString()}]</span> Identity verification logged
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3 text-emerald-500" />
                  <span className="text-muted-foreground">[{new Date().toISOString()}]</span> Home Office validation recorded
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3 text-emerald-500" />
                  <span className="text-muted-foreground">[{new Date().toISOString()}]</span> Compliance assessment logged
                </div>
                <div className="flex items-center gap-2">
                  <Check className="size-3 text-emerald-500" />
                  <span className="text-muted-foreground">Reference:</span> {stepData.evidenceTrailRef}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Certificate Preview */}
          <Card className="border-2 border-teal-200 bg-gradient-to-br from-teal-50/50 to-emerald-50/50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Award className="size-4 text-teal-600" />
                Right to Rent Certificate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-white rounded-lg border p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="size-5 text-teal-600" />
                    <span className="font-bold text-sm">PropComply AI + VerifyMe Global</span>
                  </div>
                  <Badge className="text-[10px]" style={{ backgroundColor: '#ecfdf5', color: '#10b981', borderColor: 'transparent' }}>
                    {stepData.certificateIssued ? 'ISSUED' : 'PENDING'}
                  </Badge>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Certificate Token</span>
                    <p className="font-mono font-medium mt-0.5">{stepData.certificateToken || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Evidence Reference</span>
                    <p className="font-mono font-medium mt-0.5">{stepData.evidenceTrailRef}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Issue Date</span>
                    <p className="font-medium mt-0.5">{stepData.issuedAt ? formatDate(stepData.issuedAt) : '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Expiry Date</span>
                    <p className="font-medium mt-0.5">{stepData.certificateExpiresAt ? formatDate(stepData.certificateExpiresAt) : '—'}</p>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Lock className="size-3" />
                  Cryptographically signed & immutable — Immigration Act 2014 Section 22
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button variant="outline" onClick={prevStep} className="gap-2">
              <ChevronLeft className="size-4" /> Back
            </Button>
            <div className="flex items-center gap-3">
              {stepData.certificateIssued && (
                <Button variant="outline" className="gap-2" size="sm">
                  <Download className="size-4" /> Download Certificate
                </Button>
              )}
              {!stepData.certificateIssued ? (
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" onClick={issueCertificate}>
                  <Award className="size-4" /> Issue Certificate
                </Button>
              ) : (
                <Button size="lg" className="bg-teal-600 hover:bg-teal-700 text-white gap-2" onClick={nextStep}>
                  Continue to Expiry Monitoring
                  <ChevronRight className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  const renderStep7 = () => (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-xl bg-violet-50 flex items-center justify-center">
          <BellRing className="size-5 text-violet-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Continuous Expiry Monitoring</h3>
          <p className="text-sm text-muted-foreground">Automated alert engine for visa expirations and status changes</p>
        </div>
      </div>

      {/* Monitoring Activation */}
      {!stepData.monitoringActive && (
        <Card className="border-2 border-dashed border-violet-300 bg-violet-50/20">
          <CardContent className="p-8 text-center">
            <Activity className="size-12 text-violet-400 mx-auto mb-3" />
            <p className="font-medium">Activate Continuous Monitoring</p>
            <p className="text-sm text-muted-foreground mt-1">
              Enable automated expiry tracking and real-time status change alerts
            </p>
            <Button
              className="mt-4 bg-violet-600 hover:bg-violet-700 text-white gap-2"
              onClick={activateMonitoring}
            >
              <Activity className="size-4" /> Activate Monitoring
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Monitoring Dashboard */}
      {stepData.monitoringActive && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
          {/* Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Days to Expiry */}
            <Card className="border">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-1">Days to Expiry</p>
                <motion.p
                  className="text-4xl font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  style={{ color: stepData.daysToExpiry && stepData.daysToExpiry > 90 ? '#10b981' : stepData.daysToExpiry && stepData.daysToExpiry > 30 ? '#f59e0b' : '#ef4444' }}
                >
                  {stepData.daysToExpiry ?? '—'}
                </motion.p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stepData.visaExpiryDate ? `Expires ${formatDate(stepData.visaExpiryDate)}` : 'No expiry'}
                </p>
              </CardContent>
            </Card>

            {/* Alert Status */}
            <Card className="border">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground mb-2">Alert Status</p>
                {stepData.alertStatus === 'none' && (
                  <Badge className="text-sm px-4 py-1.5" style={{ backgroundColor: '#ecfdf5', color: '#10b981', borderColor: 'transparent' }}>
                    <CheckCircle2 className="size-4 mr-1" /> No Alerts
                  </Badge>
                )}
                {stepData.alertStatus === 'warning' && (
                  <Badge className="text-sm px-4 py-1.5" style={{ backgroundColor: '#fffbeb', color: '#d97706', borderColor: 'transparent' }}>
                    <AlertTriangle className="size-4 mr-1" /> Warning
                  </Badge>
                )}
                {stepData.alertStatus === 'critical' && (
                  <Badge className="text-sm px-4 py-1.5" style={{ backgroundColor: '#fff7ed', color: '#ea580c', borderColor: 'transparent' }}>
                    <AlertCircle className="size-4 mr-1" /> Critical
                  </Badge>
                )}
                {stepData.alertStatus === 'expired' && (
                  <Badge className="text-sm px-4 py-1.5" style={{ backgroundColor: '#fef2f2', color: '#ef4444', borderColor: 'transparent' }}>
                    <XCircle className="size-4 mr-1" /> Expired
                  </Badge>
                )}
                <p className="text-xs text-muted-foreground mt-2">Current alert level</p>
              </CardContent>
            </Card>

            {/* Monitoring Toggle */}
            <Card className="border">
              <CardContent className="p-4 flex flex-col items-center justify-center gap-2">
                <p className="text-xs text-muted-foreground">Monitoring Status</p>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={stepData.monitoringActive}
                    onCheckedChange={(checked) => setStepData(prev => ({ ...prev, monitoringActive: checked }))}
                  />
                  <span className="text-sm font-medium">{stepData.monitoringActive ? 'Active' : 'Inactive'}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Real-time tracking enabled
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alert History */}
          <Card className="border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bell className="size-4 text-violet-600" />
                Alert History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-48">
                <div className="space-y-2">
                  {stepData.alertHistory.map((alert, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-white border"
                    >
                      {alert.type === 'activation' ? (
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      ) : alert.type === 'warning' ? (
                        <AlertTriangle className="size-4 text-amber-500 shrink-0" />
                      ) : (
                        <Bell className="size-4 text-muted-foreground shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{alert.message}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(alert.date)}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Dual-Sided Workflow Tracker */}
          <Card className="border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="size-4 text-teal-600" />
                Dual-Sided Workflow Tracker
              </CardTitle>
              <CardDescription>Agent and applicant visibility into monitoring lifecycle</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Agent Side */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agent / Landlord View</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Check Initiated', done: true },
                      { label: 'Visa Verified', done: true },
                      { label: 'Home Office Confirmed', done: true },
                      { label: 'Certificate Issued', done: stepData.certificateIssued },
                      { label: 'Monitoring Active', done: stepData.monitoringActive },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {item.done ? (
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        ) : (
                          <div className="size-4 rounded-full border-2 border-muted-foreground/30" />
                        )}
                        <span className={item.done ? '' : 'text-muted-foreground'}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Applicant Side */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Applicant View</p>
                  <div className="space-y-2">
                    {[
                      { label: 'Verification Request Received', done: true },
                      { label: 'Documents Submitted', done: true },
                      { label: 'Verification Complete', done: true },
                      { label: 'Right to Rent Confirmed', done: stepData.certificateIssued },
                      { label: 'Expiry Notifications Enabled', done: stepData.monitoringActive },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {item.done ? (
                          <CheckCircle2 className="size-4 text-emerald-500" />
                        ) : (
                          <div className="size-4 rounded-full border-2 border-muted-foreground/30" />
                        )}
                        <span className={item.done ? '' : 'text-muted-foreground'}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={prevStep} className="gap-2">
              <ChevronLeft className="size-4" /> Back
            </Button>
            <div className="flex items-center gap-2">
              <Badge className="text-sm" style={{ backgroundColor: '#ecfdf5', color: '#10b981', borderColor: 'transparent' }}>
                <CheckCircle2 className="size-4 mr-1" /> Process Complete
              </Badge>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );

  // Step renderer map
  const stepRenderers: Record<number, () => React.ReactNode> = {
    1: renderStep1,
    2: renderStep2,
    3: renderStep3,
    4: renderStep4,
    5: renderStep5,
    6: renderStep6,
    7: renderStep7,
  };

  return (
    <div className="space-y-6">
      {/* Process Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="size-5 text-teal-600" />
            Right to Rent Compliance Flow
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Immigration Act 2014 Section 22 — Automated verification & lifecycle tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-teal-200 text-teal-700">
            Step {currentStep} of 7
          </Badge>
          {completedSteps.size > 0 && (
            <Badge className="text-xs" style={{ backgroundColor: '#ecfdf5', color: '#10b981', borderColor: 'transparent' }}>
              {completedSteps.size} completed
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Progress Bar */}
      <div className="w-full">
        <Progress value={(currentStep / 7) * 100} className="h-2" />
      </div>

      {/* Main Layout: Timeline + Content */}
      <div className="flex gap-6">
        {/* Vertical Timeline */}
        <div className="hidden md:flex flex-col items-center gap-0 w-12 shrink-0 pt-1">
          {STEPS.map((step, idx) => {
            const isCompleted = completedSteps.has(step.id);
            const isCurrent = currentStep === step.id;
            const isAccessible = step.id <= currentStep || completedSteps.has(step.id - 1);
            const StepIcon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center">
                {/* Step Circle */}
                <motion.button
                  whileHover={isAccessible ? { scale: 1.15 } : {}}
                  whileTap={isAccessible ? { scale: 0.95 } : {}}
                  onClick={() => isAccessible && goToStep(step.id)}
                  className={`relative size-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isCurrent
                      ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 ring-4 ring-teal-100'
                      : isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isAccessible
                      ? 'bg-muted text-muted-foreground hover:bg-teal-100 hover:text-teal-700'
                      : 'bg-muted/50 text-muted-foreground/40 cursor-not-allowed'
                  }`}
                  disabled={!isAccessible}
                >
                  {isCompleted ? (
                    <Check className="size-4" />
                  ) : isCurrent ? (
                    <StepIcon className="size-4" />
                  ) : (
                    <span className="text-xs font-bold">{step.id}</span>
                  )}
                </motion.button>

                {/* Connector Line */}
                {idx < STEPS.length - 1 && (
                  <div className={`w-0.5 h-8 transition-colors duration-300 ${
                    isCompleted ? 'bg-emerald-400' : 'bg-muted'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={slideIn}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border shadow-sm">
                <CardContent className="p-4 md:p-6">
                  {stepRenderers[currentStep]?.()}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Step Navigation */}
      <div className="md:hidden">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
              {STEPS.map((step) => {
                const isCompleted = completedSteps.has(step.id);
                const isCurrent = currentStep === step.id;
                const isAccessible = step.id <= currentStep || completedSteps.has(step.id - 1);
                const StepIcon = step.icon;

                return (
                  <button
                    key={step.id}
                    onClick={() => isAccessible && goToStep(step.id)}
                    disabled={!isAccessible}
                    className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-colors min-w-[48px] ${
                      isCurrent
                        ? 'bg-teal-50 text-teal-700'
                        : isCompleted
                        ? 'text-emerald-600'
                        : isAccessible
                        ? 'text-muted-foreground hover:bg-muted/60'
                        : 'text-muted-foreground/30'
                    }`}
                  >
                    <div className={`size-7 rounded-full flex items-center justify-center ${
                      isCurrent ? 'bg-teal-600 text-white' :
                      isCompleted ? 'bg-emerald-500 text-white' :
                      'bg-muted'
                    }`}>
                      {isCompleted ? <Check className="size-3" /> : <StepIcon className="size-3" />}
                    </div>
                    <span className="text-[9px] font-medium leading-tight text-center">{step.title.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
