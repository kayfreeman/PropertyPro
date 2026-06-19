// Persona-specific report generation for the global "Download Report" button.
// Each role gets a report scoped to its responsibilities and data.

import { buildReportHtml, reportDate, type ReportSection } from '@/lib/report-export';
import { getRoleDefinition, type UserRole } from '@/lib/rbac';

async function getJson<T = Record<string, unknown>>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { credentials: 'same-origin' });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

function mask(value: string | null | undefined): string {
  if (!value) return '••••';
  const t = value.trim();
  if (t.length <= 4) return '••••';
  return `${t.slice(0, 2)}${'•'.repeat(Math.min(t.length - 4, 6))}${t.slice(-2)}`;
}
function maskEmail(email: string | null | undefined): string {
  if (!email) return '••••';
  const [l, d] = email.split('@');
  return `${mask(l)}@${d ?? '••••'}`;
}

// ── Role-specific section builders ──────────────────────────────────────────

async function tenantSections(): Promise<ReportSection[]> {
  const [idData, appData] = await Promise.all([
    getJson<{ identities: { firstName: string; lastName: string; email: string; nationality: string | null; status: string; trustLevel: number; trustScore: number; verifications: { status: string }[] }[] }>('/api/identities'),
    getJson<{ applications: { applicationType: string; status: string; rightToRent: string; submittedAt: string; property?: { address: string } | null }[] }>('/api/property-applications'),
  ]);
  const p = idData?.identities?.[0];
  const apps = appData?.applications ?? [];
  if (!p) {
    return [{ title: 'Onboarding', kv: [['Status', 'Not started'], ['Action', 'Complete identity verification to generate your report']] }];
  }
  const completed = p.verifications.filter((v) => ['passed', 'verified', 'completed'].includes(v.status.toLowerCase())).length;
  const r2r = p.trustLevel >= 2;
  return [
    {
      title: 'Applicant Profile (PII masked — UK GDPR)',
      kv: [
        ['Name', `${mask(p.firstName)} ${mask(p.lastName)}`],
        ['Email', maskEmail(p.email)],
        ['Nationality', p.nationality || 'Not specified'],
        ['Verification Status', p.status.toUpperCase()],
        ['Trust Level', `L${p.trustLevel} / 5`],
        ['Trust Score', `${p.trustScore} / 100`],
      ],
    },
    {
      title: 'Onboarding & Verification Outcome',
      kv: [
        ['Onboarding Outcome', ['verified', 'certified'].includes(p.status) ? 'Completed — Verified' : p.status === 'rejected' ? 'Unsuccessful' : 'In Progress'],
        ['Completed Checks', `${completed} / ${p.verifications.length}`],
        ['Compliance', ['verified', 'certified'].includes(p.status) ? 'Standard CDD — Cleared' : 'Pending'],
        ['Right to Rent', r2r ? 'Eligible' : 'Not yet eligible'],
      ],
    },
    {
      title: 'My Applications',
      table: {
        headers: ['Property', 'Type', 'Status', 'Right to Rent', 'Submitted'],
        rows: apps.map((a) => [a.property?.address ?? '—', a.applicationType, a.status.replace(/_/g, ' '), a.rightToRent.replace(/_/g, ' '), reportDate(a.submittedAt)]),
      },
    },
  ];
}

