// Dependency-free report export utilities.
// - PDF: a branded, printable HTML report opened in a preview window
//        (the user prints / "Save as PDF" from the browser dialog).
// - XLS: an Excel-compatible HTML table blob (application/vnd.ms-excel),
//        which Excel/LibreOffice open natively — no SheetJS dependency.

export function esc(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── HTML report building blocks ─────────────────────────────────────────────

export interface ReportSection {
  title: string;
  // Either key/value rows…
  kv?: [string, string][];
  // …or a table.
  table?: { headers: string[]; rows: (string | number)[][] };
  // …or arbitrary pre-built HTML.
  html?: string;
  note?: string;
}

export function renderSection(s: ReportSection): string {
  let body = '';
  if (s.kv) {
    body += s.kv
      .map(([k, v]) => `<div class="row"><span class="lbl">${esc(k)}</span><span class="val">${esc(v)}</span></div>`)
      .join('');
  }
  if (s.table) {
    const head = `<tr>${s.table.headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>`;
    const rows = s.table.rows.length
      ? s.table.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('')
      : `<tr><td colspan="${s.table.headers.length}" style="color:#94a3b8;text-align:center;padding:14px">No records</td></tr>`;
    body += `<table class="rpt-table"><thead>${head}</thead><tbody>${rows}</tbody></table>`;
  }
  if (s.html) body += s.html;
  if (s.note) body += `<p class="note">${esc(s.note)}</p>`;
  return `<div class="section"><div class="sh">${esc(s.title)}</div><div class="sb">${body}</div></div>`;
}

export interface ReportShellOptions {
  title: string;
  subtitle: string;
  role: string;
  refId?: string;
  period?: string;
  user?: { name?: string | null; email?: string | null };
  sections: ReportSection[];
}

export function buildReportHtml(opts: ReportShellOptions): string {
  const generatedAt = new Date().toLocaleString('en-GB');
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const body = opts.sections.map(renderSection).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(opts.title)}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#1e293b;padding:32px;max-width:900px;margin:0 auto;background:#fff}
  .toolbar{position:sticky;top:0;display:flex;gap:8px;justify-content:flex-end;padding:8px 0 16px;background:#fff}
  .toolbar button{cursor:pointer;border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600}
  .btn-print{background:#0d9488;color:#fff}
  .btn-close{background:#f1f5f9;color:#334155}
  .header{background:linear-gradient(135deg,#0f172a,#0d9488);color:#fff;padding:22px 26px;border-radius:12px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:flex-start;gap:16px}
  .header img{height:34px;width:auto;object-fit:contain;filter:brightness(0) invert(1)}
  .header h1{margin:10px 0 2px;font-size:20px}
  .header .sub{font-size:13px;opacity:.85}
  .header .meta{text-align:right;font-size:11px;opacity:.8;line-height:1.7}
  .badge{display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700}
  .green{background:#dcfce7;color:#166534}.red{background:#fee2e2;color:#991b1b}.amber{background:#fef9c3;color:#92400e}.blue{background:#dbeafe;color:#1e40af}.slate{background:#f1f5f9;color:#475569}
  .section{margin-bottom:16px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden}
  .sh{background:#f8fafc;padding:10px 16px;font-weight:700;font-size:13px;border-bottom:1px solid #e2e8f0;color:#334155;letter-spacing:.3px}
  .sb{padding:14px 16px}
  .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f1f5f9;font-size:13px}
  .row:last-child{border-bottom:none}
  .lbl{color:#64748b}.val{font-weight:600}
  table.rpt-table{width:100%;border-collapse:collapse;font-size:12px}
  table.rpt-table th{text-align:left;padding:8px 10px;background:#f8fafc;border-bottom:1px solid #e2e8f0;color:#475569;font-weight:600}
  table.rpt-table td{padding:8px 10px;border-bottom:1px solid #f8fafc}
  .note{font-size:11px;color:#94a3b8;margin:8px 0 0}
  .footer{margin-top:22px;padding-top:14px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;line-height:1.7}
  @media print{body{padding:0}.toolbar{display:none}}
</style></head><body>
<div class="toolbar">
  <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
  <button class="btn-close" onclick="window.close()">Close</button>
</div>
<div class="header">
  <div>
    ${origin ? `<img src="${origin}/logo.png" alt="PropComply AI + VerifyMe Global" />` : ''}
    <h1>${esc(opts.title)}</h1>
    <div class="sub">${esc(opts.subtitle)}</div>
  </div>
  <div class="meta">
    <div>Persona: <strong>${esc(opts.role)}</strong></div>
    ${opts.user?.name ? `<div>User: ${esc(opts.user.name)}${opts.user.email ? ` &middot; ${esc(opts.user.email)}` : ''}</div>` : ''}
    <div>Generated: ${esc(generatedAt)}</div>
    ${opts.period ? `<div>Period: ${esc(opts.period)}</div>` : ''}
    ${opts.refId ? `<div>Ref: ${esc(opts.refId)}</div>` : ''}
  </div>
</div>
${body}
<div class="footer">
  Generated by <strong>PropComply AI + VerifyMe Global</strong> under UK MLR 2017 &amp; UK GDPR.<br>
  For authorised use only${opts.refId ? ` &middot; Ref: ${esc(opts.refId)}` : ''}
</div>
</body></html>`;
}

// Open the report in a preview window (user prints / saves as PDF from there).
export function openReportPreview(html: string): void {
  const w = window.open('', '_blank');
  if (w) {
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    return;
  }
  // Popup blocked — fall back to a blob URL in a new tab.
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

// Download tabular data as an Excel-openable .xls file (no dependency).
export function downloadXls(
  filename: string,
  headers: string[],
  rows: (string | number)[][],
  sheetName = 'Report',
): void {
  const head = `<tr>${headers.map((h) => `<th style="background:#0d9488;color:#fff">${esc(h)}</th>`).join('')}</tr>`;
  const body = rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`).join('');
  const table = `<table border="1"><thead>${head}</thead><tbody>${body}</tbody></table>`;
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="utf-8">
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>${esc(sheetName)}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head><body>${table}</body></html>`;
  const blob = new Blob(['﻿', html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  triggerDownload(blob, filename.endsWith('.xls') ? filename : `${filename}.xls`);
}

export function reportDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
