export type LedgerType =
  | 'TRADING_ACCOUNT'
  | 'GAS_WALLET'
  | 'REFERRAL_EARNINGS'
  | 'SUBSCRIPTION_LEDGER'
  | 'COMPANY_REVENUE';

export type LedgerEntryType = 'ORIGINAL' | 'REVERSAL' | 'CORRECTION';

export interface PerformanceFeeSplit {
  totalGrossEligibleProfit: number;
  totalFeeAmount: number; // 30% of eligible net profit
  userRetention: number; // 70% ($70 per $100 profit)
  level1Reward: number; // 10% ($10 per $100 profit)
  level2Reward: number; // 5% ($5 per $100 profit)
  level3Reward: number; // 5% ($5 per $100 profit)
  companyShare: number; // 10% ($10 per $100 profit)
  unallocatedToReserve: number; // If an upline tier is missing or not qualified
}

export interface GasWalletState {
  userId: string;
  balance: number; // Current available USDT gas balance
  baseMinimum: number; // Fixed $10 USDT floor
  dynamicRequiredMinimum: number; // Scaled based on user capital & active exposure
  isGasSufficient: boolean;
  lockedForPendingOrders: number;
  totalFeesPaidAllTime: number;
  lastDepositAt?: number;
}

export interface HighWaterMarkState {
  userId: string;
  peakEquity: number;
  currentEquity: number;
  deficitToRecover: number;
  isEligibleForFee: boolean; // Only true when currentEquity > peakEquity
  lastHwmUpdate: number;
}

export interface FinancialLedgerRecord {
  id: string;
  ledgerType: LedgerType;
  entryType: LedgerEntryType;
  userId: string;
  credit: number;
  debit: number;
  balanceAfter: number;
  referenceId: string;
  correlationId: string;
  description: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface LedgerReconciliationAudit {
  ledgerType: LedgerType;
  openingBalance: number;
  totalCredits: number;
  totalDebits: number;
  expectedClosingBalance: number;
  actualClosingBalance: number;
  variance: number;
  status: 'RECONCILED' | 'DISCREPANCY_ALERT';
  lastAuditedTimestamp: number;
}
