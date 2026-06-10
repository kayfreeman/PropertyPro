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
  Upload,
  FileText,
  Award,
  Bell,
  Lock,
  ExternalLink,
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
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useApi } from '@/hooks/use-api';
import { useSession } from 'next-auth/react';
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

interface PropertyIntelligenceProps {
  onNavigate?: (section: string) => void;
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

// ===================== TENANT VIEW =====================

function TenantPropertyView({
  properties,
  allApplications,
  sessionEmail,
  onNavigate,
}: {
  properties: Property[];
  allApplications: PropertyApplication[];
  sessionEmail: string;
  onNavigate?: (section: string) => void;
}) {
  // Filter to only the tenant's own applications
  const myApplications = allApplications.filter(
    (app) => app.profile.email === sessionEmail
  );

  // Derive tenant's RTR status
  const myRtrStatus = myApplications.length > 0 ? myApplications[0].rightToRent : 'not_started';
  const myComplianceClear = myApplications.length > 0 ? myApplications[0].complianceClear : false;
  const myRiskClear = myApplications.length > 0 ? myApplications[0].riskClear : false;
  const myGuarantorReplaced = myApplications.length > 0 ? myApplications[0].guarantorReplaced : false;
  const myTrustLevel = myApplications.length > 0 ? myApplications[0].profile.trustLevel : 0;
  const guarantorEligible = myTrustLevel >= 3 && myComplianceClear && myRiskClear;

  // RTR status config
  const rtrStatusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode; description: string }> = {
    not_started: {
      label: 'Not Started',
      color: '#94a3b8',
      bg: '#f1f5f9',
      icon: <Clock className="size-5 text-slate-400" />,
      description: 'Your Right to Rent check has not been initiated yet. Please complete your onboarding to begin the verification process.',
    },
    pending: {
      label: 'Pending',
      color: '#d97706',
      bg: '#fffbeb',
      icon: <Clock className="size-5 text-amber-500" />,
      description: 'Your Right to Rent verification is in progress. The Home Office database is being queried for your immigration status.',
    },
    verified: {
      label: 'Verified',
      color: '#10b981',
      bg: '#ecfdf5',
      icon: <CheckCircle2 className="size-5 text-emerald-500" />,
      description: 'Your Right to Rent status has been verified. You are cleared to rent property in the UK under the Immigration Act 2014.',
    },
    failed: {
      label: 'Failed',
      color: '#ef4444',
      bg: '#fef2f2',
      icon: <XCircle className="size-5 text-red-500" />,
      description: 'Your Right to Rent check could not be verified. Please contact support or submit additional documentation.',
    },
    expired: {
      label: 'Expired',
      color: '#6b7280',
      bg: '#f9fafb',
      icon: <AlertTriangle className="size-5 text-gray-500" />,
      description: 'Your Right to Rent certificate has expired. A repeat check is required to maintain compliance with the Immigration Act 2014.',
    },
  };

