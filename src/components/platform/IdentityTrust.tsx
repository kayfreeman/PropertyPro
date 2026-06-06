'use client';

import { useState } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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

export default function IdentityTrust() {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const { data: identitiesData, isLoading } = useApi<IdentitiesResponse>('identities', '/api/identities');

  const identities = identitiesData?.identities ?? [];
  const selectedProfile = identities.find((p) => p.id === selectedProfileId) ?? null;

  return (
    <div className="space-y-6">
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
                    {isLoading ? 'Loading...' : `${identities.length} profiles registered`}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  <User className="mr-1 size-3" />
                  {identities.length}
                </Badge>
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
                    {!isLoading && identities.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No identities found
                        </TableCell>
                      </TableRow>
                    )}
                    {identities.map((profile) => {
                      const trustLevelData = TRUST_LEVELS[profile.trustLevel] ?? TRUST_LEVELS[0];
                      const statusStyle = getStatusStyle(profile.status);
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
                            {profile.firstName} {profile.lastName}
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
                                backgroundColor: statusStyle.bgColor,
                                color: statusStyle.color,
                                borderColor: statusStyle.color,
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
                    <ScrollArea className="max-h-72">
                      <div className="space-y-3">
                        {selectedProfile.verifications.length === 0 && (
                          <div className="py-8 text-center text-sm text-muted-foreground">
                            No verification records yet
                          </div>
                        )}
                        {selectedProfile.verifications.map((v) => {
                          const statusStyle = getStatusStyle(v.status);
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
                                      backgroundColor: statusStyle.bgColor,
                                      color: statusStyle.color,
                                      borderColor: statusStyle.color,
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
                                {(v.status === 'pending' || v.status === 'in_progress') && (
                                  <Button size="sm" variant="outline" className="mt-1 h-7 text-xs">
                                    <Play className="mr-1 size-3" />
                                    Start Verification
                                  </Button>
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
                    <ScrollArea className="max-h-72">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {selectedProfile.credentials.length === 0 && (
                          <div className="col-span-full py-8 text-center text-sm text-muted-foreground">
                            No credentials yet
                          </div>
                        )}
                        {selectedProfile.credentials.map((cred) => {
                          const statusStyle = getStatusStyle(cred.verificationStatus);
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
                                        backgroundColor: statusStyle.bgColor,
                                        color: statusStyle.color,
                                        borderColor: statusStyle.color,
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
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
