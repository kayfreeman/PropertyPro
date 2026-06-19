// PropComply AI — Role-Based Access Control
// MLR 2017-compliant RBAC with MLRO as designated authority

export type UserRole =
  | 'platform_admin'
  | 'mlro'
  | 'compliance_officer'
  | 'property_manager'
  | 'identity_verifier'
  | 'risk_analyst'
  | 'partner_integration_manager'
  | 'partner_user'
  | 'tenant'
  | 'auditor';

export type SectionId =
  | 'dashboard'
  | 'identity'
  | 'compliance'
  | 'aml'
  | 'risk'
  | 'property'
  | 'partners'
  | 'reports'
  | 'ai-assistant'
  | 'settings'
  | 'mlro-workspace'
  | 'cases'
  | 'audit';

export type Permission =
  | 'dashboard:view'
  | 'dashboard:view_limited'
  | 'identity:view'
  | 'identity:view_own'
  | 'identity:verify'
  | 'identity:manage'
  | 'compliance:view'
  | 'compliance:review'
  | 'compliance:manage'
  | 'risk:view'
  | 'risk:analyze'
  | 'risk:manage'
  | 'property:view'
  | 'property:manage'
  | 'property:apply'
  | 'partners:view'
  | 'partners:manage'
  | 'partners:register'
  | 'ai_assistant:use'
  | 'settings:view'
  | 'settings:manage'
  | 'settings:admin'
  | 'users:view'
  | 'users:manage'
  | 'audit:view'
  | 'audit:export'
  | 'consent:manage'
  | 'reports:view'
  | 'reports:export'
  // MLRO-exclusive permissions — tipping-off critical
  | 'sar:view'
  | 'sar:manage'
  | 'sar:file'
  | 'edd:sign_off'
  | 'case:view'
  | 'case:manage'
  | 'case:close'
  | 'firm:manage';

export interface RoleDefinition {
  id: UserRole;
  name: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
  department?: string;
  permissions: Permission[];
  sections: SectionId[];
  level: number;
}

