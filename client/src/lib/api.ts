const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  isFormData?: boolean;
}

class ApiClient {
  private async request<T>(endpoint: string, options: ApiOptions = {}, attempt = 1): Promise<T> {
    const { method = 'GET', body, headers = {}, isFormData = false } = options;

    const config: RequestInit = {
      method,
      credentials: 'include' as RequestCredentials,
      headers: { ...headers },
    };

    if (body && !isFormData) {
      config.headers = {
        ...config.headers,
        'Content-Type': 'application/json',
      };
      config.body = JSON.stringify(body);
    } else if (body && isFormData) {
      config.body = body;
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);

    if (!response.ok) {
      if (response.status === 401 && attempt === 1) {
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

  refresh() {
    return this.request<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      method: 'POST',
    }, 2);
  }

  getMe() {
    return this.request<{ user: any; profile?: any }>('/auth/me');
  }

  // Auth
  register(data: any) {
    return this.request<{ _id: string; role: string; message?: string }>('/auth/register', {
      method: 'POST',
      body: data,
    });
  }

  login(data: any) {
    return this.request<{ _id: string; role: string }>('/auth/login', {
      method: 'POST',
      body: data,
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
    return this.request<{ message: string }>('/auth/logout', { method: 'POST' });
  }

  // Lawyers
  getLawyers(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request<{ count: number; lawyers: any[] }>(`/lawyers${query}`);
  }

  getLawyersList() {
    return this.request<any[]>('/lawyers/list');
  }

  getLawyerById(id: string) {
    return this.request<any>(`/lawyers/${id}`);
  }

  updateLawyerProfile(data: any) {
    return this.request<any>('/lawyers/profile', { method: 'PUT', body: data });
  }

  submitVerification(data: any) {
    return this.request<any>('/lawyers/verify', { method: 'POST', body: data });
  }

  uploadVerificationDocs(formData: FormData) {
    return this.request<any>('/lawyers/verify-upload', {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  }

  // Leads
  createLead(data: any) {
    return this.request<any>('/leads', { method: 'POST', body: data });
  }

  respondToLead(id: string, status: string) {
    return this.request<any>(`/leads/${id}/respond`, { method: 'PUT', body: { status } });
  }

  getLeads() {
    return this.request<{ count: number; leads: any[] }>('/leads');
  }

  getMyEnquiries() {
    return this.request<{ count: number; leads: any[] }>('/leads/my-enquiries');
  }

  bookConsultation(id: string, data: any) {
    return this.request<any>(`/leads/${id}/book`, { method: 'POST', body: data });
  }

  // Payments
  initializePayment(data: any) {
    return this.request<any>('/payments/initialize', { method: 'POST', body: data });
  }

  verifyPayment(data: any) {
    return this.request<any>('/payments/verify', { method: 'POST', body: data });
  }

  acceptOnboardingAgreement() {
    return this.request<any>('/lawyers/onboarding/accept', { method: 'POST' });
  }

  uploadPhoto(formData: FormData) {
    return this.request<any>('/lawyers/upload-photo', {
      method: 'POST',
      body: formData,
      isFormData: true,
    });
  }

  submitDeclaration(data: any) {
    return this.request<any>('/lawyers/declaration', { method: 'POST', body: data });
  }

  // Appointments
  getMyAppointments() {
    return this.request<any>('/appointments/my-appointments');
  }

  // Admin
  getPendingVerifications() {
    return this.request<{ count: number; lawyers: any[] }>(
      '/admin/lawyers/pending',
    );
  }

  verifyLawyer(id: string, status: string) {
    return this.request<any>(`/admin/lawyers/${id}/verify`, { method: 'PUT', body: { status } });
  }

  getLawyerProfile(id: string) {
    return this.request<any>(`/admin/lawyers/${id}`);
  }

  getAdminUsers() {

    return this.request<{ count: number; users: any[] }>("/admin/users");
  }

  toggleUserStatus(id: string) {
    return this.request<any>(`/admin/users/${id}/toggle-status`, { method: 'PUT' });
  }

  getAnalytics() {
    return this.request<any>('/admin/analytics');
  }

  // Documents
  uploadDocument(formData: FormData) {
    return this.request<any>('/documents', { method: 'POST', body: formData, isFormData: true });
  }

  getDocuments() {
    return this.request<{ count: number; documents: any[] }>('/documents');
  }

  shareDocument(id: string, userId: string) {
    return this.request<any>(`/documents/${id}/share`, { method: 'POST', body: { userId } });
  }

  // Legal Documents
  getActiveLegalDocuments() {
    return this.request<{ count: number; documents: any[] }>('/legal');
  }

  getLegalDocumentBySlug(slug: string) {
    return this.request<any>(`/legal/${slug}`);
  }

  acceptLegalDocument(slug: string) {
    return this.request<{ message: string; slug: string; version: string }>(`/legal/${slug}/accept`, { method: 'POST' });
  }

  getMyLegalAcceptances() {
    return this.request<{ count: number; acceptances: any[] }>('/legal/acceptances/mine');
  }

  getLegalAcceptanceStatus() {
    return this.request<{ allAccepted: boolean; documents: any[] }>('/legal/acceptances/status');
  }

  // Admin - Legal Documents
  createLegalDocument(data: any) {
    return this.request<any>('/legal/admin', { method: 'POST', body: data });
  }

  updateLegalDocument(id: string, data: any) {
    return this.request<any>(`/legal/admin/${id}`, { method: 'PUT', body: data });
  }

  getAllLegalDocuments() {
    return this.request<{ count: number; documents: any[] }>('/legal/admin');
  }

  getLegalAcceptanceStats() {
    return this.request<{ stats: any[] }>('/legal/admin/acceptance-stats');
  }
}

const api = new ApiClient();
export const PLATFORM_FEE_AMOUNT = 10000;
export default api;
