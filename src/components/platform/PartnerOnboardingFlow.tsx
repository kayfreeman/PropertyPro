'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  Landmark,
  Shield,
  Home,
  ArrowLeftRight,
  Briefcase,
  GraduationCap,
  Globe,
  Webhook,
  FileStack,
  UserCheck,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Zap,
  Lock,
  Key,
  ShieldCheck,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ─── Types ─────────────────────────────────────

interface OnboardingData {
  // Step 1
  partnerType: string;
  name: string;
  registrationNumber: string;
  country: string;
  website: string;
  // Step 2
  integrationType: string;
  apiEndpoint: string;
  webhookUrl: string;
  authMethod: string;
  dataSharingScope: string[];
  // Step 3
  trustRating: number;
  complianceRequirements: string[];
  responsibleName: string;
  responsibleEmail: string;
  responsiblePhone: string;
  slaResponseTime: string;
  slaUptime: string;
  // Step 4
  termsAccepted: boolean;
}

const initialData: OnboardingData = {
  partnerType: '',
  name: '',
  registrationNumber: '',
  country: '',
  website: '',
  integrationType: '',
  apiEndpoint: '',
  webhookUrl: '',
  authMethod: '',
  dataSharingScope: [],
  trustRating: 50,
  complianceRequirements: [],
  responsibleName: '',
  responsibleEmail: '',
  responsiblePhone: '',
  slaResponseTime: '',
  slaUptime: '',
  termsAccepted: false,
};

const PARTNER_TYPE_OPTIONS = [
  { type: 'bank', name: 'Bank', icon: Landmark, color: '#0d9488', bg: '#f0fdfa' },
  { type: 'insurer', name: 'Insurer', icon: Shield, color: '#8b5cf6', bg: '#f5f3ff' },
  { type: 'mortgage_provider', name: 'Mortgage Provider', icon: Home, color: '#f59e0b', bg: '#fffbeb' },
  { type: 'remittance', name: 'Remittance', icon: ArrowLeftRight, color: '#06b6d4', bg: '#ecfeff' },
  { type: 'employer', name: 'Employer', icon: Briefcase, color: '#6366f1', bg: '#eef2ff' },
  { type: 'university', name: 'University', icon: GraduationCap, color: '#ec4899', bg: '#fdf2f8' },
];

const INTEGRATION_TYPES = [
  { value: 'api', label: 'API', icon: Globe, description: 'RESTful API integration' },
  { value: 'webhook', label: 'Webhook', icon: Webhook, description: 'Event-driven webhook callbacks' },
  { value: 'batch', label: 'Batch', icon: FileStack, description: 'Scheduled batch data exchange' },
  { value: 'manual', label: 'Manual', icon: UserCheck, description: 'Manual data processing' },
];

const AUTH_METHODS = [
  { value: 'oauth2', label: 'OAuth 2.0', icon: Lock },
  { value: 'api_key', label: 'API Key', icon: Key },
  { value: 'mtls', label: 'mTLS', icon: ShieldCheck },
  { value: 'none', label: 'None', icon: Globe },
];

const DATA_SHARING_SCOPES = [
  'Identity Verification',
  'Compliance Data',
  'Risk Scores',
  'Referral Data',
];

const COMPLIANCE_REQUIREMENTS = [
  { id: 'fca', label: 'FCA Regulated' },
  { id: 'gdpr', label: 'GDPR Compliant' },
  { id: 'soc2', label: 'SOC 2 Certified' },
  { id: 'iso27001', label: 'ISO 27001' },
  { id: 'dpa', label: 'Data Processing Agreement' },
];

const COUNTRIES = [
  'United Kingdom', 'United States', 'Germany', 'France', 'Netherlands',
  'Ireland', 'Spain', 'Italy', 'Sweden', 'Norway', 'Switzerland',
  'Singapore', 'Australia', 'Canada', 'Japan', 'India', 'Brazil',
];

// ─── Animation Variants ────────────────────────

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

