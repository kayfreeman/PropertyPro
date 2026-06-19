// Tamper-evident audit trail — FR-AUD001
// Hash-chaining: each entry records SHA-256(prevHash + id + action + timestamp)

import crypto from 'crypto';
import { db } from '@/lib/db';

function hashChain(prevHash: string, id: string, action: string, timestamp: Date): string {
  const payload = `${prevHash}|${id}|${action}|${timestamp.toISOString()}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export interface AuditEntry {
  profileId?: string;
  caseId?: string;
  userId?: string;
  action: string;
  performedBy?: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  const last = await db.auditLog.findFirst({
    orderBy: { timestamp: 'desc' },
    select: { id: true, hashChain: true },
  });

  const prevHash = last?.hashChain ?? '0'.repeat(64);
  const tempId = crypto.randomUUID();
  const timestamp = new Date();
  const chain = hashChain(prevHash, tempId, entry.action, timestamp);

  await db.auditLog.create({
    data: {
      id: tempId,
      profileId: entry.profileId,
      caseId: entry.caseId,
      userId: entry.userId,
      action: entry.action,
      performedBy: entry.performedBy,
      resource: entry.resource,
      resourceId: entry.resourceId,
      details: entry.details ? JSON.stringify(entry.details) : null,
      ipAddress: entry.ipAddress,
      hashChain: chain,
      timestamp,
    },
  });
}

// Verify integrity of audit chain — call from MLRO workspace or scheduled job
export async function verifyAuditChain(): Promise<{ valid: boolean; brokenAt?: string }> {
  const logs = await db.auditLog.findMany({
    orderBy: { timestamp: 'asc' },
    select: { id: true, action: true, timestamp: true, hashChain: true },
  });

  let prevHash = '0'.repeat(64);

  for (const log of logs) {
    const expected = hashChain(prevHash, log.id, log.action, log.timestamp);
    if (expected !== log.hashChain) {
      return { valid: false, brokenAt: log.id };
    }
    prevHash = log.hashChain ?? prevHash;
  }

  return { valid: true };
}
