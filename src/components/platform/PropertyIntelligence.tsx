'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  MapPin,
  Home,
  Users,
  FileCheck,
  Shield,
  TrendingUp,
  BarChart3,
  ArrowRight,
  Check,
  X,
  Eye,
  UserCheck,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApi } from '@/hooks/use-api';
import {
  PARTNER_TYPES,
  STATUS_COLORS,
  getStatusStyle,
  formatDate,
} from '@/lib/platform-data';
import RightToRentFlow from '@/components/platform/RightToRentFlow';

// Types based on API response
interface PropertyApplication {
  id: string;
  propertyId: string;
  profileId: string;
  applicationType: string;
  status: string;
  complianceClear: boolean;
  riskClear: boolean;
  rightToRent: string;
  guarantorReplaced: boolean;
  depositAmount: number | null;
  monthlyAmount: number | null;
  startDate: string | null;
  endDate: string | null;
  submittedAt: string;
  decidedAt: string | null;
  profile: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    nationality: string | null;
    trustLevel: number;
    status: string;
  };
}

interface Property {
  id: string;
  address: string;
  city: string;
  postcode: string;
  country: string;
  propertyType: string;
  bedrooms: number | null;
  complianceStatus: string;
  lastInspection: string | null;
  createdAt: string;
  updatedAt: string;
  applications: PropertyApplication[];
}

