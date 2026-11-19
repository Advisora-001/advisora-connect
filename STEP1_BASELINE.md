# Step 1 Baseline — Multi-Professional Membership Framework

## Overview

Established baseline inventory and compatibility map for the existing lawyer-centric platform before introducing profession-neutral domain contracts (Step 2+).

**Source of truth:** This repository checkout (commit c63b601 on main).


### User (`server/src/models/User.ts`)
| Field | Type | Notes |
|-------|------|-------|
| email | String | unique, required |
| password | String | required, select: false |
| firstName, lastName | String | required |
| phone | String | optional |
| avatar | String | optional |
| role | `'client' \| 'lawyer' \| 'admin'` | default 'client' |
| isVerified | Boolean | default false |
| isActive | Boolean | default true |
| termsAccepted, policiesAccepted | Boolean | default false |
| enquiryCount | Number | default 0 |
| lastEnquiryDate | Date | optional |
| refreshToken | String | select: false |
| emailVerificationToken/Expires | String/Date | optional |
| passwordResetToken/Expires | String/Date | optional |

**Profession awareness:** None. Role is binary (client/lawyer/admin). No category/specialization fields.
## 1. Server Model Inventory

### LawyerProfile (`server/src/models/LawyerProfile.ts`)
| Field | Type | Notes |
|-------|------|-------|
| userId | ObjectId → User | unique, required |
| barNumber, stateOfCall, yearOfCall | String/Number | legal-specific |
| practiceAreas | String[] | legal-specific |
| bio, officeAddress, city, state | String | |
| languages, yearsOfExperience | String[]/Number | |
| verificationStatus | `'pending' \| 'verified' \| 'rejected'` | default 'pending' |
| verificationBadge, verificationDocs | Boolean/String[] | |
| subscription | `{ plan, status, startDate, endDate }` | plan: basic/professional/premium |
| featuredListing | `{ isActive, startDate, endDate }` | |
| rating, reviewCount | Number | |
| consultationFee | Number | default 0 |
| isAvailable, availableDays, availableHours | Boolean/String[]/String | |
| onboardingAgreementAccepted | Boolean | default false |
| accountName, accountNumber, bankName | String | payout details |
| services | `{ name, duration, price, type }[]` | type: video/audio/in-person |
| requireApproval | Boolean | default true |
| declaration | `{ informationAccurate, qualifiedToPractise, noDisciplinaryAction, declaredAt }` | |

**Profession awareness:** Fully legal-specific (barNumber, stateOfCall, declaration, etc.)

### Subscription (`server/src/models/Subscription.ts`)
| Field | Type | Notes |
|-------|------|-------|
| userId | ObjectId → User | required |
| plan | `'basic' \| 'professional' \| 'premium'` | required |
| status | `'active' \| 'expired' \| 'cancelled'` | default 'active' |
| startDate, endDate | Date | required |
| autoRenew | Boolean | default true |
| paystackRef | String | optional |
| amount | Number | required |

**Profession awareness:** User-owned, not firm-owned. No category neutrality.

### PaymentRecord (`server/src/models/PaymentRecord.ts`)
| Field | Type | Notes |
|-------|------|-------|
| userId | ObjectId → User | required |
| appointmentId | ObjectId → Appointment | required |
| lawyerId | ObjectId → LawyerProfile | required |
| clientId | ObjectId → User | required |
| amount, platformFee, lawyerAmount | Number | required |
| paystackRef | String | required |
| status | `'pending' \| 'completed' \| 'failed' \| 'refunded'` | default 'pending' |

**Profession awareness:** lawyerId references LawyerProfile specifically.

### Appointment (`server/src/models/Appointment.ts`)
| Field | Type | Notes |
|-------|------|-------|
| lawyerId | ObjectId → LawyerProfile | required |
| clientId | ObjectId → User | required |
| leadId | ObjectId → Lead | optional |
| date, timeSlot, duration | Date/String/Number | |
| status | `'pending' \| 'confirmed' \| 'completed' \| 'cancelled'` | |
| consultationType | `'video' \| 'physical' \| 'phone'` | |
| meetingLink, notes | String | optional |
| consultationFee, platformFee, totalAmount | Number | |
| paymentRef, paymentStatus | String/`'unpaid' \| 'paid' \| 'failed'` | |