export const ROLE_DEFINITIONS: Record<UserRole, RoleDefinition> = {
  platform_admin: {
    id: 'platform_admin',
    name: 'Platform Administrator',
    description: 'Full system access with complete administrative control over all platform domains',
    color: '#dc2626',
    bgColor: '#fef2f2',
    icon: 'Crown',
    department: 'Engineering',
    permissions: [
      'dashboard:view', 'identity:view', 'identity:view_own', 'identity:verify', 'identity:manage',
      'compliance:view', 'compliance:review', 'compliance:manage',
      'risk:view', 'risk:analyze', 'risk:manage',
      'property:view', 'property:manage', 'property:apply',
      'partners:view', 'partners:manage', 'partners:register',
      'ai_assistant:use', 'settings:view', 'settings:manage', 'settings:admin',
      'users:view', 'users:manage', 'audit:view', 'audit:export', 'consent:manage',
      'sar:view', 'sar:manage', 'sar:file', 'edd:sign_off',
      'case:view', 'case:manage', 'case:close', 'firm:manage',
      'reports:view', 'reports:export',
    ],
    sections: ['dashboard', 'identity', 'compliance', 'aml', 'risk', 'property', 'partners', 'reports', 'ai-assistant', 'settings', 'mlro-workspace', 'cases', 'audit'],
    level: 7,
  },

  // MLRO — Designated Money Laundering Reporting Officer (MLR 2017 Reg 21)
  // Sole authority for SAR adjudication and EDD sign-off
  mlro: {
    id: 'mlro',
    name: 'Money Laundering Reporting Officer',
    description: 'Designated MLRO with exclusive authority over SAR adjudication, EDD sign-off, and regulatory filing under MLR 2017 Reg 21',
    color: '#b91c1c',
    bgColor: '#fef2f2',
    icon: 'Scale',
    department: 'Compliance',
    permissions: [
      'dashboard:view', 'identity:view', 'identity:view_own', 'identity:verify', 'identity:manage',
      'compliance:view', 'compliance:review', 'compliance:manage',
      'risk:view', 'risk:analyze', 'risk:manage',
      'property:view',
      'ai_assistant:use', 'settings:view', 'settings:manage',
      'users:view', 'audit:view', 'audit:export', 'consent:manage',
      // MLRO-exclusive
      'sar:view', 'sar:manage', 'sar:file',
      'edd:sign_off',
      'case:view', 'case:manage', 'case:close',
      'reports:view', 'reports:export',
    ],
    sections: ['dashboard', 'identity', 'compliance', 'aml', 'risk', 'reports', 'ai-assistant', 'settings', 'mlro-workspace', 'cases', 'audit'],
    level: 7,
  },

  compliance_officer: {
    id: 'compliance_officer',
    name: 'Compliance Officer',
    description: 'Manages AML/KYC/CDD compliance workflows, reviews screening results, and ensures regulatory adherence',
    color: '#0d9488',
    bgColor: '#f0fdfa',
    icon: 'ShieldCheck',
    department: 'Compliance',
    permissions: [
      'dashboard:view', 'identity:view', 'identity:view_own', 'identity:verify', 'identity:manage',
      'compliance:view', 'compliance:review', 'compliance:manage',
      'risk:view', 'risk:analyze',
      'ai_assistant:use', 'settings:view', 'settings:manage',
      'audit:view', 'audit:export', 'consent:manage',
      'case:view', 'case:manage',
      'reports:view', 'reports:export',
    ],
    sections: ['dashboard', 'identity', 'compliance', 'aml', 'risk', 'reports', 'ai-assistant', 'settings', 'cases'],
    level: 5,
  },

  property_manager: {
    id: 'property_manager',
    name: 'Property Manager / Letting Agent',
    description: 'Manages property compliance, tenant screening, Right to Rent verification, and property applications',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
    icon: 'Building2',
    department: 'Property Operations',
    permissions: [
      'dashboard:view', 'identity:view', 'identity:view_own', 'identity:verify',
      'compliance:view',
      'property:view', 'property:manage', 'property:apply',
      'ai_assistant:use', 'settings:view', 'settings:manage',
    ],
    sections: ['dashboard', 'identity', 'compliance', 'property', 'ai-assistant', 'settings'],
    level: 4,
  },

  identity_verifier: {
    id: 'identity_verifier',
    name: 'Identity Verifier',
    description: 'Performs identity verification workflows, manages credentials, and processes verification requests',
    color: '#06b6d4',
    bgColor: '#ecfeff',
    icon: 'ScanFace',
    department: 'Identity Operations',
    permissions: [
      'dashboard:view', 'identity:view', 'identity:view_own', 'identity:verify', 'identity:manage',
      'compliance:view',
      'ai_assistant:use', 'settings:view', 'settings:manage',
    ],
    sections: ['dashboard', 'identity', 'compliance', 'ai-assistant', 'settings'],
    level: 3,
  },

  risk_analyst: {
    id: 'risk_analyst',
    name: 'Risk Analyst',
    description: 'Analyzes risk scores, investigates fraud alerts, and produces risk intelligence reports with explainability',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    icon: 'AlertTriangle',
    department: 'Risk & Analytics',
    permissions: [
      'dashboard:view', 'identity:view', 'identity:view_own',
      'compliance:view', 'compliance:review', 'compliance:manage',
      'risk:view', 'risk:analyze', 'risk:manage',
      'ai_assistant:use', 'settings:view', 'settings:manage',
      'audit:view',
      'reports:view',
      'case:view',
    ],
    sections: ['dashboard', 'identity', 'compliance', 'aml', 'risk', 'reports', 'ai-assistant', 'settings'],
    level: 4,
  },

  partner_integration_manager: {
    id: 'partner_integration_manager',
    name: 'Partner Integration Manager',
    description: 'Manages partner integrations, registers new partners, and oversees compliance reporting — no access to identity, KYC, AML or risk functions',
    color: '#e11d48',
    bgColor: '#fff1f2',
    icon: 'Puzzle',
    department: 'Partner Operations',
    permissions: [
      'dashboard:view',
      'compliance:view', 'compliance:review',
      'partners:view', 'partners:manage', 'partners:register',
      'reports:view', 'reports:export',
      'ai_assistant:use', 'settings:view', 'settings:manage',
    ],
    sections: ['dashboard', 'compliance', 'reports', 'partners', 'ai-assistant', 'settings'],
    level: 3,
  },

  partner_user: {
    id: 'partner_user',
    name: 'Partner User',
    description: 'External partner with limited portal access for viewing partner integration data and referral workflows',
    color: '#ec4899',
    bgColor: '#fdf2f8',
    icon: 'Handshake',
    department: 'Partner Relations',
    permissions: [
      'dashboard:view_limited', 'partners:view',
      'ai_assistant:use', 'settings:view',
    ],
    sections: ['dashboard', 'partners', 'ai-assistant', 'settings'],
    level: 2,
  },

  tenant: {
    id: 'tenant',
    name: 'Tenant / Applicant',
    description: 'Self-service portal access for document upload, consent management, application tracking, and onboarding',
    color: '#10b981',
    bgColor: '#ecfdf5',
    icon: 'User',
    department: 'Self-Service',
    permissions: [
      'dashboard:view_limited', 'identity:view_own',
      'property:view', 'property:apply',
      'ai_assistant:use', 'settings:view', 'consent:manage',
    ],
    sections: ['dashboard', 'identity', 'property', 'ai-assistant', 'settings'],
    level: 1,
  },

  auditor: {
    id: 'auditor',
    name: 'External Auditor',
    description: 'Read-only access to audit logs and compliance records for regulatory inspection purposes',
    color: '#6b7280',
    bgColor: '#f9fafb',
    icon: 'FileSearch',
    department: 'External',
    permissions: [
      'dashboard:view_limited',
      'audit:view', 'audit:export',
      'compliance:view',
      'reports:view',
      'settings:view',
    ],
    sections: ['dashboard', 'compliance', 'aml', 'reports', 'audit', 'settings'],
    level: 2,
  },
};

