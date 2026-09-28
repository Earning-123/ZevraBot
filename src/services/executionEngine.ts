import { BotLifecycleStatus } from '../types/user';
import { MarketTicker, Order, Position, TradeRecord } from '../types/trading';
import { StrategySignal } from '../types/strategy';
import { ExchangeAdapter, ExchangeFactory } from './exchangeAdapters';
import { StrategyEngine } from './strategyEngine';
import { RiskGovernor } from './riskGovernor';
import { PnlEngine } from './pnlEngine';
import { ReferralEngine } from './referralEngine';
import { SubscriptionEngine } from './subscriptionEngine';
import { LedgerEngine } from './ledgerEngine';
import { AuditLogger } from './auditLogger';
import { CryptoService } from './crypto';
import { GasWalletState } from '../types/finance';

export class ExecutionEngine {
  private botStatus: BotLifecycleStatus = 'READY';
  private positions: Position[] = [];
  private orders: Order[] = [];
  private tradeHistory: TradeRecord[] = [];
  
  // Adapters and engines
  private exchangeAdapter: ExchangeAdapter;
  public strategyEngine: StrategyEngine;
  public riskGovernor: RiskGovernor;
  public pnlEngine: PnlEngine;
  public referralEngine: ReferralEngine;
  public subscriptionEngine: SubscriptionEngine;
  public ledgerEngine: LedgerEngine;

  // Gas Wallet
  private gasWallet: GasWalletState = {
    userId: 'usr_default_01',
    balance: 104.40,
    baseMinimum: 10.0,
    dynamicRequiredMinimum: 10.0,
    isGasSufficient: true,
    lockedForPendingOrders: 0,
    totalFeesPaidAllTime: 15.60,
    lastDepositAt: Date.now() - 15 * 86400000,
  };

  constructor() {
    this.exchangeAdapter = ExchangeFactory.createAdapter('binance', true); // Defaults to secure sandbox paper trading
    this.strategyEngine = new StrategyEngine();
    this.riskGovernor = new RiskGovernor();
    this.pnlEngine = new PnlEngine();
    this.referralEngine = new ReferralEngine();
    this.subscriptionEngine = new SubscriptionEngine();
    this.ledgerEngine = new LedgerEngine();

    // Seed 1 active position for rich initial state
    const now = Date.now();
    this.positions.push({
      id: 'pos_btc_init_01',
      symbol: 'BTCUSDT',
      direction: 'LONG',
      leverage: 5,
      size: 5000.0,
      quantity: 0.051,
      entryPrice: 97850.0,
      markPrice: 98450.0,
      liquidationPrice: 79200.0,
      unrealizedPnl: +30.60,
      unrealizedPnlPercent: +3.12,
      margin: 1000.0,
      stopLoss: 96400.0,
      takeProfit: 101200.0,
      trailingStop: 97000.0,
      exchange: 'binance',
      strategyId: 'ema_trend',
      openedAt: now - 3600000 * 3,
      isPaper: true,
    });
  }

  public getBotStatus(): BotLifecycleStatus {
    return this.botStatus;
  }

  public setBotStatus(status: BotLifecycleStatus): void {
    const prev = this.botStatus;
    this.botStatus = status;
    AuditLogger.log({
      actorId: 'usr_default_01',
      actorRole: 'USER',
      action: 'BOT_STATUS_CHANGE',
      category: 'TRADING',
      resourceType: 'BOT_LIFECYCLE',
      resourceId: 'zevrabot_instance',
      beforeState: { status: prev },
      afterState: { status },
      reason: `Bot status changed from ${prev} to ${status}`,
      ipAddress: '127.0.0.1',
      outcome: 'SUCCESS',
      correlationId: CryptoService.generateIdempotencyKey('corr_status'),
    });
  }

  public getGasWallet(): GasWalletState {
    const totalExposure = this.positions.reduce((acc, p) => acc + p.size, 0);
    const dynamicReq = this.riskGovernor.calculateDynamicGasRequirement(25000, totalExposure);
    this.gasWallet.dynamicRequiredMinimum = dynamicReq;
    this.gasWallet.isGasSufficient = this.gasWallet.balance >= dynamicReq && this.gasWallet.balance >= 10.0;
    return { ...this.gasWallet };
  }

  public depositGas(amount: number): GasWalletState {
    this.gasWallet.balance = Number((this.gasWallet.balance + amount).toFixed(2));
    this.gasWallet.lastDepositAt = Date.now();
    this.ledgerEngine.recordTransaction({
      ledgerType: 'GAS_WALLET',
      entryType: 'ORIGINAL',
      userId: this.gasWallet.userId,
      credit: amount,
      debit: 0,
      referenceId: `dep_${Date.now()}`,
      correlationId: CryptoService.generateIdempotencyKey('corr_dep'),
      description: `Manual gas balance top-up (+$${amount.toFixed(2)} USDT)`,
    });
    return this.getGasWallet();
  }

