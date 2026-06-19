// PII masking — NFR-GDPR-001
// NI, passport, DOB, bank account numbers masked by default in all API responses

export function maskNI(value: string | null | undefined): string {
  if (!value) return '••••••••';
  // NI format: AB123456C
  return value.slice(0, 2) + '••••••' + value.slice(-1);
}

export function maskPassport(value: string | null | undefined): string {
  if (!value) return '•••••••••';
  return value.slice(0, 2) + '•'.repeat(Math.max(0, value.length - 4)) + value.slice(-2);
}

export function maskDOB(value: string | Date | null | undefined): string {
  if (!value) return '••/••/••••';
  const d = typeof value === 'string' ? new Date(value) : value;
  const year = d.getFullYear();
  return `••/••/${year}`;
}

export function maskBankAccount(value: string | null | undefined): string {
  if (!value) return '••••••••';
  return '••••' + value.slice(-4);
}

export function maskSortCode(value: string | null | undefined): string {
  if (!value) return '••-••-••';
  return '••-••-' + value.slice(-2);
}

export function maskEmail(email: string | null | undefined): string {
  if (!email) return '•••@•••';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = local.slice(0, 2) + '•'.repeat(Math.max(0, local.length - 2));
  return `${maskedLocal}@${domain}`;
}

export function maskPhone(value: string | null | undefined): string {
  if (!value) return '•••• ••• ••••';
  return value.slice(0, 4) + ' ••• ' + value.slice(-4);
}

// Strip PII fields from an identity profile before returning to client/agent roles
export function maskIdentityProfile<T extends Record<string, unknown>>(
  profile: T,
  reveal = false
): T {
  if (reveal) return profile;

  return {
    ...profile,
    ...(profile.nationalInsurance !== undefined && { nationalInsurance: maskNI(profile.nationalInsurance as string) }),
    ...(profile.passportNumber !== undefined && { passportNumber: maskPassport(profile.passportNumber as string) }),
    ...(profile.dateOfBirth !== undefined && { dateOfBirth: maskDOB(profile.dateOfBirth as string) }),
    ...(profile.bankAccount !== undefined && { bankAccount: maskBankAccount(profile.bankAccount as string) }),
    ...(profile.sortCode !== undefined && { sortCode: maskSortCode(profile.sortCode as string) }),
  };
}
