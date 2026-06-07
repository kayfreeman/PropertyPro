# Task 4: User-Scoping for Tenant Data Isolation in API Routes
**Agent**: api-scoping-agent
**Date**: 2026-06-07
**Status**: ✅ Completed

## Files Modified

1. **`prisma/schema.prisma`** — Added `partnerId` field to User model and `users` relation to Partner model:
   - `partnerId String?` on User — Links partner_user to their Partner for data isolation
   - `partner Partner? @relation(fields: [partnerId], references: [id])` on User model
   - `users User[]` relation on Partner model

2. **`prisma/seed.ts`** — Added partner_user → Partner linking:
   - After partners are created, updates partner_user (users[6]) with `partnerId: partners[0].id` (Barclays Bank PLC)

3. **`src/app/api/identities/route.ts`** — GET handler now accepts `userId` and `role` query params:
   - `partner_only` scope: returns empty
   - `own` scope (tenant): filters by `userId`
   - `all` scope: returns all as before

4. **`src/app/api/compliance/route.ts`** — GET handler now accepts `userId` and `role` query params:
   - `partner_only` scope: returns empty
   - `own` scope: finds profile by userId, filters by profileId
   - Summary statistics also scoped

5. **`src/app/api/risk/route.ts`** — GET handler now accepts `userId` and `role` query params:
   - `partner_only` scope: returns empty
   - `own` scope: filters risk scores by profileId, fraud alerts by relatedProfileId

6. **`src/app/api/properties/route.ts`** — GET handler now accepts `userId` and `role` query params:
   - `own` scope: filters applications by profileId, removes properties with no tenant applications

7. **`src/app/api/dashboard/route.ts`** — GET handler now accepts `userId` and `role` query params:
   - `own` scope: all metrics scoped to tenant's own profile only
   - Tenant dashboard shows: 1 profile, own compliance/risk/properties, no partner data

8. **`src/app/api/partners/route.ts`** — GET handler now accepts `userId` and `role` query params:
   - `own` scope (tenant): returns empty (tenants can't see partners)
   - `partner_only` scope: shows only the partner linked via user.partnerId

9. **`src/app/api/notifications/route.ts`** — Verified already working correctly (filters by userId)

## Implementation Pattern

All routes follow a consistent pattern using `getDataScope(role)` from `@/lib/rbac`:
- `'all'` → return all data (platform_admin, compliance_officer, property_manager, identity_verifier, risk_analyst, partner_integration_manager)
- `'partner_only'` → restrict to partner-specific data (partner_user)
- `'own'` → restrict to user's own data (tenant)

For tenant scoping, the pattern is:
1. Find IdentityProfile where `userId` matches the request userId
2. Use that profileId to filter related data
3. Return empty data if no profile found

## Verification
- Lint passes with no errors
- Direct Prisma testing confirms:
  - Tenant sees 1 profile, 5 compliance checks, 1 risk score, 1 property app
  - Partner user linked to Barclays Bank PLC
  - Admin sees all 8 profiles, 26 compliance checks, etc.
