'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  AlertTriangle,
  Landmark,
  Building2,
  FileBarChart,
  Handshake,
  Bot,
  Menu,
  X,
  Bell,
  Search,
  Shield,
  Settings2,
  LogOut,
  User,
  ChevronDown,
  ChevronRight,
  Download,
  Share2,
  HelpCircle,
  Scale,
  Briefcase,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import DashboardOverview from '@/components/platform/DashboardOverview';
import IdentityTrust from '@/components/platform/IdentityTrust';
import ComplianceAutomation from '@/components/platform/ComplianceAutomation';
import RiskIntelligence from '@/components/platform/RiskIntelligence';
import PropertyIntelligence from '@/components/platform/PropertyIntelligence';
import PartnerEcosystem from '@/components/platform/PartnerEcosystem';
import AIAssistant from '@/components/platform/AIAssistant';
import Settings from '@/components/platform/Settings';
import LandingPage from '@/components/platform/LandingPage';
import MLROWorkspace from '@/components/platform/MLROWorkspace';
import AMLWorkflowPage from '@/components/platform/AMLWorkflowPage';
import Reports from '@/components/platform/Reports';
import { canAccessSection, getRoleDefinition, type UserRole, type SectionId as RbacSectionId } from '@/lib/rbac';
import { generatePersonaReport } from '@/lib/persona-report';
import { openReportPreview } from '@/lib/report-export';
import ShareCredentialDialog from '@/components/platform/ShareCredentialDialog';

type SectionId = RbacSectionId;

function canAccess(role: UserRole, section: SectionId): boolean {
  return canAccessSection(role, section);
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  sectionId: SectionId;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-5" />, sectionId: 'dashboard' },
  { id: 'applicants', label: 'Applicants', icon: <Users className="size-5" />, sectionId: 'identity' },
  { id: 'compliance', label: 'Compliance', icon: <FileCheck className="size-5" />, sectionId: 'compliance' },
  { id: 'aml-workflow', label: 'AML Workflow', icon: <Shield className="size-5" />, sectionId: 'aml' },
  { id: 'cases', label: 'Case Management', icon: <Briefcase className="size-5" />, sectionId: 'cases' },
  { id: 'mlro-workspace', label: 'MLRO Workspace', icon: <Scale className="size-5" />, sectionId: 'mlro-workspace' },
  { id: 'risk-intelligence', label: 'Risk Intelligence', icon: <AlertTriangle className="size-5" />, sectionId: 'risk' },
  { id: 'right-to-rent', label: 'Right to Rent', icon: <Landmark className="size-5" />, sectionId: 'property' },
  { id: 'property-intelligence', label: 'Property Intelligence', icon: <Building2 className="size-5" />, sectionId: 'property' },
  { id: 'reports', label: 'Reports', icon: <FileBarChart className="size-5" />, sectionId: 'reports' },
  { id: 'partners', label: 'Partners', icon: <Handshake className="size-5" />, sectionId: 'partners' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: <Bot className="size-5" />, sectionId: 'ai-assistant' },
  { id: 'settings', label: 'Settings', icon: <Settings2 className="size-5" />, sectionId: 'settings' },
];

const SECTION_META: Record<SectionId, { title: string; subtitle: string }> = {
  dashboard: { title: 'Platform Dashboard', subtitle: 'Real-time overview of identity verification, compliance, and risk metrics' },
  identity: { title: 'Identity & Trust', subtitle: 'Trust Ladder verification framework with progressive identity assurance' },
  compliance: { title: 'Compliance Automation', subtitle: 'AML/KYC/CDD/EDD workflows, screening, and regulatory compliance monitoring' },
  aml: { title: 'AML Workflow', subtitle: 'CDD → EDD → SAR → MLRO sign-off — your stage is determined by your role' },
  reports: { title: 'Reports', subtitle: 'Filtered compliance, partner and referral reports — export to CSV or PDF' },
  cases: { title: 'Case Management', subtitle: 'FR-CASE001 — Manage compliance cases from CDD through to MLRO sign-off' },
  'mlro-workspace': { title: 'MLRO Workspace', subtitle: 'MLR 2017 Reg.21 — SAR adjudication, EDD sign-off, and audit trail verification' },
  risk: { title: 'Risk Intelligence', subtitle: 'Risk scoring, fraud detection, trust assessment, and explainability analytics' },
  property: { title: 'Property Intelligence', subtitle: 'Property compliance, Right to Rent, EPC/HMO risk scoring & market intelligence' },
  partners: { title: 'Partner Ecosystem', subtitle: 'Partner integrations, referral pipeline & banking referral services' },
  'ai-assistant': { title: 'AI Compliance Assistant', subtitle: 'Regulatory guidance powered by Claude AI — UK MLR 2017, AML, KYC, EDD, Right to Rent' },
  settings: { title: 'Settings', subtitle: 'Manage your profile, security, notifications, privacy, and platform configuration' },
  audit: { title: 'Audit Trail', subtitle: 'Tamper-evident hash-chained audit log for regulatory inspection' },
};

