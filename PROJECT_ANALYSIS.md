# AdvisoryConnect — Codebase Analysis & UX Improvement Recommendations

**Date:** 2026-11-23  
**Project:** AdvisoryConnect — Legal Technology Platform  
**Analysis Type:** Technical Review + UX Audit

---

## Executive Summary

AdvisoryConnect is a Next.js 15+ (App Router) legal marketplace platform with three user roles (Client, Lawyer, Admin). The codebase demonstrates solid architectural foundations but has significant gaps in production readiness, feature completeness, and user experience polish. This analysis identifies **47 specific issues** across 8 categories and provides **prioritized recommendations** for improvement.

---

## 1. Critical Technical Issues (P0 — Must Fix)

### 1.1 Missing Environment Configuration & Deployment
| Issue | Location | Impact |
|-------|----------|--------|
| No `.env.example` or documented environment variables | Root | Developers cannot onboard; deployment fails |
| No Dockerfile or deployment configuration | Root | Cannot containerize or deploy to cloud |
| API URL hardcoded with fallback only | `lib/api.ts:1` | Production deployments will break |
| No CI/CD pipeline configuration | Root | No automated testing/deployment |

### 1.2 Security Vulnerabilities
| Issue | Location | Impact |
|-------|----------|--------|
| **No CSRF protection** on state-changing operations | `lib/api.ts`, all forms | Cross-site request forgery attacks |
| **No rate limiting** on auth endpoints | `api.ts` login/register | Brute force, credential stuffing |
| **No input sanitization** on user-generated content | `components/ReviewSection.tsx`, booking forms | XSS via reviews, messages |
| **Tokens stored in localStorage only** | `lib/api.ts:4-13` | Vulnerable to XSS token theft |
| **No Content Security Policy headers** | `next.config.ts` | XSS, injection attacks |

### 1.3 Authentication & Session Management
| Issue | Location | Impact |
|-------|----------|--------|
| No refresh token rotation | `lib/api.ts:91-95` | Token replay attacks |
| No session invalidation on password change | `AuthContext.tsx` | Stale sessions after credential rotation |
| `refreshUser()` called excessively | Multiple dashboards | Unnecessary API load |
| No "remember me" / long-lived sessions | Auth flow | Poor UX for returning users |

### 1.4 Data Integrity & Validation
| Issue | Location | Impact |
|-------|----------|--------|
| **No Zod/valibot schemas** for API requests | `lib/api.ts` | Backend receives invalid data |
| No client-side form validation library | All forms | Inconsistent validation, duplication |
| `any` types used extensively | Throughout codebase | Type safety lost, runtime errors |
| No optimistic updates with rollback | Dashboard mutations | Poor perceived performance |

---

## 2. High-Priority Functional Gaps (P1 — Core Features Missing)

### 2.1 Lawyer Onboarding & Verification (Per Business Model)
| Missing Feature | Business Impact |
|-----------------|-----------------|
| **Document upload for verification** | Lawyers cannot submit SCN, bar certificates — blocks verification flow |
| **Verification status tracking UI** | Lawyers don't know what's pending/required |
| **Automated verification reminders** | Admin burden, lawyer frustration |
| **Re-verification workflow** | Annual bar renewal not handled |

### 2.2 Subscription & Monetization (Revenue Critical)
| Missing Feature | Business Impact |
|-----------------|-----------------|
| **Stripe/Paystack subscription integration** | Cannot collect recurring SaaS revenue |
| **Plan upgrade/downgrade UI** | Lawyers stuck on wrong tier |
| **Usage-based limit enforcement** | Premium features accessible to all |
| **Invoice generation & history** | No billing transparency |
| **Trial period management** | No conversion funnel |

### 2.3 Lead Management (Pay-Per-Lead Model)
| Missing Feature | Business Impact |
|-----------------|-----------------|
| **Lead payment flow (₦X fixed fee)** | Core revenue model not implemented |
| **Lead preview before payment** | Lawyers pay blindly |
| **Lead dispute/refund process** | No protection for bad leads |
| **Lead analytics for lawyers** | Cannot optimize spend |

### 2.4 Featured Listings (Advertising Revenue)
| Missing Feature | Business Impact |
|-----------------|-----------------|
| **Purchase featured placement UI** | Advertising revenue stream blocked |
| **Campaign duration tracking** | Manual admin work required |
| **Sponsored badge display** | Not visible in search results |
| **Performance metrics for ads** | Lawyers can't measure ROI |

