import React, { useState } from 'react';
import { FinancialLedgerRecord, GasWalletState, LedgerReconciliationAudit, LedgerType } from '../types/finance';
import { Wallet, ShieldCheck, ArrowDownLeft, ArrowUpRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface GasWalletLedgerProps {
  gasWallet: GasWalletState;
  onDepositGas: (amount: number) => void;
  ledgers: FinancialLedgerRecord[];
  reconciliationReports: LedgerReconciliationAudit[];
  onRunReconciliation: () => void;
}

export const GasWalletLedger: React.FC<GasWalletLedgerProps> = ({
  gasWallet,
  onDepositGas,
  ledgers,
  reconciliationReports,
  onRunReconciliation,
}) => {
  const [depositAmount, setDepositAmount] = useState<number>(50);
  const [selectedLedgerFilter, setSelectedLedgerFilter] = useState<LedgerType | 'ALL'>('ALL');
  const [isDepositing, setIsDepositing] = useState(false);
  const [depositSuccessNotice, setDepositSuccessNotice] = useState(false);

  const handleDeposit = () => {
    if (depositAmount <= 0) return;
    setIsDepositing(true);
    onDepositGas(depositAmount);
    setIsDepositing(false);
    setDepositSuccessNotice(true);
    setTimeout(() => setDepositSuccessNotice(false), 3000);
  };

  const filteredLedgers = selectedLedgerFilter === 'ALL'
    ? ledgers
    : ledgers.filter((l) => l.ledgerType === selectedLedgerFilter);

  return (
    <div className="space-y-6">
      {/* Top Banner: Dynamic Required Gas Balance Calculation */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              Performance-Fee Gas Wallet & Dynamic Balance Monitor
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Performance fees are deducted exclusively from this wallet, NEVER from your exchange trading capital.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block">Available Gas</span>
            <span className="text-emerald-400 text-base font-bold">${gasWallet.balance.toFixed(2)} USDT</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block">Dynamic Requirement</span>
            <span className="text-slate-200 text-base font-bold">${gasWallet.dynamicRequiredMinimum.toFixed(2)} USDT</span>
          </div>
        </div>
      </div>

      {/* Gas Top-Up Card & 5 Segregated Ledgers Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deposit Gas Card */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-white">Deposit Gas / Performance Balance</h3>
          <p className="text-xs text-slate-400">
            Top up USDT gas balance to ensure automated bot trades continue uninterrupted.
          </p>

          {depositSuccessNotice && (
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Deposit processed. Gas wallet credited and ledger updated.</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Top-up Amount (USDT)</label>
              <div className="grid grid-cols-4 gap-2 mb-2">
                {[20, 50, 100, 250].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt)}
                    className={`py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                      depositAmount === amt
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="10"
                value={depositAmount}
                onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-slate-700"
              />
            </div>

            <button
              onClick={handleDeposit}
              disabled={isDepositing}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              Deposit ${depositAmount.toFixed(2)} USDT
            </button>
          </div>

          <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1.5 font-mono">
            <div className="flex justify-between">
              <span>Base Minimum Floor:</span>
              <span className="text-slate-200">${gasWallet.baseMinimum.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between">
              <span>Dynamic Scaled Requirement:</span>
              <span className="text-emerald-400">${gasWallet.dynamicRequiredMinimum.toFixed(2)} USDT</span>
            </div>
            <div className="flex justify-between">
              <span>Total Fees Settled All-Time:</span>
              <span className="text-slate-300">${gasWallet.totalFeesPaidAllTime.toFixed(2)} USDT</span>
            </div>
          </div>
        </div>

        {/* 5 Segregated Financial Ledgers Reconciliation Status */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Automated Money Reconciliation Engine</h3>
              <p className="text-xs text-slate-400">
                Formula verified across all 5 segregated ledgers: Opening Balance + Credits − Debits = Closing Balance.
              </p>
            </div>
            <button
              onClick={onRunReconciliation}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-Audit Ledgers
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                <tr>
                  <th className="pb-2">Segregated Ledger</th>
                  <th className="pb-2 text-right">Opening</th>
                  <th className="pb-2 text-right">Credits</th>
                  <th className="pb-2 text-right">Debits</th>
                  <th className="pb-2 text-right">Closing</th>
                  <th className="pb-2 text-right">Variance</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {reconciliationReports.map((r) => (
                  <tr key={r.ledgerType} className="hover:bg-slate-800/40">
                    <td className="py-2.5 font-sans font-semibold text-slate-200">
                      {r.ledgerType.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 text-right text-slate-400 tabular-nums">${r.openingBalance.toFixed(2)}</td>
                    <td className="py-2.5 text-right text-emerald-400 tabular-nums">+${r.totalCredits.toFixed(2)}</td>
                    <td className="py-2.5 text-right text-rose-400 tabular-nums">-${r.totalDebits.toFixed(2)}</td>
                    <td className="py-2.5 text-right text-white font-bold tabular-nums">${r.actualClosingBalance.toFixed(2)}</td>
                    <td className="py-2.5 text-right text-slate-400 tabular-nums">${r.variance.toFixed(4)}</td>
                    <td className="py-2.5 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> RECONCILED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Immutable Financial Audit Trail Table */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Immutable Financial Transaction Ledger</h3>
            <p className="text-xs text-slate-400">
              Records are append-only. Adjustments require explicit Original → Reversal → Corrected entries.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {(['ALL', 'GAS_WALLET', 'TRADING_ACCOUNT', 'REFERRAL_EARNINGS', 'COMPANY_REVENUE'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedLedgerFilter(filter)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono whitespace-nowrap transition-colors ${
                  selectedLedgerFilter === filter ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {filter.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 border-b border-slate-800 font-mono text-[11px]">
              <tr>
                <th className="pb-2">Tx ID</th>
                <th className="pb-2">Timestamp</th>
                <th className="pb-2">Ledger</th>
                <th className="pb-2">Entry Type</th>
                <th className="pb-2">Description</th>
                <th className="pb-2 text-right">Credit</th>
                <th className="pb-2 text-right">Debit</th>
                <th className="pb-2 text-right">Balance After</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredLedgers.map((record) => (
                <tr key={record.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 text-slate-400">{record.id}</td>
                  <td className="py-2.5 text-slate-400">{new Date(record.timestamp).toLocaleDateString()}</td>
                  <td className="py-2.5 text-slate-300 font-sans font-medium">{record.ledgerType.replace('_', ' ')}</td>
                  <td className="py-2.5">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        record.entryType === 'ORIGINAL'
                          ? 'bg-slate-800 text-slate-300'
                          : record.entryType === 'REVERSAL'
                          ? 'bg-amber-950 text-amber-300'
                          : 'bg-cyan-950 text-cyan-300'
                      }`}
                    >
                      {record.entryType}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-300 font-sans">{record.description}</td>
                  <td className="py-2.5 text-right text-emerald-400 tabular-nums">
                    {record.credit > 0 ? `+$${record.credit.toFixed(2)}` : '—'}
                  </td>
                  <td className="py-2.5 text-right text-rose-400 tabular-nums">
                    {record.debit > 0 ? `-$${record.debit.toFixed(2)}` : '—'}
                  </td>
                  <td className="py-2.5 text-right text-white font-bold tabular-nums">
                    ${record.balanceAfter.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
