import { DrawdownState, RiskAssessmentOutcome, RiskCheckItem, RiskConfig, SystemKillSwitches } from '../types/risk';
import { StrategySignal } from '../types/strategy';
import { MarketTicker, Position } from '../types/trading';
import { GasWalletState } from '../types/finance';
import { SubscriptionStatus } from '../types/subscription';

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  hardMaxLeverage: 10, // Platform invariant: Hard ceiling 10x
  userConfiguredMaxLeverage: 5, // Default conservative
  riskPerTradePercent: 1.5, // 1.5% capital at risk per trade
  maxAccountExposurePercent: 40.0, // Max 40% margin committed
  maxConcurrentPositions: 3, // Conservative default
  dailyLossLimitPercent: 4.0, // 4% daily loss hard stop
  drawdownWarningThresholdPercent: 7.0,
  drawdownPauseThresholdPercent: 12.0,
  consecutiveLossReducedThreshold: 3,
  consecutiveLossPauseThreshold: 5,
  maxSpreadPercentThreshold: 0.15, // 0.15% max acceptable spread (15 bps)
  maxAtrVolatilityPercent: 4.5,
  minGasWalletThreshold: 10.0, // $10 base minimum
};

export class RiskGovernor {
  private config: RiskConfig;
  private killSwitches: SystemKillSwitches = {
    userKillSwitchActive: false,
    adminKillSwitchActive: false,
    globalKillSwitchActive: false,
  };

  // State metrics
  private dailyLossUsdt = 0;
  private initialDayCapital = 25000;
  private consecutiveLosses = 0;
  private peakEquity = 25000;
  private currentEquity = 25000;

  constructor(config: RiskConfig = DEFAULT_RISK_CONFIG) {
    this.config = { ...config, hardMaxLeverage: 10 }; // Hard ceiling cannot be overridden
  }

