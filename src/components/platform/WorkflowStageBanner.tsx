'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Lock, ChevronRight } from 'lucide-react';
import {
  getWorkflowStage,
  getRoleDefinition,
  WORKFLOW_TIER_LABELS,
  type UserRole,
  type WorkflowFeature,
} from '@/lib/rbac';

/**
 * Shows the signed-in persona's unique level/stage in a feature's workflow,
 * derived from the RBAC hierarchy. Renders nothing if the role has no access.
 */
export default function WorkflowStageBanner({
  role,
  feature,
}: {
  role: UserRole;
  feature: WorkflowFeature;
}) {
  const stage = getWorkflowStage(role, feature);
  if (!stage.hasAccess) return null;

  const roleDef = getRoleDefinition(role);
  const tiers = WORKFLOW_TIER_LABELS[feature];

  return (
    <Card style={{ borderColor: roleDef.color + '55' }} className="overflow-hidden">
      <CardContent className="flex flex-col gap-3 py-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Persona + stage */}
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5 shrink-0"
            style={{ backgroundColor: roleDef.bgColor, color: roleDef.color }}
          >
            <span className="text-[9px] font-medium uppercase tracking-wide opacity-80">Level</span>
            <span className="text-base font-bold leading-none">{roleDef.level}</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold truncate" style={{ color: roleDef.color }}>
                {roleDef.name}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 gap-1"
                style={{ borderColor: roleDef.color + '40', color: roleDef.color, backgroundColor: roleDef.bgColor }}
              >
                {stage.canAct ? <CheckCircle2 className="size-2.5" /> : <Lock className="size-2.5" />}
                {stage.stageLabel}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{stage.capability}</p>
          </div>
        </div>

        {/* 4-tier workflow progression with this persona's position highlighted */}
        <div className="flex items-center gap-1 shrink-0">
          {tiers.map((label, i) => {
            const tierNum = i + 1;
            const isActive = tierNum === stage.tier;
            const isPassed = tierNum < stage.tier;
            return (
              <div key={label} className="flex items-center gap-1">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium whitespace-nowrap transition-colors"
                  style={
                    isActive
                      ? { backgroundColor: roleDef.color, color: '#fff' }
                      : isPassed
                        ? { backgroundColor: roleDef.bgColor, color: roleDef.color }
                        : { backgroundColor: '#f1f5f9', color: '#94a3b8' }
                  }
                >
                  {label}
                </span>
                {i < tiers.length - 1 && <ChevronRight className="size-3 text-slate-300" />}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