### Lead (`server/src/models/Lead.ts`)
| Field | Type | Notes |
|-------|------|-------|
| lawyerId | ObjectId → LawyerProfile | required |
| clientId | ObjectId → User | required |
| status | `'pending' \| 'accepted' \| 'declined' \| 'booked' \| 'closed' \| 'expired'` | |
| enquiryMessage | String | required, max 500 |
| leadFee, platformFee | Number | |
| paymentRef, paymentStatus | String/`'unpaid' \| 'paid' \| 'failed'` | |
| clientName, clientEmail, clientPhone | String | |
| bookingContext | `{ service, date, timeSlot, duration, consultationType }` | |


## 2. Server API Route Inventory

### Auth Routes (`/api/auth/*`)
| Method | Path | Controller | Lawyer-only? |
|--------|------|------------|--------------|
| POST | /register | register | No (role param) |
| POST | /login | login | No |
| POST | /refresh | refresh | No |
| GET | /me | getMe | No |
| PUT | /profile | updateProfile | No |
| GET | /verify-email | verifyEmail | No |
| GET | /verify-email/:token | verifyEmail | No |
| POST | /resend-verification | resendVerification | No |
| POST | /forgot-password | forgotPassword | No |
| POST | /reset-password | resetPassword | No |
| POST | /logout | protect+logout | No |
| POST | /test-email | testEmail | No |

**Registration behavior:** Creates User; if role === 'lawyer', creates LawyerProfile placeholder. Returns `_id`, `email`, `firstName`, `lastName`, `role`.

### Lawyer Routes (`/api/lawyers/*`)
| Method | Path | Controller | Lawyer-only? |
|--------|------|------------|--------------|
| GET | / | getLawyers | No (public directory) |
| GET | /list | getLawyersList | No |
| GET | /:id/availability | protect+getAvailability | No |
| GET | /:id | protect+getLawyerById | No |
| PUT | /profile | protect+authorize('lawyer')+updateProfile | **YES** |
| POST | /verify | protect+authorize('lawyer')+submitVerification | **YES** |
| POST | /verify-upload | protect+authorize('lawyer')+uploadVerificationDocs | **YES** |
| POST | /onboarding/accept | protect+authorize('lawyer')+acceptOnboardingAgreement | **YES** |
| POST | /declaration | protect+authorize('lawyer')+submitDeclaration | **YES** |
| POST | /upload-photo | protect+authorize('lawyer')+uploadPhoto | **YES** |
| GET | /wallet | protect+authorize('lawyer')+getWallet | **YES** |
| POST | /wallet/payout-request | protect+authorize('lawyer')+requestPayout | **YES** |

### Appointment Routes (`/api/appointments/*`)
| Method | Path | Controller | Lawyer-only? |
|--------|------|------------|--------------|
| GET | /my-appointments | protect+authorize('client') | Client-only |
| GET | /lawyer-appointments | protect+authorize('lawyer') | **YES** |
| PUT | /:id/cancel | protect+cancelAppointment | No |
| POST | /:id/generate-meeting | protect+authorize('lawyer') | **YES** |
| PUT | /:id/meeting-link | protect+authorize('lawyer') | **YES** |
| PUT | /:id/complete | protect+authorize('lawyer') | **YES** |

### Lead Routes (`/api/leads/*`)
| Method | Path | Controller | Lawyer-only? |
|--------|------|------------|--------------|
| POST | /book-request | protect+authorize('client') | Client-only |
| POST | / | protect+authorize('client')+createLead | Client-only |
| PUT | /:id/respond | protect+authorize('lawyer')+respondToLead | **YES** |
| POST | /:id/book | protect+authorize('client')+bookConsultation | Client-only |
| GET | / | protect+authorize('lawyer')+getLeads | **YES** |
| GET | /my-enquiries | protect+authorize('client')+getMyEnquiries | Client-only |

### Payment Routes (`/api/payments/*`)
| Method | Path | Controller | Lawyer-only? |
|--------|------|------------|--------------|
| POST | /initialize | protect+initializePayment | No |
| POST | /verify | protect+verifyPayment | No |
| POST | /webhook | handleWebhook | No (internal) |

**Webhook handles:** subscription (updates Subscription + LawyerProfile.subscription), lead payment, featuredListing (updates LawyerProfile), consultation payment (updates Appointment + creates PaymentRecord).

### Other Routes
- `/api/notifications/*` — get, mark-read
- `/api/documents/*` — upload, list, share
- `/api/blog/*` — public + admin CRUD
- `/api/legal/*` — public documents + acceptances + admin CRUD

