export type ExchangeId = 'binance' | 'bybit' | 'okx' | 'bitget' | 'deribit' | 'kraken';

export interface MarketTicker {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  openInterest: number;
  fundingRate: number;
  nextFundingCountdown: string;
  markPrice: number;
  indexPrice: number;
  atr: number;
  spread: number;
  spreadPct: number;
  lastUpdated: number;
}

export type OrderSide = 'BUY' | 'SELL';
export type PositionDirection = 'LONG' | 'SHORT';
export type OrderType = 'LIMIT' | 'MARKET' | 'STOP_MARKET' | 'TAKE_PROFIT_MARKET';
export type OrderStatus = 'NEW' | 'FILLED' | 'PARTIALLY_FILLED' | 'CANCELLED' | 'REJECTED' | 'EXPIRED';

export interface Order {
  id: string;
  clientOrderId: string;
  exchange: ExchangeId;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price: number;
  quantity: number;
  leverage: number;
  status: OrderStatus;
  stopPrice?: number;
  createdAt: number;
  strategyId?: string;
  executionId: string;
  isPaper: boolean;
  rejectReason?: string;
}

export interface Position {
  id: string;
  symbol: string;
  direction: PositionDirection;
  leverage: number;
  size: number; // in USDT value
  quantity: number; // in coin units
  entryPrice: number;
  markPrice: number;
  liquidationPrice: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
  margin: number;
  stopLoss: number;
  takeProfit: number;
  trailingStop?: number;
  exchange: ExchangeId;
  strategyId: string;
  openedAt: number;
  isPaper: boolean;
}

export interface TradeRecord {
  id: string;
  userId: string;
  exchange: ExchangeId;
  symbol: string;
  direction: PositionDirection;
  leverage: number;
  quantity: number;
  entryPrice: number;
  exitPrice: number;
  grossPnl: number;
  tradingFees: number;
  fundingCosts: number;
  netPnl: number; // Gross - Fees - Funding
  performanceFee: number; // 30% of positive eligible net PnL (subject to HWM)
  userShare: number; // 70% of eligible profit
  l1Share: number; // 10%
  l2Share: number; // 5%
  l3Share: number; // 5%
  companyShare: number; // 10%
  strategyId: string;
  signalId: string;
  riskScore: number;
  openedAt: number;
  closedAt: number;
  executionId: string;
  isPaper: boolean;
  hwmAtExecution: number;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  spreadPct: number;
  timestamp: number;
}

export interface ExchangeAccountStatus {
  exchange: ExchangeId;
  name: string;
  connected: boolean;
  mode: 'SANDBOX' | 'LIVE';
  permissions: {
    canRead: boolean;
    canTradeFutures: boolean;
    hasWithdrawal: boolean; // MUST BE FALSE!
    hasUniversalTransfer: boolean; // MUST BE FALSE!
  };
  validationStatus: 'VALID' | 'WITHDRAWAL_PERMISSION_REJECTED' | 'INVALID_KEYS' | 'DISCONNECTED';
  validationMessage: string;
  lastHealthCheck: number;
  apiKeyMasked: string;
}
