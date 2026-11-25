# Phase 2 Implementation Plan: Monetization with Paystack + Cloudinary

**Duration:** 5 Weeks  
**Stack:** Paystack (NGN payments), Cloudinary (uploads), Next.js 15, React Query, Zod  
**Goal:** Implement all 3 revenue streams from business model

---

## Revenue Streams to Implement

| Stream | Description | Business Model Reference |
|--------|-------------|--------------------------|
| **1. Subscriptions (SaaS)** | Basic/Professional/Premium tiers — monthly/yearly | Tiered Subscription Model |
| **2. Pay-Per-Lead** | Fixed fee (₦X) per qualified client enquiry | Fixed Pay-Per-Lead Model |
| **3. Featured Listings** | ₦20,000/30 days — top of search, "Sponsored" badge | Premium Visibility & Featured Listings |

---

## Week 1-2: Paystack Subscription System

### 1.1 Database Schema Updates

```typescript
// server/src/models/Subscription.ts (extend existing)
interface ISubscription extends Document {
  userId: ObjectId;
  professionalProfileId: ObjectId;
  planKey: 'basic' | 'professional' | 'premium';
  status: 'active' | 'cancelled' | 'expired' | 'past_due' | 'trialing';
  billingInterval: 'monthly' | 'yearly';
  paystackSubscriptionCode: string;
  paystackCustomerCode: string;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  metadata: Record<string, unknown>;
}

// server/src/models/Plan.ts (extend)
interface IPlan {
  key: string;
  name: string;
  paystackPlanCode: string; // Created in Paystack Dashboard
  priceMonthly: { amount: number; currency: 'NGN' };
  priceYearly: { amount: number; currency: 'NGN' };
  entitlements: Entitlements;
  limits: Limits;
  firmPriceMonthly: { amount: number; currency: 'NGN' };
  firmPriceYearly: { amount: number; currency: 'NGN' };
  includedSeats: number;
}
```

### 1.2 Paystack Integration (Backend)

**Files to create:**
```
server/src/services/paystack.ts          # Paystack API wrapper
server/src/controllers/subscriptionController.ts
server/src/routes/subscriptionRoutes.ts
server/src/middleware/validatePaystackWebhook.ts
```

**Key endpoints:**
```
POST   /api/subscriptions/create-checkout     # Initialize subscription checkout
POST   /api/subscriptions/verify              # Verify payment, activate subscription
POST   /api/subscriptions/cancel              # Cancel at period end
POST   /api/subscriptions/reactivate          # Reactivate cancelled
GET    /api/subscriptions/current             # Get current subscription
POST   /api/webhooks/paystack                 # Handle subscription events
```

**Paystack Webhook Events to Handle:**
- `subscription.create` → Create local subscription record
- `subscription.activate` → Set status = active
- `subscription.charge.success` → Renew period, update dates
- `subscription.charge.failed` → Set status = past_due, retry logic
- `subscription.cancel` → Set status = cancelled
- `subscription.expiring_cards` → Notify user

### 1.3 Frontend Subscription UI

**New pages/components:**
```
client/src/app/subscription/
  page.tsx                    # Pricing table (3 tiers)
  checkout/page.tsx           # Paystack inline checkout
  success/page.tsx            # Post-payment success
  manage/page.tsx             # Manage subscription (cancel, upgrade, billing)

client/src/components/subscription/
  PricingTable.tsx
  PlanCard.tsx
  SubscriptionStatus.tsx
  UpgradeModal.tsx
  CancelConfirmation.tsx
```

**Integration points:**
- Replace hardcoded `PLATFORM_FEE_AMOUNT` with dynamic plan limits
- Gate premium features (CRM, document storage, team seats) behind `entitlements`
- Show usage meters (enquiries used / limit)

### 1.4 Paystack Configuration

**Dashboard setup:**
1. Create 3 Plans in Paystack → Get `plan_code` for each
2. Set webhook URL: `https://api.advisora.com/api/webhooks/paystack`
3. Enable "Customer Portal" for self-service billing
4. Configure retry rules (3 retries over 7 days)

**Environment variables (Render):**
```
PAYSTACK_SECRET_KEY=sk_live_xxx
PAYSTACK_PUBLIC_KEY=pk_live_xxx
PAYSTACK_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxx
```

---

## Week 2-3: Cloudinary Upload System + Verification Flow

### 2.1 Cloudinary Integration (Backend)

**Files to create:**
```
server/src/services/cloudinary.ts
server/src/controllers/uploadController.ts
server/src/routes/uploadRoutes.ts
```

