import type { LawyerListItem } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Token management for cross-domain auth
const TOKEN_KEY = 'advisora_access_token';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const clearStoredTokens = () => localStorage.removeItem(TOKEN_KEY);

export const storeAuthData = (data: { accessToken?: string }) => {
  if (data.accessToken) {
    localStorage.setItem(TOKEN_KEY, data.accessToken);
  }
};

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  isFormData?: boolean;
}

class ApiClient {
  private _skipRefresh = false;

  setSkipRefresh(skip: boolean): void {
    this._skipRefresh = skip;
  }

  private shouldSkipRefresh(): boolean {
    return this._skipRefresh;
  }

  private async request<T>(endpoint: string, options: ApiOptions = {}, attempt = 1): Promise<T> {
    const { method = 'GET', body, headers = {}, isFormData = false } = options;

    const config: RequestInit = {
      method,
      credentials: 'include' as RequestCredentials,
      headers: { ...headers },
    };

    // Always attach auth token for all request types (GET, POST, etc.)
    const token = getStoredToken();
    if (token) {
      config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
    }

    if (body && !isFormData) {
      config.headers = {
        ...config.headers,
        'Content-Type': 'application/json',
      };
      config.body = JSON.stringify(body);
    } else if (body && isFormData) {
      config.body = body as FormData;
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
      if (response.status === 401 && attempt === 1 && !this.shouldSkipRefresh()) {
        try {
          await this.refresh();
          return this.request<T>(endpoint, options, 2);
        } catch {
          // stay logged out
        }
      }

      let errorMessage = 'Request failed';
      try {
        const error = await response.json();
        errorMessage = error.message || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Convenience methods
  get(endpoint: string, options?: Omit<ApiOptions, 'method' | 'body'>) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint: string, body?: unknown, options?: Omit<ApiOptions, 'method' | 'body'>) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  put(endpoint: string, body?: unknown, options?: Omit<ApiOptions, 'method' | 'body'>) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  delete(endpoint: string, options?: Omit<ApiOptions, 'method' | 'body'>) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  // ============================================
  // Auth
  // ============================================

  refresh() {
    return this.request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
    }, 2);
  }

  getMe() {
    return this.request<{
      user: {
        _id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone?: string;
        role: 'client' | 'lawyer' | 'professional' | 'admin';
        avatar?: string;
        isVerified?: boolean;
      };
      profile?: unknown;
    }>('/auth/me');
  }

