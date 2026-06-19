'use client';

import {
  Circle,
  Clock,
  Loader,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  Send,
  MinusCircle,
  ShieldCheck,
  Eye,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { getStatus, type StatusDomain } from '@/lib/status';

const ICONS: Record<string, LucideIcon> = {
  Circle, Clock, Loader, CheckCircle2, XCircle, AlertTriangle, AlertOctagon,
  HelpCircle, Send, MinusCircle, ShieldCheck, Eye,
};

/**
 * Consistent status indicator used across Right to Rent, Application,
 * Compliance and Risk. Resolves the raw status through the unified framework
 * (src/lib/status.ts) so labels, colours and icons match everywhere.
 *
 * variant:
 *  - 'badge'    — compact pill (default)
 *  - 'detailed' — badge + description + (optional) progress bar + next-step hint
 */
export default function StatusIndicator({
  domain,
  status,
  variant = 'badge',
  showProgress = false,
  className,
}: {
  domain: StatusDomain;
  status: string | null | undefined;
  variant?: 'badge' | 'detailed';
  showProgress?: boolean;
  className?: string;
}) {
  const s = getStatus(domain, status);
  const Icon = ICONS[s.icon] ?? Circle;
  const spin = s.icon === 'Loader';

  const badge = (
    <Badge
      variant="outline"
      className={`gap-1 text-[11px] font-medium ${className ?? ''}`}
      style={{ color: s.color, backgroundColor: s.bgColor, borderColor: s.color + '40' }}
    >
      <Icon className={`size-3 ${spin ? 'animate-spin' : ''}`} />
      {s.label}
    </Badge>
  );

  if (variant === 'badge') return badge;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        {badge}
        {s.actionRequired && (
          <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-600">
            Action needed
          </span>
        )}
      </div>
      {(showProgress && typeof s.progress === 'number') && (
        <Progress value={s.progress} className="h-1.5" />
      )}
      {s.description && (
        <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
      )}
    </div>
  );
}
