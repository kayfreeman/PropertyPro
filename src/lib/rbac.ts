// PropComply AI + VerifyMe Global — Role-Based Access Control
// Trust Infrastructure Platform

export type UserRole =
  | 'platform_admin'
  | 'compliance_officer'
  | 'property_manager'
  | 'identity_verifier'
  | 'risk_analyst'
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
      'dashboard:view', 'identity:view', 'identity:verify', 'identity:manage',
      'compliance:view', 'compliance:review', 'compliance:manage',
      'risk:view', 'risk:analyze', 'risk:manage',
      'property:view', 'property:manage',
      'partners:view', 'partners:manage',
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
      'dashboard:view', 'identity:view', 'identity:verify', 'identity:manage',
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
      'dashboard:view', 'identity:view', 'identity:verify',
      'compliance:view',
      'property:view', 'property:manage',
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
      'dashboard:view', 'identity:view', 'identity:verify', 'identity:manage',
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
      'dashboard:view', 'identity:view',
      'compliance:view', 'compliance:review',
      'risk:view', 'risk:analyze', 'risk:manage',
      'ai_assistant:use', 'settings:view', 'settings:manage',
      'audit:view',
    ],
    sections: ['dashboard', 'identity', 'compliance', 'risk', 'ai-assistant', 'settings'],
    level: 4,
  },
  partner_user: {
    id: 'partner_user',
    name: 'Partner User',
    description: 'External partner with limited portal access for referral management and integration workflows',
    color: '#ec4899',
    bgColor: '#fdf2f8',
    icon: 'Handshake',
    department: 'Partner Relations',
    permissions: [
      'dashboard:view_limited', 'partners:view', 'partners:manage',
      'ai_assistant:use', 'settings:view',
    ],
    sections: ['dashboard', 'partners', 'ai-assistant', 'settings'],
    level: 2,
  },
  tenant: {
    id: 'tenant',
    name: 'Tenant / Applicant',
    description: 'Self-service portal access for document upload, consent management, and application tracking',
    color: '#10b981',
    bgColor: '#ecfdf5',
    icon: 'User',
    department: 'Self-Service',
    permissions: [
      'dashboard:view_limited', 'identity:view',
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

// Role display helpers
export const ROLE_LIST: UserRole[] = [
  'platform_admin',
  'compliance_officer',
  'property_manager',
  'identity_verifier',
  'risk_analyst',
  'partner_user',
  'tenant',
];

export function getRoleBadge(role: UserRole): { label: string; color: string; bgColor: string } {
  const def = getRoleDefinition(role);
  return { label: def.name, color: def.color, bgColor: def.bgColor };
}
