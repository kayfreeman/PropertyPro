// Navigation sections
export type SectionId = 'dashboard' | 'identity' | 'compliance' | 'risk' | 'property' | 'partners' | 'ai-assistant';

export interface NavSection {
  id: SectionId;
  label: string;
  icon: string; // Lucide icon name
  description: string;
}

export const NAV_SECTIONS: NavSection[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', description: 'Platform overview & analytics' },
  { id: 'identity', label: 'Identity & Trust', icon: 'ShieldCheck', description: 'Identity verification & trust ladder' },
  { id: 'compliance', label: 'Compliance', icon: 'FileCheck', description: 'AML/KYC/CDD automation' },
  { id: 'risk', label: 'Risk Intelligence', icon: 'AlertTriangle', description: 'Risk scoring & fraud detection' },
  { id: 'property', label: 'Property', icon: 'Building2', description: 'Property compliance & intelligence' },
  { id: 'partners', label: 'Partners', icon: 'Handshake', description: 'Ecosystem integrations' },
  { id: 'ai-assistant', label: 'AI Assistant', icon: 'Bot', description: 'Compliance AI chatbot' },
];

// Trust Ladder levels
export const TRUST_LEVELS = [
  { level: 0, name: 'Self-Declared', description: 'Basic identity assertion', color: '#94a3b8', bgColor: '#f1f5f9', icon: 'User' },
  { level: 1, name: 'Document Verified', description: 'Passport, National ID, Visa, Residence Permit', color: '#f59e0b', bgColor: '#fffbeb', icon: 'FileText' },
  { level: 2, name: 'Biometric Verified', description: 'Face Match, Liveness Detection', color: '#10b981', bgColor: '#ecfdf5', icon: 'ScanFace' },
  { level: 3, name: 'Behaviour Verified', description: 'Open Banking, Income Validation, Financial Behaviour', color: '#06b6d4', bgColor: '#ecfeff', icon: 'TrendingUp' },
  { level: 4, name: 'Institutional Verified', description: 'Employer, University, Professional Verification', color: '#8b5cf6', bgColor: '#f5f3ff', icon: 'Building' },
  { level: 5, name: 'Government Verified', description: 'Government database verification (where legally available)', color: '#6366f1', bgColor: '#eef2ff', icon: 'Landmark' },
];

// Compliance check types
export const COMPLIANCE_TYPES = [
  { type: 'aml', name: 'AML Check', description: 'Anti-Money Laundering screening', regulation: 'UK MLR 2017' },
  { type: 'kyc', name: 'KYC Check', description: 'Know Your Customer verification', regulation: 'FCA Guidance' },
  { type: 'cdd', name: 'CDD', description: 'Customer Due Diligence', regulation: 'UK MLR 2017' },
  { type: 'edd', name: 'EDD', description: 'Enhanced Due Diligence', regulation: 'UK MLR 2017' },
  { type: 'sanctions', name: 'Sanctions Screening', description: 'Global sanctions list check', regulation: 'OFAC/EU/UN' },
  { type: 'pep', name: 'PEP Screening', description: 'Politically Exposed Person check', regulation: 'FCA Guidance' },
  { type: 'adverse_media', name: 'Adverse Media', description: 'Negative news screening', regulation: 'FCA Guidance' },
  { type: 'right_to_rent', name: 'Right to Rent', description: 'UK Home Office Right to Rent verification', regulation: 'Immigration Act 2014' },
];

// Risk categories
export const RISK_CATEGORIES = [
  { category: 'low', label: 'Low Risk', color: '#10b981', bgColor: '#ecfdf5', threshold: '75-100' },
  { category: 'medium', label: 'Medium Risk', color: '#f59e0b', bgColor: '#fffbeb', threshold: '50-74' },
  { category: 'high', label: 'High Risk', color: '#f97316', bgColor: '#fff7ed', threshold: '25-49' },
  { category: 'critical', label: 'Critical Risk', color: '#ef4444', bgColor: '#fef2f2', threshold: '0-24' },
];

// Partner types
export const PARTNER_TYPES = [
  { type: 'bank', name: 'Banking', icon: 'Landmark', description: 'Banking referrals & integrations' },
  { type: 'insurer', name: 'Insurance', icon: 'Shield', description: 'Insurance referrals & integrations' },
  { type: 'mortgage_provider', name: 'Mortgage', icon: 'Home', description: 'Mortgage intelligence & referrals' },
  { type: 'remittance', name: 'Remittance', icon: 'ArrowLeftRight', description: 'Cross-border remittance services' },
  { type: 'employer', name: 'Employer', icon: 'Briefcase', description: 'Employment verification partners' },
  { type: 'university', name: 'University', icon: 'GraduationCap', description: 'Academic verification partners' },
];

