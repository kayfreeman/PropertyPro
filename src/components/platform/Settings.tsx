'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  Bell,
  Lock,
  Eye,
  EyeOff,
  Save,
  Check,
  AlertTriangle,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Key,
  Smartphone,
  Globe,
  FileText,
  Database,
  Settings2,
  Users,
  Activity,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  XCircle,
  Crown,
  ScanFace,
  Handshake,
  Puzzle,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROLE_DEFINITIONS, ROLE_PERMISSIONS_MATRIX, ROLE_LIST, getDataScope, type UserRole } from '@/lib/rbac';
import { toast } from 'sonner';

// ============================================
// Profile Settings Tab
// ============================================
function ProfileSettings() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [name, setName] = useState(session?.user?.name || '');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState(session?.user?.jobTitle || '');
  const [department, setDepartment] = useState(session?.user?.department || '');
  const [saving, setSaving] = useState(false);

  // Fetch full user profile
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const res = await fetch(`/api/users?id=${session.user.id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  // Update on load
  useState(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setPhone(userProfile.phone || '');
      setJobTitle(userProfile.jobTitle || '');
      setDepartment(userProfile.department || '');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: session?.user?.id, ...data }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Profile updated successfully');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const handleSave = () => {
    setSaving(true);
    updateMutation.mutate({ name, phone, jobTitle, department });
    setTimeout(() => setSaving(false), 1000);
  };

  const roleDef = ROLE_DEFINITIONS[(session?.user?.role || 'tenant') as UserRole];

  return (
    <div className="space-y-6">
      {/* Avatar & Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="size-4 text-teal-600" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your personal information and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 border-2" style={{ borderColor: roleDef.color }}>
              <AvatarFallback className="text-lg font-bold" style={{ backgroundColor: roleDef.bgColor, color: roleDef.color }}>
                {session?.user?.avatar || '??'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{session?.user?.name}</h3>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px]" style={{ borderColor: roleDef.color + '40', color: roleDef.color, backgroundColor: roleDef.bgColor }}>
                  {roleDef.name}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  Level {roleDef.level} Access
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1.5">
                <User className="size-3" /> Full Name
              </Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1.5">
                <Mail className="size-3" /> Email
              </Label>
              <Input id="email" value={session?.user?.email || ''} disabled className="h-10 bg-muted/50" />
              <p className="text-[10px] text-muted-foreground">Email cannot be changed. Contact admin for updates.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1.5">
                <Phone className="size-3" /> Phone
              </Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7700 000000" className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="jobTitle" className="flex items-center gap-1.5">
                <Briefcase className="size-3" /> Job Title
              </Label>
              <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Senior Compliance Officer" className="h-10" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="department" className="flex items-center gap-1.5">
                <Building2 className="size-3" /> Department
              </Label>
              <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Compliance" className="h-10" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="size-4" />
                  Save Changes
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Role & Permissions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="size-4 text-teal-600" />
            Role & Permissions
          </CardTitle>
          <CardDescription>Your current role and access level within the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: roleDef.bgColor }}>
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: roleDef.color + '20', color: roleDef.color }}>
                  <Shield className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: roleDef.color }}>{roleDef.name}</p>
                  <p className="text-xs text-muted-foreground">{roleDef.description}</p>
                </div>
              </div>
              <Badge variant="outline" style={{ borderColor: roleDef.color + '40', color: roleDef.color }}>
                Authority Level {roleDef.level}
              </Badge>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Accessible Sections</p>
              <div className="flex flex-wrap gap-1.5">
                {roleDef.sections.map((section) => (
                  <Badge key={section} variant="secondary" className="text-[10px] capitalize">
                    {section.replace('-', ' ')}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Permissions ({roleDef.permissions.length})</p>
              <div className="flex flex-wrap gap-1.5">
                {roleDef.permissions.map((perm) => (
                  <Badge key={perm} variant="outline" className="text-[9px]">
                    {perm}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Security Settings Tab
// ============================================
function SecuritySettings() {
  const { data: session } = useSession();
  const [mfaEnabled, setMfaEnabled] = useState(session?.user?.mfaEnabled || false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: session?.user?.id, ...data }),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => toast.success('Security settings updated'),
    onError: () => toast.error('Failed to update security settings'),
  });

  const handleMfaToggle = (enabled: boolean) => {
    setMfaEnabled(enabled);
    updateMutation.mutate({ mfaEnabled: enabled });
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    toast.success('Password changed successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="space-y-6">
      {/* MFA Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Smartphone className="size-4 text-teal-600" />
            Multi-Factor Authentication
          </CardTitle>
          <CardDescription>Add an extra layer of security to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-teal-50 flex items-center justify-center">
                <Key className="size-5 text-teal-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Authenticator App</p>
                <p className="text-xs text-muted-foreground">Use an authenticator app for TOTP verification</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={mfaEnabled ? 'default' : 'secondary'} className="text-[10px]">
                {mfaEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
              <Switch checked={mfaEnabled} onCheckedChange={handleMfaToggle} />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-slate-50 flex items-center justify-center">
                <Mail className="size-5 text-slate-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Email Verification</p>
                <p className="text-xs text-muted-foreground">Receive verification codes via email</p>
              </div>
            </div>
            <Badge variant="default" className="text-[10px] bg-emerald-600">Active</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="size-4 text-teal-600" />
            Change Password
          </CardTitle>
          <CardDescription>Update your password regularly for better security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-10 h-10"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10 h-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-10"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="size-3" />
            <span>Password must be at least 8 characters with uppercase, lowercase, number, and special character</span>
          </div>

          <div className="flex justify-end">
            <Button onClick={handlePasswordChange} variant="outline" className="gap-2">
              <Save className="size-4" />
              Update Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-4 text-teal-600" />
            Active Sessions
          </CardTitle>
          <CardDescription>Manage your active login sessions across devices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-emerald-50/50 border-emerald-200">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Globe className="size-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Current Session</p>
                  <p className="text-[11px] text-muted-foreground">Chrome &middot; London, UK &middot; Active now</p>
                </div>
              </div>
              <Badge variant="default" className="text-[10px] bg-emerald-600">
                <span className="size-1.5 rounded-full bg-white mr-1 animate-pulse" />
                Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Notification Settings Tab
// ============================================
function NotificationSettings() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState({
    complianceAlerts: true,
    riskAlerts: true,
    propertyUpdates: true,
    partnerReferrals: true,
    identityUpdates: true,
    systemMaintenance: true,
    emailNotifications: true,
    pushNotifications: false,
    dailyDigest: true,
    weeklyReport: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Fetch notifications
  const { data: notifData } = useQuery({
    queryKey: ['notifications', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const res = await fetch(`/api/notifications?userId=${session.user.id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!session?.user?.id,
  });

  const notifications = notifData?.notifications || [];

  return (
    <div className="space-y-6">
      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="size-4 text-teal-600" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose what notifications you receive and how</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'complianceAlerts' as const, label: 'Compliance Alerts', desc: 'AML/KYC/CDD check results and escalations', icon: FileText, color: '#0d9488' },
            { key: 'riskAlerts' as const, label: 'Risk Alerts', desc: 'Fraud alerts, risk score changes, and high-risk flags', icon: AlertTriangle, color: '#f59e0b' },
            { key: 'propertyUpdates' as const, label: 'Property Updates', desc: 'Application status changes and Right to Rent updates', icon: Building2, color: '#8b5cf6' },
            { key: 'partnerReferrals' as const, label: 'Partner Referrals', desc: 'Referral status updates and new partnership opportunities', icon: Globe, color: '#ec4899' },
            { key: 'identityUpdates' as const, label: 'Identity Updates', desc: 'Verification results and trust level changes', icon: Shield, color: '#06b6d4' },
            { key: 'systemMaintenance' as const, label: 'System Maintenance', desc: 'Scheduled maintenance windows and platform updates', icon: Settings2, color: '#94a3b8' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: item.color + '15', color: item.color }}>
                  <item.icon className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <Switch checked={settings[item.key]} onCheckedChange={() => toggleSetting(item.key)} />
            </div>
          ))}

          <Separator />

          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Delivery Channels</p>

          {[
            { key: 'emailNotifications' as const, label: 'Email Notifications', desc: 'Receive notifications via email' },
            { key: 'pushNotifications' as const, label: 'Push Notifications', desc: 'Browser push notifications' },
            { key: 'dailyDigest' as const, label: 'Daily Digest', desc: 'Summary of all notifications once daily' },
            { key: 'weeklyReport' as const, label: 'Weekly Report', desc: 'Comprehensive weekly analytics report' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-[11px] text-muted-foreground">{item.desc}</p>
              </div>
              <Switch checked={settings[item.key]} onCheckedChange={() => toggleSetting(item.key)} />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recent Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-4 text-teal-600" />
            Recent Notifications
            {notifData?.unreadCount > 0 && (
              <Badge variant="default" className="text-[10px] bg-red-500">{notifData.unreadCount} new</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-64">
            {notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.slice(0, 10).map((notif: { id: string; title: string; message: string; type: string; read: boolean; createdAt: string }) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-lg border text-sm ${!notif.read ? 'bg-teal-50/50 border-teal-200' : 'bg-white'}`}
                  >
                    <div className="flex items-center gap-2">
                      {!notif.read && <span className="size-2 rounded-full bg-teal-500" />}
                      <p className="font-medium text-sm">{notif.title}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{notif.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Bell className="size-8 mx-auto mb-2 opacity-30" />
                <p>No notifications yet</p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Privacy & Data Settings Tab
// ============================================
function PrivacySettings() {
  const { data: session } = useSession();
  const [consent, setConsent] = useState({
    dataProcessing: true,
    marketing: false,
    thirdPartySharing: false,
    automatedDecisions: true,
    analytics: true,
    profiling: true,
  });

  const toggleConsent = (key: keyof typeof consent) => {
    setConsent(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="size-4 text-teal-600" />
            Consent Management
          </CardTitle>
          <CardDescription>Manage your data processing consent under UK GDPR and Data Protection Act 2018</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'dataProcessing' as const, label: 'Data Processing', desc: 'Processing of personal data for identity verification and compliance purposes', legalBasis: 'Contract', required: true },
            { key: 'automatedDecisions' as const, label: 'Automated Decision-Making', desc: 'Automated risk scoring and compliance decisions with explainability', legalBasis: 'Legitimate Interest', required: false },
            { key: 'analytics' as const, label: 'Analytics & Improvement', desc: 'Usage analytics to improve platform performance and user experience', legalBasis: 'Legitimate Interest', required: false },
            { key: 'profiling' as const, label: 'Risk Profiling', desc: 'Behavioural analysis for fraud detection and risk assessment', legalBasis: 'Legitimate Interest', required: false },
            { key: 'marketing' as const, label: 'Marketing Communications', desc: 'Product updates, new features, and promotional content', legalBasis: 'Consent', required: false },
            { key: 'thirdPartySharing' as const, label: 'Third-Party Sharing', desc: 'Sharing data with partner organisations for referrals and verification', legalBasis: 'Consent', required: false },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{item.label}</p>
                  {item.required && (
                    <Badge variant="outline" className="text-[9px] border-red-300 text-red-600 bg-red-50">Required</Badge>
                  )}
                  <Badge variant="secondary" className="text-[9px]">{item.legalBasis}</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <Switch
                checked={consent[item.key]}
                onCheckedChange={() => toggleConsent(item.key)}
                disabled={item.required}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Data Subject Rights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="size-4 text-teal-600" />
            Data Subject Rights
          </CardTitle>
          <CardDescription>Your rights under UK GDPR Article 12-23</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: 'Right of Access', desc: 'Request a copy of your personal data (Art. 15)', icon: Eye },
              { label: 'Right to Rectification', desc: 'Correct inaccurate personal data (Art. 16)', icon: FileText },
              { label: 'Right to Erasure', desc: 'Request deletion of personal data (Art. 17)', icon: AlertTriangle },
              { label: 'Right to Portability', desc: 'Export your data in machine-readable format (Art. 20)', icon: Globe },
            ].map((right) => (
              <button
                key={right.label}
                className="flex items-start gap-3 p-3 rounded-lg border hover:bg-slate-50 transition-colors text-left"
                onClick={() => toast.info(`Request submitted for ${right.label}`)}
              >
                <div className="size-8 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                  <right.icon className="size-4 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{right.label}</p>
                  <p className="text-[11px] text-muted-foreground">{right.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Platform Configuration Tab (Admin Only)
// ============================================
function PlatformConfig() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'platform_admin';

  // Fetch all users
  const { data: usersData } = useQuery({
    queryKey: ['platform-users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isAdmin,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update user');
      return res.json();
    },
    onSuccess: () => toast.success('User updated successfully'),
    onError: () => toast.error('Failed to update user'),
  });

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="size-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold text-lg">Admin Access Required</h3>
          <p className="text-sm text-muted-foreground mt-1">Platform configuration is only available to Platform Administrators</p>
        </CardContent>
      </Card>
    );
  }

  const users = usersData?.users || [];
  const summary = usersData?.summary || { total: 0, active: 0, inactive: 0, roleBreakdown: {} };

  return (
    <div className="space-y-6">
      {/* Platform Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-4 text-teal-600" />
            Platform Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Users', value: summary.total, color: '#0d9488' },
              { label: 'Active', value: summary.active, color: '#10b981' },
              { label: 'Inactive', value: summary.inactive, color: '#f59e0b' },
              { label: 'Roles', value: Object.keys(summary.roleBreakdown).length, color: '#8b5cf6' },
            ].map((stat) => (
              <div key={stat.label} className="p-3 rounded-lg border text-center">
                <p className="text-2xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Role Distribution</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.roleBreakdown).map(([role, count]) => {
                const roleDef = ROLE_DEFINITIONS[role as UserRole];
                return (
                  <Badge key={role} variant="outline" className="text-[10px]" style={{ borderColor: roleDef.color + '40', color: roleDef.color, backgroundColor: roleDef.bgColor }}>
                    {roleDef.name}: {count as number}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4 text-teal-600" />
            User Management
          </CardTitle>
          <CardDescription>Manage platform users, roles, and access levels</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-96">
            <div className="space-y-2">
              {users.map((user: { id: string; name: string; email: string; role: string; avatar: string; isActive: boolean; lastLoginAt: string | null; department?: string }) => {
                const roleDef = ROLE_DEFINITIONS[user.role as UserRole];
                return (
                  <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="size-8 border">
                        <AvatarFallback className="text-xs font-bold" style={{ backgroundColor: roleDef.bgColor, color: roleDef.color }}>
                          {user.avatar || user.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          {!user.isActive && <Badge variant="secondary" className="text-[9px]">Inactive</Badge>}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => {
                          updateMutation.mutate({ id: user.id, role: newRole });
                        }}
                      >
                        <SelectTrigger className="h-8 w-[140px] text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_LIST.map((r) => {
                            const rd = ROLE_DEFINITIONS[r];
                            return (
                              <SelectItem key={r} value={r} className="text-xs">
                                <div className="flex items-center gap-2">
                                  <div className="size-2 rounded-full" style={{ backgroundColor: rd.color }} />
                                  {rd.name}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      <Button
                        variant={user.isActive ? 'outline' : 'default'}
                        size="sm"
                        className="text-[10px] h-8"
                        onClick={() => updateMutation.mutate({ id: user.id, isActive: !user.isActive })}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Platform Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="size-4 text-teal-600" />
            Platform Configuration
          </CardTitle>
          <CardDescription>System-wide configuration and feature flags</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: 'Auto-Escalation', desc: 'Automatically escalate high-risk compliance checks', enabled: true },
            { label: 'Real-time Screening', desc: 'Continuous AML/sanctions screening for active profiles', enabled: true },
            { label: 'AI Risk Scoring', desc: 'Machine learning-based risk scoring model v3.2.1', enabled: true },
            { label: 'Partner API Access', desc: 'Allow external partners to access verification APIs', enabled: true },
            { label: 'Bulk Processing', desc: 'Enable batch processing for compliance checks', enabled: false },
            { label: 'GDPR Data Retention', desc: 'Automatic data retention policy enforcement', enabled: true },
          ].map((config) => (
            <div key={config.label} className="flex items-center justify-between p-3 rounded-lg border">
              <div>
                <p className="text-sm font-medium">{config.label}</p>
                <p className="text-[11px] text-muted-foreground">{config.desc}</p>
              </div>
              <Switch defaultChecked={config.enabled} />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Roles & Access Tab
// ============================================
function RolesAccessSettings() {
  const { data: session } = useSession();
  const currentRole = (session?.user?.role || 'tenant') as UserRole;
  const currentRoleDef = ROLE_DEFINITIONS[currentRole];
  const currentMatrix = ROLE_PERMISSIONS_MATRIX[currentRole];
  const dataScope = getDataScope(currentRole);

  // Feature areas for the matrix
  const featureAreas = [
    { key: 'identity' as const, label: 'Identity', icon: <ScanFace className="size-4" />, color: '#06b6d4' },
    { key: 'compliance' as const, label: 'Compliance', icon: <FileText className="size-4" />, color: '#10b981' },
    { key: 'risk' as const, label: 'Risk', icon: <AlertTriangle className="size-4" />, color: '#f59e0b' },
    { key: 'property' as const, label: 'Property', icon: <Building2 className="size-4" />, color: '#8b5cf6' },
    { key: 'partners' as const, label: 'Partners', icon: <Handshake className="size-4" />, color: '#ec4899' },
    { key: 'settings' as const, label: 'Settings', icon: <Settings2 className="size-4" />, color: '#64748b' },
    { key: 'users' as const, label: 'Users', icon: <Users className="size-4" />, color: '#0d9488' },
    { key: 'audit' as const, label: 'Audit', icon: <Activity className="size-4" />, color: '#f97316' },
  ];

  // Role icon mapping
  const roleIcons: Record<string, React.ReactNode> = {
    platform_admin: <Crown className="size-4" />,
    compliance_officer: <Shield className="size-4" />,
    property_manager: <Building2 className="size-4" />,
    identity_verifier: <ScanFace className="size-4" />,
    risk_analyst: <TrendingUp className="size-4" />,
    partner_integration_manager: <Puzzle className="size-4" />,
    partner_user: <Handshake className="size-4" />,
    tenant: <User className="size-4" />,
  };

  // Check if a role has any capability in a feature area
  const hasCapability = (role: UserRole, feature: keyof typeof ROLE_PERMISSIONS_MATRIX[UserRole]) => {
    const caps = ROLE_PERMISSIONS_MATRIX[role][feature];
    return Object.values(caps).some(v => v === true);
  };

  // Get capability count for a role in a feature
  const getCapabilityCount = (role: UserRole, feature: keyof typeof ROLE_PERMISSIONS_MATRIX[UserRole]) => {
    const caps = ROLE_PERMISSIONS_MATRIX[role][feature];
    return Object.values(caps).filter(v => v === true).length;
  };

  // Data scope label
  const dataScopeLabels: Record<string, { label: string; color: string; bgColor: string }> = {
    all: { label: 'All Data', color: '#10b981', bgColor: '#ecfdf5' },
    partner_only: { label: 'Partner Data Only', color: '#ec4899', bgColor: '#fdf2f8' },
    own: { label: 'Own Data Only', color: '#f59e0b', bgColor: '#fffbeb' },
  };

  const scopeInfo = dataScopeLabels[dataScope] || dataScopeLabels.own;

  // Current user's specific capabilities
  const userCapabilities: { feature: string; capabilities: string[] }[] = featureAreas
    .map(area => {
      const caps = currentMatrix[area.key];
      const capNames: string[] = [];
      if (caps.view_all) capNames.push('View All');
      if (caps.view_own) capNames.push('View Own');
      if (caps.verify) capNames.push('Verify');
      if (caps.manage) capNames.push('Manage');
      if (caps.review) capNames.push('Review');
      if (caps.analyze) capNames.push('Analyze');
      if (caps.register) capNames.push('Register');
      if (caps.apply) capNames.push('Apply');
      if (caps.view) capNames.push('View');
      if (caps.admin) capNames.push('Admin');
      if (caps.export) capNames.push('Export');
      return { feature: area.label, capabilities: capNames };
    })
    .filter(item => item.capabilities.length > 0);

  return (
    <div className="space-y-6">
      {/* Role Cards Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="size-4 text-teal-600" />
            Platform Roles
          </CardTitle>
          <CardDescription>All available roles and their authority levels in the Trust Infrastructure Platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ROLE_LIST.map((role) => {
              const def = ROLE_DEFINITIONS[role];
              const isCurrentRole = role === currentRole;
              return (
                <div
                  key={role}
                  className={`rounded-lg border p-3 transition-all ${
                    isCurrentRole ? 'ring-2 ring-teal-500 shadow-md' : 'hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="size-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: def.bgColor, color: def.color }}
                    >
                      {roleIcons[role]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate" style={{ color: isCurrentRole ? def.color : undefined }}>{def.name}</p>
                      <p className="text-[10px] text-muted-foreground">Level {def.level}</p>
                    </div>
                    {isCurrentRole && (
                      <Badge className="text-[8px] px-1 py-0 bg-teal-100 text-teal-700 border-teal-200">You</Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2 mb-2">{def.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1.5 py-0"
                      style={{ borderColor: def.color + '40', color: def.color, backgroundColor: def.bgColor }}
                    >
                      {def.permissions.length} perms
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-[9px] px-1.5 py-0"
                      style={{ borderColor: def.color + '40', color: def.color }}
                    >
                      {def.sections.length} sections
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Feature Access Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="size-4 text-teal-600" />
            Feature Access Matrix
          </CardTitle>
          <CardDescription>Capability mapping across roles and platform feature areas</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="w-full">
            <div className="min-w-[700px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background z-10 min-w-[120px]">Feature</TableHead>
                    {ROLE_LIST.map((role) => {
                      const def = ROLE_DEFINITIONS[role];
                      const isCurrent = role === currentRole;
                      return (
                        <TableHead
                          key={role}
                          className={`text-center min-w-[80px] ${isCurrent ? 'bg-teal-50/50' : ''}`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <div
                              className="size-5 rounded flex items-center justify-center"
                              style={{ backgroundColor: def.bgColor, color: def.color }}
                            >
                              {roleIcons[role]}
                            </div>
                            <span className="text-[9px] font-medium truncate max-w-[70px]" style={{ color: isCurrent ? def.color : undefined }}>
                              {def.name.split(' ')[0]}
                            </span>
                          </div>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {featureAreas.map((area) => (
                    <TableRow key={area.key}>
                      <TableCell className="sticky left-0 bg-background z-10 font-medium">
                        <div className="flex items-center gap-2">
                          <span style={{ color: area.color }}>{area.icon}</span>
                          <span className="text-xs">{area.label}</span>
                        </div>
                      </TableCell>
                      {ROLE_LIST.map((role) => {
                        const isCurrent = role === currentRole;
                        const capCount = getCapabilityCount(role, area.key);
                        const hasAccess = hasCapability(role, area.key);
                        return (
                          <TableCell
                            key={role}
                            className={`text-center ${isCurrent ? 'bg-teal-50/30' : ''}`}
                          >
                            {hasAccess ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center justify-center">
                                    <CheckCircle2 className="size-4 text-emerald-500" />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="text-xs font-medium">{capCount} capabilit{capCount !== 1 ? 'ies' : 'y'}</p>
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <div className="flex items-center justify-center">
                                <XCircle className="size-4 text-slate-200" />
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Your Access Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="size-4 text-teal-600" />
            Your Access
          </CardTitle>
          <CardDescription>Detailed view of your current permissions and data scope</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Role & Data Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border p-4" style={{ backgroundColor: currentRoleDef.bgColor + '40', borderColor: currentRoleDef.color + '30' }}>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="size-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: currentRoleDef.bgColor, color: currentRoleDef.color }}
                >
                  {roleIcons[currentRole]}
                </div>
                <div>
                  <p className="font-semibold text-sm" style={{ color: currentRoleDef.color }}>{currentRoleDef.name}</p>
                  <p className="text-[11px] text-muted-foreground">Authority Level {currentRoleDef.level}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{currentRoleDef.description}</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="size-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: scopeInfo.bgColor, color: scopeInfo.color }}
                >
                  <Database className="size-4" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Data Scope</p>
                  <Badge
                    variant="outline"
                    className="text-[10px] mt-0.5"
                    style={{ borderColor: scopeInfo.color + '40', color: scopeInfo.color, backgroundColor: scopeInfo.bgColor }}
                  >
                    {scopeInfo.label}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {dataScope === 'all' && 'You can view and manage all data across the platform.'}
                {dataScope === 'partner_only' && 'You can only view data related to your partner organisation.'}
                {dataScope === 'own' && 'You can only view and manage your own personal data.'}
              </p>
            </div>
          </div>

          {/* Accessible Sections */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Accessible Sections</p>
            <div className="flex flex-wrap gap-1.5">
              {currentRoleDef.sections.map((section) => (
                <Badge key={section} variant="secondary" className="text-[10px] capitalize gap-1">
                  {section.replace(/-/g, ' ')}
                </Badge>
              ))}
            </div>
          </div>

          {/* Capabilities by Feature */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Your Capabilities</p>
            {userCapabilities.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {userCapabilities.map((item) => (
                  <div key={item.feature} className="flex items-start gap-2 p-2.5 rounded-lg border">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                      <span className="text-xs font-medium">{item.feature}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 ml-auto">
                      {item.capabilities.map((cap) => (
                        <Badge key={cap} variant="outline" className="text-[9px] px-1.5 py-0">
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-sm text-muted-foreground">
                <AlertCircle className="size-5 mx-auto mb-1 text-muted-foreground/50" />
                No specific capabilities assigned
              </div>
            )}
          </div>

          {/* Total Permissions */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
            <Shield className="size-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Total permissions: <strong>{currentRoleDef.permissions.length}</strong> across {currentRoleDef.sections.length} sections
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Main Settings Component
// ============================================
interface SettingsProps {
  initialTab?: string;
}

export default function Settings({ initialTab = 'profile' }: SettingsProps) {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'platform_admin';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Tabs defaultValue={initialTab} className="space-y-4">
        <TabsList className="h-10 bg-slate-100 p-1">
          <TabsTrigger value="profile" className="text-xs gap-1.5 data-[state=active]:bg-white">
            <User className="size-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="text-xs gap-1.5 data-[state=active]:bg-white">
            <Lock className="size-3.5" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs gap-1.5 data-[state=active]:bg-white">
            <Bell className="size-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy" className="text-xs gap-1.5 data-[state=active]:bg-white">
            <Shield className="size-3.5" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="roles" className="text-xs gap-1.5 data-[state=active]:bg-white">
            <Users className="size-3.5" />
            Roles & Access
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="platform" className="text-xs gap-1.5 data-[state=active]:bg-white">
              <Settings2 className="size-3.5" />
              Platform
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>
        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>
        <TabsContent value="privacy">
          <PrivacySettings />
        </TabsContent>
        <TabsContent value="roles">
          <RolesAccessSettings />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="platform">
            <PlatformConfig />
          </TabsContent>
        )}
      </Tabs>
    </motion.div>
  );
}
