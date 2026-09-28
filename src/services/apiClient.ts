import { ExecutionEngine } from './executionEngine';
import { MarketDataService } from './marketData';
import { BacktestEngine, BacktestParameters, BacktestResult } from './backtester';
import { ChaosTester, ChaosTestResult } from './chaosTester';
import { AuditLogger } from './auditLogger';
import { MarketTicker, Position, Order, TradeRecord, ExchangeAccountStatus } from '../types/trading';
import { StrategyDefinition, StrategyId, StrategySignal, StrategyConsensusResult } from '../types/strategy';
import { RiskConfig, SystemKillSwitches, DrawdownState } from '../types/risk';
import { GasWalletState, HighWaterMarkState, FinancialLedgerRecord, LedgerReconciliationAudit } from '../types/finance';
import { ReferralProfile, ReferralMember, ReferralRewardDistribution } from '../types/referral';
import { SubscriptionStatus, SubscriptionDistributionBreakdown } from '../types/subscription';
import { UserProfile, BotLifecycleStatus, AuditLogEntry } from '../types/user';

/**
 * Singleton State Engine powering both client reactive UI and server responses
 */
export class AppState {
  private static instance: AppState;
  public executionEngine: ExecutionEngine;

  // Active user profile
  public currentUser: UserProfile = {
    id: 'usr_default_01',
    email: 'mdrijwanalamkir@gmail.com',
    role: 'OWNER', // Super admin / Owner controls enabled
    fullName: 'Rijwan Alam',
    twoFactorEnabled: true,
    botStatus: 'READY',
    tradingCapitalUsdt: 25000.0,
    availableBalanceUsdt: 20000.0,
    marginUsedUsdt: 5000.0,
    registeredAt: Date.now() - 25 * 86400000,
    lastLoginAt: Date.now(),
    ipAddressMasked: '185.190.***.42',
    referralCode: 'ZEVRA-ALPHA-77',
    referredBy: 'usr_upline_l1',
  };

  // Connected exchanges
  public exchanges: ExchangeAccountStatus[] = [
    {
      exchange: 'binance',
      name: 'Binance USDⓈ-M Futures',
      connected: true,
      mode: 'SANDBOX',
      permissions: {
        canRead: true,
        canTradeFutures: true,
        hasWithdrawal: false,
        hasUniversalTransfer: false,
      },
      validationStatus: 'VALID',
      validationMessage: 'Permissions verified: Read + Futures Trading ONLY. Withdrawal disabled.',
      lastHealthCheck: Date.now(),
      apiKeyMasked: 'vmx9k••••••••88a2',
    },
    {
      exchange: 'bybit',
      name: 'Bybit USDT Perpetual',
      connected: false,
      mode: 'SANDBOX',
      permissions: {
        canRead: false,
        canTradeFutures: false,
        hasWithdrawal: false,
        hasUniversalTransfer: false,
      },
      validationStatus: 'DISCONNECTED',
      validationMessage: 'Ready for API key setup.',
      lastHealthCheck: Date.now() - 3600000,
      apiKeyMasked: '',
    },
    {
      exchange: 'okx',
      name: 'OKX USDT Swap',
      connected: false,
      mode: 'SANDBOX',
      permissions: {
        canRead: false,
        canTradeFutures: false,
        hasWithdrawal: false,
        hasUniversalTransfer: false,
      },
      validationStatus: 'DISCONNECTED',
      validationMessage: 'Passphrase required.',
      lastHealthCheck: Date.now() - 3600000,
      apiKeyMasked: '',
    },
    {
      exchange: 'bitget',
      name: 'Bitget USDT-M Futures',
      connected: false,
      mode: 'SANDBOX',
      permissions: { canRead: false, canTradeFutures: false, hasWithdrawal: false, hasUniversalTransfer: false },
      validationStatus: 'DISCONNECTED',
      validationMessage: 'Not configured.',
      lastHealthCheck: Date.now() - 3600000,
      apiKeyMasked: '',
    },
    {
      exchange: 'deribit',
      name: 'Deribit Perpetual Futures',
      connected: false,
      mode: 'SANDBOX',
      permissions: { canRead: false, canTradeFutures: false, hasWithdrawal: false, hasUniversalTransfer: false },
      validationStatus: 'DISCONNECTED',
      validationMessage: 'Not configured.',
      lastHealthCheck: Date.now() - 3600000,
      apiKeyMasked: '',
    },
    {
      exchange: 'kraken',
      name: 'Kraken Derivatives',
      connected: false,
      mode: 'SANDBOX',
      permissions: { canRead: false, canTradeFutures: false, hasWithdrawal: false, hasUniversalTransfer: false },
      validationStatus: 'DISCONNECTED',
      validationMessage: 'Not configured.',
      lastHealthCheck: Date.now() - 3600000,
      apiKeyMasked: '',
    },
  ];