### Admin Routes (`/api/admin/*`)
| Method | Path | Controller | Lawyer-only? |
|--------|------|------------|--------------|
| GET | /lawyers/pending | getPendingVerifications | Admin-only |
| PUT | /lawyers/:id/verify | verifyLawyer | Admin-only |
| GET | /lawyers/:id | getLawyerProfile | Admin-only |
| GET | /users | getUsers | Admin-only |
| PUT | /users/:id/toggle-status | toggleUserStatus | Admin-only |
| GET | /analytics | getAnalytics | Admin-only |
| GET | /revenue | getRevenue | Admin-only |
| GET | /payouts | getPayouts | Admin-only |
| PUT | /payouts/:id | processPayout | Admin-only |

## 3. Lawyer-Only Call-Site Map (Client Side)

### Pages requiring `authorize('lawyer')` on server:
- `PUT /api/lawyers/profile` — profile editing
- `POST /api/lawyers/verify` — verification submission
- `POST /api/lawyers/verify-upload` — document upload
- `POST /api/lawyers/onboarding/accept` — onboarding agreement
- `POST /api/lawyers/declaration` — professional declaration
- `POST /api/lawyers/upload-photo` — photo upload
- `GET /api/lawyers/wallet` — wallet view
- `POST /api/lawyers/wallet/payout-request` — payout request
- `GET /api/appointments/lawyer-appointments` — lawyer appointments
- `POST /api/appointments/:id/generate-meeting` — meeting link
- `PUT /api/appointments/:id/meeting-link` — set meeting link
- `PUT /api/appointments/:id/complete` — complete appointment
- `PUT /api/leads/:id/respond` — respond to enquiry
- `GET /api/leads/` — get leads

### Client pages/components that are lawyer-specific:
- `client/src/app/dashboard/lawyer/page.tsx` — lawyer dashboard
- `client/src/components/lawyer/Sidebar.tsx` — lawyer sidebar
- `client/src/app/book/[lawyerId]/page.tsx` — booking wizard (client-side, but lawyer-context)
- `client/src/app/lawyers/[id]/page.tsx` — lawyer profile detail
- `client/src/app/admin/page.tsx` — admin lawyer verification (admin, not lawyer)

### AuthContext profile shape:
```ts
interface AuthContextType {
  user: User | null;
  profile: any;
  loading: boolean;
  login/register/logout/refreshUser: functions;
}
```

## 4. Lawyer-Centric Data Relationships

```
User (1) ──┬── LawyerProfile (1)  [unique userId]
           │
           ├─ Subscription (many, userId)
           ├─ Appointment (many, clientId)  
           ├─ Lead (many, clientId)
           ├─ Review (many, clientId)
           └─ PaymentRecord (many, userId/clientId)

LawyerProfile (1) ──┬── Appointment (many, lawyerId)
                    ├─ Lead (many, lawyerId)
                    ├─ Review (many, lawyerId)
                    └─ PaymentRecord (many, lawyerId)
```

**All professional references point to `LawyerProfile`, not to a generic professional profile.** There is no firm, no category, no seat model.

## 5. Paystack Webhook Behavior (Current)

| Event Type | Model Updates |
|------------|---------------|
| `subscription` | Creates/updates `Subscription`; updates `LawyerProfile.subscription` embedded doc |
| `lead` | Updates `Lead.paymentStatus` + `status` |
| `featured` | Updates `LawyerProfile.featuredListing` |
| `consultation` | Updates `Appointment.paymentStatus`/`status`; creates `PaymentRecord` |

**Key observation:** Webhook subscription activation touches only lawyer profiles. No firm, no category neutrality.

## 6. Baseline Build Status

```
npx tsc --noEmit  →  PASS (0 errors)
```

## 7. Reconciliation Metrics (to be populated against staging/production DB)

| Entity | Count (staging) | Count (production) | Notes |
|--------|-----------------|--------------------|-------|
| Users (client) | TBD | TBD | |
| Users (lawyer) | TBD | TBD | |
| Users (admin) | TBD | TBD | |
| LawyerProfiles | TBD | TBD | Should match lawyer users |
| Subscriptions (active) | TBD | TBD | |
| Subscriptions (expired) | TBD | TBD | |
| Appointments | TBD | TBD | |
| Leads | TBD | TBD | |
| Reviews | TBD | TBD | |
| PaymentRecords | TBD | TBD | |
| Duplicate lawyer profiles (same userId) | TBD | TBD | Should be 0 |

