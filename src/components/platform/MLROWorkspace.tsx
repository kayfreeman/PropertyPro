"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Scale, FileWarning, CheckCircle2, XCircle, Clock, ShieldAlert, AlertTriangle, Lock } from "lucide-react";

interface SAR {
  id: string;
  sarRef: string;
  status: string;
  draftContent: string | null;
  mlroDecision: string | null;
  mlroNotes: string | null;
  filingRef: string | null;
  createdAt: string;
  case?: { caseRef: string; riskLevel: string | null };
}

interface PendingCase {
  id: string;
  caseRef: string;
  status: string;
  riskLevel: string | null;
  eddCompletedAt: string | null;
  mlroNotes: string | null;
  profile?: { id: string; firstName: string; lastName: string; nationality: string | null };
  actions: Array<{ actionType: string; performedAt: string; notes: string | null }>;
}

interface MLROData {
  mlroUser: { id: string; name: string; email: string; firmName: string | null };
  workQueue: { pendingSARs: SAR[]; pendingEDDSignOff: PendingCase[]; totalPending: number };
  openCases: PendingCase[];
  sarStats: Record<string, number>;
}

const SAR_STATUS_COLOURS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  pending_mlro: "bg-amber-100 text-amber-800",
  approved: "bg-green-100 text-green-800",
  filed: "bg-blue-100 text-blue-800",
  rejected: "bg-red-100 text-red-700",
};

const RISK_COLOURS: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  high: "bg-red-100 text-red-700",
  critical: "bg-red-200 text-red-900 font-semibold",
};

