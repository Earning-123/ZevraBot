export type SubscriptionPhase = 'FREE_TRIAL' | 'ACTIVE_PAID' | 'EXPIRING_SOON' | 'EXPIRED';

export interface SubscriptionStatus {
  userId: string;
  phase: SubscriptionPhase;
  planName: string;
  isCompliant: boolean;
  cycleNumber: number; // 1 = first 3 months (Free), 2 = months 4-6 ($30), etc.
  isFirstThreeMonthsFree: boolean;
  startDate: number;
  currentPeriodEndsAt: number;
  daysRemaining: number;
  quarterlyPriceUsdt: 30;
  nextRenewalDate: number;
  safePositionProcedureTriggered: boolean;
}

export interface SubscriptionDistributionBreakdown {
  paymentId: string;
  amount: 30.00;
  level1Amount: number; // 23.33% = $7.00
  level2Amount: number; // 11.67% = $3.50
  level3Amount: number; // 11.67% = $3.50
  companyAmount: number; // 53.33% = $16.00
  currency: 'USDT';
  timestamp: number;
}

export interface WebhookEventRecord {
  eventId: string;
  provider: 'CRYPTO_MERCHANT_GATEWAY' | 'USDT_TRC20_PAYMENT' | 'WEB3_DIRECT';
  eventType: 'payment.completed' | 'payment.failed' | 'subscription.renewed';
  signatureVerified: boolean;
  idempotencyKey: string;
  payload: Record<string, unknown>;
  processedAt: number;
  status: 'PROCESSED' | 'REJECTED_SIGNATURE' | 'DUPLICATE_IGNORED';
}