// Platform architecture principles
export const ARCHITECTURE_PRINCIPLES = [
  { principle: 'Trust by Design', description: 'Every identity assertion must be attributable, auditable, evidence-based, and explainable', icon: 'ShieldCheck' },
  { principle: 'Compliance by Design', description: 'Compliance embedded within workflows — UK GDPR, UK MLR 2017, FCA Guidance', icon: 'FileCheck' },
  { principle: 'Security by Design', description: 'Zero Trust, Least Privilege, MFA, RBAC, ABAC, Encryption at Rest & Transit', icon: 'Lock' },
  { principle: 'Explainability by Design', description: 'Decision rationale, evidence traceability, confidence scores, risk factor breakdowns', icon: 'Eye' },
  { principle: 'Privacy by Design', description: 'Consent Management, Data Minimisation, Purpose Limitation, Data Subject Rights', icon: 'UserCheck' },
  { principle: 'API First', description: 'Every capability exposed through APIs — Internal, Partner, Public, Webhooks, Events', icon: 'Code' },
  { principle: 'Cloud Native', description: 'AWS/Azure/GCP with Containers, Kubernetes, Event-Driven, Serverless, IaC', icon: 'Cloud' },
];

// Core domains
export const CORE_DOMAINS = [
  { id: 'identity', name: 'Identity Domain', capabilities: ['Profiles', 'Credentials', 'Evidence', 'Biometrics', 'Verification'] },
  { id: 'compliance', name: 'Compliance Domain', capabilities: ['AML', 'KYC', 'CDD', 'EDD', 'Screening', 'SAR'] },
  { id: 'risk', name: 'Risk Domain', capabilities: ['Risk Scoring', 'Fraud Detection', 'Behaviour Analytics', 'Trust Scoring'] },
  { id: 'workflow', name: 'Workflow Domain', capabilities: ['Orchestration', 'Reviews', 'Approvals', 'Escalations'] },
  { id: 'property', name: 'Property Domain', capabilities: ['Tenants', 'Buyers', 'Landlords', 'Properties', 'Applications'] },
  { id: 'intelligence', name: 'Intelligence Domain', capabilities: ['Analytics', 'Market Intelligence', 'Risk Signals'] },
  { id: 'partner', name: 'Partner Domain', capabilities: ['Banks', 'Insurers', 'Mortgage Providers', 'Remittance'] },
];

// Status color mappings
export const STATUS_COLORS: Record<string, { color: string; bgColor: string }> = {
  verified: { color: '#10b981', bgColor: '#ecfdf5' },
  passed: { color: '#10b981', bgColor: '#ecfdf5' },
  compliant: { color: '#10b981', bgColor: '#ecfdf5' },
  approved: { color: '#10b981', bgColor: '#ecfdf5' },
  active: { color: '#10b981', bgColor: '#ecfdf5' },
  completed: { color: '#10b981', bgColor: '#ecfdf5' },
  pending: { color: '#f59e0b', bgColor: '#fffbeb' },
  in_progress: { color: '#06b6d4', bgColor: '#ecfeff' },
  submitted: { color: '#06b6d4', bgColor: '#ecfeff' },
  under_review: { color: '#8b5cf6', bgColor: '#f5f3ff' },
  escalated: { color: '#f97316', bgColor: '#fff7ed' },
  failed: { color: '#ef4444', bgColor: '#fef2f2' },
  rejected: { color: '#ef4444', bgColor: '#fef2f2' },
  non_compliant: { color: '#ef4444', bgColor: '#fef2f2' },
  suspended: { color: '#ef4444', bgColor: '#fef2f2' },
  critical: { color: '#ef4444', bgColor: '#fef2f2' },
  expired: { color: '#94a3b8', bgColor: '#f1f5f9' },
  withdrawn: { color: '#94a3b8', bgColor: '#f1f5f9' },
  open: { color: '#f59e0b', bgColor: '#fffbeb' },
  investigating: { color: '#8b5cf6', bgColor: '#f5f3ff' },
  confirmed: { color: '#ef4444', bgColor: '#fef2f2' },
  false_positive: { color: '#06b6d4', bgColor: '#ecfeff' },
  resolved: { color: '#10b981', bgColor: '#ecfdf5' },
};

// Helper to get status style
export function getStatusStyle(status: string): { color: string; bgColor: string } {
  return STATUS_COLORS[status.toLowerCase()] || { color: '#94a3b8', bgColor: '#f1f5f9' };
}

// Helper to format dates
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