  register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'client' | 'lawyer' | 'professional';
    termsAccepted: boolean;
    policiesAccepted: boolean;
    fractionalGCOffered?: boolean;
  }) {
    return this.request<{ _id: string; role: string; message?: string }>('/auth/register', {
      method: 'POST',
      body: data,
    });
  }

  login(data: { email: string; password: string }) {
    return this.request<{
      user: {
        _id: string;
        email: string;
        firstName: string;
        lastName: string;
        phone?: string;
        role: 'client' | 'lawyer' | 'professional' | 'admin';
        avatar?: string;
        isVerified?: boolean;
      };
      profile?: unknown;
      accessToken?: string;
      refreshToken?: string;
      message?: string;
    }>('/auth/login', {
      method: 'POST',
      body: data,
    }).then(res => {
      if (res.accessToken) storeAuthData(res);
      return res;
    });
  }

  forgotPassword(email: string) {
    return this.request<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  }

  resetPassword(token: string, password: string) {
    return this.request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    });
  }

  logout() {
    clearStoredTokens();
    this.setSkipRefresh(true);
    return this.request<{ message: string }>('/auth/logout', { method: 'POST' });
  }

  updateUserProfile(data: { firstName?: string; lastName?: string; phone?: string; avatar?: string }) {
    return this.request<{ message: string; user: unknown }>('/auth/profile', { method: 'PUT', body: data });
  }

  // ============================================
  // Professional Categories
  // ============================================

  getProfessionalCategories() {
    return this.request<{ categories: Array<{
      _id: string;
      key: string;
      label: string;
      description?: string;
      isActive: boolean;
      specializations: string[];
      registrationFields: Array<{
        name: string;
        type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'file';
        required: boolean;
        options?: string[];
      }>;
      verificationRequirements: {
        requiredDocs: string[];
        criteria: string[];
      };
      serviceTypes: string[];
      consultationModes: ('video' | 'audio' | 'in-person')[];
      createdAt: string;
      updatedAt: string;
    }> }>('/categories');
  }

  getAdminProfessionalCategories() {
    return this.request<{ categories: Array<{
      _id: string;
      key: string;
      label: string;
      description?: string;
      isActive: boolean;
      specializations: string[];
      registrationFields: Array<{
        name: string;
        type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'file';
        required: boolean;
        options?: string[];
      }>;
      verificationRequirements: {
        requiredDocs: string[];
        criteria: string[];
      };
      serviceTypes: string[];
      consultationModes: ('video' | 'audio' | 'in-person')[];
      createdAt: string;
      updatedAt: string;
    }> }>('/categories/admin');
  }

  createProfessionalCategory(data: {
    key: string;
    label: string;
    description?: string;
    specializations: string[];
    registrationFields: Array<{
      name: string;
      type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'file';
      required: boolean;
      options?: string[];
    }>;
    verificationRequirements: {
      requiredDocs: string[];
      criteria: string[];
    };
    serviceTypes: string[];
    consultationModes: ('video' | 'audio' | 'in-person')[];
  }) {
    return this.request<{ category: unknown }>('/categories', { method: 'POST', body: data });
  }

  updateProfessionalCategory(id: string, data: unknown) {
    return this.request<{ category: unknown }>(`/categories/${encodeURIComponent(id)}`, { method: 'PUT', body: data });
  }

  // ============================================
  // Professionals (Lawyers, Accountants, Tax Consultants)
  // ============================================

  getProfessionals(params?: Record<string, string>) {
    const queryParams = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
      if (value && value !== 'undefined') queryParams.set(key, value);
    });
    const query = queryParams.toString();
    const endpoint = params?.category === 'legal' ? '/lawyers' : '/professionals';

    return this.request<{
      count: number;
      professionals?: LawyerListItem[];
      lawyers?: LawyerListItem[];
    }>(`${endpoint}${query ? `?${query}` : ''}`).then(({ count, professionals, lawyers }) => ({
      count,
      professionals: professionals || lawyers || [],
    }));
  }

  // Legacy alias for backward compatibility
  getLawyers(params?: Record<string, string>) {
    return this.getProfessionals(params);
  }

  getProfessionalById(id: string) {
    return this.request<{
      _id: string;
      userId: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
        avatar?: string;
      };
      photo?: string;
      specialization?: string;
      bio?: string;
      officeAddress?: string;
      city: string;
      state: string;
      languages: string[];
      yearsOfExperience?: number;
      verificationStatus: 'pending' | 'verified' | 'rejected';
      verificationBadge: boolean;
      verificationDocs: string[];
      rating: number;
      reviewCount: number;
      isAvailable: boolean;
      availableDays: string[];
      availableHours?: string;
      availableFrom?: string;
      availableTo?: string;
      onboardingAgreementAccepted: boolean;
      onboardingAgreementAcceptedAt?: string;
      accountName?: string;
      accountNumber?: string;
      bankName?: string;
      phone?: string;
      services: Array<{
        name: string;
        duration: number;
        price: number;
        type: 'video' | 'audio' | 'in-person';
      }>;
      requireApproval: boolean;
      declaration?: {
        informationAccurate: boolean;
        qualifiedToPractise: boolean;
        noDisciplinaryAction: boolean;
        declaredAt?: string;
      };
      // Fractional GC fields
      fractionalGC?: {
        isAvailable: boolean;
        monthlyRetainerMin: number;
        monthlyRetainerMax: number;
        hoursPerMonth: number;
        industries: string[];
        companyStages: string[];
        engagementTypes: string[];
        scopeOfWork: string[];
        minimumEngagementMonths: number;
        autoRenew: boolean;
      };
      // Legacy fields for backward compatibility
      practiceAreas?: string[];
      specializations?: string[];
      consultationFee?: number;
      subscription?: { plan: string; status: string; startDate?: string; endDate?: string };
      category?: {
        _id: string;
        key: string;
        label: string;
        specializations?: string[];
        registrationFields?: Array<{
          name: string;
          type: 'text' | 'number' | 'select' | 'multiselect' | 'date' | 'file';
          required: boolean;
          options?: string[];
        }>;
        verificationRequirements?: {
          requiredDocs: string[];
          criteria: string[];
        };
        serviceTypes?: string[];
        consultationModes?: ('video' | 'audio' | 'in-person')[];
      };
      categoryData?: Record<string, string>;
      createdAt: string;
      updatedAt: string;
    }>(`/professionals/${id}`);
  }

  // Legacy alias
  getLawyerById(id: string) {
    return this.getProfessionalById(id);
  }

  getProfessionalAvailability(id: string, date: string) {
    return this.request<{
      slots: string[];
      timezone: string;
      date: string;
    }>(`/professionals/${id}/availability?date=${encodeURIComponent(date)}`);
  }

  // Legacy alias
  getLawyerAvailability(id: string, date: string) {
    return this.getProfessionalAvailability(id, date);
  }

  updateProfessionalProfile(data: unknown) {
    return this.request<{ profile: unknown }>('/professionals/profile', { method: 'PUT', body: data });
  }

  // Legacy alias
  updateLawyerProfile(data: unknown) {
    return this.updateProfessionalProfile(data);
  }

  submitProfessionalVerification(data: {
    category: string;
    specialization?: string;
    categoryData?: Record<string, string>;
    declaration: {
      informationAccurate: boolean;
      qualifiedToPractise: boolean;
      noDisciplinaryAction: boolean;
    };
  }) {
    return this.request<{ profile: unknown }>('/professionals/verify', { method: 'POST', body: data });
  }

  // Legacy alias
  submitVerification(data: unknown) {
    return this.submitProfessionalVerification(data as Parameters<typeof this.submitProfessionalVerification>[0]);
  }

  uploadVerificationDocs(formData: FormData) {
    return this.request<{ docs: string[] }>('/professionals/verify-upload', {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  }

  // ============================================
  // Leads / Enquiries
  // ============================================

  createLead(data: {
    lawyerId: string;
    enquiryMessage: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
  }) {
    return this.request<{ lead: unknown }>('/leads', { method: 'POST', body: data });
  }

  createBookingRequest(data: {
    lawyerId: string;
    service: {
      name: string;
      duration: number;
      price: number;
      type: 'video' | 'audio' | 'in-person';
    };
    date: string;
    timeSlot: string;
    duration: number;
    consultationType: 'video' | 'audio' | 'in-person';
    caseSummary?: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
  }) {
    return this.request<{ appointment: unknown; paymentBreakdown: unknown }>('/leads/book-request', { method: 'POST', body: data });
  }

  respondToLead(id: string, status: 'accepted' | 'declined') {
    return this.request<{ lead: unknown }>(`/leads/${id}/respond`, { method: 'PUT', body: { status } });
  }

  getLeads() {
    return this.request<{ count: number; leads: Array<{
      _id: string;
      lawyerId: string;
      clientId?: string;
      clientName: string;
      clientEmail: string;
      clientPhone?: string;
      enquiryMessage: string;
      status: 'pending' | 'accepted' | 'declined' | 'booked';
      paymentStatus: 'unpaid' | 'paid' | 'refunded';
      bookingContext?: {
        service: { name: string; duration: number; price: number; type: string };
        date: string;
        timeSlot: string;
        duration: number;
        consultationType: string;
      };
      createdAt: string;
      updatedAt: string;
    }> }>('/leads');
  }

  getMyEnquiries() {
    return this.request<{ count: number; leads: Array<{
      _id: string;
      lawyerId: string;
      clientId?: string;
      clientName: string;
      clientEmail: string;
      clientPhone?: string;
      enquiryMessage: string;
      status: 'pending' | 'accepted' | 'declined' | 'booked';
      paymentStatus: 'unpaid' | 'paid' | 'refunded';
      bookingContext?: {
        service: { name: string; duration: number; price: number; type: string };
        date: string;
        timeSlot: string;
        duration: number;
        consultationType: string;
      };
      createdAt: string;
      updatedAt: string;
    }> }>('/leads/my-enquiries');
  }

  bookConsultation(id: string, data: {
    date: string;
    timeSlot: string;
    duration: number;
    consultationType: 'video' | 'audio' | 'in-person';
  }) {
    return this.request<{
      appointment: {
        _id: string;
        lawyerId: string;
        clientId: string;
        date: string;
        timeSlot: string;
        duration: number;
        consultationType: string;
        consultationFee: number;
        platformFee: number;
        totalAmount: number;
        status: string;
        paymentStatus: string;
        meetingLink?: string;
        createdAt: string;
      };
      paymentBreakdown: {
        consultationFee: number;
        platformFee: number;
        total: number;
      };
    }>(`/leads/${id}/book`, { method: 'POST', body: data });
  }

  // ============================================
  // Payments
  // ============================================

  initializePayment(data: {
    appointmentId: string;
    amount: number;
    email: string;
    metadata?: Record<string, string>;
  }) {
    return this.request<{
      authorizationUrl: string;
      accessCode: string;
      reference: string;
    }>('/payments/initialize', { method: 'POST', body: data });
  }

  verifyPayment(data: { reference: string }) {
    return this.request<{
      status: boolean;
      message: string;
      data: {
        status: string;
        gateway_response?: string;
        metadata?: {
          type?: string;
          appointmentId?: string;
        };
      };
    }>('/payments/verify', { method: 'POST', body: data });
  }

  verifyEmailAndStore(token: string) {
    return this.request<{
      user: unknown;
      profile?: unknown;
      accessToken?: string;
      refreshToken?: string;
    }>(`/auth/verify-email/${token}`).then(res => {
      if (res.accessToken) {
        storeAuthData(res);
        this.setSkipRefresh(false);
      }
      return res;
    });
  }

  // ============================================
  // Professional Profile Extras
  // ============================================

  acceptOnboardingAgreement() {
    return this.request<{ message: string }>('/professionals/onboarding/accept', { method: 'POST' });
  }

  uploadPhoto(formData: FormData) {
    return this.request<{ photo: string }>('/professionals/upload-photo', {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  }

  submitDeclaration(data: {
    informationAccurate: boolean;
    qualifiedToPractise: boolean;
    noDisciplinaryAction: boolean;
  }) {
    return this.request<{ declaration: unknown }>('/professionals/declaration', { method: 'POST', body: data });
  }

  // ============================================
  // Wallet
  // ============================================

  getWallet() {
    return this.request<{
      wallet: {
        balance: number;
        totalEarned: number;
        pendingBalance: number;
        transactions: Array<{
          _id: string;
          type: 'credit' | 'debit';
          amount: number;
          description: string;
          reference?: string;
          createdAt: string;
        }>;
      };
    }>('/professionals/wallet');
  }

  requestPayout(amount: number) {
    return this.request<{ message: string; payout: unknown }>('/professionals/wallet/payout-request', { method: 'POST', body: { amount } });
  }

  // ============================================
  // Appointments
  // ============================================

  getMyAppointments() {
    return this.request<{ appointments: Array<{
      _id: string;
      lawyerId?: {
        _id: string;
        userId: { firstName: string; lastName: string; email: string };
      };
      clientId?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
      date: string;
      timeSlot: string;
      duration: number;
      consultationType: string;
      consultationFee: number;
      platformFee: number;
      totalAmount: number;
      status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
      paymentStatus: 'pending' | 'paid' | 'refunded';
      meetingLink?: string;
      completionSource?: string;
      createdAt: string;
      updatedAt: string;
    }> }>('/appointments/my-appointments');
  }

  cancelAppointment(id: string) {
    return this.request<{ message: string }>(`/appointments/${id}/cancel`, { method: 'PUT' });
  }

  getProfessionalAppointments() {
    return this.request<{ appointments: Array<{
      _id: string;
      lawyerId?: {
        _id: string;
        userId: { firstName: string; lastName: string; email: string };
      };
      clientId?: {
        _id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
      date: string;
      timeSlot: string;
      duration: number;
      consultationType: string;
      consultationFee: number;
      platformFee: number;
      totalAmount: number;
      status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
      paymentStatus: 'pending' | 'paid' | 'refunded';
      meetingLink?: string;
      completionSource?: string;
      createdAt: string;
      updatedAt: string;
    }> }>('/appointments/professional-appointments');
  }

  // Legacy alias
  getLawyerAppointments() {
    return this.getProfessionalAppointments();
  }

  generateMeetingLink(appointmentId: string) {
    return this.request<{ meetingLink?: string; message?: string }>(`/appointments/${appointmentId}/generate-meeting`, { method: 'POST' });
  }

  setMeetingLink(appointmentId: string, meetingLink: string) {
    return this.request<{ message: string }>(`/appointments/${appointmentId}/meeting-link`, { method: 'PUT', body: { meetingLink } });
  }

  completeAppointment(appointmentId: string) {
    return this.request<{ message: string }>(`/appointments/${appointmentId}/complete`, { method: 'PUT' });
  }

  // ============================================
  // Admin
  // ============================================

  getPendingVerifications() {
    return this.request<{ count: number; professionals: Array<{
      _id: string;
      userId: { _id: string; firstName: string; lastName: string; email: string };
      verificationStatus: 'pending' | 'verified' | 'rejected';
      category?: { key: string; label: string };
      createdAt: string;
    }> }>('/admin/professionals/pending');
  }

  verifyProfessional(id: string, status: 'verified' | 'rejected') {
    return this.request<{ professional: unknown }>(`/admin/professionals/${id}/verify`, { method: 'PUT', body: { status } });
  }

  // Legacy alias
  verifyLawyer(id: string, status: string) {
    return this.verifyProfessional(id, status as 'verified' | 'rejected');
  }

  getProfessionalProfile(id: string) {
    return this.request<{ professional: unknown }>(`/admin/professionals/${id}`);
  }

  // Legacy alias
  getLawyerProfile(id: string) {
    return this.getProfessionalProfile(id);
  }

  getAdminUsers() {
    return this.request<{ count: number; users: Array<{
      _id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: 'client' | 'lawyer' | 'professional' | 'admin';
      isActive: boolean;
      isVerified: boolean;
      createdAt: string;
      profile?: unknown;
    }> }>('/admin/users');
  }

  toggleUserStatus(id: string) {
    return this.request<{ user: unknown }>(`/admin/users/${id}/toggle-status`, { method: 'PUT' });
  }

  getAnalytics() {
    return this.request<{
      totalLawyers: number;
      verifiedLawyers: number;
      pendingLawyers: number;
      totalClients: number;
      totalLeads: number;
      paidLeads: number;
      activeSubscriptions: number;
      featuredActive: number;
    }>('/admin/analytics');
  }

  getRevenue() {
    return this.request<{
      transactions: Array<{
        _id: string;
        clientId?: { firstName: string; lastName: string };
        lawyerId?: { userId: { firstName: string; lastName: string } };
        amount: number;
        platformFee: number;
        lawyerAmount: number;
        status: string;
        createdAt: string;
      }>;
      subscriptions: Array<{
        _id: string;
        userId?: { firstName: string; lastName: string };
        plan: string;
        amount: number;
        status: string;
        createdAt: string;
      }>;
      summary: {
        totalRevenue: number;
        totalPlatformFees: number;
        totalLawyerPayouts: number;
        totalSubscriptionRevenue: number;
        totalPendingPayouts: number;
      };
    }>('/admin/revenue');
  }

  getPayouts() {
    return this.request<{ count: number; payouts: Array<{
      _id: string;
      lawyerId: { _id: string; userId: { firstName: string; lastName: string; email: string } };
      amount: number;
      bankName: string;
      accountNumber: string;
      accountName: string;
      status: 'pending' | 'approved' | 'processed' | 'rejected';
      adminNote?: string;
      createdAt: string;
      updatedAt: string;
    }> }>('/admin/payouts');
  }

  getMembershipConfig() {
    return this.request<{
      plans: Array<{
        key: string;
        name: string;
        description: string;
        isActive: boolean;
        isFree: boolean;
        billingInterval: 'monthly' | 'yearly';
        price: { amount: number; currency: string };
        firmPrice: { amount: number; currency: string };
        entitlements: {
          listing: boolean;
          searchVisibility: boolean;
          enhancedPlacement: boolean;
          appointmentManagement: boolean;
          analytics: boolean;
          enquiryManagement: boolean;
          documentStorage?: boolean;
          crm?: boolean;
          teamManagement?: boolean;
          prioritySupport?: boolean;
        };
        limits: { maxProfiles: number; maxServices: number; maxEnquiriesPerMonth: number };
        includedSeats: number;
        additionalSeatPrice: { amount: number; currency: string };
      }>;
      feePolicies: Array<{
        transactionType: string;
        feeType: 'fixed' | 'percentage';
        fixedAmount: number;
        percentage: number;
        isActive: boolean;
      }>;
    }>('/membership/admin/config');
  }

  saveMembershipPlan(key: string, data: Record<string, unknown>) {
    return this.request<{ plan: unknown }>(`/membership/admin/plans/${encodeURIComponent(key)}`, {
      method: 'PUT',
      body: { ...data, key },
    });
  }

  savePlatformFeePolicy(transactionType: string, data: Record<string, unknown>) {
    return this.request<{ policy: unknown }>(`/membership/admin/fee-policies/${encodeURIComponent(transactionType)}`, {
      method: 'PUT',
      body: { ...data, transactionType },
    });
  }

  getMyFirms() {
    return this.request<{ firms: Array<{
      _id: string;
      name: string;
      ownerId: string;
      professionalProfileId: string;
      members: Array<{
        userId: string;
        professionalProfileId: string;
        role: 'owner' | 'admin' | 'member';
        joinedAt: string;
      }>;
      createdAt: string;
      updatedAt: string;
    }> }>('/firms/mine');
  }

  createFirm(data: { name: string; professionalProfileId: string }) {
    return this.request<{ firm: unknown }>('/firms', { method: 'POST', body: data });
  }

  inviteFirmMember(firmId: string, data: { userId: string; professionalProfileId: string }) {
    return this.request<{ member: unknown }>(`/firms/${encodeURIComponent(firmId)}/members`, { method: 'POST', body: data });
  }

  acceptFirmInvitation(token: string) {
    return this.request<{ firm: unknown }>('/firms/invitations/accept', { method: 'POST', body: { token } });
  }

  removeFirmMember(firmId: string, memberId: string) {
    return this.request<{ message: string }>(`/firms/${encodeURIComponent(firmId)}/members/${encodeURIComponent(memberId)}`, { method: 'DELETE' });
  }

  processPayout(id: string, status: string, adminNote?: string) {
    return this.request<{ payout: unknown }>(`/admin/payouts/${id}`, { method: 'PUT', body: { status, adminNote } });
  }

  // ============================================
  // Reviews
  // ============================================

  getProfessionalReviews(professionalId: string) {
    return this.request<{
      reviews: Array<{
        _id: string;
        lawyerId: string;
        clientId: { _id: string; firstName: string; lastName: string };
        rating: number;
        comment?: string;
        createdAt: string;
      }>;
      total: number;
      averageRating: number;
    }>(`/reviews/professional/${professionalId}`);
  }

  // ============================================
  // Subscriptions
  // ============================================

  getPlans() {
    return this.request<{ plans: Array<{
      key: string;
      name: string;
      description: string;
      isFree: boolean;
      billingInterval: 'monthly' | 'yearly';
      price: { amount: number; currency: string };
      firmPrice: { amount: number; currency: string };
      entitlements: {
        listing: boolean;
        searchVisibility: boolean;
        enhancedPlacement: boolean;
        appointmentManagement: boolean;
        analytics: boolean;
        enquiryManagement: boolean;
        documentStorage?: boolean;
        crm?: boolean;
        teamManagement?: boolean;
        prioritySupport?: boolean;
      };
      limits: {
        maxProfiles: number;
        maxServices: number;
        maxEnquiriesPerMonth: number;
      };
      includedSeats: number;
      additionalSeatPrice: { amount: number; currency: string };
    }> }>('/subscriptions/plans');
  }

  getCurrentSubscription() {
    return this.request<{
      subscription: {
        _id: string;
        userId: string;
        planId: string;
        plan: string;
        status: 'pending' | 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired';
        startDate: string;
        endDate: string;
        autoRenew: boolean;
        cancelAtPeriodEnd: boolean;
        paystackRef: string;
        paystackSubscriptionCode?: string;
        paystackCustomerCode?: string;
        amount: number;
        currency: string;
        billingInterval: 'monthly' | 'yearly';
        planSnapshot?: {
          name: string;
          key: string;
          entitlements: {
            listing: boolean;
            searchVisibility: boolean;
            enhancedPlacement: boolean;
            appointmentManagement: boolean;
            analytics: boolean;
            enquiryManagement: boolean;
            documentStorage?: boolean;
            crm?: boolean;
            teamManagement?: boolean;
            prioritySupport?: boolean;
          };
          limits: {
            maxProfiles: number;
            maxServices: number;
            maxEnquiriesPerMonth: number;
          };
        };
        createdAt: string;
        updatedAt: string;
      } | null;
    }>('/subscriptions/current');
  }

  createSubscriptionCheckout(data: { planKey: string; billingInterval?: 'monthly' | 'yearly' }) {
    return this.request<{
      authorizationUrl: string;
      accessCode: string;
      reference: string;
      subscriptionId: string;
    }>('/subscriptions/checkout', { method: 'POST', body: data });
  }

  verifySubscription(data: { reference: string }) {
    return this.request<{
      success: boolean;
      subscription: {
        _id: string;
        userId: string;
        planId: string;
        plan: string;
        status: 'pending' | 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired';
        startDate: string;
        endDate: string;
        autoRenew: boolean;
        cancelAtPeriodEnd: boolean;
        paystackRef: string;
        paystackSubscriptionCode?: string;
        paystackCustomerCode?: string;
        amount: number;
        currency: string;
        billingInterval: 'monthly' | 'yearly';
        planSnapshot?: {
          name: string;
          key: string;
          entitlements: {
            listing: boolean;
            searchVisibility: boolean;
            enhancedPlacement: boolean;
            appointmentManagement: boolean;
            analytics: boolean;
            enquiryManagement: boolean;
            documentStorage?: boolean;
            crm?: boolean;
            teamManagement?: boolean;
            prioritySupport?: boolean;
          };
          limits: {
            maxProfiles: number;
            maxServices: number;
            maxEnquiriesPerMonth: number;
          };
        };
        createdAt: string;
        updatedAt: string;
      };
      message: string;
    }>('/subscriptions/verify', { method: 'POST', body: data });
  }

  cancelSubscription() {
    return this.request<{ message: string }>('/subscriptions/cancel', { method: 'POST' });
  }

  reactivateSubscription() {
    return this.request<{ message: string }>('/subscriptions/reactivate', { method: 'POST' });
  }

  changePlan(data: { newPlanKey: string }) {
    return this.request<{
      message: string;
      redirectTo?: string;
    }>('/subscriptions/change-plan', { method: 'POST', body: data });
  }

  getSubscriptionUsage() {
    return this.request<{
      subscription: {
        _id: string;
        userId: string;
        planId: string;
        plan: string;
        status: 'pending' | 'active' | 'trialing' | 'past_due' | 'cancelled' | 'expired';
        startDate: string;
        endDate: string;
        autoRenew: boolean;
        cancelAtPeriodEnd: boolean;
        paystackRef: string;
        paystackSubscriptionCode?: string;
        paystackCustomerCode?: string;
        amount: number;
        currency: string;
        billingInterval: 'monthly' | 'yearly';
        planSnapshot?: {
          name: string;
          key: string;
          entitlements: {
            listing: boolean;
            searchVisibility: boolean;
            enhancedPlacement: boolean;
            appointmentManagement: boolean;
            analytics: boolean;
            enquiryManagement: boolean;
            documentStorage?: boolean;
            crm?: boolean;
            teamManagement?: boolean;
            prioritySupport?: boolean;
          };
          limits: {
            maxProfiles: number;
            maxServices: number;
            maxEnquiriesPerMonth: number;
          };
        };
        usage: {
          profiles: { current: number; limit: number };
          services: { current: number; limit: number };
          enquiries: { current: number; limit: number };
          teamSeats: { current: number; limit: number };
        };
      } | null;
    }>('/subscriptions/usage');
  }

  // Legacy alias
  getLawyerReviews(lawyerId: string) {
    return this.getProfessionalReviews(lawyerId);
  }

  createReview(data: { lawyerId: string; rating: number; comment?: string }) {
    return this.request<{
      review: {
        _id: string;
        lawyerId: string;
        clientId: { _id: string; firstName: string; lastName: string; avatar?: string };
        rating: number;
        comment?: string;
        createdAt: string;
      };
    }>('/reviews', { method: 'POST', body: data });
  }

  getMyReviews() {
    return this.request<{ reviews: Array<{
      _id: string;
      lawyerId: string;
      clientId: { _id: string; firstName: string; lastName: string };
      rating: number;
      comment?: string;
      createdAt: string;
    }> }>('/reviews/mine');
  }

  // ============================================
  // Documents
  // ============================================

  uploadDocument(formData: FormData) {
    return this.request<{ document: unknown }>('/documents', { method: 'POST', body: formData, isFormData: true });
  }

  getDocuments() {
    return this.request<{ count: number; documents: Array<{
      _id: string;
      userId: string;
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
      category?: string;
      sharedWith: string[];
      expiresAt?: string;
      createdAt: string;
    }> }>('/documents');
  }

  shareDocument(id: string, userId: string) {
    return this.request<{ message: string }>(`/documents/${id}/share`, { method: 'POST', body: { userId } });
  }

  // ============================================
  // Notifications
  // ============================================

  getNotifications() {
    return this.request<{
      notifications: Array<{
        _id: string;
        userId: string;
        title: string;
        message: string;
        type: 'info' | 'success' | 'warning' | 'error';
        read: boolean;
        actionUrl?: string;
        createdAt: string;
      }>;
      unreadCount: number;
    }>('/notifications');
  }

  markNotificationsRead(ids?: string[]) {
    return this.request<{ message: string }>('/notifications/mark-read', { method: 'PUT', body: { ids } });
  }

  // ============================================
  // Legal Documents
  // ============================================

  getActiveLegalDocuments() {
    return this.request<{ count: number; documents: Array<{
      _id: string;
      slug: string;
      title: string;
      content: string;
      version: string;
      isActive: boolean;
      category?: string;
      requiredForRoles: string[];
      createdAt: string;
      updatedAt: string;
    }> }>('/legal');
  }

  getLegalDocumentBySlug(slug: string) {
    return this.request<{
      _id: string;
      slug: string;
      title: string;
      content: string;
      version: string;
      isActive: boolean;
      category?: string;
      requiredForRoles: string[];
      createdAt: string;
      updatedAt: string;
    }>(`/legal/${slug}`);
  }

  acceptLegalDocument(slug: string) {
    return this.request<{ message: string; slug: string; version: string }>(`/legal/${slug}/accept`, { method: 'POST' });
  }

  getMyLegalAcceptances() {
    return this.request<{ count: number; acceptances: Array<{
      slug: string;
      version: string;
      acceptedAt: string;
    }> }>('/legal/acceptances/mine');
  }

  getLegalAcceptanceStatus() {
    return this.request<{ allAccepted: boolean; documents: Array<{
      slug: string;
      title: string;
      version: string;
      accepted: boolean;
    }> }>('/legal/acceptances/status');
  }

  // Admin - Legal Documents
  createLegalDocument(data: unknown) {
    return this.request<{ document: unknown }>('/legal/admin', { method: 'POST', body: data });
  }

  updateLegalDocument(id: string, data: unknown) {
    return this.request<{ document: unknown }>(`/legal/admin/${id}`, { method: 'PUT', body: data });
  }

  getAllLegalDocuments() {
    return this.request<{ count: number; documents: Array<{
      _id: string;
      slug: string;
      title: string;
      content: string;
      version: string;
      isActive: boolean;
      category?: string;
      requiredForRoles: string[];
      createdAt: string;
      updatedAt: string;
    }> }>('/legal/admin');
  }

  getLegalAcceptanceStats() {
    return this.request<{ stats: Array<{
      slug: string;
      title: string;
      totalUsers: number;
      acceptedCount: number;
      acceptanceRate: number;
    }> }>('/legal/admin/acceptance-stats');
  }

  // ============================================
  // Pro Bono (Public)
  // ============================================

  submitProBonoApplication(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    gender?: string;
    address: string;
    city: string;
    state: string;
    country?: string;
    employmentStatus: string;
    monthlyIncome?: number;
    dependantsCount: number;
    financialHardshipDetails: string;
    legalIssueCategory: string;
    legalIssueDescription: string;
    urgencyLevel: string;
    hasExistingLegalProceedings: boolean;
    existingProceedingsDetails?: string;
    supportingDocuments: Array<{
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
    }>;
    consentToShareInfo: boolean;
    consentToContact: boolean;
    declarationOfTruth: boolean;
  }) {
    return this.request<{ message: string; applicationId: string }>('/pro-bono/apply', { method: 'POST', body: data });
  }

  registerVolunteerLawyer(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    licenseType: string;
    licenseNumber: string;
    licensingBody: string;
    yearOfCall: number;
    jurisdiction: string;
    isCurrentlyPracticing: boolean;
    practiceAreas: string[];
    preferredCategories: string[];
    maxCasesPerMonth: number;
    availabilityHoursPerWeek: number;
    preferredConsultationModes: string[];
    languages: string[];
    commitmentLevel: string;
    willingToMentor: boolean;
    noDisciplinaryActions: boolean;
    noConflictsOfInterest: boolean;
    understandsProBonoObligations: boolean;
    professionalIndemnityInsurance: boolean;
  }) {
    return this.request<{ message: string; volunteerId: string }>('/pro-bono/volunteer', { method: 'POST', body: data });
  }

  getProBonoApplication(id: string) {
    return this.request<{ application: unknown }>(`/pro-bono/application/${id}`);
  }

  // ============================================
  // Pro Bono (Admin)
  // ============================================

  getAdminProBonoApplications(params?: { status?: string; category?: string; urgency?: string; page?: number; limit?: number }) {
    let url = '/pro-bono/admin/applications';
    const query: string[] = [];
    if (params?.status) query.push(`status=${encodeURIComponent(params.status)}`);
    if (params?.category) query.push(`category=${encodeURIComponent(params.category)}`);
    if (params?.urgency) query.push(`urgency=${encodeURIComponent(params.urgency)}`);
    if (params?.page) query.push(`page=${params.page}`);
    if (params?.limit) query.push(`limit=${params.limit}`);
    if (query.length > 0) url += `?${query.join('&')}`;
    return this.request<{ applications: Array<unknown>; pagination: { page: number; limit: number; total: number; pages: number } }>(url);
  }

  getAdminProBonoApplication(id: string) {
    return this.request<{ application: unknown }>(`/pro-bono/admin/applications/${id}`);
  }

  updateProBonoApplication(id: string, data: { status?: string; reviewNotes?: string; assignedVolunteerLawyer?: string; approvedScope?: unknown; rejectionReason?: string }) {
    return this.request<{ message: string; application: unknown }>(`/pro-bono/admin/applications/${id}`, { method: 'PUT', body: data });
  }

  getAdminVolunteerLawyers(params?: { status?: string; category?: string; page?: number; limit?: number }) {
    let url = '/pro-bono/admin/volunteers';
    const query: string[] = [];
    if (params?.status) query.push(`status=${encodeURIComponent(params.status)}`);
    if (params?.category) query.push(`category=${encodeURIComponent(params.category)}`);
    if (params?.page) query.push(`page=${params.page}`);
    if (params?.limit) query.push(`limit=${params.limit}`);
    if (query.length > 0) url += `?${query.join('&')}`;
    return this.request<{ volunteers: Array<unknown>; pagination: { page: number; limit: number; total: number; pages: number } }>(url);
  }

  getAdminVolunteerLawyer(id: string) {
    return this.request<{ volunteer: unknown }>(`/pro-bono/admin/volunteers/${id}`);
  }

  updateVolunteerLawyer(id: string, data: { status?: string; reviewNotes?: string }) {
    return this.request<{ message: string; volunteer: unknown }>(`/pro-bono/admin/volunteers/${id}`, { method: 'PUT', body: data });
  }

  getProBonoStats() {
    return this.request<{
      applications: { total: number; pending: number; approved: number; rejected: number };
      volunteers: { total: number; approved: number; pending: number };
      categories: Array<{ _id: string; count: number }>;
      urgency: Array<{ _id: string; count: number }>;
    }>('/pro-bono/admin/stats');
  }

  // ============================================
  // Fractional GC (Public)
  // ============================================

  // Client: Request fractional GC
  requestFractionalGC(data: {
    lawyerId: string;
    companyName: string;
    companyStage?: string;
    industry?: string;
    legalNeeds: string;
    budgetRange?: string;
    preferredStartDate?: string;
    message?: string;
  }) {
    return this.request<{ message: string; leadId: string }>('/fractional/request', { method: 'POST', body: data });
  }

  // Lawyer: Get fractional requests
  getFractionalRequests() {
    return this.request<{ count: number; leads: Array<unknown> }>('/fractional/requests');
  }

  // Lawyer: Create proposal
  createFractionalProposal(data: {
    leadId: string;
    monthlyRetainer: number;
    hoursPerMonth: number;
    engagementMonths: number;
    startDate: string;
    autoRenew: boolean;
    industries: string[];
    companyStages: string[];
    engagementType: string;
    scopeOfWork: string[];
    customScope?: string;
    paymentTerms: string;
    terminationNoticeDays: number;
    includesOutOfScopeRate: boolean;
    outOfScopeHourlyRate?: number;
    notes?: string;
  }) {
    return this.request<{ message: string; proposal: unknown }>('/fractional/proposals', { method: 'POST', body: data });
  }

  // Client: Get proposals
  getClientFractionalProposals() {
    return this.request<{ count: number; proposals: Array<unknown> }>('/fractional/proposals');
  }

  // Get single proposal
  getFractionalProposal(id: string) {
    return this.request<{ proposal: unknown }>(`/fractional/proposals/${id}`);
  }

  // Client: Accept proposal
  acceptFractionalProposal(id: string) {
    return this.request<{ message: string; authorizationUrl: string; reference: string }>(`/fractional/proposals/${id}/accept`, { method: 'POST' });
  }

  // Client: Reject proposal
  rejectFractionalProposal(id: string, clientNotes?: string) {
    return this.request<{ message: string }>(`/fractional/proposals/${id}/reject`, { method: 'POST', body: { clientNotes } });
  }

  // Lawyer: Get my proposals
  getLawyerFractionalProposals() {
    return this.request<{ count: number; proposals: Array<unknown> }>('/fractional/my-proposals');
  }

  // ============================================
  // Engagements
  // ============================================

  // Lawyer: Get my engagements
  getLawyerEngagements(params?: { status?: string; page?: number; limit?: number }) {
    let url = '/engagements/my-engagements';
    const query: string[] = [];
    if (params?.status) query.push(`status=${encodeURIComponent(params.status)}`);
    if (params?.page) query.push(`page=${params.page}`);
    if (params?.limit) query.push(`limit=${params.limit}`);
    if (query.length > 0) url += `?${query.join('&')}`;
    return this.request<{ engagements: Array<unknown>; pagination: { page: number; limit: number; total: number; pages: number } }>(url);
  }

  // Client: Get my engagements
  getClientEngagements(params?: { status?: string; page?: number; limit?: number }) {
    let url = '/engagements/client-engagements';
    const query: string[] = [];
    if (params?.status) query.push(`status=${encodeURIComponent(params.status)}`);
    if (params?.page) query.push(`page=${params.page}`);
    if (params?.limit) query.push(`limit=${params.limit}`);
    if (query.length > 0) url += `?${query.join('&')}`;
    return this.request<{ engagements: Array<unknown>; pagination: { page: number; limit: number; total: number; pages: number } }>(url);
  }

  // Get single engagement
  getEngagement(id: string) {
    return this.request<{ engagement: unknown }>(`/engagements/${id}`);
  }

  // Engagement stats
  getEngagementStats() {
    return this.request<{
      engagements: { total: number; active: number; paused: number; completed: number; terminated: number };
      hours: { totalLogged: number; utilizationRate: number };
      billing: { totalBilled: number; upcomingBillings: number };
    }>('/engagements/stats');
  }

  // Add hour entry
  addHourEntry(id: string, data: { date: string; hours: number; description: string; category: string }) {
    return this.request<{ message: string; engagement: unknown }>(`/engagements/${id}/hours`, { method: 'POST', body: data });
  }

  // Add meeting
  addMeeting(id: string, data: { date: string; duration: number; type: string; notes?: string; attendedBy?: string[] }) {
    return this.request<{ message: string; engagement: unknown }>(`/engagements/${id}/meetings`, { method: 'POST', body: data });
  }

  // Update engagement status
  updateEngagementStatus(id: string, data: { status: string; reason?: string }) {
    return this.request<{ message: string; engagement: unknown }>(`/engagements/${id}/status`, { method: 'PUT', body: data });
  }

  // Renew engagement
  renewEngagement(id: string, data: { additionalMonths: number }) {
    return this.request<{ message: string; engagement: unknown }>(`/engagements/${id}/renew`, { method: 'POST', body: data });
  }

  // Admin: Get all engagements
  getAdminEngagements(params?: { status?: string; lawyerId?: string; clientId?: string; page?: number; limit?: number }) {
    let url = '/engagements/admin';
    const query: string[] = [];
    if (params?.status) query.push(`status=${encodeURIComponent(params.status)}`);
    if (params?.lawyerId) query.push(`lawyerId=${encodeURIComponent(params.lawyerId)}`);
    if (params?.clientId) query.push(`clientId=${encodeURIComponent(params.clientId)}`);
    if (params?.page) query.push(`page=${params.page}`);
    if (params?.limit) query.push(`limit=${params.limit}`);
    if (query.length > 0) url += `?${query.join('&')}`;
    return this.request<{ engagements: Array<unknown>; pagination: { page: number; limit: number; total: number; pages: number } }>(url);
  }

  // Admin: Get single engagement
  getAdminEngagement(id: string) {
    return this.request<{ engagement: unknown }>(`/engagements/admin/${id}`);
  }

  // Admin: Update engagement
  updateAdminEngagement(id: string, data: { status?: string; notes?: string; autoRenew?: boolean; terminationNoticeDays?: number }) {
    return this.request<{ message: string; engagement: unknown }>(`/engagements/admin/${id}`, { method: 'PUT', body: data });
  }

  // Check engagement expiry
  checkEngagementExpiry() {
    return this.request<{ message: string; count: number }>('/engagements/check-expiry', { method: 'POST' });
  }

  // ============================================
  // Engagement Renewal
  // ============================================

  // Lawyer: Request renewal confirmation
  requestRenewalConfirmation(id: string) {
    return this.request<{ message: string }>(`/engagements/${id}/request-renewal`, { method: 'POST' });
  }

  // Client: Confirm/decline renewal
  confirmRenewal(id: string, action: 'confirm' | 'decline') {
    return this.request<{ message: string }>(`/engagements/${id}/confirm-renewal`, { method: 'POST', body: { action } });
  }

  // Update auto-renewal setting
  updateAutoRenew(id: string, autoRenew: boolean) {
    return this.request<{ message: string; engagement: unknown }>(`/engagements/${id}/auto-renew`, { method: 'PUT', body: { autoRenew } });
  }

  // Get renewal status
  getRenewalStatus(id: string) {
    return this.request<{
      autoRenew: boolean;
      endDate: string;
      daysUntilEnd: number;
      canRenew: boolean;
      lastRenewalStatus: unknown;
    }>(`/engagements/${id}/renewal-status`);
  }

  // ============================================
  // Analytics
  // ============================================

  // Lawyer Analytics
  getLawyerAnalytics() {
    return this.request<{
      revenue: {
        total: number;
        monthlyRecurring: number;
        thisMonth: number;
        lastMonth: number;
        growth: number;
        byMonth: Array<{ month: string; revenue: number }>;
      };
      engagements: {
        total: number;
        active: number;
        completed: number;
        terminated: number;
        newThisMonth: number;
        totalClients: number;
        activeClients: number;
        retentionRate: number;
      };
      hours: {
        totalLogged: number;
        thisMonth: number;
        capacity: number;
        utilization: number;
        byCategory: Record<string, number>;
      };
      proposals: {
        sent: number;
        accepted: number;
        rejected: number;
        pending: number;
        conversionRate: number;
      };
      topClients: Array<{ id: string; name: string; revenue: number; hours: number }>;
      recentActivity: Array<{ id: string; client: string; status: string; monthlyRetainer: number; lastActivity: string }>;
    }>('/analytics/lawyer');

  // Client Analytics
  getClientAnalytics() {
    return this.request<{
      engagements: {
        total: number;
        active: number;
        completed: number;
      };
      spending: {
        total: number;
        monthly: number;
      };
      hours: {
        total: number;
        byLawyer: Array<{ lawyer: string; hours: number; retainer: number }>;
      };
      engagements: Array<{
        id: string;
        lawyer: string;
        status: string;
        monthlyRetainer: number;
        hoursUsed: number;
        startDate: string;
        endDate: string;
      }>;
    }>('/analytics/client');

  // Admin Analytics
  getAdminAnalytics() {
    return this.request<{
      overview: {
        totalLawyers: number;
        verifiedLawyers: number;
        totalClients: number;
        totalEngagements: number;
        activeEngagements: number;
        totalProposals: number;
        acceptedProposals: number;
        totalRevenue: number;
        thisMonthRevenue: number;
      };
      charts: {
        revenueByMonth: Array<{ month: string; revenue: number }>;
        lawyersByStatus: Array<{ _id: string; count: number }>;
        proposalsByStatus: Array<{ _id: string; count: number }>;
        engagementsByStatus: Array<{ _id: string; count: number }>;
      };
      topLawyers: Array<{
        lawyerName: string;
        email: string;
        totalRevenue: number;
        engagementCount: number;
      }>;
      charts: {
        revenueByMonth: Array<{ month: string; revenue: number }>;
      };
      growth: {
        lawyersGrowth: number;
        clientsGrowth: number;
        revenueGrowth: number;
      };
    }>('/analytics/admin');

  // ============================================
  // Admin: Fractional Proposals
  // ============================================

  // Admin: Get fractional proposals
  getAdminFractionalProposals(params?: { status?: string; page?: number; limit?: number }) {
    let url = '/fractional/admin/proposals';
    const query: string[] = [];
    if (params?.status) query.push(`status=${encodeURIComponent(params.status)}`);
    if (params?.page) query.push(`page=${params.page}`);
    if (params?.limit) query.push(`limit=${params.limit}`);
    if (query.length > 0) url += `?${query.join('&')}`;
    return this.request<{ proposals: Array<unknown>; pagination: { page: number; limit: number; total: number; pages: number } }>(url);
  }

  // Admin: Get single fractional proposal
  getAdminFractionalProposal(id: string) {
    return this.request<{ proposal: unknown }>(`/fractional/admin/proposals/${id}`);
  }

  // Admin: Update fractional proposal
  updateAdminFractionalProposal(id: string, data: { status?: string; reviewNotes?: string }) {
    return this.request<{ message: string; proposal: unknown }>(`/fractional/admin/proposals/${id}`, { method: 'PUT', body: data });
  }

  // ============================================
  // Blog (public)
  // ============================================

  getBlogPosts(params?: { category?: string; page?: number; limit?: number }) {
    let url = '/blog';
    const query: string[] = [];
    if (params?.category) query.push(`category=${encodeURIComponent(params.category)}`);
    if (params?.page) query.push(`page=${params.page}`);
    if (params?.limit) query.push(`limit=${params.limit}`);
    if (query.length > 0) url += `?${query.join('&')}`;
    return this.request<{
      count: number;
      total: number;
      page: number;
      limit: number;
      pages: number;
      posts: Array<{
        _id: string;
        slug: string;
        title: string;
        excerpt: string;
        content: string;
        coverImage?: string;
        category?: string;
        tags: string[];
        author?: { firstName: string; lastName: string };
        publishedAt?: string;
        createdAt: string;
        updatedAt: string;
      }>;
    }>(url);
  }

  getBlogPost(slug: string) {
    return this.request<{
      _id: string;
      slug: string;
      title: string;
      excerpt: string;
      content: string;
      coverImage?: string;
      category?: string;
      tags: string[];
      author?: { firstName: string; lastName: string };
      publishedAt?: string;
      createdAt: string;
      updatedAt: string;
    }>(`/blog/${slug}`);
  }

  // Blog (admin)
  getAllBlogPosts() {
    return this.request<{ count: number; posts: Array<{
      _id: string;
      slug: string;
      title: string;
      excerpt: string;
      content: string;
      coverImage?: string;
      category?: string;
      tags: string[];
      author?: { firstName: string; lastName: string };
      publishedAt?: string;
      isPublished: boolean;
      createdAt: string;
      updatedAt: string;
    }> }>('/blog/admin/all');
  }

  createBlogPost(formData: FormData) {
    return this.request<{ post: unknown }>('/blog/admin', { method: 'POST', body: formData, isFormData: true });
  }

  updateBlogPost(id: string, formData: FormData) {
    return this.request<{ post: unknown }>(`/blog/admin/${id}`, { method: 'PUT', body: formData, isFormData: true });
  }

  deleteBlogPost(id: string) {
    return this.request<{ message: string }>(`/blog/admin/${id}`, { method: 'DELETE' });
  }
}

const api = new ApiClient();
export const PLATFORM_FEE_AMOUNT = 10000;
export default api;