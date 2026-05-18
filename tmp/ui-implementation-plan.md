# UI Implementation Plan

## Objective
To eliminate the technical debt associated with mismatched API routes and Dashboard pages (API_ONLY and DASHBOARD_ONLY), and to replace generic placeholders with actionable `FeatureDisabledPanel` components.

## Phase 1: Discovery & Auditing (Completed)
1. **API vs UI Scans**: Executed recursive scans on `src/app/api` and `src/app/(dashboard)` to determine matching and orphaned routes.
2. **Gap Reporting**: Generated `ui-api-gap-report.md` identifying 76 `API_ONLY` and 20 `DASHBOARD_ONLY` sections.
3. **Placeholder Detection**: Identified 45 usages of `ComingSoonModule` in the `(dashboard)` routing hierarchy.

## Phase 2: High-Priority Dashboard Generation (Completed)
For the critical 18 missing Dashboards (Priority 1 & Priority 2):
- **Strategy**: Generated a standardized React generic template (`GenericModulePage`).
- **Features Included**:
  - Centralized Data Table (renders first 6 columns dynamically).
  - Client-side search and filtering across all properties.
  - Consistent loading spinners, error boundaries, and empty state SVGs (Lucide React).
  - Strict RTL enforcement and Next.js `"use client"` directive.
  - Safely reads from `/api/<module>` using robust `try/catch` block.

## Phase 3: Placeholder Modernization (Completed)
- **Strategy**: The legacy `ComingSoonModule` offered no engineering context. We created `FeatureDisabledPanel`.
- **Functionality**:
  - Accepts the `moduleName` context dynamically from the path.
  - Automatically queries (or indicates) if the backend `/api/` endpoint is present for this feature.
  - Guides users to the generated gap reports for tracking.
- **Rollout**: Replaced all 45 `.tsx` occurrences. 

## Phase 4: Remaining Debt & Next Steps
- **DASHBOARD_ONLY**: Pages like `pos-dashboard`, `restaurant-pos`, `scm` lack direct 1:1 `/api/` counterparts. These are often composites consuming `/api/pos/*` or other central endpoints.
  - *Recommendation*: Leave as Read-Only or composite UI, since they do not inherently violate backend logic. Ensure they utilize `FeatureDisabledPanel` if truly non-functional.
- **Deepening Priority 1 UIs**: The generic `GenericModulePage` reads data but cannot write (Read-Only). 
  - *Recommendation*: Future sprints should build the form elements (CRUD capabilities) relying exclusively on `withRoute` + `Zod` validation.
- **TypeScript**: Currently validating the structural integrity of the 60+ modified/added `.tsx` files via `npx tsc --noEmit`. No modifications were made to the Prisma Schema, services, or auto-journal rules, preserving system atomicity and financial integrity.
