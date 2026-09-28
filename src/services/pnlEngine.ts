import { HighWaterMarkState, PerformanceFeeSplit } from '../types/finance';
import { Position, TradeRecord } from '../types/trading';

export class PnlEngine {
  private hwmStates: Map<string, HighWaterMarkState> = new Map();

  constructor() {
    // Initial default test user HWM
    this.hwmStates.set('usr_default_01', {
      userId: 'usr_default_01',
      peakEquity: 25000.0,
      currentEquity: 25000.0,
      deficitToRecover: 0.0,
      isEligibleForFee: true,
      lastHwmUpdate: Date.now(),
    });
  }

  public getHighWaterMark(userId: string): HighWaterMarkState {
    let state = this.hwmStates.get(userId);
    if (!state) {
      state = {
        userId,
        peakEquity: 10000.0,
        currentEquity: 10000.0,
        deficitToRecover: 0.0,
        isEligibleForFee: true,
        lastHwmUpdate: Date.now(),
      };
      this.hwmStates.set(userId, state);
    }
    return { ...state };
  }

  /**
   * Closes a position and calculates gross, fees, funding, net P&L,
   * evaluates High-Water Mark, and computes the 30% performance fee distribution.
   */
  public settleClosedPosition(params: {
    position: Position;
    exitPrice: number;
    userId: string;
    tradingFeeRate?: number; // e.g. 0.0004
    fundingCost?: number;
  }): { tradeRecord: TradeRecord; feeSplit: PerformanceFeeSplit; hwmState: HighWaterMarkState } {
    const { position, exitPrice, userId, tradingFeeRate = 0.0004, fundingCost = 0.85 } = params;

    const directionMultiplier = position.direction === 'LONG' ? 1 : -1;
    const priceDelta = (exitPrice - position.entryPrice) * directionMultiplier;
    const grossPnl = Number((priceDelta * position.quantity).toFixed(2));

    // Fees: Entry fee + Exit fee
    const notionalVolume = position.entryPrice * position.quantity + exitPrice * position.quantity;
    const tradingFees = Number((notionalVolume * tradingFeeRate).toFixed(2));
    const fundingCosts = Number(fundingCost.toFixed(2));

    // Eligible Net Trading P&L
    const netPnl = Number((grossPnl - tradingFees - fundingCosts).toFixed(2));

    // Update High-Water Mark state
    const hwm = this.getHighWaterMark(userId);
    const newEquity = Number((hwm.currentEquity + netPnl).toFixed(2));
    hwm.currentEquity = newEquity;

    let eligibleProfitForFee = 0;

    if (netPnl > 0) {
      // Trade is profitable
      if (newEquity > hwm.peakEquity) {
        // Profit exceeds previous peak equity -> eligible for performance fee
        eligibleProfitForFee = Number((newEquity - hwm.peakEquity).toFixed(2));
        hwm.peakEquity = newEquity;
        hwm.deficitToRecover = 0;
        hwm.isEligibleForFee = true;
      } else {
        // In recovery mode: profitable trade recovering prior loss, NO fee charged!
        hwm.deficitToRecover = Number((hwm.peakEquity - newEquity).toFixed(2));
        hwm.isEligibleForFee = false;
      }
    } else {
      // Trade was a loss: deficit increases, peak equity remains same
      hwm.deficitToRecover = Number((hwm.peakEquity - newEquity).toFixed(2));
      hwm.isEligibleForFee = false;
    }
    hwm.lastHwmUpdate = Date.now();
    this.hwmStates.set(userId, hwm);

    // Compute the 30% Performance Fee Distribution
    // 70% User, 10% L1, 5% L2, 5% L3, 10% Company = 100%
    const totalFeeAmount = Number((eligibleProfitForFee * 0.30).toFixed(2));
    const userRetention = Number((eligibleProfitForFee * 0.70).toFixed(2));
    const l1Share = Number((eligibleProfitForFee * 0.10).toFixed(2));
    const l2Share = Number((eligibleProfitForFee * 0.05).toFixed(2));
    const l3Share = Number((eligibleProfitForFee * 0.05).toFixed(2));
    const companyShare = Number((eligibleProfitForFee * 0.10).toFixed(2));

    const feeSplit: PerformanceFeeSplit = {
      totalGrossEligibleProfit: eligibleProfitForFee,
      totalFeeAmount,
      userRetention,
      level1Reward: l1Share,
      level2Reward: l2Share,
      level3Reward: l3Share,
      companyShare,
      unallocatedToReserve: 0,
    };

    const tradeRecord: TradeRecord = {
      id: `trd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      exchange: position.exchange,
      symbol: position.symbol,
      direction: position.direction,
      leverage: position.leverage,
      quantity: position.quantity,
      entryPrice: position.entryPrice,
      exitPrice,
      grossPnl,
      tradingFees,
      fundingCosts,
      netPnl,
      performanceFee: totalFeeAmount,
      userShare: userRetention,
      l1Share,
      l2Share,
      l3Share,
      companyShare,
      strategyId: position.strategyId,
      signalId: `sig_${Date.now()}`,
      riskScore: 3,
      openedAt: position.openedAt,
      closedAt: Date.now(),
      executionId: `exec_close_${Date.now()}`,
      isPaper: position.isPaper,
      hwmAtExecution: hwm.peakEquity,
    };

    return { tradeRecord, feeSplit, hwmState: hwm };
  }
}
