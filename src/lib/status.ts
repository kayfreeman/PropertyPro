// PropComply AI — Unified status framework
// Single source of truth for status labels, tones, icons, descriptions and
// progress across the tenant journey: Right to Rent, Property Application,
// Compliance and Risk. Components should resolve statuses through getStatus()
// so labels and visual indicators stay consistent everywhere.

export type StatusDomain = 'rtr' | 'application' | 'compliance' | 'risk';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'progress' | 'neutral';

export interface StatusDescriptor {
  key: string; // canonical key
  label: string; // human-friendly label
  tone: StatusTone;
  color: string; // foreground/accent colour
  bgColor: string; // soft background
  icon: string; // lucide-react icon name (resolved by <StatusIndicator>)
  description?: string; // one-line explanation for the user
  progress?: number; // 0-100 lifecycle position, where meaningful
  actionRequired?: boolean; // true => the user must do something next
}

const TONE_COLORS: Record<StatusTone, { color: string; bgColor: string }> = {
  success: { color: '#059669', bgColor: '#ecfdf5' },
  warning: { color: '#d97706', bgColor: '#fffbeb' },
  danger: { color: '#dc2626', bgColor: '#fef2f2' },
  info: { color: '#0891b2', bgColor: '#ecfeff' },
  progress: { color: '#2563eb', bgColor: '#eff6ff' },
  neutral: { color: '#64748b', bgColor: '#f1f5f9' },
};

type StatusSpec = {
  label: string;
  tone: StatusTone;
  icon: string;
  description?: string;
  progress?: number;
  actionRequired?: boolean;
  aliases?: string[];
};

const REGISTRY: Record<StatusDomain, Record<string, StatusSpec>> = {
  // ── Right to Rent — the 7 lifecycle statuses ──────────────────────────────
  rtr: {
    not_started: { label: 'Not Started', tone: 'neutral', icon: 'Circle', progress: 0, description: "You haven't started your Right to Rent check yet." },
    in_progress: { label: 'In Progress', tone: 'progress', icon: 'Loader', progress: 40, description: 'Your Right to Rent application is being prepared.' },
    verification_pending: { label: 'Verification Pending', tone: 'warning', icon: 'Clock', progress: 70, description: 'Your documents are being verified against the Home Office database.', aliases: ['pending', 'submitted'] },
    approved: { label: 'Approved', tone: 'success', icon: 'CheckCircle2', progress: 100, description: 'Your Right to Rent is verified and active under the Immigration Act 2014.', aliases: ['verified', 'cleared', 'active'] },
    rejected: { label: 'Rejected', tone: 'danger', icon: 'XCircle', progress: 100, description: 'Your Right to Rent check could not be verified.', actionRequired: true, aliases: ['failed', 'denied'] },
    expired: { label: 'Expired', tone: 'danger', icon: 'AlertTriangle', progress: 100, description: 'Your Right to Rent has expired — re-verification is required.', actionRequired: true },
    additional_info_required: { label: 'Additional Info Required', tone: 'warning', icon: 'HelpCircle', progress: 55, description: 'Additional information or documents are required to continue.', actionRequired: true, aliases: ['more_info', 'more_evidence', 'additional_information', 'info_required'] },
  },

  // ── Property Application ───────────────────────────────────────────────────
  application: {
    not_started: { label: 'Not Started', tone: 'neutral', icon: 'Circle', progress: 0 },
    submitted: { label: 'Submitted', tone: 'info', icon: 'Send', progress: 25, description: 'Application submitted and awaiting review.', aliases: ['new'] },
    in_review: { label: 'In Review', tone: 'progress', icon: 'Loader', progress: 55, description: 'Your application is under review by the letting agent.', aliases: ['under_review', 'reviewing', 'pending', 'processing', 'under_investigation'] },
    additional_info_required: { label: 'Pending Information', tone: 'warning', icon: 'HelpCircle', progress: 40, description: 'Additional information is required before your application can proceed.', actionRequired: true, aliases: ['pending_information', 'info_required', 'more_info', 'additional_information'] },
    on_hold: { label: 'On Hold', tone: 'warning', icon: 'Clock', progress: 55, description: 'Held for further compliance review.', actionRequired: true, aliases: ['snoozed', 'held', 'hold'] },
    approved: { label: 'Approved', tone: 'success', icon: 'CheckCircle2', progress: 100, description: 'Your application has been approved.', aliases: ['accepted'] },
    rejected: { label: 'Rejected', tone: 'danger', icon: 'XCircle', progress: 100, description: 'Your application was not successful.', actionRequired: true, aliases: ['declined'] },
    withdrawn: { label: 'Withdrawn', tone: 'neutral', icon: 'MinusCircle', progress: 100, description: 'This application was withdrawn.', aliases: ['cancelled'] },
    archived: { label: 'Archived', tone: 'neutral', icon: 'MinusCircle', progress: 100, description: 'This application has been archived.' },
    expired: { label: 'Expired', tone: 'danger', icon: 'AlertTriangle', progress: 100, actionRequired: true },
  },

  // ── Compliance ─────────────────────────────────────────────────────────────
  compliance: {
    clear: { label: 'Clear', tone: 'success', icon: 'ShieldCheck', progress: 100, description: 'All compliance checks passed.', aliases: ['compliant', 'passed', 'verified', 'complete', 'cleared'] },
    pending: { label: 'Pending', tone: 'warning', icon: 'Clock', progress: 50, description: 'Compliance checks are in progress.', aliases: ['in_progress', 'processing'] },
    review: { label: 'Under Review', tone: 'warning', icon: 'Eye', progress: 65, description: 'A compliance check needs review.', aliases: ['under_review', 'escalated', 'flagged'] },
    failed: { label: 'Non-Compliant', tone: 'danger', icon: 'XCircle', progress: 100, description: 'One or more compliance checks failed.', actionRequired: true, aliases: ['non_compliant', 'rejected'] },
  },

  // ── Risk (categorical) ─────────────────────────────────────────────────────
  risk: {
    low: { label: 'Low Risk', tone: 'success', icon: 'ShieldCheck', description: 'Low risk — no concerns identified.' },
    medium: { label: 'Medium Risk', tone: 'warning', icon: 'AlertTriangle', description: 'Medium risk — standard monitoring applies.' },
    high: { label: 'High Risk', tone: 'danger', icon: 'AlertTriangle', description: 'High risk — enhanced due diligence required.', actionRequired: true },
    critical: { label: 'Critical Risk', tone: 'danger', icon: 'AlertOctagon', description: 'Critical risk — immediate review required.', actionRequired: true },
    pending: { label: 'Assessment Pending', tone: 'neutral', icon: 'Clock', description: 'Risk assessment is pending.', aliases: ['unknown', 'not_assessed'] },
  },
};