export default function Home() {
  const { data: session, status } = useSession();
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const [activeNavId, setActiveNavId] = useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [settingsTab, setSettingsTab] = useState('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;
    const fetchCount = () =>
      fetch('/api/notifications?unread=true')
        .then(r => r.ok ? r.json() : null)
        .then(d => { if (d?.unreadCount !== undefined) setUnreadCount(d.unreadCount); })
        .catch(() => {});
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [session?.user?.id]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut({ redirect: false });
      // Reload the current URL (preserves gateway/proxy URL in sandbox)
      window.location.reload();
    } catch {
      setIsSigningOut(false);
    }
  };

  // Get user role and filtered nav items
  const userRole = (session?.user?.role || 'tenant') as UserRole;
  const roleDef = getRoleDefinition(userRole);

  // Filter nav items based on whether their target section is accessible for the role
  const navItems = NAV_ITEMS.filter((item) => canAccess(userRole, item.sectionId));

  // Derive valid active section — fallback to first accessible section if current is not accessible
  const validSection: SectionId = canAccess(userRole, activeSection)
    ? activeSection
    : (navItems[0]?.sectionId ?? 'dashboard');

  // Derive valid active nav id — fallback to first nav item if current is not accessible
  const validNavId: string = navItems.some((n) => n.id === activeNavId)
    ? activeNavId
    : (navItems[0]?.id ?? 'dashboard');

  const activeNavItem = navItems.find((n) => n.id === validNavId);

  const handleNavClick = (item: NavItem) => {
    setActiveNavId(item.id);
    setActiveSection(item.sectionId);
    setMobileMenuOpen(false);
    if (item.sectionId === 'settings') {
      setSettingsTab('profile');
    }
  };

  // Used by child components (DashboardOverview, PropertyIntelligence) and other in-page navigations
  const handleSectionChange = (section: SectionId, tab?: string) => {
    setActiveSection(section);
    // Sync active nav id to the first nav item that maps to this section
    const matchingItem = NAV_ITEMS.find((n) => n.sectionId === section);
    if (matchingItem) {
      setActiveNavId(matchingItem.id);
    }
    setMobileMenuOpen(false);
    if (section === 'settings' && tab) {
      setSettingsTab(tab);
    }
  };

  // Show login page if not authenticated
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.png" alt="PropComply AI + VerifyMe Global" className="h-12 w-auto max-w-[260px] object-contain animate-pulse" />
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="size-4 border-2 border-[#10B981]/30 border-t-[#10B981] rounded-full animate-spin" />
            <span className="text-sm">Loading platform...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LandingPage />;
  }

  const goToDashboard = () => {
    const dash = navItems.find((n) => n.id === 'dashboard') ?? navItems[0];
    if (dash) handleNavClick(dash);
  };

  const openAssistant = () => {
    const ai = navItems.find((n) => n.sectionId === 'ai-assistant');
    if (ai) handleNavClick(ai);
  };

  // Generate a persona-specific report and open it in a preview window
  // (the user can Print / Save as PDF from there). Available to every persona.
  const handleDownloadReport = async () => {
    if (isGeneratingReport) return;
    setIsGeneratingReport(true);
    try {
      const html = await generatePersonaReport(userRole, { name: session.user.name, email: session.user.email });
      openReportPreview(html);
    } catch {
      // Non-fatal — preview simply won't open
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FAFB]">
      {/* Header (white background) */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 gap-4">
          {/* Left: Mobile menu + Breadcrumb / mobile logo */}
          <div className="flex items-center gap-3 min-w-0 lg:flex-none flex-1 lg:flex-initial lg:w-auto">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-[#0F172A] hover:text-[#0F172A] hover:bg-slate-100 shrink-0"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>

            {/* Logo in top header banner (white bg — full wordmark) */}
            <img src="/logo.png" alt="PropComply AI + VerifyMe Global" className="h-8 w-auto object-contain shrink-0" />

            {/* Divider + Desktop breadcrumb */}
            <div className="hidden lg:block h-6 w-px bg-slate-200 shrink-0" />
            <nav className="hidden lg:flex items-center gap-2 text-sm" aria-label="Breadcrumb">
              <button
                onClick={goToDashboard}
                className="text-slate-500 hover:text-[#0F172A] transition-colors"
              >
                Dashboard
              </button>
              {validNavId !== 'dashboard' && activeNavItem && (
                <>
                  <ChevronRight className="size-3.5 text-slate-400" />
                  <span className="text-[#0F172A] font-medium truncate max-w-[220px]">
                    {activeNavItem.label}
                  </span>
                </>
              )}
            </nav>
          </div>

          {/* Center - Search (desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search anything..."
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm placeholder:text-slate-400 focus:border-[#10B981] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#10B981]/20 transition-colors"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.trim()) {
                    handleSectionChange('identity');
                  }
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Role Badge (hidden on small screens to save space) */}
            <Badge
              variant="outline"
              className="text-[10px] hidden xl:flex"
              style={{ borderColor: roleDef.color + '40', color: roleDef.color, backgroundColor: roleDef.bgColor }}
            >
              {roleDef.name}
            </Badge>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-[#0F172A] hover:text-[#0F172A] hover:bg-slate-100"
              aria-label="Notifications"
              onClick={() => handleSectionChange('settings')}
            >
              <Bell className="size-5" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden sm:flex items-center gap-1.5 rounded-lg p-1 hover:bg-slate-100 transition-colors">
                  <Avatar className="size-8 border-2" style={{ borderColor: '#10B981' + '60' }}>
                    <AvatarFallback className="text-xs font-bold" style={{ backgroundColor: roleDef.bgColor, color: roleDef.color }}>
                      {session.user.avatar || '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-semibold leading-tight text-[#0F172A]">{session.user.name}</p>
                    <p className="text-[10px] text-slate-500 leading-tight">{session.user.jobTitle || roleDef.name}</p>
                  </div>
                  <ChevronDown className="size-3 text-slate-400 hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{session.user.name}</p>
                    <p className="text-xs text-muted-foreground">{session.user.email}</p>
                    <Badge
                      variant="outline"
                      className="text-[9px] w-fit"
                      style={{ borderColor: '#10B981' + '40', color: '#10B981', backgroundColor: '#10B981' + '10' }}
                    >
                      {roleDef.name} &middot; Level {roleDef.level}
                    </Badge>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleSectionChange('settings', 'profile')} className="cursor-pointer">
                  <User className="mr-2 size-4" />
                  Profile & Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSectionChange('settings', 'security')} className="cursor-pointer">
                  <Shield className="mr-2 size-4" />
                  Security
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  {isSigningOut ? (
                    <div className="mr-2 size-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                  ) : (
                    <LogOut className="mr-2 size-4" />
                  )}
                  {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Download Report button — persona-specific report preview */}
            <Button
              variant="outline"
              size="sm"
              className="hidden lg:flex border-slate-300 text-[#0F172A] hover:bg-slate-50 hover:border-slate-400"
              onClick={handleDownloadReport}
              disabled={isGeneratingReport}
              title="Generate a report for your role and preview it (Save as PDF)"
            >
              {isGeneratingReport ? (
                <div className="size-4 mr-1.5 border-2 border-slate-300 border-t-[#0F172A] rounded-full animate-spin" />
              ) : (
                <Download className="size-4 mr-1.5" />
              )}
              {isGeneratingReport ? 'Generating…' : 'Download Report'}
            </Button>

            {/* Share Credential button */}
            <Button
              size="sm"
              className="hidden lg:flex bg-[#10B981] hover:bg-[#059669] text-white shadow-sm"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="size-4 mr-1.5" />
              Share Credential
            </Button>
          </div>
        </div>
      </header>

      <ShareCredentialDialog open={shareOpen} onOpenChange={setShareOpen} />

      <div className="flex flex-1 min-h-0">
        {/* Desktop Sidebar (deep navy #0F172A) */}
        <aside className="hidden lg:flex flex-col w-64 bg-[#0F172A] shrink-0">
          {/* Navigation items (logo now lives in the top header banner) */}
          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-1 px-3" aria-label="Main navigation">
              {navItems.map((item) => {
                const isActive = validNavId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[#10B981] text-white shadow-md shadow-[#10B981]/20'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className={`shrink-0 ${isActive ? 'text-white' : 'text-white/70'}`}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Need Help section + Open Assistant button */}
          <div className="px-3 py-3 border-t border-white/10">
            <div className="rounded-lg bg-white/5 p-3 mb-3">
              <div className="flex items-center gap-2 mb-1">
                <HelpCircle className="size-4 text-[#10B981]" />
                <p className="text-sm font-semibold text-white">Need Help?</p>
              </div>
              <p className="text-[11px] text-white/60 mb-2.5 leading-snug">
                Ask our AI Compliance Assistant
              </p>
              <Button
                size="sm"
                className="w-full bg-[#10B981] hover:bg-[#059669] text-white"
                onClick={openAssistant}
              >
                <Bot className="size-3.5 mr-1.5" />
                Open Assistant
              </Button>
            </div>

            {/* User profile at bottom */}
            <div className="flex items-center gap-3 px-1 py-1.5 rounded-lg">
              <Avatar className="size-9 border-2" style={{ borderColor: '#10B981' + '60' }}>
                <AvatarFallback className="text-xs font-bold" style={{ backgroundColor: roleDef.bgColor, color: roleDef.color }}>
                  {session.user.avatar || '??'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold truncate text-white">{session.user.name}</p>
                <p className="text-[10px] text-white/50 truncate">{roleDef.name}</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.aside
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="fixed left-0 top-16 bottom-0 z-50 w-[280px] bg-[#0F172A] shadow-xl lg:hidden flex flex-col"
              >
                {/* Logo lives in the top header banner */}
                <ScrollArea className="flex-1 py-4">
                  <nav className="space-y-1 px-3" aria-label="Mobile navigation">
                    {navItems.map((item) => {
                      const isActive = validNavId === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item)}
                          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-[#10B981] text-white shadow-md shadow-[#10B981]/20'
                              : 'text-white/70 hover:bg-white/10 hover:text-white'
                          }`}
                        >
                          <span className={isActive ? 'text-white' : 'text-white/70'}>{item.icon}</span>
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </ScrollArea>

                {/* Need Help section + Open Assistant */}
                <div className="px-3 py-3 border-t border-white/10">
                  <div className="rounded-lg bg-white/5 p-3 mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <HelpCircle className="size-4 text-[#10B981]" />
                      <p className="text-sm font-semibold text-white">Need Help?</p>
                    </div>
                    <p className="text-[11px] text-white/60 mb-2.5 leading-snug">
                      Ask our AI Compliance Assistant
                    </p>
                    <Button
                      size="sm"
                      className="w-full bg-[#10B981] hover:bg-[#059669] text-white"
                      onClick={openAssistant}
                    >
                      <Bot className="size-3.5 mr-1.5" />
                      Open Assistant
                    </Button>
                  </div>

                  {/* User profile at bottom */}
                  <div className="flex items-center gap-3 px-1 py-1.5">
                    <Avatar className="size-9 border-2" style={{ borderColor: '#10B981' + '60' }}>
                      <AvatarFallback className="text-xs font-bold" style={{ backgroundColor: roleDef.bgColor, color: roleDef.color }}>
                        {session.user.avatar || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold truncate text-white">{session.user.name}</p>
                      <p className="text-[10px] text-white/50 truncate">{roleDef.name}</p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 border-white/10"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                  >
                    {isSigningOut ? (
                      <div className="size-4 mr-2 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                    ) : (
                      <LogOut className="size-4 mr-2" />
                    )}
                    {isSigningOut ? 'Signing out...' : 'Sign Out'}
                  </Button>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Section Header with light gray bg + teal left border */}
          <div className="border-b border-slate-200 bg-[#F9FAFB] px-4 sm:px-6 py-5">
            <div className="max-w-7xl mx-auto">
              {/* Breadcrumb-style subtitle above the title */}
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 pl-4">
                <button onClick={goToDashboard} className="hover:text-[#0F172A] transition-colors">
                  Dashboard
                </button>
                {validNavId !== 'dashboard' && activeNavItem && (
                  <>
                    <ChevronRight className="size-3" />
                    <span className="text-slate-700 font-medium">{activeNavItem.label}</span>
                  </>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] border-l-4 border-[#10B981] pl-4">
                {SECTION_META[validSection]?.title}
              </h2>
              <p className="text-sm text-slate-500 mt-1.5 pl-4">
                {SECTION_META[validSection]?.subtitle}
              </p>
            </div>
          </div>

          {/* Section Content */}
          <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6">
            <AnimatePresence mode="wait">
              {validSection === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <DashboardOverview onNavigate={handleSectionChange} />
                </motion.div>
              )}
              {validSection === 'identity' && (
                <motion.div key={`identity-${validNavId}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <IdentityTrust searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} focus={validNavId} />
                </motion.div>
              )}
              {validSection === 'compliance' && (
                <motion.div key="compliance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <ComplianceAutomation />
                </motion.div>
              )}
              {validSection === 'aml' && (
                <motion.div key="aml" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <AMLWorkflowPage />
                </motion.div>
              )}
              {validSection === 'risk' && (
                <motion.div key="risk" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <RiskIntelligence />
                </motion.div>
              )}
              {validSection === 'property' && (
                <motion.div key="property" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <PropertyIntelligence onNavigate={(s: string) => handleSectionChange(s as SectionId)} />
                </motion.div>
              )}
              {validSection === 'cases' && (
                <motion.div key="cases" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <ComplianceAutomation />
                </motion.div>
              )}
              {validSection === 'mlro-workspace' && (
                <motion.div key="mlro-workspace" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <MLROWorkspace />
                </motion.div>
              )}
              {validSection === 'reports' && (
                <motion.div key="reports" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <Reports />
                </motion.div>
              )}
              {validSection === 'partners' && (
                <motion.div key="partners" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <PartnerEcosystem />
                </motion.div>
              )}
              {validSection === 'ai-assistant' && (
                <motion.div key="ai-assistant" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <AIAssistant />
                </motion.div>
              )}
              {validSection === 'settings' && (
                <motion.div key={`settings-${settingsTab}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <Settings initialTab={settingsTab} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Footer (navy #0F172A) */}
      <footer className="bg-[#0F172A] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Main footer content */}
          <div className="py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Brand column */}
            <div className="sm:col-span-2 lg:col-span-1">
              <img
                src="/logo.png"
                alt="PropComply AI + VerifyMe Global"
                className="h-8 w-auto max-w-[220px] object-contain mb-3"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
              <p className="text-white/50 text-xs leading-relaxed">
                Trust Infrastructure Platform for identity verification, compliance automation, and risk intelligence.
              </p>
            </div>

            {/* Regulatory Compliance */}
            <div>
              <h4 className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-3">Regulatory Compliance</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-white/50 text-xs hover:text-[#10B981] transition-colors flex items-center gap-1.5">
                    <ExternalLink className="size-3" />
                    UK GDPR
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/50 text-xs hover:text-[#10B981] transition-colors flex items-center gap-1.5">
                    <ExternalLink className="size-3" />
                    UK MLR 2017
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/50 text-xs hover:text-[#10B981] transition-colors flex items-center gap-1.5">
                    <ExternalLink className="size-3" />
                    FCA Compliance
                  </a>
                </li>
                <li>
                  <a href="#" className="text-white/50 text-xs hover:text-[#10B981] transition-colors flex items-center gap-1.5">
                    <ExternalLink className="size-3" />
                    Immigration Act 2014
                  </a>
                </li>
              </ul>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-3">Platform</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-white/50 text-xs hover:text-[#10B981] transition-colors">Identity Verification</a>
                </li>
                <li>
                  <a href="#" className="text-white/50 text-xs hover:text-[#10B981] transition-colors">Compliance Automation</a>
                </li>
                <li>
                  <a href="#" className="text-white/50 text-xs hover:text-[#10B981] transition-colors">Risk Intelligence</a>
                </li>
                <li>
                  <a href="#" className="text-white/50 text-xs hover:text-[#10B981] transition-colors">Property Intelligence</a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-3">Legal</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-white/50 text-xs hover:text-[#10B981] transition-colors">Privacy Policy</a>
                </li>
                <li>
                  <a href="#" className="text-white/50 text-xs hover:text-[#10B981] transition-colors">Terms of Service</a>
                </li>
                <li>
                  <a href="#" className="text-white/50 text-xs hover:text-[#10B981] transition-colors">Data Processing</a>
                </li>
                <li>
                  <a href="#" className="text-white/50 text-xs hover:text-[#10B981] transition-colors">Cookie Policy</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 py-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
              <span>&copy; {new Date().getFullYear()} PropComply AI + VerifyMe Global. All rights reserved.</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <Shield className="size-3" />
                  Trust Infrastructure Platform
                </span>
                <Separator orientation="vertical" className="h-3 bg-white/20" />
                <span>UK GDPR &middot; UK MLR 2017 &middot; FCA &middot; Immigration Act 2014</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