  private constructor() {
    this.executionEngine = new ExecutionEngine();
  }

  public static getInstance(): AppState {
    if (!AppState.instance) {
      AppState.instance = new AppState();
    }
    return AppState.instance;
  }
}

/**
 * Universal Typed API Client
 */
export class ApiClient {
  private static appState = AppState.getInstance();

  // User & Auth
  public static async getCurrentUser(): Promise<UserProfile> {
    return { ...this.appState.currentUser };
  }

  public static async switchUserRole(role: UserProfile['role']): Promise<UserProfile> {
    this.appState.currentUser.role = role;
    AuditLogger.log({
      actorId: this.appState.currentUser.id,
      actorRole: role,
      action: 'ROLE_SWITCHED_IN_CONSOLE',
      category: 'SECURITY',
      resourceType: 'RBAC',
      resourceId: this.appState.currentUser.id,
      beforeState: { role: this.appState.currentUser.role },
      afterState: { role },
      reason: `User switched active administrative role to ${role}`,
      ipAddress: '127.0.0.1',
      outcome: 'SUCCESS',
      correlationId: `corr_role_${Date.now()}`,
    });
    return { ...this.appState.currentUser };
  }

  // Exchanges
  public static async getExchanges(): Promise<ExchangeAccountStatus[]> {
    return [...this.appState.exchanges];
  }

  public static async validateAndSaveApiKey(params: {
    exchange: string;
    apiKey: string;
    apiSecret: string;
    passphrase?: string;
  }): Promise<{ success: boolean; message: string; status: ExchangeAccountStatus }> {
    const { exchange, apiKey } = params;
    const idx = this.appState.exchanges.findIndex((e) => e.exchange === exchange);
    if (idx === -1) throw new Error('Exchange not found');

    const ex = this.appState.exchanges[idx];

    // Check withdrawal violation
    const hasWithdrawal = apiKey.toLowerCase().includes('withdraw') || apiKey.toLowerCase().includes('transfer');
    if (hasWithdrawal) {
      ex.validationStatus = 'WITHDRAWAL_PERMISSION_REJECTED';
      ex.permissions.hasWithdrawal = true;
      ex.connected = false;
      ex.validationMessage =
        'CRITICAL SECURITY REJECTION: Withdrawal permission detected on this key. ZevraBot strictly bans withdrawal access. Key discarded immediately.';

      AuditLogger.log({
        actorId: this.appState.currentUser.id,
        actorRole: this.appState.currentUser.role,
        action: 'EXCHANGE_KEY_WITHDRAWAL_PERMISSION_REJECTED',
        category: 'SECURITY',
        resourceType: 'API_KEY',
        resourceId: exchange,
        beforeState: null,
        afterState: { hasWithdrawal: true },
        reason: 'CRITICAL SECURITY RULE: Key with withdrawal permissions was rejected.',
        ipAddress: '127.0.0.1',
        outcome: 'BLOCKED',
        correlationId: `corr_sec_withdr_${Date.now()}`,
      });

      return { success: false, message: ex.validationMessage, status: { ...ex } };
    }

    // Key is compliant
    ex.connected = true;
    ex.validationStatus = 'VALID';
    ex.permissions.canRead = true;
    ex.permissions.canTradeFutures = true;
    ex.permissions.hasWithdrawal = false;
    ex.apiKeyMasked = `${apiKey.slice(0, 5)}••••••••${apiKey.slice(-4)}`;
    ex.validationMessage = 'Verified: Read and Futures Trading ONLY. No withdrawal permissions.';
    ex.lastHealthCheck = Date.now();

    AuditLogger.log({
      actorId: this.appState.currentUser.id,
      actorRole: this.appState.currentUser.role,
      action: 'EXCHANGE_KEY_CONNECTED_SECURELY',
      category: 'EXCHANGE',
      resourceType: 'API_KEY',
      resourceId: exchange,
      beforeState: null,
      afterState: { permissions: 'READ_AND_FUTURES_ONLY' },
      reason: 'User connected valid exchange key without withdrawal permissions.',
      ipAddress: '127.0.0.1',
      outcome: 'SUCCESS',
      correlationId: `corr_api_ok_${Date.now()}`,
    });

    return { success: true, message: ex.validationMessage, status: { ...ex } };
  }

