'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Building2,
  Handshake,
  Bot,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Shield,
  Settings2,
  LogOut,
  User,
  ChevronDown,
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
import LoginPage from '@/components/platform/LoginPage';
import { canAccessSection, getRoleDefinition, type UserRole } from '@/lib/rbac';

type SectionId = 'dashboard' | 'identity' | 'compliance' | 'risk' | 'property' | 'partners' | 'ai-assistant' | 'settings';

interface NavSection {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const ALL_NAV_SECTIONS: NavSection[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-5" />, description: 'Platform overview & analytics', color: '#10b981' },
  { id: 'identity', label: 'Identity & Trust', icon: <ShieldCheck className="size-5" />, description: 'Verification & trust ladder', color: '#0d9488' },
  { id: 'compliance', label: 'Compliance', icon: <FileCheck className="size-5" />, description: 'AML/KYC/CDD automation', color: '#06b6d4' },
  { id: 'risk', label: 'Risk Intelligence', icon: <AlertTriangle className="size-5" />, description: 'Risk scoring & fraud detection', color: '#f59e0b' },
  { id: 'property', label: 'Property', icon: <Building2 className="size-5" />, description: 'Property compliance & intelligence', color: '#8b5cf6' },
  { id: 'partners', label: 'Partners', icon: <Handshake className="size-5" />, description: 'Ecosystem integrations', color: '#ec4899' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: <Bot className="size-5" />, description: 'Compliance AI chatbot', color: '#6366f1' },
  { id: 'settings', label: 'Settings', icon: <Settings2 className="size-5" />, description: 'Profile, security & platform config', color: '#64748b' },
];

const SECTION_META: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Platform Dashboard', subtitle: 'Real-time overview of identity verification, compliance, and risk metrics' },
  identity: { title: 'Identity & Trust', subtitle: 'Trust Ladder verification framework with progressive identity assurance' },
  compliance: { title: 'Compliance Automation', subtitle: 'AML/KYC/CDD/EDD workflows, screening, and regulatory compliance monitoring' },
  risk: { title: 'Risk Intelligence', subtitle: 'Risk scoring, fraud detection, trust assessment, and explainability analytics' },
  property: { title: 'Property Intelligence', subtitle: 'Property compliance, Right to Rent, guarantor replacement & market intelligence' },
  partners: { title: 'Partner Ecosystem', subtitle: 'Partner integrations, referral pipeline & banking referral services' },
  'ai-assistant': { title: 'AI Compliance Assistant', subtitle: 'Regulatory guidance chatbot powered by compliance knowledge base' },
  settings: { title: 'Settings', subtitle: 'Manage your profile, security, notifications, privacy, and platform configuration' },
};

