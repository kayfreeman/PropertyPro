'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Handshake,
  Landmark,
  Shield,
  Home,
  ArrowLeftRight,
  Briefcase,
  GraduationCap,
  Building2,
  Users,
  Link2,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Webhook,
  Globe,
  Zap,
  Code,
  ArrowRight,
  Activity,
  TrendingUp,
  Eye,
  ChevronDown,
  ChevronRight,
  Lock,
  BookOpen,
  FileJson,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useApi } from '@/hooks/use-api';
import { useSession } from 'next-auth/react';
import { PARTNER_TYPES, getStatusStyle, formatDate } from '@/lib/platform-data';

// Types
interface PartnerReferral {
  id: string;
  partnerId: string;
  profileId: string | null;
  referralType: string;
  status: string;
  referralData: string | null;
  createdAt: string;
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

interface Partner {
  id: string;
  name: string;
  partnerType: string;
  status: string;
  apiEndpoint: string | null;
  integrationType: string | null;
  trustRating: number;
  createdAt: string;
  updatedAt: string;
  referrals: PartnerReferral[];
  _count: {
    referrals: number;
  };
}

interface PartnersResponse {
  partners: Partner[];
  total: number;
  summary: {
    byPartnerType: { type: string; count: number; avgTrustRating: number }[];
    referralsByStatus: Record<string, number>;
    referralsByType: Record<string, number>;
  };
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const partnerTypeIcons: Record<string, React.ReactNode> = {
  bank: <Landmark className="size-5" />,
  insurer: <Shield className="size-5" />,
  mortgage_provider: <Home className="size-5" />,
  remittance: <ArrowLeftRight className="size-5" />,
  employer: <Briefcase className="size-5" />,
  university: <GraduationCap className="size-5" />,
};

const partnerTypeColors: Record<string, { color: string; bg: string }> = {
  bank: { color: '#0d9488', bg: '#f0fdfa' },
  insurer: { color: '#8b5cf6', bg: '#f5f3ff' },
  mortgage_provider: { color: '#f59e0b', bg: '#fffbeb' },
  remittance: { color: '#06b6d4', bg: '#ecfeff' },
  employer: { color: '#6366f1', bg: '#eef2ff' },
  university: { color: '#ec4899', bg: '#fdf2f8' },
};

function StatusBadge({ status }: { status: string }) {
  const style = getStatusStyle(status);
  return (
    <Badge
      className="font-medium"
      style={{
        backgroundColor: style.bgColor,
        color: style.color,
        borderColor: 'transparent',
      }}
    >
      {status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
    </Badge>
  );
}

function PartnerTypeBadge({ type }: { type: string }) {
  const pt = PARTNER_TYPES.find((p) => p.type === type);
  const colors = partnerTypeColors[type] || { color: '#94a3b8', bg: '#f1f5f9' };
  return (
    <Badge
      className="font-medium gap-1"
      style={{ backgroundColor: colors.bg, color: colors.color, borderColor: 'transparent' }}
    >
      {pt?.name ?? type}
    </Badge>
  );
}

// ── Barclays API Catalog (partner_user only) ──────────────────────────────────

interface ApiEndpointDef {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  purpose: string;
  domain: string;
  requestSchema: string;
  sampleRequest: string;
  sampleResponse: string;
  errorResponses: string;
}

const BARCLAYS_API_CATALOG: ApiEndpointDef[] = [
  {
    id: 'identity-verify',
    name: 'Submit Identity Referral',
    method: 'POST',
    path: '/api/v1/referrals/identity',
    description: 'Submit a verified identity package to Barclays for account opening pre-qualification.',
    purpose: 'Sends a KYC bundle (name, nationality, trust score, compliance status) from PropComply to Barclays for instant account-opening eligibility screening.',
    domain: 'Banking / Identity',
    requestSchema: `{
  "profileId": "string (PropComply profile UUID)",
  "firstName": "string",
  "lastName": "string",
  "dateOfBirth": "string (YYYY-MM-DD)",
  "nationality": "string (ISO 3166-1 alpha-2)",
  "trustScore": "number (0–100)",
  "trustLevel": "number (1–5)",
  "complianceStatus": "string (clear | pending | review | failed)",
  "riskLevel": "string (low | medium | high)",
  "consentGiven": "boolean"
}`,
    sampleRequest: `POST /api/v1/referrals/identity
Authorization: Bearer <partner_token>
Content-Type: application/json

{
  "profileId": "prof_8f3a21bc",
  "firstName": "James",
  "lastName": "Okafor",
  "dateOfBirth": "1990-04-15",
  "nationality": "GB",
  "trustScore": 92,
  "trustLevel": 4,
  "complianceStatus": "clear",
  "riskLevel": "low",
  "consentGiven": true
}`,
    sampleResponse: `HTTP 201 Created
{
  "referralId": "ref_7a9c4d21",
  "status": "submitted",
  "estimatedDecision": "2–3 business days",
  "trackingUrl": "https://partner.barclays.co.uk/referrals/ref_7a9c4d21",
  "createdAt": "2026-06-18T09:42:00Z"
}`,
    errorResponses: `400 Bad Request   — Missing required fields or invalid nationality code
401 Unauthorized  — Invalid or expired partner token
403 Forbidden     — consentGiven must be true; referral blocked
409 Conflict      — Duplicate referral for this profileId within 30 days
422 Unprocessable — trustScore < 60 or complianceStatus !== 'clear'`,
  },
  {
    id: 'referral-status',
    name: 'Get Referral Status',
    method: 'GET',
    path: '/api/v1/referrals/{referralId}',
    description: 'Poll the status of a previously submitted identity referral.',
    purpose: 'Returns the current decision stage and any outstanding requirements for an active referral. Intended for polling or webhook-less integrations.',
    domain: 'Banking / Referral',
    requestSchema: `Path param:
  referralId: string (returned by POST /referrals/identity)

Query params (optional):
  include_history: boolean (default false)`,
    sampleRequest: `GET /api/v1/referrals/ref_7a9c4d21?include_history=true
Authorization: Bearer <partner_token>`,
    sampleResponse: `HTTP 200 OK
{
  "referralId": "ref_7a9c4d21",
  "status": "under_review",
  "stage": "credit_assessment",
  "lastUpdated": "2026-06-19T14:10:00Z",
  "history": [
    { "stage": "submitted", "timestamp": "2026-06-18T09:42:00Z" },
    { "stage": "kyc_verified", "timestamp": "2026-06-18T11:00:00Z" },
    { "stage": "under_review", "timestamp": "2026-06-19T09:30:00Z" }
  ],
  "nextAction": null
}`,
    errorResponses: `401 Unauthorized  — Invalid token
404 Not Found     — Referral ID does not exist or belongs to a different partner
410 Gone          — Referral expired (> 90 days, not accepted)`,
  },
  {
    id: 'open-banking-consent',
    name: 'Request Open Banking Consent',
    method: 'POST',
    path: '/api/v1/open-banking/consent-requests',
    description: 'Initiate an Open Banking consent request for a verified customer.',
    purpose: 'Generates a Barclays-hosted consent URL that the customer visits to grant access to their account data (balances, transactions) for affordability assessments.',
    domain: 'Banking / Open Banking',
    requestSchema: `{
  "profileId": "string",
  "permissions": ["ReadAccountsBasic", "ReadBalances", "ReadTransactionsCredits", "ReadTransactionsDebits"],
  "expirationDateTime": "string (ISO 8601, max 90 days)",
  "redirectUri": "string (registered callback URL)"
}`,
    sampleRequest: `POST /api/v1/open-banking/consent-requests
Authorization: Bearer <partner_token>
Content-Type: application/json

{
  "profileId": "prof_8f3a21bc",
  "permissions": ["ReadAccountsBasic", "ReadBalances", "ReadTransactionsCredits"],
  "expirationDateTime": "2026-09-18T00:00:00Z",
  "redirectUri": "https://propcomply.ai/callbacks/barclays"
}`,
    sampleResponse: `HTTP 201 Created
{
  "consentId": "con_a1b2c3d4",
  "status": "AwaitingAuthorisation",
  "consentUrl": "https://auth.barclays.co.uk/openbanking/authorize?consent_id=con_a1b2c3d4",
  "expiresAt": "2026-09-18T00:00:00Z",
  "createdAt": "2026-06-18T10:00:00Z"
}`,
    errorResponses: `400 Bad Request   — Invalid permissions array or expired redirectUri
401 Unauthorized  — Invalid token
403 Forbidden     — profileId not linked to an active Barclays referral
422 Unprocessable — expirationDateTime must be ≤ 90 days from now`,
  },
  {
    id: 'affordability-check',
    name: 'Run Affordability Assessment',
    method: 'POST',
    path: '/api/v1/affordability/assessments',
    description: 'Request a rental affordability assessment using Open Banking data.',
    purpose: 'Barclays analyses the customer\'s income and spending patterns from Open Banking and returns an affordability verdict for rental applications.',
    domain: 'Banking / Affordability',
    requestSchema: `{
  "profileId": "string",
  "consentId": "string (from POST /open-banking/consent-requests)",
  "monthlyRent": "number (GBP)",
  "assessmentType": "rental | mortgage",
  "includeBreakdown": "boolean (default false)"
}`,
    sampleRequest: `POST /api/v1/affordability/assessments
Authorization: Bearer <partner_token>
Content-Type: application/json

{
  "profileId": "prof_8f3a21bc",
  "consentId": "con_a1b2c3d4",
  "monthlyRent": 1800,
  "assessmentType": "rental",
  "includeBreakdown": true
}`,
    sampleResponse: `HTTP 200 OK
{
  "assessmentId": "afs_55d7e9f2",
  "verdict": "affordable",
  "affordabilityRatio": 0.28,
  "averageMonthlyIncome": 6430,
  "averageMonthlyExpenditure": 3850,
  "recommendedMaxRent": 1930,
  "breakdown": {
    "housing": 0, "transport": 420, "utilities": 210,
    "groceries": 380, "subscriptions": 95, "other": 2745
  },
  "generatedAt": "2026-06-18T10:15:00Z"
}`,
    errorResponses: `400 Bad Request   — monthlyRent ≤ 0 or assessmentType invalid
401 Unauthorized  — Token invalid
403 Forbidden     — consentId not linked to this profileId
409 Conflict      — An active assessment already exists for this consentId
503 Unavailable   — Open Banking data not yet available (retry after 60s)`,
  },
  {
    id: 'webhook-register',
    name: 'Register Webhook',
    method: 'POST',
    path: '/api/v1/webhooks',
    description: 'Register a callback URL to receive real-time event notifications.',
    purpose: 'Eliminates the need to poll referral status. Barclays will POST events to your registered URL when a referral or consent status changes.',
    domain: 'Banking / Webhooks',
    requestSchema: `{
  "url": "string (HTTPS only)",
  "events": ["referral.status_changed", "consent.authorised", "consent.revoked", "assessment.completed"],
  "secret": "string (used for HMAC-SHA256 signature verification)"
}`,
    sampleRequest: `POST /api/v1/webhooks
Authorization: Bearer <partner_token>
Content-Type: application/json

{
  "url": "https://propcomply.ai/webhooks/barclays",
  "events": ["referral.status_changed", "assessment.completed"],
  "secret": "wh_secret_abc123xyz"
}`,
    sampleResponse: `HTTP 201 Created
{
  "webhookId": "wh_f8e3c1a0",
  "url": "https://propcomply.ai/webhooks/barclays",
  "events": ["referral.status_changed", "assessment.completed"],
  "status": "active",
  "createdAt": "2026-06-18T10:30:00Z"
}

// Webhook payload (delivered to your URL):
{
  "event": "referral.status_changed",
  "referralId": "ref_7a9c4d21",
  "previousStatus": "under_review",
  "newStatus": "accepted",
  "timestamp": "2026-06-19T16:22:00Z"
}`,
    errorResponses: `400 Bad Request   — URL is not HTTPS or events array is empty
401 Unauthorized  — Invalid token
409 Conflict      — A webhook for this URL already exists
422 Unprocessable — Unsupported event type in events array`,
  },
];

const METHOD_COLORS: Record<string, { color: string; bg: string }> = {
  GET:    { color: '#0891b2', bg: '#ecfeff' },
  POST:   { color: '#059669', bg: '#ecfdf5' },
  PATCH:  { color: '#d97706', bg: '#fffbeb' },
  DELETE: { color: '#dc2626', bg: '#fef2f2' },
};

function ApiEndpointCard({ api }: { api: ApiEndpointDef }) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'schema' | 'request' | 'response' | 'errors'>('schema');
  const mc = METHOD_COLORS[api.method] ?? METHOD_COLORS.GET;

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      {/* Header row */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
      >
        <Badge
          className="text-[11px] font-bold mt-0.5 shrink-0 font-mono"
          style={{ color: mc.color, backgroundColor: mc.bg, borderColor: 'transparent' }}
        >
          {api.method}
        </Badge>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{api.name}</span>
            <Badge variant="outline" className="text-[10px]">{api.domain}</Badge>
          </div>
          <code className="text-xs text-muted-foreground font-mono mt-0.5 block">{api.path}</code>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{api.description}</p>
        </div>
        {open
          ? <ChevronDown className="size-4 text-muted-foreground shrink-0 mt-0.5" />
          : <ChevronRight className="size-4 text-muted-foreground shrink-0 mt-0.5" />
        }
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t bg-slate-50/40 px-4 pb-4 pt-3 space-y-3">
          <p className="text-sm text-slate-700 leading-relaxed">{api.purpose}</p>

          {/* Sub-tab strip */}
          <div className="flex gap-1 bg-white border rounded-lg p-1 w-fit text-xs">
            {(['schema', 'request', 'response', 'errors'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`px-3 py-1 rounded font-medium capitalize transition-colors ${
                  activeTab === t ? 'bg-teal-600 text-white' : 'text-muted-foreground hover:text-slate-700'
                }`}
              >
                {t === 'schema' ? 'Request Schema' : t === 'request' ? 'Sample Request' : t === 'response' ? 'Sample Response' : 'Error Codes'}
              </button>
            ))}
          </div>

          <pre className="text-xs font-mono bg-[#0F172A] text-[#a8d9a7] rounded-lg p-4 overflow-x-auto leading-relaxed">
            {activeTab === 'schema' && api.requestSchema}
            {activeTab === 'request' && api.sampleRequest}
            {activeTab === 'response' && api.sampleResponse}
            {activeTab === 'errors' && api.errorResponses}
          </pre>
        </div>
      )}
    </div>
  );
}

