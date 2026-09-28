import { SubscriptionDistributionBreakdown, SubscriptionStatus, WebhookEventRecord } from '../types/subscription';
import { CryptoService } from './crypto';

export class SubscriptionEngine {
  private subscriptionStates: Map<string, SubscriptionStatus> = new Map();
  private processedWebhookEvents: Map<string, WebhookEventRecord> = new Map();
  private distributions: SubscriptionDistributionBreakdown[] = [];

  constructor() {
    // Initial user status: in first 3 months free trial
    const now = Date.now();
    const trialEnd = now + 65 * 86400000; // 65 days remaining in 90-day free trial

    this.subscriptionStates.set('usr_default_01', {
      userId: 'usr_default_01',
      phase: 'FREE_TRIAL',
      planName: 'Institutional Free Quarter (First 3 Months)',
      isCompliant: true,
      cycleNumber: 1,
      isFirstThreeMonthsFree: true,
      startDate: now - 25 * 86400000,
      currentPeriodEndsAt: trialEnd,
      daysRemaining: 65,
      quarterlyPriceUsdt: 30,
      nextRenewalDate: trialEnd,
      safePositionProcedureTriggered: false,
    });
  }

  public getStatus(userId: string): SubscriptionStatus {
    let sub = this.subscriptionStates.get(userId);
    if (!sub) {
      const now = Date.now();
      const trialEnd = now + 90 * 86400000;
      sub = {
        userId,
        phase: 'FREE_TRIAL',
        planName: 'Institutional Free Quarter (First 3 Months)',
        isCompliant: true,
        cycleNumber: 1,
        isFirstThreeMonthsFree: true,
        startDate: now,
        currentPeriodEndsAt: trialEnd,
        daysRemaining: 90,
        quarterlyPriceUsdt: 30,
        nextRenewalDate: trialEnd,
        safePositionProcedureTriggered: false,
      };
      this.subscriptionStates.set(userId, sub);
    }
    return { ...sub };
  }

  public getDistributions(): SubscriptionDistributionBreakdown[] {
    return [...this.distributions];
  }

  /**
   * Calculates expiry notification level
   */
  public getNotificationLadder(daysRemaining: number): { shouldNotify: boolean; level?: string; message?: string } {
    if (daysRemaining === 30) {
      return { shouldNotify: true, level: '30_DAYS', message: 'Your ZevraBot 3-month cycle renews in 30 days.' };
    } else if (daysRemaining === 15) {
      return { shouldNotify: true, level: '15_DAYS', message: 'Reminder: 15 days remaining on your active subscription.' };
    } else if (daysRemaining === 7) {
      return { shouldNotify: true, level: '7_DAYS', message: 'Notice: 7 days remaining. Renew now to prevent automated strategy interruption.' };
    } else if (daysRemaining === 3) {
      return { shouldNotify: true, level: '3_DAYS', message: 'Urgent: 3 days remaining before trading halts.' };
    } else if (daysRemaining <= 1) {
      return { shouldNotify: true, level: '1_DAY', message: 'Final warning: 24 hours remaining on your subscription.' };
    }
    return { shouldNotify: false };
  }

