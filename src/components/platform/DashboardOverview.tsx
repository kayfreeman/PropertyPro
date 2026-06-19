'use client';

import { motion, type Variants } from 'framer-motion';
import {
  Users,
  ShieldCheck,
  FileCheck,
  TrendingUp,
  ArrowUpRight,
  Activity,
  Clock,
  User,
  Plus,
  Search,
  AlertTriangle,
  FileBarChart,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from '@/components/ui/chart';
import { useApi } from '@/hooks/use-api';
import { useSession } from 'next-auth/react';
import { formatDateTime } from '@/lib/platform-data';
import { canAccessSection, type UserRole, type SectionId } from '@/lib/rbac';
import {
  ApplicantDashboard,
  RiskAnalystDashboard,
  VerifierDashboard,
  PartnerManagerDashboard,
  PartnerUserDashboard,
} from '@/components/platform/PersonaDashboards';

// Dashboard data types
interface DashboardSummary {
  totalProfiles: number;
  verifiedProfiles: number;
  pendingVerifications: number;
  compliancePassRate: number;
  averageTrustScore: number;
  totalProperties: number;
  activeApplications: number;
  openFraudAlerts: number;
  activePartners: number;
}

interface RiskDistribution {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

interface RecentActivityItem {
  id: string;
  action: string;
  performedBy: string;
  resource: string;
  details: string;
  timestamp: string;
  profileName: string | null;
}

interface MonthlyTrend {
  month: string;
  verifications: number;
  passed: number;
  failed: number;
}

interface DashboardData {
  summary: DashboardSummary;
  riskDistribution: RiskDistribution;
  recentActivity: RecentActivityItem[];
  monthlyTrends: MonthlyTrend[];
}

interface ComplianceData {
  complianceChecks: unknown[];
  total: number;
  summary: {
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byRiskRating: Record<string, number>;
  };
}

// Animation variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

// Chart configs
const areaChartConfig: ChartConfig = {
  verifications: { label: 'Verifications', color: '#10b981' },
  passed: { label: 'Passed', color: '#06b6d4' },
  failed: { label: 'Failed', color: '#ef4444' },
};

const COMPLIANCE_COLORS: Record<string, string> = {
  aml: '#10b981',
  kyc: '#06b6d4',
  cdd: '#8b5cf6',
  edd: '#f59e0b',
  sanctions: '#ef4444',
  pep: '#f97316',
  adverse_media: '#94a3b8',
  right_to_rent: '#6366f1',
};

const COMPLIANCE_LABELS: Record<string, string> = {
  aml: 'AML',
  kyc: 'KYC',
  cdd: 'CDD',
  edd: 'EDD',
  sanctions: 'Sanctions',
  pep: 'PEP',
  adverse_media: 'Adverse Media',
  right_to_rent: 'Right to Rent',
};

// Action icon mapping
function getActionIcon(action: string) {
  const lower = action.toLowerCase();
  if (lower.includes('verify') || lower.includes('verification')) return <ShieldCheck className="size-4 text-emerald-500" />;
  if (lower.includes('compliance') || lower.includes('check')) return <FileCheck className="size-4 text-cyan-500" />;
  if (lower.includes('risk') || lower.includes('fraud')) return <AlertTriangle className="size-4 text-amber-500" />;
  if (lower.includes('create') || lower.includes('profile')) return <User className="size-4 text-violet-500" />;
  return <Activity className="size-4 text-slate-500" />;
}

// Trust score circular indicator
function TrustScoreCircle({ score }: { score: number }) {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="80" height="80" className="-rotate-90">
        <circle cx="40" cy="40" r={radius} stroke="currentColor" strokeWidth="6" fill="none" className="text-muted/30" />
        <circle
          cx="40"
          cy="40"
          r={radius}
          stroke="#10b981"
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-lg font-bold text-emerald-600">{score.toFixed(1)}</span>
    </div>
  );
}

interface DashboardOverviewProps {
  onNavigate?: (section: SectionId) => void;
}

// Persona-based router (FR-4): each role lands on a dashboard tailored to its
// responsibilities, metrics and workflow queues. Roles without a dedicated
// dashboard (admin, MLRO, compliance officer, property manager, auditor) see the
// full platform overview below.
export default function DashboardOverview({ onNavigate }: DashboardOverviewProps = {}) {
  const { data: session } = useSession();
  const role = (session?.user?.role || 'tenant') as UserRole;

  switch (role) {
    case 'tenant':
      return <ApplicantDashboard onNavigate={onNavigate} />;
    case 'risk_analyst':
      return <RiskAnalystDashboard onNavigate={onNavigate} />;
    case 'identity_verifier':
      return <VerifierDashboard onNavigate={onNavigate} />;
    case 'partner_integration_manager':
      return <PartnerManagerDashboard onNavigate={onNavigate} />;
    case 'partner_user':
      return <PartnerUserDashboard onNavigate={onNavigate} />;
    default:
      return <DefaultDashboard onNavigate={onNavigate} />;
  }
}

function DefaultDashboard({ onNavigate }: DashboardOverviewProps = {}) {
  const { data: session } = useSession();
  const { data: dashboard, isLoading: dashboardLoading } = useApi<DashboardData>('dashboard', '/api/dashboard', true, {
    userId: session?.user?.id || '',
    role: session?.user?.role || '',
  });
  const { data: compliance } = useApi<ComplianceData>('compliance', '/api/compliance', true, {
    userId: session?.user?.id || '',
    role: session?.user?.role || '',
  });

  const summary = dashboard?.summary;
  const recentActivity = dashboard?.recentActivity ?? [];
  const monthlyTrends = dashboard?.monthlyTrends ?? [];
  const riskDist = dashboard?.riskDistribution ?? { low: 0, medium: 0, high: 0, critical: 0 };

  // Compliance distribution for pie chart
  const complianceByType = compliance?.summary?.byType ?? {};
  const pieData = Object.entries(complianceByType).map(([type, count]) => ({
    name: COMPLIANCE_LABELS[type] ?? type,
    value: count,
    type,
  }));

  const pieChartConfig: ChartConfig = Object.fromEntries(
    Object.entries(COMPLIANCE_LABELS).map(([key, label]) => [
      key,
      { label, color: COMPLIANCE_COLORS[key] },
    ])
  );

  // Metric cards data
  const metricCards = [
    {
      title: 'Total Identities',
      value: summary?.totalProfiles ?? 0,
      icon: Users,
      trend: '+12% this month',
      trendUp: true,
      color: 'emerald' as const,
    },
    {
      title: 'Verified Profiles',
      value: summary?.verifiedProfiles ?? 0,
      icon: ShieldCheck,
      trend: '+8% this month',
      trendUp: true,
      color: 'emerald' as const,
    },
    {
      title: 'Compliance Rate',
      value: `${summary?.compliancePassRate ?? 0}%`,
      numericValue: summary?.compliancePassRate ?? 0,
      icon: FileCheck,
      trend: '+3% this month',
      trendUp: true,
      color: 'emerald' as const,
      isProgress: true,
    },
    {
      title: 'Avg Trust Score',
      value: summary?.averageTrustScore?.toFixed(1) ?? '0.0',
      numericValue: summary?.averageTrustScore ?? 0,
      icon: TrendingUp,
      trend: '+5% this month',
      trendUp: true,
      color: 'emerald' as const,
      isTrustScore: true,
    },
  ];

  const userRole = (session?.user?.role || 'tenant') as UserRole;

  // Quick Actions config — maps each action to a section and checks RBAC access
  const quickActions = [
    { label: 'New Verification', icon: Plus, color: 'text-emerald-600', section: 'identity' as SectionId },
    { label: 'Run Compliance Check', icon: Search, color: 'text-cyan-600', section: 'compliance' as SectionId },
    { label: 'View Risk Alerts', icon: AlertTriangle, color: 'text-amber-600', section: 'risk' as SectionId },
    { label: 'Generate Report', icon: FileBarChart, color: 'text-violet-600', section: 'compliance' as SectionId },
  ];

  // Only show actions the user can access based on their role
  const visibleActions = quickActions.filter(a => canAccessSection(userRole, a.section));

  const handleQuickAction = (section: SectionId) => {
    if (onNavigate) {
      onNavigate(section);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card, index) => (
          <motion.div key={card.title} variants={itemVariants}>
            <Card className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
                        <card.icon className="size-4" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
                    </div>
                    <div className="text-2xl font-bold tracking-tight">{dashboardLoading ? '—' : card.value}</div>
                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                      <ArrowUpRight className="size-3" />
                      <span>{card.trend}</span>
                    </div>
                  </div>
                  {card.isTrustScore && !dashboardLoading && (
                    <TrustScoreCircle score={card.numericValue ?? 0} />
                  )}
                </div>
                {card.isProgress && (
                  <div className="mt-3">
                    <Progress value={card.numericValue ?? 0} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Verification Trends */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Monthly Verification Trends</CardTitle>
              <CardDescription>12-month verification overview</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={areaChartConfig} className="h-[280px] w-full">
                <AreaChart data={monthlyTrends} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillVerifications" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="fillPassed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="verifications" stroke="#10b981" fill="url(#fillVerifications)" strokeWidth={2} name="verifications" />
                  <Area type="monotone" dataKey="passed" stroke="#06b6d4" fill="url(#fillPassed)" strokeWidth={2} name="passed" />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Compliance Distribution */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compliance Distribution</CardTitle>
              <CardDescription>Breakdown by compliance check type</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={pieChartConfig} className="h-[280px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="type"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COMPLIANCE_COLORS[entry.type] ?? '#94a3b8'} stroke="transparent" />
                    ))}
                  </Pie>
                  <ChartLegend content={<ChartLegendContent nameKey="type" />} />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Risk Distribution Quick View */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Risk Distribution</CardTitle>
            <CardDescription>Current risk profile across all identities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                { label: 'Low Risk', value: riskDist.low, color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-950/40' },
                { label: 'Medium Risk', value: riskDist.medium, color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-950/40' },
                { label: 'High Risk', value: riskDist.high, color: '#f97316', bg: 'bg-orange-50 dark:bg-orange-950/40' },
                { label: 'Critical Risk', value: riskDist.critical, color: '#ef4444', bg: 'bg-red-50 dark:bg-red-950/40' },
              ].map((risk) => (
                <div key={risk.label} className={`rounded-lg ${risk.bg} p-4 text-center`}>
                  <div className="text-2xl font-bold" style={{ color: risk.color }}>
                    {dashboardLoading ? '—' : risk.value}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground">{risk.label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity Section */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription>Latest audit log entries</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                <Clock className="mr-1 size-3" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-1">
                {recentActivity.length === 0 && !dashboardLoading && (
                  <div className="py-8 text-center text-sm text-muted-foreground">No recent activity</div>
                )}
                {recentActivity.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        {getActionIcon(item.action)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate">{item.action.replace(/_/g, ' ')}</span>
                          <Badge variant="outline" className="shrink-0 text-[10px] px-1.5 py-0">
                            {item.resource}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {item.profileName && <span>{item.profileName}</span>}
                          {item.profileName && <span>·</span>}
                          <span>{formatDateTime(item.timestamp)}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-xs text-muted-foreground">
                        by {item.performedBy}
                      </div>
                    </div>
                    {index < recentActivity.length - 1 && <Separator className="my-1" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions Row */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Common platform operations</CardDescription>
          </CardHeader>
          <CardContent>
            {visibleActions.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No quick actions available for your role.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {visibleActions.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    className="h-auto flex-col gap-2 py-4"
                    onClick={() => handleQuickAction(action.section)}
                  >
                    <action.icon className={`size-5 ${action.color}`} />
                    <span className="text-xs font-medium">{action.label}</span>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
