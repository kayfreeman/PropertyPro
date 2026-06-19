'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Share2,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Link2,
  Lock,
  Loader2,
  Mail,
  Building2,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const SCOPES = [
  { id: 'identity_verification', label: 'Identity Verification', desc: 'Confirms verified identity status' },
  { id: 'trust_level', label: 'Trust Level & Score', desc: 'Trust ladder level and score' },
  { id: 'compliance_status', label: 'Compliance Status', desc: 'AML/KYC compliance clearance' },
  { id: 'right_to_rent', label: 'Right to Rent', desc: 'Immigration Act 2014 eligibility' },
];

interface ShareResult {
  shareUrl: string;
  expiresAt: string;
  recipientEmail: string;
  recipientOrg: string | null;
  scopeLabels: string[];
  credential: Record<string, unknown>;
}

export default function ShareCredentialDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientOrg, setRecipientOrg] = useState('');
  const [scope, setScope] = useState<string[]>(['identity_verification', 'trust_level']);
  const [expiryDays, setExpiryDays] = useState('7');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ShareResult | null>(null);

  const reset = () => {
    setRecipientEmail(''); setRecipientOrg(''); setScope(['identity_verification', 'trust_level']);
    setExpiryDays('7'); setConsent(false); setResult(null); setSubmitting(false);
  };

  const close = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const toggleScope = (id: string) =>
    setScope((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));

  const canSubmit = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail) && consent && scope.length > 0 && !submitting;

  const handleShare = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/credentials/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail, recipientOrg: recipientOrg || undefined, scope, expiryDays: Number(expiryDays), consent }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(body?.error || 'Could not share credential');
        return;
      }
      setResult(body as ShareResult);
      toast.success('Secure credential share created');
    } catch {
      toast.error('Network error sharing credential');
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.shareUrl);
      toast.success('Share link copied');
    } catch {
      toast.error('Could not copy — select and copy manually');
    }
  };

  const expiryLabel = result ? new Date(result.expiresAt).toLocaleString('en-GB') : '';

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Share2 className="size-5 text-[#10B981]" />
            <DialogTitle className="text-xl text-[#0F172A]">Share Credential</DialogTitle>
          </div>
          <DialogDescription>
            Securely share a verified credential with an approved party. Only a masked attestation is shared — never full PII — and every share is recorded in the audit trail.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            {/* Recipient */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><Mail className="size-3" /> Recipient Email</Label>
                <Input type="email" placeholder="landlord@example.com" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} className="h-9" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs flex items-center gap-1"><Building2 className="size-3" /> Organisation <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input placeholder="Acme Lettings Ltd" value={recipientOrg} onChange={(e) => setRecipientOrg(e.target.value)} className="h-9" />
              </div>
            </div>

            {/* Scope */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1"><ShieldCheck className="size-3" /> What to share</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SCOPES.map((s) => {
                  const checked = scope.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleScope(s.id)}
                      className={`text-left rounded-lg border p-2.5 transition-colors ${checked ? 'border-teal-300 bg-teal-50/50' : 'hover:bg-muted/40'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox checked={checked} className="size-3.5 pointer-events-none" />
                        <span className="text-sm font-medium">{s.label}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 ml-5.5">{s.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Expiry */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Calendar className="size-3" /> Link expires after</Label>
              <Select value={expiryDays} onValueChange={setExpiryDays}>
                <SelectTrigger className="h-9 w-[160px] text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 day</SelectItem>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="14">14 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Consent */}
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <Checkbox id="share-consent" checked={consent} onCheckedChange={(v) => setConsent(!!v)} className="mt-0.5" />
              <label htmlFor="share-consent" className="text-xs text-amber-800 cursor-pointer leading-relaxed">
                I consent to sharing this verified credential with the named recipient under UK GDPR Art. 6(1)(a). I understand the recipient can verify the masked attestation until the link expires, and this action is recorded in the audit trail.
              </label>
            </div>

            <Button onClick={handleShare} disabled={!canSubmit} className="w-full bg-[#10B981] hover:bg-[#059669] text-white gap-2">
              {submitting ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
              {submitting ? 'Creating secure share…' : 'Generate Secure Share Link'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
              <p className="text-sm text-emerald-800">Secure credential share created for <strong>{result.recipientEmail}</strong>.</p>
            </div>

            {/* Share link */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1"><Link2 className="size-3" /> Secure verification link</Label>
              <div className="flex items-center gap-2">
                <Input readOnly value={result.shareUrl} className="h-9 text-xs font-mono" onFocus={(e) => e.currentTarget.select()} />
                <Button size="sm" variant="outline" className="h-9 shrink-0 gap-1.5" onClick={copyLink}>
                  <Copy className="size-3.5" /> Copy
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Calendar className="size-3" /> Expires {expiryLabel}</p>
            </div>

            {/* Shared attestation preview */}
            <div className="rounded-lg border divide-y text-sm">
              <div className="px-3 py-2 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center justify-between">
                <span>Shared Attestation (masked)</span>
                <Badge variant="outline" className="text-[10px]">{result.scopeLabels.length} item{result.scopeLabels.length !== 1 ? 's' : ''}</Badge>
              </div>
              {Object.entries(result.credential).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between px-3 py-2">
                  <span className="text-muted-foreground capitalize">{k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}</span>
                  <span className="font-medium text-xs">{String(v)}</span>
                </div>
              ))}
            </div>

            <Separator />
            <div className="flex items-center gap-2">
              <Button variant="outline" className="gap-1.5 flex-1" onClick={reset}>
                <RotateCcw className="size-4" /> Share Another
              </Button>
              <Button className="bg-[#10B981] hover:bg-[#059669] text-white flex-1" onClick={() => close(false)}>
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
