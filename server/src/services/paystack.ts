import axios, { AxiosInstance } from 'axios';

export interface PaystackConfig {
  secretKey: string;
  publicKey: string;
  webhookSecret: string;
}

export interface PaystackCustomer {
  id: number;
  email: string;
  customer_code: string;
  risk_action: string;
  metadata: Record<string, unknown>;
}

export interface PaystackPlan {
  id: number;
  name: string;
  plan_code: string;
  amount: number;
  interval: 'daily' | 'weekly' | 'monthly' | 'annually';
  currency: string;
}

export interface PaystackSubscription {
  id: number;
  customer: PaystackCustomer;
  plan: PaystackPlan;
  subscription_code: string;
  email_token: string;
  status: 'active' | 'cancelled' | 'expired' | 'paused';
  start_date: string;
  next_payment_date: string;
  amount: number;
  currency: string;
  is_direct_debit: boolean;
  next_payment_attempt: string;
}

export interface InitializeTransactionParams {
  email: string;
  amount: number; // in kobo
  currency?: 'NGN' | 'GHS' | 'ZAR' | 'USD';
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
  channels?: ('card' | 'bank' | 'ussd' | 'qr' | 'mobile_money' | 'bank_transfer')[];
  plan?: string; // plan_code for subscription
  invoice_limit?: number;
}

export interface InitializeTransactionResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface VerifyTransactionResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    reference: string;
    amount: number;
    currency: string;
    status: 'success' | 'failed' | 'abandoned';
    paid_at: string;
    channel: string;
    metadata: Record<string, unknown>;
    customer: PaystackCustomer;
    plan?: PaystackPlan;
    subscription?: PaystackSubscription;
  };
}

export interface WebhookEvent {
  event: string;
  data: Record<string, unknown>;
}

export class PaystackService {
  private client: AxiosInstance;
  private config: PaystackConfig;

  constructor(config: PaystackConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: 'https://api.paystack.co',
      headers: {
        Authorization: `Bearer ${config.secretKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  // Customer Management
  async createCustomer(email: string, metadata: Record<string, unknown> = {}): Promise<PaystackCustomer> {
    const response = await this.client.post<{ status: boolean; data: PaystackCustomer }>('/customer', {
      email,
      metadata,
    });
    return response.data.data;
  }

  async getCustomer(customerCode: string): Promise<PaystackCustomer> {
    const response = await this.client.get<{ status: boolean; data: PaystackCustomer }>(`/customer/${customerCode}`);
    return response.data.data;
  }

  async updateCustomer(customerCode: string, data: Record<string, unknown>): Promise<PaystackCustomer> {
    const response = await this.client.put<{ status: boolean; data: PaystackCustomer }>(`/customer/${customerCode}`, data);
    return response.data.data;
  }

  // Plan Management
  async createPlan(planData: {
    name: string;
    amount: number;
    interval: 'daily' | 'weekly' | 'monthly' | 'annually';
    description?: string;
    currency?: 'NGN' | 'GHS' | 'ZAR' | 'USD';
  }): Promise<PaystackPlan> {
    const response = await this.client.post<{ status: boolean; data: PaystackPlan }>('/plan', planData);
    return response.data.data;
  }

  async getPlan(planCode: string): Promise<PaystackPlan> {
    const response = await this.client.get<{ status: boolean; data: PaystackPlan }>(`/plan/${planCode}`);
    return response.data.data;
  }

  async listPlans(active?: boolean): Promise<PaystackPlan[]> {
    const response = await this.client.get<{ status: boolean; data: PaystackPlan[] }>('/plan', {
      params: { perPage: 100, active },
    });
    return response.data.data;
  }

  // Subscription Management
  async createSubscription(email: string, planCode: string, authorizationCode?: string): Promise<PaystackSubscription> {
    const response = await this.client.post<{ status: boolean; data: PaystackSubscription }>('/subscription', {
      customer: email,
      plan: planCode,
      authorization: authorizationCode,
    });
    return response.data.data;
  }

  async getSubscription(subscriptionCode: string): Promise<PaystackSubscription> {
    const response = await this.client.get<{ status: boolean; data: PaystackSubscription }>(`/subscription/${subscriptionCode}`);
    return response.data.data;
  }

  async cancelSubscription(subscriptionCode: string, code: string): Promise<{ status: boolean; message: string }> {
    const response = await this.client.post<{ status: boolean; message: string }>(`/subscription/${subscriptionCode}/cancel`, { code });
    return response.data;
  }

  async enableSubscription(subscriptionCode: string, code: string): Promise<{ status: boolean; message: string }> {
    const response = await this.client.post<{ status: boolean; message: string }>(`/subscription/${subscriptionCode}/enable`, { code });
    return response.data;
  }

  // Transaction Management
  async initializeTransaction(params: InitializeTransactionParams): Promise<InitializeTransactionResponse> {
    const response = await this.client.post<InitializeTransactionResponse>('/transaction/initialize', params);
    return response.data;
  }

  async verifyTransaction(reference: string): Promise<VerifyTransactionResponse> {
    const response = await this.client.get<VerifyTransactionResponse>(`/transaction/verify/${encodeURIComponent(reference)}`);
    return response.data;
  }

  async chargeAuthorization(authorizationCode: string, amount: number, email: string, reference?: string): Promise<VerifyTransactionResponse> {
    const response = await this.client.post<VerifyTransactionResponse>('/transaction/charge_authorization', {
      authorization_code: authorizationCode,
      amount,
      email,
      reference,
    });
    return response.data;
  }

  // Webhook Verification
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto');
    const hash = crypto.createHmac('sha512', this.config.webhookSecret).update(payload).digest('hex');
    return hash === signature;
  }

  // Utility
  amountToKobo(amount: number): number {
    return Math.round(amount * 100);
  }

  koboToAmount(kobo: number): number {
    return kobo / 100;
  }
}

// Singleton instance
let paystackInstance: PaystackService | null = null;

export function getPaystackService(): PaystackService {
  if (!paystackInstance) {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const publicKey = process.env.PAYSTACK_PUBLIC_KEY;
    const webhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;

    if (!secretKey || !publicKey || !webhookSecret) {
      throw new Error('Paystack configuration missing. Check environment variables.');
    }

    paystackInstance = new PaystackService({
      secretKey,
      publicKey,
      webhookSecret,
    });
  }
  return paystackInstance;
}