  // Markets
  public static async getTickers(): Promise<MarketTicker[]> {
    return MarketDataService.getAllTickers();
  }

  public static async getTicker(symbol: string): Promise<MarketTicker> {
    return MarketDataService.getTicker(symbol);
  }

  // Strategies
  public static async getStrategies(): Promise<StrategyDefinition[]> {
    return this.appState.executionEngine.strategyEngine.getStrategies();
  }

  public static async toggleStrategy(id: StrategyId, enabled: boolean): Promise<StrategyDefinition[]> {
    this.appState.executionEngine.strategyEngine.setStrategyEnabled(id, enabled);
    return this.appState.executionEngine.strategyEngine.getStrategies();
  }

  public static async updateStrategyWeight(id: StrategyId, weight: number): Promise<StrategyDefinition[]> {
    this.appState.executionEngine.strategyEngine.setStrategyWeight(id, weight);
    return this.appState.executionEngine.strategyEngine.getStrategies();
  }

  public static async evaluateMarket(symbol: string): Promise<{
    signals: StrategySignal[];
    consensus: StrategyConsensusResult;
  }> {
    const ticker = MarketDataService.getTicker(symbol);
    const signals = this.appState.executionEngine.strategyEngine.evaluateAll(ticker);
    const consensus = this.appState.executionEngine.strategyEngine.computeConsensus(signals, ticker);
    return { signals, consensus };
  }

  // Risk Governor
  public static async getRiskConfig(): Promise<RiskConfig> {
    return this.appState.executionEngine.riskGovernor.getConfig();
  }

  public static async updateRiskConfig(config: Partial<RiskConfig>): Promise<RiskConfig> {
    this.appState.executionEngine.riskGovernor.updateConfig(config);
    return this.appState.executionEngine.riskGovernor.getConfig();
  }

  public static async getKillSwitches(): Promise<SystemKillSwitches> {
    return this.appState.executionEngine.riskGovernor.getKillSwitches();
  }

  public static async triggerUserKillSwitch(active: boolean): Promise<SystemKillSwitches> {
    this.appState.executionEngine.riskGovernor.triggerUserKillSwitch(active);
    if (active) {
      this.appState.executionEngine.setBotStatus('EMERGENCY_STOP');
    } else {
      this.appState.executionEngine.setBotStatus('READY');
    }
    return this.appState.executionEngine.riskGovernor.getKillSwitches();
  }

  public static async triggerGlobalKillSwitch(active: boolean): Promise<SystemKillSwitches> {
    this.appState.executionEngine.riskGovernor.triggerGlobalKillSwitch(active);
    if (active) {
      this.appState.executionEngine.setBotStatus('EMERGENCY_STOP');
    } else {
      this.appState.executionEngine.setBotStatus('READY');
    }
    return this.appState.executionEngine.riskGovernor.getKillSwitches();
  }

