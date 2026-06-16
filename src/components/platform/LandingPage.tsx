'use client';

import { useState, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { motion, useInView } from 'framer-motion';
import {
  Shield,
  Eye,
  EyeOff,
  LogIn,
  ArrowRight,
  Lock,
  Mail,
  Building2,
  Users,
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
  Zap,
  Landmark,
  Scale,
  Fingerprint,
  Award,
  CreditCard,
  ChevronRight,
  Sparkles,
  Play,
  X,
  Menu,
  Layers,
  PoundSterling,
  Server,
  LayoutGrid,
  ArrowDown,
  CircleDot,
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
import { ROLE_DEFINITIONS, type UserRole } from '@/lib/rbac';

// ─── Color Constants ────────────────────────────────────────────────
const NAVY = '#002E5D';
const TEAL = '#00A79D';
const MINT = '#10b981';
const LIGHT_BG = '#f8fffe';
const DARK_GRAY = '#374151';

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

  const handleQuickLogin = async (account: typeof DEMO_ACCOUNTS[0]) => {
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
            <DialogTitle className="text-xl">Sign In</DialogTitle>
          </div>
          <DialogDescription>
            Access the PropComply AI Trust Infrastructure Platform
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="modal-email">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="modal-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9 h-11" required autoComplete="email" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="modal-password">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="modal-password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 pr-10 h-11" required autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
          {loginError && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {loginError}
            </motion.div>
          )}
          <Button type="submit" className="w-full h-11 text-white shadow-md" style={{ background: `linear-gradient(to right, #059669, ${TEAL})` }} disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2"><div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</div>
            ) : (
              <div className="flex items-center gap-2"><LogIn className="size-4" />Sign In</div>
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-3">Protected by enterprise-grade security · Zero Trust Architecture</p>
          <Button variant="ghost" size="sm" style={{ color: TEAL }} onClick={() => setShowDemoAccounts(!showDemoAccounts)}>
            {showDemoAccounts ? 'Hide' : 'Show'} Demo Accounts
            <ChevronRight className={`size-4 ml-1 transition-transform ${showDemoAccounts ? 'rotate-90' : ''}`} />
          </Button>
        </div>

        {showDemoAccounts && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-2 max-h-64 overflow-y-auto">
            <Separator />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pt-1">Quick Access Demo Accounts</p>
            {DEMO_ACCOUNTS.map((account) => {
              const roleDef = ROLE_DEFINITIONS[account.role];
              return (
                <button key={account.role} onClick={() => handleQuickLogin(account)} disabled={isLoading} className="w-full flex items-center gap-3 p-2.5 rounded-lg border bg-white hover:bg-slate-50 hover:border-teal-300 transition-all duration-200 group text-left">
                  <div className="flex size-8 items-center justify-center rounded-lg shrink-0" style={{ backgroundColor: roleDef.bgColor, color: roleDef.color }}>
                    {ROLE_ICONS[account.role]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{roleDef.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{account.email}</div>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0" style={{ borderColor: roleDef.color + '40', color: roleDef.color, backgroundColor: roleDef.bgColor }}>
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

// ─── Data ────────────────────────────────────────────────────────────
const NAV_ITEMS = ['Home', 'Platform', 'Pricing', 'About', 'Compliance', 'Resources'];

const STATS = [
  { value: '£10,000', label: 'Penalty per illegal tenant', icon: <PoundSterling className="size-6" style={{ color: NAVY }} /> },
  { value: '6', label: 'Compliance frameworks', icon: <Scale className="size-6" style={{ color: NAVY }} /> },
  { value: '8', label: 'Platform modules', icon: <LayoutGrid className="size-6" style={{ color: NAVY }} /> },
  { value: '99.9%', label: 'System uptime', icon: <Server className="size-6" style={{ color: NAVY }} /> },
];

const PROBLEM_STATEMENTS = [
  {
    title: 'Fragmented Identity Verification',
    desc: 'No portable identity across properties — tenants re-verify from scratch every time, creating friction and data silos.',
    icon: <Fingerprint className="size-5" style={{ color: '#ef4444' }} />,
  },
  {
    title: 'Manual Compliance Processes',
    desc: 'Paper-based, error-prone Right to Rent checks — manual document reviews lead to compliance gaps and £10,000 penalties.',
    icon: <FileCheck className="size-5" style={{ color: '#f59e0b' }} />,
  },
  {
    title: 'Zero Cross-Border Trust',
    desc: 'No framework for international tenant verification — no standardised way to trust identity across jurisdictions.',
    icon: <Globe className="size-5" style={{ color: '#ef4444' }} />,
  },
];

const TRUST_LADDER_STEPS = [
  { step: 1, name: 'Self-Declared', desc: 'Basic registration' },
  { step: 2, name: 'Documented', desc: 'ID uploaded' },
  { step: 3, name: 'Biometric Verified', desc: 'Liveness + face match' },
  { step: 4, name: 'Financially Linked', desc: 'Open banking verified' },
  { step: 5, name: 'Government Verified', desc: 'Database cross-checks' },
];

const TRUST_FEATURES = [
  {
    title: 'Identity Verified',
    desc: 'Portable verified identities that move with tenants across properties and borders',
    icon: <CheckCircle2 className="size-6" style={{ color: MINT }} />,
  },
  {
    title: 'Right to Rent Certified',
    desc: 'Automated Immigration Act 2014 compliance with real-time status verification',
    icon: <CheckCircle2 className="size-6" style={{ color: MINT }} />,
  },
  {
    title: 'Compliance Focused',
    desc: 'AML/KYC/CDD/EDD automation with continuous monitoring and audit trails',
    icon: <CheckCircle2 className="size-6" style={{ color: MINT }} />,
  },
];

const PLATFORM_MODULES = [
  { icon: <Shield className="size-7" />, title: 'Identity & Trust', desc: '6-level Trust Ladder with progressive identity assurance and portable credentials', color: '#10b981', bgColor: '#ecfdf5' },
  { icon: <FileCheck className="size-7" />, title: 'Compliance Automation', desc: 'AML/KYC/CDD/EDD workflows with automated screening and regulatory monitoring', color: '#06b6d4', bgColor: '#ecfeff' },
  { icon: <AlertTriangle className="size-7" />, title: 'Risk Intelligence', desc: 'ML-powered risk scoring, fraud detection, and explainable AI analytics', color: '#f59e0b', bgColor: '#fffbeb' },
  { icon: <Building2 className="size-7" />, title: 'Property Intelligence', desc: 'Right to Rent verification, guarantor replacement, and compliance intelligence', color: '#8b5cf6', bgColor: '#f5f3ff' },
  { icon: <Landmark className="size-7" />, title: 'Right to Rent', desc: 'Immigration Act 2014 Section 22 compliant verification with automated checks', color: '#0d9488', bgColor: '#f0fdfa' },
  { icon: <Handshake className="size-7" />, title: 'Partner Ecosystem', desc: 'Banking referrals, insurance partnerships, and secure API integrations', color: '#ec4899', bgColor: '#fdf2f8' },
  { icon: <Bot className="size-7" />, title: 'AI Assistant', desc: 'Regulatory guidance chatbot with knowledge of UK GDPR, MLR 2017, and Immigration Act', color: '#6366f1', bgColor: '#eef2ff' },
  { icon: <Layers className="size-7" />, title: 'Workflow Engine', desc: 'Configurable compliance workflows with automated triggers and escalations', color: '#64748b', bgColor: '#f8fafc' },
];

const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    title: 'Verify Identity',
    desc: 'Upload documents and complete biometric verification — passport, visa, and liveness detection in minutes',
    icon: <ScanFace className="size-8" style={{ color: TEAL }} />,
  },
  {
    step: 2,
    title: 'Build Trust Profile',
    desc: 'Progressive verification builds your trust score — from self-declared to government verified across jurisdictions',
    icon: <TrendingUp className="size-8" style={{ color: TEAL }} />,
  },
  {
    step: 3,
    title: 'Access Properties',
    desc: 'Verified identity enables seamless property access — portable credentials recognised across the UK property market',
    icon: <Building2 className="size-8" style={{ color: TEAL }} />,
  },
];

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

const REGULATORY_BADGES = [
  { name: 'UK GDPR', desc: 'General Data Protection Regulation compliance', icon: <Shield className="size-5" /> },
  { name: 'UK MLR 2017', desc: 'Money Laundering Regulations 2017', icon: <Scale className="size-5" /> },
  { name: 'FCA Guidance', desc: 'Financial Conduct Authority guidance', icon: <Landmark className="size-5" /> },
  { name: 'Immigration Act 2014', desc: 'Right to Rent Section 22 requirements', icon: <FileCheck className="size-5" /> },
];

// ─── Main Component ──────────────────────────────────────────────────
export default function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Login Modal */}
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />

      {/* ─── 1. Sticky Navigation Bar ──────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="PropComply AI Logo" className="size-9 rounded-lg object-contain" />
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold tracking-tight leading-tight" style={{ color: NAVY }}>PropComply AI + VerifyMe Global</h1>
            </div>
            <span className="sm:hidden text-sm font-bold" style={{ color: NAVY }}>PropComply</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-5 text-sm font-medium" style={{ color: DARK_GRAY }}>
            {NAV_ITEMS.map((item) => (
              <button
                key={item}
                onClick={() => {
                  const sectionMap: Record<string, string> = {
                    Home: 'hero',
                    Platform: 'modules',
                    Pricing: 'pricing',
                    About: 'compliance-gap',
                    Compliance: 'regulatory',
                    Resources: 'trust-infrastructure',
                  };
                  scrollToSection(sectionMap[item] || 'hero');
                }}
                className="hover:opacity-70 transition-opacity"
              >
                {item}
              </button>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={() => setLoginOpen(true)}
              className="hidden sm:flex text-white shadow-sm h-9"
              style={{ backgroundColor: NAVY }}
            >
              Request a Demo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLoginOpen(true)}
              className="hidden sm:flex h-9"
              style={{ borderColor: NAVY, color: NAVY }}
            >
              Login
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
            className="lg:hidden border-t bg-white px-4 pb-4"
          >
            <div className="flex flex-col gap-1 pt-2">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    const sectionMap: Record<string, string> = {
                      Home: 'hero',
                      Platform: 'modules',
                      Pricing: 'pricing',
                      About: 'compliance-gap',
                      Compliance: 'regulatory',
                      Resources: 'trust-infrastructure',
                    };
                    scrollToSection(sectionMap[item] || 'hero');
                  }}
                  className="text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
                  style={{ color: DARK_GRAY }}
                >
                  {item}
                </button>
              ))}
              <Separator className="my-2" />
              <Button
                size="sm"
                className="w-full text-white h-9"
                style={{ backgroundColor: NAVY }}
                onClick={() => { setLoginOpen(true); setMobileMenuOpen(false); }}
              >
                Request a Demo
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full h-9"
                style={{ borderColor: NAVY, color: NAVY }}
                onClick={() => { setLoginOpen(true); setMobileMenuOpen(false); }}
              >
                Login
              </Button>
            </div>
          </motion.div>
        )}
      </nav>

      {/* ─── 2. Hero Section ────────────────────────────────────────── */}
      <section id="hero" className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, #f0fdfa 0%, ${LIGHT_BG} 40%, #ecfdf5 100%)` }}>
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: `${TEAL}15` }} />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: `${MINT}10` }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Shield + Globe imagery */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.2 }}
                className="relative"
              >
                <div className="size-20 sm:size-24 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${TEAL}, ${MINT})` }}>
                  <Shield className="size-10 sm:size-12 text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 size-8 sm:size-9 rounded-lg flex items-center justify-center shadow-md bg-white border" >
                  <Globe className="size-4 sm:size-5" style={{ color: NAVY }} />
                </div>
              </motion.div>
            </div>

            <Badge variant="outline" className="mb-6 text-xs sm:text-sm px-3 py-1 border-emerald-300 text-emerald-700 bg-emerald-50/80">
              <Sparkles className="size-3.5 mr-1.5" />
              The Trust Infrastructure Platform
            </Badge>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]" style={{ color: NAVY }}>
              The Trust Infrastructure{' '}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, ${TEAL}, ${MINT})` }}>
                for Cross-Border Property
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed" style={{ color: DARK_GRAY }}>
              PropComply AI + VerifyMe Global provides portable identity verification, automated compliance, and risk intelligence for cross-border property transactions.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                size="lg"
                onClick={() => setLoginOpen(true)}
                className="h-12 px-8 text-white shadow-lg text-base"
                style={{ backgroundColor: NAVY }}
              >
                Get Started <ArrowRight className="size-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setLoginOpen(true)}
                className="h-12 px-8 text-base"
                style={{ borderColor: NAVY, color: NAVY }}
              >
                Book Demo <Play className="size-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── 3. Statistics Bar ──────────────────────────────────────── */}
      <section className="relative -mt-1" style={{ backgroundColor: NAVY }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {STATS.map((stat, i) => (
              <StaggerChild key={i} index={i}>
                <div className="text-center p-4 sm:p-6 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <div className="flex items-center justify-center mb-2">
                    <div className="size-10 rounded-lg flex items-center justify-center bg-white/15">
                      {stat.icon}
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-white/70 mt-1">{stat.label}</div>
                </div>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. The Compliance Gap Section ──────────────────────────── */}
      <section id="compliance-gap" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left - Problem Statements */}
            <div>
              <AnimatedSection>
                <Badge variant="outline" className="mb-4 text-xs border-red-200 text-red-700 bg-red-50/80 px-3 py-1">
                  <AlertTriangle className="size-3 mr-1.5" />
                  Nobody Solves This
                </Badge>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight" style={{ color: NAVY }}>
                  The Compliance Gap<br />Nobody Solves
                </h2>
                <p className="mt-4 text-base" style={{ color: DARK_GRAY }}>
                  Cross-border property transactions are broken. Fragmented systems, manual processes, and zero trust frameworks create risk for everyone.
                </p>
              </AnimatedSection>

              <div className="mt-8 space-y-4">
                {PROBLEM_STATEMENTS.map((problem, i) => (
                  <StaggerChild key={i} index={i}>
                    <Card className="border-l-4 border-l-red-400 hover:shadow-md transition-shadow">
                      <CardContent className="p-4 sm:p-5 flex gap-4">
                        <div className="size-10 rounded-lg flex items-center justify-center shrink-0 bg-red-50">
                          {problem.icon}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm sm:text-base" style={{ color: NAVY }}>{problem.title}</h3>
                          <p className="text-sm mt-1" style={{ color: DARK_GRAY }}>{problem.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </StaggerChild>
                ))}
              </div>
            </div>

            {/* Right - Trust Ladder Visualization */}
            <AnimatedSection delay={0.2}>
              <div className="sticky top-24">
                <h3 className="text-lg font-bold mb-6" style={{ color: NAVY }}>
                  The Trust Ladder
                </h3>
                <div className="relative">
                  {TRUST_LADDER_STEPS.map((step, i) => {
                    const widthPercent = 40 + (i * 15);
                    return (
                      <motion.div
                        key={step.step}
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.15, duration: 0.4 }}
                      >
                        <div
                          className="mb-3 flex items-center gap-3"
                          style={{ maxWidth: `${widthPercent}%` }}
                        >
                          <div
                            className="size-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: i < 2 ? '#94a3b8' : i < 4 ? TEAL : MINT }}
                          >
                            {step.step}
                          </div>
                          <div
                            className="flex-1 rounded-lg px-4 py-3 border"
                            style={{
                              backgroundColor: i < 2 ? '#f1f5f9' : i < 4 ? '#f0fdfa' : '#ecfdf5',
                              borderColor: i < 2 ? '#e2e8f0' : i < 4 ? `${TEAL}30` : `${MINT}30`,
                            }}
                          >
                            <div className="font-semibold text-sm" style={{ color: NAVY }}>{step.name}</div>
                            <div className="text-xs" style={{ color: DARK_GRAY }}>{step.desc}</div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  {/* Arrow indicating progression */}
                  <div className="flex items-center gap-2 mt-2" style={{ paddingLeft: '1rem' }}>
                    <ArrowDown className="size-4" style={{ color: MINT }} />
                    <span className="text-xs font-medium" style={{ color: MINT }}>Higher trust = More access</span>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── 5. Trust Infrastructure Section ────────────────────────── */}
      <section id="trust-infrastructure" className="py-16 sm:py-24" style={{ backgroundColor: LIGHT_BG }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection className="text-center mb-12">
            <Badge variant="outline" className="mb-4 text-xs border-teal-200 text-teal-700 bg-teal-50/80 px-3 py-1">
              <Star className="size-3 mr-1.5" />
              New Category
            </Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight" style={{ color: NAVY }}>
              A New Category: Trust Infrastructure
            </h2>
            <p className="mt-4 text-base max-w-2xl mx-auto" style={{ color: DARK_GRAY }}>
              We don&apos;t just verify identities — we build portable trust that travels with tenants across borders and properties.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-3 gap-6">
            {TRUST_FEATURES.map((feature, i) => (
              <StaggerChild key={i} index={i}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-sm">
                  <CardContent className="p-6 sm:p-8 text-center">
                    <div className="size-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#ecfdf5' }}>
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: NAVY }}>{feature.title}</h3>
                    <p className="mt-2 text-sm" style={{ color: DARK_GRAY }}>{feature.desc}</p>
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
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight" style={{ color: NAVY }}>
              8 Integrated Platform Modules
            </h2>
            <p className="mt-4 text-base max-w-2xl mx-auto" style={{ color: DARK_GRAY }}>
              A comprehensive suite of interconnected modules covering every aspect of property compliance and identity trust.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {PLATFORM_MODULES.map((mod, i) => (
              <StaggerChild key={i} index={i}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 group cursor-pointer border shadow-sm">
                  <CardContent className="p-5 sm:p-6">
                    <div
                      className="size-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: mod.bgColor, color: mod.color }}
                    >
                      {mod.icon}
                    </div>
                    <h3 className="font-bold text-sm sm:text-base" style={{ color: NAVY }}>{mod.title}</h3>
                    <p className="mt-1.5 text-xs sm:text-sm leading-relaxed" style={{ color: DARK_GRAY }}>{mod.desc}</p>
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
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight" style={{ color: NAVY }}>
              How It Works
            </h2>
            <p className="mt-4 text-base max-w-2xl mx-auto" style={{ color: DARK_GRAY }}>
              Three simple steps from identity verification to property access.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 relative">
            {/* Connecting lines (desktop only) */}
            <div className="hidden sm:block absolute top-16 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-0.5" style={{ backgroundColor: `${TEAL}30` }} />
            <div className="hidden sm:flex absolute top-16 left-[calc(50%+2rem)] h-0.5 right-[calc(16.67%+2rem)]" style={{ backgroundColor: `${TEAL}30` }} />

            {HOW_IT_WORKS_STEPS.map((step, i) => (
              <StaggerChild key={i} index={i}>
                <div className="text-center relative">
                  <div className="relative z-10">
                    <div
                      className="size-16 rounded-2xl flex items-center justify-center mx-auto shadow-lg border-4 border-white"
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
                  <h3 className="mt-4 text-lg font-bold" style={{ color: NAVY }}>{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: DARK_GRAY }}>{step.desc}</p>
                </div>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. Pricing Section ─────────────────────────────────────── */}
      <section id="pricing" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight" style={{ color: NAVY }}>
              Choose Your Plan
            </h2>
            <p className="mt-4 text-base max-w-2xl mx-auto" style={{ color: DARK_GRAY }}>
              Flexible pricing for landlords, agents, and enterprise organisations.
            </p>
          </AnimatedSection>

          <div className="grid sm:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {PRICING_TIERS.map((tier, i) => (
              <StaggerChild key={i} index={i}>
                <Card className={`h-full relative hover:shadow-xl transition-all duration-300 ${tier.popular ? 'shadow-lg border-2 scale-[1.02] sm:scale-105' : 'shadow-sm'}`} style={{ borderColor: tier.popular ? TEAL : undefined }}>
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="text-white px-3 py-0.5 text-xs shadow-md" style={{ backgroundColor: TEAL }}>
                        <Star className="size-3 mr-1" /> Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2 pt-6">
                    <CardTitle className="text-lg" style={{ color: NAVY }}>{tier.name}</CardTitle>
                    <CardDescription className="text-sm">{tier.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mt-2 mb-6">
                      <span className="text-4xl font-extrabold" style={{ color: NAVY }}>{tier.price}</span>
                      <span className="text-sm ml-1" style={{ color: DARK_GRAY }}>{tier.period}</span>
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
                      style={tier.popular ? { backgroundColor: NAVY, color: 'white' } : { borderColor: NAVY, color: NAVY }}
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

      {/* ─── 9. Compliance & Regulatory Section ─────────────────────── */}
      <section id="regulatory" className="py-16 sm:py-24" style={{ backgroundColor: LIGHT_BG }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight" style={{ color: NAVY }}>
              Regulatory Compliance
            </h2>
            <p className="mt-4 text-base max-w-2xl mx-auto" style={{ color: DARK_GRAY }}>
              Built from the ground up to meet and exceed UK regulatory requirements.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {REGULATORY_BADGES.map((badge, i) => (
              <StaggerChild key={i} index={i}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 text-center border shadow-sm">
                  <CardContent className="p-5 sm:p-6">
                    <div className="size-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${NAVY}10`, color: NAVY }}>
                      {badge.icon}
                    </div>
                    <h3 className="font-bold text-sm sm:text-base" style={{ color: NAVY }}>{badge.name}</h3>
                    <p className="mt-1 text-xs sm:text-sm" style={{ color: DARK_GRAY }}>{badge.desc}</p>
                  </CardContent>
                </Card>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 10. CTA Footer ─────────────────────────────────────────── */}
      <section style={{ backgroundColor: NAVY }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <AnimatedSection>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Ready to Transform Cross-Border<br className="hidden sm:block" /> Property Compliance?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-white/70 max-w-2xl mx-auto">
              Join leading property managers and compliance teams who trust PropComply AI + VerifyMe Global for their identity and compliance needs.
            </p>
            <div className="mt-8">
              <Button
                size="lg"
                onClick={() => setLoginOpen(true)}
                className="h-12 px-10 text-base bg-white shadow-lg"
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
