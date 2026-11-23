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
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<{
      count: number;
      professionals: Array<{
        _id: string;
        userId: {
          _id: string;
          firstName: string;
          lastName: string;
          email: string;
          avatar?: string;
        };
        photo?: string;
        city: string;
        state: string;
        practiceAreas?: string[];
        specializations?: string[];
        verificationBadge: boolean;
        verificationStatus: 'pending' | 'verified' | 'rejected';
        rating: number;
        reviewCount: number;
        consultationFee: number;
        isAvailable: boolean;
        availableDays: string[];
        availableHours?: string;
        subscription?: { plan: string; status: string };
        category?: { key: string; label: string };
      }>;
    }>(`/professionals${query}`);
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