async function riskAnalystSections(): Promise<ReportSection[]> {
  const data = await getJson<{ pipeline: { applicationType: string; status: string; profile: { firstName: string; lastName: string }; screeningSummary: { completed: number; total: number; flagged: number }; risk: { riskCategory: string } | null }[]; summary: { byStatus: Record<string, number>; byRisk: Record<string, number>; screeningGaps: number } }>('/api/compliance/pipeline');
  const s = data?.summary;
  const pl = data?.pipeline ?? [];
  const pending = pl.filter((p) => ['submitted', 'in_review'].includes(p.status));
  return [
    {
      title: 'Compliance Pipeline Summary',
      kv: [
        ['Under Review', String((s?.byStatus?.submitted ?? 0) + (s?.byStatus?.in_review ?? 0))],
        ['On Hold', String(s?.byStatus?.on_hold ?? 0)],
        ['Approved', String(s?.byStatus?.approved ?? 0)],
        ['Rejected', String(s?.byStatus?.rejected ?? 0)],
        ['High / Critical Risk', String((s?.byRisk?.high ?? 0) + (s?.byRisk?.critical ?? 0))],
        ['Outstanding Screening Checks', String(s?.screeningGaps ?? 0)],
      ],
    },
    {
      title: 'Applicants Pending Decision',
      table: {
        headers: ['Applicant', 'Application', 'Screening', 'Risk', 'Status'],
        rows: pending.map((p) => [`${p.profile.firstName} ${p.profile.lastName}`, p.applicationType, `${p.screeningSummary.completed}/${p.screeningSummary.total} (${p.screeningSummary.flagged} flagged)`, p.risk?.riskCategory ?? '—', p.status.replace(/_/g, ' ')]),
      },
    },
  ];
}

async function verifierSections(): Promise<ReportSection[]> {
  const data = await getJson<{ identities: { firstName: string; lastName: string; status: string; trustLevel: number; verifications: { status: string }[] }[] }>('/api/identities');
  const profiles = data?.identities ?? [];
  const pending = profiles.filter((p) => p.verifications.some((v) => ['pending', 'in_progress'].includes(v.status)));
  const verified = profiles.filter((p) => ['verified', 'certified'].includes(p.status));
  const exceptions = profiles.filter((p) => ['rejected', 'failed'].includes(p.status));
  const avg = profiles.length ? (profiles.reduce((a, p) => a + p.trustLevel, 0) / profiles.length).toFixed(1) : '0.0';
  return [
    {
      title: 'Verification Summary',
      kv: [
        ['Pending Reviews', String(pending.length)],
        ['Approved', String(verified.length)],
        ['Exceptions (rejected/failed)', String(exceptions.length)],
        ['Average Trust Level', avg],
      ],
    },
    {
      title: 'Verification Tasks',
      table: {
        headers: ['Applicant', 'Trust Level', 'Status', 'Pending Checks'],
        rows: pending.map((p) => [`${p.firstName} ${p.lastName}`, `L${p.trustLevel}`, p.status, String(p.verifications.filter((v) => ['pending', 'in_progress'].includes(v.status)).length)]),
      },
    },
  ];
}

async function partnerManagerSections(): Promise<ReportSection[]> {
  const [partnerData, complianceData] = await Promise.all([
    getJson<{ partners: { name: string; partnerType: string; status: string; trustRating: number; integrationType: string | null; _count: { referrals: number } }[]; total: number }>('/api/partners'),
    getJson<{ total: number; summary: { byStatus: Record<string, number> } }>('/api/compliance'),
  ]);
  const partners = partnerData?.partners ?? [];
  const active = partners.filter((p) => p.status === 'active' && p.integrationType).length;
  return [
    {
      title: 'Partner & Compliance Summary',
      kv: [
        ['Integration Partners', String(partnerData?.total ?? 0)],
        ['Active Integrations', String(active)],
        ['Compliance Checks', String(complianceData?.total ?? 0)],
        ['Checks Passed', String(complianceData?.summary?.byStatus?.passed ?? 0)],
      ],
    },
    {
      title: 'Integration Partners',
      table: {
        headers: ['Partner', 'Type', 'Status', 'Trust Rating', 'Referrals'],
        rows: partners.map((p) => [p.name, p.partnerType.replace(/_/g, ' '), p.status, `${p.trustRating.toFixed(0)}/100`, String(p._count.referrals)]),
      },
    },
  ];
}

function partnerUserSections(): ReportSection[] {
  const apis = [
    ['POST', '/api/v1/referrals/identity', 'Available'],
    ['GET', '/api/v1/referrals/{referralId}', 'Available'],
    ['POST', '/api/v1/open-banking/consent-requests', 'Available'],
    ['POST', '/api/v1/affordability/assessments', 'Available'],
    ['POST', '/api/v1/webhooks', 'Available'],
  ];
  return [
    {
      title: 'Integration Summary',
      kv: [
        ['Institution', 'Barclays Bank PLC'],
        ['Assigned APIs', String(apis.length)],
        ['Integration Status', 'Active (OAuth 2.0 · mTLS)'],
        ['Rate Limit', '100 requests / minute'],
      ],
    },
    {
      title: 'Assigned APIs (Banking Domain)',
      table: { headers: ['Method', 'Endpoint', 'Status'], rows: apis },
      note: 'Base URL: https://api.propcomply.ai/partners/barclays',
    },
  ];
}