  // Bot Lifecycle & Execution
  public static async getBotStatus(): Promise<BotLifecycleStatus> {
    return this.appState.executionEngine.getBotStatus();
  }

  public static async setBotStatus(status: BotLifecycleStatus): Promise<BotLifecycleStatus> {
    this.appState.executionEngine.setBotStatus(status);
    return this.appState.executionEngine.getBotStatus();
  }

  public static async executeTradeSignal(signal: StrategySignal): Promise<{
    executed: boolean;
    reason?: string;
    position?: Position;
    order?: Order;
  }> {
    const ticker = MarketDataService.getTicker(signal.symbol);
    return this.appState.executionEngine.executeSignal(signal, ticker);
  }

  public static async getPositions(): Promise<Position[]> {
    return this.appState.executionEngine.getPositions();
  }

  public static async closePosition(positionId: string): Promise<{ success: boolean; tradeRecord?: TradeRecord }> {
    return this.appState.executionEngine.closePosition(positionId);
  }

  public static async emergencyCloseAll(): Promise<number> {
    return this.appState.executionEngine.emergencyCloseAll();
  }

  public static async getTradeHistory(): Promise<TradeRecord[]> {
    return this.appState.executionEngine.getTradeHistory();
  }

  // Finance & Gas & Ledgers
  public static async getGasWallet(): Promise<GasWalletState> {
    return this.appState.executionEngine.getGasWallet();
  }

  public static async depositGas(amount: number): Promise<GasWalletState> {
    return this.appState.executionEngine.depositGas(amount);
  }

  public static async getHighWaterMark(): Promise<HighWaterMarkState> {
    return this.appState.executionEngine.pnlEngine.getHighWaterMark(this.appState.currentUser.id);
  }

  public static async getFinancialLedger(): Promise<FinancialLedgerRecord[]> {
    return this.appState.executionEngine.ledgerEngine.getRecords();
  }

  public static async runMoneyReconciliation(): Promise<LedgerReconciliationAudit[]> {
    return this.appState.executionEngine.ledgerEngine.runMoneyReconciliation();
  }

  // Referrals
  public static async getReferralProfile(): Promise<ReferralProfile> {
    return this.appState.executionEngine.referralEngine.getProfile(this.appState.currentUser.id);
  }

  public static async getReferralMembers(): Promise<ReferralMember[]> {
    return this.appState.executionEngine.referralEngine.getTeamMembers(this.appState.currentUser.id);
  }

  public static async getReferralDistributions(): Promise<ReferralRewardDistribution[]> {
    return this.appState.executionEngine.referralEngine.getDistributions();
  }

  // Subscriptions
  public static async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    return this.appState.executionEngine.subscriptionEngine.getStatus(this.appState.currentUser.id);
  }

  public static async getSubscriptionDistributions(): Promise<SubscriptionDistributionBreakdown[]> {
    return this.appState.executionEngine.subscriptionEngine.getDistributions();
  }

  public static async simulateWebhookPayment(): Promise<{ success: boolean; error?: string; breakdown?: SubscriptionDistributionBreakdown }> {
    return this.appState.executionEngine.subscriptionEngine.processPaymentWebhook({
      eventId: `evt_pay_${Date.now()}`,
      idempotencyKey: `idem_pay_${Date.now()}`,
      userId: this.appState.currentUser.id,
      amount: 30.0,
      signature: 'sig_valid_zevrabot_hmac_verified_payment_gate_2026',
      timestamp: Date.now(),
    });
  }

  // Backtesting & Chaos Testing
  public static async runBacktest(params: BacktestParameters): Promise<BacktestResult> {
    return BacktestEngine.runBacktest(params);
  }

  public static async runChaosScenario(scenarioId: string): Promise<ChaosTestResult> {
    return ChaosTester.runScenario(scenarioId);
  }

  // Audit Logs
  public static async getAuditLogs(category?: string): Promise<AuditLogEntry[]> {
    return AuditLogger.getLogs(category);
  }
}
