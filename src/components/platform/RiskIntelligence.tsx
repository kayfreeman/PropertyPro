'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  AlertTriangle,
  Shield,
  TrendingUp,
  Activity,
  Eye,
  UserCheck,
  Lock,
  ChevronRight,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Info,
  TreePine,
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
  Alert,
  AlertTitle,
  AlertDescription,
} from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { useApi } from '@/hooks/use-api';
import {
  RISK_CATEGORIES,
  STATUS_COLORS,
  getStatusStyle,
  formatDate,
  TRUST_LEVELS,
} from '@/lib/platform-data';

// ── Types ──────────────────────────────────────────────────
interface RiskScore {
  id: string;
  profileId: string;
  overallScore: number;
  riskCategory: string;
  fraudProbability: number;
  identityRisk: number;
  financialRisk: number;
  behavioralRisk: number;
  complianceRisk: number;
  riskFactors: string | null;
  modelVersion: string | null;
  explainability: string | null;
  createdAt: string;
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    nationality: string | null;
    status: string;
    trustLevel: number;
  };
}

interface FraudAlert {
  id: string;
  alertType: string;
  severity: string;
  status: string;
  description: string;
  evidenceRef: string | null;
  relatedProfileId: string | null;
  assignedTo: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  relatedProfile: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    nationality: string | null;
  } | null;
}

interface RiskSummary {
  riskCategories: { category: string; count: number; avgScore: number; avgFraudProbability: number }[];
  alertSeverity: Record<string, number>;
  alertStatus: Record<string, number>;
}

interface RiskResponse {
  riskScores: RiskScore[];
  fraudAlerts: FraudAlert[];
  summary: RiskSummary;
}

// ── Severity Config ────────────────────────────────────────
const SEVERITY_CONFIG: Record<string, { color: string; bgColor: string; icon: React.ReactNode }> = {
  critical: { color: '#ef4444', bgColor: '#fef2f2', icon: <ShieldAlert className="size-4" style={{ color: '#ef4444' }} /> },
  high: { color: '#f97316', bgColor: '#fff7ed', icon: <AlertTriangle className="size-4" style={{ color: '#f97316' }} /> },
  medium: { color: '#f59e0b', bgColor: '#fffbeb', icon: <AlertCircle className="size-4" style={{ color: '#f59e0b' }} /> },
  low: { color: '#10b981', bgColor: '#ecfdf5', icon: <ShieldCheck className="size-4" style={{ color: '#10b981' }} /> },
};

// ── Risk Category Config ──────────────────────────────────
const RISK_CAT_MAP = Object.fromEntries(RISK_CATEGORIES.map((rc) => [rc.category, rc]));

// ── Animation Variants ────────────────────────────────────
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: 'easeOut' },
  }),
};

// ── Sparkline Component ───────────────────────────────────
function MiniSparkline({ data, color = '#10b981', width = 80, height = 32 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);

  const points = data.map((v, i) => `${i * stepX},${height - ((v - min) / range) * (height - 4) - 2}`).join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
}

// ── Risk Factor Bar ────────────────────────────────────────
function RiskFactorBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{value.toFixed(1)}</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2.5">
        <motion.div
          className="h-2.5 rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────