async function defaultSections(): Promise<ReportSection[]> {
  const [dash, compliance] = await Promise.all([
    getJson<{ summary: { totalProfiles: number; verifiedProfiles: number; pendingVerifications: number; compliancePassRate: number; averageTrustScore: number; activeApplications: number; openFraudAlerts: number; activePartners: number }; riskDistribution: { low: number; medium: number; high: number; critical: number } }>('/api/dashboard'),
    getJson<{ summary: { byType: Record<string, number> } }>('/api/compliance'),
  ]);
  const s = dash?.summary;
  const rd = dash?.riskDistribution;
  const byType = compliance?.summary?.byType ?? {};
  return [
    {
      title: 'Platform KPIs',
      kv: [
        ['Total Identities', String(s?.totalProfiles ?? 0)],
        ['Verified Profiles', String(s?.verifiedProfiles ?? 0)],
        ['Pending Verifications', String(s?.pendingVerifications ?? 0)],
        ['Compliance Pass Rate', `${s?.compliancePassRate ?? 0}%`],
        ['Average Trust Score', (s?.averageTrustScore ?? 0).toFixed(1)],
        ['Active Applications', String(s?.activeApplications ?? 0)],
        ['Open Fraud Alerts', String(s?.openFraudAlerts ?? 0)],
        ['Active Partners', String(s?.activePartners ?? 0)],
      ],
    },
    {
      title: 'Risk Distribution',
      kv: [
        ['Low Risk', String(rd?.low ?? 0)],
        ['Medium Risk', String(rd?.medium ?? 0)],
        ['High Risk', String(rd?.high ?? 0)],
        ['Critical Risk', String(rd?.critical ?? 0)],
      ],
    },
    {
      title: 'Compliance Checks by Type',
      table: { headers: ['Check Type', 'Count'], rows: Object.entries(byType).map(([t, c]) => [t.replace(/_/g, ' ').toUpperCase(), String(c)]) },
    },
  ];
}

const REPORT_TITLES: Partial<Record<UserRole, { title: string; subtitle: string }>> = {
  tenant: { title: 'Applicant Report', subtitle: 'Your onboarding, verification and application summary' },
  risk_analyst: { title: 'Compliance & Risk Report', subtitle: 'Compliance pipeline, screening and pending decisions' },
  identity_verifier: { title: 'Identity Verification Report', subtitle: 'Verification tasks, approvals and exceptions' },
  partner_integration_manager: { title: 'Partner Integration Report', subtitle: 'Integration partners and compliance overview' },
  partner_user: { title: 'API Integration Report', subtitle: 'Assigned APIs and integration status' },
};

// Generate a persona-scoped report and return the printable HTML.
export async function generatePersonaReport(role: UserRole, user?: { name?: string | null; email?: string | null }): Promise<string> {
  let sections: ReportSection[];
  switch (role) {
    case 'tenant': sections = await tenantSections(); break;
    case 'risk_analyst': sections = await riskAnalystSections(); break;
    case 'identity_verifier': sections = await verifierSections(); break;
    case 'partner_integration_manager': sections = await partnerManagerSections(); break;
    case 'partner_user': sections = partnerUserSections(); break;
    default: sections = await defaultSections(); break;
  }

  const meta = REPORT_TITLES[role] ?? { title: 'Platform Report', subtitle: 'Identity, compliance and risk overview' };
  const roleName = getRoleDefinition(role).name;
  const refId = `RPT-${new Date().toISOString().slice(0, 10)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

  return buildReportHtml({
    title: user?.name ? `${meta.title} — ${user.name}` : meta.title,
    subtitle: meta.subtitle,
    role: roleName,
    refId,
    period: 'All available data (role-scoped)',
    user: { name: user?.name, email: user?.email },
    sections,
  });
}
