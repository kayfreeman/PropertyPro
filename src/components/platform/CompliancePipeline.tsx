'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ShieldCheck,
  Search,
  Filter,
  UserCheck,
  Eye,
  Landmark,
  Newspaper,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  PauseCircle,
  Archive,
  HelpCircle,
  ArrowUpCircle,
  Play,
  Loader2,
  FileSearch,
  Gauge,
  ArrowRight,
  ClipboardCheck,
  Mail,
  Phone,
  Calendar,
  Flag,
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
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useApi } from '@/hooks/use-api';
import { useSession } from 'next-auth/react';
import { hasPermission, type UserRole } from '@/lib/rbac';
import { getNationalityByCode } from '@/lib/countries';
import { maskEmail, maskPhone, maskDOB } from '@/lib/pii-mask';
import { formatDate } from '@/lib/platform-data';
import StatusIndicator from '@/components/platform/StatusIndicator';

// ── Types ──────────────────────────────────────────────────
interface ScreeningCheck {
  type: string;
  status: string;
  riskRating: string | null;
  provider: string | null;
  results: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  checkId: string | null;
}

interface PipelineItem {
  applicationId: string;
  applicationType: string;
  status: string;
  rightToRent: string;
  complianceClear: boolean;
  riskClear: boolean;
  monthlyAmount: number | null;
  depositAmount: number | null;
  submittedAt: string;
  decidedAt: string | null;
  property: { id: string; address: string; city: string; postcode: string; propertyType: string; complianceStatus: string } | null;
  profile: {
    id: string; firstName: string; lastName: string; email: string; phone: string | null;
    nationality: string | null; dateOfBirth: string | null; trustLevel: number; trustScore: number; status: string;
  };
  screening: ScreeningCheck[];
  screeningSummary: { total: number; completed: number; flagged: number; notRun: number };
  risk: { overallScore: number; riskCategory: string; fraudProbability: number } | null;
}

interface PipelineResponse {
  pipeline: PipelineItem[];
  total: number;
  summary: { byStatus: Record<string, number>; byRisk: Record<string, number>; screeningGaps: number };
}

// The six compliance decision outcomes (Scenarios 1–5).
type Decision = 'approve' | 'reject' | 'request_info' | 'escalate' | 'snooze' | 'archive';

// ── Screening type metadata ────────────────────────────────
const SCREENING_META: Record<string, { label: string; short: string; icon: React.ReactNode; color: string }> = {
  aml: { label: 'AML Screening', short: 'AML', icon: <ShieldCheck className="size-4" />, color: '#10b981' },
  kyc: { label: 'KYC Verification', short: 'KYC', icon: <UserCheck className="size-4" />, color: '#3b82f6' },
  cdd: { label: 'Customer Due Diligence', short: 'CDD', icon: <Search className="size-4" />, color: '#06b6d4' },
  edd: { label: 'Enhanced Due Diligence', short: 'EDD', icon: <Eye className="size-4" />, color: '#8b5cf6' },
  sanctions: { label: 'Sanctions Screening', short: 'Sanctions', icon: <AlertTriangle className="size-4" />, color: '#ef4444' },
  pep: { label: 'PEP Screening', short: 'PEP', icon: <Landmark className="size-4" />, color: '#f59e0b' },
  adverse_media: { label: 'Adverse Media', short: 'Adverse Media', icon: <Newspaper className="size-4" />, color: '#ec4899' },
};

const RISK_TONE: Record<string, { color: string; bg: string }> = {
  low: { color: '#059669', bg: '#ecfdf5' },
  medium: { color: '#d97706', bg: '#fffbeb' },
  high: { color: '#dc2626', bg: '#fef2f2' },
  critical: { color: '#b91c1c', bg: '#fef2f2' },
  unknown: { color: '#64748b', bg: '#f1f5f9' },
};

function screeningStatusPill(status: string) {
  switch (status) {
    case 'passed': case 'completed': return { label: 'Passed', color: '#059669', bg: '#ecfdf5', icon: <CheckCircle2 className="size-3" /> };
    case 'failed': return { label: 'Failed', color: '#dc2626', bg: '#fef2f2', icon: <XCircle className="size-3" /> };
    case 'escalated': return { label: 'Escalated', color: '#b91c1c', bg: '#fef2f2', icon: <Flag className="size-3" /> };
    case 'under_review': return { label: 'Review', color: '#d97706', bg: '#fffbeb', icon: <Eye className="size-3" /> };
    case 'in_progress': case 'pending': return { label: 'In Progress', color: '#2563eb', bg: '#eff6ff', icon: <Loader2 className="size-3" /> };
    default: return { label: 'Not Run', color: '#64748b', bg: '#f1f5f9', icon: <Clock className="size-3" /> };
  }
}

