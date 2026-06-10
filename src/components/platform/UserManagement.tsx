'use client';

import { useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Shield,
  Users,
  Search,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Key,
  Activity,
  Crown,
  ScanFace,
  Handshake,
  Puzzle,
  TrendingUp,
  FileText,
  Settings2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Eye,
  XCircle,
  CheckCircle2,
  XCircle as XCircleIcon,
  Lock,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  ROLE_DEFINITIONS,
  ROLE_PERMISSIONS_MATRIX,
  ROLE_LIST,
  getDataScope,
  type UserRole,
  type RolePermissionsMatrix,
} from '@/lib/rbac';
import { toast } from 'sonner';

// ============================================
// Types
// ============================================
interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
  department: string | null;
  jobTitle: string | null;
  phone: string | null;
  mfaEnabled: boolean;
  isActive: boolean;
  partnerId: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

interface PartnerOption {
  id: string;
  name: string;
  partnerType: string;
}

// ============================================
// Icon mapping for roles
// ============================================
const ROLE_ICONS: Record<string, React.ReactNode> = {
  platform_admin: <Crown className="size-3.5" />,
  compliance_officer: <Shield className="size-3.5" />,
  property_manager: <Building2 className="size-3.5" />,
  identity_verifier: <ScanFace className="size-3.5" />,
  risk_analyst: <TrendingUp className="size-3.5" />,
  partner_integration_manager: <Puzzle className="size-3.5" />,
  partner_user: <Handshake className="size-3.5" />,
  tenant: <User className="size-3.5" />,
};

// ============================================
// Feature area definitions
// ============================================
const FEATURE_AREAS = [
  { key: 'identity' as const, label: 'Identity', icon: <ScanFace className="size-4" />, color: '#06b6d4' },
  { key: 'compliance' as const, label: 'Compliance', icon: <FileText className="size-4" />, color: '#10b981' },
  { key: 'risk' as const, label: 'Risk', icon: <AlertTriangle className="size-4" />, color: '#f59e0b' },
  { key: 'property' as const, label: 'Property', icon: <Building2 className="size-4" />, color: '#8b5cf6' },
  { key: 'partners' as const, label: 'Partners', icon: <Handshake className="size-4" />, color: '#ec4899' },
  { key: 'settings' as const, label: 'Settings', icon: <Settings2 className="size-4" />, color: '#64748b' },
  { key: 'users' as const, label: 'Users', icon: <Users className="size-4" />, color: '#0d9488' },
  { key: 'audit' as const, label: 'Audit', icon: <Activity className="size-4" />, color: '#f97316' },
];

// ============================================
// Capability label mapping
// ============================================
const CAPABILITY_LABELS: Record<string, string> = {
  view_all: 'View All',
  view_own: 'View Own',
  verify: 'Verify',
  manage: 'Manage',
  review: 'Review',
  analyze: 'Analyze',
  register: 'Register',
  apply: 'Apply',
  view: 'View',
  admin: 'Admin',
  export: 'Export',
};