**Configuration:**
```typescript
// cloudinary.config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Upload presets (create in Cloudinary Dashboard)
const UPLOAD_PRESETS = {
  verification: 'advisora_verification',      // Signed, strict validation
  profile_photo: 'advisora_profile',          // Auto-format, face detection
  document: 'advisora_document',              // PDF, max 10MB
  blog_media: 'advisora_blog',                // Images/videos, auto-optimize
};
```

**Upload endpoints:**
```
POST   /api/uploads/signed-url          # Get signed upload URL (direct to Cloudinary)
POST   /api/uploads/verify              # Verify upload completed
DELETE /api/uploads/:publicId           # Delete upload
```

### 2.2 Verification Document Upload Flow

**Backend verification updates:**
```
server/src/controllers/professionalController.ts
  - POST /api/professionals/verification/start     # Initiate, return upload URLs
  - POST /api/professionals/verification/submit    # Submit after uploads complete
  - GET  /api/professionals/verification/status    # Check status
```

**Document requirements per category (from ProfessionalCategory):**
```typescript
// Legal: bar_certificate, government_id, professional_indemnity_insurance
// Accounting: professional_license, government_id
// Tax: tax_certification, government_id
```

**Cloudinary transformations for verification:**
```typescript
// Auto-optimize, convert to PDF if image, watermark
{
  resource_type: 'auto',
  quality: 'auto:good',
  fetch_format: 'auto',
  flags: 'attachment:advisora-verified',
  eager: [
    { width: 800, height: 800, crop: 'limit' },  // Preview
    { format: 'pdf' }                             // Archive
  ]
}
```

### 2.2 Frontend Verification UI

```
client/src/app/verification/
  page.tsx                    # Step-by-step wizard
  upload/page.tsx             # Drag-drop upload (per document)
  status/page.tsx             # Real-time status tracking

client/src/components/verification/
  DocumentUploadCard.tsx      # Per-document upload with preview
  VerificationProgress.tsx    # Step indicator
  DocumentPreview.tsx         # Cloudinary image/pdf viewer
```

**Upload UX:**
- Direct-to-Cloudinary (signed URLs) — no backend bandwidth
- Real-time progress via Cloudinary upload widget
- Per-document validation (file type, size, required)
- Auto-retry failed uploads

---

## Week 3-4: Pay-Per-Lead System

### 4.1 Lead Payment Flow

**Flow:**
```
Client sends enquiry → Lead created (status: pending, paymentStatus: unpaid)
                      ↓
Lawyer views lead → Sees preview (name, category, snippet)
                      ↓
Lawyer clicks "Unlock for ₦X" → Paystack checkout
                      ↓
Payment verified → Lead status: paid, paymentStatus: paid
                      ↓
Lawyer gets full client details (email, phone, message)
```

### 4.2 Backend Changes

```
server/src/controllers/leadController.ts
  - POST /api/leads/:id/unlock           # Initiate payment
  - POST /api/leads/:id/verify-payment   # Verify, unlock details
  - GET  /api/leads/unlocked             # Lawyer's unlocked leads

server/src/models/Lead.ts (extend)
  - leadFee: number
  - paymentStatus: 'unpaid' | 'paid' | 'refunded'
  - paystackReference: string
  - unlockedAt: Date
```

**Paystack Integration:**
- Single charge (not subscription) — `initializePayment` with `amount = leadFee`
- Metadata: `{ type: 'lead_unlock', leadId, lawyerId }`
- Webhook: `charge.success` → unlock lead, notify lawyer

### 4.3 Frontend Lead Payment

```
client/src/components/leads/
  LeadCard.tsx                  # Preview + "Unlock" button
  LeadUnlockModal.tsx           # Paystack inline checkout
  UnlockedLeadDetails.tsx       # Full client details (after payment)
```

**Lead Card States:**
| State | UI |
|-------|-----|
| Unpaid | "Unlock for ₦X" button |
| Paid | Full details visible |
| Refunded | "Refunded" badge, details hidden |

### 4.3 Lead Fee Configuration

```typescript
// Platform fee policy (admin configurable)
{
  transactionType: 'enquiry',
  feeType: 'fixed',
  fixedAmount: 10000,  // ₦10,000
  isActive: true
}
```

---

## Week 4-5: Featured Listings

### 5.1 Featured Listing Purchase

**Flow:**
```
Lawyer clicks "Promote Profile" → Select duration (30 days default)
                              → Paystack checkout (₦20,000)
                              → Payment verified
                              → featuredListing: { isActive: true, startDate, endDate }
                              → Appears at top of search with "Sponsored" badge
```

### 5.2 Backend

```
server/src/controllers/featuredController.ts
  - POST /api/featured/purchase          # Initiate checkout
  - POST /api/featured/verify            # Activate featured
  - GET  /api/featured/status            # Check current featured status

server/src/models/ProfessionalProfile.ts (extend)
  - featuredListing: {
      isActive: boolean,
      startDate: Date,
      endDate: Date,
      paystackReference: string
    }
```

