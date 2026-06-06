'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Building2,
  Handshake,
  Bot,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { NAV_SECTIONS } from '@/lib/platform-data';
import type { SectionId } from '@/lib/platform-data';
import { usePlatformStore } from '@/hooks/use-platform';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Building2,
  Handshake,
  Bot,
};

export function Sidebar() {
  const { activeSection, setActiveSection, sidebarOpen, setSidebarOpen } =
    usePlatformStore();

  // Close sidebar on mobile when section changes
  const handleSectionClick = (sectionId: SectionId) => {
    setActiveSection(sectionId);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Close sidebar on mobile on outside click
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-white">
      {/* Branding */}
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
          PC
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <p className="text-sm font-semibold text-foreground">PCAI</p>
              <p className="text-[11px] text-muted-foreground">
                PropComply AI
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="flex flex-col gap-1">
          {NAV_SECTIONS.map((section) => {
            const Icon = iconMap[section.icon];
            const isActive = activeSection === section.id;

            const navItem = (
              <button
                key={section.id}
                onClick={() => handleSectionClick(section.id)}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {Icon && (
                  <Icon
                    className={`size-5 shrink-0 ${
                      isActive ? 'text-emerald-600' : 'text-muted-foreground group-hover:text-foreground'
                    }`}
                  />
                )}
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {section.label}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeSection"
                    className="absolute left-0 h-6 w-1 rounded-r-full bg-emerald-600"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );

            // Show tooltip when sidebar is collapsed
            if (!sidebarOpen) {
              return (
                <Tooltip key={section.id}>
                  <TooltipTrigger asChild>{navItem}</TooltipTrigger>
                  <TooltipContent side="right" className="flex flex-col gap-1">
                    <span className="font-medium">{section.label}</span>
                    <span className="text-xs text-primary-foreground/70">
                      {section.description}
                    </span>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return navItem;
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Collapse toggle */}
      <div className="hidden items-center justify-between px-3 py-2 md:flex">
        <AnimatePresence>
          {sidebarOpen && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[11px] text-muted-foreground"
            >
              Collapse sidebar
            </motion.span>
          )}
        </AnimatePresence>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="size-8"
          aria-label={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {sidebarOpen ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </Button>
      </div>

      <Separator />

      {/* Bottom section */}
      <div className="px-4 py-3">
        <AnimatePresence mode="wait">
          {sidebarOpen ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between"
            >
              <Badge variant="secondary" className="text-[10px]">
                Enterprise Platform
              </Badge>
              <span className="text-[10px] text-muted-foreground">v1.0.0</span>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center"
            >
              <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                EP
              </Badge>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 64 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] overflow-hidden border-r bg-white ${
          sidebarOpen ? 'shadow-lg md:shadow-none' : ''
        } ${!sidebarOpen ? 'hidden md:block' : ''}`}
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}
