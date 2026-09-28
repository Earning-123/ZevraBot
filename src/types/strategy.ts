export type StrategyId =
  | 'ema_trend'
  | 'macd_momentum'
  | 'rsi_reversal'
  | 'bollinger_band'
  | 'vwap'
  | 'atr_trend'
  | 'breakout'
  | 'volatility_breakout'
  | 'mean_reversion'
  | 'support_resistance'
  | 'volume_confirmation'
  | 'momentum'
  | 'market_structure'
  | 'liquidity_sweep'
  | 'mtf_trend'
  | 'funding_rate'
  | 'open_interest'
  | 'volatility_regime'
  | 'trend_momentum_composite'
  | 'consensus_ensemble'
  | 'ai_market_regime'
  | 'ai_signal_scoring';

export type SignalAction = 'LONG' | 'SHORT' | 'NO_TRADE';

export type MarketRegime =
  | 'BULLISH_EXPANSION'
  | 'BEARISH_MARKDOWN'
  | 'RANGE_BOUND_CONSOLIDATION'
  | 'HIGH_VOLATILITY_SQUEEZE'
  | 'LOW_VOLATILITY_CHOP';

export interface StrategySignal {
  strategyId: StrategyId;
  strategyName: string;
  symbol: string;
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  action: SignalAction;
  confidence: number; // 0 to 100
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  riskRewardRatio: number;
  riskScore: number; // 1 to 10 (1 = safest, 10 = most volatile)
  marketRegime: MarketRegime;
  rationale: string;
  timestamp: number;
}

export interface StrategyDefinition {
  id: StrategyId;
  name: string;
  category: 'TREND' | 'MOMENTUM' | 'VOLATILITY' | 'MEAN_REVERSION' | 'STRUCTURAL' | 'DERIVATIVES' | 'AI_ENSEMBLE';
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
  description: string;
  enabled: boolean;
  weight: number; // 0.1 to 2.0 for consensus
  riskTier: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  winRate: number; // verified backtest metric
  totalTrades: number;
  profitFactor: number;
  maxDrawdown: number;
  sharpeRatio: number;
  version: string;
}

export interface StrategyConsensusResult {
  action: SignalAction;
  consensusScore: number; // -100 (extreme short) to +100 (extreme long)
  longVotes: number;
  shortVotes: number;
  neutralVotes: number;
  totalActiveStrategies: number;
  primaryRationale: string;
  regime: MarketRegime;
  eligibleForExecution: boolean;
}
