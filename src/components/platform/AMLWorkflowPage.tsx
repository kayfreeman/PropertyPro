'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, Lock } from 'lucide-react';
import { getWorkflowStage, type UserRole } from '@/lib/rbac';
import WorkflowStageBanner from '@/components/platform/WorkflowStageBanner';
import AMLWorkflow from '@/components/platform/AMLWorkflow';

/**
 * Persona-aware AML Workflow page. Surfaces the AML CDD/EDD/SAR workflow as its
 * own page, with the signed-in persona's stage in the workflow made explicit and
 * read-only personas clearly flagged.
 */
export default function AMLWorkflowPage() {
  const { data: session } = useSession();
  const role = (session?.user?.role as UserRole) || 'tenant';
  const stage = getWorkflowStage(role, 'aml');

  return (
    <div className="space-y-6">
      <WorkflowStageBanner role={role} feature="aml" />

      {!stage.canAct && stage.hasAccess && (
        <Card className="border-slate-200 bg-slate-50/60">
          <CardContent className="flex items-start gap-2.5 py-3">
            <Eye className="size-4 text-slate-500 mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-foreground">Read-only view.</strong> Your role can monitor the AML workflow but
              cannot action CDD/EDD checks or SAR decisions. Those steps are reserved for the Compliance Officer and the
              MLRO (MLR 2017 Reg.21).
            </p>
          </CardContent>
        </Card>
      )}

      {stage.tier >= 4 && (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardContent className="flex items-start gap-2.5 py-3">
            <Lock className="size-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              <strong>MLRO authority.</strong> You hold sign-off authority for EDD and exclusive responsibility for SAR
              adjudication and filing. Tipping-off rules apply — SAR details must not be disclosed to the subject.
            </p>
          </CardContent>
        </Card>
      )}

      <AMLWorkflow />
    </div>
  );
}
