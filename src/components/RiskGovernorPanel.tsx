import React, { useState } from 'react';
import { DrawdownState, RiskConfig, SystemKillSwitches } from '../types/risk';
import { Shield, AlertTriangle, Lock, Sliders, CheckCircle2, XCircle, Zap } from 'lucide-react';

interface RiskGovernorPanelProps {
  config: RiskConfig;
  onUpdateConfig: (newConfig: Partial<RiskConfig>) => void;
  killSwitches: SystemKillSwitches;
  onTriggerUserKillSwitch: (active: boolean) => void;
  onTriggerGlobalKillSwitch: (active: boolean) => void;
  drawdownState: DrawdownState;
}

export const RiskGovernorPanel: React.FC<RiskGovernorPanelProps> = ({
  config,
  onUpdateConfig,
  killSwitches,
  onTriggerUserKillSwitch,
  onTriggerGlobalKillSwitch,
  drawdownState,
}) => {
  const [leverage, setLeverage] = useState(config.userConfiguredMaxLeverage);
  const [riskPerTrade, setRiskPerTrade] = useState(config.riskPerTradePercent);
  const [maxExposure, setMaxExposure] = useState(config.maxAccountExposurePercent);
  const [maxPositions, setMaxPositions] = useState(config.maxConcurrentPositions);
  const [dailyLossLimit, setDailyLossLimit] = useState(config.dailyLossLimitPercent);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSaveRiskLimits = () => {
    // Invariant: leverage must never exceed hard platform cap 10x
    const safeLeverage = Math.min(10, Math.max(1, leverage));
    onUpdateConfig({
      userConfiguredMaxLeverage: safeLeverage,
      riskPerTradePercent: riskPerTrade,
      maxAccountExposurePercent: maxExposure,
      maxConcurrentPositions: maxPositions,
      dailyLossLimitPercent: dailyLossLimit,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Hard Platform Safety Limits */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              Risk Governor & Hard Safety Boundaries
              <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                Active Enforcement
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              The AI/Strategy layer can NEVER bypass the Risk Engine. All orders undergo 18-step pre-flight safety clearance.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block">Platform Max Leverage</span>
            <span className="text-emerald-400 font-bold">10x Hard Ceiling</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block">Drawdown Status</span>
            <span
              className={`font-bold ${
                drawdownState === 'NORMAL' ? 'text-emerald-400' : drawdownState === 'REDUCED_RISK' ? 'text-amber-400' : 'text-rose-400'
              }`}
            >
              {drawdownState}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Configurable Risk Controls & Kill Switch Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Quantitative Risk Parameters */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Configurable Risk Parameters</h3>
            {savedNotice && (
              <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Risk parameters locked & saved.
              </span>
            )}
          </div>

          <div className="space-y-4">
            {/* Setting 1: Leverage */}
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white">Target Position Leverage</span>
                  <span className="text-[11px] text-slate-500 block">Restricted between 1x and 10x hard ceiling</span>
                </div>
                <span className="text-base font-bold font-mono text-emerald-400">{leverage}x</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={leverage}
                onChange={(e) => setLeverage(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1x (Ultra Safe)</span>
                <span>3x (Conservative)</span>
                <span>5x (Standard)</span>
                <span>10x (Platform Max Ceiling)</span>
              </div>
            </div>

            {/* Setting 2: Risk Per Trade % */}
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white">Capital Risk Per Trade (%)</span>
                  <span className="text-[11px] text-slate-500 block">Determines position sizing based on stop-loss distance</span>
                </div>
                <span className="text-base font-bold font-mono text-cyan-400">{riskPerTrade}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="3.0"
                step="0.1"
                value={riskPerTrade}
                onChange={(e) => setRiskPerTrade(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.5% (Institutional)</span>
                <span>1.5% (Balanced)</span>
                <span>3.0% (Aggressive Max)</span>
              </div>
            </div>

            {/* Setting 3: Max Account Margin Exposure */}
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white">Maximum Account Exposure (%)</span>
                  <span className="text-[11px] text-slate-500 block">Maximum total margin committed across all open trades</span>
                </div>
                <span className="text-base font-bold font-mono text-white">{maxExposure}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="60"
                step="5"
                value={maxExposure}
                onChange={(e) => setMaxExposure(parseInt(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Setting 4: Max Concurrent Trades */}
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white text-xs">Max Concurrent Open Trades</span>
                <span className="text-[11px] text-slate-500 block">Conservative slot limit (1, 2, 3, 5, 10)</span>
              </div>
              <select
                value={maxPositions}
                onChange={(e) => setMaxPositions(parseInt(e.target.value))}
                className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 font-mono"
              >
                <option value={1}>1 Trade</option>
                <option value={2}>2 Trades</option>
                <option value={3}>3 Trades (Recommended)</option>
                <option value={5}>5 Trades</option>
                <option value={10}>10 Trades</option>
              </select>
            </div>

            {/* Setting 5: Daily Loss Hard Stop Limit */}
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="font-semibold text-white text-xs">Daily Loss Hard Stop (%)</span>
                <span className="text-[11px] text-slate-500 block">When hit, ALL new automated trading is immediately blocked</span>
              </div>
              <select
                value={dailyLossLimit}
                onChange={(e) => setDailyLossLimit(parseFloat(e.target.value))}
                className="bg-slate-900 border border-slate-800 text-rose-400 font-bold text-xs rounded-lg px-3 py-1.5 font-mono"
              >
                <option value={2.0}>2.0% Daily Loss</option>
                <option value={3.0}>3.0% Daily Loss</option>
                <option value={4.0}>4.0% Daily Loss (Default)</option>
                <option value={5.0}>5.0% Daily Loss</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSaveRiskLimits}
              className="py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              Save & Lock Risk Limits
            </button>
          </div>
        </div>

        {/* Right Col: Three-Tier Kill Switches & Active Invariants */}
        <div className="space-y-4">
          {/* Emergency Kill Switches */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-semibold text-white">Three-Tier Emergency Kill Switches</h3>
            </div>
            <p className="text-xs text-slate-400">
              Instant manual controls independent of the strategy/AI layer.
            </p>

            <div className="space-y-3 pt-1">
              {/* User Kill Switch */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">User Kill Switch</span>
                  <span
                    className={`font-mono text-[11px] font-bold ${
                      killSwitches.userKillSwitchActive ? 'text-rose-400' : 'text-slate-500'
                    }`}
                  >
                    {killSwitches.userKillSwitchActive ? 'ENGAGED' : 'READY'}
                  </span>
                </div>
                <button
                  onClick={() => onTriggerUserKillSwitch(!killSwitches.userKillSwitchActive)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                    killSwitches.userKillSwitchActive
                      ? 'bg-slate-800 text-white hover:bg-slate-700'
                      : 'bg-rose-600/20 text-rose-300 border border-rose-600/30 hover:bg-rose-600/30'
                  }`}
                >
                  {killSwitches.userKillSwitchActive ? 'Disengage User Kill Switch' : 'Engage User Kill Switch'}
                </button>
              </div>

              {/* Global Kill Switch */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">Global Emergency Shutdown</span>
                  <span
                    className={`font-mono text-[11px] font-bold ${
                      killSwitches.globalKillSwitchActive ? 'text-rose-400' : 'text-slate-500'
                    }`}
                  >
                    {killSwitches.globalKillSwitchActive ? 'SHUTDOWN ACTIVE' : 'NOMINAL'}
                  </span>
                </div>
                <button
                  onClick={() => onTriggerGlobalKillSwitch(!killSwitches.globalKillSwitchActive)}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                    killSwitches.globalKillSwitchActive
                      ? 'bg-slate-800 text-white hover:bg-slate-700'
                      : 'bg-rose-600 text-white hover:bg-rose-500 shadow-sm'
                  }`}
                >
                  {killSwitches.globalKillSwitchActive ? 'Resume Global Trading' : 'HALT ALL TRADING (Global)'}
                </button>
              </div>
            </div>
          </div>

          {/* Hard Invariants List */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-white">Active Safety Invariants</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Withdrawal Permissions:</span>
                <span className="text-emerald-400 font-medium">STRICTLY BANNED</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Stale Market Feed Cutoff:</span>
                <span className="font-mono text-slate-200">&lt; 5000ms</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Max Bid-Ask Spread:</span>
                <span className="font-mono text-slate-200">0.15% (15 bps)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Consecutive Loss Sizing Cut:</span>
                <span className="font-mono text-amber-400">3 losses (50% cut)</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="text-slate-400">Consecutive Loss Pause:</span>
                <span className="font-mono text-rose-400">5 losses (Auto Pause)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
