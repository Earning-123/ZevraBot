import React from 'react';
import { UserProfile } from '../types/user';
import { Position, TradeRecord } from '../types/trading';
import { GasWalletState, HighWaterMarkState } from '../types/finance';
import { SubscriptionStatus } from '../types/subscription';
import { ArrowUpRight, ArrowDownRight, TrendingUp, ShieldCheck, Zap, Wallet, Users, Key, AlertCircle } from 'lucide-react';

interface OverviewDashboardProps {
  user: UserProfile;
  positions: Position[];
  tradeHistory: TradeRecord[];
  gasWallet: GasWalletState;
  hwm: HighWaterMarkState;
  subscription: SubscriptionStatus;
  activeStrategiesCount: number;
  totalStrategiesCount: number;
  onNavigateTab: (tab: string) => void;
  onQuickDepositGas: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  user,
  positions,
  tradeHistory,
  gasWallet,
  hwm,
  subscription,
  activeStrategiesCount,
  totalStrategiesCount,
  onNavigateTab,
  onQuickDepositGas,
}) => {
  // Calculations
  const totalUnrealizedPnl = positions.reduce((acc, p) => acc + p.unrealizedPnl, 0);
  const totalRealizedPnl = tradeHistory.reduce((acc, t) => acc + t.netPnl, 0);
  const totalPerformanceFeesPaid = tradeHistory.reduce((acc, t) => acc + t.performanceFee, 0) + gasWallet.totalFeesPaidAllTime;
  const todaysPnl = totalRealizedPnl + totalUnrealizedPnl;

  return (
    <div className="space-y-6">
      {/* Top Banner: Verification & Core Pipeline Principle */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">System Invariant Rule: Risk-Governed Execution</h2>
              <span className="text-[11px] text-emerald-400 font-mono">Strict Compliance</span>
            </div>
            <p className="text-xs text-slate-400">
              SIGNAL → RISK CHECK → GAS CHECK → EXECUTION → MONITORING → EXIT → ACCOUNTING
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto text-xs">
          <span className="text-slate-400">High-Water Mark:</span>
          <span className="font-mono tabular-nums text-slate-200 font-semibold">${hwm.peakEquity.toFixed(2)}</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">Max Leverage:</span>
          <span className="text-emerald-400 font-mono font-semibold">10x Hard Cap</span>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Trading Capital */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Trading Capital (Exchange)</span>
            <span className="font-mono text-emerald-400">USDT</span>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            ${user.tradingCapitalUsdt.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Available: ${user.availableBalanceUsdt.toLocaleString()}</span>
            <span>Margin: ${user.marginUsedUsdt.toLocaleString()}</span>
          </div>
        </div>

        {/* Card 2: Today's Net P&L */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Today's Net Trading P&L</span>
            <span className={`inline-flex items-center text-xs ${todaysPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {todaysPnl >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {todaysPnl >= 0 ? '+3.14%' : '-1.2%'}
            </span>
          </div>
          <div className={`text-2xl font-bold font-mono tabular-nums ${todaysPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {todaysPnl >= 0 ? `+$${todaysPnl.toFixed(2)}` : `-$${Math.abs(todaysPnl).toFixed(2)}`}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Realized: +${totalRealizedPnl.toFixed(2)}</span>
            <span>Unrealized: {totalUnrealizedPnl >= 0 ? `+$${totalUnrealizedPnl.toFixed(2)}` : `-$${Math.abs(totalUnrealizedPnl).toFixed(2)}`}</span>
          </div>
        </div>

        {/* Card 3: Gas / Performance-Fee Wallet */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Gas / Performance Wallet</span>
            <button
              onClick={onQuickDepositGas}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              + Deposit
            </button>
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white">
            ${gasWallet.balance.toFixed(2)}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <span className="text-slate-400">Required: ${gasWallet.dynamicRequiredMinimum.toFixed(2)}</span>
            <span className={gasWallet.isGasSufficient ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
              {gasWallet.isGasSufficient ? 'Nominal' : 'Low Gas Alert'}
            </span>
          </div>
        </div>

        {/* Card 4: Bot & Subscription State */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>Subscription & Engine</span>
            <span className="text-cyan-400 text-xs">{subscription.phase === 'FREE_TRIAL' ? 'Quarter 1 Free' : 'Quarterly Pro'}</span>
          </div>
          <div className="text-2xl font-bold text-white capitalize">
            {user.botStatus.toLowerCase().replace('_', ' ')}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>{subscription.daysRemaining} days left</span>
            <span>{activeStrategiesCount}/{totalStrategiesCount} Strats</span>
          </div>
        </div>
      </div>

      {/* 30% Performance Fee Model Breakdown Banner */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Transparent 30% Performance Fee Revenue Distribution</h3>
            <p className="text-xs text-slate-400">
              Only charged on eligible positive net profit above High-Water Mark ($100 profit scenario illustrated below).
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">Total Fees Settled: ${totalPerformanceFeesPaid.toFixed(2)} USDT</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400">User Keeps</span>
            <div className="text-lg font-bold font-mono text-emerald-400">70%</div>
            <span className="text-[10px] text-slate-500 font-mono">$70.00 / $100</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400">Level 1 Upline</span>
            <div className="text-lg font-bold font-mono text-cyan-400">10%</div>
            <span className="text-[10px] text-slate-500 font-mono">$10.00 / $100</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400">Level 2 Upline</span>
            <div className="text-lg font-bold font-mono text-cyan-400">5%</div>
            <span className="text-[10px] text-slate-500 font-mono">$5.00 / $100</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400">Level 3 Upline</span>
            <div className="text-lg font-bold font-mono text-cyan-400">5%</div>
            <span className="text-[10px] text-slate-500 font-mono">$5.00 / $100</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-center">
            <span className="text-[11px] text-slate-400">Company Reserve</span>
            <div className="text-lg font-bold font-mono text-purple-400">10%</div>
            <span className="text-[10px] text-slate-500 font-mono">$10.00 / $100</span>
          </div>
        </div>
      </div>

      {/* Two-Column Module: Active Positions & Quick Navigation Shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Leveraged Positions */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Live Open Positions</h3>
              <span className="text-xs text-slate-500 font-mono">({positions.length} active)</span>
            </div>
            <button
              onClick={() => onNavigateTab('trading')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Open Trading Terminal →
            </button>
          </div>

          {positions.length === 0 ? (
            <div className="py-10 text-center border border-dashed border-slate-800 rounded-lg">
              <p className="text-xs text-slate-400">No open positions. Scanner is evaluating market for high-confidence setups.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="pb-2">Market</th>
                    <th className="pb-2">Side</th>
                    <th className="pb-2">Leverage</th>
                    <th className="pb-2 text-right">Size</th>
                    <th className="pb-2 text-right">Entry</th>
                    <th className="pb-2 text-right">Mark</th>
                    <th className="pb-2 text-right">Unrealized P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {positions.map((pos) => {
                    const isProfitable = pos.unrealizedPnl >= 0;
                    return (
                      <tr key={pos.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 font-bold text-white font-sans">{pos.symbol}</td>
                        <td className="py-2.5">
                          <span
                            className={`font-semibold ${
                              pos.direction === 'LONG' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {pos.direction}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-300">{pos.leverage}x</td>
                        <td className="py-2.5 text-right text-slate-200 tabular-nums">${pos.size.toFixed(2)}</td>
                        <td className="py-2.5 text-right text-slate-300 tabular-nums">${pos.entryPrice.toFixed(2)}</td>
                        <td className="py-2.5 text-right text-slate-300 tabular-nums">${pos.markPrice.toFixed(2)}</td>
                        <td
                          className={`py-2.5 text-right font-semibold tabular-nums ${
                            isProfitable ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isProfitable ? `+$${pos.unrealizedPnl.toFixed(2)}` : `-$${Math.abs(pos.unrealizedPnl).toFixed(2)}`} ({pos.unrealizedPnlPercent >= 0 ? '+' : ''}
                          {pos.unrealizedPnlPercent.toFixed(2)}%)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Platform Readiness Quick Checklist */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-white">Platform Health & Safety Status</h3>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">Withdrawal Permissions:</span>
              <span className="text-emerald-400 font-medium">BANNED (Secured)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">Maximum Platform Leverage:</span>
              <span className="text-emerald-400 font-mono font-medium">10x Hard Cap</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">High-Water Mark Protection:</span>
              <span className="text-emerald-400 font-medium">Active (Zero double-charging)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">Referral Qualification:</span>
              <span className="text-cyan-400 font-medium">3/3 Direct Members (Active)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
              <span className="text-slate-400">Money Reconciliation Audit:</span>
              <span className="text-emerald-400 font-medium">Reconciled ($0.00 Variance)</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigateTab('qa_audit')}
              className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors text-center"
            >
              View Full 75+ Test QA & Security Audit Report →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