export function getRoleDefinition(role: UserRole): RoleDefinition {
  return ROLE_DEFINITIONS[role] || ROLE_DEFINITIONS.tenant;
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const def = getRoleDefinition(role);
  return def.permissions.includes(permission);
}

export function canAccessSection(role: UserRole, section: SectionId): boolean {
  const def = getRoleDefinition(role);
  return def.sections.includes(section);
}

export function getAccessibleSections(role: UserRole): SectionId[] {
  return getRoleDefinition(role).sections;
}

export function getFilteredSections(
  role: UserRole,
  allSections: { id: string; label: string; icon: React.ReactNode; description: string; color: string }[]
): typeof allSections {
  const accessible = getAccessibleSections(role);
  return allSections.filter(s => accessible.includes(s.id as SectionId));
}

export type DataScope = 'all' | 'firm_only' | 'partner_only' | 'own';

export function getDataScope(role: UserRole): DataScope {
  switch (role) {
    case 'platform_admin':
      return 'all';
    case 'mlro':
    case 'compliance_officer':
    case 'property_manager':
    case 'identity_verifier':
    case 'risk_analyst':
    case 'partner_integration_manager':
    case 'auditor':
      return 'firm_only';
    case 'partner_user':
      return 'partner_only';
    case 'tenant':
      return 'own';
    default:
      return 'own';
  }
}

// Roles that can never see SAR-related data (tipping-off prevention)
export const SAR_RESTRICTED_ROLES: UserRole[] = [
  'property_manager',
  'identity_verifier',
  'partner_integration_manager',
  'partner_user',
  'tenant',
];

export function canSeeSAR(role: UserRole): boolean {
  return hasPermission(role, 'sar:view');
}

export function isMLROOrAdmin(role: UserRole): boolean {
  return role === 'mlro' || role === 'platform_admin';
}

export interface FeatureCapabilities {
  view_all?: boolean;
  view_own?: boolean;
  verify?: boolean;
  manage?: boolean;
  review?: boolean;
  analyze?: boolean;
  register?: boolean;
  apply?: boolean;
  view?: boolean;
  admin?: boolean;
  export?: boolean;
}

export interface RolePermissionsMatrix {
  identity: FeatureCapabilities;
  compliance: FeatureCapabilities;
  risk: FeatureCapabilities;
  property: FeatureCapabilities;
  partners: FeatureCapabilities;
  settings: FeatureCapabilities;
  users: FeatureCapabilities;
  audit: FeatureCapabilities;
}

