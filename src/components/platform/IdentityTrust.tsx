'use client';

import { useState, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  User,
  FileText,
  ScanFace,
  TrendingUp,
  Building,
  Landmark,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Play,
  ChevronRight,
  CreditCard,
  Globe,
  Users,
  UserPlus,
  ArrowRight,
  Search,
  X,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Eye,
  AlertTriangle,
  ClipboardCheck,
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
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useApi } from '@/hooks/use-api';
import { TRUST_LEVELS, formatDate, getStatusStyle } from '@/lib/platform-data';
import { getDataScope } from '@/lib/rbac';
import VerifyMeOnboarding from '@/components/platform/VerifyMeOnboarding';

// Props
interface IdentityTrustProps {
  searchQuery?: string;
  onClearSearch?: () => void;
}

// Types
interface Credential {
  id: string;
  credentialType: string;
  verificationStatus: string;
  validTo: string | null;
}

interface Verification {
  id: string;
  verificationType: string;
  status: string;
  confidence: number;
  completedAt: string | null;
}

interface IdentityProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  trustLevel: number;
  trustScore: number;
  status: string;
  nationality: string;
  credentials: Credential[];
  verifications: Verification[];
}

interface IdentitiesResponse {
  identities: IdentityProfile[];
  total: number;
}

// Icon mapping for trust levels
const TRUST_ICONS: Record<string, React.ReactNode> = {
  User: <User className="size-5" />,
  FileText: <FileText className="size-5" />,
  ScanFace: <ScanFace className="size-5" />,
  TrendingUp: <TrendingUp className="size-5" />,
  Building: <Building className="size-5" />,
  Landmark: <Landmark className="size-5" />,
};

// Verification status icons
function VerificationStatusIcon({ status }: { status: string }) {
  switch (status.toLowerCase()) {
    case 'passed':
    case 'completed':
    case 'verified':
      return <CheckCircle2 className="size-4 text-emerald-500" />;
    case 'pending':
      return <Clock className="size-4 text-amber-500" />;
    case 'failed':
    case 'rejected':
      return <XCircle className="size-4 text-red-500" />;
    case 'in_progress':
      return <AlertCircle className="size-4 text-cyan-500" />;
    default:
      return <Clock className="size-4 text-slate-400" />;
  }
}

// Credential type icon
function CredentialTypeIcon({ type }: { type: string }) {
  switch (type.toLowerCase()) {
    case 'passport':
      return <Globe className="size-4 text-blue-500" />;
    case 'national_id':
      return <CreditCard className="size-4 text-violet-500" />;
    case 'biometric':
      return <ScanFace className="size-4 text-emerald-500" />;
    case 'banking':
      return <Building className="size-4 text-cyan-500" />;
    case 'employer':
      return <FileText className="size-4 text-amber-500" />;
    case 'visa':
      return <Globe className="size-4 text-orange-500" />;
    case 'government':
      return <Landmark className="size-4 text-indigo-500" />;
    default:
      return <CreditCard className="size-4 text-slate-400" />;
  }
}

// Verification type display name
function getVerificationTypeName(type: string): string {
  const names: Record<string, string> = {
    document: 'Document Verification',
    biometric_face: 'Biometric Face Match',
    liveness: 'Liveness Detection',
    open_banking: 'Open Banking',
    income: 'Income Verification',
    employer: 'Employer Verification',
    government: 'Government Database',
  };
  return names[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Credential type display name
function getCredentialTypeName(type: string): string {
  const names: Record<string, string> = {
    passport: 'Passport',
    national_id: 'National ID',
    biometric: 'Biometric',
    banking: 'Banking',
    employer: 'Employer',
    visa: 'Visa',
    government: 'Government',
    residence_permit: 'Residence Permit',
    driving_licence: 'Driving Licence',
  };
  return names[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// Animation variants
const ladderStepVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.12, duration: 0.4, ease: 'easeOut' },
  }),
};

const panelVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

// ─── Tenant View Component ──────────────────────────────────────────────────

