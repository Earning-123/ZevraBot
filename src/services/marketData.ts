import { MarketTicker, OrderBook } from '../types/trading';

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export class MarketDataService {
  private static tickers: Map<string, MarketTicker> = new Map([
    [
      'BTCUSDT',
      {
        symbol: 'BTCUSDT',
        baseAsset: 'BTC',
        quoteAsset: 'USDT',
        price: 98450.00,
        change24h: 3.42,
        high24h: 99400.00,
        low24h: 96200.00,
        volume24h: 2480000000,
        openInterest: 89400000,
        fundingRate: 0.00010, // +0.0100%
        nextFundingCountdown: '02:45:12',
        markPrice: 98452.50,
        indexPrice: 98448.90,
        atr: 850.50,
        spread: 0.50,
        spreadPct: 0.0005, // 0.05%
        lastUpdated: Date.now(),
      },
    ],
    [
      'ETHUSDT',
      {
        symbol: 'ETHUSDT',
        baseAsset: 'ETH',
        quoteAsset: 'USDT',
        price: 3425.80,
        change24h: 2.15,
        high24h: 3480.00,
        low24h: 3340.00,
        volume24h: 1250000000,
        openInterest: 48000000,
        fundingRate: 0.00008,
        nextFundingCountdown: '02:45:12',
        markPrice: 3426.00,
        indexPrice: 3425.50,
        atr: 42.00,
        spread: 0.10,
        spreadPct: 0.0003,
        lastUpdated: Date.now(),
      },
    ],
    [
      'SOLUSDT',
      {
        symbol: 'SOLUSDT',
        baseAsset: 'SOL',
        quoteAsset: 'USDT',
        price: 218.40,
        change24h: 5.68,
        high24h: 224.50,
        low24h: 206.20,
        volume24h: 890000000,
        openInterest: 31000000,
        fundingRate: 0.00012,
        nextFundingCountdown: '02:45:12',
        markPrice: 218.45,
        indexPrice: 218.35,
        atr: 4.80,
        spread: 0.05,
        spreadPct: 0.0002,
        lastUpdated: Date.now(),
      },
    ],
    [
      'BNBUSDT',
      {
        symbol: 'BNBUSDT',
        baseAsset: 'BNB',
        quoteAsset: 'USDT',
        price: 685.20,
        change24h: 1.10,
        high24h: 692.00,
        low24h: 678.00,
        volume24h: 340000000,
        openInterest: 18000000,
        fundingRate: 0.00005,
        nextFundingCountdown: '02:45:12',
        markPrice: 685.30,
        indexPrice: 685.10,
        atr: 8.50,
        spread: 0.10,
        spreadPct: 0.00015,
        lastUpdated: Date.now(),
      },
    ],
    [
      'XRPUSDT',
      {
        symbol: 'XRPUSDT',
        baseAsset: 'XRP',
        quoteAsset: 'USDT',
        price: 2.4580,
        change24h: 4.82,
        high24h: 2.5800,
        low24h: 2.3200,
        volume24h: 620000000,
        openInterest: 22000000,
        fundingRate: 0.00015,
        nextFundingCountdown: '02:45:12',
        markPrice: 2.4585,
        indexPrice: 2.4575,
        atr: 0.065,
        spread: 0.0005,
        spreadPct: 0.0002,
        lastUpdated: Date.now(),
      },
    ],
    [
      'DOGEUSDT',
      {
        symbol: 'DOGEUSDT',
        baseAsset: 'DOGE',
        quoteAsset: 'USDT',
        price: 0.28450,
        change24h: 7.20,
        high24h: 0.30100,
        low24h: 0.26500,
        volume24h: 480000000,
        openInterest: 19500000,
        fundingRate: 0.00020,
        nextFundingCountdown: '02:45:12',
        markPrice: 0.28455,
        indexPrice: 0.28445,
        atr: 0.0095,
        spread: 0.0001,
        spreadPct: 0.00035,
        lastUpdated: Date.now(),
      },
    ],
    [
      'AVAXUSDT',
      {
        symbol: 'AVAXUSDT',
        baseAsset: 'AVAX',
        quoteAsset: 'USDT',
        price: 38.65,
        change24h: -1.24,
        high24h: 40.10,
        low24h: 37.80,
        volume24h: 210000000,
        openInterest: 9400000,
        fundingRate: -0.00002,
        nextFundingCountdown: '02:45:12',
        markPrice: 38.66,
        indexPrice: 38.64,
        atr: 0.95,
        spread: 0.02,
        spreadPct: 0.0005,
        lastUpdated: Date.now(),
      },
    ],
    [
      'LINKUSDT',
      {
        symbol: 'LINKUSDT',
        baseAsset: 'LINK',
        quoteAsset: 'USDT',
        price: 19.85,
        change24h: 3.12,
        high24h: 20.40,
        low24h: 19.10,
        volume24h: 180000000,
        openInterest: 8100000,
        fundingRate: 0.00006,
        nextFundingCountdown: '02:45:12',
        markPrice: 19.86,
        indexPrice: 19.84,
        atr: 0.45,
        spread: 0.01,
        spreadPct: 0.0005,
        lastUpdated: Date.now(),
      },
    ],
  ]);

  /**
   * Retrieves current ticker for a given symbol
   */
  public static getTicker(symbol: string): MarketTicker {
    const ticker = this.tickers.get(symbol);
    if (!ticker) {
      // Default fallback
      return {
        symbol,
        baseAsset: symbol.replace('USDT', ''),
        quoteAsset: 'USDT',
        price: 100.0,
        change24h: 0,
        high24h: 105,
        low24h: 95,
        volume24h: 50000000,
        openInterest: 5000000,
        fundingRate: 0.0001,
        nextFundingCountdown: '02:45:00',
        markPrice: 100.1,
        indexPrice: 100.0,
        atr: 2.5,
        spread: 0.05,
        spreadPct: 0.0005,
        lastUpdated: Date.now(),
      };
    }
    return ticker;
  }

  /**
   * Returns all active market tickers
   */
  public static getAllTickers(): MarketTicker[] {
    return Array.from(this.tickers.values());
  }

  /**
   * Generates realistic multi-timeframe OHLCV candles
   */
  public static getCandles(symbol: string, timeframe: string, count: number = 30): Candle[] {
    const ticker = this.getTicker(symbol);
    const candles: Candle[] = [];
    const basePrice = ticker.price;
    const now = Date.now();
    const intervalMs = timeframe === '1m' ? 60000 : timeframe === '5m' ? 300000 : timeframe === '15m' ? 900000 : timeframe === '1h' ? 3600000 : timeframe === '4h' ? 14400000 : 86400000;

    let current = basePrice * 0.96;
    for (let i = count; i >= 0; i--) {
      const time = now - i * intervalMs;
      const volatility = (ticker.atr / ticker.price) * 0.4;
      const delta = (Math.random() - 0.48) * current * volatility;
      const open = current;
      const close = current + delta;
      const high = Math.max(open, close) + Math.random() * current * volatility * 0.5;
      const low = Math.min(open, close) - Math.random() * current * volatility * 0.5;
      const volume = Math.floor(ticker.volume24h / 500 + Math.random() * 500000);
      candles.push({ timestamp: time, open, high, low, close, volume });
      current = close;
    }
    return candles;
  }

  /**
   * Generates depth / orderbook snapshot
   */
  public static getOrderBook(symbol: string): OrderBook {
    const ticker = this.getTicker(symbol);
    const p = ticker.price;
    const tick = p > 1000 ? 0.5 : p > 10 ? 0.01 : 0.0001;

    const bids = [
      { price: p - tick * 1, quantity: 2.45, total: 2.45 },
      { price: p - tick * 2, quantity: 4.80, total: 7.25 },
      { price: p - tick * 3, quantity: 9.10, total: 16.35 },
      { price: p - tick * 4, quantity: 14.50, total: 30.85 },
      { price: p - tick * 5, quantity: 22.00, total: 52.85 },
    ];

    const asks = [
      { price: p + tick * 1, quantity: 2.15, total: 2.15 },
      { price: p + tick * 2, quantity: 5.20, total: 7.35 },
      { price: p + tick * 3, quantity: 8.75, total: 16.10 },
      { price: p + tick * 4, quantity: 12.30, total: 28.40 },
      { price: p + tick * 5, quantity: 20.40, total: 48.80 },
    ];

    const spread = tick * 2;
    return {
      symbol,
      bids,
      asks,
      spread,
      spreadPct: spread / p,
      timestamp: Date.now(),
    };
  }

  /**
   * Simulates micro price movement for live chart feedback
   */
  public static simulateTickUpdate(symbol: string): MarketTicker {
    const ticker = this.tickers.get(symbol);
    if (!ticker) return this.getTicker(symbol);

    const step = (Math.random() - 0.495) * (ticker.atr * 0.04);
    const newPrice = Math.max(0.001, Number((ticker.price + step).toFixed(ticker.price > 100 ? 2 : 4)));
    ticker.price = newPrice;
    ticker.markPrice = Number((newPrice + (Math.random() - 0.5) * 0.2).toFixed(2));
    ticker.indexPrice = Number((newPrice + (Math.random() - 0.5) * 0.1).toFixed(2));
    ticker.lastUpdated = Date.now();
    this.tickers.set(symbol, ticker);
    return ticker;
  }
}