const STATUS_FILTERS = ['all', 'submitted', 'in_review', 'additional_info_required', 'on_hold', 'approved', 'rejected', 'archived'];

export default function CompliancePipeline() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const role = (session?.user?.role ?? 'tenant') as UserRole;
  const canDecide = hasPermission(role, 'compliance:review');
  const canRunChecks = hasPermission(role, 'compliance:manage');

  const { data, isLoading } = useApi<PipelineResponse>(
    'compliance-pipeline',
    '/api/compliance/pipeline',
    true,
    { role: session?.user?.role || '' }
  );

  const pipeline = useMemo(() => data?.pipeline ?? [], [data]);
  const summary = data?.summary;

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runningCheck, setRunningCheck] = useState<string | null>(null);
  const [deciding, setDeciding] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const filtered = useMemo(() => {
    return pipeline.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (typeFilter !== 'all' && p.applicationType !== typeFilter) return false;
      if (riskFilter !== 'all' && (p.risk?.riskCategory ?? 'unknown') !== riskFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${p.profile.firstName} ${p.profile.lastName} ${p.profile.email} ${p.property?.address ?? ''} ${p.property?.city ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [pipeline, search, statusFilter, typeFilter, riskFilter]);

  const selected = useMemo(() => pipeline.find((p) => p.applicationId === selectedId) ?? null, [pipeline, selectedId]);

  const appTypes = useMemo(() => ['all', ...Array.from(new Set(pipeline.map((p) => p.applicationType)))], [pipeline]);

  // Pipeline metrics
  const underReview = (summary?.byStatus?.submitted ?? 0) + (summary?.byStatus?.in_review ?? 0);
  const onHold = summary?.byStatus?.on_hold ?? 0;
  const approved = summary?.byStatus?.approved ?? 0;
  const rejected = summary?.byStatus?.rejected ?? 0;

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['compliance-pipeline'] }),
      queryClient.invalidateQueries({ queryKey: ['compliance'] }),
      queryClient.invalidateQueries({ queryKey: ['properties'] }),
    ]);
  }

  async function runCheck(profileId: string, checkType: string) {
    setRunningCheck(checkType);
    try {
      const res = await fetch('/api/compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, checkType, execute: true }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body?.error || `Could not run ${SCREENING_META[checkType]?.short ?? checkType}`);
        return;
      }
      const outcome = body?.complianceCheck?.status ?? 'completed';
      toast.success(`${SCREENING_META[checkType]?.label ?? checkType} executed`, { description: `Outcome: ${outcome.replace(/_/g, ' ')}` });
      await refresh();
    } catch {
      toast.error('Network error running screening check');
    } finally {
      setRunningCheck(null);
    }
  }

  async function runAllOutstanding(item: PipelineItem) {
    const outstanding = item.screening.filter((s) => s.status === 'not_run');
    if (outstanding.length === 0) { toast.info('All screening checks already run'); return; }
    setRunningCheck('__all__');
    try {
      for (const s of outstanding) {
        await fetch('/api/compliance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profileId: item.profile.id, checkType: s.type, execute: true }),
        });
      }
      toast.success(`Ran ${outstanding.length} outstanding screening check${outstanding.length !== 1 ? 's' : ''}`);
      await refresh();
    } catch {
      toast.error('Network error running screening checks');
    } finally {
      setRunningCheck(null);
    }
  }

  async function decide(applicationId: string, decision: Decision) {
    setDeciding(decision);
    try {
      const res = await fetch('/api/compliance/pipeline', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, decision, note: note.trim() || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body?.error || 'Could not record decision');
        return;
      }
      // SAR-aware feedback on approval (Scenarios 2 & 3)
      if (decision === 'approve' && body?.sar?.required) {
        toast.warning('Approved — SAR Required', {
          description: `Suspicious activity identified. SAR ${body.sar.ref ?? ''} generated and forwarded to the MLRO for review. Application remains under investigation.`,
        });
      } else if (decision === 'approve') {
        toast.success('Application approved', { description: 'All checks passed — SAR not required. Application cleared.' });
      } else {
        const labels: Record<Decision, string> = {
          approve: 'approved', reject: 'rejected', request_info: 'marked Pending Information',
          escalate: 'escalated for review', snooze: 'placed on hold', archive: 'archived',
        };
        toast.success(`Application ${labels[decision]}`);
      }
      setNote('');
      setSelectedId(null);
      await refresh();
    } catch {
      toast.error('Network error recording decision');
    } finally {
      setDeciding(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Pipeline summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Under Review', value: underReview, icon: <FileSearch className="size-5 text-blue-600" />, bg: 'bg-blue-50' },
          { label: 'On Hold', value: onHold, icon: <PauseCircle className="size-5 text-amber-600" />, bg: 'bg-amber-50' },
          { label: 'Approved', value: approved, icon: <CheckCircle2 className="size-5 text-emerald-600" />, bg: 'bg-emerald-50' },
          { label: 'Rejected', value: rejected, icon: <XCircle className="size-5 text-red-600" />, bg: 'bg-red-50' },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-2xl font-bold mt-0.5">{m.value}</p>
              </div>
              <div className={`size-10 rounded-lg ${m.bg} flex items-center justify-center`}>{m.icon}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Screening-gap banner */}
      {(summary?.screeningGaps ?? 0) > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="p-3 flex items-center gap-3">
            <AlertTriangle className="size-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">{summary?.screeningGaps}</span> screening checks across the queue have not yet been run.
              Select an applicant to initiate AML, KYC, CDD, EDD, Sanctions, PEP and Adverse Media screening.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Queue */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardCheck className="size-5 text-teal-600" />
                Compliance Queue
              </CardTitle>
              <CardDescription>All applicants under compliance review — select one to screen and decide.</CardDescription>
            </div>
          </div>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 pt-2">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input placeholder="Search applicant or property..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 w-[140px] text-sm"><Filter className="size-3.5 mr-1" /><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((s) => <SelectItem key={s} value={s} className="capitalize">{s === 'all' ? 'All statuses' : s.replace(/_/g, ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9 w-[130px] text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {appTypes.map((t) => <SelectItem key={t} value={t} className="capitalize">{t === 'all' ? 'All types' : t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="h-9 w-[120px] text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['all', 'low', 'medium', 'high', 'critical'].map((r) => <SelectItem key={r} value={r} className="capitalize">{r === 'all' ? 'All risk' : r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead className="hidden md:table-cell">Application</TableHead>
                  <TableHead>Screening</TableHead>
                  <TableHead className="hidden sm:table-cell">Risk</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>{Array.from({ length: 6 }).map((__, j) => <TableCell key={j}><div className="h-4 bg-muted rounded animate-pulse" /></TableCell>)}</TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-10">No applicants match the current filters.</TableCell></TableRow>
                ) : (
                  filtered.map((p) => {
                    const rt = RISK_TONE[p.risk?.riskCategory ?? 'unknown'] ?? RISK_TONE.unknown;
                    const pct = Math.round((p.screeningSummary.completed / p.screeningSummary.total) * 100);
                    return (
                      <TableRow key={p.applicationId} className="cursor-pointer hover:bg-muted/40" onClick={() => { setSelectedId(p.applicationId); setNote(''); }}>
                        <TableCell>
                          <p className="font-medium text-sm">{p.profile.firstName} {p.profile.lastName}</p>
                          <p className="text-[11px] text-muted-foreground">{p.profile.nationality ? getNationalityByCode(p.profile.nationality) : '—'} · Trust L{p.profile.trustLevel}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <p className="text-sm capitalize">{p.applicationType}</p>
                          <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">{p.property?.address ?? '—'}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <Progress value={pct} className="h-1.5 w-16" />
                            <span className="text-[11px] text-muted-foreground">{p.screeningSummary.completed}/{p.screeningSummary.total}</span>
                            {p.screeningSummary.flagged > 0 && (
                              <Badge className="text-[10px] gap-0.5 px-1" style={{ color: '#b91c1c', backgroundColor: '#fef2f2', borderColor: 'transparent' }}>
                                <Flag className="size-2.5" />{p.screeningSummary.flagged}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {p.risk ? (
                            <Badge className="text-[10px] capitalize" style={{ color: rt.color, backgroundColor: rt.bg, borderColor: 'transparent' }}>{p.risk.riskCategory}</Badge>
                          ) : <span className="text-[11px] text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell><StatusIndicator domain="application" status={p.status} /></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 gap-1 text-teal-700" onClick={(e) => { e.stopPropagation(); setSelectedId(p.applicationId); setNote(''); }}>
                            Review <ArrowRight className="size-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail + decisioning drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => { if (!o) setSelectedId(null); }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
          {selected && (
            <DecisionPanel
              item={selected}
              canDecide={canDecide}
              canRunChecks={canRunChecks}
              note={note}
              setNote={setNote}
              runningCheck={runningCheck}
              deciding={deciding}
              onRunCheck={(type) => runCheck(selected.profile.id, type)}
              onRunAll={() => runAllOutstanding(selected)}
              onDecide={(d) => decide(selected.applicationId, d)}
            />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ── Decision panel (drawer body) ───────────────────────────
function DecisionPanel({
  item, canDecide, canRunChecks, note, setNote, runningCheck, deciding, onRunCheck, onRunAll, onDecide,
}: {
  item: PipelineItem;
  canDecide: boolean;
  canRunChecks: boolean;
  note: string;
  setNote: (v: string) => void;
  runningCheck: string | null;
  deciding: string | null;
  onRunCheck: (type: string) => void;
  onRunAll: () => void;
  onDecide: (d: Decision) => void;
}) {
  const rt = RISK_TONE[item.risk?.riskCategory ?? 'unknown'] ?? RISK_TONE.unknown;
  const isDecided = ['approved', 'rejected', 'archived'].includes(item.status);
  const anyOutstanding = item.screening.some((s) => s.status === 'not_run');

  return (
    <div className="flex flex-col min-h-full">
      <SheetHeader className="p-5 pb-4 border-b">
        <SheetTitle className="flex items-center gap-2">
          <FileSearch className="size-5 text-teal-600" />
          {item.profile.firstName} {item.profile.lastName}
        </SheetTitle>
        <SheetDescription>
          Compliance review · {item.applicationType} application · submitted {formatDate(item.submittedAt)}
        </SheetDescription>
        <div className="flex items-center gap-2 pt-1">
          <StatusIndicator domain="application" status={item.status} />
          {item.risk && <Badge className="text-[10px] capitalize" style={{ color: rt.color, backgroundColor: rt.bg, borderColor: 'transparent' }}>{item.risk.riskCategory} risk</Badge>}
        </div>
      </SheetHeader>

      <div className="p-5 space-y-5 flex-1">
        {/* Applicant profile (masked PII) */}
        <section>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Applicant Profile</h4>
          <div className="rounded-lg border divide-y text-sm">
            <div className="flex items-center justify-between p-2.5"><span className="text-muted-foreground flex items-center gap-1.5"><Mail className="size-3.5" /> Email</span><span className="font-mono text-xs">{maskEmail(item.profile.email)}</span></div>
            <div className="flex items-center justify-between p-2.5"><span className="text-muted-foreground flex items-center gap-1.5"><Phone className="size-3.5" /> Phone</span><span className="font-mono text-xs">{maskPhone(item.profile.phone)}</span></div>
            <div className="flex items-center justify-between p-2.5"><span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="size-3.5" /> DOB</span><span className="font-mono text-xs">{maskDOB(item.profile.dateOfBirth)}</span></div>
            <div className="flex items-center justify-between p-2.5"><span className="text-muted-foreground flex items-center gap-1.5"><Flag className="size-3.5" /> Nationality</span><span className="text-xs">{item.profile.nationality ? getNationalityByCode(item.profile.nationality) : '—'}</span></div>
            <div className="flex items-center justify-between p-2.5"><span className="text-muted-foreground flex items-center gap-1.5"><Gauge className="size-3.5" /> Trust</span><span className="text-xs">Level {item.profile.trustLevel} · Score {item.profile.trustScore.toFixed(0)}</span></div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1.5">PII masked under UK GDPR data-minimisation — full data accessible via audited reveal only.</p>
        </section>

        {/* Risk posture */}
        {item.risk && (
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Risk Posture</h4>
            <div className="rounded-lg border p-3 flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold" style={{ color: rt.color }}>{item.risk.overallScore.toFixed(0)}</p>
                <p className="text-[10px] text-muted-foreground">Overall score</p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-xs space-y-0.5">
                <p>Category: <span className="font-medium capitalize" style={{ color: rt.color }}>{item.risk.riskCategory}</span></p>
                <p className="text-muted-foreground">Fraud probability: {(item.risk.fraudProbability * 100).toFixed(1)}%</p>
              </div>
            </div>
          </section>
        )}

        {/* Screening results */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Screening Results</h4>
            {canRunChecks && anyOutstanding && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" disabled={runningCheck !== null} onClick={onRunAll}>
                {runningCheck === '__all__' ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
                Run all outstanding
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {item.screening.map((s) => {
              const meta = SCREENING_META[s.type];
              const pill = screeningStatusPill(s.status);
              const notRun = s.status === 'not_run';
              return (
                <div key={s.type} className="rounded-lg border p-2.5 flex items-center gap-3">
                  <div className="size-8 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: (meta?.color ?? '#64748b') + '15', color: meta?.color ?? '#64748b' }}>
                    {meta?.icon ?? <ShieldCheck className="size-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight">{meta?.label ?? s.type}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {s.provider ?? 'No provider'}{s.reviewedAt ? ` · ${formatDate(s.reviewedAt)}` : ''}
                    </p>
                  </div>
                  <Badge className="text-[10px] gap-1 shrink-0" style={{ color: pill.color, backgroundColor: pill.bg, borderColor: 'transparent' }}>
                    {pill.icon}{pill.label}
                  </Badge>
                  {canRunChecks && (
                    <Button
                      size="sm"
                      variant={notRun ? 'default' : 'ghost'}
                      className={`h-7 text-xs gap-1 shrink-0 ${notRun ? 'bg-teal-600 hover:bg-teal-700 text-white' : ''}`}
                      disabled={runningCheck !== null}
                      onClick={() => onRunCheck(s.type)}
                    >
                      {runningCheck === s.type ? <Loader2 className="size-3 animate-spin" /> : <Play className="size-3" />}
                      {notRun ? 'Run' : 'Re-run'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Decision note */}
        {canDecide && (
          <section>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Decision Note <span className="font-normal normal-case">(optional, recorded in audit trail)</span></h4>
            <Textarea placeholder="Rationale for your decision…" value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="text-sm" />
          </section>
        )}
      </div>

      {/* Decision action bar */}
      {canDecide ? (
        <div className="sticky bottom-0 border-t bg-white p-4 space-y-2">
          {isDecided && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Clock className="size-3" /> Last decided {item.decidedAt ? formatDate(item.decidedAt) : '—'} — you can revise the decision below.
            </p>
          )}
          {/* Primary outcomes */}
          <div className="grid grid-cols-2 gap-2">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5" disabled={deciding !== null} onClick={() => onDecide('approve')}>
              {deciding === 'approve' ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Approve
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white gap-1.5" disabled={deciding !== null} onClick={() => onDecide('reject')}>
              {deciding === 'reject' ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />} Reject
            </Button>
          </div>
          {/* Secondary outcomes */}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-50 gap-1.5" disabled={deciding !== null} onClick={() => onDecide('request_info')}>
              {deciding === 'request_info' ? <Loader2 className="size-4 animate-spin" /> : <HelpCircle className="size-4" />} Request Info
            </Button>
            <Button variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50 gap-1.5" disabled={deciding !== null} onClick={() => onDecide('escalate')}>
              {deciding === 'escalate' ? <Loader2 className="size-4 animate-spin" /> : <ArrowUpCircle className="size-4" />} Escalate
            </Button>
            <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50 gap-1.5" disabled={deciding !== null} onClick={() => onDecide('snooze')}>
              {deciding === 'snooze' ? <Loader2 className="size-4 animate-spin" /> : <PauseCircle className="size-4" />} Snooze / Hold
            </Button>
            <Button variant="outline" className="border-slate-300 text-slate-600 hover:bg-slate-50 gap-1.5" disabled={deciding !== null} onClick={() => onDecide('archive')}>
              {deciding === 'archive' ? <Loader2 className="size-4 animate-spin" /> : <Archive className="size-4" />} Archive
            </Button>
          </div>
        </div>
      ) : (
        <div className="sticky bottom-0 border-t bg-white p-4">
          <p className="text-xs text-muted-foreground text-center">You have view-only access to this compliance review.</p>
        </div>
      )}
    </div>
  );
}