export default function RiskIntelligence() {
  const { data, isLoading } = useApi<RiskResponse>('risk', '/api/risk');
  const [alertStatusFilter, setAlertStatusFilter] = useState<string>('all');
  const [selectedRiskId, setSelectedRiskId] = useState<string | null>(null);

  const riskScores = data?.riskScores ?? [];
  const fraudAlerts = data?.fraudAlerts ?? [];
  const summary = data?.summary;

  // Compute overview metrics
  const avgRiskScore = riskScores.length > 0
    ? Math.round(riskScores.reduce((sum, r) => sum + r.overallScore, 0) / riskScores.length * 10) / 10
    : 0;
  const highRiskCount = riskScores.filter((r) => r.riskCategory === 'high' || r.riskCategory === 'critical').length;
  const openAlerts = fraudAlerts.filter((a) => a.status === 'open' || a.status === 'investigating').length;

  // Trust score trend (sparkline data)
  const trustTrend = useMemo(() => {
    const sorted = [...riskScores].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return sorted.map((r) => r.overallScore);
  }, [riskScores]);

  // Risk distribution chart data
  const riskDistData = useMemo(() =>
    RISK_CATEGORIES.map((rc) => {
      const catData = summary?.riskCategories.find((c) => c.category === rc.category);
      return {
        name: rc.label,
        count: catData?.count ?? 0,
        fill: rc.color,
      };
    }), [summary]);

  // Pie chart data
  const pieData = useMemo(() =>
    RISK_CATEGORIES.map((rc) => {
      const catData = summary?.riskCategories.find((c) => c.category === rc.category);
      return {
        name: rc.label,
        value: catData?.count ?? 0,
        color: rc.color,
      };
    }), [summary]);

  // Filtered fraud alerts
  const filteredAlerts = useMemo(() => {
    if (alertStatusFilter === 'all') return fraudAlerts;
    return fraudAlerts.filter((a) => a.status === alertStatusFilter);
  }, [fraudAlerts, alertStatusFilter]);

  // Selected risk score for factor breakdown
  const selectedRisk = selectedRiskId
    ? riskScores.find((r) => r.id === selectedRiskId)
    : riskScores[0] ?? null;

  // Explainability data
  const explainability = useMemo(() => {
    if (!selectedRisk?.explainability) return null;
    try {
      return JSON.parse(selectedRisk.explainability);
    } catch {
      return null;
    }
  }, [selectedRisk]);

  // Trust leaderboard sorted by trust score (from profile trustScore if available)
  const leaderboard = useMemo(() =>
    [...riskScores].sort((a, b) => b.overallScore - a.overallScore),
  [riskScores]);

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
      {/* ── Risk Overview Cards ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div custom={0} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Risk Score</p>
                  <p className="text-3xl font-bold">{avgRiskScore}</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50">
                  <Shield className="size-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Risk Profiles</p>
                  <p className="text-3xl font-bold text-red-600">{highRiskCount}</p>
                </div>
                <div className="p-2 rounded-lg bg-red-50">
                  <AlertTriangle className="size-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Fraud Alerts</p>
                  <p className="text-3xl font-bold text-amber-600">{openAlerts}</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-50">
                  <AlertCircle className="size-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={3} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="border-l-4 border-l-sky-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Trust Score Trend</p>
                  <div className="mt-1">
                    <MiniSparkline data={trustTrend} color="#0ea5e9" width={100} height={36} />
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-sky-50">
                  <TrendingUp className="size-6 text-sky-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Risk Distribution Charts ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Risk Distribution</CardTitle>
              <CardDescription>Number of profiles by risk category</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={riskDistData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: 8, fontSize: 13, border: '1px solid #e5e7eb' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={56}>
                    {riskDistData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Risk Composition</CardTitle>
              <CardDescription>Proportion of profiles across risk categories</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, value }) => value > 0 ? `${name}` : ''}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: string) => <span className="text-xs">{value}</span>}
                  />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: 8, fontSize: 13, border: '1px solid #e5e7eb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Fraud Alerts Panel ──────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Fraud Alerts</CardTitle>
                <CardDescription>Active fraud alerts and investigation status</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="size-4 text-muted-foreground" />
                <Select value={alertStatusFilter} onValueChange={setAlertStatusFilter}>
                  <SelectTrigger className="w-[160px]" size="sm">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="false_positive">False Positive</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              <style jsx>{`
                div::-webkit-scrollbar { width: 6px; }
                div::-webkit-scrollbar-track { background: transparent; }
                div::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 3px; }
                div::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
              `}</style>
              {filteredAlerts.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No fraud alerts found
                </div>
              ) : (
                filteredAlerts.map((alert) => {
                  const sev = SEVERITY_CONFIG[alert.severity] ?? SEVERITY_CONFIG.medium;
                  const statusStyle = getStatusStyle(alert.status);
                  return (
                    <Alert
                      key={alert.id}
                      className="border-l-4"
                      style={{ borderLeftColor: sev.color }}
                    >
                      {sev.icon}
                      <AlertTitle className="flex items-center gap-2">
                        <span>{alert.alertType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</span>
                        <Badge
                          className="text-xs border-0"
                          style={{ color: sev.color, backgroundColor: sev.bgColor }}
                        >
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge
                          className="text-xs border-0"
                          style={{ color: statusStyle.color, backgroundColor: statusStyle.bgColor }}
                        >
                          {alert.status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription>
                        <p className="text-sm">{alert.description}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                          {alert.relatedProfile && (
                            <span>Profile: {alert.relatedProfile.firstName} {alert.relatedProfile.lastName}</span>
                          )}
                          {alert.assignedTo && <span>Assigned: {alert.assignedTo}</span>}
                          <span>Created: {formatDate(alert.createdAt)}</span>
                        </div>
                      </AlertDescription>
                    </Alert>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Risk Factor Breakdown ───────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Risk Factor Breakdown</CardTitle>
                <CardDescription>
                  {selectedRisk
                    ? `Detailed factors for ${selectedRisk.profile.firstName} ${selectedRisk.profile.lastName}`
                    : 'Select a profile to view risk factors'}
                </CardDescription>
              </div>
              <Select
                value={selectedRiskId ?? ''}
                onValueChange={setSelectedRiskId}
              >
                <SelectTrigger className="w-[200px]" size="sm">
                  <SelectValue placeholder="Select profile" />
                </SelectTrigger>
                <SelectContent>
                  {riskScores.map((rs) => (
                    <SelectItem key={rs.id} value={rs.id}>
                      {rs.profile.firstName} {rs.profile.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {selectedRisk ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="text-4xl font-bold"
                    style={{ color: RISK_CAT_MAP[selectedRisk.riskCategory]?.color ?? '#94a3b8' }}
                  >
                    {selectedRisk.overallScore.toFixed(1)}
                  </div>
                  <div>
                    <Badge
                      className="text-sm border-0"
                      style={{
                        color: RISK_CAT_MAP[selectedRisk.riskCategory]?.color ?? '#94a3b8',
                        backgroundColor: RISK_CAT_MAP[selectedRisk.riskCategory]?.bgColor ?? '#f1f5f9',
                      }}
                    >
                      {RISK_CAT_MAP[selectedRisk.riskCategory]?.label ?? selectedRisk.riskCategory}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Fraud probability: {(selectedRisk.fraudProbability * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
                <RiskFactorBar label="Identity Risk" value={selectedRisk.identityRisk} color="#3b82f6" />
                <RiskFactorBar label="Financial Risk" value={selectedRisk.financialRisk} color="#f59e0b" />
                <RiskFactorBar label="Behavioral Risk" value={selectedRisk.behavioralRisk} color="#8b5cf6" />
                <RiskFactorBar label="Compliance Risk" value={selectedRisk.complianceRisk} color="#ef4444" />
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No risk data available
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Trust Score Leaderboard ─────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trust Score Leaderboard</CardTitle>
            <CardDescription>Profiles ranked by overall risk score (higher = lower risk)</CardDescription>
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
                    <TableHead className="w-10">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Trust Score</TableHead>
                    <TableHead>Risk Category</TableHead>
                    <TableHead>Trust Level</TableHead>
                    <TableHead>Overall Risk</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboard.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No profiles found
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaderboard.map((rs, idx) => {
                      const catInfo = RISK_CAT_MAP[rs.riskCategory];
                      const trustLevel = TRUST_LEVELS[rs.profile.trustLevel] ?? TRUST_LEVELS[0];
                      return (
                        <TableRow key={rs.id} className="cursor-pointer" onClick={() => setSelectedRiskId(rs.id)}>
                          <TableCell className="font-medium text-muted-foreground">{idx + 1}</TableCell>
                          <TableCell className="font-medium">
                            {rs.profile.firstName} {rs.profile.lastName}
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold" style={{ color: catInfo?.color ?? '#94a3b8' }}>
                              {rs.overallScore.toFixed(1)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className="text-xs border-0"
                              style={{ color: catInfo?.color ?? '#94a3b8', backgroundColor: catInfo?.bgColor ?? '#f1f5f9' }}
                            >
                              {catInfo?.label ?? rs.riskCategory}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs" style={{ color: trustLevel.color, borderColor: trustLevel.color + '60' }}>
                              L{rs.profile.trustLevel} — {trustLevel.name}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Progress value={rs.overallScore} className="w-20 h-2" />
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
      </motion.div>

      {/* ── Explainability Panel ────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="size-5 text-sky-500" />
              Explainability & Decision Rationale
            </CardTitle>
            <CardDescription>
              {selectedRisk
                ? `Decision traceability for ${selectedRisk.profile.firstName} ${selectedRisk.profile.lastName}`
                : 'Select a profile to view explainability data'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedRisk ? (
              <div className="space-y-4">
                {/* Decision Summary */}
                <div className="rounded-lg border p-4 bg-muted/30">
                  <div className="flex items-start gap-3">
                    <Info className="size-5 text-sky-500 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-sm">Decision Summary</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Risk assessment completed for <strong>{selectedRisk.profile.firstName} {selectedRisk.profile.lastName}</strong>.
                        Overall score: <strong>{selectedRisk.overallScore.toFixed(1)}/100</strong> —
                        Category: <strong>{RISK_CAT_MAP[selectedRisk.riskCategory]?.label ?? selectedRisk.riskCategory}</strong>.
                        {selectedRisk.fraudProbability > 0.3 && (
                          <span className="text-red-600 font-medium"> Elevated fraud probability detected.</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Evidence Traceability */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <TreePine className="size-5 text-emerald-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-3">Evidence Traceability</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-muted-foreground">Identity Verification:</span>
                          <span className="font-medium">{selectedRisk.identityRisk < 30 ? 'Strong' : selectedRisk.identityRisk < 60 ? 'Moderate' : 'Weak'}</span>
                          <span className="text-xs text-muted-foreground">({selectedRisk.identityRisk.toFixed(1)}/100 risk)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-muted-foreground">Financial Behaviour:</span>
                          <span className="font-medium">{selectedRisk.financialRisk < 30 ? 'Strong' : selectedRisk.financialRisk < 60 ? 'Moderate' : 'Weak'}</span>
                          <span className="text-xs text-muted-foreground">({selectedRisk.financialRisk.toFixed(1)}/100 risk)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="text-muted-foreground">Behavioural Signals:</span>
                          <span className="font-medium">{selectedRisk.behavioralRisk < 30 ? 'Strong' : selectedRisk.behavioralRisk < 60 ? 'Moderate' : 'Weak'}</span>
                          <span className="text-xs text-muted-foreground">({selectedRisk.behavioralRisk.toFixed(1)}/100 risk)</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-muted-foreground">Compliance History:</span>
                          <span className="font-medium">{selectedRisk.complianceRisk < 30 ? 'Strong' : selectedRisk.complianceRisk < 60 ? 'Moderate' : 'Weak'}</span>
                          <span className="text-xs text-muted-foreground">({selectedRisk.complianceRisk.toFixed(1)}/100 risk)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Confidence Scores */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="size-5 text-amber-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-3">Confidence Scores</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {[
                          { label: 'Model Confidence', value: Math.max(70, 100 - selectedRisk.fraudProbability * 100), color: '#10b981' },
                          { label: 'Data Completeness', value: selectedRisk.profile.trustLevel >= 3 ? 85 : selectedRisk.profile.trustLevel >= 1 ? 60 : 35, color: '#3b82f6' },
                          { label: 'Identity Assurance', value: 100 - selectedRisk.identityRisk, color: '#8b5cf6' },
                          { label: 'Overall Confidence', value: selectedRisk.overallScore, color: '#f59e0b' },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center gap-3">
                            <Progress value={item.value} className="flex-1 h-2" />
                            <span className="text-xs font-medium min-w-[60px] text-right" style={{ color: item.color }}>
                              {item.value.toFixed(0)}%
                            </span>
                            <span className="text-xs text-muted-foreground min-w-[100px]">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Raw Explainability Data (if available) */}
                {explainability && (
                  <div className="rounded-lg border p-4 bg-muted/30">
                    <div className="flex items-start gap-3">
                      <Lock className="size-5 text-gray-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-2">Raw Explainability Data</h4>
                        <pre className="text-xs text-muted-foreground bg-background rounded-md p-3 overflow-x-auto max-h-40 overflow-y-auto">
                          {JSON.stringify(explainability, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Model Info */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Activity className="size-3.5" />
                  <span>Model version: {selectedRisk.modelVersion ?? 'v1.0.0'}</span>
                  <span className="mx-1">·</span>
                  <span>Assessed: {formatDate(selectedRisk.createdAt)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No risk data available for explainability analysis
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
