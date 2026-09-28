import React, { useState } from 'react';
import { StrategyDefinition, StrategyId, StrategySignal, StrategyConsensusResult } from '../types/strategy';
import { MarketTicker } from '../types/trading';
import { Sliders, ToggleLeft, ToggleRight, Sparkles, AlertCircle, ArrowUpRight, ArrowDownRight, Minus, CheckCircle2 } from 'lucide-react';

interface StrategyMatrixProps {
  strategies: StrategyDefinition[];
  onToggleStrategy: (id: StrategyId, enabled: boolean) => void;
  onUpdateWeight: (id: StrategyId, weight: number) => void;
  currentTicker: MarketTicker;
  signals: StrategySignal[];
  consensus: StrategyConsensusResult;
  onSelectStrategyForBacktest: (id: StrategyId) => void;
}

export const StrategyMatrix: React.FC<StrategyMatrixProps> = ({
  strategies,
  onToggleStrategy,
  onUpdateWeight,
  currentTicker,
  signals,
  consensus,
  onSelectStrategyForBacktest,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['ALL', 'TREND', 'MOMENTUM', 'VOLATILITY', 'MEAN_REVERSION', 'STRUCTURAL', 'DERIVATIVES', 'AI_ENSEMBLE'];

  const filteredStrategies = strategies.filter((s) => {
    const matchCat = filterCategory === 'ALL' || s.category === filterCategory;
    const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Multi-Strategy Consensus Engine & AI Regime Classifier */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="text-sm font-semibold text-white">
                Multi-Strategy Consensus Matrix ({currentTicker.symbol})
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Aggregates all 22 quantitative strategy models into a unified consensus confidence score. Strategy consensus does NOT override the Risk Engine.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Classified Regime: </span>
              <span className="text-emerald-400 font-semibold">{consensus.regime}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
              <span className="text-slate-400">Consensus Score: </span>
              <span
                className={`font-bold tabular-nums ${
                  consensus.consensusScore > 0 ? 'text-emerald-400' : consensus.consensusScore < 0 ? 'text-rose-400' : 'text-slate-300'
                }`}
              >
                {consensus.consensusScore > 0 ? '+' : ''}{consensus.consensusScore}%
              </span>
            </div>
          </div>
        </div>

        {/* Voting Gauge Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Bullish Votes</span>
            <span className="text-sm font-bold font-mono text-emerald-400">{consensus.longVotes}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Bearish Votes</span>
            <span className="text-sm font-bold font-mono text-rose-400">{consensus.shortVotes}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Neutral / Consolidating</span>
            <span className="text-sm font-bold font-mono text-slate-400">{consensus.neutralVotes}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Execution Readiness</span>
            <span className={`text-xs font-semibold ${consensus.eligibleForExecution ? 'text-emerald-400' : 'text-amber-400'}`}>
              {consensus.eligibleForExecution ? 'TRIGGER READY' : 'BELOW THRESHOLD'}
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-300 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/60 font-sans">
          <span className="font-semibold text-slate-400">Consensus Assessment: </span>
          {consensus.primaryRationale}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto p-1 bg-slate-900 rounded-lg border border-slate-800">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                filterCategory === cat ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Filter 22 strategies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
        />
      </div>

      {/* Grid of 22 Modular Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStrategies.map((strat) => {
          const sig = signals.find((s) => s.strategyId === strat.id);
          const isLong = sig?.action === 'LONG';
          const isShort = sig?.action === 'SHORT';

          return (
            <div
              key={strat.id}
              className={`p-4 rounded-xl border transition-all ${
                strat.enabled
                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-900 opacity-60'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-bold text-white font-sans">{strat.name}</h3>
                    <span className="text-[10px] text-slate-500 font-mono">v{strat.version}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 font-mono">
                    <span>{strat.category}</span>
                    <span>·</span>
                    <span>TF: {strat.timeframe}</span>
                    <span>·</span>
                    <span className={strat.riskTier === 'CONSERVATIVE' ? 'text-emerald-400' : 'text-amber-400'}>
                      {strat.riskTier}
                    </span>
                  </div>
                </div>

                {/* Enable/Disable Toggle */}
                <button
                  onClick={() => onToggleStrategy(strat.id, !strat.enabled)}
                  className={`p-1 rounded transition-colors ${strat.enabled ? 'text-emerald-400' : 'text-slate-600'}`}
                  title={strat.enabled ? 'Disable Strategy' : 'Enable Strategy'}
                >
                  {strat.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-400 line-clamp-2 mb-3 min-h-[32px]">
                {strat.description}
              </p>

              {/* Live Signal Indicator */}
              <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 mb-3 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Live Signal:</span>
                  <span
                    className={`font-mono font-bold flex items-center gap-1 ${
                      isLong ? 'text-emerald-400' : isShort ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  >
                    {isLong ? <ArrowUpRight className="w-3.5 h-3.5" /> : isShort ? <ArrowDownRight className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                    {sig?.action || 'NO_TRADE'}
                  </span>
                </div>
                {sig && sig.action !== 'NO_TRADE' && (
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>Conf: {sig.confidence}%</span>
                    <span>SL: ${sig.stopLoss}</span>
                    <span>TP: ${sig.takeProfit}</span>
                  </div>
                )}
                {sig?.rationale && (
                  <p className="text-[10px] text-slate-500 italic truncate pt-0.5">
                    {sig.rationale}
                  </p>
                )}
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono py-2 border-t border-slate-800/70">
                <div>
                  <span className="text-[10px] text-slate-500 block">Win Rate</span>
                  <span className="text-emerald-400 font-semibold">{strat.winRate}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Profit Factor</span>
                  <span className="text-slate-200 font-semibold">{strat.profitFactor}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Sharpe</span>
                  <span className="text-slate-200 font-semibold">{strat.sharpeRatio}</span>
                </div>
              </div>

              {/* Weight Slider & Backtest Link */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px]">Weight:</span>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={strat.weight}
                    onChange={(e) => onUpdateWeight(strat.id, parseFloat(e.target.value))}
                    className="w-16 accent-emerald-500 cursor-pointer"
                  />
                  <span className="font-mono text-slate-300 text-[11px]">{strat.weight.toFixed(1)}x</span>
                </div>

                <button
                  onClick={() => onSelectStrategyForBacktest(strat.id)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Backtest →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
