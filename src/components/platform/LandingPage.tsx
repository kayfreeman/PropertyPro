'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
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
  Play,
  CheckCircle2,
  XCircle,
  Fingerprint,
  Globe,
  FileCheck,
  BadgeCheck,
  Database,
  Link2,
  BarChart3,
  Zap,
  ChevronRight,
  Menu,
  X,
  MapPin,
  GraduationCap,
  Briefcase,
  Landmark,
  Scale,
  ShieldCheck,
  Activity,
  Layers,
  Code2,
  BookOpen,
  UsersRound,
  TrendingUp,
  Award,
  CircleDollarSign,
  ArrowDownRight,
  Star,
  Sparkles,
  Timer,
  Target,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ROLE_DEFINITIONS, type UserRole } from '@/lib/rbac';

// ─── Demo Accounts ────────────────────────────────────────────────────────────

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

// ─── Animation Variants ───────────────────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ─── Section Wrapper with InView Detection ────────────────────────────────────

function AnimatedSection({ children, className = '', id = '' }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LandingPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');
    try {
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) setLoginError(result.error);
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
      const result = await signIn('credentials', {
        email: account.email,
        password: account.password,
        redirect: false,
      });
      if (result?.error) setLoginError(result.error);
    } catch {
      setLoginError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const openLogin = () => {
    setLoginOpen(true);
    setMobileMenuOpen(false);
  };

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Close mobile menu on scroll
  useEffect(() => {
    const onScroll = () => setMobileMenuOpen(false);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ═══════════ NAVIGATION BAR ═══════════ */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
              <Shield className="size-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold leading-tight tracking-tight">PropComply AI</h1>
              <p className="text-[10px] leading-tight text-muted-foreground font-medium">VerifyMe Global</p>
            </div>
            <span className="sm:hidden text-sm font-bold">PCAI</span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {[
              { label: 'Platform', id: 'platform' },
              { label: 'Solutions', id: 'solutions' },
              { label: 'Pricing', id: 'pricing' },
              { label: 'Resources', id: 'regulatory' },
              { label: 'About', id: 'about' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollTo(item.id)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button
              onClick={openLogin}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hidden sm:flex"
              size="sm"
            >
              <LogIn className="size-4 mr-1.5" />
              Sign In
            </Button>
            <Button
              onClick={openLogin}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md sm:hidden"
              size="sm"
            >
              <LogIn className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t bg-white overflow-hidden"
            >
              <div className="px-4 py-3 space-y-1">
                {[
                  { label: 'Platform', id: 'platform' },
                  { label: 'Solutions', id: 'solutions' },
                  { label: 'Pricing', id: 'pricing' },
                  { label: 'Resources', id: 'regulatory' },
                  { label: 'About', id: 'about' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className="block w-full text-left py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white" />
        <div className="absolute inset-0 bg-[url('/hero-trust-network.png')] bg-cover bg-center opacity-10" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-32">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div variants={staggerItem}>
              <Badge className="mb-6 bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 text-xs sm:text-sm px-3 py-1">
                <Shield className="size-3.5 mr-1.5" />
                Trust Infrastructure for Cross-Border Property
              </Badge>
            </motion.div>

            <motion.h1
              variants={staggerItem}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-[1.1]"
            >
              The Trust Infrastructure
              <br />
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                for Cross-Border Property
              </span>
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            >
              900,000+ individuals arrive in the UK each year without a UK identity footprint.
              Existing compliance platforms weren&apos;t built for them.{' '}
              <span className="font-semibold text-foreground">We were.</span>
            </motion.p>

            {/* Key Stats */}
            <motion.div variants={staggerItem} className="mt-10 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto">
              {[
                { value: '900K+', label: 'Annual UK Arrivals', icon: Users },
                { value: '£450', label: 'Avg Guarantor Fee', icon: CircleDollarSign },
                { value: '0', label: 'Compliant Pathways (before PropComply)', icon: XCircle },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="flex justify-center mb-2">
                    <div className="size-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <stat.icon className="size-4 text-emerald-700" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">{stat.label}</div>
                </div>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div variants={staggerItem} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={openLogin}
                size="lg"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg w-full sm:w-auto"
              >
                Get Started
                <ArrowRight className="size-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 w-full sm:w-auto"
              >
                <Play className="size-4 mr-2" />
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ PROBLEM SECTION ═══════════ */}
      <AnimatedSection id="solutions" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div variants={staggerItem} className="text-center mb-16">
            <Badge variant="outline" className="mb-4 border-red-200 text-red-700 bg-red-50">
              <AlertTriangle className="size-3 mr-1" />
              Market Problem
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              The £2.8B Problem{' '}
              <span className="text-red-600">Nobody Solves</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Three market harms that existing platforms ignore — and PropComply AI was built to eliminate.
            </p>
          </motion.div>

          {/* Three Market Harms */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: Users,
                title: 'Invisible Financial Identity',
                description:
                  'Immigrant tenants and buyers cannot access housing on fair terms — their overseas financial track record is invisible to UK agents and landlords.',
                color: 'red',
              },
              {
                icon: Scale,
                title: 'Regulatory Double Bind',
                description:
                  'UK agents caught between Equality Act 2010 race discrimination risk and MLR 2017 AML breach risk — with no compliant path that satisfies both.',
                color: 'amber',
              },
              {
                icon: TrendingUp,
                title: 'Lost International Demand',
                description:
                  'UK property market loses highest-value international demand — there is no compliant verification pathway for cross-border applicants.',
                color: 'slate',
              },
            ].map((harm, i) => (
              <motion.div key={harm.title} variants={staggerItem}>
                <Card className="h-full border-0 shadow-md hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`size-12 rounded-xl flex items-center justify-center mb-2 ${
                      harm.color === 'red' ? 'bg-red-100' : harm.color === 'amber' ? 'bg-amber-100' : 'bg-slate-100'
                    }`}>
                      <harm.icon className={`size-6 ${
                        harm.color === 'red' ? 'text-red-600' : harm.color === 'amber' ? 'text-amber-600' : 'text-slate-600'
                      }`} />
                    </div>
                    <CardTitle className="text-lg">{harm.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{harm.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Comparison Cards */}
          <motion.div variants={staggerItem} className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Current Platforms */}
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <Badge className="w-fit bg-red-100 text-red-700 border-red-200 mb-2">
                  <XCircle className="size-3 mr-1" />
                  Current Platforms
                </Badge>
                <CardTitle className="text-xl">Status Quo</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    'UK-only identity verification',
                    'No cross-jurisdictional data access',
                    'Binary pass/fail — no nuance',
                    'Guarantor requirement for all non-UK',
                    'No compliance path for Equality Act + MLR',
                    'Manual, paper-based processes',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-red-800">
                      <XCircle className="size-4 mt-0.5 shrink-0 text-red-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* PropComply AI */}
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardHeader>
                <Badge className="w-fit bg-emerald-100 text-emerald-700 border-emerald-200 mb-2">
                  <CheckCircle2 className="size-3 mr-1" />
                  PropComply AI
                </Badge>
                <CardTitle className="text-xl">New Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {[
                    'Triple-Source Corroboration across jurisdictions',
                    'Source-country government database integration',
                    'Confidence Score with explainability narrative',
                    'Guarantor Replacement Certificate (Level 3+)',
                    'Simultaneous Equality Act + MLR compliance',
                    'Automated, blockchain-auditable workflows',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-emerald-800">
                      <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-emerald-500" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ═══════════ SOLUTION SECTION ═══════════ */}
      <AnimatedSection className="py-20 sm:py-28 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div variants={staggerItem} className="text-center mb-16">
            <Badge className="mb-4 bg-teal-100 text-teal-800 border-teal-200">
              <Sparkles className="size-3 mr-1" />
              New Market Category
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              VerifyMe Global —{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                A New Market Category
              </span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Not a feature addition. A jurisdictional identity translation engine.
            </p>
          </motion.div>

          {/* Triple-Source Corroboration Engine */}
          <motion.div variants={staggerItem} className="grid lg:grid-cols-3 gap-6 mb-16">
            {[
              {
                icon: Fingerprint,
                title: 'Biometric Anchor',
                subtitle: 'Weight: 35%',
                description: 'Live facial scan + document matching with liveness detection and deepfake validation. AES-256-GCM encrypted cross-match.',
                color: 'emerald',
                bgClass: 'bg-emerald-50',
                iconBg: 'bg-emerald-100',
                iconColor: 'text-emerald-700',
                borderClass: 'border-emerald-200',
              },
              {
                icon: BarChart3,
                title: 'Behavioural Financial Pattern',
                subtitle: 'Weight: 35%',
                description: '24-month bank statement analysis / PSD2 Open Banking. Income stability, spending coherence, and profession match scoring.',
                color: 'teal',
                bgClass: 'bg-teal-50',
                iconBg: 'bg-teal-100',
                iconColor: 'text-teal-700',
                borderClass: 'border-teal-200',
              },
              {
                icon: Globe,
                title: 'Cross-Jurisdictional Corroboration',
                subtitle: 'Weight: 30%',
                description: 'Source-country government databases: NIBSS/BVN Nigeria, Aadhaar India, NIDA Rwanda — institutional-level verification.',
                color: 'cyan',
                bgClass: 'bg-cyan-50',
                iconBg: 'bg-cyan-100',
                iconColor: 'text-cyan-700',
                borderClass: 'border-cyan-200',
              },
            ].map((source) => (
              <Card key={source.title} className={`border-0 shadow-md ${source.bgClass}`}>
                <CardHeader>
                  <div className={`size-12 rounded-xl ${source.iconBg} flex items-center justify-center mb-2`}>
                    <source.icon className={`size-6 ${source.iconColor}`} />
                  </div>
                  <CardTitle className="text-lg">{source.title}</CardTitle>
                  <Badge variant="outline" className={`w-fit text-xs ${source.borderClass} ${source.iconColor} ${source.bgClass}`}>
                    {source.subtitle}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{source.description}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Confidence Score Visualization */}
          <motion.div variants={staggerItem} className="max-w-2xl mx-auto">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-slate-900 to-slate-800 text-white">
              <CardHeader className="text-center">
                <CardTitle className="text-xl text-white">Confidence Score</CardTitle>
                <CardDescription className="text-slate-300">
                  Triple-Source Corroboration produces a composite 0-100 score
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center gap-8 sm:gap-16 mb-6">
                  {/* Score Gauge */}
                  <div className="relative">
                    <svg width="140" height="140" viewBox="0 0 140 140">
                      <circle cx="70" cy="70" r="60" fill="none" stroke="#334155" strokeWidth="10" />
                      <circle
                        cx="70"
                        cy="70"
                        r="60"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="10"
                        strokeDasharray={`${2 * Math.PI * 60 * 0.87} ${2 * Math.PI * 60}`}
                        strokeLinecap="round"
                        transform="rotate(-90 70 70)"
                      />
                      <text x="70" y="62" textAnchor="middle" className="fill-white text-3xl font-bold" fontSize="32" fontWeight="bold">87</text>
                      <text x="70" y="82" textAnchor="middle" className="fill-slate-400 text-xs" fontSize="12">/ 100</text>
                    </svg>
                  </div>

                  {/* Threshold Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-full bg-emerald-500" />
                      <div>
                        <div className="text-sm font-semibold text-emerald-400">Score ≥ 80</div>
                        <div className="text-xs text-slate-400">Auto-Certified ✓</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="size-3 rounded-full bg-amber-500" />
                      <div>
                        <div className="text-sm font-semibold text-amber-400">Score &lt; 80</div>
                        <div className="text-xs text-slate-400">Manual Review Required</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Bar */}
                <div className="relative">
                  <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-emerald-400 rounded-full" style={{ width: '87%' }} />
                  </div>
                  {/* Threshold line */}
                  <div className="absolute top-0 h-3" style={{ left: '80%' }}>
                    <div className="h-full w-0.5 bg-white/60" />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[10px] text-slate-500">
                    <span>0</span>
                    <span className="text-white/60">← 80 threshold</span>
                    <span>100</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ═══════════ PLATFORM SECTION (8 CORE MODULES) ═══════════ */}
      <AnimatedSection id="platform" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div variants={staggerItem} className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-800 border-emerald-200">
              <Layers className="size-3 mr-1" />
              Platform Modules
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">8 Core Platform Modules</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              End-to-end compliance infrastructure — from agency onboarding to blockchain audit trail.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Building2,
                title: 'Agency Onboarding & Authentication',
                description: 'Self-registration, Companies House verification, MFA, and role-based access control for estate agencies.',
                color: 'emerald',
              },
              {
                icon: ShieldCheck,
                title: 'AML/KYC Risk Scoring Engine',
                description: 'Composite risk score 0-100, PEP/sanctions screening, and explainability narrative for every decision.',
                color: 'teal',
              },
              {
                icon: FileCheck,
                title: 'CDD Workflow',
                description: 'Standard CDD, Enhanced Due Diligence, and Simplified Due Diligence pathways with automated routing.',
                color: 'cyan',
              },
              {
                icon: AlertTriangle,
                title: 'SAR Filing Engine',
                description: 'Pre-populated SAR drafts, NCA submission integration, and tipping-off prevention safeguards.',
                color: 'amber',
              },
              {
                icon: BadgeCheck,
                title: 'Right to Rent Automation',
                description: 'All Home Office document types, share code verification, and automated expiry reminders.',
                color: 'emerald',
              },
              {
                icon: ScanFace,
                title: 'VerifyMe Global Onboarding',
                description: 'Individual-facing flow with granular GDPR consent, biometric liveness detection, and document capture.',
                color: 'teal',
              },
              {
                icon: Link2,
                title: 'Blockchain Audit Trail',
                description: 'Hyperledger Fabric immutable compliance events with Zero-Knowledge Proofs for privacy-preserving verification.',
                color: 'cyan',
              },
              {
                icon: Code2,
                title: 'Data Intelligence API',
                description: 'Anonymised cross-border behavioural signals, Lender Intelligence, and k-anonymity ≥ 50.',
                color: 'amber',
              },
            ].map((mod) => {
              const colorMap: Record<string, { bg: string; iconBg: string; iconColor: string; border: string }> = {
                emerald: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-700', border: 'hover:border-emerald-300' },
                teal: { bg: 'bg-teal-50', iconBg: 'bg-teal-100', iconColor: 'text-teal-700', border: 'hover:border-teal-300' },
                cyan: { bg: 'bg-cyan-50', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-700', border: 'hover:border-cyan-300' },
                amber: { bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-700', border: 'hover:border-amber-300' },
              };
              const c = colorMap[mod.color];
              return (
                <motion.div key={mod.title} variants={staggerItem}>
                  <Card className={`h-full shadow-md hover:shadow-lg transition-all duration-300 ${c.border} border-0`}>
                    <CardHeader>
                      <div className={`size-10 rounded-lg ${c.iconBg} flex items-center justify-center mb-2`}>
                        <mod.icon className={`size-5 ${c.iconColor}`} />
                      </div>
                      <CardTitle className="text-base leading-snug">{mod.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">{mod.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </AnimatedSection>

      {/* ═══════════ TRUST LADDER SECTION ═══════════ */}
      <AnimatedSection className="py-20 sm:py-28 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div variants={staggerItem} className="text-center mb-16">
            <Badge className="mb-4 bg-teal-100 text-teal-800 border-teal-200">
              <Award className="size-3 mr-1" />
              Trust Framework
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">6-Level Identity Trust Ladder</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Progressive identity assurance — from self-declaration to government-verified trust.
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-200 via-emerald-300 to-emerald-500" />

              {[
                { level: 0, label: 'Self-Declared', description: 'User-provided identity claims with no verification', icon: User, color: 'slate' },
                { level: 1, label: 'Document Verification', description: 'Government-issued document capture and validation', icon: FileCheck, color: 'slate' },
                { level: 2, label: 'Biometric Verification', description: 'Live facial scan + document matching with liveness detection', icon: Fingerprint, color: 'emerald' },
                { level: 3, label: 'Behaviour Verification', description: '24-month financial pattern analysis, PSD2 Open Banking', icon: Activity, color: 'emerald' },
                { level: 4, label: 'Institutional Verification', description: 'Employer confirmation, professional registry validation', icon: Building2, color: 'teal' },
                { level: 5, label: 'Government Verification', description: 'Source-country government database corroboration (NIBSS, Aadhaar, NIDA)', icon: Landmark, color: 'teal' },
              ].map((rung, i) => {
                const isAchieved = rung.level >= 2;
                const colorStyles: Record<string, { bg: string; iconColor: string; ring: string }> = {
                  slate: { bg: 'bg-slate-100', iconColor: 'text-slate-600', ring: 'ring-slate-300' },
                  emerald: { bg: 'bg-emerald-100', iconColor: 'text-emerald-700', ring: 'ring-emerald-400' },
                  teal: { bg: 'bg-teal-100', iconColor: 'text-teal-700', ring: 'ring-teal-400' },
                };
                const cs = colorStyles[rung.color];
                return (
                  <motion.div
                    key={rung.level}
                    variants={staggerItem}
                    className="relative flex items-start gap-4 sm:gap-6 pb-8 last:pb-0"
                  >
                    <div className={`size-12 sm:size-16 rounded-full ${cs.bg} ring-4 ${isAchieved ? 'ring-emerald-200' : 'ring-white'} flex items-center justify-center shrink-0 z-10 shadow-sm`}>
                      <rung.icon className={`size-5 sm:size-6 ${cs.iconColor}`} />
                    </div>
                    <div className="pt-1 sm:pt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs font-mono">L{rung.level}</Badge>
                        <span className="font-semibold text-sm sm:text-base">{rung.label}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{rung.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ═══════════ WHO IT'S FOR SECTION ═══════════ */}
      <AnimatedSection className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div variants={staggerItem} className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-800 border-emerald-200">
              <UsersRound className="size-3 mr-1" />
              User Personas
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Who It&apos;s For</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Eight distinct user personas — from international applicants to compliance officers.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Amara Okafor', role: 'Skilled Worker Visa Holder', route: 'Nigeria → UK', icon: Briefcase, color: 'emerald' },
              { name: 'David Adeyemi', role: 'International Student', route: 'Nigeria → UCL', icon: GraduationCap, color: 'teal' },
              { name: 'Elena Vasquez', role: 'EU National Post-Brexit', route: 'Spain → Manchester', icon: Globe, color: 'cyan' },
              { name: 'James Whitfield', role: 'Estate Agent & MLRO', route: 'South London', icon: Building2, color: 'amber' },
              { name: 'Sarah Chen', role: 'BtR Operations Manager', route: 'London', icon: Layers, color: 'emerald' },
              { name: 'Mohammed Al-Rashid', role: 'International Property Buyer', route: 'UAE → London', icon: Landmark, color: 'teal' },
              { name: 'Rachel Thompson', role: 'Mortgage Lender Compliance Officer', route: 'UK Banking', icon: ShieldCheck, color: 'cyan' },
              { name: 'Platform Admin', role: 'PropComply Operations Team', route: 'Internal', icon: Crown, color: 'amber' },
            ].map((persona) => {
              const colorMap: Record<string, { bg: string; iconBg: string; iconColor: string }> = {
                emerald: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-700' },
                teal: { bg: 'bg-teal-50', iconBg: 'bg-teal-100', iconColor: 'text-teal-700' },
                cyan: { bg: 'bg-cyan-50', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-700' },
                amber: { bg: 'bg-amber-50', iconBg: 'bg-amber-100', iconColor: 'text-amber-700' },
              };
              const c = colorMap[persona.color];
              return (
                <motion.div key={persona.name} variants={staggerItem}>
                  <Card className="h-full shadow-md hover:shadow-lg transition-shadow border-0">
                    <CardHeader>
                      <div className={`size-10 rounded-lg ${c.iconBg} flex items-center justify-center mb-2`}>
                        <persona.icon className={`size-5 ${c.iconColor}`} />
                      </div>
                      <CardTitle className="text-base">{persona.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium text-foreground">{persona.role}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <MapPin className="size-3 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{persona.route}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </AnimatedSection>

      {/* ═══════════ HOW IT WORKS SECTION ═══════════ */}
      <AnimatedSection className="py-20 sm:py-28 bg-gradient-to-b from-emerald-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div variants={staggerItem} className="text-center mb-16">
            <Badge className="mb-4 bg-teal-100 text-teal-800 border-teal-200">
              <Zap className="size-3 mr-1" />
              Process
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">How It Works</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Three steps to compliant, cross-border property access.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: 1,
                title: 'Individual Verifies',
                description: 'Build a VerifyMe Global profile with Triple-Source Corroboration — biometrics, financial behaviour, and jurisdictional data.',
                icon: ScanFace,
                color: 'emerald',
              },
              {
                step: 2,
                title: 'Agency Reviews',
                description: 'Receive a compliant, auditable risk signal via PropComply AI — confidence score, risk classification, and explainability narrative.',
                icon: ShieldCheck,
                color: 'teal',
              },
              {
                step: 3,
                title: 'Property Secured',
                description: 'Guarantor Replacement Certificate or full compliance package issued — all recorded on blockchain audit trail.',
                icon: Award,
                color: 'cyan',
              },
            ].map((s) => {
              const colorMap: Record<string, { bg: string; iconBg: string; iconColor: string; border: string }> = {
                emerald: { bg: 'bg-emerald-600', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-700', border: 'border-emerald-200' },
                teal: { bg: 'bg-teal-600', iconColor: 'text-teal-700', iconBg: 'bg-teal-100', border: 'border-teal-200' },
                cyan: { bg: 'bg-cyan-600', iconColor: 'text-cyan-700', iconBg: 'bg-cyan-100', border: 'border-cyan-200' },
              };
              const c = colorMap[s.color];
              return (
                <motion.div key={s.step} variants={staggerItem} className="relative">
                  {/* Arrow connector (hidden on mobile) */}
                  {s.step < 3 && (
                    <div className="hidden md:block absolute top-12 -right-4 z-10">
                      <ChevronRight className="size-8 text-muted-foreground/30" />
                    </div>
                  )}
                  <Card className="h-full shadow-md border-0 text-center">
                    <CardHeader className="items-center">
                      <div className={`size-14 rounded-full ${c.bg} flex items-center justify-center mb-3 shadow-md`}>
                        <span className="text-xl font-bold text-white">{s.step}</span>
                      </div>
                      <div className={`size-10 rounded-lg ${c.iconBg} flex items-center justify-center mb-2`}>
                        <s.icon className={`size-5 ${c.iconColor}`} />
                      </div>
                      <CardTitle className="text-lg">{s.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </AnimatedSection>

      {/* ═══════════ PRICING SECTION ═══════════ */}
      <AnimatedSection id="pricing" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div variants={staggerItem} className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-800 border-emerald-200">
              <CreditCard className="size-3 mr-1" />
              Pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Simple, Transparent Pricing</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              From individual verification to enterprise-scale compliance infrastructure.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '£99',
                period: '/agency/month',
                description: 'For small estate agencies getting started with compliant verification.',
                features: ['Up to 25 checks/month', 'Standard CDD', 'Right to Rent verification', 'Email support', 'Basic dashboard'],
                highlight: false,
              },
              {
                name: 'Professional',
                price: '£249',
                period: '/agency/month',
                description: 'For growing agencies with advanced compliance needs.',
                features: ['Up to 100 checks/month', 'EDD workflows', 'SAR draft generation', 'Priority support', 'Advanced analytics', 'API access'],
                highlight: true,
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                period: '',
                description: 'For large agencies, BtR operators, and institutional partners.',
                features: ['Unlimited checks', 'Enterprise API', 'Build-to-Rent integration', 'Dedicated account manager', 'Custom workflows', 'SLA guarantee'],
                highlight: false,
              },
              {
                name: 'Individual',
                price: '£49',
                period: '/verification',
                description: 'For individuals seeking cross-border identity verification.',
                features: ['Standard verification', 'Express: £99 (48-hour)', 'Guarantor Replacement Certificate', 'Profile portability', 'Blockchain audit record'],
                highlight: false,
              },
            ].map((tier) => (
              <motion.div key={tier.name} variants={staggerItem}>
                <Card className={`h-full shadow-md hover:shadow-lg transition-shadow relative ${tier.highlight ? 'ring-2 ring-emerald-500 border-emerald-200' : 'border-0'}`}>
                  {tier.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-emerald-600 text-white border-0 shadow-md">
                        <Star className="size-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-lg">{tier.name}</CardTitle>
                    <div className="mt-2">
                      <span className="text-3xl font-bold">{tier.price}</span>
                      <span className="text-sm text-muted-foreground">{tier.period}</span>
                    </div>
                    <CardDescription className="mt-2">{tier.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2.5">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="size-4 mt-0.5 shrink-0 text-emerald-500" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={openLogin}
                      className={`w-full mt-6 ${
                        tier.highlight
                          ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md'
                          : 'bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                      }`}
                      variant={tier.highlight ? 'default' : 'outline'}
                    >
                      {tier.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
                      <ArrowRight className="size-4 ml-1.5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ═══════════ REGULATORY COMPLIANCE SECTION ═══════════ */}
      <AnimatedSection id="regulatory" className="py-20 sm:py-28 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div variants={staggerItem} className="text-center mb-16">
            <Badge className="mb-4 bg-teal-100 text-teal-800 border-teal-200">
              <Scale className="size-3 mr-1" />
              Compliance
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Built for Regulatory Compliance</h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Every feature designed to meet — and exceed — UK regulatory requirements.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { name: 'UK GDPR / DPA 2018', description: 'Full data protection compliance with granular consent management and data minimization.', icon: Shield, color: 'emerald' },
              { name: 'MLR 2017', description: 'Money Laundering Regulations compliance with CDD, EDD, and SAR filing workflows.', icon: FileCheck, color: 'teal' },
              { name: 'Equality Act 2010', description: 'Eliminates race discrimination risk in tenant screening through objective, algorithmic assessment.', icon: Scale, color: 'cyan' },
              { name: 'Immigration Act 2014', description: 'Automated Right to Rent verification covering all Home Office document types and share codes.', icon: BadgeCheck, color: 'emerald' },
              { name: 'FCA / HMRC Supervision', description: 'Compliance with Financial Conduct Authority and HMRC supervision requirements for property businesses.', icon: Landmark, color: 'teal' },
              { name: 'W3C DID Credentials', description: 'Decentralised Identity standards integration (Year 2 roadmap) for portable, self-sovereign identity.', icon: Link2, color: 'cyan' },
            ].map((reg) => {
              const colorMap: Record<string, { bg: string; iconBg: string; iconColor: string }> = {
                emerald: { bg: 'bg-emerald-50', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-700' },
                teal: { bg: 'bg-teal-50', iconBg: 'bg-teal-100', iconColor: 'text-teal-700' },
                cyan: { bg: 'bg-cyan-50', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-700' },
              };
              const c = colorMap[reg.color];
              return (
                <motion.div key={reg.name} variants={staggerItem}>
                  <Card className="h-full shadow-md border-0 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className={`size-10 rounded-lg ${c.iconBg} flex items-center justify-center mb-2`}>
                        <reg.icon className={`size-5 ${c.iconColor}`} />
                      </div>
                      <CardTitle className="text-base">{reg.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed">{reg.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </AnimatedSection>

      {/* ═══════════ ABOUT US SECTION ═══════════ */}
      <AnimatedSection id="about" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div variants={staggerItem} className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-800 border-emerald-200">
              <BookOpen className="size-3 mr-1" />
              About Us
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">About PropComply AI</h2>
          </motion.div>

          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: Mission & Founder */}
            <motion.div variants={staggerItem}>
              <h3 className="text-2xl font-bold mb-4">Founded by Joy Ladegbaye</h3>
              <p className="text-muted-foreground leading-relaxed mb-6">
                PropComply AI was founded with a singular mission: position PropComply as the global property compliance
                infrastructure standard — starting with the UK&apos;s £2.8B cross-border trust gap.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Every feature, every module, every verification pathway was designed to solve a real regulatory problem
                that existing platforms created but never addressed. We didn&apos;t add a feature — we created a new market category.
              </p>

              <Separator className="my-8" />

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">£2.8M</div>
                  <div className="text-sm text-muted-foreground mt-1">ARR target by Year 3</div>
                </div>
                <div>
                  <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">900K+</div>
                  <div className="text-sm text-muted-foreground mt-1">Annual UK arrivals needing verification</div>
                </div>
              </div>
            </motion.div>

            {/* Right: 5-Year Roadmap */}
            <motion.div variants={staggerItem}>
              <h3 className="text-2xl font-bold mb-6">5-Year Roadmap</h3>
              <div className="space-y-4">
                {[
                  { year: 'Year 1', label: 'UK Launch', description: 'Full UK property compliance platform with all 8 core modules and VerifyMe Global onboarding.', color: 'emerald', status: 'current' },
                  { year: 'Year 2', label: 'W3C DID Integration', description: 'Decentralised Identity credentials for portable, self-sovereign identity across platforms.', color: 'teal', status: 'upcoming' },
                  { year: 'Year 3', label: 'EU Expansion', description: 'Extend to EU property markets with GDPR-compliant cross-border verification.', color: 'cyan', status: 'upcoming' },
                  { year: 'Year 4-5', label: 'Global Scale', description: 'Worldwide trust infrastructure for cross-border property compliance.', color: 'emerald', status: 'upcoming' },
                ].map((milestone) => {
                  const colorMap: Record<string, string> = { emerald: 'bg-emerald-500', teal: 'bg-teal-500', cyan: 'bg-cyan-500' };
                  return (
                    <div key={milestone.year} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`size-3 rounded-full ${colorMap[milestone.color]} ${milestone.status === 'current' ? 'animate-pulse' : ''}`} />
                        <div className="w-0.5 h-full bg-gradient-to-b from-slate-200 to-transparent min-h-[40px]" />
                      </div>
                      <div className="pb-6">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">{milestone.year}</span>
                          <Badge variant="outline" className="text-[10px]">{milestone.label}</Badge>
                          {milestone.status === 'current' && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-[10px]">
                              <Timer className="size-2.5 mr-0.5" />
                              Current
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{milestone.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      {/* ═══════════ CTA SECTION ═══════════ */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero-trust-network.png')] bg-cover bg-center opacity-5" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.div variants={staggerItem}>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
                Ready to Transform
                <br />
                Cross-Border Property Compliance?
              </h2>
            </motion.div>
            <motion.p variants={staggerItem} className="mt-6 text-lg text-emerald-100 max-w-2xl mx-auto">
              Join the platform that&apos;s creating a new market category — and solving a £2.8B problem that nobody else addresses.
            </motion.p>
            <motion.div variants={staggerItem} className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={openLogin}
                size="lg"
                className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg w-full sm:w-auto"
              >
                Sign In
                <ArrowRight className="size-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 w-full sm:w-auto"
              >
                <Play className="size-4 mr-2" />
                Request Demo
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-slate-900 text-slate-300 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Logo + Description */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
                  <Shield className="size-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">PropComply AI</h3>
                  <p className="text-[10px] text-slate-400 font-medium">VerifyMe Global</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                The trust infrastructure for cross-border property compliance. Solving the £2.8B problem nobody else addresses.
              </p>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2">
                {['Platform Overview', 'Solutions', 'Pricing', 'Resources', 'About'].map((link) => (
                  <li key={link}>
                    <button
                      onClick={() => scrollTo(link.toLowerCase().replace(' ', '-'))}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2">
                {['Privacy Policy', 'Terms of Service', 'GDPR', 'Cookie Policy'].map((link) => (
                  <li key={link}>
                    <span className="text-sm text-slate-400 hover:text-white transition-colors cursor-pointer">{link}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Compliance Badges */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Compliance</h4>
              <div className="space-y-2">
                {[
                  { label: 'UK GDPR', icon: Shield },
                  { label: 'MLR 2017', icon: FileCheck },
                  { label: 'FCA', icon: Landmark },
                  { label: 'Immigration Act 2014', icon: Scale },
                ].map((badge) => (
                  <div key={badge.label} className="flex items-center gap-2 text-sm text-slate-400">
                    <badge.icon className="size-3.5 text-emerald-400" />
                    {badge.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Separator className="bg-slate-700 mb-6" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <span>&copy; 2024 PropComply AI Ltd. All rights reserved.</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <Shield className="size-3 text-emerald-500" />
                Trust Infrastructure Platform v1.0.0
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* ═══════════ LOGIN MODAL ═══════════ */}
      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="size-5 text-teal-600" />
              Sign In to PropComply AI
            </DialogTitle>
            <DialogDescription>
              Access the Trust Infrastructure Platform
            </DialogDescription>
          </DialogHeader>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Left: Login Form */}
            <div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="login-email">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-email"
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
                  <label className="text-sm font-medium" htmlFor="login-password">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-password"
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
                  className="w-full h-11 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md"
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

              <p className="mt-3 text-center text-xs text-muted-foreground">
                Protected by enterprise-grade security · Zero Trust Architecture
              </p>
            </div>

            {/* Right: Quick Access */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="size-4 text-teal-600" />
                <span className="text-sm font-semibold">Quick Access</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Select a demo account to explore the platform
              </p>
              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
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
                        <div className="text-xs font-semibold truncate">{roleDef.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{account.email}</div>
                      </div>
                      <ArrowRight className="size-3.5 text-muted-foreground group-hover:text-teal-600 transition-colors shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