### 2.5 Consultation Infrastructure
| Missing Feature | Business Impact |
|-----------------|-----------------|
| **Video consultation integration (Zoom/Meet/Built-in)** | Core product value not delivered |
| **Calendar sync (Google/Outlook)** | Double-booking, no-shows |
| **Automated reminders (email/SMS)** | High no-show rate expected |
| **Recording & transcript storage** | Premium feature missing |

---

## 3. User Experience Issues (P2 — Significant UX Debt)

### 3.1 Navigation & Information Architecture
| Issue | Evidence | Recommendation |
|-------|----------|----------------|
| **Inconsistent sidebar ordering** | Lawyer: Profile→Dashboard→Enquiries; Client: Profile→Dashboard→Enquiries | Standardize: Dashboard first, then functional sections |
| **No breadcrumbs** | Deep pages (booking wizard, lawyer detail) | Add breadcrumb component |
| **Mobile sidebar UX broken** | Backdrop click closes but no swipe gesture | Add swipe-to-close, fix z-index issues |
| **No global search** | Users must navigate to `/lawyers` | Add cmd+k search with lawyer/content results |

### 3.2 Onboarding & First-Time Experience
| Issue | Evidence | Recommendation |
|-------|----------|----------------|
| **No role-based onboarding flow** | Register page has role selector but no guided setup | Multi-step wizard: Client → needs assessment; Lawyer → profile completion |
| **Empty states lack guidance** | "No enquiries yet" with no CTA | Add illustrated empty states with primary actions |
| **No tooltips/feature discovery** | Complex features (wallet, payouts) unexplained | Add onboarding tooltips, feature tours |
| **Verification requirements unclear** | Lawyer profile shows "pending" but not what's needed | Show checklist of required documents |

### 3.3 Form & Interaction Design
| Issue | Evidence | Recommendation |
|-------|----------|----------------|
| **Inconsistent form patterns** | Some forms use controlled inputs, others uncontrolled | Standardize on React Hook Form + Zod |
| **No auto-save on long forms** | Lawyer profile has 20+ fields | Implement auto-save with debounce |
| **Password requirements only on register** | No strength meter on change password | Reuse password strength component |
| **Date picker is custom calendar** | `book/[lawyerId]/page.tsx:394-426` | Use established library (react-day-picker) |

### 3.4 Feedback & Error Handling
| Issue | Evidence | Recommendation |
|-------|----------|----------------|
| **Toast notifications missing** | Uses `alert()` everywhere | Implement toast system (sonner/react-hot-toast) |
| **No loading skeletons** | Spinners only, no content placeholders | Add skeleton loaders for lists/cards |
| **Generic error messages** | "Failed to update profile" | Context-specific errors with retry actions |
| **No offline detection** | Network errors silent | Add online/offline banner |

### 3.5 Accessibility (a11y)
| Issue | Evidence | WCAG Violation |
|-------|----------|----------------|
| **No skip-to-main-content link** | All layouts | 2.4.1 Bypass Blocks |
| **Color contrast issues** | `#667085` on `#F5F7FA` = 4.1:1 (needs 4.5:1) | 1.4.3 Contrast |
| **Missing ARIA labels** | Icon-only buttons, dropdowns | 4.1.2 Name, Role, Value |
| **Focus management broken** | Modals don't trap focus, sidebar doesn't restore focus | 2.4.3 Focus Order |
| **Form labels not associated** | Some inputs lack `<label for>` | 1.3.1 Info & Relationships |

---

## 4. Code Quality & Maintainability (P3 — Technical Debt)

### 4.1 Type Safety
```typescript
// Current: 127 occurrences of `any` type in api.ts alone
getLawyers(params?: Record<string, string>) { ... }
createLead(data: any) { ... }

// Recommended: Strict typing
interface LawyerFilters { name?: string; practiceArea?: string; ... }
interface CreateLeadDTO { lawyerId: string; enquiryMessage: string; ... }
```

### 4.2 Component Architecture
| Issue | Example | Fix |
|-------|---------|-----|
| **Massive page components** | `LawyerDashboard.tsx` = 254 lines, `AdminDashboard.tsx` = 379 lines | Extract sections into feature components |
| **Business logic in components** | `handleRespond`, `fetchLeads` in dashboard | Move to custom hooks (`useLeads`, `useAppointments`) |
| **Duplicate sidebar implementations** | 3 nearly identical Sidebar components | Create reusable `AppSidebar` with config |
| **No component library** | Raw HTML/CSS everywhere | Build design system (Button, Input, Card, Modal, etc.) |

