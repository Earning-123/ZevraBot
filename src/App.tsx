import React, { useState, useEffect } from 'react';
import { ApiClient } from './services/apiClient';
import { MarketDataService } from './services/marketData';
import { UserProfile, BotLifecycleStatus, UserRole, AuditLogEntry } from './types/user';
import { MarketTicker, Position, Order, TradeRecord, ExchangeAccountStatus } from './types/trading';
import { StrategyDefinition, StrategyId, StrategySignal, StrategyConsensusResult } from './types/strategy';
import { RiskConfig, SystemKillSwitches, DrawdownState } from './types/risk';
import { GasWalletState, HighWaterMarkState, FinancialLedgerRecord, LedgerReconciliationAudit } from './types/finance';
import { ReferralProfile, ReferralMember, ReferralRewardDistribution } from './types/referral';
import { SubscriptionStatus, SubscriptionDistributionBreakdown } from './types/subscription';

import { Navbar } from './components/Navbar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { MarketTradingView } from './components/MarketTradingView';
import { StrategyMatrix } from './components/StrategyMatrix';
import { RiskGovernorPanel } from './components/RiskGovernorPanel';
import { ExchangeManager } from './components/ExchangeManager';
import { GasWalletLedger } from './components/GasWalletLedger';
import { ReferralHub } from './components/ReferralHub';
import { SubscriptionBilling } from './components/SubscriptionBilling';
import { BacktestLab } from './components/BacktestLab';
import { QuantOptimizerLab } from './components/QuantOptimizerLab';
import { AdminControlCenter } from './components/AdminControlCenter';
import { SecurityAndQAReport } from './components/SecurityAndQAReport';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Core State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [botStatus, setBotStatusState] = useState<BotLifecycleStatus>('READY');
  const [tickers, setTickers] = useState<MarketTicker[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTCUSDT');
  const [positions, setPositions] = useState<Position[]>([]);
  const [tradeHistory, setTradeHistory] = useState<TradeRecord[]>([]);
  const [strategies, setStrategies] = useState<StrategyDefinition[]>([]);
  const [signals, setSignals] = useState<StrategySignal[]>([]);
  const [consensus, setConsensus] = useState<StrategyConsensusResult | null>(null);
  const [riskConfig, setRiskConfig] = useState<RiskConfig | null>(null);
  const [killSwitches, setKillSwitches] = useState<SystemKillSwitches | null>(null);
  const [gasWallet, setGasWallet] = useState<GasWalletState | null>(null);
  const [hwm, setHwm] = useState<HighWaterMarkState | null>(null);
  const [ledgers, setLedgers] = useState<FinancialLedgerRecord[]>([]);
  const [reconciliation, setReconciliation] = useState<LedgerReconciliationAudit[]>([]);
  const [referralProfile, setReferralProfile] = useState<ReferralProfile | null>(null);
  const [referralMembers, setReferralMembers] = useState<ReferralMember[]>([]);
  const [referralDistributions, setReferralDistributions] = useState<ReferralRewardDistribution[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [subDistributions, setSubDistributions] = useState<SubscriptionDistributionBreakdown[]>([]);
  const [exchanges, setExchanges] = useState<ExchangeAccountStatus[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [selectedBacktestStrat, setSelectedBacktestStrat] = useState<StrategyId>('ema_trend');

  // Load initial state
  useEffect(() => {
    async function loadData() {
      const [
        u,
        bs,
        ts,
        pos,
        th,
        strats,
        rc,
        ks,
        gw,
        hwmState,
        ledgs,
        reconc,
        refProf,
        refMems,
        refDists,
        subStat,
        subDists,
        exchs,
        logs,
      ] = await Promise.all([
        ApiClient.getCurrentUser(),
        ApiClient.getBotStatus(),
        ApiClient.getTickers(),
        ApiClient.getPositions(),
        ApiClient.getTradeHistory(),
        ApiClient.getStrategies(),
        ApiClient.getRiskConfig(),
        ApiClient.getKillSwitches(),
        ApiClient.getGasWallet(),
        ApiClient.getHighWaterMark(),
        ApiClient.getFinancialLedger(),
        ApiClient.runMoneyReconciliation(),
        ApiClient.getReferralProfile(),
        ApiClient.getReferralMembers(),
        ApiClient.getReferralDistributions(),
        ApiClient.getSubscriptionStatus(),
        ApiClient.getSubscriptionDistributions(),
        ApiClient.getExchanges(),
        ApiClient.getAuditLogs(),
      ]);

      setUser(u);
      setBotStatusState(bs);
      setTickers(ts);
      setPositions(pos);
      setTradeHistory(th);
      setStrategies(strats);
      setRiskConfig(rc);
      setKillSwitches(ks);
      setGasWallet(gw);
      setHwm(hwmState);
      setLedgers(ledgs);
      setReconciliation(reconc);
      setReferralProfile(refProf);
      setReferralMembers(refMems);
      setReferralDistributions(refDists);
      setSubscription(subStat);
      setSubDistributions(subDists);
      setExchanges(exchs);
      setAuditLogs(logs);

      // Evaluate market for selected symbol
      const evalRes = await ApiClient.evaluateMarket('BTCUSDT');
      setSignals(evalRes.signals);
      setConsensus(evalRes.consensus);
    }

    loadData();
  }, []);

  // Live Micro-Tick Generator to make market depth & positions dynamically update
  useEffect(() => {
    const timer = setInterval(() => {
      MarketDataService.simulateTickUpdate(selectedSymbol);
      const allTs = MarketDataService.getAllTickers();
      setTickers([...allTs]);

      // Update positions unrealized PnL based on current ticker
      setPositions((prev) =>
        prev.map((p) => {
          const t = allTs.find((x) => x.symbol === p.symbol);
          if (!t) return p;
          const markPrice = t.price;
          const priceDiff = p.direction === 'LONG' ? markPrice - p.entryPrice : p.entryPrice - markPrice;
          const unrealizedPnl = Number((priceDiff * p.quantity).toFixed(2));
          const unrealizedPnlPercent = Number(((unrealizedPnl / p.margin) * 100).toFixed(2));
          return {
            ...p,
            markPrice,
            unrealizedPnl,
            unrealizedPnlPercent,
          };
        })
      );
    }, 2500);

    return () => clearInterval(timer);
  }, [selectedSymbol]);

  // When selected symbol changes, re-evaluate strategies
  useEffect(() => {
    async function updateSignals() {
      const evalRes = await ApiClient.evaluateMarket(selectedSymbol);
      setSignals(evalRes.signals);
      setConsensus(evalRes.consensus);
    }
    updateSignals();
  }, [selectedSymbol]);

  // Handlers
  const handleToggleBot = async () => {
    const nextStatus = botStatus === 'TRADING' || botStatus === 'SCANNING' ? 'MANUAL_PAUSE' : 'SCANNING';
    const updated = await ApiClient.setBotStatus(nextStatus);
    setBotStatusState(updated);
    if (user) setUser({ ...user, botStatus: updated });
  };

  const handleEmergencyStop = async () => {
    if (!killSwitches) return;
    const nextActive = !killSwitches.userKillSwitchActive;
    const updatedKs = await ApiClient.triggerUserKillSwitch(nextActive);
    setKillSwitches(updatedKs);
    const updatedBot = await ApiClient.getBotStatus();
    setBotStatusState(updatedBot);
    if (user) setUser({ ...user, botStatus: updatedBot });
  };

  const handleSwitchRole = async (newRole: UserRole) => {
    const u = await ApiClient.switchUserRole(newRole);
    setUser(u);
    const logs = await ApiClient.getAuditLogs();
    setAuditLogs(logs);
  };

  const handleDepositGas = async (amount: number) => {
    const gw = await ApiClient.depositGas(amount);
    setGasWallet(gw);
    const leds = await ApiClient.getFinancialLedger();
    setLedgers(leds);
    const rec = await ApiClient.runMoneyReconciliation();
    setReconciliation(rec);
  };

  const handleClosePosition = async (id: string) => {
    const res = await ApiClient.closePosition(id);
    if (res.success) {
      const pos = await ApiClient.getPositions();
      setPositions(pos);
      const th = await ApiClient.getTradeHistory();
      setTradeHistory(th);
      const gw = await ApiClient.getGasWallet();
      setGasWallet(gw);
      const hwmState = await ApiClient.getHighWaterMark();
      setHwm(hwmState);
      const leds = await ApiClient.getFinancialLedger();
      setLedgers(leds);
      const refDist = await ApiClient.getReferralDistributions();
      setReferralDistributions(refDist);
      const logs = await ApiClient.getAuditLogs();
      setAuditLogs(logs);
    }
  };

  const handleExecuteSignal = async (signal: StrategySignal) => {
    const res = await ApiClient.executeTradeSignal(signal);
    if (res.executed) {
      const pos = await ApiClient.getPositions();
      setPositions(pos);
      const gw = await ApiClient.getGasWallet();
      setGasWallet(gw);
      const bstat = await ApiClient.getBotStatus();
      setBotStatusState(bstat);
      const logs = await ApiClient.getAuditLogs();
      setAuditLogs(logs);
    }
    return res;
  };

  const handleToggleStrategy = async (id: StrategyId, enabled: boolean) => {
    const updatedStrats = await ApiClient.toggleStrategy(id, enabled);
    setStrategies(updatedStrats);
    const evalRes = await ApiClient.evaluateMarket(selectedSymbol);
    setSignals(evalRes.signals);
    setConsensus(evalRes.consensus);
  };

  const handleUpdateWeight = async (id: StrategyId, weight: number) => {
    const updatedStrats = await ApiClient.updateStrategyWeight(id, weight);
    setStrategies(updatedStrats);
    const evalRes = await ApiClient.evaluateMarket(selectedSymbol);
    setSignals(evalRes.signals);
    setConsensus(evalRes.consensus);
  };

  const handleUpdateRiskConfig = async (newConfig: Partial<RiskConfig>) => {
    const rc = await ApiClient.updateRiskConfig(newConfig);
    setRiskConfig(rc);
  };

  const handleValidateAndSaveExchangeKey = async (params: {
    exchange: string;
    apiKey: string;
    apiSecret: string;
    passphrase?: string;
  }) => {
    const res = await ApiClient.validateAndSaveApiKey(params);
    const exchs = await ApiClient.getExchanges();
    setExchanges(exchs);
    const logs = await ApiClient.getAuditLogs();
    setAuditLogs(logs);
    return res;
  };

  const handleSimulateWebhookPayment = async () => {
    const res = await ApiClient.simulateWebhookPayment();
    if (res.success) {
      const sub = await ApiClient.getSubscriptionStatus();
      setSubscription(sub);
      const dists = await ApiClient.getSubscriptionDistributions();
      setSubDistributions(dists);
      const logs = await ApiClient.getAuditLogs();
      setAuditLogs(logs);
    }
    return res;
  };

  const handleRunChaos = async (scenarioId: string) => {
    const res = await ApiClient.runChaosScenario(scenarioId);
    const logs = await ApiClient.getAuditLogs();
    setAuditLogs(logs);
    return res;
  };

  const handleSelectStratForBacktest = (id: StrategyId) => {
    setSelectedBacktestStrat(id);
    setActiveTab('backtest');
  };

  if (!user || !gasWallet || !hwm || !subscription || !riskConfig || !killSwitches || !consensus) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-mono text-xs gap-3">
        <div className="w-8 h-8 rounded-lg border-2 border-emerald-500 border-t-transparent animate-spin" />
        <span>Bootstrapping ZevraBot Core Invariants...</span>
      </div>
    );
  }

  const activeStrategiesCount = strategies.filter((s) => s.enabled).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Universal Top Bar Contract */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        botStatus={botStatus}
        onToggleBot={handleToggleBot}
        gasBalance={gasWallet.balance}
        dynamicGasReq={gasWallet.dynamicRequiredMinimum}
        userRole={user.role}
        onSwitchRole={handleSwitchRole}
        killSwitchActive={killSwitches.userKillSwitchActive || killSwitches.globalKillSwitchActive}
        onEmergencyStop={handleEmergencyStop}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewDashboard
            user={user}
            positions={positions}
            tradeHistory={tradeHistory}
            gasWallet={gasWallet}
            hwm={hwm}
            subscription={subscription}
            activeStrategiesCount={activeStrategiesCount}
            totalStrategiesCount={strategies.length}
            onNavigateTab={setActiveTab}
            onQuickDepositGas={() => setActiveTab('gas_ledger')}
          />
        )}

        {activeTab === 'trading' && (
          <MarketTradingView
            tickers={tickers}
            selectedSymbol={selectedSymbol}
            onSelectSymbol={setSelectedSymbol}
            positions={positions}
            onClosePosition={handleClosePosition}
            onExecuteSignal={handleExecuteSignal}
            availableMargin={user.availableBalanceUsdt}
          />
        )}

        {activeTab === 'strategies' && (
          <StrategyMatrix
            strategies={strategies}
            onToggleStrategy={handleToggleStrategy}
            onUpdateWeight={handleUpdateWeight}
            currentTicker={tickers.find((t) => t.symbol === selectedSymbol) || tickers[0]}
            signals={signals}
            consensus={consensus}
            onSelectStrategyForBacktest={handleSelectStratForBacktest}
          />
        )}

        {activeTab === 'risk' && (
          <RiskGovernorPanel
            config={riskConfig}
            onUpdateConfig={handleUpdateRiskConfig}
            killSwitches={killSwitches}
            onTriggerUserKillSwitch={(active) => {
              ApiClient.triggerUserKillSwitch(active).then(setKillSwitches);
            }}
            onTriggerGlobalKillSwitch={(active) => {
              ApiClient.triggerGlobalKillSwitch(active).then(setKillSwitches);
            }}
            drawdownState={hwm.deficitToRecover > 0 ? 'REDUCED_RISK' : 'NORMAL'}
          />
        )}

        {activeTab === 'exchanges' && (
          <ExchangeManager
            exchanges={exchanges}
            onValidateAndSaveKey={handleValidateAndSaveExchangeKey}
          />
        )}

        {activeTab === 'gas_ledger' && (
          <GasWalletLedger
            gasWallet={gasWallet}
            onDepositGas={handleDepositGas}
            ledgers={ledgers}
            reconciliationReports={reconciliation}
            onRunReconciliation={async () => {
              const rec = await ApiClient.runMoneyReconciliation();
              setReconciliation(rec);
            }}
          />
        )}

        {activeTab === 'referral' && (
          <ReferralHub
            profile={referralProfile!}
            members={referralMembers}
            distributions={referralDistributions}
          />
        )}

        {activeTab === 'subscription' && (
          <SubscriptionBilling
            status={subscription}
            distributions={subDistributions}
            onSimulateWebhookPayment={handleSimulateWebhookPayment}
          />
        )}

        {activeTab === 'backtest' && (
          <BacktestLab
            strategies={strategies}
            preselectedStrategyId={selectedBacktestStrat}
          />
        )}

        {activeTab === 'quant_lab' && <QuantOptimizerLab strategies={strategies} />}

        {activeTab === 'admin' && (
          <AdminControlCenter
            userRole={user.role}
            auditLogs={auditLogs}
            onRunChaosScenario={handleRunChaos}
            onTriggerGlobalShutdown={(active) => {
              ApiClient.triggerGlobalKillSwitch(active).then(setKillSwitches);
            }}
            globalShutdownActive={killSwitches.globalKillSwitchActive}
          />
        )}

        {activeTab === 'qa_audit' && <SecurityAndQAReport />}
      </main>

      {/* Institutional Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>ZevraBot Institutional Engine · Invariant Lever: 10x Hard Cap · Withdrawal Banned</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Server Time (UTC): {new Date().toUTCString().slice(17, 25)}</span>
            <span>·</span>
            <span>All Ledgers Reconciled ($0.00 Variance)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
