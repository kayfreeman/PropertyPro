# PropComply AI + VerifyMe Global — UI/UX Audit & Remediation

_Refinement audit of the existing platform (not a redesign). Reviewed across all personas: Applicant, Risk Analyst, Verification Specialist, Compliance Officer, MLRO, Property Manager, Partner Integration Manager, External Partner, Platform Admin, Auditor._

---

## 1. Executive Summary

The platform is already on a solid enterprise footing: a unified status framework (`src/lib/status.ts`), a shared shadcn/ui component library, RBAC-driven navigation, and role-based dashboards. The issues found are **refinements**, concentrated in branding asset handling, layout padding consistency, and a few component-level alignment/standardisation gaps — not structural problems.

This pass **fixed the highest-priority concrete issues** and catalogues the rest as prioritised recommendations.

---

## 2. Fixed in this pass ✅

| # | Area | Issue | Fix |
|---|------|-------|-----|
| F1 | Branding | **Sign-in modal logo stretched** (the named example). `DialogHeader` is a flex column with default `align-items: stretch`, which stretched the `<img>` to full width while height stayed `h-9`, distorting the aspect ratio. | Added `object-contain self-center sm:self-start max-w-[220px]` so the logo keeps its ratio and aligns with the header text. |
| F2 | Branding | Logo `<img>` tags lacked `object-contain`, risking distortion on any container that constrains both axes. | Standardised **all 6 logo placements** (loading, app header, app footer, landing nav, landing footer, sign-in modal) with `object-contain` + explicit anti-stretch/`max-w`. |
| F3 | Layout | **Inconsistent section padding.** The page content wrapper already applies `px-4 sm:px-6 py-6`, but Property Intelligence, Partners, Reports and Risk Intelligence added a second `p-4 md:p-6`/`p-6` at their root — so those sections sat with visibly more inset than Dashboard, Applicants and Compliance. | Removed the redundant root padding; **all sections now share one consistent gutter** from the wrapper. |
| F4 | Code quality | **Rules-of-hooks violation** in `PartnerEcosystem` — `useApi` was called after the `partner_user` early `return`. Latent correctness bug (and an ESLint error). | Moved the hook above the branch and gated it with `enabled`, preserving hook order. |

All changes pass `tsc --noEmit` and ESLint, and the dev server compiles cleanly.

---

## 3. Findings & Prioritised Recommendations

Priority key: **P0** = visible/branding or correctness · **P1** = consistency/usability · **P2** = polish/hardening.

### Area 1 — Layout & Visual Hierarchy
- **[P1] Standardise the section content max-width.** The shell wraps content in `max-w-7xl`. Confirm every full-bleed section (charts, wide tables) respects it; data-dense tables already scroll horizontally (`overflow-x-auto`), which is correct.
- **[P2] Card grid rhythm.** Metric rows use `grid-cols-2 lg:grid-cols-4` in most places but `sm:grid-cols-2 lg:grid-cols-4` in others. Pick one breakpoint ladder for KPI rows platform-wide.

### Area 2 — Branding & Logo Placement
- **[P0 — DONE]** Sign-in modal stretch (F1) and logo standardisation (F2).
- **[P2] Favicon** already points to a purpose-built square mark (`/favicon-mark.png`); no wordmark-in-tab distortion remains.
- **[P2] Reversed-logo asset.** The dark-background placements use a CSS `brightness-0 invert` filter on the colour logo. A dedicated white/reversed PNG would render crisper than the filtered version.

### Area 3 — Component & Widget Alignment
- **[P1] Status indicators are unified** via `StatusIndicator` + `status.ts` across Compliance, Risk, Application and Right-to-Rent — keep all new surfaces routed through it.
- **[P1] `RightToRentFlow` still uses bespoke inline badges** (static "Verified"/Pass-Fail pills). Intentional for its wizard hero visuals, but the small per-check pills could adopt the shared badge tokens for colour consistency.
- **[P2] Button sizing.** Mix of `size="sm"` and default buttons in toolbars; define a convention (toolbars = `sm`, primary CTAs = default).

### Area 4 — Typography & Content Presentation
- **[P1] Truncation discipline.** Long applicant names / property addresses use `truncate` in most tables but not all — audit any `<TableCell>` without `truncate`/`min-w-0` for overflow on narrow viewports.
- **[P2] Microcopy.** Empty states are good ("No applicants pending decision"); standardise tone and always pair with a next-step CTA where one exists.

### Area 5 — Forms & Modal Windows
- **[P0 — DONE]** Sign-in modal logo.
- **[P1] Validation messaging.** Login uses inline error text; onboarding wizard uses disabled-until-valid. Consider one validation pattern (inline helper text + field-level error) across all forms.
- **[P2] Modal sizing.** The compliance decision drawer (`Sheet`, `sm:max-w-xl`, `overflow-y-auto`) is appropriate; verify the onboarding modal doesn't force scroll at `md` for short steps.

### Area 6 — Dashboard Optimisation
- **[P1 — LARGELY DONE]** Role-specific dashboards exist (`PersonaDashboards.tsx`): Applicant, Risk Analyst, Verification Specialist, Partner Integration Manager, External Partner; others get the full overview. Each leads with role-relevant KPIs + a primary queue + quick actions.
- **[P2] "Trend" deltas** on the default dashboard cards are currently static strings ("+12% this month"). Either compute them or remove to avoid implying live data.

### Area 7 — Navigation & User Journey
- **[P1 — DONE]** Consolidated **Verifications** and **Trust Ladder** into the single **Applicants** page, removing duplicate nav entries across personas.
- **[P1 — DONE]** Onboarding entry point now hidden once a profile is verified (prevents duplicate submissions); re-enabled on rejection.
- **[P2] Breadcrumb** shows `Dashboard / <Section>`; consider making the section segment reflect in-section tabs (e.g., `Compliance / Pipeline`).

### Area 8 — Design System Compliance
- **[P1] Colour tokens.** Many components use inline hex (`#10b981`, `#0d9488`, …). `status.ts` centralises status tones; extend that approach to a small shared `tokens.ts` (brand, surface, text, accent) to remove scattered literals.
- **[P2] Icon usage.** Lucide is used consistently; document a per-domain icon map so the same concept always uses the same glyph (e.g., AML = `ShieldCheck`).

---

## 4. Success-Criteria Status

| Criterion | Status |
|-----------|--------|
| No stretched/distorted/improperly sized branding assets | ✅ Met (F1, F2) |
| Consistent layouts & component alignment across pages | ✅ Improved (F3); P1/P2 items remain for full parity |
| Improved readability & visual hierarchy | ◻ Partially — typography/truncation P1 items outstanding |
| Responsive & accessible interfaces | ◻ Responsive grids in place; recommend an a11y pass (focus rings, `aria-label`s, contrast on light-on-teal) |
| Reduced friction & navigation complexity | ✅ Improved (nav consolidation, persona dashboards) |
| Polished, enterprise-grade experience | ◻ On track; remaining items are P1/P2 polish |

---

## 5. Suggested Next Iteration (in priority order)

1. **P1 — Design tokens**: introduce `src/lib/tokens.ts` and replace inline hex in the most-used components.
2. **P1 — Typography/overflow pass**: enforce `truncate`/`min-w-0` on all table cells and card titles.
3. **P1 — Form/validation convention**: unify validation messaging across login, onboarding, and partner registration.
4. **P2 — Accessibility pass**: focus-visible rings, `aria-label`s on icon-only buttons, contrast check on teal-on-white text.
5. **P2 — Reversed logo asset** + computed dashboard trend deltas.

Each is self-contained and can be picked up independently.