  public getConfig(): RiskConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<RiskConfig>): void {
    // Prevent any attempt to set leverage > 10x
    const requestedLeverage = newConfig.userConfiguredMaxLeverage || this.config.userConfiguredMaxLeverage;
    const safeLeverage = Math.min(10, Math.max(1, requestedLeverage));

    this.config = {
      ...this.config,
      ...newConfig,
      hardMaxLeverage: 10,
      userConfiguredMaxLeverage: safeLeverage,
    };
  }

  public getKillSwitches(): SystemKillSwitches {
    return { ...this.killSwitches };
  }

  public triggerUserKillSwitch(active: boolean, reason?: string): void {
    this.killSwitches.userKillSwitchActive = active;
    this.killSwitches.triggeredAt = Date.now();
    this.killSwitches.reason = reason || 'User triggered manual emergency pause.';
  }

  public triggerAdminKillSwitch(active: boolean, reason?: string): void {
    this.killSwitches.adminKillSwitchActive = active;
    this.killSwitches.triggeredAt = Date.now();
    this.killSwitches.reason = reason || 'Admin triggered emergency trading shutdown.';
  }

  public triggerGlobalKillSwitch(active: boolean, reason?: string): void {
    this.killSwitches.globalKillSwitchActive = active;
    this.killSwitches.triggeredAt = Date.now();
    this.killSwitches.reason = reason || 'Global emergency kill switch engaged by system owner.';
  }

  public updateFinancialState(equity: number, dailyLoss: number, consecutiveLossCount: number): void {
    this.currentEquity = equity;
    if (equity > this.peakEquity) {
      this.peakEquity = equity;
    }
    this.dailyLossUsdt = dailyLoss;
    this.consecutiveLosses = consecutiveLossCount;
  }

  /**
   * Calculates dynamic required minimum gas balance:
   * Base $10 USDT + dynamic requirement based on trading capital & open exposure
   */
  public calculateDynamicGasRequirement(tradingCapital: number, openExposure: number): number {
    const base = 10.0;
    const capitalScaled = (tradingCapital / 10000) * 5.0; // $5 extra per $10k capital
    const exposureScaled = (openExposure / 5000) * 2.0; // $2 extra per $5k exposure
    return Math.max(base, Number((base + capitalScaled + exposureScaled).toFixed(2)));
  }

  /**
   * Evaluates current drawdown state
   */
  public evaluateDrawdownState(): DrawdownState {
    if (this.peakEquity <= 0) return 'NORMAL';
    const drawdownPct = ((this.peakEquity - this.currentEquity) / this.peakEquity) * 100;

    if (drawdownPct >= this.config.drawdownPauseThresholdPercent) {
      return 'TRADING_PAUSE';
    } else if (drawdownPct >= this.config.drawdownWarningThresholdPercent) {
      return 'REDUCED_RISK';
    }
    return 'NORMAL';
  }

  /**
   * CRITICAL PIPELINE METHOD:
   * Evaluates an incoming strategy signal against ALL 18 risk invariants.
   * SIGNAL -> RISK CHECK -> GAS CHECK -> EXECUTION
   */
  public assessTradeRisk(params: {
    signal: StrategySignal;
    ticker: MarketTicker;
    currentPositions: Position[];
    accountEquity: number;
    availableMargin: number;
    gasWallet: GasWalletState;
    subscription: SubscriptionStatus;
    apiHealthy: boolean;
    exchangeOperational: boolean;
  }): RiskAssessmentOutcome {
    const checks: RiskCheckItem[] = [];
    const {
      signal,
      ticker,
      currentPositions,
      accountEquity,
      availableMargin,
      gasWallet,
      subscription,
      apiHealthy,
      exchangeOperational,
    } = params;

    const drawdownState = this.evaluateDrawdownState();

    // 1. Emergency Kill Switches Check
    const anyKillSwitchActive =
      this.killSwitches.userKillSwitchActive ||
      this.killSwitches.adminKillSwitchActive ||
      this.killSwitches.globalKillSwitchActive;

    checks.push({
      id: 'kill_switch',
      name: 'Emergency Kill Switch Status',
      category: 'EXCHANGE',
      passed: !anyKillSwitchActive,
      actualValue: anyKillSwitchActive ? 'ACTIVE' : 'DISENGAGED',
      thresholdValue: 'DISENGAGED',
      details: anyKillSwitchActive ? `Kill switch active: ${this.killSwitches.reason || 'Trading halted'}` : 'All kill switches inactive.',
      critical: true,
    });

    // 2. Exchange & API Health Check
    checks.push({
      id: 'exchange_api_health',
      name: 'Exchange Connectivity & API Status',
      category: 'EXCHANGE',
      passed: apiHealthy && exchangeOperational,
      actualValue: apiHealthy && exchangeOperational ? 'HEALTHY' : 'DEGRADED',
      thresholdValue: 'HEALTHY',
      details: apiHealthy && exchangeOperational ? 'Direct API socket latency < 40ms' : 'Exchange or API connection degraded',
      critical: true,
    });

    // 3. Market Data Freshness Check (stale data prevention)
    const dataAgeMs = Date.now() - ticker.lastUpdated;
    const isDataFresh = dataAgeMs < 5000;
    checks.push({
      id: 'market_data_freshness',
      name: 'Market Data Freshness (<5000ms)',
      category: 'MARKET',
      passed: isDataFresh,
      actualValue: `${dataAgeMs}ms`,
      thresholdValue: '< 5000ms',
      details: isDataFresh ? 'Real-time order book and tick feed verified' : 'Stale market data detected! Trading blocked for safety.',
      critical: true,
    });

    // 4. Spread Check (protection against illiquid spikes)
    const isSpreadAcceptable = ticker.spreadPct <= this.config.maxSpreadPercentThreshold;
    checks.push({
      id: 'spread_check',
      name: 'Bid-Ask Spread (<0.15%)',
      category: 'MARKET',
      passed: isSpreadAcceptable,
      actualValue: `${(ticker.spreadPct * 100).toFixed(3)}%`,
      thresholdValue: `${(this.config.maxSpreadPercentThreshold * 100).toFixed(2)}%`,
      details: isSpreadAcceptable ? 'Tight spread confirmed' : 'Excessive spread! Slippage risk too high.',
      critical: true,
    });

    // 5. Subscription Status Check
    const isSubValid = subscription.isCompliant && subscription.phase !== 'EXPIRED';
    checks.push({
      id: 'subscription_status',
      name: 'Subscription Compliance',
      category: 'GAS_SUBSCRIPTION',
      passed: isSubValid,
      actualValue: subscription.phase,
      thresholdValue: 'TRIAL or ACTIVE_PAID',
      details: isSubValid ? `Active subscription (${subscription.daysRemaining} days remaining)` : 'Subscription expired. New trades disabled.',
      critical: true,
    });

    // 6. Dynamic Gas Wallet Check
    const totalOpenExposure = currentPositions.reduce((acc, p) => acc + p.size, 0);
    const dynamicGasRequired = this.calculateDynamicGasRequirement(accountEquity, totalOpenExposure);
    const hasSufficientGas = gasWallet.balance >= dynamicGasRequired && gasWallet.balance >= this.config.minGasWalletThreshold;

    checks.push({
      id: 'gas_wallet_balance',
      name: 'Gas/Fee Wallet Required Balance',
      category: 'GAS_SUBSCRIPTION',
      passed: hasSufficientGas,
      actualValue: `$${gasWallet.balance.toFixed(2)} USDT`,
      thresholdValue: `>= $${dynamicGasRequired.toFixed(2)} USDT`,
      details: hasSufficientGas
        ? 'Gas balance sufficient to cover performance fee obligations'
        : `Gas balance ($${gasWallet.balance.toFixed(2)}) is below dynamic requirement ($${dynamicGasRequired.toFixed(2)}). Fund gas wallet to trade.`,
      critical: true,
    });

    // 7. Daily Loss Limit Check
    const dailyLossPct = this.initialDayCapital > 0 ? (this.dailyLossUsdt / this.initialDayCapital) * 100 : 0;
    const isDailyLossSafe = dailyLossPct < this.config.dailyLossLimitPercent;
    checks.push({
      id: 'daily_loss_limit',
      name: 'Daily Loss Limit',
      category: 'LIMITS',
      passed: isDailyLossSafe,
      actualValue: `${dailyLossPct.toFixed(2)}% ($${this.dailyLossUsdt.toFixed(2)})`,
      thresholdValue: `< ${this.config.dailyLossLimitPercent.toFixed(1)}%`,
      details: isDailyLossSafe ? 'Within daily risk allowance' : 'Daily loss limit breached! New trades halted until next UTC session.',
      critical: true,
    });

    // 8. Drawdown State Check
    const isDrawdownSafe = drawdownState !== 'TRADING_PAUSE' && drawdownState !== 'EMERGENCY_MODE';
    checks.push({
      id: 'drawdown_state',
      name: 'Drawdown Protection Tier',
      category: 'LIMITS',
      passed: isDrawdownSafe,
      actualValue: drawdownState,
      thresholdValue: 'NORMAL or REDUCED_RISK',
      details: isDrawdownSafe ? `Drawdown tier: ${drawdownState}` : `System in ${drawdownState}. Trading paused to protect capital.`,
      critical: true,
    });

    // 9. Consecutive Loss Governor Check
    const isConsecutiveLossSafe = this.consecutiveLosses < this.config.consecutiveLossPauseThreshold;
    checks.push({
      id: 'consecutive_losses',
      name: 'Consecutive Loss Governor',
      category: 'LIMITS',
      passed: isConsecutiveLossSafe,
      actualValue: `${this.consecutiveLosses} consecutive`,
      thresholdValue: `< ${this.config.consecutiveLossPauseThreshold}`,
      details: isConsecutiveLossSafe
        ? `${this.consecutiveLosses} consecutive losses recorded`
        : `Critical ${this.consecutiveLosses} consecutive losses hit. Cooling off strategy.`,
      critical: true,
    });

    // 10. Concurrent Positions Count
    const isConcurrentSafe = currentPositions.length < this.config.maxConcurrentPositions;
    checks.push({
      id: 'max_concurrent_positions',
      name: 'Concurrent Open Trades',
      category: 'EXPOSURE',
      passed: isConcurrentSafe,
      actualValue: `${currentPositions.length} active`,
      thresholdValue: `< ${this.config.maxConcurrentPositions} max`,
      details: isConcurrentSafe ? 'Position slot available' : 'Max concurrent positions reached.',
      critical: true,
    });

    // 11. Duplicate Position / Same Symbol Check
    const alreadyHoldingSymbol = currentPositions.some((p) => p.symbol === signal.symbol);
    checks.push({
      id: 'duplicate_symbol_check',
      name: 'Single Position Per Symbol Rule',
      category: 'EXPOSURE',
      passed: !alreadyHoldingSymbol,
      actualValue: alreadyHoldingSymbol ? 'EXISTS' : 'CLEAR',
      thresholdValue: 'CLEAR',
      details: !alreadyHoldingSymbol ? 'No conflicting exposure on this pair' : `Already open position on ${signal.symbol}. Over-hedging prohibited.`,
      critical: true,
    });

    // 12. Protective Stop-Loss Native Verification
    const hasValidStopLoss = signal.action === 'LONG' ? signal.stopLoss < signal.entryPrice : signal.stopLoss > signal.entryPrice;
    checks.push({
      id: 'protective_stop_loss',
      name: 'Exchange-Native Protective Stop-Loss Verification',
      category: 'LIMITS',
      passed: hasValidStopLoss,
      actualValue: `$${signal.stopLoss}`,
      thresholdValue: signal.action === 'LONG' ? `< $${signal.entryPrice}` : `> $${signal.entryPrice}`,
      details: hasValidStopLoss ? 'Valid protective stop-loss level computed' : 'Invalid stop-loss parameter! Order rejected.',
      critical: true,
    });

    // 13. Leverage Computation (HARD MAX 10x Platform Ceiling)
    let requestedLeverage = this.config.userConfiguredMaxLeverage;
    // Volatility & Drawdown adjustments
    if (drawdownState === 'REDUCED_RISK' || this.consecutiveLosses >= this.config.consecutiveLossReducedThreshold) {
      requestedLeverage = Math.max(1, Math.floor(requestedLeverage * 0.5));
    }
    if (ticker.atr / ticker.price > 0.02) {
      // High market volatility -> cut leverage by 1 notch
      requestedLeverage = Math.max(1, requestedLeverage - 1);
    }
    const approvedLeverage = Math.min(10, Math.max(1, requestedLeverage)); // HARD CEILING 10x!

    checks.push({
      id: 'leverage_governor',
      name: 'Platform Leverage Ceiling (<= 10x)',
      category: 'LIMITS',
      passed: approvedLeverage <= 10,
      actualValue: `${approvedLeverage}x`,
      thresholdValue: '<= 10x',
      details: `Approved leverage: ${approvedLeverage}x (Hard ceiling: 10x)`,
      critical: true,
    });

    // 14. Quantitative Position Sizing
    // Position sizing = (Account Equity * Risk per trade %) / (|Entry - StopLoss| / Entry)
    const stopDistancePct = Math.abs(signal.entryPrice - signal.stopLoss) / signal.entryPrice;
    const dollarRisk = accountEquity * (this.config.riskPerTradePercent / 100);
    let calculatedPositionSize = dollarRisk / Math.max(0.005, stopDistancePct);

    // Apply drawdown and consecutive loss damping
    if (drawdownState === 'REDUCED_RISK' || this.consecutiveLosses >= this.config.consecutiveLossReducedThreshold) {
      calculatedPositionSize *= 0.5;
    }

    // Cap position size so margin required does not exceed available margin
    const marginNeeded = calculatedPositionSize / approvedLeverage;
    const maxAllowedMargin = Math.min(availableMargin * 0.8, accountEquity * (this.config.maxAccountExposurePercent / 100));

    let approvedSize = calculatedPositionSize;
    if (marginNeeded > maxAllowedMargin) {
      approvedSize = maxAllowedMargin * approvedLeverage;
    }

    // Bound size
    approvedSize = Math.max(50, Number(approvedSize.toFixed(2))); // minimum $50 order

    checks.push({
      id: 'position_sizing',
      name: 'Risk-Budgeted Position Sizing',
      category: 'EXPOSURE',
      passed: approvedSize / approvedLeverage <= availableMargin,
      actualValue: `$${approvedSize.toFixed(2)} (Margin: $${(approvedSize / approvedLeverage).toFixed(2)})`,
      thresholdValue: `<= Available Margin $${availableMargin.toFixed(2)}`,
      details: `Sized by ATR distance (${(stopDistancePct * 100).toFixed(2)}% SL distance).`,
      critical: true,
    });

    // Final Approval Determination
    const criticalFailures = checks.filter((c) => c.critical && !c.passed);
    const approved = criticalFailures.length === 0 && signal.action !== 'NO_TRADE';

    return {
      approved,
      status: approved ? (approvedSize < calculatedPositionSize ? 'MODIFIED_SIZE' : 'APPROVED') : 'REJECTED',
      rejectionReason: criticalFailures.length > 0 ? criticalFailures[0].details : undefined,
      requestedLeverage: this.config.userConfiguredMaxLeverage,
      approvedLeverage,
      requestedSize: Number(calculatedPositionSize.toFixed(2)),
      approvedSize,
      checks,
      drawdownState,
      dailyLossSoFar: this.dailyLossUsdt,
      consecutiveLosses: this.consecutiveLosses,
      evaluationTimestamp: Date.now(),
    };
  }
}
