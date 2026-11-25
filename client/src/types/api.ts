/**
 * Advisora Connect — API Type Definitions & Zod Schemas
 * Single source of truth for all API request/response types
 * Used by both frontend (type safety) and backend (validation)
 */

import { z } from 'zod';

// ============================================
// Base Types
// ============================================

export const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
export const ISODateStringSchema = z.string().datetime({ offset: true });
export const EmailSchema = z.string().email('Invalid email address');
export const PhoneSchema = z.string().regex(/^[\+]?[\d\s\-\(\)]{10,}$/, 'Invalid phone number');

// ============================================
// Auth Types
// ============================================

export const RegisterRequestSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: EmailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['client', 'lawyer', 'professional']),
  termsAccepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
  policiesAccepted: z.literal(true, { errorMap: () => ({ message: 'You must accept the policies' }) }),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;

export const LoginRequestSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const ForgotPasswordRequestSchema = z.object({
  email: EmailSchema,
});

export type ForgotPasswordRequest = z.infer<typeof ForgotPasswordRequestSchema>;

export const ResetPasswordRequestSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type ResetPasswordRequest = z.infer<typeof ResetPasswordRequestSchema>;

export const AuthResponseSchema = z.object({
  user: z.object({
    _id: ObjectIdSchema,
    email: EmailSchema,
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string().optional(),
    role: z.enum(['client', 'lawyer', 'professional', 'admin']),
    avatar: z.string().optional(),
    isVerified: z.boolean().optional(),
  }),
  profile: z.unknown().optional(), // Varies by role
  accessToken: z.string().optional(),
  refreshToken: z.string().optional(),
  message: z.string().optional(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const MeResponseSchema = z.object({
  user: z.object({
    _id: ObjectIdSchema,
    email: EmailSchema,
    firstName: z.string(),
    lastName: z.string(),
    phone: z.string().optional(),
    role: z.enum(['client', 'lawyer', 'professional', 'admin']),
    avatar: z.string().optional(),
    isVerified: z.boolean().optional(),
  }),
  profile: z.unknown().nullable(),
});

export type MeResponse = z.infer<typeof MeResponseSchema>;

// ============================================
// Professional Category Types
// ============================================

export const RegistrationFieldSchema = z.object({
  name: z.string(),
  type: z.enum(['text', 'number', 'select', 'multiselect', 'date', 'file']),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
});

export const VerificationRequirementsSchema = z.object({
  requiredDocs: z.array(z.string()),
  criteria: z.array(z.string()),
});

export const ProfessionalCategorySchema = z.object({
  _id: ObjectIdSchema,
  key: z.string(),
  label: z.string(),
  description: z.string().optional(),
  isActive: z.boolean(),
  specializations: z.array(z.string()),
  registrationFields: z.array(RegistrationFieldSchema),
  verificationRequirements: VerificationRequirementsSchema,
  serviceTypes: z.array(z.string()),
  consultationModes: z.array(z.enum(['video', 'audio', 'in-person'])),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export type ProfessionalCategory = z.infer<typeof ProfessionalCategorySchema>;

export const CreateCategoryRequestSchema = z.object({
  key: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  label: z.string().min(1).max(100),
  description: z.string().optional(),
  specializations: z.array(z.string()),
  registrationFields: z.array(RegistrationFieldSchema),
  verificationRequirements: VerificationRequirementsSchema,
  serviceTypes: z.array(z.string()),
  consultationModes: z.array(z.enum(['video', 'audio', 'in-person'])),
});

export type CreateCategoryRequest = z.infer<typeof CreateCategoryRequestSchema>;

// ============================================
// Professional Profile Types
// ============================================

export const ServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  duration: z.number().int().positive('Duration must be positive'),
  price: z.number().nonnegative('Price cannot be negative'),
  type: z.enum(['video', 'audio', 'in-person']),
});

export const ProfessionalProfileSchema = z.object({
  _id: ObjectIdSchema,
  userId: ObjectIdSchema,
  category: ProfessionalCategorySchema.extend({ _id: ObjectIdSchema }).optional(),
  specialization: z.string().optional(),
  photo: z.string().optional(),
  bio: z.string().optional(),
  officeAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  languages: z.array(z.string()),
  yearsOfExperience: z.number().int().nonnegative().optional(),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']),
  verificationBadge: z.boolean(),
  verificationDocs: z.array(z.string()),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative(),
  isAvailable: z.boolean(),
  availableDays: z.array(z.string()),
  availableHours: z.string().optional(),
  availableFrom: z.string().optional(),
  availableTo: z.string().optional(),
  onboardingAgreementAccepted: z.boolean(),
  onboardingAgreementAcceptedAt: ISODateStringSchema.optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  phone: z.string().optional(),
  services: z.array(ServiceSchema),
  requireApproval: z.boolean(),
  declaration: z.object({
    informationAccurate: z.boolean(),
    qualifiedToPractise: z.boolean(),
    noDisciplinaryAction: z.boolean(),
    declaredAt: ISODateStringSchema.optional(),
  }).optional(),
  categoryData: z.record(z.string()).optional(),
  // Legacy fields for backward compatibility with lawyer-specific data
  practiceAreas: z.array(z.string()).optional(),
  specializations: z.array(z.string()).optional(),
  consultationFee: z.number().nonnegative().optional(),
  subscription: z.object({
    plan: z.string().optional(),
    status: z.string().optional(),
    startDate: ISODateStringSchema.optional(),
    endDate: ISODateStringSchema.optional(),
  }).optional(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export type ProfessionalProfile = z.infer<typeof ProfessionalProfileSchema>;

export const UpdateProfileRequestSchema = ProfessionalProfileSchema.partial().omit({
  _id: true,
  userId: true,
  category: true,
  createdAt: true,
  updatedAt: true,
  rating: true,
  reviewCount: true,
  verificationStatus: true,
  verificationBadge: true,
});

export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;

export const VerificationSubmitSchema = z.object({
  category: ObjectIdSchema,
  specialization: z.string().optional(),
  categoryData: z.record(z.unknown()).optional(),
  declaration: z.object({
    informationAccurate: z.literal(true),
    qualifiedToPractise: z.literal(true),
    noDisciplinaryAction: z.literal(true),
  }),
});

export type VerificationSubmit = z.infer<typeof VerificationSubmitSchema>;

// ============================================
// Lawyer Profile (Legacy - for backward compatibility)
// ============================================

export const LawyerProfileSchema = z.object({
  _id: ObjectIdSchema,
  userId: ObjectIdSchema,
  otherNames: z.string().optional(),
  photo: z.string().optional(),
  barNumber: z.string().optional(),
  stateOfCall: z.string().optional(),
  yearOfCall: z.number().int().optional(),
  practiceAreas: z.array(z.string()),
  bio: z.string().optional(),
  officeAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  languages: z.array(z.string()),
  yearsOfExperience: z.number().int().optional(),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']),
  verificationBadge: z.boolean(),
  verificationDocs: z.array(z.string()),
  subscription: z.object({
    plan: z.enum(['basic', 'professional', 'premium']),
    status: z.enum(['active', 'expired', 'cancelled']),
    startDate: ISODateStringSchema.optional(),
    endDate: ISODateStringSchema.optional(),
  }).optional(),
  featuredListing: z.object({
    isActive: z.boolean(),
    startDate: ISODateStringSchema.optional(),
    endDate: ISODateStringSchema.optional(),
  }).optional(),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative(),
  consultationFee: z.number().nonnegative(),
  isAvailable: z.boolean(),
  availableDays: z.array(z.string()),
  availableHours: z.string().optional(),
  availableFrom: z.string().optional(),
  availableTo: z.string().optional(),
  onboardingAgreementAccepted: z.boolean(),
  onboardingAgreementAcceptedAt: ISODateStringSchema.optional(),
  accountName: z.string().optional(),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  phone: z.string().optional(),
  services: z.array(ServiceSchema),
  requireApproval: z.boolean(),
  declaration: z.object({
    informationAccurate: z.boolean(),
    qualifiedToPractise: z.boolean(),
    noDisciplinaryAction: z.boolean(),
    declaredAt: ISODateStringSchema.optional(),
  }).optional(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export type LawyerProfile = z.infer<typeof LawyerProfileSchema>;

// ============================================
// Lawyer Search & Listings
// ============================================

export const LawyerFiltersSchema = z.object({
  name: z.string().optional(),
  practiceArea: z.string().optional(),
  location: z.string().optional(),
  state: z.string().optional(),
  isAvailable: z.enum(['true', 'false']).optional(),
  category: z.string().optional(), // For multi-professional search
});

export type LawyerFilters = z.infer<typeof LawyerFiltersSchema>;

export const LawyerListItemSchema = z.object({
  _id: ObjectIdSchema,
  userId: z.object({
    _id: ObjectIdSchema,
    firstName: z.string(),
    lastName: z.string(),
    email: EmailSchema,
    avatar: z.string().optional(),
  }),
  photo: z.string().optional(),
  city: z.string(),
  state: z.string(),
  practiceAreas: z.array(z.string()),
  specializations: z.array(z.string()).optional(),
  verificationBadge: z.boolean(),
  verificationStatus: z.enum(['pending', 'verified', 'rejected']),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative(),
  consultationFee: z.number().nonnegative(),
  isAvailable: z.boolean(),
  availableDays: z.array(z.string()),
  availableHours: z.string().optional(),
  subscription: z.object({
    plan: z.string(),
    status: z.string(),
  }).optional(),
  category: z.object({
    key: z.string(),
    label: z.string(),
  }).optional(),
});

export type LawyerListItem = z.infer<typeof LawyerListItemSchema>;

export const LawyersResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  lawyers: z.array(LawyerListItemSchema),
});

export type LawyersResponse = z.infer<typeof LawyersResponseSchema>;

// ============================================
// Availability & Booking
// ============================================

export const AvailabilityResponseSchema = z.object({
  slots: z.array(z.string()),
  timezone: z.string(),
  date: z.string(),
});

export type AvailabilityResponse = z.infer<typeof AvailabilityResponseSchema>;

export const BookingRequestSchema = z.object({
  lawyerId: ObjectIdSchema,
  service: z.object({
    name: z.string(),
    duration: z.number().int().positive(),
    price: z.number().nonnegative(),
    type: z.enum(['video', 'audio', 'in-person']),
  }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  timeSlot: z.string(),
  duration: z.number().int().positive(),
  consultationType: z.enum(['video', 'audio', 'in-person']),
  caseSummary: z.string().max(500).optional(),
  clientName: z.string().min(1),
  clientEmail: EmailSchema,
  clientPhone: PhoneSchema.optional(),
});

export type BookingRequest = z.infer<typeof BookingRequestSchema>;

export const BookingResponseSchema = z.object({
  appointment: z.object({
    _id: ObjectIdSchema,
    lawyerId: ObjectIdSchema,
    clientId: ObjectIdSchema,
    date: ISODateStringSchema,
    timeSlot: z.string(),
    duration: z.number().int(),
    consultationType: z.string(),
    consultationFee: z.number(),
    platformFee: z.number(),
    totalAmount: z.number(),
    status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
    paymentStatus: z.enum(['pending', 'paid', 'refunded']),
    meetingLink: z.string().optional(),
  }),
  paymentBreakdown: z.object({
    consultationFee: z.number(),
    platformFee: z.number(),
    total: z.number(),
  }),
});

export type BookingResponse = z.infer<typeof BookingResponseSchema>;

// ============================================
// Leads / Enquiries
// ============================================

export const LeadSchema = z.object({
  _id: ObjectIdSchema,
  lawyerId: ObjectIdSchema,
  clientId: ObjectIdSchema.optional(),
  clientName: z.string(),
  clientEmail: EmailSchema,
  clientPhone: z.string().optional(),
  enquiryMessage: z.string(),
  status: z.enum(['pending', 'accepted', 'declined', 'booked']),
  paymentStatus: z.enum(['unpaid', 'paid', 'refunded']),
  bookingContext: z.object({
    service: z.object({
      name: z.string(),
      duration: z.number(),
      price: z.number(),
      type: z.string(),
    }),
    date: z.string(),
    timeSlot: z.string(),
    duration: z.number(),
    consultationType: z.string(),
  }).optional(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export type Lead = z.infer<typeof LeadSchema>;

export const CreateLeadRequestSchema = z.object({
  lawyerId: ObjectIdSchema,
  enquiryMessage: z.string().min(1).max(500),
  clientName: z.string().min(1),
  clientEmail: EmailSchema,
  clientPhone: PhoneSchema.optional(),
});

export type CreateLeadRequest = z.infer<typeof CreateLeadRequestSchema>;

export const RespondToLeadRequestSchema = z.object({
  status: z.enum(['accepted', 'declined']),
});

export type RespondToLeadRequest = z.infer<typeof RespondToLeadRequestSchema>;

export const LeadsResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  leads: z.array(LeadSchema),
});

export type LeadsResponse = z.infer<typeof LeadsResponseSchema>;

// ============================================
// Appointments
// ============================================

export const AppointmentSchema = z.object({
  _id: ObjectIdSchema,
  lawyerId: z.object({
    _id: ObjectIdSchema,
    userId: z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: EmailSchema,
    }),
  }).optional(),
  clientId: z.object({
    _id: ObjectIdSchema,
    firstName: z.string(),
    lastName: z.string(),
    email: EmailSchema,
  }).optional(),
  date: ISODateStringSchema,
  timeSlot: z.string(),
  duration: z.number().int(),
  consultationType: z.string(),
  consultationFee: z.number(),
  platformFee: z.number(),
  totalAmount: z.number(),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
  paymentStatus: z.enum(['pending', 'paid', 'refunded']),
  meetingLink: z.string().optional(),
  completionSource: z.string().optional(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export type Appointment = z.infer<typeof AppointmentSchema>;

export const AppointmentsResponseSchema = z.object({
  appointments: z.array(AppointmentSchema),
});

export type AppointmentsResponse = z.infer<typeof AppointmentsResponseSchema>;

export const GenerateMeetingResponseSchema = z.object({
  meetingLink: z.string().url().optional(),
  message: z.string().optional(),
});

export type GenerateMeetingResponse = z.infer<typeof GenerateMeetingResponseSchema>;

// ============================================
// Wallet & Payments
// ============================================

export const WalletSchema = z.object({
  balance: z.number(),
  totalEarned: z.number(),
  pendingBalance: z.number(),
  transactions: z.array(z.object({
    _id: ObjectIdSchema,
    type: z.enum(['credit', 'debit']),
    amount: z.number(),
    description: z.string(),
    reference: z.string().optional(),
    createdAt: ISODateStringSchema,
  })),
});

export type Wallet = z.infer<typeof WalletSchema>;

export const PayoutRequestSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
});

export type PayoutRequest = z.infer<typeof PayoutRequestSchema>;

export const InitializePaymentRequestSchema = z.object({
  appointmentId: ObjectIdSchema,
  amount: z.number().positive(),
  email: EmailSchema,
  metadata: z.record(z.string()).optional(),
});

export type InitializePaymentRequest = z.infer<typeof InitializePaymentRequestSchema>;

export const InitializePaymentResponseSchema = z.object({
  authorizationUrl: z.string().url(),
  accessCode: z.string(),
  reference: z.string(),
});

export type InitializePaymentResponse = z.infer<typeof InitializePaymentResponseSchema>;

// ============================================
// Reviews
// ============================================

export const ReviewSchema = z.object({
  _id: ObjectIdSchema,
  lawyerId: ObjectIdSchema,
  clientId: z.object({
    _id: ObjectIdSchema,
    firstName: z.string(),
    lastName: z.string(),
  }),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
  createdAt: ISODateStringSchema,
});

export type Review = z.infer<typeof ReviewSchema>;

export const CreateReviewRequestSchema = z.object({
  lawyerId: ObjectIdSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export type CreateReviewRequest = z.infer<typeof CreateReviewRequestSchema>;

export const LawyerReviewsResponseSchema = z.object({
  reviews: z.array(ReviewSchema),
  total: z.number().int().nonnegative(),
  averageRating: z.number().min(0).max(5),
});

export type LawyerReviewsResponse = z.infer<typeof LawyerReviewsResponseSchema>;

// ============================================
// Membership & Subscriptions
// ============================================

export const PlanEntitlementsSchema = z.object({
  listing: z.boolean(),
  searchVisibility: z.boolean(),
  enhancedPlacement: z.boolean(),
  appointmentManagement: z.boolean(),
  analytics: z.boolean(),
  enquiryManagement: z.boolean(),
  documentStorage: z.boolean().optional(),
  crm: z.boolean().optional(),
  teamManagement: z.boolean().optional(),
  prioritySupport: z.boolean().optional(),
});

export const PlanLimitsSchema = z.object({
  maxProfiles: z.number().int().positive(),
  maxServices: z.number().int().positive(),
  maxEnquiriesPerMonth: z.number().int().positive(),
});

export const MembershipPlanSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string(),
  isActive: z.boolean(),
  isFree: z.boolean(),
  billingInterval: z.enum(['monthly', 'yearly']),
  price: z.object({
    amount: z.number().nonnegative(),
    currency: z.string(),
  }),
  firmPrice: z.object({
    amount: z.number().nonnegative(),
    currency: z.string(),
  }),
  entitlements: PlanEntitlementsSchema,
  limits: PlanLimitsSchema,
  includedSeats: z.number().int().positive(),
  additionalSeatPrice: z.object({
    amount: z.number().nonnegative(),
    currency: z.string(),
  }),
});

export type MembershipPlan = z.infer<typeof MembershipPlanSchema>;

export const MembershipConfigResponseSchema = z.object({
  plans: z.array(MembershipPlanSchema),
  feePolicies: z.array(z.object({
    transactionType: z.string(),
    feeType: z.enum(['fixed', 'percentage']),
    fixedAmount: z.number().nonnegative(),
    percentage: z.number().min(0).max(100),
    isActive: z.boolean(),
  })),
});

export type MembershipConfigResponse = z.infer<typeof MembershipConfigResponseSchema>;

// ============================================
// Notifications
// ============================================

export const NotificationSchema = z.object({
  _id: ObjectIdSchema,
  userId: ObjectIdSchema,
  title: z.string(),
  message: z.string(),
  type: z.enum(['info', 'success', 'warning', 'error']),
  read: z.boolean(),
  actionUrl: z.string().optional(),
  createdAt: ISODateStringSchema,
});

export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationsResponseSchema = z.object({
  notifications: z.array(NotificationSchema),
  unreadCount: z.number().int().nonnegative(),
});

export type NotificationsResponse = z.infer<typeof NotificationsResponseSchema>;

// ============================================
// Admin Types
// ============================================

export const AdminAnalyticsSchema = z.object({
  totalLawyers: z.number().int().nonnegative(),
  verifiedLawyers: z.number().int().nonnegative(),
  pendingLawyers: z.number().int().nonnegative(),
  totalClients: z.number().int().nonnegative(),
  totalLeads: z.number().int().nonnegative(),
  paidLeads: z.number().int().nonnegative(),
  activeSubscriptions: z.number().int().nonnegative(),
  featuredActive: z.number().int().nonnegative(),
});

export type AdminAnalytics = z.infer<typeof AdminAnalyticsSchema>;

export const AdminUserSchema = z.object({
  _id: ObjectIdSchema,
  email: EmailSchema,
  firstName: z.string(),
  lastName: z.string(),
  role: z.enum(['client', 'lawyer', 'professional', 'admin']),
  isActive: z.boolean(),
  isVerified: z.boolean(),
  createdAt: ISODateStringSchema,
  profile: z.unknown().optional(),
});

export type AdminUser = z.infer<typeof AdminUserSchema>;

export const AdminUsersResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  users: z.array(AdminUserSchema),
});

export type AdminUsersResponse = z.infer<typeof AdminUsersResponseSchema>;

export const RevenueSummarySchema = z.object({
  totalRevenue: z.number(),
  totalPlatformFees: z.number(),
  totalLawyerPayouts: z.number(),
  totalSubscriptionRevenue: z.number(),
  totalPendingPayouts: z.number(),
});

export const RevenueTransactionSchema = z.object({
  _id: ObjectIdSchema,
  clientId: z.object({
    firstName: z.string(),
    lastName: z.string(),
  }).optional(),
  lawyerId: z.object({
    userId: z.object({
      firstName: z.string(),
      lastName: z.string(),
    }),
  }).optional(),
  amount: z.number(),
  platformFee: z.number(),
  lawyerAmount: z.number(),
  status: z.string(),
  createdAt: ISODateStringSchema,
});

export const RevenueSubscriptionSchema = z.object({
  _id: ObjectIdSchema,
  userId: z.object({
    firstName: z.string(),
    lastName: z.string(),
  }).optional(),
  plan: z.string(),
  amount: z.number(),
  status: z.string(),
  createdAt: ISODateStringSchema,
});

export const RevenueResponseSchema = z.object({
  transactions: z.array(RevenueTransactionSchema),
  subscriptions: z.array(RevenueSubscriptionSchema),
  summary: RevenueSummarySchema,
});

export type RevenueResponse = z.infer<typeof RevenueResponseSchema>;

export const PayoutSchema = z.object({
  _id: ObjectIdSchema,
  lawyerId: z.object({
    _id: ObjectIdSchema,
    userId: z.object({
      firstName: z.string(),
      lastName: z.string(),
      email: EmailSchema,
    }),
  }),
  amount: z.number(),
  bankName: z.string(),
  accountNumber: z.string(),
  accountName: z.string(),
  status: z.enum(['pending', 'approved', 'processed', 'rejected']),
  adminNote: z.string().optional(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export type Payout = z.infer<typeof PayoutSchema>;

export const PayoutsResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  payouts: z.array(PayoutSchema),
});

export type PayoutsResponse = z.infer<typeof PayoutsResponseSchema>;

// ============================================
// Documents
// ============================================

export const DocumentSchema = z.object({
  _id: ObjectIdSchema,
  userId: ObjectIdSchema,
  fileName: z.string(),
  fileUrl: z.string().url(),
  fileType: z.string(),
  fileSize: z.number(),
  category: z.string().optional(),
  sharedWith: z.array(ObjectIdSchema),
  expiresAt: ISODateStringSchema.optional(),
  createdAt: ISODateStringSchema,
});

export type Document = z.infer<typeof DocumentSchema>;

export const DocumentsResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  documents: z.array(DocumentSchema),
});

export type DocumentsResponse = z.infer<typeof DocumentsResponseSchema>;

// ============================================
// Legal Documents
// ============================================

export const LegalDocumentSchema = z.object({
  _id: ObjectIdSchema,
  slug: z.string(),
  title: z.string(),
  content: z.string(),
  version: z.string(),
  isActive: z.boolean(),
  category: z.string().optional(),
  requiredForRoles: z.array(z.string()),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export type LegalDocument = z.infer<typeof LegalDocumentSchema>;

export const LegalDocumentsResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  documents: z.array(LegalDocumentSchema),
});

export type LegalDocumentsResponse = z.infer<typeof LegalDocumentsResponseSchema>;

export const LegalAcceptanceSchema = z.object({
  slug: z.string(),
  version: z.string(),
  acceptedAt: ISODateStringSchema,
});

export type LegalAcceptance = z.infer<typeof LegalAcceptanceSchema>;

// ============================================
// Blog
// ============================================

export const BlogPostSchema = z.object({
  _id: ObjectIdSchema,
  slug: z.string(),
  title: z.string(),
  excerpt: z.string(),
  content: z.string(),
  coverImage: z.string().url().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()),
  author: z.object({
    firstName: z.string(),
    lastName: z.string(),
  }).optional(),
  publishedAt: ISODateStringSchema.optional(),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export type BlogPost = z.infer<typeof BlogPostSchema>;

export const BlogPostsResponseSchema = z.object({
  count: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  pages: z.number().int().nonnegative(),
  posts: z.array(BlogPostSchema),
});

export type BlogPostsResponse = z.infer<typeof BlogPostsResponseSchema>;

// ============================================
// Firms
// ============================================

export const FirmSchema = z.object({
  _id: ObjectIdSchema,
  name: z.string(),
  ownerId: ObjectIdSchema,
  professionalProfileId: ObjectIdSchema,
  members: z.array(z.object({
    userId: ObjectIdSchema,
    professionalProfileId: ObjectIdSchema,
    role: z.enum(['owner', 'admin', 'member']),
    joinedAt: ISODateStringSchema,
  })),
  createdAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
});

export type Firm = z.infer<typeof FirmSchema>;

export const CreateFirmRequestSchema = z.object({
  name: z.string().min(1).max(100),
  professionalProfileId: ObjectIdSchema,
});

export type CreateFirmRequest = z.infer<typeof CreateFirmRequestSchema>;

export const InviteFirmMemberRequestSchema = z.object({
  userId: ObjectIdSchema,
  professionalProfileId: ObjectIdSchema,
});

export type InviteFirmMemberRequest = z.infer<typeof InviteFirmMemberRequestSchema>;

// ============================================
// Error Response
// ============================================

export const ApiErrorSchema = z.object({
  message: z.string(),
  statusCode: z.number().int().optional(),
  errors: z.record(z.array(z.string())).optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

// ============================================
// Pagination
// ============================================

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    count: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    pages: z.number().int().nonnegative(),
    data: z.array(itemSchema),
  });

// ============================================
// Type Guards
// ============================================

export function isApiError(error: unknown): error is ApiError {
  return ApiErrorSchema.safeParse(error).success;
}

export function isAuthResponse(data: unknown): data is AuthResponse {
  return AuthResponseSchema.safeParse(data).success;
}

// ============================================
// Constants
// ============================================

export const PLATFORM_FEE_AMOUNT = 10000; // ₦10,000

export const PROFESSIONAL_CATEGORIES = {
  LEGAL: 'legal',
  ACCOUNTING: 'accounting',
  TAX: 'tax',
} as const;

export const USER_ROLES = {
  CLIENT: 'client',
  LAWYER: 'lawyer',
  PROFESSIONAL: 'professional',
  ADMIN: 'admin',
} as const;

export const VERIFICATION_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;

export const APPOINTMENT_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded',
} as const;

export const LEAD_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
  BOOKED: 'booked',
} as const;