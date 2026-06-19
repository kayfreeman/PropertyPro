'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  FileBarChart,
  Download,
  Filter,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Handshake,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  FileSpreadsheet,
  RefreshCw,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useApi } from '@/hooks/use-api';
import { useSession } from 'next-auth/react';
import { hasPermission, getRoleDefinition, type UserRole } from '@/lib/rbac';
import { downloadXls, openReportPreview, buildReportHtml } from '@/lib/report-export';

const PAGE_SIZE = 10;

// ── Types ────────────────────────────────────────────────────────────────────

type SortDir = 'asc' | 'desc' | null;
type SortKey = string;

type ReportTab = 'compliance' | 'partners' | 'referrals';

interface ComplianceCheck {
  id: string;
  checkType: string;
  status: string;
  result: string | null;
  riskScore: number | null;
  completedAt: string | null;
  createdAt: string;
  profile?: { firstName: string; lastName: string; email: string } | null;
}

interface PartnerReferral {
  id: string;
  referralType: string;
  status: string;
  createdAt: string;
  profile?: { firstName: string; lastName: string; email: string } | null;
}

interface Partner {
  id: string;
  name: string;
  partnerType: string;
  status: string;
  trustRating: number;
  createdAt: string;
  _count: { referrals: number };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusColor(status: string): { color: string; bg: string } {
  switch (status?.toLowerCase()) {
    case 'clear': case 'passed': case 'verified': case 'completed': case 'accepted': case 'active':
      return { color: '#059669', bg: '#ecfdf5' };
    case 'failed': case 'rejected': case 'declined':
      return { color: '#dc2626', bg: '#fef2f2' };
    case 'pending': case 'in_progress': case 'processing': case 'sent':
      return { color: '#d97706', bg: '#fffbeb' };
    case 'review': case 'under_review':
      return { color: '#0891b2', bg: '#ecfeff' };
    default:
      return { color: '#64748b', bg: '#f1f5f9' };
  }
}

function StatusPill({ status }: { status: string }) {
  const c = statusColor(status);
  return (
    <Badge
      className="text-[11px] font-medium capitalize"
      style={{ color: c.color, backgroundColor: c.bg, borderColor: 'transparent' }}
    >
      {status.replace(/_/g, ' ')}
    </Badge>
  );
}

// ── Sort control ─────────────────────────────────────────────────────────────

function SortIcon({ col, sortKey, sortDir }: { col: string; sortKey: SortKey; sortDir: SortDir }) {
  if (sortKey !== col) return <ChevronsUpDown className="size-3 text-muted-foreground/50 ml-1" />;
  return sortDir === 'asc'
    ? <ChevronUp className="size-3 text-teal-600 ml-1" />
    : <ChevronDown className="size-3 text-teal-600 ml-1" />;
}

function ThButton({
  col, label, sortKey, sortDir, onSort,
}: {
  col: string; label: string; sortKey: SortKey; sortDir: SortDir;
  onSort: (col: string) => void;
}) {
  return (
    <th
      className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide cursor-pointer select-none whitespace-nowrap"
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center">
        {label}
        <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
      </span>
    </th>
  );
}

// ── Export + pagination helpers ───────────────────────────────────────────────

function useReportMeta(): { role: string; user: { name?: string | null; email?: string | null } } {
  const { data: session } = useSession();
  return {
    role: getRoleDefinition((session?.user?.role ?? 'tenant') as UserRole).name,
    user: { name: session?.user?.name, email: session?.user?.email },
  };
}

// Build a printable PDF preview from a single tabular section.
function previewPdf(opts: {
  title: string; subtitle: string; role: string;
  user?: { name?: string | null; email?: string | null };
  headers: string[]; rows: (string | number)[][];
}) {
  openReportPreview(
    buildReportHtml({
      title: opts.title,
      subtitle: opts.subtitle,
      role: opts.role,
      user: opts.user,
      period: 'All records (role-scoped)',
      refId: `RPT-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      sections: [{ title: `${opts.title} (${opts.rows.length} rows)`, table: { headers: opts.headers, rows: opts.rows } }],
    })
  );
}

function ExportButtons({ disabled, onPdf, onXls }: { disabled?: boolean; onPdf: () => void; onXls: () => void }) {
  return (
    <div className="flex items-center gap-2 ml-auto">
      <Button variant="outline" size="sm" className="h-9" onClick={onPdf} disabled={disabled} title="Preview & Save as PDF">
        <FileText className="size-3.5 mr-1.5" />
        PDF
      </Button>
      <Button variant="outline" size="sm" className="h-9" onClick={onXls} disabled={disabled} title="Download as Excel (.xls)">
        <FileSpreadsheet className="size-3.5 mr-1.5" />
        XLS
      </Button>
    </div>
  );
}

function PaginationBar({ page, total, filteredFrom, onPage }: { page: number; total: number; filteredFrom?: number; onPage: (p: number) => void }) {
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 py-2 border-t bg-slate-50/50 text-xs text-muted-foreground">
      <span>
        {total ? `Showing ${from}–${to} of ${total}` : 'No results'}
        {typeof filteredFrom === 'number' && filteredFrom !== total ? ` (filtered from ${filteredFrom})` : ''}
      </span>
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" className="h-7 px-2" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft className="size-3.5" />
        </Button>
        <span className="px-1 font-medium text-foreground">Page {page} of {pageCount}</span>
        <Button variant="outline" size="sm" className="h-7 px-2" disabled={page >= pageCount} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ── Compliance Report Tab ────────────────────────────────────────────────────

function ComplianceReport({ canExport }: { canExport: boolean }) {
  const { data: session } = useSession();
  const { data, isLoading } = useApi<{ checks: ComplianceCheck[] }>(
    'compliance-checks-report',
    '/api/compliance',
    true,
    { role: session?.user?.role || '' }
  );

  const checks = data?.checks ?? [];

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const checkTypes = useMemo(() => ['all', ...Array.from(new Set(checks.map((c) => c.checkType)))], [checks]);
  const statuses = useMemo(() => ['all', ...Array.from(new Set(checks.map((c) => c.status)))], [checks]);

  const filtered = useMemo(() => {
    let rows = [...checks];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          r.checkType.toLowerCase().includes(q) ||
          r.status.toLowerCase().includes(q) ||
          `${r.profile?.firstName} ${r.profile?.lastName}`.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') rows = rows.filter((r) => r.status === statusFilter);
    if (typeFilter !== 'all') rows = rows.filter((r) => r.checkType === typeFilter);
    if (sortKey && sortDir) {
      rows.sort((a, b) => {
        const av = (a as unknown as Record<string, unknown>)[sortKey] ?? '';
        const bv = (b as unknown as Record<string, unknown>)[sortKey] ?? '';
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }, [checks, search, statusFilter, typeFilter, sortKey, sortDir]);

  const onSort = (col: string) => {
    if (sortKey === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));
      if (sortDir === null) setSortKey('');
    } else {
      setSortKey(col);
      setSortDir('asc');
    }
  };

  const [page, setPage] = useState(1);
  const reportMeta = useReportMeta();
  const filterKey = `${search}|${statusFilter}|${typeFilter}|${sortKey}|${sortDir}`;
  const [prevKey, setPrevKey] = useState(filterKey);
  if (filterKey !== prevKey) { setPrevKey(filterKey); setPage(1); }

  const EXPORT_HEADERS = ['Date', 'Type', 'Profile', 'Status', 'Result', 'Risk Score', 'Completed'];
  const exportRows: (string | number)[][] = filtered.map((r) => [
    fmt(r.createdAt), r.checkType, r.profile ? `${r.profile.firstName} ${r.profile.lastName}` : '—',
    r.status, r.result ?? '—', r.riskScore ?? '—', fmt(r.completedAt),
  ]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const fileBase = `compliance-report-${new Date().toISOString().slice(0, 10)}`;
  const handleXls = () => downloadXls(fileBase, EXPORT_HEADERS, exportRows, 'Compliance Checks');
  const handlePdf = () => previewPdf({ title: 'Compliance Checks Report', subtitle: 'Compliance verification checks', role: reportMeta.role, user: reportMeta.user, headers: EXPORT_HEADERS, rows: exportRows });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search checks..."
            className="pl-8 h-9 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 w-[150px] text-sm">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            {checkTypes.map((t) => (
              <SelectItem key={t} value={t} className="capitalize">
                {t === 'all' ? 'All types' : t.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[140px] text-sm">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s === 'all' ? 'All statuses' : s.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canExport && <ExportButtons disabled={!filtered.length} onPdf={handlePdf} onXls={handleXls} />}
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <ThButton col="createdAt" label="Date" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <ThButton col="checkType" label="Check Type" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Profile</th>
              <ThButton col="status" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <ThButton col="riskScore" label="Risk Score" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <ThButton col="completedAt" label="Completed" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-3 py-3">
                      <div className="h-4 bg-muted rounded animate-pulse w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No checks match the current filters.
                </td>
              </tr>
            ) : (
              paged.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{fmt(row.createdAt)}</td>
                  <td className="px-3 py-3 font-medium capitalize">{row.checkType.replace(/_/g, ' ')}</td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {row.profile ? `${row.profile.firstName} ${row.profile.lastName}` : '—'}
                  </td>
                  <td className="px-3 py-3"><StatusPill status={row.status} /></td>
                  <td className="px-3 py-3 text-center">
                    {row.riskScore !== null ? (
                      <span
                        className="text-xs font-semibold px-1.5 py-0.5 rounded"
                        style={
                          row.riskScore >= 75
                            ? { color: '#dc2626', backgroundColor: '#fef2f2' }
                            : row.riskScore >= 40
                            ? { color: '#d97706', backgroundColor: '#fffbeb' }
                            : { color: '#059669', backgroundColor: '#ecfdf5' }
                        }
                      >
                        {row.riskScore}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{fmt(row.completedAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <PaginationBar page={safePage} total={filtered.length} filteredFrom={checks.length} onPage={setPage} />
      </div>
    </div>
  );
}

// ── Partners Report Tab ───────────────────────────────────────────────────────

function PartnersReport({ canExport }: { canExport: boolean }) {
  const { data: session } = useSession();
  const { data, isLoading } = useApi<{ partners: Partner[] }>(
    'partners-report',
    '/api/partners',
    true,
    { role: session?.user?.role || '' }
  );

  const partners = data?.partners ?? [];

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const types = useMemo(() => ['all', ...Array.from(new Set(partners.map((p) => p.partnerType)))], [partners]);
  const statuses = useMemo(() => ['all', ...Array.from(new Set(partners.map((p) => p.status)))], [partners]);

  const filtered = useMemo(() => {
    let rows = [...partners];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.partnerType.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') rows = rows.filter((r) => r.status === statusFilter);
    if (typeFilter !== 'all') rows = rows.filter((r) => r.partnerType === typeFilter);
    if (sortKey && sortDir) {
      rows.sort((a, b) => {
        const av = (a as unknown as Record<string, unknown>)[sortKey] ?? '';
        const bv = (b as unknown as Record<string, unknown>)[sortKey] ?? '';
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }, [partners, search, statusFilter, typeFilter, sortKey, sortDir]);

  const onSort = (col: string) => {
    if (sortKey === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));
      if (sortDir === null) setSortKey('');
    } else {
      setSortKey(col);
      setSortDir('asc');
    }
  };

  const [page, setPage] = useState(1);
  const reportMeta = useReportMeta();
  const filterKey = `${search}|${statusFilter}|${typeFilter}|${sortKey}|${sortDir}`;
  const [prevKey, setPrevKey] = useState(filterKey);
  if (filterKey !== prevKey) { setPrevKey(filterKey); setPage(1); }

  const EXPORT_HEADERS = ['Partner', 'Type', 'Status', 'Trust Rating', 'Referrals', 'Added Date'];
  const exportRows: (string | number)[][] = filtered.map((r) => [
    r.name, r.partnerType, r.status, r.trustRating, r._count.referrals, fmt(r.createdAt),
  ]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const fileBase = `partners-report-${new Date().toISOString().slice(0, 10)}`;
  const handleXls = () => downloadXls(fileBase, EXPORT_HEADERS, exportRows, 'Partners');
  const handlePdf = () => previewPdf({ title: 'Partners Report', subtitle: 'Integration partners directory', role: reportMeta.role, user: reportMeta.user, headers: EXPORT_HEADERS, rows: exportRows });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input placeholder="Search partners..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="h-9 w-[150px] text-sm"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            {types.map((t) => (
              <SelectItem key={t} value={t} className="capitalize">{t === 'all' ? 'All types' : t.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[140px] text-sm"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s === 'all' ? 'All statuses' : s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canExport && (
          <ExportButtons disabled={!filtered.length} onPdf={handlePdf} onXls={handleXls} />
        )}
      </div>

      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="w-full min-w-[580px] text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <ThButton col="name" label="Partner" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <ThButton col="partnerType" label="Type" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <ThButton col="status" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <ThButton col="trustRating" label="Trust Rating" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <ThButton col="_count.referrals" label="Referrals" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <ThButton col="createdAt" label="Added" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-3 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-muted-foreground">No partners match filters.</td>
              </tr>
            ) : (
              paged.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3 py-3 font-medium">{row.name}</td>
                  <td className="px-3 py-3 capitalize text-muted-foreground">{row.partnerType.replace(/_/g, ' ')}</td>
                  <td className="px-3 py-3"><StatusPill status={row.status} /></td>
                  <td className="px-3 py-3">
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                      style={row.trustRating >= 80 ? { color: '#059669', backgroundColor: '#ecfdf5' } : { color: '#d97706', backgroundColor: '#fffbeb' }}>
                      {row.trustRating.toFixed(0)}/100
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center text-muted-foreground">{row._count.referrals}</td>
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{fmt(row.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <PaginationBar page={safePage} total={filtered.length} filteredFrom={partners.length} onPage={setPage} />
      </div>
    </div>
  );
}

// ── Referrals Report Tab ──────────────────────────────────────────────────────

function ReferralsReport({ canExport }: { canExport: boolean }) {
  const { data: session } = useSession();
  const { data, isLoading } = useApi<{ partners: { name: string; referrals: PartnerReferral[] }[] }>(
    'referrals-report',
    '/api/partners',
    true,
    { role: session?.user?.role || '' }
  );

  const referrals = useMemo(() => {
    return (data?.partners ?? []).flatMap((p) =>
      (p.referrals ?? []).map((r) => ({ ...r, partnerName: p.name }))
    );
  }, [data]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const statuses = useMemo(() => ['all', ...Array.from(new Set(referrals.map((r) => r.status)))], [referrals]);

  const filtered = useMemo(() => {
    let rows = [...referrals];
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(
        (r) =>
          (r as unknown as { partnerName: string }).partnerName?.toLowerCase().includes(q) ||
          r.referralType.toLowerCase().includes(q) ||
          `${r.profile?.firstName} ${r.profile?.lastName}`.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') rows = rows.filter((r) => r.status === statusFilter);
    if (sortKey && sortDir) {
      rows.sort((a, b) => {
        const av = (a as Record<string, unknown>)[sortKey] ?? '';
        const bv = (b as Record<string, unknown>)[sortKey] ?? '';
        const cmp = String(av).localeCompare(String(bv));
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  }, [referrals, search, statusFilter, sortKey, sortDir]);

  const onSort = (col: string) => {
    if (sortKey === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));
    } else {
      setSortKey(col);
      setSortDir('asc');
    }
  };

  const [page, setPage] = useState(1);
  const reportMeta = useReportMeta();
  const filterKey = `${search}|${statusFilter}|${sortKey}|${sortDir}`;
  const [prevKey, setPrevKey] = useState(filterKey);
  if (filterKey !== prevKey) { setPrevKey(filterKey); setPage(1); }

  const EXPORT_HEADERS = ['Date', 'Partner', 'Type', 'Profile', 'Status'];
  const exportRows: (string | number)[][] = filtered.map((r) => [
    fmt(r.createdAt),
    (r as unknown as { partnerName: string }).partnerName ?? '—',
    r.referralType,
    r.profile ? `${r.profile.firstName} ${r.profile.lastName}` : '—',
    r.status,
  ]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const fileBase = `referrals-report-${new Date().toISOString().slice(0, 10)}`;
  const handleXls = () => downloadXls(fileBase, EXPORT_HEADERS, exportRows, 'Referrals');
  const handlePdf = () => previewPdf({ title: 'Referrals Report', subtitle: 'Partner referral activity', role: reportMeta.role, user: reportMeta.user, headers: EXPORT_HEADERS, rows: exportRows });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input placeholder="Search referrals..." className="pl-8 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-[140px] text-sm"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s === 'all' ? 'All statuses' : s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {canExport && <ExportButtons disabled={!filtered.length} onPdf={handlePdf} onXls={handleXls} />}
      </div>

      <div className="rounded-lg border bg-white overflow-x-auto">
        <table className="w-full min-w-[520px] text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <ThButton col="createdAt" label="Date" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Partner</th>
              <ThButton col="referralType" label="Type" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Profile</th>
              <ThButton col="status" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j} className="px-3 py-3"><div className="h-4 bg-muted rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-muted-foreground">No referrals match filters.</td>
              </tr>
            ) : (
              paged.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{fmt(row.createdAt)}</td>
                  <td className="px-3 py-3 font-medium">{(row as unknown as { partnerName: string }).partnerName ?? '—'}</td>
                  <td className="px-3 py-3 capitalize text-muted-foreground">{row.referralType.replace(/_/g, ' ')}</td>
                  <td className="px-3 py-3 text-muted-foreground">
                    {row.profile ? `${row.profile.firstName} ${row.profile.lastName}` : '—'}
                  </td>
                  <td className="px-3 py-3"><StatusPill status={row.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <PaginationBar page={safePage} total={filtered.length} filteredFrom={referrals.length} onPage={setPage} />
      </div>
    </div>
  );
}

// ── Main Reports Page ─────────────────────────────────────────────────────────

const TAB_CONFIG: { id: ReportTab; label: string; icon: React.ReactNode }[] = [
  { id: 'compliance', label: 'Compliance Checks', icon: <ShieldCheck className="size-4" /> },
  { id: 'partners', label: 'Partners', icon: <Handshake className="size-4" /> },
  { id: 'referrals', label: 'Referrals', icon: <FileText className="size-4" /> },
];

export default function Reports() {
  const { data: session } = useSession();
  const userRole = (session?.user?.role ?? 'tenant') as UserRole;
  const canExport = hasPermission(userRole, 'reports:export');

  const [tab, setTab] = useState<ReportTab>('compliance');

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Summary banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Report Domain', value: 'Compliance & Partners', icon: <ShieldCheck className="size-5 text-teal-600" />, bg: 'bg-teal-50' },
          { label: 'Export Format', value: 'CSV (instant download)', icon: <Download className="size-5 text-violet-600" />, bg: 'bg-violet-50' },
          { label: 'Last Updated', value: 'Live data', icon: <RefreshCw className="size-5 text-cyan-600" />, bg: 'bg-cyan-50' },
        ].map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`size-10 rounded-lg ${m.bg} flex items-center justify-center shrink-0`}>
                {m.icon}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="font-semibold text-sm mt-0.5">{m.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tab strip */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex items-center gap-2 mb-1">
            <FileBarChart className="size-5 text-teal-600" />
            <CardTitle>Report Explorer</CardTitle>
          </div>
          <CardDescription>Filter, sort and export live data across compliance, partner and referral domains.</CardDescription>
          <Separator className="mt-4" />
        </CardHeader>
        <CardContent className="pt-4">
          {/* Tab buttons */}
          <div className="flex gap-1 mb-5 bg-slate-100 p-1 rounded-lg w-fit">
            {TAB_CONFIG.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  tab === t.id
                    ? 'bg-white text-[#0F172A] shadow-sm'
                    : 'text-muted-foreground hover:text-[#0F172A]'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'compliance' && <ComplianceReport canExport={canExport} />}
          {tab === 'partners' && <PartnersReport canExport={canExport} />}
          {tab === 'referrals' && <ReferralsReport canExport={canExport} />}
        </CardContent>
      </Card>
    </motion.div>
  );
}