export default function Home() {
  const { data: session, status } = useSession();
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [settingsTab, setSettingsTab] = useState('profile');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Get user role and filtered sections
  const userRole = (session?.user?.role || 'tenant') as UserRole;
  const roleDef = getRoleDefinition(userRole);

  // Filter nav sections based on role
  const navSections = ALL_NAV_SECTIONS.filter(s => canAccessSection(userRole, s.id));

  // Derive valid active section — fallback to first accessible if current is not accessible
  const validSection = canAccessSection(userRole, activeSection) ? activeSection : (navSections[0]?.id || 'dashboard') as SectionId;

  const handleSectionChange = (section: SectionId, tab?: string) => {
    setActiveSection(section);
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
          <div className="size-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg animate-pulse">
            <Shield className="size-7 text-white" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="size-4 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" />
            <span className="text-sm">Loading platform...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="flex items-center justify-between h-14 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>

            {/* Logo */}
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
          </div>

          {/* Center - Search (desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search identities, compliance, properties..."
                className="h-9 w-full rounded-lg border bg-muted/50 pl-9 pr-4 text-sm placeholder:text-muted-foreground focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Role Badge */}
            <Badge
              variant="outline"
              className="text-[10px] hidden sm:flex"
              style={{ borderColor: roleDef.color + '40', color: roleDef.color, backgroundColor: roleDef.bgColor }}
            >
              {roleDef.name}
            </Badge>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications" onClick={() => handleSectionChange('settings')}>
              <Bell className="size-5" />
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">3</span>
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1.5 rounded-lg p-1 hover:bg-muted/60 transition-colors">
                  <Avatar className="size-8 border-2" style={{ borderColor: roleDef.color + '40' }}>
                    <AvatarFallback className="text-xs font-bold" style={{ backgroundColor: roleDef.bgColor, color: roleDef.color }}>
                      {session.user.avatar || '??'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-semibold leading-tight">{session.user.name}</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">{session.user.jobTitle || roleDef.name}</p>
                  </div>
                  <ChevronDown className="size-3 text-muted-foreground hidden md:block" />
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
                      style={{ borderColor: roleDef.color + '40', color: roleDef.color, backgroundColor: roleDef.bgColor }}
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
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col border-r bg-white/50 transition-all duration-300" style={{ width: sidebarCollapsed ? '64px' : '240px' }}>
          <ScrollArea className="flex-1 py-3">
            <nav className="space-y-1 px-2">
              {navSections.map((section) => {
                const isActive = validSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionChange(section.id)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                    }`}
                    title={sidebarCollapsed ? section.label : undefined}
                  >
                    <span className={`shrink-0 transition-colors ${isActive ? 'text-emerald-600' : 'text-muted-foreground group-hover:text-foreground'}`}>
                      {section.icon}
                    </span>
                    {!sidebarCollapsed && (
                      <span className="truncate">{section.label}</span>
                    )}
                    {isActive && !sidebarCollapsed && (
                      <span className="ml-auto size-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                );
              })}
            </nav>
          </ScrollArea>

          {/* Sidebar footer */}
          <div className="border-t p-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
            </Button>
            {!sidebarCollapsed && (
              <div className="mt-2 text-center">
                <p className="text-[10px] text-muted-foreground">Trust Infrastructure v1.0.0</p>
              </div>
            )}
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
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="fixed left-0 top-14 bottom-0 z-50 w-[280px] border-r bg-white shadow-xl lg:hidden"
              >
                <ScrollArea className="flex-1 py-3">
                  <nav className="space-y-1 px-3">
                    {navSections.map((section) => {
                      const isActive = validSection === section.id;
                      return (
                        <button
                          key={section.id}
                          onClick={() => handleSectionChange(section.id)}
                          className={`w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                          }`}
                        >
                          <span className={isActive ? 'text-emerald-600' : ''}>{section.icon}</span>
                          <div className="text-left">
                            <div>{section.label}</div>
                            <div className="text-[10px] text-muted-foreground font-normal">{section.description}</div>
                          </div>
                          {isActive && (
                            <span className="ml-auto size-1.5 rounded-full bg-emerald-500" />
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </ScrollArea>

                {/* Mobile user info & logout */}
                <div className="border-t p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="size-8 border" style={{ borderColor: roleDef.color + '40' }}>
                      <AvatarFallback className="text-xs font-bold" style={{ backgroundColor: roleDef.bgColor, color: roleDef.color }}>
                        {session.user.avatar || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{session.user.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{session.user.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                  >
                    {isSigningOut ? (
                      <div className="size-4 mr-2 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                    ) : (
                      <LogOut className="size-4 mr-2" />
                    )}
                    {isSigningOut ? 'Signing out...' : 'Sign Out'}
                  </Button>
                  <p className="text-[10px] text-muted-foreground mt-2">PropComply AI + VerifyMe Global v1.0.0</p>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          {/* Section Header */}
          <div className="border-b bg-white/60 backdrop-blur-sm px-4 sm:px-6 py-4">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {SECTION_META[validSection]?.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {SECTION_META[validSection]?.subtitle}
              </p>
            </div>
          </div>

          {/* Section Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <AnimatePresence mode="wait">
              {validSection === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <DashboardOverview onNavigate={handleSectionChange} />
                </motion.div>
              )}
              {validSection === 'identity' && (
                <motion.div key="identity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <IdentityTrust searchQuery={searchQuery} onClearSearch={() => setSearchQuery('')} />
                </motion.div>
              )}
              {validSection === 'compliance' && (
                <motion.div key="compliance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <ComplianceAutomation />
                </motion.div>
              )}
              {validSection === 'risk' && (
                <motion.div key="risk" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <RiskIntelligence />
                </motion.div>
              )}
              {validSection === 'property' && (
                <motion.div key="property" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <PropertyIntelligence onNavigate={handleSectionChange} />
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

      {/* Footer */}
      <footer className="border-t bg-white/60 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>&copy; 2024 PropComply AI + VerifyMe Global. All rights reserved.</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <Shield className="size-3" />
                Trust Infrastructure Platform
              </span>
              <Separator orientation="vertical" className="h-3" />
              <span>UK GDPR &middot; UK MLR 2017 &middot; FCA &middot; Immigration Act 2014</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
