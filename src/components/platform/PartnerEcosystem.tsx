'use client';

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

export default function PartnerEcosystem() {
  const { data, isLoading, error } = useApi<PartnersResponse>(
    'partners',
    '/api/partners'
  );

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
      <div className="space-y-6 p-6">
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
      className="space-y-6 p-4 md:p-6"
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
