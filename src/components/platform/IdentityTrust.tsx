'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  ShieldCheck,
  User,
  FileText,
  ScanFace,
  TrendingUp,
  Building,
  Landmark,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Play,
  ChevronRight,
  ChevronDown,
  CreditCard,
  Globe,
  Users,
  UserPlus,
  ArrowRight,
  Search,
  X,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Eye,
  AlertTriangle,
  ClipboardCheck,
  Download,
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
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useApi } from '@/hooks/use-api';
import { TRUST_LEVELS, formatDate, getStatusStyle } from '@/lib/platform-data';
import { getDataScope, type WorkflowFeature, type UserRole } from '@/lib/rbac';
import VerifyMeOnboarding from '@/components/platform/VerifyMeOnboarding';
import WorkflowStageBanner from '@/components/platform/WorkflowStageBanner';

// Props
interface IdentityTrustProps {
  searchQuery?: string;
  onClearSearch?: () => void;
  // Active nav id: 'applicants' | 'verifications' | 'trust-ladder' — drives the focused view
  focus?: string;
}

// Types
interface Credential {
  id: string;
  credentialType: string;
  verificationStatus: string;
  validTo: string | null;
}

interface Verification {
  id: string;
  verificationType: string;
  status: string;
  confidence: number;
  completedAt: string | null;
}

interface IdentityProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  trustLevel: number;
  trustScore: number;
  status: string;
  nationality: string;
  credentials: Credential[];
  verifications: Verification[];
}

interface IdentitiesResponse {
  identities: IdentityProfile[];
  total: number;
}

// PII masking — shows first 2 + last 2 chars with *** in between
function maskPII(value: string): string {
  if (!value) return '***';
  const trimmed = value.trim();
  if (trimmed.length <= 4) return '****';
  return `${trimmed.slice(0, 2)}${'*'.repeat(Math.min(trimmed.length - 4, 6))}${trimmed.slice(-2)}`;
}

function maskEmail(email: string): string {
  if (!email) return '***@***.***';
  const [local, domain] = email.split('@');
  return `${maskPII(local)}@${domain ?? '***'}`;
}

// Icon mapping for trust levels
const TRUST_ICONS: Record<string, React.ReactNode> = {
  User: <User className="size-5" />,
  FileText: <FileText className="size-5" />,
  ScanFace: <ScanFace className="size-5" />,
  TrendingUp: <TrendingUp className="size-5" />,
  Building: <Building className="size-5" />,
  Landmark: <Landmark className="size-5" />,
};

// Verification status icons
function VerificationStatusIcon({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case 'passed':
    case 'completed':
    case 'verified':
      return <CheckCircle2 className="size-4 text-emerald-500" />;
    case 'pending':
      return <Clock className="size-4 text-amber-500" />;
    case 'failed':
    case 'rejected':
      return <XCircle className="size-4 text-red-500" />;
    case 'in_progress':
      return <AlertCircle className="size-4 text-cyan-500" />;
    default:
      return <Clock className="size-4 text-slate-400" />;
  }
}

// Credential type icon
function CredentialTypeIcon({ type }: { type: string }) {
  switch (type.toLowerCase()) {
    case 'passport':
      return <Globe className="size-4 text-blue-500" />;
    case 'national_id':
      return <CreditCard className="size-4 text-violet-500" />;
    case 'biometric':
      return <ScanFace className="size-4 text-emerald-500" />;
    case 'banking':
      return <Building className="size-4 text-cyan-500" />;
    case 'employer':
      return <FileText className="size-4 text-amber-500" />;
    case 'visa':
      return <Globe className="size-4 text-orange-500" />;
    case 'government':
      return <Landmark className="size-4 text-indigo-500" />;
    default:
      return <CreditCard className="size-4 text-slate-400" />;
  }
}

// Verification type display name
function getVerificationTypeName(type: string): string {
  const names: Record<string, string> = {
    document: 'Document Verification',
    biometric_face: 'Biometric Face Match',
    liveness: 'Liveness Detection',
    open_banking: 'Open Banking',
    income: 'Income Verification',
    employer: 'Employer Verification',
    government: 'Government Database',
  };
  return names[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Credential type display name
function getCredentialTypeName(type: string): string {
  const names: Record<string, string> = {
    passport: 'Passport',
    national_id: 'National ID',
    biometric: 'Biometric',
    banking: 'Banking',
    employer: 'Employer',
    visa: 'Visa',
    government: 'Government',
    residence_permit: 'Residence Permit',
    driving_licence: 'Driving Licence',
  };
  return names[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Animation variants
const ladderStepVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.12, duration: 0.4, ease: 'easeOut' },
  }),
};

const panelVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

// ─── Tenant View Component ──────────────────────────────────────────────────

const TRUST_LEVEL_REQUIREMENTS: Record<number, { actions: string[]; cta: string }> = {
  0: { actions: ['Create your PropComply account', 'Provide basic personal details'], cta: 'Account Created' },
  1: { actions: ['Upload a valid passport, national ID, or visa', 'Submit proof of address (utility bill, bank statement)', 'Pass document authenticity checks'], cta: 'Submit Documents' },
  2: { actions: ['Complete face match verification (liveness detection)', 'Pass biometric comparison against your document photo'], cta: 'Start Biometric Check' },
  3: { actions: ['Connect your bank account via Open Banking', 'Provide 3 months of income statements', 'Pass income and behaviour validation'], cta: 'Connect Open Banking' },
  4: { actions: ['Submit employer or university verification letter', 'Provide professional body membership if applicable'], cta: 'Submit Institutional Proof' },
  5: { actions: ['Government database check (where legally available)', 'HMRC, DWP or equivalent official verification'], cta: 'Request Government Check' },
};

