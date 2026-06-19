'use client';

import { motion, type Variants } from 'framer-motion';
import {
  User,
  ShieldCheck,
  Building2,
  Landmark,
  Bell,
  ArrowRight,
  ClipboardCheck,
  FileSearch,
  PauseCircle,
  Flag,
  CheckCircle2,
  XCircle,
  Gauge,
  Handshake,
  Link2,
  FileBarChart,
  Send,
  Code,
  BookOpen,
  Activity,
  AlertTriangle,
  Search,
  type LucideIcon,
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
import { Progress } from '@/components/ui/progress';
import { useApi } from '@/hooks/use-api';
import { useSession } from 'next-auth/react';
import { type SectionId } from '@/lib/rbac';
import { TRUST_LEVELS } from '@/lib/platform-data';
import StatusIndicator from '@/components/platform/StatusIndicator';

const container: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

interface PersonaProps {
  onNavigate?: (section: SectionId) => void;
}

// ── Shared building blocks ─────────────────────────────────────────────────
function MetricCard({
  label, value, sub, icon: Icon, color = '#0d9488', bg = '#f0fdfa', loading,
}: {
  label: string; value: React.ReactNode; sub?: string; icon: LucideIcon; color?: string; bg?: string; loading?: boolean;
}) {
  return (
    <motion.div variants={item}>
      <Card>
        <CardContent className="p-4 flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1 truncate">{loading ? '—' : value}</p>
            {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className="size-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
            <Icon className="size-5" style={{ color }} />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function QuickActions({
  actions, onNavigate,
}: {
  actions: { label: string; icon: LucideIcon; color: string; section: SectionId }[];
  onNavigate?: (s: SectionId) => void;
}) {
  if (actions.length === 0) return null;
  return (
    <motion.div variants={item}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Actions</CardTitle>
          <CardDescription>Jump straight to your most common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {actions.map((a) => (
              <Button key={a.label} variant="outline" className="h-auto flex-col gap-2 py-4" onClick={() => onNavigate?.(a.section)}>
                <a.icon className={`size-5 ${a.color}`} />
                <span className="text-xs font-medium text-center">{a.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Welcome({ name, role, blurb }: { name?: string | null; role: string; blurb: string }) {
  return (
    <motion.div variants={item}>
      <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50">
        <CardContent className="p-4 md:p-5 flex items-center gap-4">
          <div className="size-11 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0">
            <Gauge className="size-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-teal-900">Welcome back{name ? `, ${name.split(' ')[0]}` : ''}</h3>
            <p className="text-sm text-teal-700">{blurb}</p>
          </div>
          <Badge className="ml-auto hidden sm:flex bg-white/70 text-teal-700 border-teal-200">{role}</Badge>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────
interface IdentityLite { id: string; firstName: string; lastName: string; status: string; trustLevel: number; trustScore: number; verifications: { status: string }[] }
interface AppLite { id: string; status: string; rightToRent: string; applicationType: string; property?: { address: string } | null }
interface PipelineSummary { byStatus: Record<string, number>; byRisk: Record<string, number>; screeningGaps: number }

// ════════════════════════════════════════════════════════════════════════════
// APPLICANT (tenant)
// ════════════════════════════════════════════════════════════════════════════
export function ApplicantDashboard({ onNavigate }: PersonaProps) {
  const { data: session } = useSession();
  const params = { userId: session?.user?.id || '', role: session?.user?.role || '' };

  const { data: identityData, isLoading: idLoading } = useApi<{ identities: IdentityLite[] }>('identities', '/api/identities', true, params);
  const { data: appData } = useApi<{ applications: AppLite[] }>('property-applications', '/api/property-applications', true, params);
  const { data: notifs } = useApi<{ unreadCount: number }>('notifications-unread', '/api/notifications', true, { unread: 'true' });

  const profile = identityData?.identities?.[0] ?? null;
  const apps = appData?.applications ?? [];
  const rtr = apps[0]?.rightToRent ?? 'not_started';
  const trust = profile ? (TRUST_LEVELS[profile.trustLevel] ?? TRUST_LEVELS[0]) : TRUST_LEVELS[0];

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6">
      <Welcome name={session?.user?.name} role="Applicant" blurb="Track your onboarding, verification and property applications." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Onboarding" loading={idLoading}
          value={<StatusIndicator domain="compliance" status={profile ? (['verified', 'certified'].includes(profile.status) ? 'clear' : profile.status) : 'pending'} />}
          icon={ShieldCheck} />
        <MetricCard label="Trust Score" loading={idLoading} value={profile ? `${profile.trustScore}/100` : '—'} sub={profile ? `L${profile.trustLevel} · ${trust.name}` : 'Not started'} icon={Gauge} color="#7c3aed" bg="#f5f3ff" />
        <MetricCard label="My Applications" value={apps.length} sub={apps.length ? `${apps.filter(a => a.status === 'approved').length} approved` : 'None yet'} icon={Building2} color="#2563eb" bg="#eff6ff" />
        <MetricCard label="Notifications" value={notifs?.unreadCount ?? 0} sub="unread" icon={Bell} color="#d97706" bg="#fffbeb" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile + onboarding */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><User className="size-4 text-teal-600" /> My Profile</CardTitle>
              <CardDescription>Your identity and verification snapshot</CardDescription>
            </CardHeader>
            <CardContent>
              {profile ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="size-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                      {profile.firstName[0]}{profile.lastName[0]}
                    </div>
                    <div>
                      <p className="font-semibold">{profile.firstName} {profile.lastName}</p>
                      <StatusIndicator domain="compliance" status={['verified', 'certified'].includes(profile.status) ? 'clear' : profile.status} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Trust progression</span>
                      <span className="font-medium">L{profile.trustLevel}/5</span>
                    </div>
                    <Progress value={profile.trustLevel * 20} className="h-2" />
                  </div>
                  <Button size="sm" className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => onNavigate?.('identity')}>
                    View My Profile <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <User className="size-10 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">You haven&apos;t started onboarding yet.</p>
                  <Button size="sm" className="mt-3 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => onNavigate?.('identity')}>
                    Start Onboarding <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Right to Rent */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Landmark className="size-4 text-teal-600" /> Right to Rent</CardTitle>
              <CardDescription>Immigration Act 2014</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatusIndicator domain="rtr" status={rtr} variant="detailed" showProgress />
              <Button size="sm" variant="outline" className="gap-1.5 w-full" onClick={() => onNavigate?.('property')}>
                <Building2 className="size-3.5" /> Find Properties
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* My applications list */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Building2 className="size-4 text-teal-600" /> My Applications</CardTitle>
            <CardDescription>Your property applications and their status</CardDescription>
          </CardHeader>
          <CardContent>
            {apps.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">No applications yet — verify your identity, then apply to a property.</div>
            ) : (
              <div className="space-y-2">
                {apps.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.property?.address ?? 'Property application'}</p>
                      <p className="text-[11px] text-muted-foreground capitalize">{a.applicationType}</p>
                    </div>
                    <StatusIndicator domain="application" status={a.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// RISK ANALYST
// ════════════════════════════════════════════════════════════════════════════
export function RiskAnalystDashboard({ onNavigate }: PersonaProps) {
  const { data: session } = useSession();
  const { data, isLoading } = useApi<{ pipeline: { applicationId: string; status: string; profile: { firstName: string; lastName: string }; screeningSummary: { flagged: number; notRun: number }; risk: { riskCategory: string } | null }[]; summary: PipelineSummary }>(
    'compliance-pipeline', '/api/compliance/pipeline', true, { role: session?.user?.role || '' }
  );
  const summary = data?.summary;
  const pipeline = data?.pipeline ?? [];
  const underReview = (summary?.byStatus?.submitted ?? 0) + (summary?.byStatus?.in_review ?? 0);
  const onHold = summary?.byStatus?.on_hold ?? 0;
  const highRisk = (summary?.byRisk?.high ?? 0) + (summary?.byRisk?.critical ?? 0);
  const pending = pipeline.filter((p) => ['submitted', 'in_review'].includes(p.status));

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6">
      <Welcome name={session?.user?.name} role="Risk Analyst" blurb="Your compliance queue, screening results and decisions awaiting action." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Under Review" loading={isLoading} value={underReview} icon={FileSearch} color="#2563eb" bg="#eff6ff" />
        <MetricCard label="On Hold" value={onHold} icon={PauseCircle} color="#d97706" bg="#fffbeb" />
        <MetricCard label="High / Critical Risk" value={highRisk} icon={AlertTriangle} color="#dc2626" bg="#fef2f2" />
        <MetricCard label="Screening Gaps" value={summary?.screeningGaps ?? 0} sub="checks not yet run" icon={Flag} color="#b91c1c" bg="#fef2f2" />
      </div>

      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><ClipboardCheck className="size-4 text-cyan-600" /> Pending Decisions</CardTitle>
                <CardDescription>Applicants awaiting your compliance decision</CardDescription>
              </div>
              <Button size="sm" className="gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => onNavigate?.('compliance')}>
                Open Pipeline <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">No applicants pending decision.</div>
            ) : (
              <div className="space-y-2">
                {pending.slice(0, 6).map((p) => (
                  <div key={p.applicationId} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium truncate">{p.profile.firstName} {p.profile.lastName}</span>
                      {p.screeningSummary.flagged > 0 && (
                        <Badge className="text-[10px] gap-0.5" style={{ color: '#b91c1c', backgroundColor: '#fef2f2', borderColor: 'transparent' }}><Flag className="size-2.5" />{p.screeningSummary.flagged}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {p.risk && <Badge variant="outline" className="text-[10px] capitalize">{p.risk.riskCategory}</Badge>}
                      <StatusIndicator domain="application" status={p.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <QuickActions
        onNavigate={onNavigate}
        actions={[
          { label: 'Compliance Pipeline', icon: ClipboardCheck, color: 'text-cyan-600', section: 'compliance' },
          { label: 'Risk Intelligence', icon: AlertTriangle, color: 'text-amber-600', section: 'risk' },
          { label: 'AML Workflow', icon: ShieldCheck, color: 'text-teal-600', section: 'aml' },
          { label: 'Reports', icon: FileBarChart, color: 'text-violet-600', section: 'reports' },
        ]}
      />
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VERIFICATION SPECIALIST (identity_verifier)
// ════════════════════════════════════════════════════════════════════════════
export function VerifierDashboard({ onNavigate }: PersonaProps) {
  const { data: session } = useSession();
  const { data, isLoading } = useApi<{ identities: IdentityLite[] }>('identities', '/api/identities', true, { userId: session?.user?.id || '', role: session?.user?.role || '' });
  const profiles = data?.identities ?? [];

  const pending = profiles.filter((p) => p.verifications.some((v) => ['pending', 'in_progress'].includes(v.status)));
  const verified = profiles.filter((p) => ['verified', 'certified'].includes(p.status));
  const exceptions = profiles.filter((p) => ['rejected', 'failed'].includes(p.status));
  const avgTrust = profiles.length ? (profiles.reduce((s, p) => s + p.trustLevel, 0) / profiles.length) : 0;

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6">
      <Welcome name={session?.user?.name} role="Verification Specialist" blurb="Identity verification tasks, approvals and exceptions awaiting review." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Pending Reviews" loading={isLoading} value={pending.length} sub="awaiting verification" icon={ClipboardCheck} color="#d97706" bg="#fffbeb" />
        <MetricCard label="Approved" value={verified.length} icon={CheckCircle2} color="#059669" bg="#ecfdf5" />
        <MetricCard label="Exceptions" value={exceptions.length} sub="rejected / failed" icon={XCircle} color="#dc2626" bg="#fef2f2" />
        <MetricCard label="Avg Trust Level" value={avgTrust.toFixed(1)} sub="across applicants" icon={Gauge} color="#7c3aed" bg="#f5f3ff" />
      </div>

      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><ScanFaceIcon /> Verification Tasks</CardTitle>
                <CardDescription>Applicants with outstanding verification checks</CardDescription>
              </div>
              <Button size="sm" className="gap-1.5 bg-cyan-600 hover:bg-cyan-700 text-white" onClick={() => onNavigate?.('identity')}>
                Go to Applicants <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">No verification tasks outstanding.</div>
            ) : (
              <div className="space-y-2">
                {pending.slice(0, 6).map((p) => {
                  const checks = p.verifications.filter((v) => ['pending', 'in_progress'].includes(v.status)).length;
                  return (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="size-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[11px] font-bold shrink-0">{p.firstName[0]}{p.lastName[0]}</div>
                        <span className="text-sm font-medium truncate">{p.firstName} {p.lastName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">L{p.trustLevel}</Badge>
                        <Badge className="text-[10px]" style={{ color: '#d97706', backgroundColor: '#fffbeb', borderColor: 'transparent' }}>{checks} check{checks !== 1 ? 's' : ''}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <QuickActions
        onNavigate={onNavigate}
        actions={[
          { label: 'Applicants', icon: User, color: 'text-emerald-600', section: 'identity' },
          { label: 'Compliance', icon: ClipboardCheck, color: 'text-cyan-600', section: 'compliance' },
          { label: 'AI Assistant', icon: Search, color: 'text-violet-600', section: 'ai-assistant' },
        ]}
      />
    </motion.div>
  );
}
function ScanFaceIcon() { return <Activity className="size-4 text-cyan-600" />; }

// ════════════════════════════════════════════════════════════════════════════
// PARTNER INTEGRATION MANAGER
// ════════════════════════════════════════════════════════════════════════════
export function PartnerManagerDashboard({ onNavigate }: PersonaProps) {
  const { data: session } = useSession();
  const params = { userId: session?.user?.id || '', role: session?.user?.role || '' };
  const { data: partnerData, isLoading } = useApi<{ partners: { id: string; name: string; status: string; integrationType: string | null; _count: { referrals: number } }[]; total: number }>('partners', '/api/partners', true, params);
  const { data: complianceData } = useApi<{ total: number; summary: { byStatus: Record<string, number> } }>('compliance', '/api/compliance', true, params);

  const partners = partnerData?.partners ?? [];
  const active = partners.filter((p) => p.status === 'active' && p.integrationType).length;
  const checks = complianceData?.total ?? 0;
  const passed = complianceData?.summary?.byStatus?.passed ?? 0;

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6">
      <Welcome name={session?.user?.name} role="Partner Integration Manager" blurb="Integration partners, compliance automation and reporting at a glance." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Integration Partners" loading={isLoading} value={partnerData?.total ?? 0} icon={Handshake} color="#0d9488" bg="#f0fdfa" />
        <MetricCard label="Active Integrations" value={active} icon={Link2} color="#059669" bg="#ecfdf5" />
        <MetricCard label="Compliance Checks" value={checks} sub={`${passed} passed`} icon={ClipboardCheck} color="#2563eb" bg="#eff6ff" />
        <MetricCard label="Reports" value="Ready" sub="export CSV / filter" icon={FileBarChart} color="#7c3aed" bg="#f5f3ff" />
      </div>

      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><Handshake className="size-4 text-teal-600" /> Integration Partners</CardTitle>
                <CardDescription>Partner directory and integration status</CardDescription>
              </div>
              <Button size="sm" className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => onNavigate?.('partners')}>
                Manage Partners <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {partners.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">No partners registered yet.</div>
            ) : (
              <div className="space-y-2">
                {partners.slice(0, 6).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Landmark className="size-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.integrationType && <Badge variant="outline" className="text-[10px] capitalize">{p.integrationType}</Badge>}
                      <Badge className="text-[10px] capitalize" style={p.status === 'active' ? { color: '#059669', backgroundColor: '#ecfdf5', borderColor: 'transparent' } : { color: '#64748b', backgroundColor: '#f1f5f9', borderColor: 'transparent' }}>{p.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <QuickActions
        onNavigate={onNavigate}
        actions={[
          { label: 'Partners', icon: Handshake, color: 'text-teal-600', section: 'partners' },
          { label: 'Compliance', icon: ClipboardCheck, color: 'text-cyan-600', section: 'compliance' },
          { label: 'Reports', icon: FileBarChart, color: 'text-violet-600', section: 'reports' },
        ]}
      />
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// EXTERNAL PARTNER (partner_user)
// ════════════════════════════════════════════════════════════════════════════
export function PartnerUserDashboard({ onNavigate }: PersonaProps) {
  const { data: session } = useSession();
  // The partner's institution-scoped API catalogue (Barclays banking domain).
  const assignedApis = [
    { name: 'Submit Identity Referral', method: 'POST' },
    { name: 'Get Referral Status', method: 'GET' },
    { name: 'Request Open Banking Consent', method: 'POST' },
    { name: 'Run Affordability Assessment', method: 'POST' },
    { name: 'Register Webhook', method: 'POST' },
  ];
  const methodColor: Record<string, { c: string; b: string }> = {
    GET: { c: '#0891b2', b: '#ecfeff' }, POST: { c: '#059669', b: '#ecfdf5' },
  };

  return (
    <motion.div variants={container} initial="hidden" animate="visible" className="space-y-6">
      <Welcome name={session?.user?.name} role="External Partner" blurb="Your assigned APIs, integration status and developer documentation." />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Assigned APIs" value={assignedApis.length} sub="banking domain" icon={Code} color="#0d9488" bg="#f0fdfa" />
        <MetricCard label="Integration Status" value="Active" sub="OAuth 2.0 · mTLS" icon={Link2} color="#059669" bg="#ecfdf5" />
        <MetricCard label="Rate Limit" value="100/min" sub="per token" icon={Activity} color="#2563eb" bg="#eff6ff" />
        <MetricCard label="Documentation" value="Live" sub="schemas & samples" icon={BookOpen} color="#7c3aed" bg="#f5f3ff" />
      </div>

      <motion.div variants={item}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2"><Code className="size-4 text-teal-600" /> Assigned APIs</CardTitle>
                <CardDescription>Barclays-scoped endpoints available to your integration</CardDescription>
              </div>
              <Button size="sm" className="gap-1.5 bg-teal-600 hover:bg-teal-700 text-white" onClick={() => onNavigate?.('partners')}>
                Open API Catalog <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assignedApis.map((a) => {
                const mc = methodColor[a.method] ?? methodColor.GET;
                return (
                  <div key={a.name} className="flex items-center gap-3 rounded-lg border p-3">
                    <Badge className="text-[10px] font-mono font-bold" style={{ color: mc.c, backgroundColor: mc.b, borderColor: 'transparent' }}>{a.method}</Badge>
                    <span className="text-sm font-medium">{a.name}</span>
                    <Badge variant="outline" className="ml-auto text-[10px] gap-1"><CheckCircle2 className="size-2.5 text-emerald-500" /> Available</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <QuickActions
        onNavigate={onNavigate}
        actions={[
          { label: 'API Catalog', icon: Code, color: 'text-teal-600', section: 'partners' },
          { label: 'Documentation', icon: BookOpen, color: 'text-violet-600', section: 'partners' },
          { label: 'AI Assistant', icon: Send, color: 'text-cyan-600', section: 'ai-assistant' },
        ]}
      />
    </motion.div>
  );
}