// ─── Step Indicator ────────────────────────────

function StepIndicator({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const stepLabels = ['Basic Info', 'Integration', 'Trust & Compliance', 'Review'];
  return (
    <div className="flex items-center justify-between mb-6">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isCompleted = step < currentStep;
        const isCurrent = step === currentStep;
        return (
          <div key={step} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`size-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                    ? 'bg-teal-500 text-white ring-4 ring-teal-100'
                    : 'bg-gray-100 text-gray-400'
                }`}
              >
                {isCompleted ? <Check className="size-4" /> : step}
              </div>
              <span className={`text-[11px] mt-1.5 font-medium ${isCurrent ? 'text-teal-700' : isCompleted ? 'text-emerald-600' : 'text-gray-400'}`}>
                {stepLabels[i]}
              </span>
            </div>
            {step < totalSteps && (
              <div className={`h-0.5 flex-1 mx-1 mt-[-16px] transition-colors duration-300 ${isCompleted ? 'bg-emerald-400' : 'bg-gray-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ────────────────────────────

interface PartnerOnboardingFlowProps {
  onComplete?: () => void;
  onCancel?: () => void;
}

export default function PartnerOnboardingFlow({ onComplete, onCancel }: PartnerOnboardingFlowProps) {
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<OnboardingData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [referenceId, setReferenceId] = useState('');
  const [testConnectionStatus, setTestConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');

  const updateData = useCallback((field: keyof OnboardingData, value: unknown) => {
    setData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const toggleArrayItem = useCallback((field: 'dataSharingScope' | 'complianceRequirements', item: string) => {
    setData((prev) => {
      const arr = prev[field] as string[];
      return {
        ...prev,
        [field]: arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item],
      };
    });
  }, []);

  const nextStep = () => {
    if (currentStep < 4) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return data.partnerType !== '' && data.name.trim().length >= 2;
      case 2:
        return data.integrationType !== '' && data.authMethod !== '';
      case 3:
        return data.responsibleName.trim().length >= 2 && data.responsibleEmail.includes('@');
      case 4:
        return data.termsAccepted;
      default:
        return false;
    }
  };

  const testConnection = async () => {
    setTestConnectionStatus('testing');
    // Simulated test
    await new Promise((r) => setTimeout(r, 2000));
    setTestConnectionStatus(Math.random() > 0.2 ? 'success' : 'failed');
    setTimeout(() => setTestConnectionStatus('idle'), 3000);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const userRole = session?.user?.role || 'tenant';
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          partnerType: data.partnerType,
          integrationType: data.integrationType,
          apiEndpoint: data.apiEndpoint || undefined,
          trustRating: data.trustRating,
          country: data.country,
          website: data.website,
          registrationNumber: data.registrationNumber,
          authMethod: data.authMethod,
          dataSharingScope: data.dataSharingScope,
          complianceRequirements: data.complianceRequirements,
          responsiblePerson: {
            name: data.responsibleName,
            email: data.responsibleEmail,
            phone: data.responsiblePhone,
          },
          slaTerms: {
            responseTime: data.slaResponseTime,
            uptime: data.slaUptime,
          },
          role: userRole,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Failed to register partner');
        return;
      }

      setReferenceId(result.referenceId);
      setIsSuccess(true);
      toast.success('Partner registered successfully!');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Success State ───────────────────────────
  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-12 px-4"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, delay: 0.2 }}
          className="size-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="size-10 text-emerald-600" />
        </motion.div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Partner Registered!</h3>
        <p className="text-sm text-muted-foreground mb-4 text-center max-w-sm">
          {data.name} has been successfully registered as a partner.
        </p>
        <Card className="w-full max-w-sm border-emerald-200 bg-emerald-50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-emerald-600 mb-1">Partner Reference ID</p>
            <p className="text-lg font-mono font-bold text-emerald-800">{referenceId}</p>
          </CardContent>
        </Card>
        <Button className="mt-6" onClick={onComplete}>
          Back to Partners
        </Button>
      </motion.div>
    );
  }

  // ─── Wizard ──────────────────────────────────
  return (
    <div className="space-y-4">
      <StepIndicator currentStep={currentStep} totalSteps={4} />

      <AnimatePresence mode="wait" custom={direction}>
        {/* ─── Step 1: Partner Type & Basic Info ─── */}
        {currentStep === 1 && (
          <motion.div
            key="step1"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Partner Type Selector */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Partner Type *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {PARTNER_TYPE_OPTIONS.map((pt) => {
                  const Icon = pt.icon;
                  const isSelected = data.partnerType === pt.type;
                  return (
                    <button
                      key={pt.type}
                      type="button"
                      onClick={() => updateData('partnerType', pt.type)}
                      className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                        isSelected
                          ? 'border-current shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={isSelected ? { borderColor: pt.color, backgroundColor: pt.bg } : {}}
                    >
                      <div
                        className="size-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: pt.bg, color: pt.color }}
                      >
                        <Icon className="size-4" />
                      </div>
                      <span className="text-sm font-medium" style={{ color: isSelected ? pt.color : undefined }}>
                        {pt.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Basic Info Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="name" className="mb-1.5">Company / Institution Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Barclays Bank UK"
                  value={data.name}
                  onChange={(e) => updateData('name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="regNumber" className="mb-1.5">Registration Number</Label>
                <Input
                  id="regNumber"
                  placeholder="e.g. 00001234"
                  value={data.registrationNumber}
                  onChange={(e) => updateData('registrationNumber', e.target.value)}
                />
              </div>
              <div>
                <Label className="mb-1.5">Country of Registration</Label>
                <Select
                  value={data.country}
                  onValueChange={(v) => updateData('country', v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="website" className="mb-1.5">Website URL</Label>
                <Input
                  id="website"
                  placeholder="https://example.com"
                  value={data.website}
                  onChange={(e) => updateData('website', e.target.value)}
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Step 2: Integration Configuration ─── */}
        {currentStep === 2 && (
          <motion.div
            key="step2"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Integration Type */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Integration Type *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {INTEGRATION_TYPES.map((it) => {
                  const Icon = it.icon;
                  const isSelected = data.integrationType === it.value;
                  return (
                    <button
                      key={it.value}
                      type="button"
                      onClick={() => updateData('integrationType', it.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`size-5 ${isSelected ? 'text-teal-600' : 'text-gray-400'}`} />
                      <span className={`text-xs font-medium ${isSelected ? 'text-teal-700' : 'text-gray-600'}`}>
                        {it.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Endpoint Fields (conditional) */}
            {(data.integrationType === 'api' || data.integrationType === 'webhook') && (
              <div className="space-y-4">
                {data.integrationType === 'api' && (
                  <div>
                    <Label htmlFor="apiEndpoint" className="mb-1.5">API Endpoint URL</Label>
                    <Input
                      id="apiEndpoint"
                      placeholder="https://api.partner.com/v1"
                      value={data.apiEndpoint}
                      onChange={(e) => updateData('apiEndpoint', e.target.value)}
                    />
                  </div>
                )}
                {data.integrationType === 'webhook' && (
                  <div>
                    <Label htmlFor="webhookUrl" className="mb-1.5">Webhook URL</Label>
                    <Input
                      id="webhookUrl"
                      placeholder="https://partner.com/webhooks/propcomply"
                      value={data.webhookUrl}
                      onChange={(e) => updateData('webhookUrl', e.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Authentication Method */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Authentication Method *</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {AUTH_METHODS.map((am) => {
                  const Icon = am.icon;
                  const isSelected = data.authMethod === am.value;
                  return (
                    <button
                      key={am.value}
                      type="button"
                      onClick={() => updateData('authMethod', am.value)}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all duration-200 ${
                        isSelected
                          ? 'border-teal-500 bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`size-4 ${isSelected ? 'text-teal-600' : 'text-gray-400'}`} />
                      <span className={`text-xs font-medium ${isSelected ? 'text-teal-700' : 'text-gray-600'}`}>
                        {am.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Data Sharing Scope */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Data Sharing Scope</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DATA_SHARING_SCOPES.map((scope) => (
                  <label
                    key={scope}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={data.dataSharingScope.includes(scope)}
                      onCheckedChange={() => toggleArrayItem('dataSharingScope', scope)}
                    />
                    <span className="text-sm">{scope}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Test Connection */}
            {(data.integrationType === 'api' || data.integrationType === 'webhook') && (
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={testConnection}
                  disabled={testConnectionStatus === 'testing'}
                  className="gap-2"
                >
                  {testConnectionStatus === 'testing' ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : testConnectionStatus === 'success' ? (
                    <CheckCircle2 className="size-4 text-emerald-500" />
                  ) : testConnectionStatus === 'failed' ? (
                    <Zap className="size-4 text-red-500" />
                  ) : (
                    <Zap className="size-4" />
                  )}
                  {testConnectionStatus === 'testing'
                    ? 'Testing...'
                    : testConnectionStatus === 'success'
                    ? 'Connection Successful!'
                    : testConnectionStatus === 'failed'
                    ? 'Connection Failed'
                    : 'Test Connection'}
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* ─── Step 3: Trust & Compliance Setup ─── */}
        {currentStep === 3 && (
          <motion.div
            key="step3"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Trust Rating */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">
                Initial Trust Rating: <span className="text-teal-600">{data.trustRating}</span>/100
              </Label>
              <Slider
                value={[data.trustRating]}
                onValueChange={(v) => updateData('trustRating', v[0])}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0 — Unverified</span>
                <span>100 — Fully Trusted</span>
              </div>
            </div>

            <Separator />

            {/* Compliance Requirements */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Compliance Requirements</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COMPLIANCE_REQUIREMENTS.map((req) => (
                  <label
                    key={req.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={data.complianceRequirements.includes(req.id)}
                      onCheckedChange={() => toggleArrayItem('complianceRequirements', req.id)}
                    />
                    <span className="text-sm">{req.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            {/* Responsible Person */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Responsible Person</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="respName" className="mb-1 text-xs">Name *</Label>
                  <Input
                    id="respName"
                    placeholder="John Smith"
                    value={data.responsibleName}
                    onChange={(e) => updateData('responsibleName', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="respEmail" className="mb-1 text-xs">Email *</Label>
                  <Input
                    id="respEmail"
                    type="email"
                    placeholder="john@company.com"
                    value={data.responsibleEmail}
                    onChange={(e) => updateData('responsibleEmail', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="respPhone" className="mb-1 text-xs">Phone</Label>
                  <Input
                    id="respPhone"
                    placeholder="+44 7700 000000"
                    value={data.responsiblePhone}
                    onChange={(e) => updateData('responsiblePhone', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* SLA Terms */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">SLA Terms</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="slaResponse" className="mb-1 text-xs">Response Time</Label>
                  <Select
                    value={data.slaResponseTime}
                    onValueChange={(v) => updateData('slaResponseTime', v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select response time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Within 1 hour</SelectItem>
                      <SelectItem value="4h">Within 4 hours</SelectItem>
                      <SelectItem value="8h">Within 8 hours</SelectItem>
                      <SelectItem value="24h">Within 24 hours</SelectItem>
                      <SelectItem value="48h">Within 48 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="slaUptime" className="mb-1 text-xs">Uptime Guarantee</Label>
                  <Select
                    value={data.slaUptime}
                    onValueChange={(v) => updateData('slaUptime', v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select uptime guarantee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="99.9">99.9%</SelectItem>
                      <SelectItem value="99.5">99.5%</SelectItem>
                      <SelectItem value="99">99%</SelectItem>
                      <SelectItem value="95">95%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Step 4: Review & Activate ─── */}
        {currentStep === 4 && (
          <motion.div
            key="step4"
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
            className="space-y-5"
          >
            <Card className="border-teal-200 bg-teal-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Check className="size-4 text-teal-600" />
                  Review Partner Registration
                </CardTitle>
                <CardDescription>
                  Please review all information before activating the partner.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Basic Info Summary */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Basic Information</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><span className="text-muted-foreground">Partner Type:</span> <Badge className="capitalize">{data.partnerType.replace(/_/g, ' ')}</Badge></div>
                    <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{data.name}</span></div>
                    {data.registrationNumber && <div><span className="text-muted-foreground">Reg Number:</span> {data.registrationNumber}</div>}
                    {data.country && <div><span className="text-muted-foreground">Country:</span> {data.country}</div>}
                    {data.website && <div className="col-span-2"><span className="text-muted-foreground">Website:</span> {data.website}</div>}
                  </div>
                </div>

                <Separator />

                {/* Integration Summary */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Integration</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><span className="text-muted-foreground">Type:</span> <Badge variant="outline" className="capitalize">{data.integrationType}</Badge></div>
                    <div><span className="text-muted-foreground">Auth:</span> <Badge variant="outline" className="uppercase text-xs">{data.authMethod.replace(/_/g, ' ')}</Badge></div>
                    {data.apiEndpoint && <div className="col-span-2"><span className="text-muted-foreground">API Endpoint:</span> <span className="font-mono text-xs">{data.apiEndpoint}</span></div>}
                    {data.webhookUrl && <div className="col-span-2"><span className="text-muted-foreground">Webhook URL:</span> <span className="font-mono text-xs">{data.webhookUrl}</span></div>}
                    {data.dataSharingScope.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Data Scope:</span>{' '}
                        {data.dataSharingScope.map((s) => (
                          <Badge key={s} variant="outline" className="mr-1 text-xs">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Trust & Compliance Summary */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Trust & Compliance</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div><span className="text-muted-foreground">Trust Rating:</span> <span className="font-bold text-teal-600">{data.trustRating}/100</span></div>
                    <div><span className="text-muted-foreground">Responsible:</span> {data.responsibleName}</div>
                    <div><span className="text-muted-foreground">Email:</span> {data.responsibleEmail}</div>
                    {data.slaResponseTime && <div><span className="text-muted-foreground">SLA Response:</span> {data.slaResponseTime}</div>}
                    {data.slaUptime && <div><span className="text-muted-foreground">SLA Uptime:</span> {data.slaUptime}%</div>}
                    {data.complianceRequirements.length > 0 && (
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Compliance:</span>{' '}
                        {data.complianceRequirements.map((c) => {
                          const req = COMPLIANCE_REQUIREMENTS.find((r) => r.id === c);
                          return <Badge key={c} variant="outline" className="mr-1 text-xs">{req?.label ?? c}</Badge>;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Terms of Service */}
            <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
              <Checkbox
                checked={data.termsAccepted}
                onCheckedChange={(v) => updateData('termsAccepted', !!v)}
                className="mt-0.5"
              />
              <span className="text-sm leading-relaxed">
                I acknowledge that this partner registration is compliant with PropComply AI + VerifyMe Global
                platform policies, including data protection (UK GDPR), anti-money laundering regulations
                (UK MLR 2017), and FCA guidance. I confirm that the responsible person listed above has
                been designated for ongoing compliance oversight.
              </span>
            </label>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          {currentStep > 1 && (
            <Button variant="outline" onClick={prevStep} className="gap-2">
              <ArrowLeft className="size-4" />
              Previous
            </Button>
          )}
          {currentStep === 1 && onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            Step {currentStep} of 4
          </Badge>
          {currentStep < 4 ? (
            <Button onClick={nextStep} disabled={!canProceed()} className="gap-2">
              Next
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className="gap-2 bg-teal-600 hover:bg-teal-700"
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              {isSubmitting ? 'Registering...' : 'Register Partner'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
