export type RiskTier = 'CONSERVATIVE' | 'BALANCED' | 'DYNAMIC';

export type DrawdownState = 'NORMAL' | 'REDUCED_RISK' | 'TRADING_PAUSE' | 'EMERGENCY_MODE';

export interface RiskConfig {
  hardMaxLeverage: 10; // Hard ceiling: Never exceeds 10x!
  userConfiguredMaxLeverage: number; // Configurable between 1x and 10x
  riskPerTradePercent: number; // 0.5% to 3.0%
  maxAccountExposurePercent: number; // Max total margin allocated (e.g. 50%)
  maxConcurrentPositions: number; // 1, 2, 3, 5, 10
  dailyLossLimitPercent: number; // e.g. 4.0%
  drawdownWarningThresholdPercent: number; // e.g. 7.0% -> triggers REDUCED_RISK
  drawdownPauseThresholdPercent: number; // e.g. 12.0% -> triggers TRADING_PAUSE
  consecutiveLossReducedThreshold: number; // 3 losses -> reduces sizing by 50%
  consecutiveLossPauseThreshold: number; // 5 losses -> pauses automated trading
  maxSpreadPercentThreshold: number; // 0.15% (15 bps)
  maxAtrVolatilityPercent: number; // 4.5%
  minGasWalletThreshold: number; // $10 base minimum
}

export interface RiskCheckItem {
  id: string;
  name: string;
  category: 'ACCOUNT' | 'MARKET' | 'EXCHANGE' | 'EXPOSURE' | 'LIMITS' | 'GAS_SUBSCRIPTION';
  passed: boolean;
  actualValue: string | number;
  thresholdValue: string | number;
  details: string;
  critical: boolean; // If true and failed, hard block
}

export interface RiskAssessmentOutcome {
  approved: boolean;
  status: 'APPROVED' | 'REJECTED' | 'MODIFIED_SIZE';
  rejectionReason?: string;
  requestedLeverage: number;
  approvedLeverage: number;
  requestedSize: number;
  approvedSize: number;
  checks: RiskCheckItem[];
  drawdownState: DrawdownState;
  dailyLossSoFar: number;
  consecutiveLosses: number;
  evaluationTimestamp: number;
}

export interface SystemKillSwitches {
  userKillSwitchActive: boolean;
  adminKillSwitchActive: boolean;
  globalKillSwitchActive: boolean;
  triggeredAt?: number;
  triggeredBy?: string;
  reason?: string;
}