function TenantIdentityView({
  profile,
  onStartOnboarding,
  canOnboard = true,
}: {
  profile: IdentityProfile | null;
  onStartOnboarding: () => void;
  canOnboard?: boolean;
}) {
  const [piiRevealed, setPiiRevealed] = useState(false);
  const [selectedLadderLevel, setSelectedLadderLevel] = useState<number | null>(null);

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <User className="mx-auto size-10 text-muted-foreground/40" />
            <h3 className="mt-3 text-sm font-medium text-muted-foreground">No Identity Profile Found</h3>
            <p className="mt-1 text-xs text-muted-foreground/70">
              You don&apos;t have an identity profile yet. Start the onboarding process to create one.
            </p>
            <Button
              size="sm"
              className="mt-4 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={onStartOnboarding}
            >
              <UserPlus className="size-3.5" />
              Start Onboarding
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const trustLevelData = TRUST_LEVELS[profile.trustLevel] ?? TRUST_LEVELS[0];
  const statusStyle = getStatusStyle(profile.status);

  // ── Onboarding outcome & verification report summary (FR-2) ───────────────
  const HIGH_RISK_NATIONALITIES = ['AF', 'IQ', 'LB', 'LY', 'SO', 'SS', 'YE', 'SD', 'MM', 'KP', 'IR', 'SY', 'RU', 'BY', 'CU', 'VE'];
  const isVerified = profile.status === 'verified' || profile.status === 'certified';
  const highRiskNationality = HIGH_RISK_NATIONALITIES.includes(profile.nationality ?? '');
  const r2rEligible = profile.trustLevel >= 2;
  const completedChecks = profile.verifications.filter((v) =>
    ['passed', 'verified', 'completed'].includes(v.status.toLowerCase())
  ).length;
  const onboardingOutcome = isVerified
    ? { label: 'Completed — Verified', color: '#059669', bg: '#ecfdf5' }
    : profile.status === 'rejected'
      ? { label: 'Unsuccessful', color: '#dc2626', bg: '#fef2f2' }
      : profile.status === 'suspended'
        ? { label: 'Suspended', color: '#d97706', bg: '#fffbeb' }
        : { label: 'In Progress', color: '#2563eb', bg: '#eff6ff' };
  const complianceStatus = highRiskNationality
    ? { label: 'EDD Required', color: '#dc2626', bg: '#fef2f2' }
    : isVerified
      ? { label: 'Standard CDD — Cleared', color: '#059669', bg: '#ecfdf5' }
      : { label: 'CDD Pending', color: '#d97706', bg: '#fffbeb' };

  return (
    <div className="space-y-6">
      {/* My Identity Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">My Identity Profile</CardTitle>
              <CardDescription>Your personal identity verification status — PII masked by default</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-7 px-2"
                onClick={() => setPiiRevealed(v => !v)}
              >
                <Eye className="size-3" />
                {piiRevealed ? 'Mask' : 'Reveal'}
              </Button>
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  backgroundColor: statusStyle.bgColor,
                  color: statusStyle.color,
                  borderColor: statusStyle.color,
                }}
              >
                {profile.status}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xl font-bold">
              {profile.firstName[0]}{profile.lastName[0]}
            </div>
            {/* Info */}
            <div className="flex-1 space-y-4 min-w-0">
              <div>
                <h3 className="text-lg font-semibold">
                  {piiRevealed ? `${profile.firstName} ${profile.lastName}` : `${maskPII(profile.firstName)} ${maskPII(profile.lastName)}`}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {piiRevealed ? profile.email : maskEmail(profile.email)}
                </p>
                {profile.nationality && (
                  <p className="text-sm text-muted-foreground">Nationality: {profile.nationality}</p>
                )}
                {!piiRevealed && (
                  <p className="text-[10px] text-amber-600 flex items-center gap-1 mt-1">
                    <Eye className="size-3" /> PII masked — click &quot;Reveal&quot; to view full details
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-0.5"
                  style={{
                    backgroundColor: trustLevelData.bgColor,
                    color: trustLevelData.color,
                    borderColor: trustLevelData.color,
                  }}
                >
                  L{profile.trustLevel} {trustLevelData.name}
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Trust Score:</span>
                  <Progress value={profile.trustScore} className="h-2 w-24" />
                  <span className="text-xs font-medium">{profile.trustScore}</span>
                </div>
              </div>
            </div>
            {/* Action — onboarding entry point is gated on completion status (FR-3) */}
            <div className="shrink-0">
              {profile.status === 'verified' || profile.status === 'certified' ? (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                  <CheckCircle2 className="size-3.5" />
                  Verified
                </Badge>
              ) : !canOnboard ? (
                <Badge variant="outline" className="gap-1 text-slate-500">
                  <Clock className="size-3.5" />
                  Onboarding Locked
                </Badge>
              ) : profile.status === 'rejected' ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-red-300 text-red-700 hover:bg-red-50"
                  onClick={onStartOnboarding}
                >
                  <UserPlus className="size-3.5" />
                  Re-submit Onboarding
                  <ArrowRight className="size-3.5" />
                </Button>
              ) : profile.status === 'in_progress' ? (
                <Button
                  size="sm"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={onStartOnboarding}
                >
                  <UserPlus className="size-3.5" />
                  Continue Onboarding
                  <ArrowRight className="size-3.5" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={onStartOnboarding}
                >
                  <UserPlus className="size-3.5" />
                  Start Onboarding
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Outcome & Verification Report (FR-2) — surfaced inline */}
      <Card className="border-teal-200 bg-gradient-to-br from-teal-50/40 to-white">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-teal-100">
              <ClipboardCheck className="size-4 text-teal-700" />
            </div>
            <div>
              <CardTitle className="text-base">Onboarding Outcome &amp; Verification Report</CardTitle>
              <CardDescription>Your completed onboarding results, generated from your verified record</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {/* Onboarding Outcome */}
            <div className="rounded-lg border p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Onboarding</p>
              <Badge className="mt-1 text-[11px] border-0" style={{ color: onboardingOutcome.color, backgroundColor: onboardingOutcome.bg }}>
                {onboardingOutcome.label}
              </Badge>
            </div>
            {/* Verification Status */}
            <div className="rounded-lg border p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Verification</p>
              <Badge className="mt-1 text-[11px] border-0 capitalize" style={{ color: statusStyle.color, backgroundColor: statusStyle.bgColor }}>
                {profile.status}
              </Badge>
            </div>
            {/* Trust Score */}
            <div className="rounded-lg border p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Trust Score</p>
              <p className="mt-1 text-sm font-semibold">{profile.trustScore}<span className="text-muted-foreground font-normal">/100</span></p>
              <p className="text-[10px] text-muted-foreground">L{profile.trustLevel} · {completedChecks}/{profile.verifications.length} checks</p>
            </div>
            {/* Compliance */}
            <div className="rounded-lg border p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Compliance</p>
              <Badge className="mt-1 text-[11px] border-0" style={{ color: complianceStatus.color, backgroundColor: complianceStatus.bg }}>
                {complianceStatus.label}
              </Badge>
            </div>
            {/* Right to Rent */}
            <div className="rounded-lg border p-3">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Right to Rent</p>
              <Badge
                className="mt-1 text-[11px] border-0"
                style={r2rEligible ? { color: '#059669', backgroundColor: '#ecfdf5' } : { color: '#d97706', backgroundColor: '#fffbeb' }}
              >
                {r2rEligible ? 'Eligible' : 'Not yet eligible'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Download Report */}
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => {
            const fullName = piiRevealed
              ? `${profile.firstName} ${profile.lastName}`
              : `${maskPII(profile.firstName)} ${maskPII(profile.lastName)}`;
            const email = piiRevealed ? profile.email : maskEmail(profile.email);
            const trustInfo = TRUST_LEVELS[profile.trustLevel];
            const r2rEligible = profile.trustLevel >= 2;
            const highRiskNat = ['AF','IQ','LB','LY','SO','SS','YE','SD','MM','KP','IR','SY','RU','BY','CU','VE'].includes(profile.nationality ?? '');
            const generatedAt = new Date().toLocaleString('en-GB');

            const verificationRows = (profile.verifications ?? []).map(v => `
              <tr>
                <td>${v.verificationType?.replace(/_/g,' ') ?? '—'}</td>
                <td>${v.status}</td>
                <td>${v.confidence ?? 0}%</td>
                <td>${v.completedAt ? new Date(v.completedAt).toLocaleDateString('en-GB') : 'Pending'}</td>
              </tr>`).join('') || '<tr><td colspan="4" style="color:#94a3b8;text-align:center">No verification records</td></tr>';

            const ladderSteps = TRUST_LEVELS.map(l => {
              const achieved = profile.trustLevel >= l.level;
              const bg = achieved ? l.bgColor : '#f8fafc';
              const border = achieved ? l.color : '#e2e8f0';
              const color = achieved ? l.color : '#94a3b8';
              return `<div style="padding:8px 12px;border-radius:6px;font-size:12px;border:1.5px solid ${border};background:${bg};color:${color};display:inline-block;margin:4px">
                L${l.level} ${l.name}${achieved ? ' ✓' : ''}
              </div>`;
            }).join('');

            const html = `<!DOCTYPE html><html><head><title>PropComply Identity Report</title>
<style>
  body{font-family:Arial,sans-serif;color:#1e293b;padding:40px;max-width:800px;margin:0 auto}
  h1{color:#064e3b;margin:0}
  .header{background:linear-gradient(135deg,#064e3b,#065f46);color:white;padding:24px 28px;border-radius:10px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-start}
  .header small{opacity:0.75;font-size:12px}
  .section{margin-bottom:18px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
  .sh{background:#f8fafc;padding:10px 16px;font-weight:700;font-size:13px;border-bottom:1px solid #e2e8f0;color:#334155;letter-spacing:.3px}
  .sb{padding:14px 16px}
  .row{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f1f5f9;font-size:13px}
  .row:last-child{border-bottom:none}
  .lbl{color:#64748b}
  .val{font-weight:600}
  .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700}
  .green{background:#dcfce7;color:#166534}
  .red{background:#fee2e2;color:#991b1b}
  .amber{background:#fef9c3;color:#92400e}
  table{width:100%;border-collapse:collapse;font-size:12px}
  th{text-align:left;padding:7px 10px;background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#475569;font-weight:600}
  td{padding:7px 10px;border-bottom:1px solid #f8fafc}
  .footer{margin-top:24px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center}
  @media print{body{padding:20px}.no-print{display:none}}
</style></head><body>
<div class="header">
  <div><h1>PropComply AI</h1><div style="font-size:14px;margin-top:4px;opacity:.85">Identity &amp; Compliance Report</div></div>
  <div style="text-align:right"><small>Generated: ${generatedAt}</small><br><small>Ref: ${profile.id?.slice(-8) ?? '—'}</small></div>
</div>

<div class="section">
  <div class="sh">Applicant Profile</div>
  <div class="sb">
    <div class="row"><span class="lbl">Full Name</span><span class="val">${fullName}</span></div>
    <div class="row"><span class="lbl">Email</span><span class="val">${email}</span></div>
    <div class="row"><span class="lbl">Nationality</span><span class="val">${profile.nationality || 'Not specified'}</span></div>
    <div class="row"><span class="lbl">Profile Status</span><span class="val"><span class="badge ${profile.status === 'certified' ? 'green' : profile.status === 'rejected' ? 'red' : 'amber'}">${profile.status?.toUpperCase() ?? '—'}</span></span></div>
    <div class="row"><span class="lbl">Trust Score</span><span class="val">${profile.trustScore ?? 0}/100</span></div>
  </div>
</div>

<div class="section">
  <div class="sh">Trust Ladder</div>
  <div class="sb">${ladderSteps}</div>
</div>

<div class="section">
  <div class="sh">Verification Results</div>
  <div class="sb" style="padding:0">
    <table>
      <thead><tr><th>Check Type</th><th>Status</th><th>Confidence</th><th>Completed</th></tr></thead>
      <tbody>${verificationRows}</tbody>
    </table>
  </div>
</div>

<div class="section">
  <div class="sh">Right to Rent Outcome</div>
  <div class="sb">
    <div class="row"><span class="lbl">Eligibility</span><span class="val"><span class="badge ${r2rEligible ? 'green' : 'red'}">${r2rEligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}</span></span></div>
    <div class="row"><span class="lbl">Basis</span><span class="val">${r2rEligible ? 'Trust Level 2+ achieved (Biometric Verified)' : 'Minimum Trust Level 2 not yet achieved'}</span></div>
    <div class="row"><span class="lbl">Regulation</span><span class="val">Immigration Act 2014 — Right to Rent</span></div>
  </div>
</div>

<div class="section">
  <div class="sh">Compliance Summary</div>
  <div class="sb">
    <div class="row"><span class="lbl">AML / KYC Regime</span><span class="val">UK MLR 2017</span></div>
    <div class="row"><span class="lbl">Due Diligence Level</span><span class="val"><span class="badge ${highRiskNat ? 'red' : 'green'}">${highRiskNat ? 'EDD Required' : 'Standard CDD'}</span></span></div>
    <div class="row"><span class="lbl">Data Protection</span><span class="val">UK GDPR — Article 6(1)(b) — Contractual Necessity</span></div>
    <div class="row"><span class="lbl">PII Handling</span><span class="val">${piiRevealed ? 'Full PII displayed (authorised user)' : 'PII masked — partial reveal only'}</span></div>
  </div>
</div>

<div class="footer">
  This report is generated under UK MLR 2017 and UK GDPR.<br>
  <strong>PropComply AI</strong> &nbsp;|&nbsp; For authorised use only &nbsp;|&nbsp; Ref: ${profile.id ?? '—'}
</div>
<script>window.onload=function(){window.print()}</script>
</body></html>`;

            const blob = new Blob([html], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const w = window.open(url, '_blank');
            if (!w) URL.revokeObjectURL(url);
            else w.onafterprint = () => URL.revokeObjectURL(url);
          }}
        >
          <Download className="size-3.5" />
          Download Report
        </Button>
      </div>

      {/* Trust Ladder for tenant */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Trust Ladder</CardTitle>
          <CardDescription>Progress through identity verification levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {TRUST_LEVELS.map((level, index) => {
              const isSelected = profile.trustLevel === level.level;
              const isAchieved = profile.trustLevel >= level.level;
              const isHighlighted = isSelected || isAchieved;
              const isExpanded = selectedLadderLevel === level.level;
              const isNext = level.level === profile.trustLevel + 1;
              const reqs = TRUST_LEVEL_REQUIREMENTS[level.level];

              return (
                <motion.div
                  key={level.level}
                  custom={index}
                  variants={ladderStepVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <button
                    type="button"
                    className="w-full text-left"
                    onClick={() => setSelectedLadderLevel(isExpanded ? null : level.level)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                            isHighlighted
                              ? 'border-emerald-500 shadow-md'
                              : 'border-muted-foreground/20'
                          }`}
                          style={{
                            backgroundColor: isHighlighted ? level.bgColor : 'transparent',
                          }}
                        >
                          <span
                            className="text-xs font-bold"
                            style={{ color: isHighlighted ? level.color : '#94a3b8' }}
                          >
                            {level.level}
                          </span>
                        </div>
                        {index < TRUST_LEVELS.length - 1 && (
                          <div
                            className={`h-6 w-0.5 transition-colors duration-300 ${
                              isAchieved && profile.trustLevel !== level.level
                                ? 'bg-emerald-300'
                                : 'bg-muted-foreground/15'
                            }`}
                          />
                        )}
                      </div>
                      <div className={`min-w-0 flex-1 pb-4 ${index === TRUST_LEVELS.length - 1 ? 'pb-0' : ''}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span style={{ color: isHighlighted ? level.color : '#94a3b8' }}>
                              {TRUST_ICONS[level.icon] ?? <User className="size-4" />}
                            </span>
                            <span
                              className={`text-sm font-semibold ${
                                isHighlighted ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                            >
                              {level.name}
                            </span>
                            {isAchieved && (
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px] px-1.5 py-0">
                                Achieved
                              </Badge>
                            )}
                            {isNext && (
                              <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] px-1.5 py-0">
                                Next Step
                              </Badge>
                            )}
                          </div>
                          <ChevronDown
                            className={`size-3.5 shrink-0 text-muted-foreground/50 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                          {level.description}
                        </p>
                      </div>
                    </div>
                  </button>
                  {isExpanded && reqs && (
                    <div className="ml-12 mb-3 rounded-lg border bg-muted/30 p-3 space-y-2">
                      <p className="text-xs font-semibold text-foreground">
                        {isAchieved ? 'Completed requirements:' : 'Requirements to achieve this level:'}
                      </p>
                      <ul className="space-y-1">
                        {reqs.actions.map((action, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            {isAchieved
                              ? <CheckCircle2 className="size-3 text-emerald-500 mt-0.5 shrink-0" />
                              : <ChevronRight className="size-3 text-muted-foreground/50 mt-0.5 shrink-0" />
                            }
                            {action}
                          </li>
                        ))}
                      </ul>
                      {!isAchieved && isNext && canOnboard && (
                        <Button
                          size="sm"
                          className="mt-2 h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={(e) => { e.stopPropagation(); onStartOnboarding(); }}
                        >
                          <Play className="size-3" />
                          {reqs.cta}
                        </Button>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Verification records & Credentials for tenant */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Verification Records</CardTitle>
                <CardDescription>Your verification workflow</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {profile.verifications.length} checks
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {profile.verifications.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No verification records yet
                  </div>
                )}
                {profile.verifications.map((v) => {
                  const vStatusStyle = getStatusStyle(v.status);
                  return (
                    <div
                      key={v.id}
                      className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="mt-0.5">
                        <VerificationStatusIcon status={v.status} />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {getVerificationTypeName(v.verificationType)}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                            style={{
                              backgroundColor: vStatusStyle.bgColor,
                              color: vStatusStyle.color,
                              borderColor: vStatusStyle.color,
                            }}
                          >
                            {v.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Confidence:</span>
                          <Progress value={v.confidence} className="h-1.5 w-20" />
                          <span className="text-xs font-medium">{v.confidence}%</span>
                        </div>
                        {v.completedAt && (
                          <div className="text-xs text-muted-foreground">
                            Completed: {formatDate(v.completedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Credentials</CardTitle>
                <CardDescription>Identity credentials & documents</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {profile.credentials.length} items
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {profile.credentials.length === 0 && (
                  <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                    No credentials yet
                  </div>
                )}
                {profile.credentials.map((cred) => {
                  const cStatusStyle = getStatusStyle(cred.verificationStatus);
                  return (
                    <div key={cred.id} className="rounded-lg border p-3 transition-colors hover:bg-muted/30">
                      <div className="flex items-start gap-2">
                        <CredentialTypeIcon type={cred.credentialType} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">
                            {getCredentialTypeName(cred.credentialType)}
                          </div>
                          <Badge
                            variant="outline"
                            className="mt-1 text-[10px] px-1.5 py-0"
                            style={{
                              backgroundColor: cStatusStyle.bgColor,
                              color: cStatusStyle.color,
                              borderColor: cStatusStyle.color,
                            }}
                          >
                            {cred.verificationStatus}
                          </Badge>
                          {cred.validTo && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              Expires: {formatDate(cred.validTo)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* UK GDPR — privacy & data subject rights notice */}
      <Card className="border-slate-200 bg-slate-50/60">
        <CardContent className="py-4">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="size-4 text-teal-600 mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Your data &amp; your rights (UK GDPR).</strong> The personal data shown
              here is <strong>masked by default</strong> to protect your privacy — use &ldquo;Reveal&rdquo; only when needed.
              It is processed under lawful basis Art. 6(1)(b)/(c) for identity verification and compliance (UK MLR 2017),
              held securely and retained for up to 5 years. You have the right to <strong>access, rectify, restrict,
              port and erase</strong> your data, and to <strong>withdraw consent</strong> at any time. To exercise these
              rights, contact our Data Protection Officer at <span className="text-teal-700">dpo@propcomply.ai</span>.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Verifier Review Actions Component ──────────────────────────────────────

function VerifierReviewActions({
  verification,
  profileId,
  onAction,
  disabled = false,
}: {
  verification: Verification;
  profileId: string;
  onAction: (profileId: string, verificationId: string, action: 'approved' | 'rejected' | 'more_evidence') => void;
  disabled?: boolean;
}) {
  if (verification.status !== 'pending' && verification.status !== 'in_progress') {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      <Button
        size="sm"
        disabled={disabled}
        className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2"
        onClick={(e) => {
          e.stopPropagation();
          onAction(profileId, verification.id, 'approved');
        }}
      >
        <ThumbsUp className="mr-0.5 size-2.5" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={disabled}
        className="h-6 text-[10px] px-2"
        onClick={(e) => {
          e.stopPropagation();
          onAction(profileId, verification.id, 'rejected');
        }}
      >
        <ThumbsDown className="mr-0.5 size-2.5" />
        Reject
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={disabled}
        className="h-6 text-[10px] px-2"
        onClick={(e) => {
          e.stopPropagation();
          onAction(profileId, verification.id, 'more_evidence');
        }}
      >
        <HelpCircle className="mr-0.5 size-2.5" />
        Request More Evidence
      </Button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function IdentityTrust({ searchQuery = '', onClearSearch, focus = 'applicants' }: IdentityTrustProps) {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const userRole = (session?.user?.role as string) || 'tenant';
  // Which feature page is in focus drives the persona banner + which blocks show
  const feature: WorkflowFeature = focus === 'trust-ladder' ? 'trust-ladder' : 'verifications';
  const showLadderColumn = focus !== 'verifications';
  const showDetailPanels = focus !== 'trust-ladder';
  const dataScope = getDataScope(userRole as 'platform_admin' | 'compliance_officer' | 'property_manager' | 'identity_verifier' | 'risk_analyst' | 'partner_integration_manager' | 'partner_user' | 'tenant');
  const isTenant = dataScope === 'own';
  const isVerifier = userRole === 'identity_verifier';
  // Roles allowed to approve/reject an applicant's identity
  const canReview = isVerifier || userRole === 'platform_admin' || userRole === 'compliance_officer';

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profiles');
  // Tracks the profile id currently being approved/rejected so we can disable buttons
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const { data: identitiesData, isLoading } = useApi<IdentitiesResponse>('identities', '/api/identities', true, {
    userId: session?.user?.id || '',
    role: session?.user?.role || '',
  });

  const allIdentities = identitiesData?.identities ?? [];

  // Filter identities based on role scope.
  // For tenants the API (/api/identities) already restricts results to the
  // signed-in user's own linked profile(s) via userId, so we use them directly.
  const scopedIdentities = allIdentities;

  // Apply search filtering on the profiles tab
  const filteredIdentities = useMemo(() => {
    if (!searchQuery.trim() || activeTab !== 'profiles') return scopedIdentities;
    const q = searchQuery.toLowerCase();
    return scopedIdentities.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.nationality && p.nationality.toLowerCase().includes(q))
    );
  }, [scopedIdentities, searchQuery, activeTab]);

  const selectedProfile = scopedIdentities.find((p) => p.id === selectedProfileId) ?? null;

  // Reviewers: compute pending reviews (profiles with outstanding verification checks)
  const pendingReviews = useMemo(() => {
    if (!canReview) return [];
    return scopedIdentities.filter((p) =>
      p.verifications.some((v) => v.status === 'pending' || v.status === 'in_progress')
    );
  }, [scopedIdentities, canReview]);

  // Persist a profile change to the API, then refresh the identities (and dashboard) data.
  // Refetching is what surfaces the approval on the applicant's own "My Profile" view,
  // since that view reads the same /api/identities data scoped to their user id.
  const patchProfile = async (profileId: string, body: Record<string, unknown>): Promise<boolean> => {
    setReviewingId(profileId);
    try {
      const res = await fetch(`/api/identities/${profileId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, performedBy: session?.user?.id || 'verifier' }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Update failed (${res.status})`);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['identities'] }),
        queryClient.invalidateQueries({ queryKey: ['dashboard'] }),
      ]);
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Something went wrong');
      return false;
    } finally {
      setReviewingId(null);
    }
  };

  // Per-check review actions (Approve / Reject / Request more evidence on a single verification).
  // Approving the last outstanding check also marks the whole profile verified.
  const handleVerifierAction = async (
    profileId: string,
    verificationId: string,
    action: 'approved' | 'rejected' | 'more_evidence',
  ) => {
    const profile = scopedIdentities.find((p) => p.id === profileId);
    const body: Record<string, unknown> = { verificationId };

    if (action === 'approved') {
      body.verificationStatus = 'verified';
      // Any other checks still outstanding besides this one?
      const othersPending = (profile?.verifications ?? []).some(
        (v) => v.id !== verificationId && (v.status === 'pending' || v.status === 'in_progress'),
      );
      if (!othersPending) body.status = 'verified';
    } else if (action === 'rejected') {
      body.verificationStatus = 'rejected';
      body.status = 'rejected';
    } else {
      body.verificationStatus = 'pending';
      body.status = 'in_progress';
    }

    const ok = await patchProfile(profileId, body);
    if (ok) {
      toast.success(
        action === 'approved'
          ? body.status === 'verified'
            ? 'Applicant approved — profile is now Verified and visible on their My Profile'
            : 'Verification approved'
          : action === 'rejected'
            ? 'Verification rejected'
            : 'More evidence requested',
      );
    }
  };

  // Profile-level review (the "Approve Applicant" / "Reject" buttons on the selected profile).
  const handleProfileReview = async (profileId: string, action: 'approve' | 'reject') => {
    const body: Record<string, unknown> =
      action === 'approve'
        ? { status: 'verified', verifyAllPending: true }
        : { status: 'rejected' };
    const ok = await patchProfile(profileId, body);
    if (ok) {
      toast.success(
        action === 'approve'
          ? 'Applicant approved — profile is now Verified and visible on their My Profile'
          : 'Applicant rejected',
      );
    }
  };

  // Handle onboarding complete — refresh identities so the newly created/linked
  // profile shows on My Profile, then switch back to the profiles tab.
  const handleOnboardingComplete = () => {
    queryClient.invalidateQueries({ queryKey: ['identities'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    setActiveTab('profiles');
  };

  // ─── Tenant View ─────────────────────────────────────────────────────────
  if (isTenant) {
    const myProfile = scopedIdentities[0] ?? null;
    // Onboarding completion gate (FR-3): once a profile is verified/certified the
    // onboarding entry point is hidden to prevent duplicate submissions. It is only
    // re-enabled when the application was rejected or remediation is required.
    const onboardingComplete = !!myProfile && ['verified', 'certified'].includes(myProfile.status);
    const onboardingLocked = myProfile?.status === 'suspended';
    const canOnboard = !onboardingComplete && !onboardingLocked;
    // Never leave the user stranded on a now-hidden onboarding tab.
    const effectiveTab = !canOnboard && activeTab === 'onboarding' ? 'profiles' : activeTab;

    return (
      <div className="space-y-6">
        <WorkflowStageBanner role={userRole as UserRole} feature={feature} />
        <Tabs value={effectiveTab} onValueChange={setActiveTab}>
          <TabsList className="mb-2">
            <TabsTrigger value="profiles" className="gap-1.5">
              <User className="size-3.5" />
              My Profile
            </TabsTrigger>
            {canOnboard && (
              <TabsTrigger value="onboarding" className="gap-1.5">
                <UserPlus className="size-3.5" />
                {myProfile?.status === 'rejected' ? 'Re-submit Onboarding' : 'Onboarding'}
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="profiles">
            <TenantIdentityView
              profile={myProfile}
              canOnboard={canOnboard}
              onStartOnboarding={() => { if (canOnboard) setActiveTab('onboarding'); }}
            />
          </TabsContent>

          {canOnboard && (
            <TabsContent value="onboarding">
              <VerifyMeOnboarding onComplete={handleOnboardingComplete} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    );
  }

  // ─── Non-Tenant Views (Admin, Verifier, etc.) ────────────────────────────

  return (
    <div className="space-y-6">
      <WorkflowStageBanner role={userRole as UserRole} feature={feature} />
      {/* Tabs: Profiles | Onboarding */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-2">
          <TabsTrigger value="profiles" className="gap-1.5">
            <Users className="size-3.5" />
            Profiles
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="gap-1.5">
            <UserPlus className="size-3.5" />
            Onboarding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles">
          {/* Search Info Banner */}
          {searchQuery.trim() && activeTab === 'profiles' && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3"
            >
              <Search className="size-4 text-emerald-600 shrink-0" />
              <span className="text-sm text-emerald-800">
                Showing <strong>{filteredIdentities.length}</strong> result{filteredIdentities.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
              </span>
              {onClearSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-6 gap-1 text-xs text-emerald-700 hover:bg-emerald-100"
                  onClick={onClearSearch}
                >
                  <X className="size-3" />
                  Clear
                </Button>
              )}
            </motion.div>
          )}

          {/* Reviewer: Pending Reviews Section */}
          {canReview && pendingReviews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100">
                        <ClipboardCheck className="size-4 text-amber-700" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Pending Reviews</CardTitle>
                        <CardDescription>
                          {pendingReviews.length} profile{pendingReviews.length !== 1 ? 's' : ''} awaiting verification review
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                      {pendingReviews.length} pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pendingReviews.map((profile) => {
                      const pendingVerifications = profile.verifications.filter(
                        (v) => v.status === 'pending' || v.status === 'in_progress'
                      );
                      const trustLevelData = TRUST_LEVELS[profile.trustLevel] ?? TRUST_LEVELS[0];
                      return (
                        <div
                          key={profile.id}
                          className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-3 cursor-pointer hover:bg-amber-50/50 transition-colors"
                          onClick={() => setSelectedProfileId(profile.id)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold shrink-0">
                              {profile.firstName[0]}{profile.lastName[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">
                                {profile.firstName} {profile.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{profile.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                              style={{
                                backgroundColor: trustLevelData.bgColor,
                                color: trustLevelData.color,
                                borderColor: trustLevelData.color,
                              }}
                            >
                              L{profile.trustLevel}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                              {pendingVerifications.length} check{pendingVerifications.length !== 1 ? 's' : ''}
                            </Badge>
                            <ChevronRight className="size-4 text-amber-500" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            {/* Trust Ladder Visualization — hidden on the Verifications page */}
            {showLadderColumn && (
            <motion.div
              initial="hidden"
              animate="visible"
              className="xl:col-span-3"
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-base">Trust Ladder</CardTitle>
                  <CardDescription>6-level identity verification framework</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {TRUST_LEVELS.map((level, index) => {
                      const isSelected = selectedProfile?.trustLevel === level.level;
                      const isAchieved = selectedProfile ? selectedProfile.trustLevel >= level.level : false;
                      const isHighlighted = isSelected || (selectedProfile && isAchieved);

                      return (
                        <motion.div
                          key={level.level}
                          custom={index}
                          variants={ladderStepVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          <div className="flex items-start gap-3">
                            {/* Vertical connector line */}
                            <div className="flex flex-col items-center">
                              <div
                                className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                  isHighlighted
                                    ? 'border-emerald-500 shadow-md'
                                    : 'border-muted-foreground/20'
                                }`}
                                style={{
                                  backgroundColor: isHighlighted ? level.bgColor : 'transparent',
                                }}
                              >
                                <span
                                  className="text-sm font-bold"
                                  style={{ color: isHighlighted ? level.color : '#94a3b8' }}
                                >
                                  {level.level}
                                </span>
                              </div>
                              {index < TRUST_LEVELS.length - 1 && (
                                <div
                                  className={`h-8 w-0.5 transition-colors duration-300 ${
                                    isAchieved && selectedProfile?.trustLevel !== level.level
                                      ? 'bg-emerald-300'
                                      : 'bg-muted-foreground/15'
                                  }`}
                                />
                              )}
                            </div>

                            {/* Level details */}
                            <div className={`min-w-0 pb-6 ${index === TRUST_LEVELS.length - 1 ? 'pb-0' : ''}`}>
                              <div className="flex items-center gap-2">
                                <span style={{ color: isHighlighted ? level.color : '#94a3b8' }}>
                                  {TRUST_ICONS[level.icon] ?? <User className="size-4" />}
                                </span>
                                <span
                                  className={`text-sm font-semibold ${
                                    isHighlighted ? 'text-foreground' : 'text-muted-foreground'
                                  }`}
                                >
                                  {level.name}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                                {level.description}
                              </p>
                              {isSelected && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="mt-1"
                                >
                                  <Badge
                                    className="text-[10px] px-1.5 py-0"
                                    style={{
                                      backgroundColor: level.bgColor,
                                      color: level.color,
                                      borderColor: level.color,
                                    }}
                                  >
                                    Current Level
                                  </Badge>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            )}

            {/* Right section: Table + Details */}
            <div className={`space-y-6 ${showLadderColumn ? 'xl:col-span-9' : 'xl:col-span-12'}`}>
              {/* Identity Profiles Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Identity Profiles</CardTitle>
                      <CardDescription>
                        {isLoading ? 'Loading...' : `${filteredIdentities.length} profiles ${searchQuery.trim() ? 'matching' : 'registered'}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <User className="mr-1 size-3" />
                        {filteredIdentities.length}
                      </Badge>
                      <Button
                        size="sm"
                        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => setActiveTab('onboarding')}
                      >
                        <UserPlus className="size-3.5" />
                        <span className="hidden sm:inline">New Onboarding</span>
                        <span className="sm:hidden">Onboard</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Trust Level</TableHead>
                          <TableHead>Trust Score</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">Nationality</TableHead>
                          <TableHead className="w-8"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading && (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                              Loading identities...
                            </TableCell>
                          </TableRow>
                        )}
                        {!isLoading && filteredIdentities.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                              {searchQuery.trim() ? 'No profiles match your search' : 'No identities found'}
                            </TableCell>
                          </TableRow>
                        )}
                        {filteredIdentities.map((profile) => {
                          const trustLevelData = TRUST_LEVELS[profile.trustLevel] ?? TRUST_LEVELS[0];
                          const pStatusStyle = getStatusStyle(profile.status);
                          const isSelected = selectedProfileId === profile.id;

                          return (
                            <TableRow
                              key={profile.id}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                              }`}
                              onClick={() => setSelectedProfileId(isSelected ? null : profile.id)}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {profile.firstName} {profile.lastName}
                                  {profile.status === 'verified' && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 hover:bg-teal-100 transition-colors border border-teal-200"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveTab('onboarding');
                                          }}
                                        >
                                          View Onboarding
                                          <ArrowRight className="size-3" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>View the VerifyMe onboarding flow</TooltipContent>
                                    </Tooltip>
                                  )}
                                  {profile.status === 'pending' && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveTab('onboarding');
                                          }}
                                        >
                                          Start Onboarding
                                          <ArrowRight className="size-3" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>Continue to VerifyMe onboarding flow</TooltipContent>
                                    </Tooltip>
                                  )}
                                  {profile.status === 'in_progress' && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          className="inline-flex items-center gap-1 rounded-md bg-cyan-50 px-1.5 py-0.5 text-[10px] font-medium text-cyan-700 hover:bg-cyan-100 transition-colors border border-cyan-200"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveTab('onboarding');
                                          }}
                                        >
                                          Continue Onboarding
                                          <ArrowRight className="size-3" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>Continue the VerifyMe onboarding process</TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {profile.email}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0"
                                  style={{
                                    backgroundColor: trustLevelData.bgColor,
                                    color: trustLevelData.color,
                                    borderColor: trustLevelData.color,
                                  }}
                                >
                                  L{profile.trustLevel} {trustLevelData.name}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={profile.trustScore} className="h-1.5 w-16" />
                                  <span className="text-xs text-muted-foreground">{profile.trustScore}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0"
                                  style={{
                                    backgroundColor: pStatusStyle.bgColor,
                                    color: pStatusStyle.color,
                                    borderColor: pStatusStyle.color,
                                  }}
                                >
                                  {profile.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                {profile.nationality || '—'}
                              </TableCell>
                              <TableCell>
                                <ChevronRight
                                  className={`size-4 text-muted-foreground transition-transform ${
                                    isSelected ? 'rotate-90' : ''
                                  }`}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Selected Profile Details — verification/credential panels hidden on the Trust Ladder page */}
              {showDetailPanels && (
              <AnimatePresence mode="wait">
                {selectedProfile && (
                  <motion.div
                    key={selectedProfile.id}
                    variants={panelVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="space-y-6"
                  >
                    {/* Profile-level review bar — approve the whole applicant in one click */}
                    {canReview && (
                      <Card className="border-emerald-200 bg-emerald-50/40">
                        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                              <ShieldCheck className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate">
                                Review {selectedProfile.firstName} {selectedProfile.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {selectedProfile.status === 'verified'
                                  ? 'Approved — this profile is Verified and shown on the applicant’s My Profile.'
                                  : selectedProfile.status === 'rejected'
                                    ? 'This applicant has been rejected.'
                                    : 'Approving marks the applicant Verified and surfaces it on their My Profile.'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {selectedProfile.status === 'verified' ? (
                              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                                <CheckCircle2 className="size-3.5" />
                                Verified
                              </Badge>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  disabled={reviewingId === selectedProfile.id}
                                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                  onClick={() => handleProfileReview(selectedProfile.id, 'approve')}
                                >
                                  <ThumbsUp className="size-3.5" />
                                  Approve Applicant
                                </Button>
                                {selectedProfile.status !== 'rejected' && (
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    disabled={reviewingId === selectedProfile.id}
                                    className="gap-1.5"
                                    onClick={() => handleProfileReview(selectedProfile.id, 'reject')}
                                  >
                                    <ThumbsDown className="size-3.5" />
                                    Reject
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Verification Workflow Panel */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">Verification Records</CardTitle>
                            <CardDescription>
                              {selectedProfile.firstName}&apos;s verification workflow
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {selectedProfile.verifications.length} checks
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="max-h-96">
                          <div className="space-y-3">
                            {selectedProfile.verifications.length === 0 && (
                              <div className="py-8 text-center text-sm text-muted-foreground">
                                No verification records yet
                              </div>
                            )}
                            {selectedProfile.verifications.map((v) => {
                              const vStatusStyle = getStatusStyle(v.status);
                              const isPendingOrInProgress = v.status === 'pending' || v.status === 'in_progress';
                              return (
                                <div
                                  key={v.id}
                                  className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30"
                                >
                                  <div className="mt-0.5">
                                    <VerificationStatusIcon status={v.status} />
                                  </div>
                                  <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium">
                                        {getVerificationTypeName(v.verificationType)}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0"
                                        style={{
                                          backgroundColor: vStatusStyle.bgColor,
                                          color: vStatusStyle.color,
                                          borderColor: vStatusStyle.color,
                                        }}
                                      >
                                        {v.status}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">Confidence:</span>
                                      <Progress value={v.confidence} className="h-1.5 w-20" />
                                      <span className="text-xs font-medium">{v.confidence}%</span>
                                    </div>
                                    {v.completedAt && (
                                      <div className="text-xs text-muted-foreground">
                                        Completed: {formatDate(v.completedAt)}
                                      </div>
                                    )}
                                    {/* Non-reviewer: show Start Verification button */}
                                    {!canReview && isPendingOrInProgress && (
                                      <Button size="sm" variant="outline" className="mt-1 h-7 text-xs">
                                        <Play className="mr-1 size-3" />
                                        Start Verification
                                      </Button>
                                    )}
                                    {/* Reviewer: show review action buttons prominently */}
                                    {canReview && isPendingOrInProgress && (
                                      <VerifierReviewActions
                                        verification={v}
                                        profileId={selectedProfile.id}
                                        onAction={handleVerifierAction}
                                        disabled={reviewingId === selectedProfile.id}
                                      />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    {/* Credential Cards */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">Credentials</CardTitle>
                            <CardDescription>
                              Identity credentials & documents
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {selectedProfile.credentials.length} items
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="max-h-96">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {selectedProfile.credentials.length === 0 && (
                              <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                                No credentials yet
                              </div>
                            )}
                            {selectedProfile.credentials.map((cred) => {
                              const cStatusStyle = getStatusStyle(cred.verificationStatus);
                              return (
                                <motion.div
                                  key={cred.id}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="rounded-lg border p-3 transition-colors hover:bg-muted/30">
                                    <div className="flex items-start gap-2">
                                      <CredentialTypeIcon type={cred.credentialType} />
                                      <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium truncate">
                                          {getCredentialTypeName(cred.credentialType)}
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className="mt-1 text-[10px] px-1.5 py-0"
                                          style={{
                                            backgroundColor: cStatusStyle.bgColor,
                                            color: cStatusStyle.color,
                                            borderColor: cStatusStyle.color,
                                          }}
                                        >
                                          {cred.verificationStatus}
                                        </Badge>
                                        {cred.validTo && (
                                          <div className="mt-1 text-xs text-muted-foreground">
                                            Expires: {formatDate(cred.validTo)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              )}

              {/* Empty state when no profile selected */}
              {!selectedProfile && (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <ShieldCheck className="mx-auto size-10 text-muted-foreground/40" />
                      <h3 className="mt-3 text-sm font-medium text-muted-foreground">Select a Profile</h3>
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        Click on an identity profile above to view verification details and credentials
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => setActiveTab('onboarding')}
                      >
                        <UserPlus className="size-3.5" />
                        Start New Onboarding
                        <ArrowRight className="size-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="onboarding">
          <VerifyMeOnboarding onComplete={handleOnboardingComplete} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