  /**
   * Secure Server-Side Webhook Processor:
   * Validates HMAC signature, checks idempotency key, prevents replay attacks,
   * activates subscription, and splits $30 revenue according to formula:
   * L1: 23.33% ($7.00), L2: 11.67% ($3.50), L3: 11.67% ($3.50), Company: 53.33% ($16.00).
   */
  public processPaymentWebhook(payload: {
    eventId: string;
    idempotencyKey: string;
    userId: string;
    amount: number;
    signature: string;
    timestamp: number;
  }): { success: boolean; error?: string; breakdown?: SubscriptionDistributionBreakdown } {
    const { eventId, idempotencyKey, userId, amount, signature } = payload;

    // 1. Idempotency & Replay Check
    if (this.processedWebhookEvents.has(idempotencyKey) || this.processedWebhookEvents.has(eventId)) {
      return {
        success: false,
        error: 'IDEMPOTENCY_VIOLATION: Duplicate webhook payment event already processed. Replay rejected.',
      };
    }

    // 2. HMAC Signature Verification
    const isSignatureValid = CryptoService.verifyHmacSignature(
      JSON.stringify({ eventId, userId, amount }),
      signature,
      'zevrabot_webhook_hmac_secret_key'
    );

    if (!isSignatureValid) {
      this.processedWebhookEvents.set(idempotencyKey, {
        eventId,
        provider: 'CRYPTO_MERCHANT_GATEWAY',
        eventType: 'payment.failed',
        signatureVerified: false,
        idempotencyKey,
        payload,
        processedAt: Date.now(),
        status: 'REJECTED_SIGNATURE',
      });
      return {
        success: false,
        error: 'CRYPTOGRAPHIC_REJECTION: Invalid HMAC-SHA256 webhook signature. Potential tampering.',
      };
    }

    // 3. Amount Verification ($30 quarterly price)
    if (amount < 30.0) {
      return {
        success: false,
        error: `INVALID_AMOUNT: Expected $30.00 USDT, received $${amount.toFixed(2)}.`,
      };
    }

    // 4. Exact Basis-Point Decimal Distribution
    // $30.00 total:
    // L1: 23.33% = $7.00
    // L2: 11.67% = $3.50
    // L3: 11.67% = $3.50
    // Company: 53.33% = $16.00
    // Sum: 7.00 + 3.50 + 3.50 + 16.00 = 30.00 (100.00%)
    const breakdown: SubscriptionDistributionBreakdown = {
      paymentId: `sub_pay_${Date.now()}`,
      amount: 30.0,
      level1Amount: 7.0, // 23.33%
      level2Amount: 3.5, // 11.67%
      level3Amount: 3.5, // 11.67%
      companyAmount: 16.0, // 53.33%
      currency: 'USDT',
      timestamp: Date.now(),
    };
    this.distributions.unshift(breakdown);

    // 5. Update Subscription Lifecycle
    const sub = this.getStatus(userId);
    const newEnd = Math.max(Date.now(), sub.currentPeriodEndsAt) + 90 * 86400000;
    sub.phase = 'ACTIVE_PAID';
    sub.planName = `Quarterly Pro Tier (Cycle ${sub.cycleNumber + 1})`;
    sub.cycleNumber += 1;
    sub.currentPeriodEndsAt = newEnd;
    sub.daysRemaining = Math.round((newEnd - Date.now()) / 86400000);
    sub.nextRenewalDate = newEnd;
    sub.isCompliant = true;
    sub.safePositionProcedureTriggered = false;
    this.subscriptionStates.set(userId, sub);

    // Record webhook event
    this.processedWebhookEvents.set(idempotencyKey, {
      eventId,
      provider: 'CRYPTO_MERCHANT_GATEWAY',
      eventType: 'payment.completed',
      signatureVerified: true,
      idempotencyKey,
      payload,
      processedAt: Date.now(),
      status: 'PROCESSED',
    });

    return { success: true, breakdown };
  }

  /**
   * Safe position procedure when subscription lapses:
   * Do NOT panic dump or market liquidate. Enable trailing stop protection and
   * prevent new orders while safely winding down risk.
   */
  public handleSubscriptionExpiry(userId: string): { actionTaken: string; safeProcedureActive: boolean } {
    const sub = this.getStatus(userId);
    sub.phase = 'EXPIRED';
    sub.isCompliant = false;
    sub.safePositionProcedureTriggered = true;
    this.subscriptionStates.set(userId, sub);

    return {
      actionTaken:
        'SAFE POSITION PROTOCOL ENGAGED: Automated new trade intake disabled. Existing open positions locked with tight trailing stop protection. No forced liquidation.',
      safeProcedureActive: true,
    };
  }
}
