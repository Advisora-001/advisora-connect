# Phase 1 Implementation Plan: Foundation & Multi-Professional Support

**Duration:** Weeks 1-3  
**Goal:** Production-ready foundation + support for Lawyers, Accountants, Tax Consultants

---

## Week 1: Environment, Types & Security

### 1.1 Environment Configuration
- [ ] Create `.env.example` with all required variables
- [ ] Create `Dockerfile` for containerization
- [ ] Create `docker-compose.yml` for local development
- [ ] Add GitHub Actions CI/CD workflow

### 1.2 Type Safety & API Validation
- [ ] Create `types/api.ts` with Zod schemas for all API endpoints
- [ ] Replace all `any` types in `lib/api.ts` with strict interfaces
- [ ] Add Zod validation to API client methods
- [ ] Create `types/models.ts` for shared frontend/backend types

### 1.3 Security Hardening
- [ ] Add CSRF protection middleware (backend)
- [ ] Add rate limiting to auth endpoints (backend)
- [ ] Move tokens from localStorage to HttpOnly cookies
- [ ] Add CSP headers in `next.config.ts`
- [ ] Implement refresh token rotation

---

## Week 2: Server State & Notifications

### 2.1 React Query Integration
- [ ] Install `@tanstack/react-query` and `@tanstack/react-query-devtools`
- [ ] Create `QueryProvider` wrapper in root layout
- [ ] Create custom hooks for all data fetching:
  - `useLawyers(filters)` / `useProfessionals(category, filters)`
  - `useLawyer(id)` / `useProfessional(id)`
  - `useLeads()`, `useEnquiries()`
  - `useAppointments()`, `useMyAppointments()`
  - `useWallet()`, `useNotifications()`
  - `useAnalytics()`, `useRevenue()`
- [ ] Add optimistic updates for mutations (accept/decline leads, book appointments)
- [ ] Configure cache times, stale times, retry policies

### 2.2 Toast Notification System
- [ ] Install `sonner` (lightweight, accessible toast library)
- [ ] Add `Toaster` component to root layout
- [ ] Replace all `alert()` calls with `toast.success()`, `toast.error()`, `toast.info()`
- [ ] Add loading toasts for async operations

---

## Week 3: Multi-Professional Frontend Support

### 3.1 Registration & Onboarding
- [ ] Update register page: add "Accountant" and "Tax Consultant" role options
- [ ] Create dynamic registration fields based on selected professional category
- [ ] Build role-based onboarding wizard:
  - **Lawyer** → SCN, bar info, practice areas
  - **Accountant** → License number, certifying body, specializations
  - **Tax Consultant** → Tax ID, certifying body, specializations
- [ ] Update `AuthContext` to include `professional` role type

### 3.2 Professional Dashboards (Unified)
- [ ] Create unified `ProfessionalDashboard` component (replaces `LawyerDashboard`)
- [ ] Dynamic sidebar based on professional category
- [ ] Shared components: Enquiries, Appointments, Wallet, Profile, Payout
- [ ] Category-specific profile fields (rendered from `ProfessionalCategory.registrationFields`)

### 3.3 Marketplace & Search
- [ ] Update `/lawyers` page → `/professionals` with category filter
- [ ] Category tabs: Legal, Accounting, Tax
- [ ] Dynamic filters based on category specializations
- [ ] Professional cards show category badge

### 3.4 Admin Updates
- [ ] Admin verifications: support all professional categories
- [ ] User management: filter by role (lawyer, accountant, tax_consultant, professional)
- [ ] Membership configuration: already supports multiple categories

---

## 4. Quick Wins (Parallel - Can Start Immediately)

### 4.1 Accessibility Fixes
- [ ] Add skip-to-main-content link in root layout
- [ ] Fix color contrast: `#667085` → `#475569` for body text
- [ ] Add ARIA labels to icon-only buttons
- [ ] Fix focus management in modals and sidebar

### 4.2 Component Consolidation
- [ ] Create unified `AppSidebar` component with config prop
- [ ] Replace `LawyerSidebar`, `ClientSidebar`, `AdminSidebar` 
- [ ] Create design system primitives: `Button`, `Input`, `Card`, `Modal`, `Badge`, `Select`

### 4.3 Loading States
- [ ] Add skeleton loaders for lawyer/professional cards
- [ ] Add skeleton loaders for dashboard stat cards
- [ ] Replace spinners with meaningful skeletons

---

## File Changes Summary

### New Files
```
client/
├── .env.example
├── Dockerfile
├── docker-compose.yml
├── .github/workflows/ci.yml
├── src/
│   ├── types/
│   │   ├── api.ts           # Zod schemas for all endpoints
│   │   ├── models.ts        # Shared type definitions
│   │   └── index.ts
│   ├── hooks/
│   │   ├── useProfessionals.ts
│   │   ├── useProfessional.ts
│   │   ├── useLeads.ts
│   │   ├── useEnquiries.ts
│   │   ├── useAppointments.ts
│   │   ├── useWallet.ts
│   │   ├── useNotifications.ts
│   │   └── index.ts
│   ├── components/
│   │   ├── ui/              # Design system primitives
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── index.ts
│   │   ├── AppSidebar.tsx   # Unified sidebar
│   │   ├── Toaster.tsx      # Sonner wrapper
│   │   └── SkipLink.tsx     # Accessibility
│   ├── providers/
│   │   └── QueryProvider.tsx
│   ├── app/
│   │   ├── professionals/   # New marketplace pages
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── dashboard/
│   │   │   └── professional/page.tsx  # Unified dashboard
│   │   └── (auth)/
│   │       └── register/
│   │           └── page.tsx           # Updated with multi-role
```

### Modified Files
```
client/
├── package.json              # Add dependencies
├── next.config.ts            # CSP headers
├── src/
│   ├── lib/api.ts            # Strict types, React Query integration
│   ├── context/AuthContext.tsx  # Add 'professional' role
│   ├── app/layout.tsx        # Add QueryProvider, Toaster, SkipLink
│   ├── app/page.tsx          # Update featured professionals
│   ├── app/lawyers/page.tsx  # Redirect or update to professionals
│   ├── app/dashboard/lawyer/page.tsx  # Deprecate → professional
│   ├── components/Navbar.tsx # Update role handling
│   └── app/(auth)/register/page.tsx  # Multi-role registration
```

---

## Dependencies to Add

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.x",
    "@tanstack/react-query-devtools": "^5.x",
    "zod": "^3.x",
    "sonner": "^1.x",
    "react-hook-form": "^7.x",
    "@hookform/resolvers": "^3.x"
  },
  "devDependencies": {
    "@types/node": "^20",
    "eslint-config-next": "16.2.10"
  }
}
```

---

## Success Criteria (Definition of Done)

- [ ] Application runs in Docker container locally
- [ ] CI pipeline passes (lint, type-check, build)
- [ ] All API calls typed with Zod validation
- [ ] No `any` types in `lib/api.ts`
- [ ] React Query manages all server state
- [ ] Zero `alert()` calls in codebase
- [ ] Registration supports Lawyer/Accountant/Tax Consultant
- [ ] Professional dashboard works for all categories
- [ ] Marketplace filters by category with dynamic specializations
- [ ] Accessibility audit passes (axe-core, manual keyboard nav)
- [ ] Color contrast meets WCAG AA