export const ROLE_PERMISSIONS_MATRIX: Record<UserRole, RolePermissionsMatrix> = {
  platform_admin: {
    identity: { view_all: true, view_own: true, verify: true, manage: true },
    compliance: { view_all: true, review: true, manage: true },
    risk: { view_all: true, analyze: true, manage: true },
    property: { view_all: true, manage: true, apply: true },
    partners: { view_all: true, manage: true, register: true },
    settings: { view: true, manage: true, admin: true },
    users: { view: true, manage: true },
    audit: { view: true, export: true },
  },
  mlro: {
    identity: { view_all: true, view_own: true, verify: true, manage: true },
    compliance: { view_all: true, review: true, manage: true },
    risk: { view_all: true, analyze: true, manage: true },
    property: { view_all: true },
    partners: {},
    settings: { view: true, manage: true },
    users: { view: true },
    audit: { view: true, export: true },
  },
  compliance_officer: {
    identity: { view_all: true, view_own: true, verify: true, manage: true },
    compliance: { view_all: true, review: true, manage: true },
    risk: { view_all: true, analyze: true },
    property: {},
    partners: {},
    settings: { view: true, manage: true },
    users: {},
    audit: { view: true, export: true },
  },
  property_manager: {
    identity: { view_all: true, view_own: true, verify: true },
    compliance: { view_all: true },
    risk: {},
    property: { view_all: true, manage: true, apply: true },
    partners: {},
    settings: { view: true, manage: true },
    users: {},
    audit: {},
  },
  identity_verifier: {
    identity: { view_all: true, view_own: true, verify: true, manage: true },
    compliance: { view_all: true },
    risk: {},
    property: {},
    partners: {},
    settings: { view: true, manage: true },
    users: {},
    audit: {},
  },
  risk_analyst: {
    identity: { view_all: true, view_own: true },
    compliance: { view_all: true, review: true, manage: true },
    risk: { view_all: true, analyze: true, manage: true },
    property: {},
    partners: {},
    settings: { view: true, manage: true },
    users: {},
    audit: { view: true },
  },
  partner_integration_manager: {
    identity: {},
    compliance: { view_all: true, review: true },
    risk: {},
    property: {},
    partners: { view_all: true, manage: true, register: true },
    settings: { view: true, manage: true },
    users: {},
    audit: { export: true },
  },
  partner_user: {
    identity: {},
    compliance: {},
    risk: {},
    property: {},
    partners: { view_all: true },
    settings: { view: true },
    users: {},
    audit: {},
  },
  tenant: {
    identity: { view_own: true },
    compliance: {},
    risk: {},
    property: { view_own: true, apply: true },
    partners: {},
    settings: { view: true },
    users: {},
    audit: {},
  },
  auditor: {
    identity: {},
    compliance: { view_all: true },
    risk: {},
    property: {},
    partners: {},
    settings: { view: true },
    users: {},
    audit: { view: true, export: true },
  },
};

export const ROLE_LIST: UserRole[] = [
  'platform_admin',
  'mlro',
  'compliance_officer',
  'property_manager',
  'identity_verifier',
  'risk_analyst',
  'partner_integration_manager',
  'partner_user',
  'tenant',
  'auditor',
];

export function getRoleBadge(role: UserRole): { label: string; color: string; bgColor: string } {
  const def = getRoleDefinition(role);
  return { label: def.name, color: def.color, bgColor: def.bgColor };
}

// ─── Per-feature workflow leveling (hierarchy-driven) ───────────────────────
// Each persona occupies a distinct stage in a feature's workflow, determined by
// its position in the role hierarchy and the capability matrix above.

export type WorkflowFeature = 'verifications' | 'trust-ladder' | 'aml';

export interface WorkflowStage {
  hasAccess: boolean;
  tier: 0 | 1 | 2 | 3 | 4; // 0 = no access; 1..4 = position in the 4-tier progression
  stageLabel: string; // persona-specific stage name
  capability: string; // one-line description of what this persona can do
  canAct: boolean; // false => read-only at this stage
  hierarchyLevel: number; // the role's numeric level
}

// The 4-tier progression shown in the workflow banner, per feature
export const WORKFLOW_TIER_LABELS: Record<WorkflowFeature, [string, string, string, string]> = {
  'verifications': ['View', 'Verify', 'Manage', 'Authority'],
  'trust-ladder': ['View', 'Advance', 'Manage', 'Govern'],
  'aml': ['View', 'Operate', 'Manage', 'Sign-off'],
};

