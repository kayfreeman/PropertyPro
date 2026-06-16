# Task 3: Dashboard Layout Overhaul (Inner Design)

**Agent**: dashboard-layout-overhaul-agent
**Task ID**: 3
**Date**: 2026-06-16
**Status**: ✅ Completed

## Summary

Completely overhauled the dashboard layout in `/home/z/my-project/src/app/page.tsx` to match the new `Inner Design.png` reference. The redesign transitions the platform from the previous navy/teal palette (`#002E5D` / `#00A79D`) to a deeper, modern palette (`#0F172A` / `#10B981`) and expands navigation from 8 items to 12 items (mapping to the existing 8 underlying sections).

## File Modified

- `/home/z/my-project/src/app/page.tsx` (only this file — per task constraint)

## Key Changes

### 1. Color Scheme Update
- Navy `#002E5D` → Deep navy `#0F172A` (sidebar, footer)
- Teal `#00A79D` → Emerald teal `#10B981` (active states, accents, buttons, borders)
- Main content background → Light gray `#F9FAFB`
- Loading spinner, avatar borders, badges, and all accent colors updated to `#10B981`

### 2. Sidebar Overhaul (Desktop + Mobile)
- Background: Deep navy `#0F172A` (was gradient navy)
- Logo at top: `/logo.png` inverted to white via `style={{ filter: 'brightness(0) invert(1)' }}`
- **Expanded navigation from 8 → 12 items**, all mapping to existing 8 sections:
  | Nav Item | Icon | Maps to Section |
  |---|---|---|
  | Dashboard | LayoutDashboard | dashboard |
  | Applicants | Users | identity |
  | Verifications | ShieldCheck | identity |
  | Trust Ladder | TrendingUp | identity |
  | Compliance | FileCheck | compliance |
  | Risk Intelligence | AlertTriangle | risk |
  | Right to Rent | Landmark | property |
  | Property Intelligence | Building2 | property |
  | Reports | FileBarChart | compliance |
  | Partners | Handshake | partners |
  | AI Assistant | Bot | ai-assistant |
  | Settings | Settings2 | settings |
- Active state: `bg-[#10B981] text-white shadow-md shadow-[#10B981]/20`
- Inactive state: `text-white/70 hover:bg-white/10 hover:text-white`
- Removed the old sidebar collapse feature (the design shows a fixed-width 256px sidebar)
- Added "Need Help?" section above user profile:
  - HelpCircle icon (teal) + "Need Help?" heading (white)
  - "Ask our AI Compliance Assistant" subtitle (white/60)
  - Full-width teal "Open Assistant" button → navigates to `ai-assistant` section
- User profile at bottom: Avatar (initials) + name + role name

### 3. State Management Updates
- Added `activeNavId` state to track which of the 12 nav items is currently active (independent from the underlying `activeSection`)
- New `handleNavClick(item)` function: sets both `activeNavId` and `activeSection`
- Updated `handleSectionChange(section, tab?)` to also sync `activeNavId` to the first matching nav item (preserves backward compatibility with child components like `DashboardOverview` and `PropertyIntelligence` that call `onNavigate(sectionId)`)
- Added `goToDashboard()` and `openAssistant()` helpers
- `validSection` and `validNavId` derived with role-based fallbacks preserved

### 4. Header Overhaul (White Background)
- Background: White with `border-b border-slate-200 shadow-sm` (was navy/teal border)
- Height: `h-16` (preserved)
- **Left**: Mobile hamburger (lg:hidden) + Mobile logo (lg:hidden) + Desktop breadcrumb ("Dashboard > [Active Nav Label]" with ChevronRight separators)
- **Center**: Search bar with `placeholder="Search anything..."` and teal focus ring (preserved search-driven navigation to identity section)
- **Right**:
  - Role badge (xl+ only)
  - Notification bell with red "3" badge (preserved)
  - User menu dropdown (sm+ — preserved profile/security/sign-out functionality)
  - "Download Report" button (outline, lg+ only) with Download icon
  - "Share Credential" button (teal `#10B981`, lg+ only) with Share2 icon

### 5. Section Header Update
- Background: `#F9FAFB` (light gray)
- Teal left border accent: `border-l-4 border-[#10B981] pl-4` on the title
- Added breadcrumb-style subtitle above the title ("Dashboard > [Active Nav Label]")
- Title from `SECTION_META[validSection].title`, descriptive subtitle from `SECTION_META[validSection].subtitle`

### 6. Footer Update
- Background: Navy `#0F172A` (was `#002E5D`)
- Logo inverted to white via `filter: brightness(0) invert(1)`
- 4 columns preserved: Brand, Regulatory Compliance (UK GDPR, UK MLR 2017, FCA Compliance, Immigration Act 2014), Platform, Legal
- All hover accents updated to `#10B981`
- Bottom bar with copyright, Trust Infrastructure badge, and regulatory abbreviations preserved
- `mt-auto` on footer + `min-h-screen flex flex-col` on root wrapper → footer sticks to bottom

### 7. Mobile Sidebar
- Same deep navy `#0F172A` background and teal `#10B981` active states as desktop
- Slide-in animation via Framer Motion (`x: -300` → `x: 0`)
- Positioned `top-16` (below header) to `bottom-0`
- Includes: inverted logo, all 12 nav items, "Need Help?" + "Open Assistant" section, user profile, and Sign Out button
- Backdrop overlay with `bg-black/50` and click-to-close

### 8. Imports
- Added: `Users`, `TrendingUp`, `Landmark`, `FileBarChart`, `Download`, `Share2`, `HelpCircle`
- Removed: `ChevronLeft` (was only used for the removed collapse button)
- Kept: `ChevronRight` (used in breadcrumb separators)

## Verification
- ✅ `bun run lint` passes with 0 errors (1 pre-existing warning in `api/identities/route.ts`, unrelated)
- ✅ Dev server compiles successfully (`✓ Compiled in 277ms`, `GET / 200`)
- ✅ Component remains `'use client'`
- ✅ `LandingPage` import preserved (used for unauthenticated users)
- ✅ All existing functionality preserved:
  - Navigation between sections
  - Role-based access control via `canAccessSection`
  - Sign out flow with loading state
  - Settings tab navigation (`profile` / `security`)
  - Search-driven navigation to identity section
  - Framer Motion section transitions
  - All child component integrations (`onNavigate` callbacks)
- ✅ Footer sticky to bottom via `mt-auto` + `min-h-screen flex flex-col`
- ✅ Only `src/app/page.tsx` modified (no other files touched)
