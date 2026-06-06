'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import DashboardOverview from '@/components/platform/DashboardOverview';
import IdentityTrust from '@/components/platform/IdentityTrust';
import ComplianceAutomation from '@/components/platform/ComplianceAutomation';
import RiskIntelligence from '@/components/platform/RiskIntelligence';
import PropertyIntelligence from '@/components/platform/PropertyIntelligence';
import PartnerEcosystem from '@/components/platform/PartnerEcosystem';
import AIAssistant from '@/components/platform/AIAssistant';

type SectionId = 'dashboard' | 'identity' | 'compliance' | 'risk' | 'property' | 'partners' | 'ai-assistant';

interface NavSection {
  id: SectionId;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const NAV_SECTIONS: NavSection[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="size-5" />, description: 'Platform overview & analytics', color: '#10b981' },
  { id: 'identity', label: 'Identity & Trust', icon: <ShieldCheck className="size-5" />, description: 'Verification & trust ladder', color: '#0d9488' },
  { id: 'compliance', label: 'Compliance', icon: <FileCheck className="size-5" />, description: 'AML/KYC/CDD automation', color: '#06b6d4' },
  { id: 'risk', label: 'Risk Intelligence', icon: <AlertTriangle className="size-5" />, description: 'Risk scoring & fraud detection', color: '#f59e0b' },
  { id: 'property', label: 'Property', icon: <Building2 className="size-5" />, description: 'Property compliance & intelligence', color: '#8b5cf6' },
  { id: 'partners', label: 'Partners', icon: <Handshake className="size-5" />, description: 'Ecosystem integrations', color: '#ec4899' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: <Bot className="size-5" />, description: 'Compliance AI chatbot', color: '#6366f1' },
];

const SECTION_META: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Platform Dashboard', subtitle: 'Real-time overview of identity verification, compliance, and risk metrics' },
  identity: { title: 'Identity & Trust', subtitle: 'Trust Ladder verification framework with progressive identity assurance' },
  compliance: { title: 'Compliance Automation', subtitle: 'AML/KYC/CDD/EDD workflows, screening, and regulatory compliance monitoring' },
  risk: { title: 'Risk Intelligence', subtitle: 'Risk scoring, fraud detection, trust assessment, and explainability analytics' },
  property: { title: 'Property Intelligence', subtitle: 'Property compliance, Right to Rent, guarantor replacement & market intelligence' },
  partners: { title: 'Partner Ecosystem', subtitle: 'Partner integrations, referral pipeline & banking referral services' },
  'ai-assistant': { title: 'AI Compliance Assistant', subtitle: 'Regulatory guidance chatbot powered by compliance knowledge base' },
};

export default function Home() {
  const [activeSection, setActiveSection] = useState<SectionId>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSectionChange = (section: SectionId) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
  };

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
                readOnly
              />
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 bg-emerald-50 hidden sm:flex">
              <span className="size-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Enterprise
            </Badge>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="size-5" />
              <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">3</span>
            </Button>
            <div className="size-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold cursor-pointer">
              JD
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col border-r bg-white/50 transition-all duration-300" style={{ width: sidebarCollapsed ? '64px' : '240px' }}>
          <ScrollArea className="flex-1 py-3">
            <nav className="space-y-1 px-2">
              {NAV_SECTIONS.map((section) => {
                const isActive = activeSection === section.id;
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
                    {NAV_SECTIONS.map((section) => {
                      const isActive = activeSection === section.id;
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
                <div className="border-t p-4">
                  <p className="text-xs text-muted-foreground">PropComply AI + VerifyMe Global</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Trust Infrastructure Platform v1.0.0</p>
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
                {SECTION_META[activeSection]?.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {SECTION_META[activeSection]?.subtitle}
              </p>
            </div>
          </div>

          {/* Section Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <AnimatePresence mode="wait">
              {activeSection === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <DashboardOverview />
                </motion.div>
              )}
              {activeSection === 'identity' && (
                <motion.div key="identity" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <IdentityTrust />
                </motion.div>
              )}
              {activeSection === 'compliance' && (
                <motion.div key="compliance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <ComplianceAutomation />
                </motion.div>
              )}
              {activeSection === 'risk' && (
                <motion.div key="risk" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <RiskIntelligence />
                </motion.div>
              )}
              {activeSection === 'property' && (
                <motion.div key="property" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <PropertyIntelligence />
                </motion.div>
              )}
              {activeSection === 'partners' && (
                <motion.div key="partners" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <PartnerEcosystem />
                </motion.div>
              )}
              {activeSection === 'ai-assistant' && (
                <motion.div key="ai-assistant" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <AIAssistant />
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