function BarclaysApiCatalog() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4 p-5 rounded-xl bg-gradient-to-br from-teal-50 via-white to-cyan-50 border border-teal-100">
        <div className="size-12 rounded-xl bg-teal-600 flex items-center justify-center shrink-0">
          <Landmark className="size-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-lg text-[#0F172A]">Barclays Bank PLC</h3>
            <Badge className="text-[10px]" style={{ color: '#059669', backgroundColor: '#ecfdf5', borderColor: 'transparent' }}>Active Partner</Badge>
            <Badge variant="outline" className="text-[10px]">Open Banking v3</Badge>
            <Badge variant="outline" className="text-[10px]">OAuth 2.0 · mTLS</Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            Your institution-scoped API catalog. These endpoints are exclusively assigned to the Barclays integration.
            All calls require a valid bearer token issued by PropComply at partner authentication.
          </p>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1"><Globe className="size-3" /> Base URL: <code className="font-mono text-teal-700">https://api.propcomply.ai/partners/barclays</code></span>
            <span className="flex items-center gap-1"><Lock className="size-3" /> All endpoints require HTTPS + Bearer token</span>
          </div>
        </div>
      </div>

      {/* Endpoint list */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-teal-600" />
          <h4 className="font-semibold text-sm">{BARCLAYS_API_CATALOG.length} Available Endpoints</h4>
          <Badge variant="outline" className="text-[10px]">Banking Domain</Badge>
        </div>
        {BARCLAYS_API_CATALOG.map((api) => (
          <ApiEndpointCard key={api.id} api={api} />
        ))}
      </div>

      {/* Auth info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Lock className="size-4 text-teal-600" />
            Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-muted-foreground leading-relaxed">
            All Barclays Partner API calls must include a signed Bearer token. Tokens are issued via the PropComply Partner Auth service using OAuth 2.0 Client Credentials flow (scoped to your <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">partnerId</code>).
          </p>
          <pre className="text-xs font-mono bg-[#0F172A] text-[#a8d9a7] rounded-lg p-4 overflow-x-auto">
{`POST https://auth.propcomply.ai/oauth/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id=<your_client_id>
&client_secret=<your_client_secret>
&scope=partners:barclays

// Response
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}`}
          </pre>
          <div className="flex flex-wrap gap-2">
            {['Rate limit: 100 req/min', 'Idempotency-Key header supported', 'TLS 1.2+ required', 'mTLS available on request'].map((t) => (
              <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PartnerEcosystem() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isPartnerUser = userRole === 'partner_user';

  // Hooks must run unconditionally (rules-of-hooks). The partner_user branch
  // doesn't need the ecosystem data, so we simply disable the fetch for them.
  const { data, isLoading, error } = useApi<PartnersResponse>(
    'partners',
    '/api/partners',
    !isPartnerUser,
    {
      userId: session?.user?.id || '',
      role: session?.user?.role || '',
    }
  );

  // partner_user sees their institution-scoped API catalog, not the full ecosystem
  if (isPartnerUser) {
    return (
      <motion.div
        className="space-y-0"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <BarclaysApiCatalog />
      </motion.div>
    );
  }

  const partners = data?.partners ?? [];
  const summary = data?.summary;

  // Compute metrics
  const totalPartners = data?.total ?? 0;
  const activeIntegrations = partners.filter(
    (p) => p.status === 'active' && p.integrationType
  ).length;
  const totalReferrals = partners.reduce((acc, p) => acc + p._count.referrals, 0);
  const referralSuccessRate = (() => {
    const byStatus = summary?.referralsByStatus ?? {};
    const completed = (byStatus.completed ?? 0) + (byStatus.accepted ?? 0);
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  })();

  // Referral pipeline stages
  const byStatus = summary?.referralsByStatus ?? {};
  const pipelineStages = [
    { label: 'Profile', count: totalReferrals, icon: <Users className="size-4" />, color: '#94a3b8' },
    { label: 'Compliance Clear', count: byStatus.accepted ?? 0, icon: <CheckCircle2 className="size-4" />, color: '#10b981' },
    { label: 'Risk Clear', count: byStatus.completed ?? 0, icon: <Shield className="size-4" />, color: '#06b6d4' },
    { label: 'Partner Match', count: totalPartners, icon: <Handshake className="size-4" />, color: '#8b5cf6' },
    { label: 'Referral Sent', count: byStatus.sent ?? 0, icon: <Send className="size-4" />, color: '#f59e0b' },
    { label: 'Accepted/Completed', count: (byStatus.accepted ?? 0) + (byStatus.completed ?? 0), icon: <CheckCircle2 className="size-4" />, color: '#10b981' },
  ];

  // Partner count by type
  const partnerCountByType: Record<string, number> = {};
  for (const pt of summary?.byPartnerType ?? []) {
    partnerCountByType[pt.type] = pt.count;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-2/3 mb-3" />
                <div className="h-8 bg-muted rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center text-red-600">
            <AlertTriangle className="size-8 mx-auto mb-2" />
            <p className="font-medium">Failed to load partner data</p>
            <p className="text-sm text-red-400 mt-1">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Partner Overview Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={fadeInUp}>
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Partners</p>
                  <p className="text-2xl font-bold mt-1">{totalPartners}</p>
                </div>
                <div className="size-10 rounded-lg bg-teal-50 flex items-center justify-center">
                  <Handshake className="size-5 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Integrations</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-600">{activeIntegrations}</p>
                </div>
                <div className="size-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <Link2 className="size-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Referrals Sent</p>
                  <p className="text-2xl font-bold mt-1 text-cyan-600">{totalReferrals}</p>
                </div>
                <div className="size-10 rounded-lg bg-cyan-50 flex items-center justify-center">
                  <Send className="size-5 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Referral Success Rate</p>
                  <p className="text-2xl font-bold mt-1 text-violet-600">{referralSuccessRate}%</p>
                </div>
                <div className="size-10 rounded-lg bg-violet-50 flex items-center justify-center">
                  <TrendingUp className="size-5 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Partner Type Cards */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-teal-600" />
              Partner Types
            </CardTitle>
            <CardDescription>
              Integration categories across the ecosystem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {PARTNER_TYPES.map((pt) => {
                const count = partnerCountByType[pt.type] ?? 0;
                const colors = partnerTypeColors[pt.type] ?? { color: '#94a3b8', bg: '#f1f5f9' };
                return (
                  <Card key={pt.type} className="border shadow-none">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="size-10 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: colors.bg, color: colors.color }}
                        >
                          {partnerTypeIcons[pt.type] ?? <Building2 className="size-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-sm">{pt.name}</p>
                            <Badge variant="outline" className="text-xs">
                              {count} partner{count !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{pt.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Partners List */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="size-5 text-teal-600" />
              Partners Directory
            </CardTitle>
            <CardDescription>
              All integrated partners with trust ratings and referral activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {partners.map((partner) => {
                const colors = partnerTypeColors[partner.partnerType] ?? {
                  color: '#94a3b8',
                  bg: '#f1f5f9',
                };
                return (
                  <Card key={partner.id} className="border shadow-none">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className="size-8 rounded-lg flex items-center justify-center shrink-0"
                            style={{ backgroundColor: colors.bg, color: colors.color }}
                          >
                            {partnerTypeIcons[partner.partnerType] ?? (
                              <Building2 className="size-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{partner.name}</p>
                          </div>
                        </div>
                        <StatusBadge status={partner.status} />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <PartnerTypeBadge type={partner.partnerType} />
                        {partner.integrationType && (
                          <Badge variant="outline" className="text-xs capitalize">
                            {partner.integrationType}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Trust Rating</span>
                          <span className="font-medium">{partner.trustRating.toFixed(1)}/100</span>
                        </div>
                        <Progress value={partner.trustRating} className="h-2" />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Send className="size-3" />
                          {partner._count.referrals} referral{partner._count.referrals !== 1 ? 's' : ''}
                        </span>
                        <span>Added {formatDate(partner.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Referral Pipeline */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5 text-teal-600" />
              Referral Pipeline
            </CardTitle>
            <CardDescription>
              End-to-end referral flow from profile verification to partner acceptance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2 md:gap-0 md:justify-between">
              {pipelineStages.map((stage, idx) => (
                <div key={stage.label} className="flex items-center gap-2">
                  <div className="flex flex-col items-center text-center min-w-[80px] md:min-w-[100px]">
                    <div
                      className="size-10 rounded-full flex items-center justify-center mb-2"
                      style={{
                        backgroundColor: `${stage.color}20`,
                        color: stage.color,
                      }}
                    >
                      {stage.icon}
                    </div>
                    <p className="text-xs font-medium leading-tight">{stage.label}</p>
                    <p className="text-lg font-bold mt-0.5" style={{ color: stage.color }}>
                      {stage.count}
                    </p>
                  </div>
                  {idx < pipelineStages.length - 1 && (
                    <ArrowRight className="size-4 text-muted-foreground hidden md:block shrink-0 mx-1" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Integration Architecture & Banking Referrals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Integration Architecture */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="size-5 text-teal-600" />
                Integration Architecture
              </CardTitle>
              <CardDescription>
                API-first ecosystem connectivity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-teal-50 border border-teal-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="size-4 text-teal-600" />
                    <p className="text-sm font-semibold text-teal-800">Internal APIs</p>
                  </div>
                  <p className="text-xs text-teal-600 leading-relaxed">
                    Identity, Compliance, Risk, Property, and Partner domain microservices
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-violet-50 border border-violet-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Link2 className="size-4 text-violet-600" />
                    <p className="text-sm font-semibold text-violet-800">Partner APIs</p>
                  </div>
                  <p className="text-xs text-violet-600 leading-relaxed">
                    Secure API endpoints for partner integration and data exchange
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Webhook className="size-4 text-amber-600" />
                    <p className="text-sm font-semibold text-amber-800">Webhooks</p>
                  </div>
                  <p className="text-xs text-amber-600 leading-relaxed">
                    Real-time event notifications for status changes and compliance alerts
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="size-4 text-cyan-600" />
                    <p className="text-sm font-semibold text-cyan-800">Event Streams</p>
                  </div>
                  <p className="text-xs text-cyan-600 leading-relaxed">
                    Event-driven architecture with async processing and audit trails
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex flex-wrap gap-2">
                {['REST API', 'GraphQL', 'OAuth 2.0', 'mTLS', 'Rate Limiting', 'Idempotency'].map(
                  (tech) => (
                    <Badge key={tech} variant="outline" className="text-xs">
                      {tech}
                    </Badge>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Banking Referrals Feature */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="size-5 text-teal-600" />
                Banking Referrals
              </CardTitle>
              <CardDescription>
                Verified profile referrals to banking partners
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100">
                <p className="text-sm font-semibold text-teal-800 mb-2">
                  How Banking Referrals Work
                </p>
                <p className="text-xs text-teal-700 leading-relaxed mb-3">
                  When a profile achieves Trust Level 3+ with clear compliance and risk assessments,
                  PropComply can automatically generate a referral package to banking partners. This
                  includes verified identity data, compliance clearance, and risk assessment summary —
                  enabling faster account opening and credit decisions.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs border-teal-200 text-teal-700">
                    Auto-Referral
                  </Badge>
                  <Badge variant="outline" className="text-xs border-teal-200 text-teal-700">
                    KYC Package
                  </Badge>
                  <Badge variant="outline" className="text-xs border-teal-200 text-teal-700">
                    Risk Summary
                  </Badge>
                </div>
              </div>

              {/* Banking referral flow */}
              <div className="flex flex-col gap-2">
                {[
                  {
                    step: 1,
                    label: 'Profile Verified (Level 3+)',
                    icon: <CheckCircle2 className="size-4 text-emerald-500" />,
                    active: true,
                  },
                  {
                    step: 2,
                    label: 'Compliance & Risk Clear',
                    icon: <Shield className="size-4 text-cyan-500" />,
                    active: true,
                  },
                  {
                    step: 3,
                    label: 'Referral Package Generated',
                    icon: <Zap className="size-4 text-amber-500" />,
                    active: true,
                  },
                  {
                    step: 4,
                    label: 'Sent to Banking Partner',
                    icon: <Send className="size-4 text-violet-500" />,
                    active: true,
                  },
                  {
                    step: 5,
                    label: 'Partner Review & Acceptance',
                    icon: <Landmark className="size-4 text-teal-600" />,
                    active: false,
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    <div className="size-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {item.step}
                    </div>
                    {item.icon}
                    <span className="text-sm flex-1">{item.label}</span>
                    {item.active && (
                      <Badge
                        className="text-xs"
                        style={{
                          backgroundColor: '#ecfdf5',
                          color: '#10b981',
                          borderColor: 'transparent',
                        }}
                      >
                        Active
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
