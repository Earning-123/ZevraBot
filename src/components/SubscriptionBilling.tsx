import React, { useState } from 'react';
import { SubscriptionDistributionBreakdown, SubscriptionStatus } from '../types/subscription';
import { ShieldCheck, Calendar, CreditCard, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface SubscriptionBillingProps {
  status: SubscriptionStatus;
  distributions: SubscriptionDistributionBreakdown[];
  onSimulateWebhookPayment: () => Promise<{ success: boolean; error?: string; breakdown?: SubscriptionDistributionBreakdown }>;
}

export const SubscriptionBilling: React.FC<SubscriptionBillingProps> = ({
  status,
  distributions,
  onSimulateWebhookPayment,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handlePayRenewal = async () => {
    setIsProcessing(true);
    setPaymentNotice(null);

    const res = await onSimulateWebhookPayment();
    setIsProcessing(false);

    if (res.success) {
      setPaymentNotice({
        message: 'Payment verified server-side via HMAC webhook! 90-day subscription active and referral shares settled.',
        type: 'success',
      });
    } else {
      setPaymentNotice({
        message: res.error || 'Payment webhook verification failed.',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Subscription Economics */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              Subscription Lifecycle & Quarterly Renewal Model
              <span className="text-[10px] text-cyan-400 font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                {status.phase.replace('_', ' ')}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Cycle rule: First 3 Months FREE · Every following 3 Months $30 USDT. Server-side cryptographically signed webhook confirmation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Days Remaining</span>
            <span className="text-emerald-400 text-base font-bold tabular-nums">{status.daysRemaining} Days</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-500 block text-[10px]">Quarterly Fee</span>
            <span className="text-white text-base font-bold tabular-nums">$30.00 USDT</span>
          </div>
        </div>
      </div>

      {/* Plan Details & Webhook Simulator Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan Card */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Current Active Plan</h3>
            <span className="text-xs font-mono text-emerald-400 font-semibold">Active</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-xs font-bold text-white font-sans">{status.planName}</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {status.isFirstThreeMonthsFree ? 'FREE' : '$30.00 / 3 Months'}
            </div>
            <p className="text-xs text-slate-400">
              {status.isFirstThreeMonthsFree
                ? 'Your account is currently benefiting from the complimentary 90-day institutional onboarding period.'
                : 'Quarterly enterprise maintenance and strategy hosting package.'}
            </p>
          </div>

          {paymentNotice && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                paymentNotice.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-800 text-rose-300'
              }`}
            >
              {paymentNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{paymentNotice.message}</span>
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={handlePayRenewal}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>{isProcessing ? 'Verifying HMAC Webhook...' : 'Simulate $30 Quarterly Renewal Payment'}</span>
            </button>
          </div>
        </div>

        {/* 4-Way $30 Subscription Revenue Distribution Model */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Exact $30 Quarterly Subscription Distribution</h3>
              <p className="text-xs text-slate-400">
                Calculated to exact basis-points without rounding discrepancies (100.00% audit total).
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400">Sum = $30.00</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400">Level 1 Upline</span>
              <div className="text-xl font-bold font-mono text-cyan-400">23.33%</div>
              <span className="text-xs font-mono text-slate-200 font-semibold">$7.00 USDT</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400">Level 2 Upline</span>
              <div className="text-xl font-bold font-mono text-cyan-400">11.67%</div>
              <span className="text-xs font-mono text-slate-200 font-semibold">$3.50 USDT</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400">Level 3 Upline</span>
              <div className="text-xl font-bold font-mono text-cyan-400">11.67%</div>
              <span className="text-xs font-mono text-slate-200 font-semibold">$3.50 USDT</span>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400">Company Revenue</span>
              <div className="text-xl font-bold font-mono text-purple-400">53.33%</div>
              <span className="text-xs font-mono text-slate-200 font-semibold">$16.00 USDT</span>
            </div>
          </div>

          {/* Expiry Ladder & Position Safety Procedure Notice */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <span className="font-semibold text-white block">Pre-Expiry Notification Ladder:</span>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">30 Days (Notice)</span>
              <span>→</span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">15 Days (Reminder)</span>
              <span>→</span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-amber-300">7 Days (Warning)</span>
              <span>→</span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-amber-400">3 Days (Urgent)</span>
              <span>→</span>
              <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-rose-400">24 Hours (Final)</span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Position Safety Guarantee: If a subscription lapses, existing leveraged positions are NOT blindly dumped into illiquid markets. Tight trailing stop protections are locked in while preventing new entries.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
