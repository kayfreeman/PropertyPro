'use client';

import { useState, useRef, useMemo } from 'react';
import { signIn } from 'next-auth/react';
import { motion, useInView } from 'framer-motion';
import {
  Shield,
  ShieldCheck,
  Eye,
  EyeOff,
  LogIn,
  ArrowRight,
  Lock,
  Mail,
  Building2,
  AlertTriangle,
  ScanFace,
  Handshake,
  User,
  Crown,
  Puzzle,
  CheckCircle2,
  Globe,
  FileCheck,
  TrendingUp,
  Bot,
  Landmark,
  Scale,
  Fingerprint,
  ChevronRight,
  ChevronDown,
  Sparkles,
  X,
  Menu,
  Layers,
  PoundSterling,
  Boxes,
  Target,
  Clock,
  Activity,
  UserX,
  FileWarning,
  HelpCircle,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ROLE_DEFINITIONS, type UserRole } from '@/lib/rbac';

// ─── Color Constants (per design spec) ──────────────────────────────
const NAVY = '#1E3A8A'; // primary navy
const TEAL = '#14B8A6'; // accent teal
const MINT = '#10b981'; // success mint
const RED = '#ef4444'; // identity fraud
const ORANGE = '#f59e0b'; // compliance burden
const BLUE = '#3b82f6'; // trust deficit
const LIGHT_BG = '#F9FAFB'; // section background
const DARK_GRAY = '#374151'; // body text

// ─── Demo Accounts ──────────────────────────────────────────────────
const DEMO_ACCOUNTS: { role: UserRole; email: string; password: string }[] = [
  { role: 'platform_admin', email: 'admin@propcomply.ai', password: 'Admin@2024' },
  { role: 'compliance_officer', email: 'compliance@propcomply.ai', password: 'Compliance@2024' },
  { role: 'property_manager', email: 'property@propcomply.ai', password: 'Property@2024' },
  { role: 'identity_verifier', email: 'identity@propcomply.ai', password: 'Identity@2024' },
  { role: 'risk_analyst', email: 'risk@propcomply.ai', password: 'Risk@2024' },
  { role: 'partner_integration_manager', email: 'partner-mgr@propcomply.ai', password: 'PartnerMgr@2024' },
  { role: 'partner_user', email: 'partner@barclays.ai', password: 'Partner@2024' },
  { role: 'tenant', email: 'tenant@example.com', password: 'Tenant@2024' },
];

const ROLE_ICONS: Record<string, React.ReactNode> = {
  platform_admin: <Crown className="size-4" />,
  compliance_officer: <Shield className="size-4" />,
  property_manager: <Building2 className="size-4" />,
  identity_verifier: <ScanFace className="size-4" />,
  risk_analyst: <AlertTriangle className="size-4" />,
  partner_integration_manager: <Puzzle className="size-4" />,
  partner_user: <Handshake className="size-4" />,
  tenant: <User className="size-4" />,
};