export default function MLROWorkspace() {
  const { data: session } = useSession();
  const [data, setData] = useState<MLROData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("work-queue");
  const [selectedSAR, setSelectedSAR] = useState<SAR | null>(null);
  const [selectedCase, setSelectedCase] = useState<PendingCase | null>(null);
  const [notes, setNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [auditChainStatus, setAuditChainStatus] = useState<{ valid: boolean; brokenAt?: string } | null>(null);

  const fetchMLROData = useCallback(async () => {
    try {
      const res = await fetch("/api/mlro");
      if (!res.ok) throw new Error("Failed to load MLRO workspace");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMLROData(); }, [fetchMLROData]);

  const handleSARDecision = async (sarId: string, decision: "approve" | "reject" | "request_more_info") => {
    setActionLoading(true);
    setActionResult(null);
    try {
      const res = await fetch("/api/sar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sarId, decision, notes }),
      });
      if (!res.ok) throw new Error("Failed to process SAR decision");
      setActionResult({ type: "success", message: `SAR ${decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "sent back for more information"} successfully` });
      setSelectedSAR(null);
      setNotes("");
      await fetchMLROData();
    } catch {
      setActionResult({ type: "error", message: "Failed to process SAR decision. Please try again." });
    } finally {
      setActionLoading(false);
    }
  };

  const handleEDDSignOff = async (caseId: string, approve: boolean) => {
    setActionLoading(true);
    setActionResult(null);
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: approve ? "mlro_sign_off" : "reject", notes }),
      });
      if (!res.ok) throw new Error("Failed to process EDD sign-off");
      setActionResult({ type: "success", message: approve ? "EDD signed off — case cleared" : "Case rejected" });
      setSelectedCase(null);
      setNotes("");
      await fetchMLROData();
    } catch {
      setActionResult({ type: "error", message: "Failed to process EDD sign-off. Please try again." });
    } finally {
      setActionLoading(false);
    }
  };

  const verifyAuditChain = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/mlro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionType: "verify_audit_chain", targetId: "all" }),
      });
      const json = await res.json();
      setAuditChainStatus(json.auditChainVerification);
    } catch {
      setAuditChainStatus({ valid: false, brokenAt: "verification_failed" });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Scale className="h-10 w-10 text-red-700 mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-gray-500">Loading MLRO Workspace...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700">
          Failed to load MLRO Workspace. Ensure you are signed in with the MLRO role.
        </AlertDescription>
      </Alert>
    );
  }

  const parseDraftContent = (raw: string | null) => {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <Scale className="h-6 w-6 text-red-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">MLRO Workspace</h2>
            <p className="text-sm text-gray-500">
              {data.mlroUser.name} — {data.mlroUser.firmName ?? "PropComply"} | MLR 2017 Reg.21
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {data.workQueue.totalPending > 0 && (
            <Badge className="bg-red-100 text-red-800 border-red-200">
              {data.workQueue.totalPending} pending action{data.workQueue.totalPending > 1 ? "s" : ""}
            </Badge>
          )}
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            <Lock className="h-3 w-3 mr-1" />
            Restricted Access
          </Badge>
        </div>
      </div>

      {/* Tipping-off notice */}
      <Alert className="border-amber-200 bg-amber-50">
        <ShieldAlert className="h-4 w-4 text-amber-700" />
        <AlertDescription className="text-amber-800 text-sm">
          <strong>Tipping-Off Warning (POCA 2002 s.333A):</strong> Information in this workspace is strictly confidential.
          Disclosing the existence of a SAR or its contents to any subject, client, or third party is a criminal offence.
        </AlertDescription>
      </Alert>

      {/* Action result */}
      {actionResult && (
        <Alert className={actionResult.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          {actionResult.type === "success"
            ? <CheckCircle2 className="h-4 w-4 text-green-600" />
            : <XCircle className="h-4 w-4 text-red-600" />
          }
          <AlertDescription className={actionResult.type === "success" ? "text-green-700" : "text-red-700"}>
            {actionResult.message}
          </AlertDescription>
        </Alert>
      )}

      {/* SAR Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Pending Review", value: (data.sarStats.pending_mlro ?? 0) + (data.sarStats.draft ?? 0), color: "text-amber-700", bg: "bg-amber-50" },
          { label: "Approved", value: data.sarStats.approved ?? 0, color: "text-green-700", bg: "bg-green-50" },
          { label: "Filed with NCA", value: data.sarStats.filed ?? 0, color: "text-blue-700", bg: "bg-blue-50" },
          { label: "EDD Sign-Offs Due", value: data.workQueue.pendingEDDSignOff.length, color: "text-red-700", bg: "bg-red-50" },
        ].map(stat => (
          <Card key={stat.label} className={`${stat.bg} border-0`}>
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
              <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="work-queue">
            Work Queue
            {data.workQueue.totalPending > 0 && (
              <span className="ml-2 bg-red-100 text-red-700 text-xs px-1.5 py-0.5 rounded-full">{data.workQueue.totalPending}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sars">SAR Management</TabsTrigger>
          <TabsTrigger value="audit">Audit Chain</TabsTrigger>
        </TabsList>

        {/* WORK QUEUE */}
        <TabsContent value="work-queue" className="space-y-4">
          {/* Pending SARs */}
          {data.workQueue.pendingSARs.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileWarning className="h-4 w-4 text-red-600" />
                  SARs Pending Your Review ({data.workQueue.pendingSARs.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.workQueue.pendingSARs.map(sar => {
                  const draft = parseDraftContent(sar.draftContent);
                  return (
                    <div key={sar.id} className="border rounded-lg p-4 bg-red-50/40 border-red-100">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-semibold text-red-800">{sar.sarRef}</span>
                            <Badge className={`text-xs ${SAR_STATUS_COLOURS[sar.status] ?? "bg-gray-100"}`}>
                              {sar.status.replace("_", " ").toUpperCase()}
                            </Badge>
                            {draft?.aiAssisted && (
                              <Badge className="text-xs bg-purple-100 text-purple-700">AI Drafted</Badge>
                            )}
                          </div>
                          {sar.case && (
                            <p className="text-xs text-gray-500">Case: {sar.case.caseRef}
                              {sar.case.riskLevel && <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${RISK_COLOURS[sar.case.riskLevel] ?? ""}`}>{sar.case.riskLevel.toUpperCase()}</span>}
                            </p>
                          )}
                          {draft?.grounds && (
                            <p className="text-sm text-gray-700 mt-2 line-clamp-2">{draft.grounds}</p>
                          )}
                        </div>
                        <Button size="sm" variant="outline" className="text-red-700 border-red-200 hover:bg-red-50"
                          onClick={() => { setSelectedSAR(sar); setNotes(""); }}>
                          Review SAR
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Pending EDD Sign-offs */}
          {data.workQueue.pendingEDDSignOff.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  EDD Sign-Off Required ({data.workQueue.pendingEDDSignOff.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.workQueue.pendingEDDSignOff.map(c => (
                  <div key={c.id} className="border rounded-lg p-4 bg-amber-50/40 border-amber-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-semibold">{c.caseRef}</span>
                          {c.riskLevel && (
                            <Badge className={`text-xs ${RISK_COLOURS[c.riskLevel] ?? ""}`}>
                              {c.riskLevel.toUpperCase()}
                            </Badge>
                          )}
                        </div>
                        {c.profile && (
                          <p className="text-sm text-gray-600">
                            {c.profile.firstName} {c.profile.lastName}
                            {c.profile.nationality && <span className="text-gray-400 text-xs ml-1">({c.profile.nationality})</span>}
                          </p>
                        )}
                        {c.eddCompletedAt && (
                          <p className="text-xs text-gray-500 mt-1">
                            EDD completed: {new Date(c.eddCompletedAt).toLocaleDateString("en-GB")}
                          </p>
                        )}
                        {c.actions[0] && (
                          <p className="text-xs text-gray-500">{c.actions[0].notes}</p>
                        )}
                      </div>
                      <Button size="sm" variant="outline" className="text-amber-700 border-amber-200 hover:bg-amber-50"
                        onClick={() => { setSelectedCase(c); setNotes(""); }}>
                        Sign Off
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {data.workQueue.totalPending === 0 && (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <p className="font-medium">Work queue clear</p>
              <p className="text-sm">No SARs or EDD sign-offs pending</p>
            </div>
          )}
        </TabsContent>

        {/* SAR MANAGEMENT */}
        <TabsContent value="sars" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">All SARs — {data.mlroUser.firmName}</CardTitle>
            </CardHeader>
            <CardContent>
              {[...data.workQueue.pendingSARs].length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No SARs on record.</p>
              ) : (
                <div className="space-y-2">
                  {data.workQueue.pendingSARs.map(sar => (
                    <div key={sar.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-medium">{sar.sarRef}</span>
                        <Badge className={`text-xs ${SAR_STATUS_COLOURS[sar.status] ?? "bg-gray-100"}`}>
                          {sar.status.replace(/_/g, " ")}
                        </Badge>
                        {sar.filingRef && (
                          <span className="text-xs text-blue-600">NCA: {sar.filingRef}</span>
                        )}
                      </div>
                      <span className="text-xs text-gray-400">{new Date(sar.createdAt).toLocaleDateString("en-GB")}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUDIT CHAIN */}
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Audit Trail Integrity Verification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                The audit trail uses SHA-256 hash-chaining (FR-AUD001). Each log entry references the previous entry's hash,
                making tampering detectable. Run verification to confirm chain integrity.
              </p>
              <Button onClick={verifyAuditChain} disabled={actionLoading} className="bg-gray-900 text-white hover:bg-gray-800">
                {actionLoading ? "Verifying..." : "Verify Audit Chain"}
              </Button>
              {auditChainStatus && (
                <Alert className={auditChainStatus.valid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  {auditChainStatus.valid
                    ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                    : <XCircle className="h-4 w-4 text-red-600" />
                  }
                  <AlertDescription className={auditChainStatus.valid ? "text-green-700" : "text-red-700"}>
                    {auditChainStatus.valid
                      ? "Audit chain intact — no tampering detected."
                      : `Chain broken at entry: ${auditChainStatus.brokenAt}. Immediate investigation required.`
                    }
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* SAR Review Modal */}
      {selectedSAR && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-red-800">SAR Review — {selectedSAR.sarRef}</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedSAR(null)}>✕</Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">RESTRICTED — MLRO EYES ONLY — DO NOT DISCLOSE</p>
            </div>
            <div className="p-6 space-y-4">
              {(() => {
                const draft = parseDraftContent(selectedSAR.draftContent);
                return draft ? (
                  <div className="space-y-3 text-sm">
                    <div><span className="font-medium text-gray-700">Subject:</span><p className="text-gray-900">{draft.subject}</p></div>
                    <div><span className="font-medium text-gray-700">Grounds for Suspicion:</span><p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded">{draft.grounds}</p></div>
                    {draft.requestedAction && <div><span className="font-medium text-gray-700">Requested Action:</span><p className="text-gray-900">{draft.requestedAction}</p></div>}
                  </div>
                ) : <p className="text-sm text-gray-500">No draft content.</p>;
              })()}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">MLRO Decision Notes</label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Enter your decision rationale (required for audit trail)..."
                  className="text-sm" rows={3} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button className="flex-1 bg-green-700 hover:bg-green-800 text-white" disabled={actionLoading}
                  onClick={() => handleSARDecision(selectedSAR.id, "approve")}>
                  Approve SAR
                </Button>
                <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white" disabled={actionLoading}
                  onClick={() => handleSARDecision(selectedSAR.id, "request_more_info")}>
                  Request More Info
                </Button>
                <Button className="flex-1 bg-red-700 hover:bg-red-800 text-white" disabled={actionLoading}
                  onClick={() => handleSARDecision(selectedSAR.id, "reject")}>
                  Reject SAR
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDD Sign-off Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">EDD Sign-Off — {selectedCase.caseRef}</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedCase(null)}>✕</Button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {selectedCase.profile && (
                <div className="p-3 bg-gray-50 rounded">
                  <p className="font-medium">{selectedCase.profile.firstName} {selectedCase.profile.lastName}</p>
                  {selectedCase.profile.nationality && <p className="text-sm text-gray-500">{selectedCase.profile.nationality}</p>}
                </div>
              )}
              {selectedCase.actions[0]?.notes && (
                <div>
                  <p className="text-sm font-medium text-gray-700">Compliance Officer Notes:</p>
                  <p className="text-sm text-gray-600 p-2 bg-gray-50 rounded mt-1">{selectedCase.actions[0].notes}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">MLRO Sign-Off Notes</label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Record your assessment and decision rationale..."
                  rows={3} className="text-sm" />
              </div>
              <div className="flex gap-3">
                <Button className="flex-1 bg-green-700 hover:bg-green-800 text-white" disabled={actionLoading}
                  onClick={() => handleEDDSignOff(selectedCase.id, true)}>
                  Approve & Clear Case
                </Button>
                <Button className="flex-1 bg-red-700 hover:bg-red-800 text-white" disabled={actionLoading}
                  onClick={() => handleEDDSignOff(selectedCase.id, false)}>
                  Reject Case
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