### 4.3 State Management
| Issue | Evidence | Recommendation |
|-------|----------|----------------|
| **Prop drilling** | `user`, `profile` passed through many layers | Use context selectively or Zustand |
| **No server state management** | Manual `useEffect` + `useState` for all data | Adopt TanStack Query (React Query) |
| **Optimistic updates missing** | All mutations wait for server response | Implement with React Query mutations |

### 4.4 Testing & Quality Gates
| Missing | Impact |
|---------|--------|
| Unit tests (0% coverage) | Regression risk on refactor |
| Integration tests | API contract breaks undetected |
| E2E tests (Playwright/Cypress) | Critical user flows untested |
| Visual regression tests | UI inconsistencies accumulate |
| Pre-commit hooks (Husky) | Linting/formatting not enforced |

---

## 5. Performance Issues

| Issue | Location | Impact |
|-------|----------|--------|
| **No code splitting** | All dashboards load together | Large initial JS bundle |
| **No image optimization** | `next/image` used but no sizes/placeholder | Layout shift, slow loads |
| **Excessive re-renders** | `AuthContext` refreshes on every nav | Dashboard metrics flicker |
| **No pagination** | Lawyer list, transactions load all | Memory issues with scale |
| **No caching strategy** | `fetchLawyers` called on every filter change | Unnecessary API calls |
| **Bundle analysis missing** | No `next-bundle-analyzer` | Unknown bundle size |

---

## 6. Missing Platform Features (Per Business Model)

### 6.1 Client Features
- [ ] **Saved lawyers / favorites**
- [ ] **Consultation history with documents**
- [ ] **Legal document templates/library**
- [ ] **Pro bono matching system**
- [ ] **Multi-language support**
- [ ] **Referral program**

### 6.2 Lawyer Features
- [ ] **Team/firm management (Premium)**
- [ ] **Client CRM with notes/tags**
- [ ] **Document automation/templates**
- [ ] **Time tracking & billing**
- [ ] **Conflict checking**
- [ ] **CPD/learning tracking**

### 6.3 Admin Features
- [ ] **Content moderation queue**
- [ ] **Dispute resolution workflow**
- [ ] **Automated compliance reports**
- [ ] **Audit logging**
- [ ] **Feature flags / gradual rollout**

### 6.4 Platform Features
- [ ] **Email notification system** (SendGrid/Resend)
- [ ] **SMS notifications** (Twilio/Termii)
- [ ] **Webhook system** for integrations
- [ ] **API for third-party access**
- [ ] **Multi-region deployment**

---

## 7. Data & Analytics Gaps

| Missing | Business Need |
|---------|---------------|
| **Event tracking** (PostHog/Mixpanel) | Understand user behavior, funnel drops |
| **Conversion funnels** | Register → Verify → Book → Pay → Review |
| **Lawyer acquisition metrics** | CAC, LTV by channel |
| **Revenue dashboards** | MRR, churn, expansion revenue |
| **Search analytics** | What clients search for vs. what exists |

---

## 8. DevOps & Infrastructure

| Missing | Risk |
|---------|------|
| **Staging environment** | No safe deployment validation |
| **Database migrations** | Schema changes break production |
| **Backup/restore strategy** | Data loss risk |
| **Monitoring/alerting** (Sentry, Datadog) | Issues detected by users |
| **Log aggregation** | Debugging production issues |
| **Secret management** | Credentials in repo/environment |

---

## Prioritized Action Plan

### Phase 1: Foundation (Weeks 1-3) — **P0 + Critical P1**
| Task | Effort | Owner |
|------|--------|-------|
| Add `.env.example`, Dockerfile, CI/CD | M | DevOps |
| Implement CSRF, rate limiting, CSP | M | Backend |
| Add Zod schemas for all API endpoints | L | Full-stack |
| Replace `any` types with strict interfaces | L | Frontend |
| Set up React Query for server state | M | Frontend |
| Implement toast notification system | S | Frontend |
| Add authentication security (refresh rotation, HttpOnly cookies) | M | Backend |

### Phase 2: Core Revenue Features (Weeks 4-8) — **P1 Monetization**
| Task | Effort | Owner |
|------|--------|-------|
| Stripe/Paystack subscription integration | L | Full-stack |
| Lawyer verification document upload | L | Full-stack |
| Pay-per-lead payment flow | M | Full-stack |
| Featured listings purchase & display | M | Full-stack |
| Plan upgrade/downgrade UI | M | Frontend |
| Invoice generation & billing history | M | Backend |