## 8. Compatibility Gaps (to be addressed in Steps 2–11)

| Gap | Current State | Target State |
|-----|--------------|--------------|
| Professional categories | Role = 'lawyer' only | Admin-configurable categories (legal, accounting, tax, etc.) |
| Profile model | LawyerProfile only | Category-neutral ProfessionalProfile + legacy adapter |
| Subscription ownership | User-only | Individual or firm-owned |
| Firm/workspace | Absent | Firm with admin + member seats |
| Entitlements | Embedded in LawyerProfile.subscription | Shared Basic/Premium entitlement resolver |
| Category config | None | Admin-managed categories, specializations, verification |
| Service engagement | None (enquiry→appointment) | Separate engagement lifecycle |
| Platform fees | Hardcoded `PLATFORM_FEE_AMOUNT` | Configurable by transaction type |
| Premium pricing | Not configurable | Admin-activated only |
| Webhook idempotency | Not explicit | Required |
| Duplicate listing prevention | None | One canonical listing per person |

## 9. Migration / Cutover Strategy (Outline)

1. **Phase A (read-only):** Add new models alongside existing; no writes to new models from client.
2. **Phase B (dual write):** New registrations create both legacy LawyerProfile and new ProfessionalProfile (legal category).
3. **Phase C (migration):** Idempotent script maps existing LawyerProfile → ProfessionalProfile (category=legal).
4. **Phase D (cutover):** Redirect lawyer-specific URLs to new professional profile routes; retain legacy as fallback.
5. **Phase E (cleanup):** Remove legacy-only code paths after verification.

**Rollback path:** Legacy models and routes remain intact until Step 10 verification passes.

## Step 1 Exit Check

- [x] Complete model inventory documented
- [x] Complete API route inventory documented (including lawyer-only endpoints)
- [x] Client-side lawyer call-sites identified
- [x] Data relationships mapped
- [x] Paystack webhook behavior documented
- [x] Build passes with 0 TypeScript errors
- [ ] Reconciliation metrics populated against staging DB (pending DB access)
- [x] Migration/cutover strategy documented above

**Ready for Step 2: Define profession-neutral domain contracts.**

---

## Step 2 — Profession-Neutral Domain Contracts (COMPLETED)

### New Models Created

| Model | File | Purpose |
|-------|------|---------|
| `ProfessionalCategory` | `server/src/models/ProfessionalCategory.ts` | Admin-configurable categories with labels, specializations, registration fields, verification requirements, service types, consultation modes |
| `Plan` | `server/src/models/Plan.ts` | Basic/Premium plan catalog with entitlements, limits, individual/firm pricing, billing intervals |
| `ProfessionalProfile` | `server/src/models/ProfessionalProfile.ts` | Category-neutral profile keyed to user + category, with `legacyLawyerProfileId` for migration compatibility and `categoryData` for category-specific answers |
| `Firm` | `server/src/models/Firm.ts` | Firm workspace with admin, contact info, subscription link, status |
| `FirmMember` | `server/src/models/FirmMember.ts` | Firm membership with owner/admin/member roles, invite tokens, acceptance tracking |
| `ServiceEngagement` | `server/src/models/ServiceEngagement.ts` | Separate engagement lifecycle (offered → accepted → active → completed → cancelled) distinct from enquiries and subscriptions |
| `PlatformFeePolicy` | `server/src/models/PlatformFeePolicy.ts` | Configurable fixed/percentage platform fees by transaction type |

### Key Design Decisions

1. **`ProfessionalProfile.userId` is unique** — one profile per user, preventing duplicate listings
2. **`ProfessionalProfile.category` references `ProfessionalCategory`** — profession-neutral, no hardcoded legal-only fields
3. **`ProfessionalProfile.legacyLawyerProfileId`** — controlled reference to legacy `LawyerProfile` for migration
4. **`ProfessionalProfile.categoryData`** (`Schema.Types.Mixed`) — stores category-specific answers validated against category configuration
5. **`Plan.isFree`** — Basic is free (`isFree: true`); Premium starts as inactive/not purchasable
6. **`Plan.firmPrice` and `Plan.includedSeats`** — firm-level pricing with seat bundles
7. **`ServiceEngagement` is independent** of enquiries and subscriptions — an enquiry alone does not imply an engagement
8. **`PlatformFeePolicy.transactionType`** — separate fees for consultation/enquiry/engagement/subscription, never mixed with subscription pricing

