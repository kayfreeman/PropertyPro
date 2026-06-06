'use client';

import { motion } from 'framer-motion';
import { Menu, ShieldCheck, Bell, Search, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { usePlatformStore } from '@/hooks/use-platform';

export function Header() {
  const { toggleSidebar } = usePlatformStore();

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-white px-4 sm:px-6"
    >
      {/* Left section */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="shrink-0"
          aria-label="Toggle sidebar"
        >
          <Menu className="size-5" />
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <ShieldCheck className="size-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold leading-tight text-foreground">
              PropComply AI
            </h1>
            <p className="text-[11px] leading-tight text-muted-foreground">
              + VerifyMe Global
            </p>
          </div>
          <span className="text-sm font-semibold text-foreground sm:hidden">
            PCAI
          </span>
        </div>
      </div>

      {/* Center section - Search */}
      <div className="hidden flex-1 justify-center md:flex">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search identities, compliance, properties..."
            className="h-9 w-full rounded-lg border bg-muted/50 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            readOnly
          />
        </div>
      </div>

      {/* Right section */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notification bell */}
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          <Badge className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full p-0 text-[10px]">
            3
          </Badge>
        </Button>

        {/* Theme toggle */}
        <Button variant="ghost" size="icon" aria-label="Toggle theme">
          <Sun className="size-5 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-5 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
        </Button>

        {/* User avatar */}
        <Avatar className="size-8 cursor-pointer">
          <AvatarFallback className="bg-emerald-100 text-xs font-medium text-emerald-700">
            JD
          </AvatarFallback>
        </Avatar>
      </div>
    </motion.header>
  );
}
