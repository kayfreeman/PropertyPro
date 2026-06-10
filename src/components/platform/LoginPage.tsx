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

interface LoginPageProps {
  error?: string;
}

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
            <Lock className="size-5 text-teal-600" />
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
          <Button type="submit" className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2"><div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</div>
            ) : (
              <div className="flex items-center gap-2"><LogIn className="size-4" />Sign In</div>
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-xs text-muted-foreground mb-3">Protected by enterprise-grade security · Zero Trust Architecture</p>
          <Button variant="ghost" size="sm" className="text-teal-600 hover:text-teal-700" onClick={() => setShowDemoAccounts(!showDemoAccounts)}>
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
const PLATFORM_MODULES = [
  { icon: <Fingerprint className="size-6" />, title: 'Identity & Trust', desc: '6-level Trust Ladder with progressive identity assurance from registration to certified credentials', color: 'from-emerald-500 to-teal-600', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700' },
  { icon: <FileCheck className="size-6" />, title: 'Compliance Automation', desc: 'AML/KYC/CDD/EDD workflows with automated screening and regulatory compliance monitoring', color: 'from-cyan-500 to-blue-600', bgColor: 'bg-cyan-50', textColor: 'text-cyan-700' },
  { icon: <TrendingUp className="size-6" />, title: 'Risk Intelligence', desc: 'ML-powered risk scoring, fraud detection, and explainable AI analytics with confidence metrics', color: 'from-amber-500 to-orange-600', bgColor: 'bg-amber-50', textColor: 'text-amber-700' },
  { icon: <Building2 className="size-6" />, title: 'Property Intelligence', desc: 'Right to Rent verification, guarantor replacement, and property compliance intelligence', color: 'from-violet-500 to-purple-600', bgColor: 'bg-violet-50', textColor: 'text-violet-700' },
  { icon: <Handshake className="size-6" />, title: 'Partner Ecosystem', desc: 'Banking referrals, insurance partnerships, and secure API integrations with partner networks', color: 'from-pink-500 to-rose-600', bgColor: 'bg-pink-50', textColor: 'text-pink-700' },
  { icon: <Bot className="size-6" />, title: 'AI Compliance Assistant', desc: 'Regulatory guidance chatbot with knowledge of UK GDPR, MLR 2017, and Immigration Act 2014', color: 'from-teal-500 to-emerald-600', bgColor: 'bg-teal-50', textColor: 'text-teal-700' },
  { icon: <ScanFace className="size-6" />, title: 'VerifyMe Onboarding', desc: '10-step verification wizard with biometric checks, financial analysis, and credential issuance', color: 'from-sky-500 to-cyan-600', bgColor: 'bg-sky-50', textColor: 'text-sky-700' },
  { icon: <Shield className="size-6" />, title: 'Right to Rent Flow', desc: 'Immigration Act 2014 Section 22 compliant verification with automated status checks', color: 'from-emerald-600 to-green-700', bgColor: 'bg-green-50', textColor: 'text-green-700' },
];

const TRUST_LEVELS = [
  { level: 1, name: 'Registered', desc: 'Email + MFA verification', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', bar: 'bg-emerald-200' },
  { level: 2, name: 'Documented', desc: 'Passport/ID upload & validation', color: 'bg-emerald-200 text-emerald-900 border-emerald-300', bar: 'bg-emerald-300' },
  { level: 3, name: 'Behavioural Verified', desc: 'Biometrics + financial behaviour', color: 'bg-emerald-300 text-emerald-900 border-emerald-400', bar: 'bg-emerald-400' },
  { level: 4, name: 'Jurisdictional', desc: 'Cross-border database checks', color: 'bg-emerald-400 text-white border-emerald-500', bar: 'bg-emerald-500' },
  { level: 5, name: 'Corroborated', desc: 'Triple-source fusion analysis', color: 'bg-emerald-500 text-white border-emerald-600', bar: 'bg-emerald-600' },
  { level: 6, name: 'Certified', desc: 'Credential issuance + agent review', color: 'bg-emerald-700 text-white border-emerald-800', bar: 'bg-emerald-700' },
];

const USER_ROLES = [
  { icon: <User className="size-6" />, title: 'Tenants / Applicants', desc: 'Self-service portal for document upload, consent management, and application tracking', color: 'bg-emerald-50 text-emerald-600' },
  { icon: <Building2 className="size-6" />, title: 'Property Managers / Letting Agents', desc: 'Property compliance, tenant screening, and Right to Rent verification', color: 'bg-violet-50 text-violet-600' },
  { icon: <Shield className="size-6" />, title: 'Compliance Officers', desc: 'AML/KYC/CDD compliance workflows, screening reviews, and regulatory adherence', color: 'bg-cyan-50 text-cyan-600' },
  { icon: <ScanFace className="size-6" />, title: 'Identity Verification Specialists', desc: 'Verification workflows, credential management, and processing requests', color: 'bg-sky-50 text-sky-600' },
  { icon: <TrendingUp className="size-6" />, title: 'Risk Analysts', desc: 'Risk scoring, fraud investigation, and intelligence reports with explainability', color: 'bg-amber-50 text-amber-600' },
  { icon: <Handshake className="size-6" />, title: 'Partner Organizations', desc: 'Banking, insurance, and service partner integrations with referral workflows', color: 'bg-pink-50 text-pink-600' },
];

const HOW_IT_WORKS = [
  { step: 1, title: 'Register & Upload Documents', desc: 'Create your account, enable MFA, and upload identity documents (passport, visa, financial records)', icon: <User className="size-6" /> },
  { step: 2, title: 'Biometric Verification & Financial Analysis', desc: 'Complete liveness detection, face matching, and open banking financial behaviour analysis', icon: <ScanFace className="size-6" /> },
  { step: 3, title: 'Cross-Jurisdictional Checks & Risk Assessment', desc: 'Automated screening across sanctions, PEP, adverse media databases with ML risk scoring', icon: <Globe className="size-6" /> },
  { step: 4, title: 'Trust Credential Issued & Right to Rent Certified', desc: 'Receive your portable trust credential and Right to Rent certification valid across the UK', icon: <Award className="size-6" /> },
];

const PRICING_TIERS = [
  {
    name: 'Starter',
    price: '£49',
    period: '/mo',
    desc: 'For individual tenants',
    features: ['Identity verification (L1-L3)', 'Right to Rent certification', 'Document upload & storage', 'Self-service portal', 'AI compliance chatbot', 'Guarantor replacement eligible'],
    cta: 'Get Started',
    popular: false,
    color: 'border-slate-200',
    buttonClass: 'bg-white border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50',
  },
  {
    name: 'Professional',
    price: '£199',
    period: '/mo',
    desc: 'For letting agents & property managers',
    features: ['Everything in Starter', 'Full Trust Ladder (L1-L6)', 'Compliance automation', 'Risk intelligence dashboard', 'Multi-property management', 'Partner referral network', 'Priority support', 'API access'],
    cta: 'Get Started',
    popular: true,
    color: 'border-emerald-500 ring-2 ring-emerald-500',
    buttonClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 shadow-lg',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large organizations & partners',
    features: ['Everything in Professional', 'Custom integration APIs', 'Dedicated account manager', 'SLA guarantees', 'White-label options', 'Custom compliance workflows', 'On-premise deployment', 'Unlimited verifications'],
    cta: 'Contact Sales',
    popular: false,
    color: 'border-slate-200',
    buttonClass: 'bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50',
  },
];

const REGULATORY_BADGES = [
  { name: 'UK GDPR', desc: 'General Data Protection Regulation compliance' },
  { name: 'UK MLR 2017', desc: 'Money Laundering Regulations 2017' },
  { name: 'FCA', desc: 'Financial Conduct Authority guidance' },
  { name: 'Immigration Act 2014', desc: 'Right to Rent Section 22 requirements' },
  { name: 'Data Protection Act 2018', desc: 'UK data protection framework' },
];

// ─── Main Component ──────────────────────────────────────────────────
export default function LoginPage({ error: _error }: LoginPageProps) {
  const [loginOpen, setLoginOpen] = useState(false);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Login Modal */}
      <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />

      {/* ─── Sticky Nav ─────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
              <Shield className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">PropComply AI</h1>
              <p className="text-xs text-muted-foreground font-medium">VerifyMe Global</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <button onClick={() => scrollToSection('problem')} className="hover:text-foreground transition-colors">Problem</button>
            <button onClick={() => scrollToSection('solution')} className="hover:text-foreground transition-colors">Solution</button>
            <button onClick={() => scrollToSection('modules')} className="hover:text-foreground transition-colors">Platform</button>
            <button onClick={() => scrollToSection('trust-ladder')} className="hover:text-foreground transition-colors">Trust Ladder</button>
            <button onClick={() => scrollToSection('pricing')} className="hover:text-foreground transition-colors">Pricing</button>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLoginOpen(true)} className="text-teal-600 hover:text-teal-700 hidden sm:flex">
              Sign In
            </Button>
            <Button size="sm" onClick={() => setLoginOpen(true)} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md">
              Get Started <ArrowRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ─── 1. Hero Section ────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50/40">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-emerald-100/40 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-teal-100/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-50/20 blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28 lg:py-36">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center max-w-4xl mx-auto"
          >
            <Badge variant="outline" className="mb-6 border-emerald-300 text-emerald-700 bg-emerald-50/80 text-xs sm:text-sm px-3 py-1">
              <Sparkles className="size-3.5 mr-1.5" />
              The Trust Infrastructure Platform
            </Badge>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              The Trust Infrastructure{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                for Cross-Border Property
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              PropComply AI + VerifyMe Global — The first platform combining identity verification,
              compliance automation, risk intelligence, and property compliance into a single trust
              infrastructure
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={() => setLoginOpen(true)} className="h-12 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg text-base">
                Get Started <ArrowRight className="size-5 ml-2" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => scrollToSection('how-it-works')} className="h-12 px-8 border-slate-300 text-base">
                <Play className="size-4 mr-2" /> Watch Demo
              </Button>
            </div>

            {/* Key Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-12 max-w-2xl mx-auto"
            >
              {[
                { value: '£2.8B', label: 'Problem size in UK property', icon: <AlertTriangle className="size-5 text-red-500" /> },
                { value: '94%', label: 'Faster verification', icon: <Zap className="size-5 text-amber-500" /> },
                { value: '300+', label: 'Jurisdictions covered', icon: <Globe className="size-5 text-emerald-500" /> },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {stat.icon}
                    <span className="text-3xl sm:text-4xl font-extrabold text-slate-900">{stat.value}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ─── 2. The Problem ─────────────────────────────────────── */}
      <section id="problem" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 border-red-300 text-red-700 bg-red-50 text-xs">
                The Problem
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                The £2.8B Problem Nobody Solves
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Cross-border property transactions are plagued by fraud, compliance failures, and a fundamental lack of trust infrastructure
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { icon: <AlertTriangle className="size-8" />, title: 'Identity Fraud', stat: '£1.3B', desc: 'Annual losses in UK property from identity fraud — growing 24% year-over-year with no unified defence', gradient: 'from-red-500 to-orange-500', bgGrad: 'from-red-50 to-orange-50', border: 'border-red-200' },
              { icon: <FileCheck className="size-8" />, title: 'Compliance Burden', stat: '94%', desc: 'Of letting agents struggle with Right to Rent compliance — exposing them to £3,000 per tenant civil penalties', gradient: 'from-orange-500 to-amber-500', bgGrad: 'from-orange-50 to-amber-50', border: 'border-orange-200' },
              { icon: <X className="size-8" />, title: 'Trust Deficit', stat: 'Zero', desc: 'No cross-border trust framework exists — leaving international tenants trapped in a cycle of rejection and re-verification', gradient: 'from-red-600 to-red-500', bgGrad: 'from-red-50 to-rose-50', border: 'border-red-200' },
            ].map((item, i) => (
              <StaggerChild key={item.title} index={i}>
                <Card className={`relative overflow-hidden ${item.border} hover:shadow-lg transition-shadow duration-300`}>
                  <div className={`absolute inset-0 bg-gradient-to-br ${item.bgGrad} opacity-60`} />
                  <CardHeader className="relative pb-2">
                    <div className={`inline-flex size-14 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-md mb-3`}>
                      {item.icon}
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative">
                    <p className="text-4xl font-extrabold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-3">{item.stat}</p>
                    <CardDescription className="text-sm leading-relaxed">{item.desc}</CardDescription>
                  </CardContent>
                </Card>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. The Solution ────────────────────────────────────── */}
      <section id="solution" className="py-20 sm:py-28 bg-gradient-to-br from-emerald-50/50 via-white to-teal-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 border-emerald-300 text-emerald-700 bg-emerald-50 text-xs">
                The Solution
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                A New Market Category: <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Trust Infrastructure</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                VerifyMe Global creates the first unified trust infrastructure for cross-border property — combining identity verification, compliance automation, and risk intelligence into a single platform that transforms how trust is established, verified, and maintained.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              { icon: <Fingerprint className="size-7" />, title: 'Identity Trust Ladder', desc: 'Progressive 6-level identity assurance framework that moves from basic registration to certified, portable credentials recognized across jurisdictions', gradient: 'from-emerald-500 to-teal-600', stat: '6 Levels' },
              { icon: <FileCheck className="size-7" />, title: 'Compliance Automation', desc: 'End-to-end AML/KYC/CDD/EDD workflows with automated screening against global sanctions, PEP, and adverse media databases', gradient: 'from-teal-500 to-cyan-600', stat: '8 Check Types' },
              { icon: <TrendingUp className="size-7" />, title: 'Risk Intelligence', desc: 'ML-powered risk scoring with explainable AI, fraud detection, and confidence metrics that provide transparent, auditable decisions', gradient: 'from-cyan-500 to-sky-600', stat: '99.7% Accuracy' },
            ].map((item, i) => (
              <StaggerChild key={item.title} index={i}>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${item.gradient}`} />
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`inline-flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.gradient} text-white shadow-md`}>
                        {item.icon}
                      </div>
                      <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50">{item.stat}</Badge>
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm leading-relaxed">{item.desc}</CardDescription>
                  </CardContent>
                </Card>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. Platform Modules ────────────────────────────────── */}
      <section id="modules" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 border-teal-300 text-teal-700 bg-teal-50 text-xs">
                Platform
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                8 Core Platform Modules
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                A comprehensive suite of integrated modules that work together to create end-to-end trust infrastructure
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PLATFORM_MODULES.map((mod, i) => (
              <StaggerChild key={mod.title} index={i}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-slate-200">
                  <CardHeader className="pb-3">
                    <div className={`inline-flex size-12 items-center justify-center rounded-xl ${mod.bgColor} ${mod.textColor} mb-2`}>
                      {mod.icon}
                    </div>
                    <CardTitle className="text-base">{mod.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs leading-relaxed">{mod.desc}</CardDescription>
                  </CardContent>
                </Card>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. Trust Ladder ────────────────────────────────────── */}
      <section id="trust-ladder" className="py-20 sm:py-28 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-emerald-700/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-teal-700/20 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-emerald-700/50 text-emerald-200 border-emerald-600 text-xs hover:bg-emerald-700/50">
                Identity Trust Ladder
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                6-Level Progressive Trust Framework
              </h2>
              <p className="mt-4 text-lg text-emerald-200/80 max-w-2xl mx-auto">
                From basic registration to certified credentials — each level adds verification layers, increasing trust and unlocking new capabilities
              </p>
            </div>
          </AnimatedSection>

          <div className="max-w-3xl mx-auto space-y-4">
            {TRUST_LEVELS.map((level, i) => (
              <StaggerChild key={level.level} index={i}>
                <div className={`flex items-center gap-4 sm:gap-6 p-4 sm:p-5 rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${level.color}`}>
                  <div className="flex size-12 sm:size-14 shrink-0 items-center justify-center rounded-full bg-white/20 font-extrabold text-lg sm:text-xl border border-white/30">
                    {level.level}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-base sm:text-lg">L{level.level} — {level.name}</span>
                    </div>
                    <p className="text-sm opacity-80">{level.desc}</p>
                  </div>
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="w-20 h-2 rounded-full bg-white/20 overflow-hidden">
                      <div className={`h-full rounded-full ${level.bar}`} style={{ width: `${(level.level / 6) * 100}%` }} />
                    </div>
                    <CheckCircle2 className="size-5 text-white/60" />
                  </div>
                </div>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. Who It's For ────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 border-violet-300 text-violet-700 bg-violet-50 text-xs">
                Who It&apos;s For
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Built for Every Stakeholder
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Role-based access tailored to the unique needs of each participant in the property trust chain
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {USER_ROLES.map((role, i) => (
              <StaggerChild key={role.title} index={i}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                  <CardHeader className="pb-3">
                    <div className={`inline-flex size-12 items-center justify-center rounded-xl ${role.color} mb-2`}>
                      {role.icon}
                    </div>
                    <CardTitle className="text-base">{role.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-xs leading-relaxed">{role.desc}</CardDescription>
                  </CardContent>
                </Card>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7. How It Works ────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 border-teal-300 text-teal-700 bg-teal-50 text-xs">
                How It Works
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                From Registration to Trust Credential
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                A streamlined 4-step process that transforms an unknown applicant into a verified, trusted participant
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <StaggerChild key={step.step} index={i}>
                <div className="relative">
                  <Card className="h-full border-slate-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-md">
                          {step.step}
                        </div>
                        <div className="text-emerald-600">{step.icon}</div>
                      </div>
                      <CardTitle className="text-base">{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-xs leading-relaxed">{step.desc}</CardDescription>
                    </CardContent>
                  </Card>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden lg:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <ArrowRight className="size-6 text-emerald-400" />
                    </div>
                  )}
                </div>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 8. Pricing ─────────────────────────────────────────── */}
      <section id="pricing" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-4 border-emerald-300 text-emerald-700 bg-emerald-50 text-xs">
                Pricing
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Choose the plan that fits your needs. Scale as you grow.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {PRICING_TIERS.map((tier, i) => (
              <StaggerChild key={tier.name} index={i}>
                <Card className={`relative h-full ${tier.color} hover:shadow-xl transition-shadow duration-300`}>
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md border-0 text-xs px-3">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">{tier.name}</CardTitle>
                    <CardDescription className="text-sm">{tier.desc}</CardDescription>
                    <div className="mt-3">
                      <span className="text-4xl font-extrabold text-slate-900">{tier.price}</span>
                      <span className="text-muted-foreground text-sm">{tier.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Separator />
                    <ul className="space-y-2.5">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button className={`w-full h-11 ${tier.buttonClass}`} onClick={() => setLoginOpen(true)}>
                      {tier.cta}
                    </Button>
                  </CardContent>
                </Card>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 9. Regulatory Compliance ───────────────────────────── */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="text-center mb-12">
              <Badge variant="outline" className="mb-4 border-slate-300 text-slate-600 bg-slate-50 text-xs">
                Compliance
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Built on Regulatory Foundations
              </h2>
              <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
                Full compliance with UK and international regulatory frameworks
              </p>
            </div>
          </AnimatedSection>

          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {REGULATORY_BADGES.map((badge, i) => (
              <StaggerChild key={badge.name} index={i}>
                <div className="group relative">
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-default">
                    <Landmark className="size-4 text-emerald-600" />
                    <Scale className="size-3.5 text-teal-600" />
                    <span className="text-sm font-semibold text-slate-700">{badge.name}</span>
                  </div>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                    {badge.desc}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                  </div>
                </div>
              </StaggerChild>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 10. About / Founder ────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <AnimatedSection>
            <div className="max-w-3xl mx-auto text-center">
              <Badge variant="outline" className="mb-4 border-emerald-300 text-emerald-700 bg-emerald-50 text-xs">
                About
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Founded by Joy Ladegbaye
              </h2>
              <div className="mt-8 flex justify-center">
                <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
                  <span className="text-2xl font-bold text-white">JL</span>
                </div>
              </div>
              <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
                Joy Ladegbaye founded PropComply AI + VerifyMe Global with a clear mission: to eliminate
                the trust deficit in cross-border property transactions. After experiencing firsthand the
                friction, rejections, and compliance failures that international tenants and property
                professionals face, Joy envisioned a new category of infrastructure — one that transforms
                how identity, compliance, and trust are established across jurisdictions.
              </p>
              <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                Under Joy&apos;s leadership, the platform has grown from a concept into a comprehensive trust
                infrastructure serving tenants, letting agents, compliance officers, and partner organizations
                — with the ambitious goal of becoming the global standard for property trust verification.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700 bg-emerald-50">
                  <Sparkles className="size-3 mr-1" /> Visionary Leader
                </Badge>
                <Badge variant="outline" className="text-xs border-teal-300 text-teal-700 bg-teal-50">
                  <Globe className="size-3 mr-1" /> Cross-Border Expert
                </Badge>
                <Badge variant="outline" className="text-xs border-cyan-300 text-cyan-700 bg-cyan-50">
                  <Shield className="size-3 mr-1" /> Trust Infrastructure Pioneer
                </Badge>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── 11. Final CTA ──────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-teal-400/10 blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <AnimatedSection>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Ready to Transform Cross-Border Property Compliance?
            </h2>
            <p className="mt-6 text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto">
              Join the platform that&apos;s building the future of trust in property — from identity verification to regulatory compliance, all in one place.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={() => setLoginOpen(true)} className="h-12 px-8 bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg text-base font-semibold">
                <LogIn className="size-4 mr-2" /> Sign In to Platform
              </Button>
              <Button size="lg" variant="outline" onClick={() => setLoginOpen(true)} className="h-12 px-8 border-white/40 text-white hover:bg-white/10 text-base">
                <Sparkles className="size-4 mr-2" /> Request Demo
              </Button>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── 12. Footer ─────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
                  <Shield className="size-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">PropComply AI</p>
                  <p className="text-[10px] text-slate-500 font-medium">VerifyMe Global</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                The trust infrastructure for cross-border property — identity verification, compliance automation, and risk intelligence.
              </p>
            </div>

            {/* Platform */}
            <div>
              <p className="text-white font-semibold text-sm mb-3">Platform</p>
              <ul className="space-y-2 text-xs">
                <li><button onClick={() => scrollToSection('modules')} className="hover:text-white transition-colors">Modules</button></li>
                <li><button onClick={() => scrollToSection('trust-ladder')} className="hover:text-white transition-colors">Trust Ladder</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">How It Works</button></li>
                <li><button onClick={() => setLoginOpen(true)} className="hover:text-white transition-colors">Sign In</button></li>
              </ul>
            </div>

            {/* Solutions */}
            <div>
              <p className="text-white font-semibold text-sm mb-3">Solutions</p>
              <ul className="space-y-2 text-xs">
                <li><span className="hover:text-white transition-colors cursor-default">Identity Verification</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">Compliance Automation</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">Risk Intelligence</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">Right to Rent</span></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-white font-semibold text-sm mb-3">Company</p>
              <ul className="space-y-2 text-xs">
                <li><span className="hover:text-white transition-colors cursor-default">About</span></li>
                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-white transition-colors">Pricing</button></li>
                <li><span className="hover:text-white transition-colors cursor-default">Resources</span></li>
                <li><span className="hover:text-white transition-colors cursor-default">Contact</span></li>
              </ul>
            </div>
          </div>

          <Separator className="bg-slate-800 mb-8" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-xs">
              <span>&copy; 2024 PropComply AI + VerifyMe Global. All rights reserved.</span>
              <div className="flex items-center gap-3 text-slate-500">
                <span className="hover:text-white transition-colors cursor-default">Privacy Policy</span>
                <span>·</span>
                <span className="hover:text-white transition-colors cursor-default">Terms of Service</span>
              </div>
            </div>

            {/* Compliance Badges */}
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {REGULATORY_BADGES.map((badge) => (
                <Badge key={badge.name} variant="outline" className="text-[9px] border-slate-700 text-slate-500 bg-slate-800/50 px-1.5 py-0">
                  {badge.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