// ============================================
// Add User Dialog
// ============================================
function AddUserDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: (created?: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('');
  const [department, setDepartment] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  // Fetch partners for partner_user role
  const { data: partnersData } = useQuery({
    queryKey: ['partners-list'],
    queryFn: async () => {
      const res = await fetch('/api/partners');
      if (!res.ok) return null;
      return res.json();
    },
    enabled: open,
  });

  const partners: PartnerOption[] = partnersData?.partners || [];

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create user');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      setGeneratedPassword(data.password);
      toast.success('User created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create user');
    },
  });

  const handleSubmit = async () => {
    if (!name || !email || !role) {
      toast.error('Name, email, and role are required');
      return;
    }
    if (role === 'partner_user' && !partnerId) {
      toast.error('Partner is required for partner_user role');
      return;
    }
    setCreating(true);
    await createMutation.mutateAsync({
      name,
      email,
      role,
      department: department || null,
      jobTitle: jobTitle || null,
      phone: phone || null,
      partnerId: role === 'partner_user' ? partnerId : null,
    });
    setCreating(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Password copied to clipboard');
  };

  const handleClose = (created?: boolean) => {
    setName('');
    setEmail('');
    setRole('');
    setDepartment('');
    setJobTitle('');
    setPhone('');
    setPartnerId('');
    setGeneratedPassword('');
    setCopied(false);
    onClose(created);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="size-5 text-teal-600" />
            Add New User
          </DialogTitle>
          <DialogDescription>
            Create a new platform user with role-based access control
          </DialogDescription>
        </DialogHeader>

        {!generatedPassword ? (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-name" className="flex items-center gap-1.5">
                  <User className="size-3" /> Full Name *
                </Label>
                <Input
                  id="add-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jane Smith"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-email" className="flex items-center gap-1.5">
                  <Mail className="size-3" /> Email *
                </Label>
                <Input
                  id="add-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane.smith@propcomply.ai"
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-role" className="flex items-center gap-1.5">
                  <Shield className="size-3" /> Role *
                </Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="add-role" className="h-9">
                    <SelectValue placeholder="Select role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_LIST.map((r) => {
                      const rd = ROLE_DEFINITIONS[r];
                      return (
                        <SelectItem key={r} value={r}>
                          <div className="flex items-center gap-2">
                            <div
                              className="size-2 rounded-full"
                              style={{ backgroundColor: rd.color }}
                            />
                            <span>{rd.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-dept" className="flex items-center gap-1.5">
                  <Building2 className="size-3" /> Department
                </Label>
                <Input
                  id="add-dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Compliance"
                  className="h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-job" className="flex items-center gap-1.5">
                  <Briefcase className="size-3" /> Job Title
                </Label>
                <Input
                  id="add-job"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Analyst"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-phone" className="flex items-center gap-1.5">
                  <Phone className="size-3" /> Phone
                </Label>
                <Input
                  id="add-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+44 7700 000000"
                  className="h-9"
                />
              </div>
            </div>

            {role === 'partner_user' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <Label htmlFor="add-partner" className="flex items-center gap-1.5">
                  <Handshake className="size-3" /> Partner *
                </Label>
                <Select value={partnerId} onValueChange={setPartnerId}>
                  <SelectTrigger id="add-partner" className="h-9">
                    <SelectValue placeholder="Select partner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.partnerType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}

            {/* Role preview */}
            {role && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-lg border"
                style={{
                  backgroundColor: ROLE_DEFINITIONS[role as UserRole]?.bgColor,
                  borderColor: ROLE_DEFINITIONS[role as UserRole]?.color + '30',
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="size-6 rounded flex items-center justify-center"
                    style={{
                      backgroundColor: ROLE_DEFINITIONS[role as UserRole]?.color + '20',
                      color: ROLE_DEFINITIONS[role as UserRole]?.color,
                    }}
                  >
                    {ROLE_ICONS[role]}
                  </div>
                  <div>
                    <p
                      className="text-xs font-semibold"
                      style={{ color: ROLE_DEFINITIONS[role as UserRole]?.color }}
                    >
                      {ROLE_DEFINITIONS[role as UserRole]?.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {ROLE_DEFINITIONS[role as UserRole]?.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-emerald-800">
                  User created successfully!
                </p>
                <p className="text-xs text-emerald-700">
                  Share the password below with the new user securely.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Key className="size-3" /> Generated Password
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={generatedPassword}
                  className="h-9 font-mono text-sm bg-muted/50"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-9 shrink-0"
                >
                  {copied ? (
                    <Check className="size-4 text-emerald-600" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-amber-600 flex items-center gap-1">
                <AlertTriangle className="size-3" />
                This password will not be shown again. Copy it now.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {generatedPassword ? (
            <Button
              onClick={() => handleClose(true)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Done
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => handleClose()}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={creating || !name || !email || !role}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {creating ? (
                  <div className="flex items-center gap-2">
                    <div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus className="size-4" />
                    Create User
                  </div>
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Edit User Dialog
// ============================================
function EditUserDialog({
  open,
  user,
  onClose,
}: {
  open: boolean;
  user: UserRecord | null;
  onClose: (updated?: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [resetPassword, setResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch partners for partner_user role
  const { data: partnersData } = useQuery({
    queryKey: ['partners-list'],
    queryFn: async () => {
      const res = await fetch('/api/partners');
      if (!res.ok) return null;
      return res.json();
    },
    enabled: open,
  });

  const partners: PartnerOption[] = partnersData?.partners || [];

  // Populate form when user changes
  const prevUserId = useState('');
  if (user && user.id !== prevUserId[0]) {
    prevUserId[1](user.id);
    setName(user.name || '');
    setRole(user.role || '');
    setDepartment(user.department || '');
    setJobTitle(user.jobTitle || '');
    setPhone(user.phone || '');
    setPartnerId(user.partnerId || '');
    setResetPassword(false);
    setNewPassword('');
  }

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(`/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to update user');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      if (data.password) {
        setNewPassword(data.password);
      } else {
        toast.success('User updated successfully');
        onClose(true);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update user');
    },
  });

  const handleSubmit = async () => {
    if (!name || !role) {
      toast.error('Name and role are required');
      return;
    }
    setSaving(true);
    await updateMutation.mutateAsync({
      name,
      role,
      department: department || null,
      jobTitle: jobTitle || null,
      phone: phone || null,
      partnerId: role === 'partner_user' ? partnerId : null,
      resetPassword,
    });
    setSaving(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Password copied to clipboard');
  };

  const handleClose = (updated?: boolean) => {
    setNewPassword('');
    setResetPassword(false);
    setCopied(false);
    onClose(updated);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="size-5 text-teal-600" />
            Edit User
          </DialogTitle>
          <DialogDescription>
            Update user details, role, and access settings
          </DialogDescription>
        </DialogHeader>

        {!newPassword ? (
          <div className="space-y-4 py-2">
            {/* User avatar + status */}
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <Avatar className="size-10 border-2" style={{ borderColor: ROLE_DEFINITIONS[user.role as UserRole]?.color }}>
                <AvatarFallback
                  className="text-sm font-bold"
                  style={{
                    backgroundColor: ROLE_DEFINITIONS[user.role as UserRole]?.bgColor,
                    color: ROLE_DEFINITIONS[user.role as UserRole]?.color,
                  }}
                >
                  {user.avatar || user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge
                    variant="outline"
                    className="text-[9px]"
                    style={{
                      borderColor: ROLE_DEFINITIONS[user.role as UserRole]?.color + '40',
                      color: ROLE_DEFINITIONS[user.role as UserRole]?.color,
                      backgroundColor: ROLE_DEFINITIONS[user.role as UserRole]?.bgColor,
                    }}
                  >
                    {ROLE_DEFINITIONS[user.role as UserRole]?.name}
                  </Badge>
                  <Badge
                    variant={user.isActive ? 'default' : 'secondary'}
                    className={`text-[9px] ${user.isActive ? 'bg-emerald-600' : ''}`}
                  >
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="flex items-center gap-1.5">
                  <User className="size-3" /> Full Name *
                </Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role" className="flex items-center gap-1.5">
                  <Shield className="size-3" /> Role *
                </Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger id="edit-role" className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_LIST.map((r) => {
                      const rd = ROLE_DEFINITIONS[r];
                      return (
                        <SelectItem key={r} value={r}>
                          <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full" style={{ backgroundColor: rd.color }} />
                            <span>{rd.name}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-dept" className="flex items-center gap-1.5">
                  <Building2 className="size-3" /> Department
                </Label>
                <Input
                  id="edit-dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-job" className="flex items-center gap-1.5">
                  <Briefcase className="size-3" /> Job Title
                </Label>
                <Input
                  id="edit-job"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone" className="flex items-center gap-1.5">
                <Phone className="size-3" /> Phone
              </Label>
              <Input
                id="edit-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-9"
              />
            </div>

            {role === 'partner_user' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <Label htmlFor="edit-partner" className="flex items-center gap-1.5">
                  <Handshake className="size-3" /> Partner
                </Label>
                <Select value={partnerId} onValueChange={setPartnerId}>
                  <SelectTrigger id="edit-partner" className="h-9">
                    <SelectValue placeholder="Select partner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.partnerType})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}

            <Separator />

            {/* Reset Password */}
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-amber-50 flex items-center justify-center">
                  <Key className="size-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Reset Password</p>
                  <p className="text-[11px] text-muted-foreground">
                    Generate a new password for this user
                  </p>
                </div>
              </div>
              <Switch checked={resetPassword} onCheckedChange={setResetPassword} />
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-semibold text-sm text-emerald-800">
                  Password reset successfully!
                </p>
                <p className="text-xs text-emerald-700">
                  Share the new password with the user securely.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Key className="size-3" /> New Password
              </Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={newPassword} className="h-9 font-mono text-sm bg-muted/50" />
                <Button type="button" variant="outline" size="sm" onClick={handleCopy} className="h-9 shrink-0">
                  {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          {newPassword ? (
            <Button onClick={() => handleClose(true)} className="bg-teal-600 hover:bg-teal-700">
              Done
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => handleClose()}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={saving || !name || !role}
                className="bg-teal-600 hover:bg-teal-700"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="size-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Check className="size-4" />
                    Save Changes
                  </div>
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// Role & Permissions Panel
// ============================================
function RolePermissionsPanel({ role }: { role: UserRole }) {
  const roleDef = ROLE_DEFINITIONS[role];
  const matrix = ROLE_PERMISSIONS_MATRIX[role];
  const dataScope = getDataScope(role);

  return (
    <div className="space-y-4">
      {/* Role Header */}
      <div
        className="p-4 rounded-lg"
        style={{ backgroundColor: roleDef.bgColor }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="size-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: roleDef.color + '20', color: roleDef.color }}
            >
              {ROLE_ICONS[role]}
            </div>
            <div>
              <p className="font-semibold" style={{ color: roleDef.color }}>
                {roleDef.name}
              </p>
              <p className="text-xs text-muted-foreground">{roleDef.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" style={{ borderColor: roleDef.color + '40', color: roleDef.color }}>
              Level {roleDef.level}
            </Badge>
            <Badge
              variant="outline"
              className="text-[9px]"
              style={{
                borderColor: dataScope === 'all' ? '#10b981' : dataScope === 'partner_only' ? '#f59e0b' : '#64748b',
                color: dataScope === 'all' ? '#10b981' : dataScope === 'partner_only' ? '#f59e0b' : '#64748b',
              }}
            >
              Data: {dataScope.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Permissions by Domain
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FEATURE_AREAS.map((area) => {
            const caps = matrix[area.key];
            const activeCaps = Object.entries(caps).filter(([, v]) => v === true);
            const hasAny = activeCaps.length > 0;

            return (
              <div
                key={area.key}
                className={`p-3 rounded-lg border ${hasAny ? 'border-slate-200' : 'border-dashed border-slate-200 opacity-50'}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className="size-6 rounded flex items-center justify-center"
                    style={{ backgroundColor: area.color + '15', color: area.color }}
                  >
                    {area.icon}
                  </div>
                  <span className="text-xs font-semibold">{area.label}</span>
                  {hasAny && (
                    <Badge variant="secondary" className="text-[9px] ml-auto">
                      {activeCaps.length}
                    </Badge>
                  )}
                </div>
                {hasAny ? (
                  <div className="flex flex-wrap gap-1">
                    {activeCaps.map(([key]) => (
                      <Badge
                        key={key}
                        variant="outline"
                        className="text-[9px]"
                        style={{
                          borderColor: area.color + '40',
                          color: area.color,
                          backgroundColor: area.color + '10',
                        }}
                      >
                        {CAPABILITY_LABELS[key] || key}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground">No access</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Main UserManagement Component
// ============================================
export default function UserManagement() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const isAdmin = session?.user?.role === 'platform_admin';

  // State
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [viewPermissionsUser, setViewPermissionsUser] = useState<UserRecord | null>(null);
  const pageSize = 10;

  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['platform-users'],
    queryFn: async () => {
      const res = await fetch('/api/users');
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isAdmin,
  });

  // Mutations
  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to deactivate user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      toast.success('User deactivated');
    },
    onError: () => toast.error('Failed to deactivate user'),
  });

  const activateMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: true }),
      });
      if (!res.ok) throw new Error('Failed to activate user');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      toast.success('User activated');
    },
    onError: () => toast.error('Failed to activate user'),
  });

  const bulkRoleMutation = useMutation({
    mutationFn: async ({ userIds, role }: { userIds: string[]; role: string }) => {
      const results = await Promise.all(
        userIds.map(async (id) => {
          const res = await fetch(`/api/users/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ role }),
          });
          return res.ok;
        })
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      setSelectedUsers(new Set());
      toast.success('Roles updated for selected users');
    },
    onError: () => toast.error('Failed to update roles'),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: async ({ userIds, isActive }: { userIds: string[]; isActive: boolean }) => {
      const results = await Promise.all(
        userIds.map(async (id) => {
          if (isActive) {
            const res = await fetch(`/api/users/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ isActive: true }),
            });
            return res.ok;
          } else {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            return res.ok;
          }
        })
      );
      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-users'] });
      setSelectedUsers(new Set());
      toast.success('Status updated for selected users');
    },
    onError: () => toast.error('Failed to update status'),
  });

  // Filter and paginate users
  const filteredUsers = useMemo(() => {
    if (!usersData?.users) return [];
    let users = usersData.users as UserRecord[];

    if (search) {
      const s = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(s) ||
          u.email.toLowerCase().includes(s)
      );
    }
    if (roleFilter !== 'all') {
      users = users.filter((u) => u.role === roleFilter);
    }
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      users = users.filter((u) => u.isActive === isActive);
    }
    return users;
  }, [usersData, search, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = filteredUsers.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const summary = usersData?.summary || { total: 0, active: 0, inactive: 0, roleBreakdown: {} };

  const toggleSelectAll = useCallback(() => {
    if (selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map((u: UserRecord) => u.id)));
    }
  }, [paginatedUsers, selectedUsers]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const formatLastLogin = (date: string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Shield className="size-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold text-lg">Admin Access Required</h3>
          <p className="text-sm text-muted-foreground mt-1">
            User management is only available to Platform Administrators
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: summary.total, color: '#0d9488', icon: <Users className="size-4" /> },
          { label: 'Active', value: summary.active, color: '#10b981', icon: <CheckCircle2 className="size-4" /> },
          { label: 'Inactive', value: summary.inactive, color: '#f59e0b', icon: <XCircleIcon className="size-4" /> },
          { label: 'Roles Used', value: Object.keys(summary.roleBreakdown || {}).length, color: '#5E35B1', icon: <Shield className="size-4" /> },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="size-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: stat.color + '15', color: stat.color }}
                >
                  {stat.icon}
                </div>
                <span className="text-[11px] text-muted-foreground">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold" style={{ color: stat.color }}>
                {stat.value}
              </p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <Card>
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 w-full sm:max-w-[260px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Search name or email..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="h-9 pl-8 text-sm"
              />
            </div>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-full sm:w-[180px] text-sm">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ROLE_LIST.map((r) => {
                  const rd = ROLE_DEFINITIONS[r];
                  return (
                    <SelectItem key={r} value={r}>
                      <div className="flex items-center gap-2">
                        <div className="size-2 rounded-full" style={{ backgroundColor: rd.color }} />
                        {rd.name}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-full sm:w-[130px] text-sm">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex-1" />

            {/* Bulk Actions */}
            {selectedUsers.size > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2"
              >
                <Badge variant="secondary" className="text-[10px]">
                  {selectedUsers.size} selected
                </Badge>
                <Select
                  onValueChange={(role) =>
                    bulkRoleMutation.mutate({ userIds: Array.from(selectedUsers), role })
                  }
                >
                  <SelectTrigger className="h-8 w-[130px] text-[11px]">
                    <SelectValue placeholder="Change Role..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_LIST.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">
                        {ROLE_DEFINITIONS[r].name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[11px]"
                  onClick={() =>
                    bulkStatusMutation.mutate({ userIds: Array.from(selectedUsers), isActive: true })
                  }
                >
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-[11px]"
                  onClick={() =>
                    bulkStatusMutation.mutate({ userIds: Array.from(selectedUsers), isActive: false })
                  }
                >
                  Deactivate
                </Button>
              </motion.div>
            )}

            {/* Add User */}
            <Button
              onClick={() => setAddDialogOpen(true)}
              className="h-9 bg-teal-600 hover:bg-teal-700 text-sm"
              size="sm"
            >
              <Plus className="size-4 mr-1" />
              Add User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="size-6 border-2 border-teal-600/30 border-t-teal-600 rounded-full animate-spin" />
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Users className="size-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">No users found</p>
              <p className="text-xs">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            paginatedUsers.length > 0 &&
                            selectedUsers.size === paginatedUsers.length
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="text-[11px]">User</TableHead>
                      <TableHead className="text-[11px]">Role</TableHead>
                      <TableHead className="text-[11px] hidden md:table-cell">Department</TableHead>
                      <TableHead className="text-[11px]">Status</TableHead>
                      <TableHead className="text-[11px] hidden lg:table-cell">Last Login</TableHead>
                      <TableHead className="text-[11px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user: UserRecord) => {
                      const roleDef = ROLE_DEFINITIONS[user.role as UserRole];
                      const isSelected = selectedUsers.has(user.id);

                      return (
                        <TableRow
                          key={user.id}
                          className={`cursor-pointer ${isSelected ? 'bg-teal-50/50' : ''}`}
                          onClick={() => setViewPermissionsUser(user)}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelect(user.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="size-8 border" style={{ borderColor: roleDef?.color }}>
                                <AvatarFallback
                                  className="text-[10px] font-bold"
                                  style={{
                                    backgroundColor: roleDef?.bgColor,
                                    color: roleDef?.color,
                                  }}
                                >
                                  {user.avatar || user.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate max-w-[160px]">
                                  {user.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-[9px] gap-1"
                              style={{
                                borderColor: roleDef?.color + '40',
                                color: roleDef?.color,
                                backgroundColor: roleDef?.bgColor,
                              }}
                            >
                              {ROLE_ICONS[user.role]}
                              {roleDef?.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className="text-xs text-muted-foreground">
                              {user.department || '—'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={user.isActive ? 'default' : 'secondary'}
                              className={`text-[9px] ${user.isActive ? 'bg-emerald-600' : ''}`}
                            >
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <span className="text-xs text-muted-foreground">
                              {formatLastLogin(user.lastLoginAt)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => setViewPermissionsUser(user)}
                                  >
                                    <Eye className="size-3.5 text-slate-500" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View Permissions</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0"
                                    onClick={() => setEditUser(user)}
                                  >
                                    <Pencil className="size-3.5 text-teal-600" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit User</TooltipContent>
                              </Tooltip>
                              {user.isActive ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => deactivateMutation.mutate(user.id)}
                                    >
                                      <XCircleIcon className="size-3.5 text-amber-500" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Deactivate</TooltipContent>
                                </Tooltip>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0"
                                      onClick={() => activateMutation.mutate({ id: user.id })}
                                    >
                                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Activate</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <p className="text-xs text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1}–
                    {Math.min(page * pageSize, filteredUsers.length)} of{' '}
                    {filteredUsers.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="size-3.5" />
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <Button
                          key={p}
                          variant={p === page ? 'default' : 'outline'}
                          size="sm"
                          className={`h-7 w-7 p-0 text-[11px] ${p === page ? 'bg-teal-600 hover:bg-teal-700' : ''}`}
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      )
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Role Distribution */}
      {summary.roleBreakdown && Object.keys(summary.roleBreakdown).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="size-4 text-teal-600" />
              Role Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.roleBreakdown).map(([role, count]) => {
                const roleDef = ROLE_DEFINITIONS[role as UserRole];
                return (
                  <Badge
                    key={role}
                    variant="outline"
                    className="text-[10px] gap-1"
                    style={{
                      borderColor: roleDef?.color + '40',
                      color: roleDef?.color,
                      backgroundColor: roleDef?.bgColor,
                    }}
                  >
                    {ROLE_ICONS[role]}
                    {roleDef?.name}: {count as number}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <AddUserDialog open={addDialogOpen} onClose={(created) => { setAddDialogOpen(false); if (created) queryClient.invalidateQueries({ queryKey: ['platform-users'] }); }} />
      <EditUserDialog open={!!editUser} user={editUser} onClose={(updated) => { setEditUser(null); if (updated) queryClient.invalidateQueries({ queryKey: ['platform-users'] }); }} />

      {/* Permissions Panel Dialog */}
      <Dialog open={!!viewPermissionsUser} onOpenChange={(v) => { if (!v) setViewPermissionsUser(null); }}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="size-5 text-teal-600" />
              Role & Permissions
            </DialogTitle>
            <DialogDescription>
              {viewPermissionsUser ? (
                <span>
                  Viewing permissions for <strong>{viewPermissionsUser.name}</strong>
                </span>
              ) : (
                'User permissions'
              )}
            </DialogDescription>
          </DialogHeader>

          {viewPermissionsUser && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <Avatar className="size-10 border-2" style={{ borderColor: ROLE_DEFINITIONS[viewPermissionsUser.role as UserRole]?.color }}>
                  <AvatarFallback
                    className="text-sm font-bold"
                    style={{
                      backgroundColor: ROLE_DEFINITIONS[viewPermissionsUser.role as UserRole]?.bgColor,
                      color: ROLE_DEFINITIONS[viewPermissionsUser.role as UserRole]?.color,
                    }}
                  >
                    {viewPermissionsUser.avatar || viewPermissionsUser.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{viewPermissionsUser.name}</p>
                  <p className="text-xs text-muted-foreground">{viewPermissionsUser.email}</p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Badge
                    variant={viewPermissionsUser.isActive ? 'default' : 'secondary'}
                    className={`text-[9px] ${viewPermissionsUser.isActive ? 'bg-emerald-600' : ''}`}
                  >
                    {viewPermissionsUser.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <RolePermissionsPanel role={viewPermissionsUser.role as UserRole} />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewPermissionsUser(null)}>
              Close
            </Button>
            <Button
              className="bg-teal-600 hover:bg-teal-700"
              onClick={() => {
                const u = viewPermissionsUser;
                setViewPermissionsUser(null);
                setEditUser(u);
              }}
            >
              <Pencil className="size-4 mr-1" />
              Edit User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
