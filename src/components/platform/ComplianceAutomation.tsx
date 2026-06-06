'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileCheck,
  Search,
  Eye,
  Landmark,
  Newspaper,
  UserCheck,
  ArrowRight,
  ChevronDown,
  MoreHorizontal,
  Filter,
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
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { useApi } from '@/hooks/use-api';
import {
  COMPLIANCE_TYPES,
  STATUS_COLORS,
  getStatusStyle,
  formatDate,
} from '@/lib/platform-data';

// ── Types ──────────────────────────────────────────────────
interface ComplianceCheck {
  id: string;
  profileId: string;
  checkType: string;
  status: string;
  riskRating: string;
  checkProvider: string | null;
  results: string | null;
  evidenceRef: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    nationality: string | null;
    status: string;
  };
}

interface ComplianceSummary {
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byRiskRating: Record<string, number>;
}

interface ComplianceResponse {
  complianceChecks: ComplianceCheck[];
  total: number;
  summary: ComplianceSummary;
}

// ── Compliance Type Color Map ──────────────────────────────
const TYPE_COLORS: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
  aml: { color: '#10b981', bgColor: '#ecfdf5', icon: <ShieldCheck className="size-5" style={{ color: '#10b981' }} /> },
  kyc: { color: '#3b82f6', bgColor: '#eff6ff', icon: <UserCheck className="size-5" style={{ color: '#3b82f6' }} /> },
  cdd: { color: '#06b6d4', bgColor: '#ecfeff', icon: <Search className="size-5" style={{ color: '#06b6d4' }} /> },
  edd: { color: '#8b5cf6', bgColor: '#f5f3ff', icon: <Eye className="size-5" style={{ color: '#8b5cf6' }} /> },
  sanctions: { color: '#ef4444', bgColor: '#fef2f2', icon: <AlertTriangle className="size-5" style={{ color: '#ef4444' }} /> },
  pep: { color: '#f59e0b', bgColor: '#fffbeb', icon: <Landmark className="size-5" style={{ color: '#f59e0b' }} /> },
  adverse_media: { color: '#ec4899', bgColor: '#fdf2f8', icon: <Newspaper className="size-5" style={{ color: '#ec4899' }} /> },
  right_to_rent: { color: '#f97316', bgColor: '#fff7ed', icon: <FileCheck className="size-5" style={{ color: '#f97316' }} /> },
};

// ── Regulation Data ────────────────────────────────────────
const REGULATIONS = [
  { name: 'UK GDPR', description: 'General Data Protection Regulation (UK implementation) — governs data processing, consent, and subject rights.' },
  { name: 'UK MLR 2017', description: 'Money Laundering, Terrorist Financing and Transfer of Funds Regulations 2017 — AML/CDD obligations.' },
  { name: 'FCA Guidance', description: 'Financial Conduct Authority guidance on financial crime, customer due diligence, and reporting obligations.' },
  { name: 'Immigration Act 2014', description: 'Right to Rent scheme requiring landlords to verify immigration status of tenants.' },
  { name: 'Data Protection Act 2018', description: 'UK data protection law implementing GDPR and governing law enforcement data processing.' },
];

// ── Animation Variants ────────────────────────────────────
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

// ── Status Badge ───────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const style = getStatusStyle(status);
  return (
    <Badge
      className="text-xs font-medium border-0"
      style={{ color: style.color, backgroundColor: style.bgColor }}
    >
      {status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
    </Badge>
  );
}

// ── Risk Badge ─────────────────────────────────────────────
function RiskBadge({ rating }: { rating: string }) {
  const style = getStatusStyle(rating);
  return (
    <Badge
      className="text-xs font-medium border-0"
      style={{ color: style.color, backgroundColor: style.bgColor }}
    >
      {rating.charAt(0).toUpperCase() + rating.slice(1)}
    </Badge>
  );
}