type StageDef = { tier: 1 | 2 | 3 | 4; stageLabel: string; capability: string; canAct: boolean };

const WORKFLOW_STAGE_MAP: Record<WorkflowFeature, Partial<Record<UserRole, StageDef>>> = {
  verifications: {
    tenant:                      { tier: 2, stageLabel: 'Submit & Track', capability: 'Submit your identity checks and track their status.', canAct: true },
    property_manager:            { tier: 2, stageLabel: 'Tenant Screening', capability: 'Verify applicants as part of tenancy screening.', canAct: true },
    identity_verifier:           { tier: 2, stageLabel: 'Review & Decide', capability: 'Approve, reject, or request more evidence on pending checks.', canAct: true },
    risk_analyst:                { tier: 1, stageLabel: 'Risk Review', capability: 'View verification outcomes to inform risk analysis.', canAct: false },
    partner_integration_manager: { tier: 1, stageLabel: 'Read-only', capability: 'View verification status.', canAct: false },
    compliance_officer:          { tier: 3, stageLabel: 'Manage & Oversee', capability: 'Manage and oversee all verifications across the firm.', canAct: true },
    mlro:                        { tier: 4, stageLabel: 'Authority & Oversight', capability: 'Full oversight with authority to override decisions.', canAct: true },
    platform_admin:              { tier: 4, stageLabel: 'Administer', capability: 'Full administrative control over verifications.', canAct: true },
  },
  'trust-ladder': {
    tenant:                      { tier: 2, stageLabel: 'My Progress', capability: 'Track your trust level and complete the next step.', canAct: true },
    property_manager:            { tier: 2, stageLabel: 'Advance Levels', capability: "Advance applicants' trust levels for tenancy.", canAct: true },
    identity_verifier:           { tier: 2, stageLabel: 'Advance Levels', capability: 'Verify and advance applicants up the trust ladder.', canAct: true },
    risk_analyst:                { tier: 1, stageLabel: 'Read-only', capability: "View applicants' trust levels for risk context.", canAct: false },
    partner_integration_manager: { tier: 1, stageLabel: 'Read-only', capability: 'View trust levels.', canAct: false },
    compliance_officer:          { tier: 3, stageLabel: 'Manage Progression', capability: 'Manage ladder progression and thresholds.', canAct: true },
    mlro:                        { tier: 4, stageLabel: 'Govern', capability: 'Govern the trust framework with override authority.', canAct: true },
    platform_admin:              { tier: 4, stageLabel: 'Administer', capability: 'Full control over the trust framework.', canAct: true },
  },
  aml: {
    identity_verifier:  { tier: 1, stageLabel: 'CDD Status (view)', capability: 'View Customer Due Diligence status.', canAct: false },
    property_manager:   { tier: 1, stageLabel: 'CDD Status (view)', capability: 'View CDD status for tenancy screening.', canAct: false },
    auditor:            { tier: 1, stageLabel: 'Inspect (read-only)', capability: 'Read-only inspection of AML records for audit.', canAct: false },
    risk_analyst:       { tier: 2, stageLabel: 'Risk Review', capability: 'Review risk signals within the AML workflow.', canAct: true },
    compliance_officer: { tier: 3, stageLabel: 'Run CDD / EDD', capability: 'Perform CDD/EDD checks and escalate cases.', canAct: true },
    mlro:               { tier: 4, stageLabel: 'EDD Sign-off & SAR', capability: 'Sign off EDD and adjudicate Suspicious Activity Reports (MLR 2017 Reg.21).', canAct: true },
    platform_admin:     { tier: 4, stageLabel: 'Administer', capability: 'Full administrative control over AML.', canAct: true },
  },
};

export function getWorkflowStage(role: UserRole, feature: WorkflowFeature): WorkflowStage {
  const def = WORKFLOW_STAGE_MAP[feature][role];
  const hierarchyLevel = getRoleDefinition(role).level;
  if (!def) {
    return { hasAccess: false, tier: 0, stageLabel: 'No access', capability: 'Your role does not have access to this workflow.', canAct: false, hierarchyLevel };
  }
  return { hasAccess: true, tier: def.tier, stageLabel: def.stageLabel, capability: def.capability, canAct: def.canAct, hierarchyLevel };
}