function TenantIdentityView({
  profile,
  onStartOnboarding,
}: {
  profile: IdentityProfile | null;
  onStartOnboarding: () => void;
}) {
  if (!profile) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <User className="mx-auto size-10 text-muted-foreground/40" />
            <h3 className="mt-3 text-sm font-medium text-muted-foreground">No Identity Profile Found</h3>
            <p className="mt-1 text-xs text-muted-foreground/70">
              You don&apos;t have an identity profile yet. Start the onboarding process to create one.
            </p>
            <Button
              size="sm"
              className="mt-4 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={onStartOnboarding}
            >
              <UserPlus className="size-3.5" />
              Start Onboarding
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const trustLevelData = TRUST_LEVELS[profile.trustLevel] ?? TRUST_LEVELS[0];
  const statusStyle = getStatusStyle(profile.status);

  return (
    <div className="space-y-6">
      {/* My Identity Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">My Identity Profile</CardTitle>
              <CardDescription>Your personal identity verification status</CardDescription>
            </div>
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                backgroundColor: statusStyle.bgColor,
                color: statusStyle.color,
                borderColor: statusStyle.color,
              }}
            >
              {profile.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xl font-bold">
              {profile.firstName[0]}{profile.lastName[0]}
            </div>
            {/* Info */}
            <div className="flex-1 space-y-4 min-w-0">
              <div>
                <h3 className="text-lg font-semibold">{profile.firstName} {profile.lastName}</h3>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                {profile.nationality && (
                  <p className="text-sm text-muted-foreground">Nationality: {profile.nationality}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Badge
                  variant="outline"
                  className="text-xs px-2 py-0.5"
                  style={{
                    backgroundColor: trustLevelData.bgColor,
                    color: trustLevelData.color,
                    borderColor: trustLevelData.color,
                  }}
                >
                  L{profile.trustLevel} {trustLevelData.name}
                </Badge>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Trust Score:</span>
                  <Progress value={profile.trustScore} className="h-2 w-24" />
                  <span className="text-xs font-medium">{profile.trustScore}</span>
                </div>
              </div>
            </div>
            {/* Action */}
            <div className="shrink-0">
              {profile.status === 'pending' || profile.status === 'in_progress' ? (
                <Button
                  size="sm"
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={onStartOnboarding}
                >
                  <UserPlus className="size-3.5" />
                  Continue Onboarding
                  <ArrowRight className="size-3.5" />
                </Button>
              ) : profile.status === 'verified' ? (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 gap-1">
                  <CheckCircle2 className="size-3.5" />
                  Verified
                </Badge>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={onStartOnboarding}
                >
                  <UserPlus className="size-3.5" />
                  Start Onboarding
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Ladder for tenant */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Trust Ladder</CardTitle>
          <CardDescription>Progress through identity verification levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {TRUST_LEVELS.map((level, index) => {
              const isSelected = profile.trustLevel === level.level;
              const isAchieved = profile.trustLevel >= level.level;
              const isHighlighted = isSelected || isAchieved;

              return (
                <motion.div
                  key={level.level}
                  custom={index}
                  variants={ladderStepVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                          isHighlighted
                            ? 'border-emerald-500 shadow-md'
                            : 'border-muted-foreground/20'
                        }`}
                        style={{
                          backgroundColor: isHighlighted ? level.bgColor : 'transparent',
                        }}
                      >
                        <span
                          className="text-xs font-bold"
                          style={{ color: isHighlighted ? level.color : '#94a3b8' }}
                        >
                          {level.level}
                        </span>
                      </div>
                      {index < TRUST_LEVELS.length - 1 && (
                        <div
                          className={`h-6 w-0.5 transition-colors duration-300 ${
                            isAchieved && profile.trustLevel !== level.level
                              ? 'bg-emerald-300'
                              : 'bg-muted-foreground/15'
                          }`}
                        />
                      )}
                    </div>
                    <div className={`min-w-0 pb-4 ${index === TRUST_LEVELS.length - 1 ? 'pb-0' : ''}`}>
                      <div className="flex items-center gap-2">
                        <span style={{ color: isHighlighted ? level.color : '#94a3b8' }}>
                          {TRUST_ICONS[level.icon] ?? <User className="size-4" />}
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            isHighlighted ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {level.name}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                        {level.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Verification records & Credentials for tenant */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Verification Records</CardTitle>
                <CardDescription>Your verification workflow</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {profile.verifications.length} checks
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {profile.verifications.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No verification records yet
                  </div>
                )}
                {profile.verifications.map((v) => {
                  const vStatusStyle = getStatusStyle(v.status);
                  return (
                    <div
                      key={v.id}
                      className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30"
                    >
                      <div className="mt-0.5">
                        <VerificationStatusIcon status={v.status} />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {getVerificationTypeName(v.verificationType)}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                            style={{
                              backgroundColor: vStatusStyle.bgColor,
                              color: vStatusStyle.color,
                              borderColor: vStatusStyle.color,
                            }}
                          >
                            {v.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Confidence:</span>
                          <Progress value={v.confidence} className="h-1.5 w-20" />
                          <span className="text-xs font-medium">{v.confidence}%</span>
                        </div>
                        {v.completedAt && (
                          <div className="text-xs text-muted-foreground">
                            Completed: {formatDate(v.completedAt)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Credentials</CardTitle>
                <CardDescription>Identity credentials & documents</CardDescription>
              </div>
              <Badge variant="outline" className="text-xs">
                {profile.credentials.length} items
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-96">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {profile.credentials.length === 0 && (
                  <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                    No credentials yet
                  </div>
                )}
                {profile.credentials.map((cred) => {
                  const cStatusStyle = getStatusStyle(cred.verificationStatus);
                  return (
                    <div key={cred.id} className="rounded-lg border p-3 transition-colors hover:bg-muted/30">
                      <div className="flex items-start gap-2">
                        <CredentialTypeIcon type={cred.credentialType} />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">
                            {getCredentialTypeName(cred.credentialType)}
                          </div>
                          <Badge
                            variant="outline"
                            className="mt-1 text-[10px] px-1.5 py-0"
                            style={{
                              backgroundColor: cStatusStyle.bgColor,
                              color: cStatusStyle.color,
                              borderColor: cStatusStyle.color,
                            }}
                          >
                            {cred.verificationStatus}
                          </Badge>
                          {cred.validTo && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              Expires: {formatDate(cred.validTo)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ─── Verifier Review Actions Component ──────────────────────────────────────

function VerifierReviewActions({
  verification,
  profileId,
  onAction,
}: {
  verification: Verification;
  profileId: string;
  onAction: (profileId: string, verificationId: string, action: 'approved' | 'rejected' | 'more_evidence') => void;
}) {
  if (verification.status !== 'pending' && verification.status !== 'in_progress') {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      <Button
        size="sm"
        className="h-6 text-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-2"
        onClick={(e) => {
          e.stopPropagation();
          onAction(profileId, verification.id, 'approved');
        }}
      >
        <ThumbsUp className="mr-0.5 size-2.5" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="destructive"
        className="h-6 text-[10px] px-2"
        onClick={(e) => {
          e.stopPropagation();
          onAction(profileId, verification.id, 'rejected');
        }}
      >
        <ThumbsDown className="mr-0.5 size-2.5" />
        Reject
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="h-6 text-[10px] px-2"
        onClick={(e) => {
          e.stopPropagation();
          onAction(profileId, verification.id, 'more_evidence');
        }}
      >
        <HelpCircle className="mr-0.5 size-2.5" />
        Request More Evidence
      </Button>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function IdentityTrust({ searchQuery = '', onClearSearch }: IdentityTrustProps) {
  const { data: session } = useSession();
  const userRole = (session?.user?.role as string) || 'tenant';
  const dataScope = getDataScope(userRole as 'platform_admin' | 'compliance_officer' | 'property_manager' | 'identity_verifier' | 'risk_analyst' | 'partner_integration_manager' | 'partner_user' | 'tenant');
  const isTenant = dataScope === 'own';
  const isVerifier = userRole === 'identity_verifier';

  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('profiles');
  const { data: identitiesData, isLoading } = useApi<IdentitiesResponse>('identities', '/api/identities', true, {
    userId: session?.user?.id || '',
    role: session?.user?.role || '',
  });

  const allIdentities = identitiesData?.identities ?? [];

  // Filter identities based on role scope
  const scopedIdentities = useMemo(() => {
    if (isTenant) {
      // Tenant should only see their own profile — match by user email or id
      const userId = session?.user?.id || '';
      const userEmail = session?.user?.email || '';
      return allIdentities.filter(
        (p) => p.id === userId || p.email === userEmail
      );
    }
    return allIdentities;
  }, [allIdentities, isTenant, session?.user?.id, session?.user?.email]);

  // Apply search filtering on the profiles tab
  const filteredIdentities = useMemo(() => {
    if (!searchQuery.trim() || activeTab !== 'profiles') return scopedIdentities;
    const q = searchQuery.toLowerCase();
    return scopedIdentities.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q) ||
        (p.nationality && p.nationality.toLowerCase().includes(q))
    );
  }, [scopedIdentities, searchQuery, activeTab]);

  const selectedProfile = scopedIdentities.find((p) => p.id === selectedProfileId) ?? null;

  // Verifier: compute pending reviews
  const pendingReviews = useMemo(() => {
    if (!isVerifier) return [];
    return scopedIdentities.filter((p) =>
      p.verifications.some((v) => v.status === 'pending' || v.status === 'in_progress')
    );
  }, [scopedIdentities, isVerifier]);

  // Handle verifier actions (local state update — will be connected to API)
  const handleVerifierAction = (_profileId: string, _verificationId: string, _action: 'approved' | 'rejected' | 'more_evidence') => {
    // In production this would call an API to update the verification status.
    // For now, the action buttons provide visual feedback of the review workflow.
  };

  // Handle onboarding complete — switch back to profiles tab
  const handleOnboardingComplete = () => {
    setActiveTab('profiles');
  };

  // ─── Tenant View ─────────────────────────────────────────────────────────
  if (isTenant) {
    const myProfile = scopedIdentities[0] ?? null;
    return (
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-2">
            <TabsTrigger value="profiles" className="gap-1.5">
              <User className="size-3.5" />
              My Profile
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="gap-1.5">
              <UserPlus className="size-3.5" />
              Onboarding
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiles">
            <TenantIdentityView
              profile={myProfile}
              onStartOnboarding={() => setActiveTab('onboarding')}
            />
          </TabsContent>

          <TabsContent value="onboarding">
            <VerifyMeOnboarding onComplete={handleOnboardingComplete} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // ─── Non-Tenant Views (Admin, Verifier, etc.) ────────────────────────────

  return (
    <div className="space-y-6">
      {/* Tabs: Profiles | Onboarding */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-2">
          <TabsTrigger value="profiles" className="gap-1.5">
            <Users className="size-3.5" />
            Profiles
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="gap-1.5">
            <UserPlus className="size-3.5" />
            Onboarding
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles">
          {/* Search Info Banner */}
          {searchQuery.trim() && activeTab === 'profiles' && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3"
            >
              <Search className="size-4 text-emerald-600 shrink-0" />
              <span className="text-sm text-emerald-800">
                Showing <strong>{filteredIdentities.length}</strong> result{filteredIdentities.length !== 1 ? 's' : ''} for &ldquo;{searchQuery}&rdquo;
              </span>
              {onClearSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto h-6 gap-1 text-xs text-emerald-700 hover:bg-emerald-100"
                  onClick={onClearSearch}
                >
                  <X className="size-3" />
                  Clear
                </Button>
              )}
            </motion.div>
          )}

          {/* Identity Verifier: Pending Reviews Section */}
          {isVerifier && pendingReviews.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4"
            >
              <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-amber-100">
                        <ClipboardCheck className="size-4 text-amber-700" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Pending Reviews</CardTitle>
                        <CardDescription>
                          {pendingReviews.length} profile{pendingReviews.length !== 1 ? 's' : ''} awaiting verification review
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                      {pendingReviews.length} pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {pendingReviews.map((profile) => {
                      const pendingVerifications = profile.verifications.filter(
                        (v) => v.status === 'pending' || v.status === 'in_progress'
                      );
                      const trustLevelData = TRUST_LEVELS[profile.trustLevel] ?? TRUST_LEVELS[0];
                      return (
                        <div
                          key={profile.id}
                          className="flex items-center justify-between rounded-lg border border-amber-200 bg-white p-3 cursor-pointer hover:bg-amber-50/50 transition-colors"
                          onClick={() => setSelectedProfileId(profile.id)}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-700 text-xs font-bold shrink-0">
                              {profile.firstName[0]}{profile.lastName[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">
                                {profile.firstName} {profile.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{profile.email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0"
                              style={{
                                backgroundColor: trustLevelData.bgColor,
                                color: trustLevelData.color,
                                borderColor: trustLevelData.color,
                              }}
                            >
                              L{profile.trustLevel}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
                              {pendingVerifications.length} check{pendingVerifications.length !== 1 ? 's' : ''}
                            </Badge>
                            <ChevronRight className="size-4 text-amber-500" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            {/* Trust Ladder Visualization */}
            <motion.div
              initial="hidden"
              animate="visible"
              className="xl:col-span-3"
            >
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="text-base">Trust Ladder</CardTitle>
                  <CardDescription>6-level identity verification framework</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {TRUST_LEVELS.map((level, index) => {
                      const isSelected = selectedProfile?.trustLevel === level.level;
                      const isAchieved = selectedProfile ? selectedProfile.trustLevel >= level.level : false;
                      const isHighlighted = isSelected || (selectedProfile && isAchieved);

                      return (
                        <motion.div
                          key={level.level}
                          custom={index}
                          variants={ladderStepVariants}
                          initial="hidden"
                          animate="visible"
                        >
                          <div className="flex items-start gap-3">
                            {/* Vertical connector line */}
                            <div className="flex flex-col items-center">
                              <div
                                className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                                  isHighlighted
                                    ? 'border-emerald-500 shadow-md'
                                    : 'border-muted-foreground/20'
                                }`}
                                style={{
                                  backgroundColor: isHighlighted ? level.bgColor : 'transparent',
                                }}
                              >
                                <span
                                  className="text-sm font-bold"
                                  style={{ color: isHighlighted ? level.color : '#94a3b8' }}
                                >
                                  {level.level}
                                </span>
                              </div>
                              {index < TRUST_LEVELS.length - 1 && (
                                <div
                                  className={`h-8 w-0.5 transition-colors duration-300 ${
                                    isAchieved && selectedProfile?.trustLevel !== level.level
                                      ? 'bg-emerald-300'
                                      : 'bg-muted-foreground/15'
                                  }`}
                                />
                              )}
                            </div>

                            {/* Level details */}
                            <div className={`min-w-0 pb-6 ${index === TRUST_LEVELS.length - 1 ? 'pb-0' : ''}`}>
                              <div className="flex items-center gap-2">
                                <span style={{ color: isHighlighted ? level.color : '#94a3b8' }}>
                                  {TRUST_ICONS[level.icon] ?? <User className="size-4" />}
                                </span>
                                <span
                                  className={`text-sm font-semibold ${
                                    isHighlighted ? 'text-foreground' : 'text-muted-foreground'
                                  }`}
                                >
                                  {level.name}
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                                {level.description}
                              </p>
                              {isSelected && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="mt-1"
                                >
                                  <Badge
                                    className="text-[10px] px-1.5 py-0"
                                    style={{
                                      backgroundColor: level.bgColor,
                                      color: level.color,
                                      borderColor: level.color,
                                    }}
                                  >
                                    Current Level
                                  </Badge>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Right section: Table + Details */}
            <div className="space-y-6 xl:col-span-9">
              {/* Identity Profiles Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Identity Profiles</CardTitle>
                      <CardDescription>
                        {isLoading ? 'Loading...' : `${filteredIdentities.length} profiles ${searchQuery.trim() ? 'matching' : 'registered'}`}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        <User className="mr-1 size-3" />
                        {filteredIdentities.length}
                      </Badge>
                      <Button
                        size="sm"
                        className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => setActiveTab('onboarding')}
                      >
                        <UserPlus className="size-3.5" />
                        <span className="hidden sm:inline">New Onboarding</span>
                        <span className="sm:hidden">Onboard</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-96">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Trust Level</TableHead>
                          <TableHead>Trust Score</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="hidden md:table-cell">Nationality</TableHead>
                          <TableHead className="w-8"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading && (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                              Loading identities...
                            </TableCell>
                          </TableRow>
                        )}
                        {!isLoading && filteredIdentities.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                              {searchQuery.trim() ? 'No profiles match your search' : 'No identities found'}
                            </TableCell>
                          </TableRow>
                        )}
                        {filteredIdentities.map((profile) => {
                          const trustLevelData = TRUST_LEVELS[profile.trustLevel] ?? TRUST_LEVELS[0];
                          const pStatusStyle = getStatusStyle(profile.status);
                          const isSelected = selectedProfileId === profile.id;

                          return (
                            <TableRow
                              key={profile.id}
                              className={`cursor-pointer transition-colors ${
                                isSelected ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                              }`}
                              onClick={() => setSelectedProfileId(isSelected ? null : profile.id)}
                            >
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {profile.firstName} {profile.lastName}
                                  {profile.status === 'verified' && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          className="inline-flex items-center gap-1 rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 hover:bg-teal-100 transition-colors border border-teal-200"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveTab('onboarding');
                                          }}
                                        >
                                          View Onboarding
                                          <ArrowRight className="size-3" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>View the VerifyMe onboarding flow</TooltipContent>
                                    </Tooltip>
                                  )}
                                  {profile.status === 'pending' && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 hover:bg-amber-100 transition-colors border border-amber-200"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveTab('onboarding');
                                          }}
                                        >
                                          Start Onboarding
                                          <ArrowRight className="size-3" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>Continue to VerifyMe onboarding flow</TooltipContent>
                                    </Tooltip>
                                  )}
                                  {profile.status === 'in_progress' && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          className="inline-flex items-center gap-1 rounded-md bg-cyan-50 px-1.5 py-0.5 text-[10px] font-medium text-cyan-700 hover:bg-cyan-100 transition-colors border border-cyan-200"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setActiveTab('onboarding');
                                          }}
                                        >
                                          Continue Onboarding
                                          <ArrowRight className="size-3" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>Continue the VerifyMe onboarding process</TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {profile.email}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0"
                                  style={{
                                    backgroundColor: trustLevelData.bgColor,
                                    color: trustLevelData.color,
                                    borderColor: trustLevelData.color,
                                  }}
                                >
                                  L{profile.trustLevel} {trustLevelData.name}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Progress value={profile.trustScore} className="h-1.5 w-16" />
                                  <span className="text-xs text-muted-foreground">{profile.trustScore}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1.5 py-0"
                                  style={{
                                    backgroundColor: pStatusStyle.bgColor,
                                    color: pStatusStyle.color,
                                    borderColor: pStatusStyle.color,
                                  }}
                                >
                                  {profile.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                                {profile.nationality || '—'}
                              </TableCell>
                              <TableCell>
                                <ChevronRight
                                  className={`size-4 text-muted-foreground transition-transform ${
                                    isSelected ? 'rotate-90' : ''
                                  }`}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Selected Profile Details */}
              <AnimatePresence mode="wait">
                {selectedProfile && (
                  <motion.div
                    key={selectedProfile.id}
                    variants={panelVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="grid grid-cols-1 gap-6 lg:grid-cols-2"
                  >
                    {/* Verification Workflow Panel */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">Verification Records</CardTitle>
                            <CardDescription>
                              {selectedProfile.firstName}&apos;s verification workflow
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {selectedProfile.verifications.length} checks
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="max-h-96">
                          <div className="space-y-3">
                            {selectedProfile.verifications.length === 0 && (
                              <div className="py-8 text-center text-sm text-muted-foreground">
                                No verification records yet
                              </div>
                            )}
                            {selectedProfile.verifications.map((v) => {
                              const vStatusStyle = getStatusStyle(v.status);
                              const isPendingOrInProgress = v.status === 'pending' || v.status === 'in_progress';
                              return (
                                <div
                                  key={v.id}
                                  className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30"
                                >
                                  <div className="mt-0.5">
                                    <VerificationStatusIcon status={v.status} />
                                  </div>
                                  <div className="min-w-0 flex-1 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm font-medium">
                                        {getVerificationTypeName(v.verificationType)}
                                      </span>
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] px-1.5 py-0"
                                        style={{
                                          backgroundColor: vStatusStyle.bgColor,
                                          color: vStatusStyle.color,
                                          borderColor: vStatusStyle.color,
                                        }}
                                      >
                                        {v.status}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground">Confidence:</span>
                                      <Progress value={v.confidence} className="h-1.5 w-20" />
                                      <span className="text-xs font-medium">{v.confidence}%</span>
                                    </div>
                                    {v.completedAt && (
                                      <div className="text-xs text-muted-foreground">
                                        Completed: {formatDate(v.completedAt)}
                                      </div>
                                    )}
                                    {/* Non-verifier: show Start Verification button */}
                                    {!isVerifier && isPendingOrInProgress && (
                                      <Button size="sm" variant="outline" className="mt-1 h-7 text-xs">
                                        <Play className="mr-1 size-3" />
                                        Start Verification
                                      </Button>
                                    )}
                                    {/* Verifier: show review action buttons prominently */}
                                    {isVerifier && isPendingOrInProgress && (
                                      <VerifierReviewActions
                                        verification={v}
                                        profileId={selectedProfile.id}
                                        onAction={handleVerifierAction}
                                      />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    {/* Credential Cards */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base">Credentials</CardTitle>
                            <CardDescription>
                              Identity credentials & documents
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {selectedProfile.credentials.length} items
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="max-h-96">
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {selectedProfile.credentials.length === 0 && (
                              <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                                No credentials yet
                              </div>
                            )}
                            {selectedProfile.credentials.map((cred) => {
                              const cStatusStyle = getStatusStyle(cred.verificationStatus);
                              return (
                                <motion.div
                                  key={cred.id}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <div className="rounded-lg border p-3 transition-colors hover:bg-muted/30">
                                    <div className="flex items-start gap-2">
                                      <CredentialTypeIcon type={cred.credentialType} />
                                      <div className="min-w-0 flex-1">
                                        <div className="text-sm font-medium truncate">
                                          {getCredentialTypeName(cred.credentialType)}
                                        </div>
                                        <Badge
                                          variant="outline"
                                          className="mt-1 text-[10px] px-1.5 py-0"
                                          style={{
                                            backgroundColor: cStatusStyle.bgColor,
                                            color: cStatusStyle.color,
                                            borderColor: cStatusStyle.color,
                                          }}
                                        >
                                          {cred.verificationStatus}
                                        </Badge>
                                        {cred.validTo && (
                                          <div className="mt-1 text-xs text-muted-foreground">
                                            Expires: {formatDate(cred.validTo)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Empty state when no profile selected */}
              {!selectedProfile && (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <ShieldCheck className="mx-auto size-10 text-muted-foreground/40" />
                      <h3 className="mt-3 text-sm font-medium text-muted-foreground">Select a Profile</h3>
                      <p className="mt-1 text-xs text-muted-foreground/70">
                        Click on an identity profile above to view verification details and credentials
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-4 gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => setActiveTab('onboarding')}
                      >
                        <UserPlus className="size-3.5" />
                        Start New Onboarding
                        <ArrowRight className="size-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="onboarding">
          <VerifyMeOnboarding onComplete={handleOnboardingComplete} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
