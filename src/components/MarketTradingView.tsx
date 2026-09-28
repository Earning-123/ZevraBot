import React, { useState, useEffect } from 'react';
import { MarketTicker, OrderBook, Position } from '../types/trading';
import { StrategySignal } from '../types/strategy';
import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';
import { MarketDataService } from '../services/marketData';

interface MarketTradingViewProps {
  tickers: MarketTicker[];
  selectedSymbol: string;
  onSelectSymbol: (symbol: string) => void;
  positions: Position[];
  onClosePosition: (id: string) => void;
  onExecuteSignal: (signal: StrategySignal) => Promise<{ executed: boolean; reason?: string }>;
  availableMargin: number;
}

export const MarketTradingView: React.FC<MarketTradingViewProps> = ({
  tickers,
  selectedSymbol,
  onSelectSymbol,
  positions,
  onClosePosition,
  onExecuteSignal,
  availableMargin,
}) => {
  const currentTicker = tickers.find((t) => t.symbol === selectedSymbol) || tickers[0];
  const [orderBook, setOrderBook] = useState<OrderBook>(MarketDataService.getOrderBook(currentTicker.symbol));
  const [candles, setCandles] = useState(MarketDataService.getCandles(currentTicker.symbol, '15m', 20));
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1m' | '5m' | '15m' | '1h' | '4h'>('15m');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionNotice, setExecutionNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Update orderbook and candles when selectedSymbol or timeframe changes
  useEffect(() => {
    setOrderBook(MarketDataService.getOrderBook(currentTicker.symbol));
    setCandles(MarketDataService.getCandles(currentTicker.symbol, selectedTimeframe, 20));
  }, [currentTicker.symbol, selectedTimeframe]);

  const activePositionForPair = positions.find((p) => p.symbol === currentTicker.symbol);

  // Trigger manual test signal execution through the strict Risk Governor
  const handleTriggerTradeIntent = async (direction: 'LONG' | 'SHORT') => {
    setIsExecuting(true);
    setExecutionNotice(null);

    const p = currentTicker.price;
    const atr = currentTicker.atr;
    const slDistance = atr * 1.5;
    const tpDistance = slDistance * 2.2;

    const stopLoss = direction === 'LONG' ? Number((p - slDistance).toFixed(2)) : Number((p + slDistance).toFixed(2));
    const takeProfit = direction === 'LONG' ? Number((p + tpDistance).toFixed(2)) : Number((p - tpDistance).toFixed(2));

    const testSignal: StrategySignal = {
      strategyId: 'ema_trend',
      strategyName: 'EMA Triple Trend Ribbon',
      symbol: currentTicker.symbol,
      timeframe: selectedTimeframe,
      action: direction,
      confidence: 85,
      entryPrice: p,
      stopLoss,
      takeProfit,
      riskRewardRatio: 2.2,
      riskScore: 3,
      marketRegime: currentTicker.change24h > 1 ? 'BULLISH_EXPANSION' : 'BEARISH_MARKDOWN',
      rationale: `Manual trigger routed into Risk Engine: ${direction} execution with native stop-loss.`,
      timestamp: Date.now(),
    };

    const res = await onExecuteSignal(testSignal);
    setIsExecuting(false);

    if (res.executed) {
      setExecutionNotice({
        message: `Order Approved & Filled by Exchange! Position opened on ${currentTicker.symbol}.`,
        type: 'success',
      });
    } else {
      setExecutionNotice({
        message: res.reason || 'Order intent blocked by Risk Engine.',
        type: 'error',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Symbol Selector Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800">
        {tickers.map((t) => {
          const isSelected = t.symbol === selectedSymbol;
          const isUp = t.change24h >= 0;
          return (
            <button
              key={t.symbol}
              onClick={() => onSelectSymbol(t.symbol)}
              className={`px-3 py-2 rounded-lg text-xs font-mono whitespace-nowrap transition-all flex items-center gap-2 ${
                isSelected
                  ? 'bg-slate-800 border border-slate-700 text-white shadow-sm'
                  : 'bg-slate-900/60 border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <span className="font-sans font-bold text-slate-200">{t.baseAsset}</span>
              <span className="text-slate-500">/USDT</span>
              <span className="font-semibold text-slate-200">${t.price.toFixed(t.price > 100 ? 2 : 4)}</span>
              <span className={`text-[11px] ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isUp ? '+' : ''}{t.change24h.toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Trading Layout: Left Chart & Market Data, Right Orderbook & Execution Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Ticker Statistics & Candle Visualization */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header Stats */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <div className="text-xl font-bold font-mono text-white">
                  ${currentTicker.price.toFixed(currentTicker.price > 100 ? 2 : 4)}
                </div>
                <div className="text-xs text-slate-400 font-sans">
                  Mark: ${currentTicker.markPrice.toFixed(2)} · Index: ${currentTicker.indexPrice.toFixed(2)}
                </div>
              </div>
              <div
                className={`text-sm font-semibold font-mono flex items-center gap-0.5 ${
                  currentTicker.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {currentTicker.change24h >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {currentTicker.change24h >= 0 ? '+' : ''}{currentTicker.change24h.toFixed(2)}%
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">24h High/Low</span>
                <span className="text-slate-300">${currentTicker.high24h.toFixed(2)} / ${currentTicker.low24h.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Funding / Countdown</span>
                <span className="text-emerald-400">{(currentTicker.fundingRate * 100).toFixed(4)}%</span>
                <span className="text-slate-500"> ({currentTicker.nextFundingCountdown})</span>
              </div>
              <div>
                <span className="text-slate-500 block">Open Interest</span>
                <span className="text-slate-300">${(currentTicker.openInterest / 1000000).toFixed(1)}M</span>
              </div>
              <div>
                <span className="text-slate-500 block">Spread / ATR</span>
                <span className="text-cyan-400">{(currentTicker.spreadPct * 100).toFixed(3)}%</span>
                <span className="text-slate-500"> (ATR: {currentTicker.atr.toFixed(2)})</span>
              </div>
            </div>
          </div>

          {/* Candlestick / Bar Visualization Panel */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="text-slate-400 font-medium">Multi-Timeframe Chart Scanner</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800">
                {(['1m', '5m', '15m', '1h', '4h'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setSelectedTimeframe(tf)}
                    className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                      selectedTimeframe === tf ? 'bg-slate-800 text-white font-bold' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Stylized CSS Candlestick Grid */}
            <div className="h-64 flex items-end justify-between gap-1 p-3 bg-slate-950/80 rounded-lg border border-slate-800/80 overflow-hidden">
              {candles.map((c, i) => {
                const isBull = c.close >= c.open;
                const range = Math.max(1, Math.max(...candles.map((x) => x.high)) - Math.min(...candles.map((x) => x.low)));
                const minPrice = Math.min(...candles.map((x) => x.low));

                const bodyHeight = Math.max(4, (Math.abs(c.close - c.open) / range) * 200);
                const bottomOffset = ((Math.min(c.open, c.close) - minPrice) / range) * 200;
                const wickHeight = ((c.high - c.low) / range) * 200;
                const wickBottom = ((c.low - minPrice) / range) * 200;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center h-full justify-end relative group">
                    {/* Wick */}
                    <div
                      className={`w-[1px] absolute ${isBull ? 'bg-emerald-500/70' : 'bg-rose-500/70'}`}
                      style={{ bottom: `${wickBottom}px`, height: `${wickHeight}px` }}
                    />
                    {/* Body */}
                    <div
                      className={`w-full max-w-[8px] rounded-xs absolute transition-all ${
                        isBull ? 'bg-emerald-500' : 'bg-rose-500'
                      } group-hover:brightness-125`}
                      style={{ bottom: `${bottomOffset}px`, height: `${bodyHeight}px` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
              <span>{new Date(candles[0]?.timestamp || Date.now()).toLocaleTimeString()}</span>
              <span>Live Tick Frequency: 200ms · Slippage Guard Active</span>
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Right Col: Live Order Book & Controlled Execution Console */}
        <div className="space-y-4">
          {/* Order Book */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium text-white">Order Book (Depth)</span>
              <span className="font-mono text-[11px]">Spread: ${(orderBook.spread).toFixed(2)}</span>
            </div>

            <div className="space-y-1 font-mono text-xs">
              {/* Asks (Sells) */}
              <div className="space-y-0.5">
                {orderBook.asks.slice(0, 5).reverse().map((ask, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] text-rose-400 hover:bg-slate-800/40 px-1 rounded">
                    <span>${ask.price.toFixed(currentTicker.price > 100 ? 2 : 4)}</span>
                    <span className="text-slate-400 tabular-nums">{ask.quantity.toFixed(3)}</span>
                    <span className="text-slate-500 tabular-nums">{ask.total.toFixed(3)}</span>
                  </div>
                ))}
              </div>

              {/* Mid Price Separator */}
              <div className="py-1 px-1 my-1 rounded bg-slate-950 border border-slate-800 text-center font-bold text-slate-200">
                ${currentTicker.price.toFixed(currentTicker.price > 100 ? 2 : 4)}
              </div>

              {/* Bids (Buys) */}
              <div className="space-y-0.5">
                {orderBook.bids.slice(0, 5).map((bid, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] text-emerald-400 hover:bg-slate-800/40 px-1 rounded">
                    <span>${bid.price.toFixed(currentTicker.price > 100 ? 2 : 4)}</span>
                    <span className="text-slate-400 tabular-nums">{bid.quantity.toFixed(3)}</span>
                    <span className="text-slate-500 tabular-nums">{bid.total.toFixed(3)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Test Order Trigger with Mandatory Risk Engine Validation */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white">Controlled Trade Trigger</span>
              <span className="text-emerald-400 font-mono">Max 10x</span>
            </div>

            <p className="text-xs text-slate-400">
              Triggers a live or sandbox order intent through the strict 18-step Risk Governor & Gas verification engine.
            </p>

            {executionNotice && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                  executionNotice.type === 'success'
                    ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/60 border border-rose-800 text-rose-300'
                }`}
              >
                {executionNotice.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{executionNotice.message}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                disabled={isExecuting || !!activePositionForPair}
                onClick={() => handleTriggerTradeIntent('LONG')}
                className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Test Long</span>
              </button>

              <button
                disabled={isExecuting || !!activePositionForPair}
                onClick={() => handleTriggerTradeIntent('SHORT')}
                className="py-2.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <ArrowDownRight className="w-4 h-4" />
                <span>Test Short</span>
              </button>
            </div>

            {activePositionForPair && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300 font-mono">
                  <span>Current {activePositionForPair.direction}:</span>
                  <span className={activePositionForPair.unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {activePositionForPair.unrealizedPnl >= 0 ? '+' : ''}${activePositionForPair.unrealizedPnl.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={() => onClosePosition(activePositionForPair.id)}
                  className="w-full py-1.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
                >
                  Close Position & Settle 30% Fee
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
