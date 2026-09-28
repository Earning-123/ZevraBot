import React, { useState } from 'react';
import { StrategyDefinition, StrategyId } from '../types/strategy';
import { BacktestEngine, BacktestParameters, BacktestResult } from '../services/backtester';
import { TrendingUp, Play, Sliders, Shield, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';

interface BacktestLabProps {
  strategies: StrategyDefinition[];
  preselectedStrategyId?: StrategyId;
}

export const BacktestLab: React.FC<BacktestLabProps> = ({
  strategies,
  preselectedStrategyId = 'ema_trend',
}) => {
  const [strategyId, setStrategyId] = useState<StrategyId>(preselectedStrategyId);
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('15m');
  const [days, setDays] = useState(60);
  const [initialCapital, setInitialCapital] = useState(25000);
  const [leverage, setLeverage] = useState(5);
  const [slippageBps, setSlippageBps] = useState(3); // 3 bps = 0.03%
  const [takerFee, setTakerFee] = useState(0.0004); // 0.04%
  const [fundingDaily, setFundingDaily] = useState(0.0003); // 0.03%
  const [isRunning, setIsRunning] = useState(false);

  // Initial backtest result
  const [result, setResult] = useState<BacktestResult>(() =>
    BacktestEngine.runBacktest({
      strategyId,
      symbol,
      timeframe,
      days,
      initialCapital,
      leverage,
      slippageBasisPoints: slippageBps,
      takerFeeRate: takerFee,
      makerFeeRate: 0.0002,
      fundingRateDaily: fundingDaily,
    })
  );

  const handleRunBacktest = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = BacktestEngine.runBacktest({
        strategyId,
        symbol,
        timeframe,
        days,
        initialCapital,
        leverage: Math.min(10, leverage), // hard ceiling 10x!
        slippageBasisPoints: slippageBps,
        takerFeeRate: takerFee,
        makerFeeRate: 0.0002,
        fundingRateDaily: fundingDaily,
      });
      setResult(res);
      setIsRunning(false);
    }, 400);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            Quantitative Backtesting & Realistic Simulation Lab
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict accounting standards: Distinguishes Gross Profit, Exchange Maker/Taker Fees, Funding Rates, and Market Slippage. Never claims guaranteed profits.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Simulation Model: </span>
          <span className="text-emerald-400 font-semibold">Walk-Forward Out-of-Sample</span>
        </div>
      </div>

      {/* Control Form & Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Backtest Parameter Controls */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-white">Backtest Configuration</h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Strategy Model</label>
              <select
                value={strategyId}
                onChange={(e) => setStrategyId(e.target.value as StrategyId)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono"
              >
                {strategies.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Market Symbol</label>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono"
                >
                  <option value="BTCUSDT">BTC/USDT</option>
                  <option value="ETHUSDT">ETH/USDT</option>
                  <option value="SOLUSDT">SOL/USDT</option>
                  <option value="BNBUSDT">BNB/USDT</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Timeframe</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono"
                >
                  <option value="5m">5m</option>
                  <option value="15m">15m</option>
                  <option value="1h">1h</option>
                  <option value="4h">4h</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">Leverage (Max 10x)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={leverage}
                  onChange={(e) => setLeverage(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Historical Period</label>
                <select
                  value={days}
                  onChange={(e) => setDays(parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono"
                >
                  <option value={30}>30 Days</option>
                  <option value={60}>60 Days</option>
                  <option value={90}>90 Days</option>
                  <option value={180}>180 Days</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <span className="font-semibold text-slate-300 block text-[11px]">Friction & Slippage Assumptions:</span>
              <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                <span>Taker Fee Rate:</span>
                <span>{(takerFee * 100).toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                <span>Slippage Assumption:</span>
                <span>{slippageBps} bps (0.03%)</span>
              </div>
              <div className="flex justify-between text-slate-400 font-mono text-[11px]">
                <span>Avg Daily Funding:</span>
                <span>{(fundingDaily * 100).toFixed(2)}%</span>
              </div>
            </div>

            <button
              onClick={handleRunBacktest}
              disabled={isRunning}
              className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-sm flex items-center justify-center gap-1.5 mt-2"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{isRunning ? 'Simulating Historical Ticks...' : 'Execute Backtest'}</span>
            </button>
          </div>
        </div>

        {/* Right 2 Cols: Backtest Results & Visual Equity Curve */}
        <div className="lg:col-span-2 space-y-4">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">Net Return</span>
              <div className={`text-xl font-bold font-mono ${result.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {result.returnPercent >= 0 ? '+' : ''}{result.returnPercent}%
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {result.netProfit >= 0 ? `+$${result.netProfit.toFixed(2)}` : `-$${Math.abs(result.netProfit).toFixed(2)}`}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">Win Rate</span>
              <div className="text-xl font-bold font-mono text-cyan-400">
                {result.winRate}%
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {result.winningTrades}W / {result.losingTrades}L
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">Profit Factor</span>
              <div className="text-xl font-bold font-mono text-white">
                {result.profitFactor}
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Gross/Loss Ratio</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 text-[10px] block">Max Drawdown</span>
              <div className="text-xl font-bold font-mono text-amber-400">
                {result.maxDrawdownPercent}%
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Sharpe: {result.sharpeRatio}</span>
            </div>
          </div>

          {/* Friction Costs Breakdown */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-around text-center text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">Gross Profit</span>
              <span className="text-slate-200 font-semibold">+${result.grossProfit.toFixed(2)}</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-800" />
            <div>
              <span className="text-slate-500 block text-[10px]">Trading Fees</span>
              <span className="text-rose-400 font-semibold">-${result.totalTradingFees.toFixed(2)}</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-800" />
            <div>
              <span className="text-slate-500 block text-[10px]">Funding Costs</span>
              <span className="text-rose-400 font-semibold">-${result.totalFundingCosts.toFixed(2)}</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-800" />
            <div>
              <span className="text-slate-500 block text-[10px]">Slippage Drag</span>
              <span className="text-rose-400 font-semibold">-${result.totalSlippageCost.toFixed(2)}</span>
            </div>
            <div className="h-6 w-[1px] bg-slate-800" />
            <div>
              <span className="text-slate-500 block text-[10px]">Final Net Profit</span>
              <span className="text-emerald-400 font-bold">+${result.netProfit.toFixed(2)}</span>
            </div>
          </div>

          {/* Stylized Equity Curve Chart */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Simulated Equity Growth Curve</span>
              <span className="font-mono text-slate-300">
                Initial: ${result.initialCapital.toFixed(2)} → Final: ${result.finalCapital.toFixed(2)}
              </span>
            </div>

            <div className="h-44 flex items-end justify-between gap-1 p-2 bg-slate-950/80 rounded-lg border border-slate-800 overflow-hidden">
              {result.equityCurve.map((pt, i) => {
                const minEq = Math.min(...result.equityCurve.map((x) => x.equity)) * 0.98;
                const maxEq = Math.max(...result.equityCurve.map((x) => x.equity)) * 1.02;
                const heightPercent = Math.max(10, ((pt.equity - minEq) / Math.max(1, maxEq - minEq)) * 100);

                return (
                  <div
                    key={i}
                    className="flex-1 bg-emerald-500/80 hover:bg-emerald-400 transition-all rounded-xs"
                    style={{ height: `${heightPercent}%` }}
                    title={`Equity: $${pt.equity.toFixed(2)}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