// ── Mini Progress Ring ─────────────────────────────────────
function ProgressRing({ value, size = 40, strokeWidth = 4, color = '#10b981' }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} stroke="#e5e7eb" strokeWidth={strokeWidth} fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function ComplianceAutomation() {
  const { data, isLoading } = useApi<ComplianceResponse>('compliance', '/api/compliance');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const complianceChecks = data?.complianceChecks ?? [];
  const summary = data?.summary;

  // Compute overview stats
  const totalChecks = data?.total ?? 0;
  const passedCount = summary?.byStatus?.passed ?? 0;
  const passRate = totalChecks > 0 ? Math.round((passedCount / totalChecks) * 100) : 0;
  const pendingCount = (summary?.byStatus?.pending ?? 0) + (summary?.byStatus?.in_progress ?? 0) + (summary?.byStatus?.under_review ?? 0);
  const escalatedCount = summary?.byStatus?.escalated ?? 0;

  // Compute pass rate per type
  const typePassRates = useMemo(() => {
    if (!complianceChecks.length) return {} as Record<string, number>;
    const byType: Record<string, { total: number; passed: number }> = {};
    for (const check of complianceChecks) {
      if (!byType[check.checkType]) byType[check.checkType] = { total: 0, passed: 0 };
      byType[check.checkType].total++;
      if (check.status === 'passed') byType[check.checkType].passed++;
    }
    const result: Record<string, number> = {};
    for (const [type, counts] of Object.entries(byType)) {
      result[type] = Math.round((counts.passed / counts.total) * 100);
    }
    return result;
  }, [complianceChecks]);

  // Filtered checks
  const filteredChecks = useMemo(() => {
    if (typeFilter === 'all') return complianceChecks;
    return complianceChecks.filter((c) => c.checkType === typeFilter);
  }, [complianceChecks, typeFilter]);

  // Workflow counts
  const workflowCounts = useMemo(() => ({
    submitted: (summary?.byStatus?.pending ?? 0),
    in_progress: (summary?.byStatus?.in_progress ?? 0),
    under_review: (summary?.byStatus?.under_review ?? 0),
    passed: (summary?.byStatus?.passed ?? 0),
    failed: (summary?.byStatus?.failed ?? 0),
    escalated: (summary?.byStatus?.escalated ?? 0),
  }), [summary]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-24 mb-2" />
                <div className="h-8 bg-muted rounded w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-64 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Overview Cards ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Checks</p>
                  <p className="text-3xl font-bold">{totalChecks}</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50">
                  <FileCheck className="size-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="border-l-4 border-l-sky-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pass Rate</p>
                  <p className="text-3xl font-bold">{passRate}%</p>
                </div>
                <ProgressRing value={passRate} color="#0ea5e9" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Reviews</p>
                  <p className="text-3xl font-bold">{pendingCount}</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-50">
                  <Clock className="size-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Escalated</p>
                  <p className="text-3xl font-bold text-red-600">{escalatedCount}</p>
                </div>
                <div className="p-2 rounded-lg bg-red-50">
                  <AlertTriangle className="size-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Compliance Type Grid ────────────────────────── */}
      <motion.div variants={containerVariants} initial="hidden" animate="visible">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compliance Check Types</CardTitle>
            <CardDescription>Overview of all compliance check categories and their current status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {COMPLIANCE_TYPES.map((ct) => {
                const typeColor = TYPE_COLORS[ct.type];
                const count = summary?.byType?.[ct.type] ?? 0;
                const rate = typePassRates[ct.type] ?? 0;
                return (
                  <motion.div key={ct.type} variants={itemVariants}>
                    <div
                      className="rounded-xl border p-4 hover:shadow-md transition-shadow cursor-pointer"
                      style={{ borderLeftWidth: 3, borderLeftColor: typeColor?.color ?? '#94a3b8' }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg" style={{ backgroundColor: typeColor?.bgColor ?? '#f1f5f9' }}>
                          {typeColor?.icon ?? <FileCheck className="size-5 text-gray-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{ct.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{ct.regulation}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{count} checks</span>
                        <span className="text-xs font-medium" style={{ color: typeColor?.color ?? '#94a3b8' }}>
                          {rate}% pass
                        </span>
                      </div>
                      <Progress value={rate} className="mt-1.5 h-1.5" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Compliance Workflow Visualization ───────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compliance Pipeline</CardTitle>
            <CardDescription>Workflow progression across compliance check stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-0">
              {[
                { key: 'submitted', label: 'Submitted', count: workflowCounts.submitted, color: '#06b6d4', bg: '#ecfeff' },
                { key: 'in_progress', label: 'In Progress', count: workflowCounts.in_progress, color: '#3b82f6', bg: '#eff6ff' },
                { key: 'under_review', label: 'Under Review', count: workflowCounts.under_review, color: '#8b5cf6', bg: '#f5f3ff' },
                { key: 'passed', label: 'Passed', count: workflowCounts.passed, color: '#10b981', bg: '#ecfdf5' },
                { key: 'failed', label: 'Failed', count: workflowCounts.failed, color: '#ef4444', bg: '#fef2f2' },
                { key: 'escalated', label: 'Escalated', count: workflowCounts.escalated, color: '#f97316', bg: '#fff7ed' },
              ].map((stage, idx, arr) => (
                <div key={stage.key} className="flex items-center">
                  <div
                    className="flex flex-col items-center px-4 py-3 rounded-lg border min-w-[90px]"
                    style={{ borderColor: stage.color + '40', backgroundColor: stage.bg }}
                  >
                    <span className="text-2xl font-bold" style={{ color: stage.color }}>
                      {stage.count}
                    </span>
                    <span className="text-xs font-medium mt-1" style={{ color: stage.color }}>
                      {stage.label}
                    </span>
                  </div>
                  {idx < arr.length - 1 && idx !== 2 && (
                    <ArrowRight className="size-4 text-muted-foreground mx-1 hidden sm:block" />
                  )}
                  {idx === 2 && (
                    <div className="flex flex-col items-center mx-1 hidden sm:flex">
                      <ArrowRight className="size-4 text-muted-foreground rotate-[-30deg]" />
                      <ArrowRight className="size-4 text-muted-foreground rotate-[30deg]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Compliance Checks Table ─────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Compliance Checks</CardTitle>
                <CardDescription>Detailed view of all compliance verification checks</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[160px]" size="sm">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {COMPLIANCE_TYPES.map((ct) => (
                      <SelectItem key={ct.type} value={ct.type}>
                        {ct.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-80 overflow-y-auto rounded-md border" style={{ scrollbarWidth: 'thin' }}>
              <style jsx>{`
                div::-webkit-scrollbar { width: 6px; }
                div::-webkit-scrollbar-track { background: transparent; }
                div::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
                div::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
              `}</style>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profile Name</TableHead>
                    <TableHead>Check Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Risk Rating</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Reviewed By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredChecks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No compliance checks found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredChecks.map((check) => (
                      <TableRow key={check.id}>
                        <TableCell className="font-medium">
                          {check.profile.firstName} {check.profile.lastName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs" style={{ color: TYPE_COLORS[check.checkType]?.color, borderColor: TYPE_COLORS[check.checkType]?.color + '40' }}>
                            {COMPLIANCE_TYPES.find((c) => c.type === check.checkType)?.name ?? check.checkType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={check.status} />
                        </TableCell>
                        <TableCell>
                          <RiskBadge rating={check.riskRating} />
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {check.checkProvider ?? '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {check.reviewedBy ?? '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {formatDate(check.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Regulatory Framework Section ────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Regulatory Framework</CardTitle>
            <CardDescription>Applicable regulations governing compliance operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {REGULATIONS.map((reg) => (
                <Tooltip key={reg.name}>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="px-3 py-1.5 text-sm cursor-pointer hover:bg-accent transition-colors"
                    >
                      <Landmark className="size-3.5 mr-1.5 text-muted-foreground" />
                      {reg.name}
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-xs">{reg.description}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
