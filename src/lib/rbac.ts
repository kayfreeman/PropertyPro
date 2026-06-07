// PropComply AI + VerifyMe Global — Role-Based Access Control
// Trust Infrastructure Platform

export type UserRole =
  | 'platform_admin'
  | 'compliance_officer'
  | 'property_manager'
  | 'identity_verifier'
  | 'risk_analyst'
  | 'partner_integration_manager'
  | 'partner_user'
  | 'tenant';

export type SectionId =
  | 'dashboard'
  | 'identity'
  | 'compliance'
  | 'risk'
  | 'property'
  | 'partners'
  | 'ai-assistant'
  | 'settings';

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
  | 'consent:manage';

// Role definitions with metadata
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
  level: number; // Authority level (1-7)
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
    ],
    sections: ['dashboard', 'identity', 'compliance', 'risk', 'property', 'partners', 'ai-assistant', 'settings'],
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
    ],
    sections: ['dashboard', 'identity', 'compliance', 'risk', 'ai-assistant', 'settings'],
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
      'compliance:view', 'compliance:review',
      'risk:view', 'risk:analyze', 'risk:manage',
      'ai_assistant:use', 'settings:view', 'settings:manage',
      'audit:view',
    ],
    sections: ['dashboard', 'identity', 'compliance', 'risk', 'ai-assistant', 'settings'],
    level: 4,
  },
  partner_integration_manager: {
    id: 'partner_integration_manager',
    name: 'Partner Integration Manager',
    description: 'Manages partner integrations, registers new partners, and oversees partner onboarding with identity and compliance visibility',
    color: '#e11d48',
    bgColor: '#fff1f2',
    icon: 'Puzzle',
    department: 'Partner Operations',
    permissions: [
      'dashboard:view', 'identity:view', 'identity:view_own',
      'compliance:view',
      'partners:view', 'partners:manage', 'partners:register',
      'ai_assistant:use', 'settings:view', 'settings:manage',
    ],
    sections: ['dashboard', 'identity', 'compliance', 'partners', 'ai-assistant', 'settings'],
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
};

// Helper functions
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

export function getFilteredSections(role: UserRole, allSections: { id: string; label: string; icon: React.ReactNode; description: string; color: string }[]): typeof allSections {
  const accessible = getAccessibleSections(role);
  return allSections.filter(s => accessible.includes(s.id as SectionId));
}

// Data scope helper — determines how much data a role can see
export type DataScope = 'all' | 'partner_only' | 'own';

export function getDataScope(role: UserRole): DataScope {
  switch (role) {
    case 'platform_admin':
    case 'compliance_officer':
    case 'property_manager':
    case 'identity_verifier':
    case 'risk_analyst':
    case 'partner_integration_manager':
      return 'all';
    case 'partner_user':
      return 'partner_only';
    case 'tenant':
      return 'own';
    default:
      return 'own';
  }
}

// Detailed permissions matrix by feature area
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
    compliance: { view_all: true, review: true },
    risk: { view_all: true, analyze: true, manage: true },
    property: {},
    partners: {},
    settings: { view: true, manage: true },
    users: {},
    audit: { view: true },
  },
  partner_integration_manager: {
    identity: { view_all: true, view_own: true },
    compliance: { view_all: true },
    risk: {},
    property: {},
    partners: { view_all: true, manage: true, register: true },
    settings: { view: true, manage: true },
    users: {},
    audit: {},
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
    property: { view_all: true, apply: true },
    partners: {},
    settings: { view: true },
    users: {},
    audit: {},
  },
};

// Role display helpers
export const ROLE_LIST: UserRole[] = [
  'platform_admin',
  'compliance_officer',
  'property_manager',
  'identity_verifier',
  'risk_analyst',
  'partner_integration_manager',
  'partner_user',
  'tenant',
];

export function getRoleBadge(role: UserRole): { label: string; color: string; bgColor: string } {
  const def = getRoleDefinition(role);
  return { label: def.name, color: def.color, bgColor: def.bgColor };
}