### Phase 3: Consultation Delivery (Weeks 9-12) — **P1 Core Product**
| Task | Effort | Owner |
|------|--------|-------|
| Video consultation integration (Daily.co/Zoom SDK) | L | Full-stack |
| Calendar sync (Google/Outlook) | M | Backend |
| Automated reminders (email + SMS) | M | Backend |
| Meeting recording/transcript storage (Premium) | L | Full-stack |

### Phase 4: UX Polish & Accessibility (Weeks 13-16) — **P2 + P3**
| Task | Effort | Owner |
|------|--------|-------|
| Design system component library | L | Frontend |
| Role-based onboarding wizards | M | Frontend |
| Accessibility audit & fixes (WCAG 2.1 AA) | M | Frontend |
| Mobile gesture navigation | M | Frontend |
| Global search (cmd+k) | M | Frontend |
| Empty states with illustrations | S | Design + Frontend |

### Phase 5: Scale & Observability (Weeks 17-20) — **P3 + DevOps**
| Task | Effort | Owner |
|------|--------|-------|
| Event analytics (PostHog) | M | Full-stack |
| E2E test suite (Playwright) | L | QA |
| Monitoring/alerting (Sentry) | M | DevOps |
| Staging environment + preview deployments | M | DevOps |
| Database migration system | M | Backend |

---

## Quick Wins (Can Do This Week)

1. **Add `.env.example`** — Document all required env vars
2. **Replace `alert()` with toast library** — 1-hour fix, huge UX improvement
3. **Add skip-to-content link** — 15 min, accessibility win
4. **Fix color contrast** — Update `#667085` to `#475569` for body text
5. **Add loading skeletons** — Replace spinners on lawyer cards, dashboard stats
6. **Standardize sidebar component** — Extract to shared `AppSidebar` with config
7. **Add breadcrumbs** — `LawyerDetail`, `BookingWizard`, `Admin` pages
8. **Document API types** — Create `types/api.ts` with Zod schemas

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Monetization features delayed** | High | Critical — No revenue | Phase 2 prioritized, consider manual billing interim |
| **Video consultation integration complex** | Medium | High — Core differentiator | Evaluate Daily.co (easier) vs. custom WebRTC |
| **Lawyer verification bottleneck** | High | Medium — Admin overhead | Build self-service document upload + automated checks |
| **Mobile UX drives churn** | Medium | High | Mobile-first testing in Phase 4 |
| **Technical debt slows velocity** | High | Medium | Allocate 20% sprint capacity to refactoring |

---

## Appendix: File Inventory & Ownership

### Key Files by Domain

| Domain | Files | Lines (approx) |
|--------|-------|----------------|
| **Authentication** | `AuthContext.tsx`, `api.ts` (auth section) | 200 |
| **Lawyer Dashboard** | `dashboard/lawyer/page.tsx`, `components/lawyer/Sidebar.tsx` | 300 |
| **Client Dashboard** | `dashboard/client/page.tsx`, `components/client/Sidebar.tsx` | 220 |
| **Admin Dashboard** | `admin/page.tsx`, `components/admin/*` | 600 |
| **Lawyer Marketplace** | `lawyers/page.tsx`, `lawyers/[id]/page.tsx` | 350 |
| **Booking Flow** | `book/[lawyerId]/page.tsx` | 720 |
| **Admin Config** | `components/admin/MembershipConfiguration.tsx` | 210 |
| **API Layer** | `lib/api.ts` | 470 |
| **Registration** | `(auth)/register/page.tsx` | 440 |

---

## Conclusion

AdvisoryConnect has a **strong structural foundation** with clean Next.js App Router architecture, proper role-based routing, and a comprehensive API layer. However, it is **not production-ready** due to:

1. **Security gaps** (CSRF, rate limiting, token storage)
2. **Missing revenue features** (subscriptions, pay-per-lead, featured listings)
3. **Incomplete core product** (video consultations, calendar sync)
4. **Significant UX debt** (accessibility, empty states, onboarding)
5. **Technical debt** (type safety, testing, component architecture)

**Recommendation:** Follow the phased plan above. Prioritize Phase 1 (Foundation) and Phase 2 (Monetization) to reach a **Minimum Viable Product that can generate revenue**, then iterate on UX and advanced features.

The codebase is **well-organized enough** that a focused team of 2-3 engineers can execute this plan in 4-5 months.