interface PropertiesResponse {
  properties: Property[];
  total: number;
  summary: {
    byComplianceStatus: Record<string, number>;
    byPropertyType: Record<string, number>;
    applicationsByStatus: Record<string, number>;
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

function PropertyTypeBadge({ type }: { type: string }) {
  const config: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
    residential: { color: '#10b981', bg: '#ecfdf5', icon: <Home className="size-3" /> },
    commercial: { color: '#8b5cf6', bg: '#f5f3ff', icon: <Building2 className="size-3" /> },
    hmo: { color: '#f59e0b', bg: '#fffbeb', icon: <Users className="size-3" /> },
  };
  const c = config[type] || { color: '#94a3b8', bg: '#f1f5f9', icon: <Building2 className="size-3" /> };
  return (
    <Badge
      className="font-medium gap-1"
      style={{ backgroundColor: c.bg, color: c.color, borderColor: 'transparent' }}
    >
      {c.icon}
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </Badge>
  );
}

function YesNoIcon({ value }: { value: boolean }) {
  return value ? (
    <Check className="size-4 text-emerald-500" />
  ) : (
    <X className="size-4 text-red-400" />
  );
}

export default function PropertyIntelligence() {
  const { data, isLoading, error } = useApi<PropertiesResponse>(
    'properties',
    '/api/properties'
  );

  const properties = data?.properties ?? [];
  const summary = data?.summary;

  // Compute metrics
  const totalProperties = data?.total ?? 0;
  const compliant = summary?.byComplianceStatus?.compliant ?? 0;
  const nonCompliant = summary?.byComplianceStatus?.non_compliant ?? 0;
  const underReview = summary?.byComplianceStatus?.under_review ?? 0;

  // Right to Rent counts
  const allApplications = properties.flatMap((p) => p.applications);
  const rtrPending = allApplications.filter((a) => a.rightToRent === 'pending').length;
  const rtrVerified = allApplications.filter((a) => a.rightToRent === 'verified').length;
  const rtrFailed = allApplications.filter((a) => a.rightToRent === 'failed').length;
  const rtrExpired = allApplications.filter((a) => a.rightToRent === 'expired').length;

  // Guarantor replaced
  const guarantorReplacedApps = allApplications.filter((a) => a.guarantorReplaced);

  // Market intelligence mock data
  const avgTrustByArea = [
    { area: 'London (SW1)', score: 78 },
    { area: 'Manchester (M1)', score: 72 },
    { area: 'Birmingham (B1)', score: 69 },
    { area: 'Edinburgh (EH1)', score: 81 },
    { area: 'Bristol (BS1)', score: 75 },
  ];

  const complianceTrendData = [
    { month: 'Jan', rate: 82 },
    { month: 'Feb', rate: 85 },
    { month: 'Mar', rate: 84 },
    { month: 'Apr', rate: 88 },
    { month: 'May', rate: 91 },
    { month: 'Jun', rate: 89 },
  ];

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
            <p className="font-medium">Failed to load property data</p>
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
      {/* Top Tabs: Properties / Right to Rent */}
      <Tabs defaultValue="properties" className="w-full">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="properties" className="gap-2">
            <Building2 className="size-4" />
            Properties
          </TabsTrigger>
          <TabsTrigger value="right-to-rent" className="gap-2">
            <ShieldCheck className="size-4" />
            Right to Rent
          </TabsTrigger>
        </TabsList>

        <TabsContent value="properties" className="mt-6 space-y-6">
      {/* Property Overview Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={fadeInUp}>
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Properties</p>
                  <p className="text-2xl font-bold mt-1">{totalProperties}</p>
                </div>
                <div className="size-10 rounded-lg bg-teal-50 flex items-center justify-center">
                  <Building2 className="size-5 text-teal-600" />
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
                  <p className="text-sm text-muted-foreground">Compliant</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-600">{compliant}</p>
                </div>
                <div className="size-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="size-5 text-emerald-600" />
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
                  <p className="text-sm text-muted-foreground">Non-Compliant</p>
                  <p className="text-2xl font-bold mt-1 text-red-500">{nonCompliant}</p>
                </div>
                <div className="size-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <XCircle className="size-5 text-red-500" />
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
                  <p className="text-sm text-muted-foreground">Under Review</p>
                  <p className="text-2xl font-bold mt-1 text-violet-600">{underReview}</p>
                </div>
                <div className="size-10 rounded-lg bg-violet-50 flex items-center justify-center">
                  <Clock className="size-5 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Properties List */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-5 text-teal-600" />
              Properties
            </CardTitle>
            <CardDescription>
              All registered properties with compliance status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {properties.map((property) => (
                <Card key={property.id} className="border shadow-none">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                          <div>
                            <p className="font-medium text-sm leading-tight">{property.address}</p>
                            <p className="text-xs text-muted-foreground">
                              {property.city}, {property.postcode}
                            </p>
                          </div>
                        </div>
                        <StatusBadge status={property.complianceStatus} />
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <PropertyTypeBadge type={property.propertyType} />
                        {property.bedrooms && (
                          <Badge variant="outline" className="text-xs">
                            {property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <FileCheck className="size-3" />
                          {property.applications.length} application{property.applications.length !== 1 ? 's' : ''}
                        </span>
                        <span>
                          {property.lastInspection
                            ? `Inspected: ${formatDate(property.lastInspection)}`
                            : 'No inspection yet'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Property Applications Table */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="size-5 text-teal-600" />
              Property Applications
            </CardTitle>
            <CardDescription>
              All property applications with compliance and risk clearance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Compliance</TableHead>
                  <TableHead className="text-center">Risk</TableHead>
                  <TableHead>Right to Rent</TableHead>
                  <TableHead className="text-center">Guarantor</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allApplications.map((app) => {
                  const property = properties.find((p) => p.id === app.propertyId);
                  return (
                    <TableRow key={app.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {app.profile.firstName} {app.profile.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{app.profile.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{property?.address ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">
                          {property?.city}, {property?.postcode}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {app.applicationType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={app.status} />
                      </TableCell>
                      <TableCell className="text-center">
                        <YesNoIcon value={app.complianceClear} />
                      </TableCell>
                      <TableCell className="text-center">
                        <YesNoIcon value={app.riskClear} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={app.rightToRent} />
                      </TableCell>
                      <TableCell className="text-center">
                        {app.guarantorReplaced ? (
                          <Badge
                            className="text-xs font-medium"
                            style={{ backgroundColor: '#ecfdf5', color: '#10b981', borderColor: 'transparent' }}
                          >
                            Replaced
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Standard</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Eye className="size-4 text-muted-foreground cursor-pointer hover:text-teal-600 transition-colors" />
                      </TableCell>
                    </TableRow>
                  );
                })}
                {allApplications.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                      No applications found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Right to Rent & Guarantor Replacement Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Right to Rent Status Panel */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="size-5 text-teal-600" />
                Right to Rent Status
              </CardTitle>
              <CardDescription>
                Immigration Act 2014 — Section 22 compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="text-2xl font-bold text-amber-600">{rtrPending}</p>
                  <p className="text-xs text-amber-600 font-medium mt-1">Pending</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                  <p className="text-2xl font-bold text-emerald-600">{rtrVerified}</p>
                  <p className="text-xs text-emerald-600 font-medium mt-1">Verified</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-50 border border-red-100">
                  <p className="text-2xl font-bold text-red-500">{rtrFailed}</p>
                  <p className="text-xs text-red-500 font-medium mt-1">Failed</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-2xl font-bold text-gray-500">{rtrExpired}</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">Expired</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Regulatory Reference</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Under the Immigration Act 2014, landlords must verify that all tenants aged 18+ have
                  the right to rent in the UK. Non-compliance can result in civil penalties of up to
                  £3,000 per tenant. PropComply automates this check through Home Office integration.
                </p>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-teal-50 text-teal-700 text-xs">
                <UserCheck className="size-4 shrink-0" />
                <span>Automated Right to Rent verification via Home Office database</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Guarantor Replacement Feature */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="size-5 text-teal-600" />
                Guarantor Replacement
              </CardTitle>
              <CardDescription>
                Trust credentials replacing traditional guarantors
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {guarantorReplacedApps.length > 0 && (
                <div className="space-y-2">
                  {guarantorReplacedApps.map((app) => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-100"
                    >
                      <div>
                        <p className="font-medium text-sm text-emerald-800">
                          {app.profile.firstName} {app.profile.lastName}
                        </p>
                        <p className="text-xs text-emerald-600">
                          Trust Level {app.profile.trustLevel} &middot; {app.applicationType}
                        </p>
                      </div>
                      <Badge
                        className="font-medium"
                        style={{ backgroundColor: '#ecfdf5', color: '#10b981', borderColor: 'transparent' }}
                      >
                        Guarantor Replaced
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              <Separator />
              <div className="p-4 rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100">
                <p className="text-sm font-semibold text-teal-800 mb-2">How It Works</p>
                <p className="text-xs text-teal-700 leading-relaxed mb-3">
                  PropComply&apos;s Trust Ladder enables verified profiles to replace traditional
                  guarantor requirements. When a profile reaches Trust Level 3+ (Behavioural Verified)
                  with clear compliance and risk checks, the platform issues a Guarantor Replacement
                  Certificate — accepted by partner landlords and letting agents.
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs border-teal-200 text-teal-700">
                    Level 3+ Required
                  </Badge>
                  <Badge variant="outline" className="text-xs border-teal-200 text-teal-700">
                    Compliance Clear
                  </Badge>
                  <Badge variant="outline" className="text-xs border-teal-200 text-teal-700">
                    Risk Clear
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Market Intelligence Section */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5 text-teal-600" />
              Market Intelligence
            </CardTitle>
            <CardDescription>
              Property market insights and compliance trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Average Trust Score by Area */}
              <div className="space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="size-4 text-muted-foreground" />
                  Avg Trust Score by Area
                </p>
                <div className="space-y-3">
                  {avgTrustByArea.map((item) => (
                    <div key={item.area} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{item.area}</span>
                        <span className="font-medium">{item.score}</span>
                      </div>
                      <Progress value={item.score} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Trends */}
              <div className="space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="size-4 text-muted-foreground" />
                  Compliance Rate Trend
                </p>
                <div className="space-y-2">
                  {complianceTrendData.map((item, idx) => (
                    <div key={item.month} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground w-8">{item.month}</span>
                      <div className="flex-1 h-6 bg-muted/50 rounded relative overflow-hidden">
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-teal-400/60 rounded"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.rate}%` }}
                          transition={{ delay: idx * 0.1, duration: 0.6 }}
                        />
                        <span className="absolute inset-0 flex items-center justify-end pr-2 text-xs font-medium">
                          {item.rate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Heatmap (Decorative) */}
              <div className="space-y-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="size-4 text-muted-foreground" />
                  Risk Heatmap
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {Array.from({ length: 25 }).map((_, i) => {
                    const row = Math.floor(i / 5);
                    const col = i % 5;
                    const intensity = Math.max(
                      0.1,
                      Math.min(1, (row * 0.2 + col * 0.15 + Math.sin(i) * 0.3))
                    );
                    const isHighRisk = intensity > 0.6;
                    const color = isHighRisk
                      ? `rgba(239, 68, 68, ${intensity})`
                      : `rgba(16, 185, 129, ${intensity})`;
                    return (
                      <div
                        key={i}
                        className="aspect-square rounded-sm"
                        style={{ backgroundColor: color }}
                        title={`Zone ${row + 1}-${col + 1}: ${isHighRisk ? 'High' : 'Low'} risk`}
                      />
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                  <span>Low Risk</span>
                  <div className="flex gap-1">
                    {[0.2, 0.4, 0.6, 0.8, 1.0].map((opacity) => (
                      <div
                        key={opacity}
                        className="size-3 rounded-sm"
                        style={{
                          backgroundColor:
                            opacity > 0.6
                              ? `rgba(239, 68, 68, ${opacity})`
                              : `rgba(16, 185, 129, ${opacity})`,
                        }}
                      />
                    ))}
                  </div>
                  <span>High Risk</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
        </TabsContent>

        <TabsContent value="right-to-rent" className="mt-6">
          <RightToRentFlow />
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