  const currentRtr = rtrStatusConfig[myRtrStatus] || rtrStatusConfig.not_started;

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome banner */}
      <motion.div variants={fadeInUp}>
        <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-start gap-4">
              <div className="size-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                <Building2 className="size-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-teal-900">My Property Dashboard</h3>
                <p className="text-sm text-teal-700 mt-1 leading-relaxed">
                  Track your property application, Right to Rent verification, compliance status, and guarantor eligibility — all in one place.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Application Status */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Application</p>
                  <p className="text-lg font-bold mt-1">
                    {myApplications.length > 0 ? (
                      <StatusBadge status={myApplications[0].status} />
                    ) : (
                      <span className="text-muted-foreground text-base">No application</span>
                    )}
                  </p>
                </div>
                <div className="size-10 rounded-lg bg-violet-50 flex items-center justify-center">
                  <FileCheck className="size-5 text-violet-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Right to Rent */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Right to Rent</p>
                  <div className="mt-1">
                    <Badge
                      className="font-medium"
                      style={{ backgroundColor: currentRtr.bg, color: currentRtr.color, borderColor: 'transparent' }}
                    >
                      {currentRtr.label}
                    </Badge>
                  </div>
                </div>
                <div className="size-10 rounded-lg bg-teal-50 flex items-center justify-center">
                  <ShieldCheck className="size-5 text-teal-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Compliance Clear */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Compliance</p>
                  <p className="text-lg font-bold mt-1">
                    {myApplications.length > 0 ? (
                      <span className={myComplianceClear ? 'text-emerald-600' : 'text-red-500'}>
                        {myComplianceClear ? 'Clear' : 'Not Clear'}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-base">Pending</span>
                    )}
                  </p>
                </div>
                <div className="size-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: myComplianceClear ? '#ecfdf5' : '#fef2f2' }}>
                  {myComplianceClear ? (
                    <CheckCircle2 className="size-5 text-emerald-600" />
                  ) : (
                    <XCircle className="size-5 text-red-500" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Risk Clear */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Risk</p>
                  <p className="text-lg font-bold mt-1">
                    {myApplications.length > 0 ? (
                      <span className={myRiskClear ? 'text-emerald-600' : 'text-red-500'}>
                        {myRiskClear ? 'Clear' : 'Not Clear'}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-base">Pending</span>
                    )}
                  </p>
                </div>
                <div className="size-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: myRiskClear ? '#ecfdf5' : '#fef2f2' }}>
                  {myRiskClear ? (
                    <CheckCircle2 className="size-5 text-emerald-600" />
                  ) : (
                    <XCircle className="size-5 text-red-500" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* My Applications Detail */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="size-5 text-teal-600" />
              My Application{myApplications.length !== 1 ? 's' : ''}
            </CardTitle>
            <CardDescription>
              Your property application details and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {myApplications.length > 0 ? (
              <div className="space-y-4">
                {myApplications.map((app) => {
                  const property = properties.find((p) => p.id === app.propertyId);
                  return (
                    <Card key={app.id} className="border shadow-none">
                      <CardContent className="p-4 md:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Application Info */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-sm">Application Status</h4>
                              <StatusBadge status={app.status} />
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <p className="text-xs text-muted-foreground">Type</p>
                                <Badge variant="outline" className="text-xs capitalize mt-0.5">
                                  {app.applicationType}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Submitted</p>
                                <p className="text-sm font-medium mt-0.5">{formatDate(app.submittedAt)}</p>
                              </div>
                              {app.monthlyAmount && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Monthly Amount</p>
                                  <p className="text-sm font-medium mt-0.5">&pound;{app.monthlyAmount.toLocaleString()}</p>
                                </div>
                              )}
                              {app.depositAmount && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Deposit</p>
                                  <p className="text-sm font-medium mt-0.5">&pound;{app.depositAmount.toLocaleString()}</p>
                                </div>
                              )}
                              {app.startDate && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Start Date</p>
                                  <p className="text-sm font-medium mt-0.5">{formatDate(app.startDate)}</p>
                                </div>
                              )}
                              {app.decidedAt && (
                                <div>
                                  <p className="text-xs text-muted-foreground">Decided</p>
                                  <p className="text-sm font-medium mt-0.5">{formatDate(app.decidedAt)}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Property Info */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Property</h4>
                              {property ? (
                                <div className="p-3 rounded-lg bg-muted/30 border space-y-2">
                                  <div className="flex items-start gap-2">
                                    <MapPin className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                                    <div>
                                      <p className="font-medium text-sm">{property.address}</p>
                                      <p className="text-xs text-muted-foreground">{property.city}, {property.postcode}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <PropertyTypeBadge type={property.propertyType} />
                                    {property.bedrooms && (
                                      <Badge variant="outline" className="text-xs">
                                        {property.bedrooms} bed{property.bedrooms > 1 ? 's' : ''}
                                      </Badge>
                                    )}
                                    <StatusBadge status={property.complianceStatus} />
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground">Property details not available</p>
                              )}
                            </div>

                            {/* Clearance indicators */}
                            <div className="grid grid-cols-3 gap-2">
                              <div className="text-center p-2 rounded-lg border">
                                <p className="text-[10px] text-muted-foreground mb-1">Compliance</p>
                                <YesNoIcon value={app.complianceClear} />
                              </div>
                              <div className="text-center p-2 rounded-lg border">
                                <p className="text-[10px] text-muted-foreground mb-1">Risk</p>
                                <YesNoIcon value={app.riskClear} />
                              </div>
                              <div className="text-center p-2 rounded-lg border">
                                <p className="text-[10px] text-muted-foreground mb-1">Right to Rent</p>
                                <StatusBadge status={app.rightToRent} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Building2 className="size-12 text-muted-foreground/40 mx-auto mb-3" />
                <p className="font-medium text-muted-foreground">No Property Applications Found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You haven&apos;t submitted any property applications yet. Complete your onboarding to get started.
                </p>
                <Button
                  className="mt-4 bg-teal-600 hover:bg-teal-700 text-white gap-2"
                  onClick={() => onNavigate?.('identity')}
                >
                  <Upload className="size-4" />
                  Start Onboarding
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Right to Rent & Guarantor Status Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Right to Rent Status */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-teal-600" />
                My Right to Rent Status
              </CardTitle>
              <CardDescription>
                Immigration Act 2014 — Section 22
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Large status indicator */}
              <div className="flex flex-col items-center gap-3 py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="size-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: currentRtr.bg }}
                >
                  {currentRtr.icon}
                </motion.div>
                <Badge
                  className="text-sm px-4 py-1.5 font-semibold"
                  style={{ backgroundColor: currentRtr.bg, color: currentRtr.color, borderColor: 'transparent' }}
                >
                  {currentRtr.label}
                </Badge>
              </div>

              <Separator />

              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentRtr.description}
              </p>

              {/* Certificate details if verified */}
              {myRtrStatus === 'verified' && myApplications.length > 0 && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <Award className="size-4" />
                    <p className="text-sm font-medium">Certificate Active</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-emerald-600">Status:</span>{' '}
                      <span className="font-medium text-emerald-800">Verified</span>
                    </div>
                    <div>
                      <span className="text-emerald-600">Monitoring:</span>{' '}
                      <span className="font-medium text-emerald-800">Active</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600">
                    <Bell className="size-3" />
                    <span>You will be notified before your certificate expires</span>
                  </div>
                </div>
              )}

              {/* Expiry warning if expired */}
              {myRtrStatus === 'expired' && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="size-4" />
                    <p className="text-sm font-medium">Action Required</p>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">
                    Your Right to Rent certificate has expired. A repeat check is required under the Immigration Act 2014. Please contact your letting agent or upload updated documents.
                  </p>
                </div>
              )}

              {/* Regulatory reference */}
              <div className="flex items-center gap-2 p-2 rounded-md bg-teal-50 text-teal-700 text-xs">
                <Lock className="size-4 shrink-0" />
                <span>Automated verification via Home Office database — your data is encrypted and secure</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* My Guarantor Status */}
        <motion.div variants={fadeInUp}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="size-5 text-teal-600" />
                My Guarantor Status
              </CardTitle>
              <CardDescription>
                Trust-based guarantor replacement eligibility
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current guarantor status */}
              <div className="flex flex-col items-center gap-3 py-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className={`size-16 rounded-full flex items-center justify-center ${
                    myGuarantorReplaced
                      ? 'bg-emerald-50'
                      : guarantorEligible
                        ? 'bg-amber-50'
                        : 'bg-gray-50'
                  }`}
                >
                  {myGuarantorReplaced ? (
                    <CheckCircle2 className="size-8 text-emerald-600" />
                  ) : guarantorEligible ? (
                    <RefreshCw className="size-8 text-amber-500" />
                  ) : (
                    <Clock className="size-8 text-gray-400" />
                  )}
                </motion.div>
                <Badge
                  className="text-sm px-4 py-1.5 font-semibold"
                  style={{
                    backgroundColor: myGuarantorReplaced ? '#ecfdf5' : guarantorEligible ? '#fffbeb' : '#f1f5f9',
                    color: myGuarantorReplaced ? '#10b981' : guarantorEligible ? '#d97706' : '#94a3b8',
                    borderColor: 'transparent',
                  }}
                >
                  {myGuarantorReplaced ? 'Guarantor Replaced' : guarantorEligible ? 'Eligible for Replacement' : 'Not Yet Eligible'}
                </Badge>
              </div>

              <Separator />

              {/* Status detail */}
              {myGuarantorReplaced ? (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 space-y-2">
                  <p className="text-sm font-medium text-emerald-800">
                    Guarantor Replacement Certificate Issued
                  </p>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Your trust credentials have been used in place of a traditional guarantor. This certificate is accepted by partner landlords and letting agents on the PropComply platform.
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                      Trust Level {myTrustLevel}
                    </Badge>
                    <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                      Compliance Clear
                    </Badge>
                    <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700">
                      Risk Clear
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    PropComply&apos;s Trust Ladder enables verified profiles to replace traditional guarantor requirements. Achieve Trust Level 3+ with clear compliance and risk checks to become eligible.
                  </p>
                  {/* Requirements checklist */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      {myTrustLevel >= 3 ? (
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="size-4 text-red-400 shrink-0" />
                      )}
                      <span className={myTrustLevel >= 3 ? 'text-emerald-700' : 'text-muted-foreground'}>
                        Trust Level 3+ (Current: {myTrustLevel})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {myComplianceClear ? (
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="size-4 text-red-400 shrink-0" />
                      )}
                      <span className={myComplianceClear ? 'text-emerald-700' : 'text-muted-foreground'}>
                        Compliance Clear
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      {myRiskClear ? (
                        <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="size-4 text-red-400 shrink-0" />
                      )}
                      <span className={myRiskClear ? 'text-emerald-700' : 'text-muted-foreground'}>
                        Risk Clear
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Info box */}
              <div className="p-3 rounded-lg bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100">
                <p className="text-xs font-semibold text-teal-800 mb-1">How It Works</p>
                <p className="text-xs text-teal-700 leading-relaxed">
                  When you reach Trust Level 3+ with clear compliance and risk checks, PropComply issues a Guarantor Replacement Certificate — accepted by partner landlords and letting agents, removing the need for a traditional guarantor.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Upload Documents CTA */}
      <motion.div variants={fadeInUp}>
        <Card className="border-dashed border-2 border-teal-200 bg-teal-50/30">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="size-12 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                <Upload className="size-6 text-teal-600" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h4 className="font-semibold text-sm">Upload Documents</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete your identity verification and upload required documents to progress your application.
                </p>
              </div>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white gap-2 shrink-0"
                onClick={() => onNavigate?.('identity')}
              >
                <ExternalLink className="size-4" />
                Go to Onboarding
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ===================== TENANT RTR READ-ONLY SUMMARY =====================

function TenantRightToRentSummary({
  allApplications,
  sessionEmail,
}: {
  allApplications: PropertyApplication[];
  sessionEmail: string;
}) {
  const myApps = allApplications.filter((a) => a.profile.email === sessionEmail);
  const myRtrStatus = myApps.length > 0 ? myApps[0].rightToRent : 'not_started';

  // Simulated RTR data based on status
  const rtrDetails: Record<string, {
    certificateToken: string | null;
    issuedAt: string | null;
    expiresAt: string | null;
    homeOfficeRef: string | null;
    monitoringActive: boolean;
  }> = {
    verified: {
      certificateToken: 'RTR-CERT-' + (myApps[0]?.id?.substring(0, 8) || '00000000').toUpperCase(),
      issuedAt: myApps[0]?.submittedAt || null,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      homeOfficeRef: 'HO-RTR-' + Date.now().toString(36).toUpperCase().substring(0, 8),
      monitoringActive: true,
    },
    pending: {
      certificateToken: null,
      issuedAt: null,
      expiresAt: null,
      homeOfficeRef: null,
      monitoringActive: false,
    },
    failed: {
      certificateToken: null,
      issuedAt: null,
      expiresAt: null,
      homeOfficeRef: 'HO-RTR-FAILED-' + Date.now().toString(36).toUpperCase().substring(0, 6),
      monitoringActive: false,
    },
    expired: {
      certificateToken: 'RTR-CERT-EXPIRED',
      issuedAt: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      homeOfficeRef: 'HO-RTR-' + Date.now().toString(36).toUpperCase().substring(0, 8),
      monitoringActive: false,
    },
    not_started: {
      certificateToken: null,
      issuedAt: null,
      expiresAt: null,
      homeOfficeRef: null,
      monitoringActive: false,
    },
  };

  const details = rtrDetails[myRtrStatus] || rtrDetails.not_started;

  // Status configuration
  const statusConfig: Record<string, { label: string; color: string; bg: string; description: string }> = {
    not_started: { label: 'Not Started', color: '#94a3b8', bg: '#f1f5f9', description: 'Your Right to Rent check has not been initiated yet.' },
    pending: { label: 'Verification In Progress', color: '#d97706', bg: '#fffbeb', description: 'Your documents are being verified against the Home Office database.' },
    verified: { label: 'Verified & Active', color: '#10b981', bg: '#ecfdf5', description: 'Your Right to Rent has been verified. Certificate is active and being monitored.' },
    failed: { label: 'Verification Failed', color: '#ef4444', bg: '#fef2f2', description: 'The verification check could not confirm your right to rent. Additional documentation may be required.' },
    expired: { label: 'Certificate Expired', color: '#6b7280', bg: '#f9fafb', description: 'Your Right to Rent certificate has expired. A repeat check is required.' },
  };

  const currentStatus = statusConfig[myRtrStatus] || statusConfig.not_started;

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Header Card */}
      <motion.div variants={fadeInUp}>
        <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                <ShieldCheck className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-teal-900">My Right to Rent Status</h3>
                <p className="text-sm text-teal-700">
                  Read-only view of your Right to Rent verification status
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Status Card */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5 text-teal-600" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Large status indicator */}
            <div className="flex flex-col items-center gap-4 py-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="size-20 rounded-full flex items-center justify-center"
                style={{ backgroundColor: currentStatus.bg }}
              >
                {myRtrStatus === 'verified' ? (
                  <CheckCircle2 className="size-10 text-emerald-600" />
                ) : myRtrStatus === 'pending' ? (
                  <Clock className="size-10 text-amber-500" />
                ) : myRtrStatus === 'failed' ? (
                  <XCircle className="size-10 text-red-500" />
                ) : myRtrStatus === 'expired' ? (
                  <AlertTriangle className="size-10 text-gray-500" />
                ) : (
                  <FileText className="size-10 text-slate-400" />
                )}
              </motion.div>
              <Badge
                className="text-base px-6 py-2 font-semibold"
                style={{ backgroundColor: currentStatus.bg, color: currentStatus.color, borderColor: 'transparent' }}
              >
                {currentStatus.label}
              </Badge>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                {currentStatus.description}
              </p>
            </div>

            <Separator />

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Certificate Details */}
              <Card className="border shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Award className="size-4 text-teal-600" />
                    Certificate Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Token</span>
                    <span className="font-mono text-xs">
                      {details.certificateToken || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Issued</span>
                    <span>{details.issuedAt ? formatDate(details.issuedAt) : '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expires</span>
                    <span className={myRtrStatus === 'expired' ? 'text-red-500 font-medium' : ''}>
                      {details.expiresAt ? formatDate(details.expiresAt) : '—'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Monitoring & Reference */}
              <Card className="border shadow-none">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Bell className="size-4 text-teal-600" />
                    Expiry Monitoring
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">HO Reference</span>
                    <span className="font-mono text-xs">{details.homeOfficeRef || '—'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Monitoring</span>
                    <Badge
                      className="text-xs"
                      style={{
                        backgroundColor: details.monitoringActive ? '#ecfdf5' : '#f1f5f9',
                        color: details.monitoringActive ? '#10b981' : '#94a3b8',
                        borderColor: 'transparent',
                      }}
                    >
                      {details.monitoringActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge status={myRtrStatus} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Regulatory Note */}
            <div className="p-4 rounded-lg bg-teal-50 border border-teal-100 space-y-2">
              <div className="flex items-center gap-2 text-teal-800">
                <Shield className="size-4" />
                <p className="text-sm font-medium">Regulatory Reference</p>
              </div>
              <p className="text-xs text-teal-700 leading-relaxed">
                Under the Immigration Act 2014, landlords must verify that all tenants aged 18+ have the right to rent
                in the UK. PropComply automates this check through Home Office integration. Non-compliance can result
                in civil penalties of up to &pound;3,000 per tenant.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* What Happens Next */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ArrowRight className="size-4 text-teal-600" />
              What Happens Next
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {myRtrStatus === 'verified' ? (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <CheckCircle2 className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-emerald-800">Continuous Monitoring</p>
                      <p className="text-xs text-emerald-700 mt-0.5">Your status is monitored 24/7 for changes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <Bell className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-emerald-800">Expiry Alerts</p>
                      <p className="text-xs text-emerald-700 mt-0.5">You&apos;ll be notified 90, 30, and 7 days before expiry</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <RefreshCw className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-emerald-800">Auto-Renewal</p>
                      <p className="text-xs text-emerald-700 mt-0.5">Repeat checks are triggered automatically as required</p>
                    </div>
                  </div>
                </>
              ) : myRtrStatus === 'pending' ? (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <FileText className="size-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Document Review</p>
                      <p className="text-xs text-amber-700 mt-0.5">Your documents are being processed and validated</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <ShieldCheck className="size-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Home Office Check</p>
                      <p className="text-xs text-amber-700 mt-0.5">Verification against Home Office immigration records</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                    <Award className="size-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">Certificate Issuance</p>
                      <p className="text-xs text-amber-700 mt-0.5">You&apos;ll receive your RTR certificate upon successful verification</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <Upload className="size-5 text-gray-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Upload Documents</p>
                      <p className="text-xs text-gray-500 mt-0.5">Complete onboarding to submit your identity documents</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <ShieldCheck className="size-5 text-gray-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Verification</p>
                      <p className="text-xs text-gray-500 mt-0.5">PropComply will verify your documents automatically</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <Award className="size-5 text-gray-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Get Certified</p>
                      <p className="text-xs text-gray-500 mt-0.5">Receive your Right to Rent certificate</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

// ===================== MAIN COMPONENT =====================

export default function PropertyIntelligence({ onNavigate }: PropertyIntelligenceProps = {}) {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const isTenant = userRole === 'tenant';

  const { data, isLoading, error } = useApi<PropertiesResponse>(
    'properties',
    '/api/properties',
    true,
    {
      userId: session?.user?.id || '',
      role: session?.user?.role || '',
    }
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

  // ===================== TENANT VIEW =====================
  if (isTenant) {
    return (
      <motion.div
        className="space-y-6 p-4 md:p-6"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        <Tabs defaultValue="my-application" className="w-full">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="my-application" className="gap-2">
              <Building2 className="size-4" />
              My Application
            </TabsTrigger>
            <TabsTrigger value="right-to-rent" className="gap-2">
              <ShieldCheck className="size-4" />
              Right to Rent
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-application" className="mt-6">
            <TenantPropertyView
              properties={properties}
              allApplications={allApplications}
              sessionEmail={session?.user?.email || ''}
              onNavigate={onNavigate}
            />
          </TabsContent>

          <TabsContent value="right-to-rent" className="mt-6">
            <TenantRightToRentSummary
              allApplications={allApplications}
              sessionEmail={session?.user?.email || ''}
            />
          </TabsContent>
        </Tabs>
      </motion.div>
    );
  }

  // ===================== NON-TENANT (ADMIN/STAFF) VIEW =====================
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
                  &pound;3,000 per tenant. PropComply automates this check through Home Office integration.
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