### TypeScript Verification

- Client: `npx tsc --noEmit` → PASS (0 errors)
- Server: `npx tsc --noEmit` → PASS (0 errors)

### Step 2 Exit Check

- [x] Schemas represent a new category without profession-specific subscription code
- [x] Schemas represent a new plan without profession-specific subscription code
- [x] `ProfessionalProfile` is category-neutral (keyed to `ProfessionalCategory`, not hardcoded to legal)
- [x] Legacy lawyer reference via `legacyLawyerProfileId` for migration compatibility
- [x] Basic plan invariant (`isFree: true`) represented in schema
- [x] Premium not purchasable until configured (`isActive: false` default, no price enforcement yet — enforced at API layer in later steps)

**Note:** API-level invariant enforcement (Basic always free, Premium requires admin activation) will be implemented in Step 7 (subscription generalization) and Step 9 (admin configuration). The domain contracts (schemas) are defined in Step 2.

**Ready for Step 3: Add category configuration and professional onboarding.**

---

## Step 3 — Category Configuration and Professional Onboarding (COMPLETED)

### What was done

1. **Category seeding** (`server/src/seed.ts`)
   - Seeded `legal`, `accounting`, and `tax` categories with labels, specializations, registration fields, verification requirements, service types, and consultation modes
   - Seeded `basic` (free, active) and `premium` (inactive, not purchasable) plans
   - Categories and plans are idempotent (skip if already exist)

2. **Category controller** (`server/src/controllers/categoryController.ts`)
   - `GET /api/categories` — public, returns active categories
   - `GET /api/categories/:key` — public, returns single category by key
   - `POST /api/admin/categories` — admin, create category
   - `PUT /api/admin/categories/:id` — admin, update category
   - `DELETE /api/admin/categories/:id` — admin, deactivate category

3. **Category routes** (`server/src/routes/categoryRoutes.ts`)
   - Public GET routes; admin POST/PUT/DELETE routes protected by `protect + authorize('admin')`

4. **Professional profile controller** (`server/src/controllers/professionalProfileController.ts`)
   - `GET /api/professionals` — public directory with filtering by category/specialization/location/availability
   - `GET /api/professionals/:id` — public single profile
   - `PUT /api/professionals/profile` — protected, update own profile with category field validation
   - `POST /api/professionals/verify` — protected, submit verification with category-required docs validation
   - `POST /api/professionals/verify-upload` — protected, upload verification docs
   - `POST /api/professionals/onboarding/accept` — protected, accept onboarding agreement
   - `POST /api/professionals/declaration` — protected, submit professional declaration
   - `POST /api/professionals/upload-photo` — protected, upload photo

5. **Professional profile routes** (`server/src/routes/professionalRoutes.ts`)
   - Public GET routes; protected mutation routes

6. **Registration updated** (`server/src/controllers/authController.ts`)
   - Accepts `category` key in registration body
   - If category provided: validates it exists and is active, creates `ProfessionalProfile`
   - If no category and role === 'lawyer': creates legacy `LawyerProfile` (backward compatibility)
   - Returns 400 for invalid/inactive category keys

7. **Routes registered** (`server/src/index.ts`)
   - `app.use('/api/categories', categoryRoutes)`
   - `app.use('/api/professionals', professionalRoutes)`

### Key Design Decisions
- Category validation at registration: category key must exist and be active
- ProfessionalProfile validation: `categoryData` validated against category's `registrationFields` (required fields enforced)
- Verification docs validated against category's `verificationRequirements.requiredDocs`
- Backward compatibility: legacy lawyer registration (without category) still creates `LawyerProfile`

### TypeScript Verification
- Client: `npx tsc --noEmit` → PASS (0 errors)
- Server: `npx tsc --noEmit` → PASS (0 errors)

### Step 3 Exit Check
- [x] Admin can add/edit/deactivate a category
- [x] New professional can register with a configured category
- [x] New professional can submit configured profile without category-specific code release
- [x] Public read APIs for active categories and onboarding requirements
- [x] Verification upload/review uses configured fields and credential requirements

**Ready for Step 4: Integrate the directory and preserve lawyer workflows.**