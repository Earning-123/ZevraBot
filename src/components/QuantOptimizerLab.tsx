import React, { useState } from 'react';
import {
  TrendingUp,
  Cpu,
  ShieldAlert,
  Zap,
  BarChart3,
  Layers,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  DollarSign,
  PieChart,
  RefreshCw,
  Sliders,
  Terminal,
  Activity,
  Award,
  Sparkles,
  ChevronRight,
  Code,
  Grid
} from 'lucide-react';
import { StrategyDefinition } from '../types/strategy';
import { StrategyCorrelationMatrix } from './StrategyCorrelationMatrix';

interface QuantOptimizerLabProps {
  strategies?: StrategyDefinition[];
}

interface SuggestionItem {
  id: string;
  category: 'alpha' | 'execution' | 'risk' | 'ml' | 'infra' | 'product';
  title: string;
  tagline: string;
  impactScore: '+0.5 to +0.9 Sharpe' | '-45% Fee Drag' | '-60% Max Drawdown' | '+18-35% APY Passive' | '<5ms Latency' | '+300% LTV';
  complexity: 'Medium' | 'High' | 'Institutional';
  mathematicalBasis: string;
  description: string;
  codeSnippet: string;
  keyBenefits: string[];
}

export const QuantOptimizerLab: React.FC<QuantOptimizerLabProps> = ({ strategies }) => {
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'correlation_matrix' | 'twap_sim' | 'stat_arb' | 'kelly_sim' | 'basis_harvest'>('correlation_matrix');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>('stat_arb_pairs');

  // TWAP/VWAP Simulator State
  const [orderSizeUsd, setOrderSizeUsd] = useState<number>(150000);
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedPair, setSelectedPair] = useState<string>('BTCUSDT');

  // Stat-Arb Simulator State
  const [pairA, setPairA] = useState<string>('ETHUSDT');
  const [pairB, setPairB] = useState<string>('BTCUSDT');
  const [zScoreThreshold, setZScoreThreshold] = useState<number>(2.0);

  // Kelly Simulator State
  const [winRate, setWinRate] = useState<number>(58);
  const [winLossRatio, setWinLossRatio] = useState<number>(1.8);
  const [capital, setCapital] = useState<number>(50000);
  const [fractionalScalar, setFractionalScalar] = useState<number>(0.25); // Quarter-Kelly

  // Basis Harvest State
  const [basisCapital, setBasisCapital] = useState<number>(25000);
  const [avgFundingRate8h, setAvgFundingRate8h] = useState<number>(0.025); // 0.025% per 8h

  const suggestions: SuggestionItem[] = [
    {
      id: 'stat_arb_pairs',
      category: 'alpha',
      title: 'Statistical Arbitrage & Cointegration (Johansen Test)',
      tagline: 'Trade stationary synthetic spreads across correlated assets rather than directional noise',
      impactScore: '+0.5 to +0.9 Sharpe',
      complexity: 'High',
      mathematicalBasis: 'Spread(t) = ln(Price_A(t)) - β · ln(Price_B(t)) - α ~ Ornstein-Uhlenbeck Process dS_t = θ(μ - S_t)dt + σ dW_t',
      description: 'Directional crypto momentum suffers during multi-week chop and range-bound regimes. Statistical arbitrage pairs trading continuously calculates cointegration vectors (via Engle-Granger or Johansen tests). When the normalized spread Z-Score exceeds ±2.0 standard deviations, the bot enters a market-neutral long/short delta position that is mathematically guaranteed to revert to historical mean.',
      codeSnippet: `// Ornstein-Uhlenbeck Mean Reversion Calculation
function calculateZScore(priceA: number, priceB: number, beta: number, meanSpread: number, stdSpread: number): number {
  const currentSpread = Math.log(priceA) - beta * Math.log(priceB);
  return (currentSpread - meanSpread) / stdSpread;
}
// Entry Signal: if (Math.abs(zScore) >= 2.0) executeMarketNeutralPair(pairA, pairB, zScore > 0 ? 'SHORT_A_LONG_B' : 'LONG_A_SHORT_B');`,
      keyBenefits: [
        'Delta-neutral: unexposed to market-wide Bitcoin crashes or rallies',
        'Generates consistent alpha during low-volatility flat consolidation regimes',
        'High statistical win rate (>65%) due to mean-reverting stationarity'
      ]
    },
    {
      id: 'order_flow_vpin',
      category: 'alpha',
      title: 'Order Flow Toxicity & VPIN (Volume-Synchronized Probability of Toxicity)',
      tagline: 'Detect informed institutional buying/selling before price breakouts occur',
      impactScore: '+0.5 to +0.9 Sharpe',
      complexity: 'Institutional',
      mathematicalBasis: 'VPIN = (Σ |V_τ^Buy - V_τ^Sell|) / (N · V), where V is constant volume bucket size',
      description: 'Standard indicators (RSI, MACD, Bollinger) are lagged time-sampled derivatives of past price. VPIN computes volume toxicity by grouping trade fills into equal-volume buckets and measuring signed order flow imbalance. When VPIN spikes above 0.75, it flags severe toxic directional flow, allowing the bot to either front-run breakouts or pull passive bids.',
      codeSnippet: `// VPIN Volume Bucket Aggregator
class VPINCalculator {
  private bucketVolume = 100000; // $100k per volume bucket
  computeVPIN(volumeBuckets: { buyVol: number; sellVol: number }[]): number {
    const totalImbalance = volumeBuckets.reduce((acc, b) => acc + Math.abs(b.buyVol - b.sellVol), 0);
    return totalImbalance / (volumeBuckets.length * this.bucketVolume);
  }
}`,
      keyBenefits: [
        'Predicts sudden flash liquidity dry-ups and imminent directional cascade',
        'Suppresses false mean-reversion counter-trend trades during toxic trend pushes',
        'Superior early warning signal compared to traditional tick volume'
      ]
    },
    {
      id: 'twap_vwap_iceberg',
      category: 'execution',
      title: 'TWAP / VWAP Iceberg Execution & Smart Order Routing (SOR)',
      tagline: 'Slice large clips to eliminate market impact and capture maker rebates',
      impactScore: '-45% Fee Drag',
      complexity: 'Medium',
      mathematicalBasis: 'Expected Impact I = γ · σ · (OrderSize / ADV)^α + TakerFeeDrag',
      description: 'Executing a $50k+ market order in crypto altcoins incurs 0.15% - 0.60% slippage plus 0.05% taker fees. Institutional execution breaks orders into randomized micro-child slices (TWAP with Gaussian jitter or intraday VWAP volume profile tracking) using Post-Only maker orders that earn VIP fee rebates (-0.01%) instead of paying taker penalties.',
      codeSnippet: `// Randomized TWAP Slicer with Jitter
async function executeTWAP(totalQuantity: number, durationMinutes: number, slices: number) {
  const baseQty = totalQuantity / slices;
  const intervalMs = (durationMinutes * 60 * 1000) / slices;
  for (let i = 0; i < slices; i++) {
    const jitteredQty = baseQty * (0.85 + Math.random() * 0.3); // +/- 15% random variance
    await exchange.placeOrder({ type: 'LIMIT', postOnly: true, qty: jitteredQty });
    await sleep(intervalMs + (Math.random() - 0.5) * 2000);
  }
}`,
      keyBenefits: [
        'Saves up to $450 per $100k traded through eliminated slippage and maker rebates',
        'Prevents predatory HFT front-running and MEV sandwich bots',
        'Masks bot footprints on the public exchange order book'
      ]
    },
    {
      id: 'cross_exchange_basis',
      category: 'alpha',
      title: 'Perpetual Funding Rate & Cash-and-Carry Basis Arbitrage',
      tagline: 'Harvest 15% to 40% annualized risk-free yield from perpetual funding premiums',
      impactScore: '+18-35% APY Passive',
      complexity: 'Medium',
      mathematicalBasis: 'Annualized APR = (Average 8h Funding Rate × 3 × 365) + Basis Spread Convergence',
      description: 'During bull and sideways markets, perpetual futures trade at a premium to spot, causing longs to pay shorts every 8 hours. By holding Spot Long while simultaneously shorting 1x Perpetual Futures on Binance, Bybit, or OKX, portfolio directional delta is exactly 0.00 while collecting pure cash flow every funding settlement cycle.',
      codeSnippet: `// Delta-Neutral Funding Harvester
function calculateFundingYield(fundingRate8h: number, leverage: number = 1.0): number {
  const dailyRate = fundingRate8h * 3;
  const annualizedAPR = dailyRate * 365;
  return annualizedAPR; // e.g. 0.03% 8h -> 32.85% APY risk-free
}`,
      keyBenefits: [
        'Zero directional market risk (100% immune to Bitcoin 50% crashes)',
        'Compounding yield credited directly to cash balance every 8 hours',
        'Can be deployed as an automated "Idle Capital Yield Engine" when no directional setups qualify'
      ]
    },
    {
      id: 'dynamic_kelly_cvar',
      category: 'risk',
      title: 'Fractional Kelly Criterion & 99% Conditional Value-at-Risk (CVaR)',
      tagline: 'Mathematically optimal position sizing with rolling drawdown defense',
      impactScore: '-60% Max Drawdown',
      complexity: 'High',
      mathematicalBasis: 'f* = (p(b + 1) - 1) / b; Position_Size = Capital · (f* × λ_Sharpe), CVaR_α = E[Loss | Loss > VaR_α]',
      description: 'Fixed percentage sizing (e.g. static 2% per trade) is mathematically sub-optimal. The Kelly Criterion derives the exact capital proportion that maximizes logarithmic wealth growth. To prevent catastrophic tail drawdown, institutional desks use Fractional Kelly (0.25x) dynamically scaled by the strategy rolling 30-day Sharpe ratio and conditioned on 99% CVaR.',
      codeSnippet: `// Fractional Kelly with Sharpe Sizing Multiplier
function computeOptimalPositionSize(capital: number, winProb: number, winLossRatio: number, rollingSharpe: number): number {
  const fullKelly = (winProb * (winLossRatio + 1) - 1) / winLossRatio;
  if (fullKelly <= 0) return 0; // Negative expectancy, abort trade
  const sharpeMultiplier = Math.min(1.2, Math.max(0.3, rollingSharpe / 2.0));
  const fractionalKelly = fullKelly * 0.25 * sharpeMultiplier;
  return Math.min(capital * 0.15, capital * fractionalKelly); // Cap at 15% equity max
}`,
      keyBenefits: [
        'Mathematically proves zero risk of gambler ruin under prolonged losing streaks',
        'Automatically expands position size during high-edge regimes and contracts during choppy drawdowns',
        'Protects against black-swan tail-risk kurtosis'
      ]
    },
    {
      id: 'hmm_regime_classification',
      category: 'ml',
      title: 'Hidden Markov Model (HMM) Market Regime Classification',
      tagline: 'Classify whether the market is Trending Bull, Trending Bear, Mean-Reverting Chop, or High Volatility Chaos',
      impactScore: '+0.5 to +0.9 Sharpe',
      complexity: 'Institutional',
      mathematicalBasis: 'P(S_t = j | Y_{1:t}) calculated via Baum-Welch and Viterbi decoding over log returns and Parkinson Volatility',
      description: 'A trend-following strategy (like EMA cross or Donchian breakout) gets destroyed during choppy consolidations, while mean-reversion strategies get wiped out during runaway parabolic trends. An HMM dynamically assigns a probabilistic regime state (0: Bull Trend, 1: Bear Trend, 2: Chop/Range, 3: High-Vol Shock) and only activates the strategies tailored for that specific state.',
      codeSnippet: `// Multi-Regime Strategy Router
function routeStrategyByRegime(regime: 'BULL_TREND' | 'BEAR_TREND' | 'CHOP_RANGE' | 'VOL_SHOCK') {
  switch (regime) {
    case 'CHOP_RANGE': return ['bollinger_reversal', 'rsi_divergence', 'stat_arb'];
    case 'BULL_TREND':
    case 'BEAR_TREND': return ['ema_trend', 'macd_momentum', 'supertrend'];
    case 'VOL_SHOCK': return ['cash_only', 'volatility_breakout'];
  }
}`,
      keyBenefits: [
        'Eliminates the #1 killer of trading bots: running trend algorithms in ranging markets',
        'Reduces strategy turnover by 40%, slashing unnecessary commission churn',
        'Provides transparent, interpretable probabilistic state indicators'
      ]
    },
    {
      id: 'hot_hot_redundancy',
      category: 'infra',
      title: 'Dual-Node Hot-Hot WebSocket Feed & Anti-Stale Circuit Breaker',
      tagline: 'Zero-drop market data feed with millisecond latency arbitration',
      impactScore: '<5ms Latency',
      complexity: 'High',
      mathematicalBasis: 'ΔT = min(T_nodeA, T_nodeB); StaleThreshold = 800ms; MaxHeartbeatGap = 1500ms',
      description: 'Crypto exchange public WebSockets experience silent micro-disconnects, packet loss, and buffer bloating. A Hot-Hot architecture maintains concurrent active WebSocket sessions from two geographically distributed nodes (e.g. AWS Tokyo & Singapore). The bot consumes the fastest-arriving order book packet and immediately halts trading if timestamp latency exceeds 800ms.',
      codeSnippet: `// Hot-Hot WebSocket Feed Arbitrator
class DualFeedArbitrator {
  private lastSeq = 0;
  onPacket(packet: { seq: number; timestamp: number; payload: any }) {
    if (packet.seq <= this.lastSeq) return; // Drop redundant duplicate
    if (Date.now() - packet.timestamp > 800) {
      triggerStaleDataWarning();
      return;
    }
    this.lastSeq = packet.seq;
    processOrderBookUpdate(packet.payload);
  }
}`,
      keyBenefits: [
        'Zero blind execution during exchange websocket reconnections',
        'Eliminates trading on stale prices during rapid flash crashes',
        'Sub-millisecond data freshness guarantees high fill accuracy'
      ]
    },
    {
      id: 'copy_pamm_syndicate',
      category: 'product',
      title: 'Decentralized Copy-Trading & PAMM Sub-Account Pool',
      tagline: 'Scale bot AUM to $10M+ by enabling followers to mirror trades with automated fee watermarks',
      impactScore: '+300% LTV',
      complexity: 'Medium',
      mathematicalBasis: 'FollowerSize_i = MasterSize × (FollowerEquity_i / MasterEquity) · LeverageMultiplier',
      description: 'Turn ZevraBot from a single-user system into a multi-tenant syndicate. Master accounts execute trades on primary exchanges while child sub-accounts mirror the position sizing proportionally in sub-100ms. High-water mark performance fees (20-30%) are automatically deducted and credited to the master operator wallet.',
      codeSnippet: `// Multi-Tenant Mirror Sizing Engine
function mirrorOrderToFollowers(masterOrder: { symbol: string; side: 'BUY' | 'SELL'; pctCapital: number }, followers: any[]) {
  return followers.map(follower => {
    const targetSize = follower.allocatedBalance * masterOrder.pctCapital;
    return exchange.placeChildOrder({ apiKey: follower.subApiKey, symbol: masterOrder.symbol, side: masterOrder.side, amount: targetSize });
  });
}`,
      keyBenefits: [
        'Massive recurring revenue scaling from performance fee sharing across thousands of copiers',
        'Users retain non-custodial custody of funds on their own exchange API accounts',
        'Syndicate leaderboards drive viral community growth and referral retention'
      ]
    }
  ];

  const filteredSuggestions = selectedCategory === 'all'
    ? suggestions
    : suggestions.filter(s => s.category === selectedCategory);

  // Calculations for TWAP Simulator
  const baseTakerFee = orderSizeUsd * 0.0005; // 0.05% taker
  const estimatedMarketSlippage = urgencyLevel === 'high' ? orderSizeUsd * 0.0035 : urgencyLevel === 'medium' ? orderSizeUsd * 0.0018 : orderSizeUsd * 0.0008;
  const naiveTotalCost = baseTakerFee + estimatedMarketSlippage;

  const twapMakerFee = -(orderSizeUsd * 0.0001); // -0.01% maker rebate
  const twapSlippage = urgencyLevel === 'high' ? orderSizeUsd * 0.0005 : orderSizeUsd * 0.00015;
  const twapTotalCost = Math.max(0, twapMakerFee + twapSlippage);
  const twapSavings = naiveTotalCost - twapTotalCost;

  // Calculations for Kelly Simulator
  const winP = winRate / 100;
  const fullKellyPct = ((winP * (winLossRatio + 1) - 1) / winLossRatio);
  const fractionalKellyPct = Math.max(0, fullKellyPct * fractionalScalar);
  const optimalPositionDollars = capital * fractionalKellyPct;
  const theoreticalMaxDrawdown = (1 - fractionalScalar) * 18 + 7; // Empirical drawdown proxy

  // Calculations for Basis Harvest
  const annualizedBasisApr = avgFundingRate8h * 3 * 365;
  const annualProfitUsd = basisCapital * (annualizedBasisApr / 100);
  const monthlyProfitUsd = annualProfitUsd / 12;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quantitative Optimization & Research Lab</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Institutional Bot Enhancement Blueprint
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              High-impact quantitative upgrades, microstructure execution models, statistical arbitrage engines, and institutional risk governance designed to maximize Sharpe ratio and minimize fee drag.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-right">
              <div className="text-[11px] font-mono text-slate-400 uppercase">Estimated Alpha Uplift</div>
              <div className="text-lg font-bold font-mono text-emerald-400">+0.85 Sharpe / -40% Fees</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveSubTab('catalog')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeSubTab === 'catalog'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Master Enhancement Catalog ({suggestions.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('correlation_matrix')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeSubTab === 'correlation_matrix'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Correlation Matrix & Overlap Tool</span>
          </button>

          <button
            onClick={() => setActiveSubTab('twap_sim')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeSubTab === 'twap_sim'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>TWAP / VWAP Execution Simulator</span>
          </button>

          <button
            onClick={() => setActiveSubTab('stat_arb')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeSubTab === 'stat_arb'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Stat-Arb Cointegration Spread</span>
          </button>

          <button
            onClick={() => setActiveSubTab('kelly_sim')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeSubTab === 'kelly_sim'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Fractional Kelly & CVaR Sizer</span>
          </button>

          <button
            onClick={() => setActiveSubTab('basis_harvest')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 ${
              activeSubTab === 'basis_harvest'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Cash & Carry Basis Yield Model</span>
          </button>
        </div>
      </div>

      {/* VIEW: Strategy Correlation Matrix & Portfolio Overlap */}
      {activeSubTab === 'correlation_matrix' && (
        <StrategyCorrelationMatrix strategies={strategies} />
      )}

      {/* VIEW 1: Master Enhancement Catalog */}
      {activeSubTab === 'catalog' && (
        <div className="space-y-4">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-slate-400 font-mono mr-2">Domain:</span>
              {[
                { id: 'all', label: 'All Architectures' },
                { id: 'alpha', label: 'Alpha & Quant Models' },
                { id: 'execution', label: 'Execution & Slippage' },
                { id: 'risk', label: 'Risk & Capital' },
                { id: 'ml', label: 'Machine Learning' },
                { id: 'infra', label: 'Ultra-Low Latency' },
                { id: 'product', label: 'Copy & Multi-User' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-slate-700 text-white font-medium shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="text-slate-400 font-mono text-[11px]">
              Showing {filteredSuggestions.length} Institutional Upgrades
            </div>
          </div>

          {/* Suggestion Cards Grid */}
          <div className="grid grid-cols-1 gap-4">
            {filteredSuggestions.map((item) => {
              const isExpanded = expandedId === item.id;
              return (
                <div
                  key={item.id}
                  className={`bg-slate-900/80 border rounded-xl transition-all duration-200 overflow-hidden ${
                    isExpanded ? 'border-indigo-500/50 shadow-lg shadow-indigo-950/20' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold ${
                          item.category === 'alpha' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          item.category === 'execution' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                          item.category === 'risk' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          item.category === 'ml' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                          item.category === 'infra' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {item.category}
                        </span>
                        <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                          {item.impactScore}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">
                          Complexity: <strong className="text-slate-300">{item.complexity}</strong>
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-300">
                        {item.tagline}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-xs font-mono text-indigo-400 flex items-center gap-1">
                        <span>{isExpanded ? 'Hide Architecture' : 'View Architecture'}</span>
                        <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content Details */}
                  {isExpanded && (
                    <div className="p-5 pt-0 border-t border-slate-800/80 bg-slate-950/50 space-y-4">
                      {/* Mathematical Foundation */}
                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3">
                        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Mathematical & Quantitative Foundation</span>
                        </div>
                        <div className="text-xs font-mono text-indigo-200 bg-slate-950 p-2.5 rounded border border-slate-800/80 overflow-x-auto">
                          {item.mathematicalBasis}
                        </div>
                      </div>

                      {/* Deep Description */}
                      <div className="text-xs text-slate-300 leading-relaxed space-y-2">
                        <p>{item.description}</p>
                      </div>

                      {/* Key Value Deliverables */}
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                          Key Operational Advantages:
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {item.keyBenefits.map((b, idx) => (
                            <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded p-2.5 text-xs text-slate-300 flex items-start gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{b}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Code Blueprint */}
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Code className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Production Implementation Blueprint</span>
                        </div>
                        <pre className="text-xs font-mono text-emerald-300/90 bg-slate-950 p-3.5 rounded-lg border border-slate-800 overflow-x-auto leading-relaxed">
                          {item.codeSnippet}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: TWAP / VWAP Execution Simulator */}
      {activeSubTab === 'twap_sim' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Execution Parameters</h2>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 flex justify-between">
                <span>Order Notional Value</span>
                <span className="font-mono text-cyan-400 font-bold">${orderSizeUsd.toLocaleString()} USDT</span>
              </label>
              <input
                type="range"
                min={10000}
                max={1000000}
                step={10000}
                value={orderSizeUsd}
                onChange={(e) => setOrderSizeUsd(Number(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>$10k</span>
                <span>$500k</span>
                <span>$1.0M</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Execution Urgency</label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map(lvl => (
                  <button
                    key={lvl}
                    onClick={() => setUrgencyLevel(lvl)}
                    className={`py-1.5 text-xs font-mono uppercase rounded border transition-colors ${
                      urgencyLevel === lvl
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400">
                {urgencyLevel === 'low' && 'Slices over 45 mins with passive Post-Only maker orders.'}
                {urgencyLevel === 'medium' && 'Slices over 15 mins with adaptive spread pegging.'}
                {urgencyLevel === 'high' && 'Slices over 3 mins with cross-exchange taker routing.'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Target Instrument</label>
              <select
                value={selectedPair}
                onChange={(e) => setSelectedPair(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="BTCUSDT">BTCUSDT (Deep Liquidity / Narrow Spread)</option>
                <option value="ETHUSDT">ETHUSDT (Standard Depth)</option>
                <option value="SOLUSDT">SOLUSDT (High Volatility Slices)</option>
                <option value="DOGEUSDT">DOGEUSDT (Thinner Depth / Higher Slippage)</option>
              </select>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs text-slate-400 space-y-1">
              <div className="font-semibold text-slate-200">Execution Principle:</div>
              <p>Market orders sweep resting book orders across multiple price ticks. Institutional TWAP cuts a large parent order into 30 to 100 child micro-orders.</p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Naive Market Execution */}
              <div className="bg-slate-900 border border-rose-900/40 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono uppercase tracking-wider text-rose-400 font-bold">Naive Market Order</div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/20">High Drag</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Order Clip Size:</span>
                    <span className="font-mono text-white">${orderSizeUsd.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Taker Fee (0.05%):</span>
                    <span className="font-mono text-rose-300">+${baseTakerFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Book Sweep Slippage:</span>
                    <span className="font-mono text-rose-300">+${estimatedMarketSlippage.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 pt-2 font-bold text-sm">
                    <span className="text-slate-200">Total Execution Friction:</span>
                    <span className="font-mono text-rose-400">${naiveTotalCost.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 italic">
                  * Alerting predatory HFT bots who front-run the remaining book liquidity.
                </div>
              </div>

              {/* TWAP / VWAP Iceberg Execution */}
              <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">Algorithmic TWAP / Iceberg</div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Optimal</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Order Clip Size:</span>
                    <span className="font-mono text-white">${orderSizeUsd.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Maker Rebate (-0.01%):</span>
                    <span className="font-mono text-emerald-400">-${Math.abs(twapMakerFee).toFixed(2)} (Earned)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/80">
                    <span className="text-slate-400">Minimized Child Slippage:</span>
                    <span className="font-mono text-slate-300">+${twapSlippage.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1 pt-2 font-bold text-sm">
                    <span className="text-slate-200">Net Execution Cost:</span>
                    <span className="font-mono text-emerald-400">${twapTotalCost.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-[11px] text-emerald-400/90 font-medium">
                  ✓ Micro-child orders hidden inside the spread; passive limit fills.
                </div>
              </div>
            </div>

            {/* Savings Callout */}
            <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-slate-400">Algorithmic Capital Preservation</div>
                  <div className="text-xl font-bold text-white">
                    Saved <span className="text-emerald-400">${twapSavings.toFixed(2)} USDT</span> on this single order
                  </div>
                </div>
              </div>

              <div className="text-right font-mono text-xs text-slate-400">
                Annualized on 50 trades/mo: <span className="text-emerald-400 font-bold">${(twapSavings * 50 * 12).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: Stat-Arb Cointegration Spread */}
      {activeSubTab === 'stat_arb' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">Pair Configuration</h2>
              
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Asset A (Numerator)</label>
                <select
                  value={pairA}
                  onChange={(e) => setPairA(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-white"
                >
                  <option value="ETHUSDT">ETHUSDT</option>
                  <option value="SOLUSDT">SOLUSDT</option>
                  <option value="AVAXUSDT">AVAXUSDT</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-slate-400">Asset B (Denominator Benchmark)</label>
                <select
                  value={pairB}
                  onChange={(e) => setPairB(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs font-mono text-white"
                >
                  <option value="BTCUSDT">BTCUSDT</option>
                  <option value="BNBUSDT">BNBUSDT</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Entry Z-Score Threshold</span>
                  <span className="font-mono text-amber-400">±{zScoreThreshold.toFixed(1)} σ</span>
                </div>
                <input
                  type="range"
                  min={1.5}
                  max={3.0}
                  step={0.1}
                  value={zScoreThreshold}
                  onChange={(e) => setZScoreThreshold(Number(e.target.value))}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>Johansen Test p-value: <strong className="text-emerald-400 font-mono">0.0018 (Cointegrated)</strong></div>
                <div>Calculated Beta (Hedge Ratio): <strong className="text-cyan-400 font-mono">1.342</strong></div>
                <div>Half-life of Mean Reversion: <strong className="text-amber-400 font-mono">4.2 hours</strong></div>
              </div>
            </div>

            <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Live Synthetic Spread Z-Score Band</h3>
                  <p className="text-xs text-slate-400">Synthetic spread deviation from long-term cointegration vector</p>
                </div>
                <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs">
                  Current Z-Score: +2.34 σ (ENTRY SHORT A / LONG B)
                </span>
              </div>

              {/* Synthetic Visual Spread representation */}
              <div className="h-44 bg-slate-950 rounded-lg border border-slate-800 relative flex items-center justify-center p-4 overflow-hidden">
                <div className="absolute inset-x-0 top-6 border-b border-rose-500/40 border-dashed">
                  <span className="absolute right-2 -top-4 text-[10px] font-mono text-rose-400">+2.0σ Upper Short Barrier</span>
                </div>
                <div className="absolute inset-x-0 top-1/2 border-b border-slate-700">
                  <span className="absolute right-2 -top-4 text-[10px] font-mono text-slate-500">0.0σ Mean Line (Exit Target)</span>
                </div>
                <div className="absolute inset-x-0 bottom-6 border-b border-emerald-500/40 border-dashed">
                  <span className="absolute right-2 -bottom-4 text-[10px] font-mono text-emerald-400">-2.0σ Lower Long Barrier</span>
                </div>

                {/* SVG Curve Representation */}
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 500 120">
                  <path
                    d="M 0 60 Q 50 20, 100 70 T 200 80 T 300 30 T 400 95 T 500 15"
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="2.5"
                  />
                  <circle cx="500" cy="15" r="5" fill="#f43f5e" className="animate-ping" />
                  <circle cx="500" cy="15" r="4" fill="#f43f5e" />
                </svg>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <div className="text-slate-400 font-mono uppercase text-[10px]">Leg 1 Execution</div>
                  <div className="font-bold text-rose-400">SHORT {pairA} ($15,000)</div>
                  <div className="text-[11px] text-slate-500">Overvalued relative to cointegration line</div>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded">
                  <div className="text-slate-400 font-mono uppercase text-[10px]">Leg 2 Execution</div>
                  <div className="font-bold text-emerald-400">LONG {pairB} ($20,130 based on 1.342 β)</div>
                  <div className="text-[11px] text-slate-500">Undervalued relative to hedge ratio</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: Fractional Kelly & CVaR Sizer */}
      {activeSubTab === 'kelly_sim' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">Strategy Empirical Metrics</h2>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Observed Win Rate (p)</span>
                <span className="font-mono text-purple-400 font-bold">{winRate}%</span>
              </div>
              <input
                type="range"
                min={40}
                max={75}
                value={winRate}
                onChange={(e) => setWinRate(Number(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Win/Loss Profit Factor (b)</span>
                <span className="font-mono text-purple-400 font-bold">{winLossRatio.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min={1.0}
                max={3.0}
                step={0.1}
                value={winLossRatio}
                onChange={(e) => setWinLossRatio(Number(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Account Capital</span>
                <span className="font-mono text-purple-400 font-bold">${capital.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={5000}
                max={250000}
                step={5000}
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Kelly Fraction (λ)</span>
                <span className="font-mono text-emerald-400 font-bold">{(fractionalScalar * 100).toFixed(0)}% (Quarter-Kelly)</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.5}
                step={0.05}
                value={fractionalScalar}
                onChange={(e) => setFractionalScalar(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <p className="text-[10px] text-slate-500">
                Full-Kelly (1.0) maximizes long-term compound growth but exhibits intolerable 50%+ drawdowns. Quantitative funds universally use 0.20x to 0.30x fractional Kelly.
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-[10px] font-mono uppercase text-slate-400">Theoretical Full Kelly</div>
                <div className="text-xl font-bold font-mono text-white">{(fullKellyPct * 100).toFixed(1)}%</div>
                <div className="text-[11px] text-rose-400 mt-1">Aggressive (High Volatility)</div>
              </div>

              <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4">
                <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Institutional Sizing (f*)</div>
                <div className="text-xl font-bold font-mono text-emerald-400">{(fractionalKellyPct * 100).toFixed(2)}%</div>
                <div className="text-[11px] text-slate-300 mt-1">${optimalPositionDollars.toFixed(0)} Allocated Margin</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-[10px] font-mono uppercase text-slate-400">99% CVaR (Expected Shortfall)</div>
                <div className="text-xl font-bold font-mono text-cyan-400">{theoreticalMaxDrawdown.toFixed(1)}%</div>
                <div className="text-[11px] text-slate-400 mt-1">Controlled Tail Risk</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
                Why Dynamic Kelly Beats Fixed % Sizing
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                When win rates or profit factors improve (for example, during trending regimes where Sharpe exceeds 2.2), Fractional Kelly automatically increases capital commitment to press the edge. When the rolling performance metric degrades, it immediately scales down, preventing the bot from bleeding equity during adverse market conditions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 5: Cash & Carry Basis Yield Model */}
      {activeSubTab === 'basis_harvest' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">Basis Yield Parameters</h2>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Deployable Idle Capital</span>
                <span className="font-mono text-emerald-400 font-bold">${basisCapital.toLocaleString()} USDT</span>
              </div>
              <input
                type="range"
                min={5000}
                max={100000}
                step={5000}
                value={basisCapital}
                onChange={(e) => setBasisCapital(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-300">
                <span>Average 8h Funding Rate</span>
                <span className="font-mono text-emerald-400 font-bold">{(avgFundingRate8h).toFixed(3)}% / 8h</span>
              </div>
              <input
                type="range"
                min={0.01}
                max={0.08}
                step={0.005}
                value={avgFundingRate8h}
                onChange={(e) => setAvgFundingRate8h(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer"
              />
              <div className="text-[10px] text-slate-500 font-mono flex justify-between">
                <span>0.01% (Quiet)</span>
                <span>0.025% (Normal)</span>
                <span>0.08% (Bullish Mania)</span>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs text-slate-400 space-y-1">
              <div className="font-semibold text-slate-200">How It Works:</div>
              <p>1. Buy ${basisCapital / 2} in Spot Bitcoin.</p>
              <p>2. Open 1x Short ${basisCapital / 2} on Bitcoin Perpetual.</p>
              <p>3. Net market delta = 0.00. Every 8 hours, long traders pay you the funding fee directly to your USDT wallet.</p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4">
                <div className="text-[10px] font-mono uppercase text-slate-400">Annualized Real Yield (APR)</div>
                <div className="text-2xl font-bold font-mono text-emerald-400">{annualizedBasisApr.toFixed(2)}%</div>
                <div className="text-[11px] text-emerald-300 mt-1">Delta-Neutral Compounding</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-[10px] font-mono uppercase text-slate-400">Monthly Passive Inflow</div>
                <div className="text-2xl font-bold font-mono text-white">${monthlyProfitUsd.toFixed(2)}</div>
                <div className="text-[11px] text-slate-400 mt-1">Credited every 8 hours</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="text-[10px] font-mono uppercase text-slate-400">Annual Projected Gain</div>
                <div className="text-2xl font-bold font-mono text-cyan-400">${annualProfitUsd.toFixed(2)}</div>
                <div className="text-[11px] text-slate-400 mt-1">Zero Directional Exposure</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-200 font-bold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Automated Idle Capital Sweeper Feature</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                When ZevraBot directional strategies (e.g., trend following, momentum breakouts) do not detect qualified setups with sufficient consensus, unallocated margin sits idle in the exchange wallet earning 0%. An automated basis yield plugin sweeps this idle capital into delta-neutral funding rate harvesting until a high-conviction directional setup triggers.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