  public getPositions(): Position[] {
    return [...this.positions];
  }

  public getOrders(): Order[] {
    return [...this.orders];
  }

  public getTradeHistory(): TradeRecord[] {
    return [...this.tradeHistory];
  }

  /**
   * CORE PIPELINE EXECUTION:
   * Signal -> Risk Check -> Gas Check -> Execution -> Monitoring
   */
  public async executeSignal(signal: StrategySignal, ticker: MarketTicker): Promise<{
    executed: boolean;
    reason?: string;
    position?: Position;
    order?: Order;
  }> {
    // 0. Bot state check
    if (this.botStatus === 'OFFLINE' || this.botStatus === 'MANUAL_PAUSE' || this.botStatus === 'EMERGENCY_STOP') {
      return { executed: false, reason: `Bot is in ${this.botStatus} state. Order prohibited.` };
    }

    // 1. Mandatory Risk & Gas Evaluation
    const subStatus = this.subscriptionEngine.getStatus('usr_default_01');
    const gas = this.getGasWallet();

    const riskAssessment = this.riskGovernor.assessTradeRisk({
      signal,
      ticker,
      currentPositions: this.positions,
      accountEquity: 25000,
      availableMargin: 20000,
      gasWallet: gas,
      subscription: subStatus,
      apiHealthy: true,
      exchangeOperational: true,
    });

    if (!riskAssessment.approved) {
      AuditLogger.log({
        actorId: 'risk_governor',
        actorRole: 'OWNER',
        action: 'ORDER_INTENT_REJECTED',
        category: 'RISK',
        resourceType: 'SIGNAL',
        resourceId: `${signal.strategyId}_${signal.symbol}`,
        beforeState: { signalAction: signal.action },
        afterState: { rejectionReason: riskAssessment.rejectionReason },
        reason: riskAssessment.rejectionReason,
        ipAddress: '127.0.0.1',
        outcome: 'BLOCKED',
        correlationId: CryptoService.generateIdempotencyKey('corr_risk_reject'),
      });

      return {
        executed: false,
        reason: `Risk Governor Rejected: ${riskAssessment.rejectionReason || 'Risk check failed'}`,
      };
    }

    // 2. Order Intent Creation & Idempotency Key
    const idempotencyKey = CryptoService.generateIdempotencyKey('order_intent');
    const size = riskAssessment.approvedSize;
    const leverage = riskAssessment.approvedLeverage;
    const quantity = Number((size / ticker.price).toFixed(4));
    const side = signal.action === 'LONG' ? 'BUY' : 'SELL';

    // 3. Submit Order to Exchange Adapter
    const placedOrder = await this.exchangeAdapter.placeOrder({
      clientOrderId: idempotencyKey,
      exchange: 'binance',
      symbol: signal.symbol,
      side,
      type: 'MARKET',
      price: ticker.price,
      quantity,
      leverage,
      stopPrice: signal.stopLoss,
      strategyId: signal.strategyId,
      isPaper: true,
    });

    this.orders.unshift(placedOrder);

    // 4. Create Position
    const positionId = `pos_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const margin = Number((size / leverage).toFixed(2));
    const liquidationDist = (ticker.price / leverage) * 0.9;
    const liquidationPrice = signal.action === 'LONG' ? ticker.price - liquidationDist : ticker.price + liquidationDist;

    const newPosition: Position = {
      id: positionId,
      symbol: signal.symbol,
      direction: signal.action === 'LONG' ? 'LONG' : 'SHORT',
      leverage,
      size,
      quantity,
      entryPrice: ticker.price,
      markPrice: ticker.price,
      liquidationPrice: Number(liquidationPrice.toFixed(2)),
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0,
      margin,
      stopLoss: signal.stopLoss,
      takeProfit: signal.takeProfit,
      trailingStop: signal.stopLoss,
      exchange: 'binance',
      strategyId: signal.strategyId,
      openedAt: Date.now(),
      isPaper: true,
    };

    this.positions.push(newPosition);
    this.botStatus = 'TRADING';

    AuditLogger.log({
      actorId: 'execution_engine',
      actorRole: 'USER',
      action: 'POSITION_OPENED',
      category: 'TRADING',
      resourceType: 'POSITION',
      resourceId: positionId,
      beforeState: null,
      afterState: { symbol: signal.symbol, size, leverage, entryPrice: ticker.price },
      reason: `Automated entry via ${signal.strategyName} with Risk Governor clearance.`,
      ipAddress: '127.0.0.1',
      outcome: 'SUCCESS',
      correlationId: idempotencyKey,
    });

    return { executed: true, position: newPosition, order: placedOrder };
  }

  /**
   * Closes a position, executes PnL settlement, deducts performance fee,
   * distributes 3-tier referral rewards, and updates immutable ledgers.
   */
  public async closePosition(positionId: string, exitPrice?: number): Promise<{
    success: boolean;
    tradeRecord?: TradeRecord;
    feeSplit?: unknown;
  }> {
    const idx = this.positions.findIndex((p) => p.id === positionId);
    if (idx === -1) return { success: false };

    const pos = this.positions[idx];
    const finalPrice = exitPrice || (pos.direction === 'LONG' ? pos.entryPrice * 1.018 : pos.entryPrice * 0.982);

    // 1. Settle PnL via PnlEngine
    const settlement = this.pnlEngine.settleClosedPosition({
      position: pos,
      exitPrice: Number(finalPrice.toFixed(2)),
      userId: 'usr_default_01',
    });

    const { tradeRecord, feeSplit } = settlement;
    this.tradeHistory.unshift(tradeRecord);
    this.positions.splice(idx, 1);

    // 2. Performance Fee Deductions from Gas Wallet (if net profit > 0 and above HWM)
    if (tradeRecord.performanceFee > 0) {
      this.gasWallet.balance = Number((this.gasWallet.balance - tradeRecord.performanceFee).toFixed(2));
      this.gasWallet.totalFeesPaidAllTime = Number((this.gasWallet.totalFeesPaidAllTime + tradeRecord.performanceFee).toFixed(2));

      // Record in Gas Wallet Ledger
      this.ledgerEngine.recordTransaction({
        ledgerType: 'GAS_WALLET',
        entryType: 'ORIGINAL',
        userId: 'usr_default_01',
        credit: 0,
        debit: tradeRecord.performanceFee,
        referenceId: tradeRecord.id,
        correlationId: tradeRecord.executionId,
        description: `Settlement: 30% performance fee for Trade #${tradeRecord.id} (Gross: $${tradeRecord.grossPnl})`,
      });

      // Distribute to 3 Referral Tiers
      this.referralEngine.distributeTradingRewards({
        sourceUserId: 'usr_default_01',
        sourceUserName: 'Alex M.',
        tradeId: tradeRecord.id,
        eligibleProfit: feeSplit.totalGrossEligibleProfit,
        uplineChain: {
          l1Id: 'usr_upline_l1',
          l2Id: 'usr_upline_l2',
          l3Id: 'usr_upline_l3',
        },
      });

      // Record Referral distribution in Ledger
      this.ledgerEngine.recordTransaction({
        ledgerType: 'REFERRAL_EARNINGS',
        entryType: 'ORIGINAL',
        userId: 'usr_upline_l1',
        credit: feeSplit.level1Reward,
        debit: 0,
        referenceId: tradeRecord.id,
        correlationId: tradeRecord.executionId,
        description: `Referral L1 (10%): Trade #${tradeRecord.id}`,
      });

      // Record Company Retention in Company Revenue Ledger
      this.ledgerEngine.recordTransaction({
        ledgerType: 'COMPANY_REVENUE',
        entryType: 'ORIGINAL',
        userId: 'system_company',
        credit: feeSplit.companyShare,
        debit: 0,
        referenceId: tradeRecord.id,
        correlationId: tradeRecord.executionId,
        description: `Company share (10%): Trade #${tradeRecord.id}`,
      });
    }

    // 3. Update Risk Governor metrics
    const dailyLoss = tradeRecord.netPnl < 0 ? Math.abs(tradeRecord.netPnl) : 0;
    const consecutiveLosses = tradeRecord.netPnl < 0 ? 1 : 0;
    this.riskGovernor.updateFinancialState(25000 + tradeRecord.netPnl, dailyLoss, consecutiveLosses);

    if (this.positions.length === 0) {
      this.botStatus = 'SCANNING';
    }

    AuditLogger.log({
      actorId: 'execution_engine',
      actorRole: 'USER',
      action: 'POSITION_CLOSED',
      category: 'TRADING',
      resourceType: 'POSITION',
      resourceId: positionId,
      beforeState: { entryPrice: pos.entryPrice },
      afterState: { exitPrice: finalPrice, netPnl: tradeRecord.netPnl, performanceFee: tradeRecord.performanceFee },
      reason: `Position closed. Net P&L: $${tradeRecord.netPnl.toFixed(2)}, Performance Fee: $${tradeRecord.performanceFee.toFixed(2)}`,
      ipAddress: '127.0.0.1',
      outcome: 'SUCCESS',
      correlationId: tradeRecord.executionId,
    });

    return { success: true, tradeRecord, feeSplit };
  }

  /**
   * EMERGENCY CLOSE ALL POSITIONS
   * User or Admin Kill Switch Trigger
   */
  public async emergencyCloseAll(reason: string = 'Emergency stop invoked'): Promise<number> {
    this.riskGovernor.triggerUserKillSwitch(true, reason);
    this.setBotStatus('EMERGENCY_STOP');

    const count = this.positions.length;
    for (const pos of [...this.positions]) {
      await this.closePosition(pos.id, pos.markPrice);
    }
    this.positions = [];
    return count;
  }
}