// Build alias → canonical key lookup per domain (computed once)
const ALIAS_INDEX: Record<StatusDomain, Record<string, string>> = (() => {
  const out = {} as Record<StatusDomain, Record<string, string>>;
  (Object.keys(REGISTRY) as StatusDomain[]).forEach((domain) => {
    const map: Record<string, string> = {};
    Object.entries(REGISTRY[domain]).forEach(([key, spec]) => {
      map[key] = key;
      (spec.aliases ?? []).forEach((a) => { map[a] = key; });
    });
    out[domain] = map;
  });
  return out;
})();

function normalize(raw: string | null | undefined): string {
  return (raw ?? '').toString().trim().toLowerCase().replace(/[\s-]+/g, '_');
}

/**
 * Resolve any raw status string (including legacy aliases like 'verified',
 * 'pending', 'compliant') to a consistent descriptor for the given domain.
 */
export function getStatus(domain: StatusDomain, raw: string | null | undefined): StatusDescriptor {
  const norm = normalize(raw);
  const canonical = ALIAS_INDEX[domain][norm];
  const spec = canonical ? REGISTRY[domain][canonical] : undefined;

  if (!spec || !canonical) {
    const fallbackLabel = norm
      ? norm.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Unknown';
    return { key: norm || 'unknown', label: fallbackLabel, tone: 'neutral', ...TONE_COLORS.neutral, icon: 'Circle' };
  }

  return {
    key: canonical,
    label: spec.label,
    tone: spec.tone,
    ...TONE_COLORS[spec.tone],
    icon: spec.icon,
    description: spec.description,
    progress: spec.progress,
    actionRequired: spec.actionRequired,
  };
}

// Ordered lifecycle keys (useful for progress trackers / pickers)
export const RTR_LIFECYCLE: string[] = [
  'not_started', 'in_progress', 'verification_pending', 'additional_info_required', 'approved', 'rejected', 'expired',
];