**Search query update:**
```typescript
// In professionals search
const featured = await ProfessionalProfile.find({ 
  'featuredListing.isActive': true, 
  'featuredListing.endDate': { $gte: new Date() } 
}).sort({ 'featuredListing.startDate': -1 });

// Then regular professionals
```

### 5.3 Frontend

```
client/src/components/featured/
  FeaturedBanner.tsx            # Top-of-search sponsored card
  PurchaseModal.tsx             # Duration selector + Paystack
  FeaturedBadge.tsx             # "Sponsored" label
```

**Admin oversight:**
```
client/src/components/admin/FeaturedListings.tsx
  - List all featured, filter by status
  - Manual expire/extend
  - Revenue report
```

---

## Shared Infrastructure

### Paystack Service (`server/src/services/paystack.ts`)

```typescript
class PaystackService {
  // Subscriptions
  async createSubscriptionPlan(plan: Plan): Promise<PaystackPlan>
  async createSubscription(email: string, planCode: string): Promise<PaystackSubscription>
  async cancelSubscription(subscriptionCode: string): Promise<void>
  
  // Transactions
  async initializeTransaction(params: InitializeParams): Promise<InitResponse>
  async verifyTransaction(reference: string): Promise<VerifyResponse>
  async chargeAuthorization(authCode: string, amount: number): Promise<ChargeResponse>
  
  // Customers
  async createCustomer(email: string, metadata: object): Promise<PaystackCustomer>
  async updateCustomer(customerCode: string, data: object): Promise<void>
  
  // Webhooks
  verifyWebhookSignature(payload: string, signature: string): boolean
}
```

### Cloudinary Service (`server/src/services/cloudinary.ts`)

```typescript
class CloudinaryService {
  async getSignedUploadUrl(preset: string, folder: string): Promise<SignedUrlResponse>
  async verifyUpload(publicId: string): Promise<UploadVerification>
  async deleteUpload(publicId: string): Promise<void>
  async getOptimizedUrl(publicId: string, transformations: Transformation[]): string
}
```

---

## Database Migration Checklist

- [ ] Add `paystackCustomerCode`, `paystackSubscriptionCode` to Subscription
- [ ] Add `paystackPlanCode` to Plan
- [ ] Add `leadFee`, `paymentStatus`, `paystackReference`, `unlockedAt` to Lead
- [ ] Add `featuredListing` object to ProfessionalProfile
- [ ] Add `paystackSubscriptionCode`, `paystackCustomerCode` to User (for customers)
- [ ] Create indexes for webhook lookups (`paystackReference`, `paystackSubscriptionCode`)

---

## Testing Checklist

| Feature | Test Cases |
|---------|------------|
| **Subscription** | Create, verify, cancel, reactivate, upgrade/downgrade, webhook retry |
| **Verification Upload** | Valid/invalid files, size limits, per-category requirements, progress |
| **Pay-Per-Lead** | Unlock, verify, refund, duplicate prevention, lawyer/client notifications |
| **Featured** | Purchase, expiry, search ranking, badge display, admin expire |
| **Webhooks** | Retry logic, idempotency, signature verification |

---

## Environment Variables Summary

**Backend (Render):**
```
PAYSTACK_SECRET_KEY=
PAYSTACK_WEBHOOK_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

**Frontend (Vercel):**
```
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

---

## Deployment Notes

1. **Deploy backend first** — webhooks need live URL
2. **Configure Paystack webhook** → Test with `ngrok` locally first
3. **Create Cloudinary upload presets** → Test signed URLs
4. **Deploy frontend** → Verify Paystack inline checkout loads
5. **End-to-end test** — Full subscription → lead → featured flow

---

## Revenue Projections (Example)

| Tier | Monthly Price | Target Users | Monthly Revenue |
|------|---------------|--------------|-----------------|
| Basic | Free | 500 | ₦0 |
| Professional | ₦15,000 | 100 | ₦1,500,000 |
| Premium | ₦50,000 | 20 | ₦1,000,000 |
| **Subscriptions Total** | | | **₦2,500,000/mo** |
| **Pay-Per-Lead** (₦10k × 500 leads/mo) | | | **₦5,000,000/mo** |
| **Featured** (₦20k × 50/mo) | | | **₦1,000,000/mo** |
| **Total Monthly** | | | **~₦8,500,000** |

---

## Next Steps

1. **Set up Paystack account** → Get test keys
2. **Set up Cloudinary account** → Create upload presets
3. **Create Paystack plans** → Get plan codes
4. **Start Week 1** → Backend subscription service