// ─── Animation helpers ───────────────────────────────────────────────
function AnimatedSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StaggerChild({ children, index }: { children: React.ReactNode; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-30px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

// ─── Login Modal Component ───────────────────────────────────────────
function LoginModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setLoginError(result.error);
      } else if (result?.ok) {
        onOpenChange(false);
      }
    } catch {
      setLoginError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (account: (typeof DEMO_ACCOUNTS)[0]) => {
    setIsLoading(true);
    setLoginError('');
    try {
      const result = await signIn('credentials', { email: account.email, password: account.password, redirect: false });
      if (result?.error) {
        setLoginError(result.error);
      } else if (result?.ok) {
        onOpenChange(false);
      }
    } catch {
      setLoginError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Lock className="size-5" style={{ color: TEAL }} />
            <DialogTitle className="text-xl" style={{ color: NAVY }}>
              Sign In
            </DialogTitle>
          </div>
          <DialogDescription>
            Access the PropComply AI + VerifyMe Global Trust Infrastructure Platform
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="modal-email" style={{ color: NAVY }}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="modal-email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 h-11"
                required
                autoComplete="email"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="modal-password" style={{ color: NAVY }}>
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="modal-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9 pr-10 h-11"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          {loginError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700"
            >
              {loginError}
            </motion.div>
          )}
          <Button
            type="submit"
            className="w-full h-11 text-white shadow-md hover:opacity-90"
            style={{ backgroundColor: NAVY }}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing in...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <LogIn className="size-4" />
                Sign In
              </div>
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-3">
            Protected by enterprise-grade security · Zero Trust Architecture
          </p>
          <Button
            variant="ghost"
            size="sm"
            style={{ color: TEAL }}
            onClick={() => setShowDemoAccounts(!showDemoAccounts)}
          >
            {showDemoAccounts ? 'Hide' : 'Show'} Demo Accounts
            <ChevronRight className={`size-4 ml-1 transition-transform ${showDemoAccounts ? 'rotate-90' : ''}`} />
          </Button>
        </div>

        {showDemoAccounts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 max-h-64 overflow-y-auto"
          >
            <Separator />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-1">
              Quick Access Demo Accounts
            </p>
            {DEMO_ACCOUNTS.map((account) => {
              const roleDef = ROLE_DEFINITIONS[account.role];
              return (
                <button
                  key={account.role}
                  onClick={() => handleQuickLogin(account)}
                  disabled={isLoading}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg border bg-white hover:bg-slate-50 hover:border-teal-300 transition-all duration-200 group text-left"
                >
                  <div
                    className="flex size-8 items-center justify-center rounded-lg shrink-0"
                    style={{ backgroundColor: roleDef.bgColor, color: roleDef.color }}
                  >
                    {ROLE_ICONS[account.role]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate" style={{ color: NAVY }}>
                      {roleDef.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">{account.email}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-[9px] px-1.5 py-0 shrink-0"
                    style={{
                      borderColor: roleDef.color + '40',
                      color: roleDef.color,
                      backgroundColor: roleDef.bgColor,
                    }}
                  >
                    Lvl {roleDef.level}
                  </Badge>
                </button>
              );
            })}
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Navigation data ─────────────────────────────────────────────────
type NavItem =
  | { label: string; section: string; dropdown?: never }
  | { label: string; section?: never; dropdown: { label: string; section: string }[] };

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Platform',
    dropdown: [
      { label: 'Identity & Trust', section: 'modules' },
      { label: 'Compliance Automation', section: 'modules' },
      { label: 'Risk Intelligence', section: 'modules' },
      { label: 'Property Intelligence', section: 'modules' },
      { label: 'Right to Rent', section: 'modules' },
      { label: 'Partner Ecosystem', section: 'modules' },
    ],
  },
  { label: 'Trust Ladder', section: 'trust-infrastructure' },
  {
    label: 'Solutions',
    dropdown: [
      { label: 'For Landlords', section: 'pricing' },
      { label: 'For Letting Agents', section: 'pricing' },
      { label: 'For Partners', section: 'modules' },
      { label: 'For Tenants', section: 'how-it-works' },
    ],
  },
  {
    label: 'Resources',
    dropdown: [
      { label: 'Documentation', section: 'regulatory' },
      { label: 'Compliance Guide', section: 'regulatory' },
      { label: 'Case Studies', section: 'modules' },
      { label: 'API Reference', section: 'modules' },
    ],
  },
  {
    label: 'Company',
    dropdown: [
      { label: 'About Us', section: 'compliance-gap' },
      { label: 'Careers', section: 'compliance-gap' },
      { label: 'Contact', section: 'cta' },
      { label: 'Press', section: 'compliance-gap' },
    ],
  },
  { label: 'Pricing', section: 'pricing' },
];

// ─── Metrics (4 cards) ──────────────────────────────────────────────
const METRICS = [
  {
    value: '£10,000',
    label: 'Max Right to Rent penalty per occupier',
    icon: <PoundSterling className="size-7" style={{ color: TEAL }} />,
  },
  {
    value: '6',
    label: 'Trust Ladder Levels',
    icon: <TrendingUp className="size-7" style={{ color: TEAL }} />,
  },
  {
    value: '8',
    label: 'Platform Modules',
    icon: <Boxes className="size-7" style={{ color: TEAL }} />,
  },
  {
    value: '99.9%',
    label: 'Verification Accuracy',
    icon: <Target className="size-7" style={{ color: TEAL }} />,
  },
];

// ─── The Compliance Gap ─────────────────────────────────────────────
const PROBLEM_STATEMENTS = [
  {
    title: 'Identity Fraud',
    tag: 'Rising',
    tagColor: RED,
    icon: <UserX className="size-7" style={{ color: RED }} />,
    iconBg: '#fef2f2',
    desc: 'UK property fraud cases increased 12% in 2024, with cross-border transactions most vulnerable to forged documents and synthetic identities.',
  },
  {
    title: 'Compliance Burden',
    tag: '£10,000',
    tagColor: ORANGE,
    icon: <FileWarning className="size-7" style={{ color: ORANGE }} />,
    iconBg: '#fffbeb',
    desc: 'Right to Rent penalties cost landlords up to £10,000 per occupier. Manual compliance checks are error-prone and resource-intensive.',
  },
  {
    title: 'Trust Deficit',
    tag: 'Zero',
    tagColor: BLUE,
    icon: <HelpCircle className="size-7" style={{ color: BLUE }} />,
    iconBg: '#eff6ff',
    desc: 'No framework exists for cross-border identity trust. International tenants lack portable, verifiable credentials accepted across properties.',
  },
];

// ─── Trust Infrastructure features ──────────────────────────────────
const TRUST_FEATURES = [
  {
    title: 'Identity Verified',
    desc: 'Portable, verifiable identities following a 6-level Trust Ladder from Self-Declared to Government Verified.',
    icon: <CheckCircle2 className="size-7" style={{ color: MINT }} />,
  },
  {
    title: 'Right to Rent Certified',
    desc: 'Automated Immigration Act 2014 Section 22 compliance with lifecycle tracking and audit trails.',
    icon: <CheckCircle2 className="size-7" style={{ color: MINT }} />,
  },
  {
    title: 'Compliance Focused',
    desc: 'AML, KYC, CDD, EDD workflows with sanctions screening, PEP checks, and adverse media monitoring.',
    icon: <CheckCircle2 className="size-7" style={{ color: MINT }} />,
  },
];

// ─── Platform Modules (8 in 2x4 grid) ──────────────────────────────
const PLATFORM_MODULES = [
  {
    icon: <Shield className="size-7" />,
    title: 'Identity & Trust',
    desc: '6-level Trust Ladder with progressive identity assurance and portable credentials',
    color: '#10b981',
    bgColor: '#ecfdf5',
  },
  {
    icon: <FileCheck className="size-7" />,
    title: 'Compliance Automation',
    desc: 'AML/KYC/CDD/EDD workflows with automated screening and regulatory monitoring',
    color: '#06b6d4',
    bgColor: '#ecfeff',
  },
  {
    icon: <AlertTriangle className="size-7" />,
    title: 'Risk Intelligence',
    desc: 'ML-powered risk scoring, fraud detection, and explainable AI analytics',
    color: '#f59e0b',
    bgColor: '#fffbeb',
  },
  {
    icon: <Building2 className="size-7" />,
    title: 'Property Intelligence',
    desc: 'Right to Rent verification, guarantor replacement, and compliance intelligence',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
  },
  {
    icon: <Landmark className="size-7" />,
    title: 'Right to Rent',
    desc: 'Immigration Act 2014 Section 22 compliant verification with automated checks',
    color: '#0d9488',
    bgColor: '#f0fdfa',
  },
  {
    icon: <Handshake className="size-7" />,
    title: 'Partner Ecosystem',
    desc: 'Banking referrals, insurance partnerships, and secure API integrations',
    color: '#ec4899',
    bgColor: '#fdf2f8',
  },
  {
    icon: <Bot className="size-7" />,
    title: 'AI Assistant',
    desc: 'Regulatory guidance chatbot with knowledge of UK GDPR, MLR 2017, and Immigration Act',
    color: '#6366f1',
    bgColor: '#eef2ff',
  },
  {
    icon: <Layers className="size-7" />,
    title: 'Workflow Engine',
    desc: 'Configurable compliance workflows with automated triggers and escalations',
    color: '#64748b',
    bgColor: '#f8fafc',
  },
];

// ─── How It Works ───────────────────────────────────────────────────
const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: 'Verify Identity',
    desc: 'Upload documents, biometric verification, build trust profile',
    icon: <ScanFace className="size-8" style={{ color: TEAL }} />,
  },
  {
    step: 2,
    title: 'Build Trust Profile',
    desc: 'Progressive verification builds trust score across 6 levels',
    icon: <TrendingUp className="size-8" style={{ color: TEAL }} />,
  },
  {
    step: 3,
    title: 'Access Properties',
    desc: 'Verified identity enables seamless cross-border property access',
    icon: <Building2 className="size-8" style={{ color: TEAL }} />,
  },
];

// ─── Pricing ────────────────────────────────────────────────────────
const PRICING_TIERS = [
  {
    name: 'Starter',
    price: '£99',
    period: '/month',
    desc: 'For small landlords & individual agents',
    features: ['Up to 50 tenants', 'Basic identity verification', 'Right to Rent compliance', 'Email support'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Professional',
    price: '£299',
    period: '/month',
    desc: 'For letting agencies & property managers',
    features: ['Up to 500 tenants', 'Advanced biometric verification', 'Full AML/KYC/CDD', 'Priority support'],
    cta: 'Get Started',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'pricing',
    desc: 'For large organizations & partners',
    features: ['Unlimited tenants', 'Government verification', 'API access', 'Dedicated account manager'],
    cta: 'Contact Sales',
    popular: false,
  },
];

// ─── Regulatory badges ──────────────────────────────────────────────
const REGULATORY_BADGES = [
  { name: 'UK GDPR', desc: 'General Data Protection Regulation compliance', icon: <Shield className="size-6" /> },
  { name: 'UK MLR 2017', desc: 'Money Laundering Regulations 2017', icon: <Scale className="size-6" /> },
  { name: 'FCA Guidance', desc: 'Financial Conduct Authority guidance', icon: <Landmark className="size-6" /> },
  { name: 'Immigration Act 2014', desc: 'Right to Rent Section 22 requirements', icon: <FileCheck className="size-6" /> },
];

// ─── Hero Floating Badges ───────────────────────────────────────────
const FLOATING_BADGES = [
  {
    label: 'Identity Verified',
    sublabel: 'L6 Certified',
    icon: <CheckCircle2 className="size-4" style={{ color: MINT }} />,
    iconBg: '#ecfdf5',
    position: 'top-2 -left-4 sm:-left-8',
    delay: 0.6,
  },
  {
    label: 'Risk Score',
    sublabel: 'Low Risk',
    icon: <Activity className="size-4" style={{ color: TEAL }} />,
    iconBg: '#f0fdfa',
    position: 'top-2 -right-4 sm:-right-8',
    delay: 0.75,
  },
  {
    label: 'Right to Rent',
    sublabel: 'Certified',
    icon: <CheckCircle2 className="size-4" style={{ color: MINT }} />,
    iconBg: '#ecfdf5',
    position: 'bottom-12 -left-4 sm:-left-10',
    delay: 0.9,
  },
  {
    label: 'Compliance',
    sublabel: 'Passed',
    icon: <CheckCircle2 className="size-4" style={{ color: MINT }} />,
    iconBg: '#ecfdf5',
    position: 'bottom-12 -right-4 sm:-right-10',
    delay: 1.05,
  },
];

// ─── Hero Globe Visual ──────────────────────────────────────────────
function HeroGlobe() {
  // Pre-compute scattered dots forming a vague world-map silhouette
  const dots = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    // Pseudo-random but deterministic cluster pattern
    const clusters = [
      { cx: 90, cy: 130, r: 60, n: 30 }, // Americas
      { cx: 200, cy: 120, r: 50, n: 22 }, // Europe
      { cx: 240, cy: 170, r: 55, n: 24 }, // Africa
      { cx: 300, cy: 130, r: 60, n: 28 }, // Asia
      { cx: 330, cy: 220, r: 35, n: 12 }, // Oceania
    ];
    let seed = 42;
    const rand = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    clusters.forEach((c) => {
      for (let i = 0; i < c.n; i++) {
        const angle = rand() * Math.PI * 2;
        const radius = rand() * c.r;
        points.push({
          x: c.cx + Math.cos(angle) * radius,
          y: c.cy + Math.sin(angle) * radius,
        });
      }
    });
    return points;
  }, []);

  const networkLines = useMemo(
    () => [
      'M 90,130 Q 200,80 300,130',
      'M 200,120 Q 260,160 330,220',
      'M 90,130 Q 150,200 240,170',
      'M 300,130 Q 220,180 200,120',
      'M 240,170 Q 320,180 330,220',
    ],
    [],
  );

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square">
      {/* Outer atmospheric glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
        className="absolute inset-0 rounded-full blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 50%, ${TEAL}40 0%, transparent 65%)` }}
      />

      {/* SVG network / world dots layer */}
      <motion.svg
        viewBox="0 0 400 400"
        className="absolute inset-0 w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.4 }}
      >
        {/* Network connection lines */}
        <g stroke={TEAL} strokeOpacity="0.25" strokeWidth="1" fill="none">
          {networkLines.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        {/* World-map dots */}
        <g fill={TEAL} fillOpacity="0.35">
          {dots.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r="1.6" />
          ))}
        </g>
        {/* Pulsing nodes */}
        <g fill={MINT}>
          <circle cx="90" cy="130" r="3">
            <animate attributeName="r" values="3;5;3" dur="2.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.4;1" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="200" cy="120" r="3">
            <animate attributeName="r" values="3;5;3" dur="2.5s" begin="0.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.4;1" dur="2.5s" begin="0.4s" repeatCount="indefinite" />
          </circle>
          <circle cx="300" cy="130" r="3">
            <animate attributeName="r" values="3;5;3" dur="2.5s" begin="0.8s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.4;1" dur="2.5s" begin="0.8s" repeatCount="indefinite" />
          </circle>
          <circle cx="240" cy="170" r="3">
            <animate attributeName="r" values="3;5;3" dur="2.5s" begin="1.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="1;0.4;1" dur="2.5s" begin="1.2s" repeatCount="indefinite" />
          </circle>
        </g>
      </motion.svg>

      {/* Globe sphere with shield center */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
        className="absolute inset-[14%] rounded-full flex items-center justify-center"
        style={{
          background: `radial-gradient(circle at 30% 30%, ${TEAL}, ${MINT} 55%, ${TEAL} 100%)`,
          boxShadow: `0 30px 60px -15px ${TEAL}80, inset 0 0 80px rgba(255,255,255,0.25), inset -20px -30px 60px rgba(6,95,70,0.4)`,
        }}
      >
        {/* Latitude/longitude lines */}
        <div
          className="absolute inset-0 rounded-full opacity-30"
          style={{
            backgroundImage: `
              repeating-linear-gradient(0deg, transparent 0, transparent 18px, rgba(255,255,255,0.4) 18px, rgba(255,255,255,0.4) 19px),
              repeating-linear-gradient(90deg, transparent 0, transparent 18px, rgba(255,255,255,0.4) 18px, rgba(255,255,255,0.4) 19px)
            `,
          }}
        />
        {/* Central shield */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.7 }}
          className="relative z-10 size-24 sm:size-28 rounded-2xl bg-white shadow-2xl flex items-center justify-center"
          style={{ boxShadow: '0 20px 50px -10px rgba(0,0,0,0.4)' }}
        >
          <ShieldCheck className="size-14 sm:size-16" style={{ color: NAVY }} />
        </motion.div>
      </motion.div>

      {/* Glowing teal base platform */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0.4 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-[55%] h-6 rounded-full"
        style={{
          background: `linear-gradient(to bottom, ${NAVY}80, ${NAVY}10)`,
          boxShadow: `0 0 40px ${TEAL}80, 0 8px 24px rgba(0,0,0,0.15)`,
        }}
      />
      <motion.div
        initial={{ opacity: 0, scaleX: 0.3 }}
        animate={{ opacity: 0.8, scaleX: 1 }}
        transition={{ duration: 0.9, delay: 0.6 }}
        className="absolute bottom-[7%] left-1/2 -translate-x-1/2 w-[70%] h-3 rounded-full blur-md"
        style={{ background: TEAL }}
      />

      {/* Floating Badges */}
      {FLOATING_BADGES.map((badge, i) => (
        <motion.div
          key={i}
          className={`absolute z-20 ${badge.position}`}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: [0, -8, 0],
          }}
          transition={{
            opacity: { duration: 0.4, delay: badge.delay },
            scale: { duration: 0.5, delay: badge.delay, type: 'spring' },
            y: {
              repeat: Infinity,
              duration: 3 + i * 0.4,
              ease: 'easeInOut',
              delay: badge.delay + 0.5,
            },
          }}
        >
          <div className="flex items-center gap-2 bg-white shadow-xl rounded-xl px-3 py-2 border border-slate-100 backdrop-blur-sm">
            <div
              className="size-7 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: badge.iconBg }}
            >
              {badge.icon}
            </div>
            <div className="pr-1">
              <div className="text-xs font-bold leading-tight" style={{ color: NAVY }}>
                {badge.label}
              </div>
              <div className="text-[10px] leading-tight" style={{ color: DARK_GRAY }}>
                {badge.sublabel}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openMobileDropdown, setOpenMobileDropdown] = useState<string | null>(null);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
    setOpenMobileDropdown(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Login Modal */}
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />

      {/* ─── 1. Sticky Navigation Bar ──────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <button onClick={() => scrollToSection('hero')} className="flex items-center gap-2.5 shrink-0">
            <img src="/logo.png" alt="PropComply AI Logo" className="size-9 rounded-lg object-contain" />
            <div className="text-left leading-tight">
              <div className="text-base font-bold tracking-tight" style={{ color: TEAL }}>
                PropComply AI
              </div>
              <div className="text-[10px] font-medium text-slate-500 -mt-0.5">+ VerifyMe Global</div>
            </div>
          </button>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-1 text-sm font-medium" style={{ color: DARK_GRAY }}>
            {NAV_ITEMS.map((item) =>
              item.dropdown ? (
                <DropdownMenu key={item.label}>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 px-3 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors">
                      {item.label}
                      <ChevronDown className="size-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="w-56">
                    {item.dropdown.map((sub) => (
                      <DropdownMenuItem
                        key={sub.label}
                        onClick={() => scrollToSection(sub.section)}
                        className="cursor-pointer"
                      >
                        {sub.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.section!)}
                  className="px-3 py-2 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  {item.label}
                </button>
              ),
            )}
          </div>

          {/* Right Side CTAs */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={() => setLoginOpen(true)}
              className="hidden sm:inline-flex text-sm font-semibold hover:opacity-70 transition-opacity"
              style={{ color: TEAL }}
            >
              Sign In
            </button>
            <Button
              size="sm"
              onClick={() => setLoginOpen(true)}
              className="hidden sm:inline-flex h-9 px-4 text-white shadow-sm hover:opacity-90"
              style={{ backgroundColor: NAVY }}
            >
              Get Started <ArrowRight className="size-4 ml-1.5" />
            </Button>

            {/* Mobile Hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t bg-white px-4 pb-4 max-h-[80vh] overflow-y-auto"
          >
            <div className="flex flex-col gap-1 pt-2">
              {NAV_ITEMS.map((item) =>
                item.dropdown ? (
                  <div key={item.label}>
                    <button
                      onClick={() =>
                        setOpenMobileDropdown(openMobileDropdown === item.label ? null : item.label)
                      }
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                      style={{ color: DARK_GRAY }}
                    >
                      {item.label}
                      <ChevronDown
                        className={`size-4 transition-transform ${openMobileDropdown === item.label ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {openMobileDropdown === item.label && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="ml-3 mt-1 border-l-2 border-slate-100 pl-3 space-y-0.5"
                      >
                        {item.dropdown.map((sub) => (
                          <button
                            key={sub.label}
                            onClick={() => scrollToSection(sub.section)}
                            className="w-full text-left px-3 py-1.5 rounded-md text-xs font-medium hover:bg-slate-50 transition-colors"
                            style={{ color: DARK_GRAY }}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <button
                    key={item.label}
                    onClick={() => scrollToSection(item.section!)}
                    className="text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                    style={{ color: DARK_GRAY }}
                  >
                    {item.label}
                  </button>
                ),
              )}
              <Separator className="my-2" />
              <Button
                size="sm"
                className="w-full text-white h-9"
                style={{ backgroundColor: NAVY }}
                onClick={() => {
                  setLoginOpen(true);
                  setMobileMenuOpen(false);
                }}
              >
                Get Started <ArrowRight className="size-4 ml-1.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-9"
                style={{ color: TEAL }}
                onClick={() => {
                  setLoginOpen(true);
                  setMobileMenuOpen(false);
                }}
              >
                Sign In
              </Button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ─── 2. Hero Section ────────────────────────────────────────── */}
      <section
        id="hero"
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, #f0fdfa 0%, #ffffff 50%, #ecfdf5 100%)` }}
      >
        {/* Decorative blurred blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-40"
            style={{ backgroundColor: `${TEAL}20` }}
          />
          <div
            className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-30"
            style={{ backgroundColor: `${MINT}20` }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left - Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center lg:text-left order-2 lg:order-1"
            >
              <Badge
                variant="outline"
                className="mb-6 text-xs sm:text-sm px-3 py-1 border-teal-300 text-teal-700 bg-teal-50/80"
              >
                <Sparkles className="size-3.5 mr-1.5" />
                The Trust Infrastructure Platform
              </Badge>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]" style={{ color: NAVY }}>
                The <span style={{ color: TEAL }}>Trust Infrastructure</span>{' '}
                for Cross-Border Property
              </h1>

              <p className="mt-6 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed" style={{ color: DARK_GRAY }}>
                PropComply AI + VerifyMe Global is the first platform combining identity verification,
                compliance automation, risk intelligence, and property compliance into a single trust
                infrastructure.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Button
                  size="lg"
                  onClick={() => setLoginOpen(true)}
                  className="h-12 px-8 text-white shadow-lg text-base hover:opacity-90"
                  style={{ backgroundColor: NAVY }}
                >
                  Get Started <ArrowRight className="size-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setLoginOpen(true)}
                  className="h-12 px-8 text-base bg-white"
                  style={{ borderColor: NAVY, color: NAVY }}
                >
                  <Clock className="size-4 mr-2" /> Book Demo
                </Button>
              </div>
            </motion.div>

            {/* Right - Globe Visual */}
            <div className="order-1 lg:order-2 py-8 sm:py-12 lg:py-0">
              <HeroGlobe />
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. Key Metrics Row ─────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {METRICS.map((metric, i) => (
              <StaggerChild key={i} index={i}>
                <Card className="h-full border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5 sm:p-6 flex flex-col items-center text-center">
                    <div className="size-12 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${TEAL}10` }}>
                      {metric.icon}
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold" style={{ color: NAVY }}>
                      {metric.value}
                    </div>
                    <div className="text-xs sm:text-sm mt-1.5 leading-snug" style={{ color: DARK_GRAY }}>
                      {metric.label}
                    </div>
                  </CardContent>
                </Card>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. The Compliance Gap Section ──────────────────────────── */}
      <section id="compliance-gap" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection className="text-center mb-12 max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-4 text-xs border-red-200 text-red-700 bg-red-50/80 px-3 py-1">
              <AlertTriangle className="size-3 mr-1.5" />
              The Problem
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight" style={{ color: NAVY }}>
              The Compliance Gap Nobody Solves
            </h2>
            <p className="mt-4 text-base sm:text-lg" style={{ color: DARK_GRAY }}>
              Cross-border property transactions are plagued by fraud, compliance failures, and a
              fundamental lack of trust infrastructure.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-3 gap-6">
            {PROBLEM_STATEMENTS.map((problem, i) => (
              <StaggerChild key={i} index={i}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border border-slate-200 shadow-sm">
                  <CardContent className="p-6 sm:p-7">
                    <div
                      className="size-14 rounded-2xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: problem.iconBg }}
                    >
                      {problem.icon}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold" style={{ color: NAVY }}>
                        {problem.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-xs px-2 py-0 font-semibold"
                        style={{ color: problem.tagColor, borderColor: `${problem.tagColor}40`, backgroundColor: `${problem.tagColor}10` }}
                      >
                        {problem.tag}
                      </Badge>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: DARK_GRAY }}>
                      {problem.desc}
                    </p>
                  </CardContent>
                </Card>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. Trust Infrastructure Section ────────────────────────── */}
      <section id="trust-infrastructure" className="py-16 sm:py-24" style={{ backgroundColor: LIGHT_BG }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection className="text-center mb-12 max-w-3xl mx-auto">
            <Badge variant="outline" className="mb-4 text-xs border-teal-200 text-teal-700 bg-teal-50/80 px-3 py-1">
              <Star className="size-3 mr-1.5" />
              New Category
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight" style={{ color: NAVY }}>
              A New Category: Trust Infrastructure
            </h2>
            <p className="mt-4 text-base sm:text-lg" style={{ color: DARK_GRAY }}>
              We don&apos;t just verify identities — we build portable trust that travels with tenants across
              borders and properties.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-3 gap-6">
            {TRUST_FEATURES.map((feature, i) => (
              <StaggerChild key={i} index={i}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 border border-slate-200 shadow-sm">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <div className="size-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#ecfdf5' }}>
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: NAVY }}>
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: DARK_GRAY }}>
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. Platform Modules Section ────────────────────────────── */}
      <section id="modules" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight" style={{ color: NAVY }}>
              8 Integrated Platform Modules
            </h2>
            <p className="mt-4 text-base sm:text-lg" style={{ color: DARK_GRAY }}>
              A comprehensive suite of interconnected modules covering every aspect of property compliance
              and identity trust.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {PLATFORM_MODULES.map((mod, i) => (
              <StaggerChild key={i} index={i}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 group cursor-pointer border border-slate-200 shadow-sm">
                  <CardContent className="p-5 sm:p-6">
                    <div
                      className="size-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: mod.bgColor, color: mod.color }}
                    >
                      {mod.icon}
                    </div>
                    <h3 className="font-bold text-base" style={{ color: NAVY }}>
                      {mod.title}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm leading-relaxed" style={{ color: DARK_GRAY }}>
                      {mod.desc}
                    </p>
                  </CardContent>
                </Card>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. How It Works Section ────────────────────────────────── */}
      <section id="how-it-works" className="py-16 sm:py-24" style={{ backgroundColor: LIGHT_BG }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight" style={{ color: NAVY }}>
              How It Works
            </h2>
            <p className="mt-4 text-base sm:text-lg" style={{ color: DARK_GRAY }}>
              Three simple steps from identity verification to property access.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 relative">
            {/* Connecting lines (desktop only) */}
            <div
              className="hidden sm:block absolute top-12 left-[16.67%] right-[16.67%] h-0.5"
              style={{ backgroundColor: `${TEAL}30` }}
            />

            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <StaggerChild key={i} index={i}>
                <div className="text-center relative">
                  <div className="relative z-10">
                    <div
                      className="size-20 sm:size-24 rounded-2xl flex items-center justify-center mx-auto shadow-lg border-4 border-white"
                      style={{ backgroundColor: `${TEAL}10` }}
                    >
                      {step.icon}
                    </div>
                    <div
                      className="size-7 rounded-full flex items-center justify-center text-white text-xs font-bold mx-auto -mt-3.5 relative z-20 shadow-md"
                      style={{ backgroundColor: TEAL }}
                    >
                      {step.step}
                    </div>
                  </div>
                  <h3 className="mt-4 text-lg font-bold" style={{ color: NAVY }}>
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: DARK_GRAY }}>
                    {step.desc}
                  </p>
                </div>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. Pricing Section ─────────────────────────────────────── */}
      <section id="pricing" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight" style={{ color: NAVY }}>
              Choose Your Plan
            </h2>
            <p className="mt-4 text-base sm:text-lg" style={{ color: DARK_GRAY }}>
              Flexible pricing for landlords, agents, and enterprise organisations.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {PRICING_TIERS.map((tier, i) => (
              <StaggerChild key={i} index={i}>
                <Card
                  className={`h-full relative hover:shadow-xl transition-all duration-300 ${
                    tier.popular
                      ? 'shadow-lg border-2 sm:scale-[1.03]'
                      : 'shadow-sm border border-slate-200'
                  }`}
                  style={{ borderColor: tier.popular ? TEAL : undefined }}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="text-white px-3 py-0.5 text-xs shadow-md" style={{ backgroundColor: TEAL }}>
                        <Star className="size-3 mr-1" /> Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2 pt-6">
                    <CardTitle className="text-lg" style={{ color: NAVY }}>
                      {tier.name}
                    </CardTitle>
                    <CardDescription className="text-sm">{tier.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mt-2 mb-6">
                      <span className="text-4xl font-extrabold" style={{ color: NAVY }}>
                        {tier.price}
                      </span>
                      <span className="text-sm ml-1" style={{ color: DARK_GRAY }}>
                        {tier.period}
                      </span>
                    </div>
                    <ul className="space-y-3 text-left mb-8">
                      {tier.features.map((feature, fi) => (
                        <li key={fi} className="flex items-start gap-2 text-sm" style={{ color: DARK_GRAY }}>
                          <CheckCircle2 className="size-4 shrink-0 mt-0.5" style={{ color: MINT }} />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full h-11"
                      variant={tier.popular ? 'default' : 'outline'}
                      style={
                        tier.popular
                          ? { backgroundColor: NAVY, color: 'white' }
                          : { borderColor: NAVY, color: NAVY }
                      }
                      onClick={() => setLoginOpen(true)}
                    >
                      {tier.cta} <ArrowRight className="size-4 ml-1" />
                    </Button>
                  </CardContent>
                </Card>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 9. Regulatory Compliance Section ───────────────────────── */}
      <section id="regulatory" className="py-16 sm:py-24" style={{ backgroundColor: LIGHT_BG }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection className="text-center mb-12 max-w-3xl mx-auto">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight" style={{ color: NAVY }}>
              Regulatory Compliance
            </h2>
            <p className="mt-4 text-base sm:text-lg" style={{ color: DARK_GRAY }}>
              Built from the ground up to meet and exceed UK regulatory requirements.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {REGULATORY_BADGES.map((badge, i) => (
              <StaggerChild key={i} index={i}>
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 text-center border border-slate-200 shadow-sm">
                  <CardContent className="p-5 sm:p-6">
                    <div
                      className="size-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                      style={{ backgroundColor: `${NAVY}10`, color: NAVY }}
                    >
                      {badge.icon}
                    </div>
                    <h3 className="font-bold text-sm sm:text-base" style={{ color: NAVY }}>
                      {badge.name}
                    </h3>
                    <p className="mt-1 text-xs sm:text-sm" style={{ color: DARK_GRAY }}>
                      {badge.desc}
                    </p>
                  </CardContent>
                </Card>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 10. CTA Footer ─────────────────────────────────────────── */}
      <section id="cta" style={{ backgroundColor: NAVY }} className="mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <AnimatedSection>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Ready to Transform Cross-Border
              <br className="hidden sm:block" /> Property Compliance?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-white/70 max-w-2xl mx-auto">
              Join leading property managers and compliance teams who trust PropComply AI + VerifyMe
              Global for their identity and compliance needs.
            </p>
            <div className="mt-8">
              <Button
                size="lg"
                onClick={() => setLoginOpen(true)}
                className="h-12 px-10 text-base bg-white shadow-lg hover:bg-white/90"
                style={{ color: NAVY }}
              >
                Get Started Today <ArrowRight className="size-5 ml-2" />
              </Button>
            </div>
          </AnimatedSection>

          <Separator className="my-10 bg-white/10" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-white/50 text-xs sm:text-sm">
            <span>&copy; 2025 PropComply AI + VerifyMe Global. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <button className="hover:text-white/80 transition-colors">Privacy Policy</button>
              <button className="hover:text-white/80 transition-colors">Terms of Service</button>
              <button className="hover:text-white/80 transition-colors">Contact</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
