'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  { role: 'partner_user', email: 'partner@barclays.ai', password: 'Partner@2024' },
  { role: 'tenant', email: 'tenant@example.com', password: 'Tenant@2024' },
];

const ROLE_ICONS: Record<string, React.ReactNode> = {
  platform_admin: <Crown className="size-4" />,
  compliance_officer: <Shield className="size-4" />,
  property_manager: <Building2 className="size-4" />,
  identity_verifier: <ScanFace className="size-4" />,
  risk_analyst: <AlertTriangle className="size-4" />,
  partner_user: <Handshake className="size-4" />,
  tenant: <User className="size-4" />,
};

export default function LoginPage({ error }: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState(error || '');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setLoginError(result.error);
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
      const result = await signIn('credentials', {
        email: account.email,
        password: account.password,
        redirect: false,
      });

      if (result?.error) {
        setLoginError(result.error);
      }
    } catch {
      setLoginError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-md">
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
          <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700 bg-emerald-50">
            <span className="size-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Enterprise Platform
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8">
          {/* Left: Login Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lock className="size-5 text-teal-600" />
                  <CardTitle className="text-xl">Sign In</CardTitle>
                </div>
                <CardDescription>
                  Access the PropComply AI Trust Infrastructure Platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium" htmlFor="email">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
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
                    <label className="text-sm font-medium" htmlFor="password">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
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

                <div className="mt-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Protected by enterprise-grade security &middot; Zero Trust Architecture
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right: Quick Access Demo Accounts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="border-0 shadow-lg h-full">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="size-5 text-teal-600" />
                  <CardTitle className="text-xl">Quick Access</CardTitle>
                </div>
                <CardDescription>
                  Select a demo account to explore the platform with role-specific access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {DEMO_ACCOUNTS.map((account) => {
                    const roleDef = ROLE_DEFINITIONS[account.role];
                    return (
                      <button
                        key={account.role}
                        onClick={() => handleQuickLogin(account)}
                        disabled={isLoading}
                        className="w-full flex items-center gap-3 p-3 rounded-lg border bg-white hover:bg-slate-50 hover:border-teal-300 transition-all duration-200 group text-left"
                      >
                        <div
                          className="flex size-9 items-center justify-center rounded-lg shrink-0"
                          style={{ backgroundColor: roleDef.bgColor, color: roleDef.color }}
                        >
                          {ROLE_ICONS[account.role]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">{roleDef.name}</div>
                          <div className="text-[11px] text-muted-foreground truncate">{account.email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 shrink-0"
                            style={{ borderColor: roleDef.color + '40', color: roleDef.color, backgroundColor: roleDef.bgColor }}
                          >
                            Lvl {roleDef.level}
                          </Badge>
                          <ArrowRight className="size-4 text-muted-foreground group-hover:text-teal-600 transition-colors shrink-0" />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Access Levels</p>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {[
                      { level: 7, label: 'Full Admin', color: '#dc2626' },
                      { level: 5, label: 'Compliance', color: '#0d9488' },
                      { level: 4, label: 'Operations', color: '#8b5cf6' },
                      { level: 3, label: 'Verifier', color: '#06b6d4' },
                      { level: 2, label: 'Partner', color: '#ec4899' },
                      { level: 1, label: 'Self-Service', color: '#10b981' },
                    ].map((item) => (
                      <div key={item.level} className="flex items-center gap-1.5">
                        <div className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-muted-foreground">Lvl {item.level}:</span>
                        <span className="font-medium">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

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
