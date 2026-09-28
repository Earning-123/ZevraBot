import { FinancialLedgerRecord, LedgerEntryType, LedgerReconciliationAudit, LedgerType } from '../types/finance';

export class LedgerEngine {
  private records: FinancialLedgerRecord[] = [];
  private openingBalances: Map<LedgerType, number> = new Map([
    ['TRADING_ACCOUNT', 25000.0],
    ['GAS_WALLET', 120.0],
    ['REFERRAL_EARNINGS', 0.0],
    ['SUBSCRIPTION_LEDGER', 0.0],
    ['COMPANY_REVENUE', 5000.0],
  ]);

  constructor() {
    // Seed initial audit trail
    const now = Date.now();
    this.records = [
      {
        id: 'led_init_01',
        ledgerType: 'GAS_WALLET',
        entryType: 'ORIGINAL',
        userId: 'usr_default_01',
        credit: 120.0,
        debit: 0.0,
        balanceAfter: 120.0,
        referenceId: 'dep_usdt_initial',
        correlationId: 'corr_init_gas',
        description: 'Initial performance-fee gas wallet deposit (USDT)',
        timestamp: now - 15 * 86400000,
      },
      {
        id: 'led_init_02',
        ledgerType: 'COMPANY_REVENUE',
        entryType: 'ORIGINAL',
        userId: 'system_reserve',
        credit: 5000.0,
        debit: 0.0,
        balanceAfter: 5000.0,
        referenceId: 'res_sys_init',
        correlationId: 'corr_init_reserve',
        description: 'Company operating treasury baseline reserve',
        timestamp: now - 30 * 86400000,
      },
      {
        id: 'led_init_03',
        ledgerType: 'GAS_WALLET',
        entryType: 'ORIGINAL',
        userId: 'usr_default_01',
        credit: 0.0,
        debit: 15.6,
        balanceAfter: 104.4,
        referenceId: 'trd_close_sample_88',
        correlationId: 'corr_perf_fee_88',
        description: 'Settlement: 30% performance fee for Trade #trd_close_sample_88 ($52 net profit)',
        timestamp: now - 2 * 86400000,
      },
      {
        id: 'led_init_04',
        ledgerType: 'REFERRAL_EARNINGS',
        entryType: 'ORIGINAL',
        userId: 'usr_upline_l1',
        credit: 5.2,
        debit: 0.0,
        balanceAfter: 5.2,
        referenceId: 'trd_close_sample_88',
        correlationId: 'corr_perf_fee_88',
        description: 'Referral Distribution (Level 1 - 10%): Trade #trd_close_sample_88',
        timestamp: now - 2 * 86400000,
      },
      {
        id: 'led_init_05',
        ledgerType: 'COMPANY_REVENUE',
        entryType: 'ORIGINAL',
        userId: 'system_company',
        credit: 5.2,
        debit: 0.0,
        balanceAfter: 5005.2,
        referenceId: 'trd_close_sample_88',
        correlationId: 'corr_perf_fee_88',
        description: 'Company retention (10%): Trade #trd_close_sample_88',
        timestamp: now - 2 * 86400000,
      },
    ];
  }

  public getRecords(ledgerType?: LedgerType): FinancialLedgerRecord[] {
    if (!ledgerType) return [...this.records];
    return this.records.filter((r) => r.ledgerType === ledgerType);
  }

  public getLedgerBalance(ledgerType: LedgerType): number {
    const relevant = this.records.filter((r) => r.ledgerType === ledgerType);
    if (relevant.length === 0) return this.openingBalances.get(ledgerType) || 0;
    return relevant[relevant.length - 1].balanceAfter;
  }

  /**
   * Appends an immutable financial record.
   * Never mutates existing rows!
   */
  public recordTransaction(params: {
    ledgerType: LedgerType;
    entryType: LedgerEntryType;
    userId: string;
    credit: number;
    debit: number;
    referenceId: string;
    correlationId: string;
    description: string;
    metadata?: Record<string, unknown>;
  }): FinancialLedgerRecord {
    const currentBalance = this.getLedgerBalance(params.ledgerType);
    const newBalance = Number((currentBalance + params.credit - params.debit).toFixed(2));

    const record: FinancialLedgerRecord = {
      id: `led_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      ledgerType: params.ledgerType,
      entryType: params.entryType,
      userId: params.userId,
      credit: Number(params.credit.toFixed(2)),
      debit: Number(params.debit.toFixed(2)),
      balanceAfter: newBalance,
      referenceId: params.referenceId,
      correlationId: params.correlationId,
      description: params.description,
      timestamp: Date.now(),
      metadata: params.metadata,
    };

    this.records.push(record);
    return record;
  }

  /**
   * Reversal entry for auditable adjustments:
   * Original Entry -> Reversal Entry -> Corrected Entry
   */
  public reverseTransaction(originalRecordId: string, reason: string): FinancialLedgerRecord {
    const original = this.records.find((r) => r.id === originalRecordId);
    if (!original) throw new Error(`Record ${originalRecordId} not found for reversal.`);

    // To reverse: Swap credit and debit
    return this.recordTransaction({
      ledgerType: original.ledgerType,
      entryType: 'REVERSAL',
      userId: original.userId,
      credit: original.debit,
      debit: original.credit,
      referenceId: `rev_${original.id}`,
      correlationId: `corr_rev_${original.correlationId}`,
      description: `REVERSAL of ${original.id}: ${reason}`,
      metadata: { originalRecordId: original.id, reversalReason: reason },
    });
  }

  /**
   * AUTOMATED MONEY RECONCILIATION:
   * Evaluates invariant: Opening Balance + Total Credits - Total Debits == Actual Closing Balance.
   * Returns auditable variance report for each segregated ledger.
   */
  public runMoneyReconciliation(): LedgerReconciliationAudit[] {
    const ledgerTypes: LedgerType[] = [
      'TRADING_ACCOUNT',
      'GAS_WALLET',
      'REFERRAL_EARNINGS',
      'SUBSCRIPTION_LEDGER',
      'COMPANY_REVENUE',
    ];

    const reports: LedgerReconciliationAudit[] = [];

    for (const type of ledgerTypes) {
      const opening = this.openingBalances.get(type) || 0;
      const relevant = this.records.filter((r) => r.ledgerType === type);

      const totalCredits = Number(relevant.reduce((sum, r) => sum + r.credit, 0).toFixed(2));
      const totalDebits = Number(relevant.reduce((sum, r) => sum + r.debit, 0).toFixed(2));

      // Invariant formula: Opening + Credits - Debits = Expected Closing
      const expectedClosing = Number((opening + totalCredits - totalDebits).toFixed(2));
      const actualClosing = relevant.length > 0 ? relevant[relevant.length - 1].balanceAfter : opening;
      const variance = Number(Math.abs(expectedClosing - actualClosing).toFixed(4));

      reports.push({
        ledgerType: type,
        openingBalance: opening,
        totalCredits,
        totalDebits,
        expectedClosingBalance: expectedClosing,
        actualClosingBalance: actualClosing,
        variance,
        status: variance < 0.01 ? 'RECONCILED' : 'DISCREPANCY_ALERT',
        lastAuditedTimestamp: Date.now(),
      });
    }

    return reports;
  }
}
