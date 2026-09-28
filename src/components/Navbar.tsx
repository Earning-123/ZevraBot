import React from 'react';
import { BotLifecycleStatus, UserRole } from '../types/user';
import { Shield, AlertTriangle, Play, Pause, Zap, CheckCircle2, Lock } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  botStatus: BotLifecycleStatus;
  onToggleBot: () => void;
  gasBalance: number;
  dynamicGasReq: number;
  userRole: UserRole;
  onSwitchRole: (role: UserRole) => void;
  killSwitchActive: boolean;
  onEmergencyStop: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  botStatus,
  onToggleBot,
  gasBalance,
  dynamicGasReq,
  userRole,
  onSwitchRole,
  killSwitchActive,
  onEmergencyStop,
}) => {
  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'trading', label: 'Live Trading' },
    { id: 'strategies', label: '22 Strategies' },
    { id: 'risk', label: 'Risk Governor' },
    { id: 'exchanges', label: 'Exchanges' },
    { id: 'gas_ledger', label: 'Gas & Ledgers' },
    { id: 'referral', label: 'Referrals' },
    { id: 'subscription', label: 'Subscription' },
    { id: 'backtest', label: 'Backtest' },
    { id: 'quant_lab', label: 'Quant Lab & Roadmap' },
    { id: 'admin', label: 'Admin Console' },
    { id: 'qa_audit', label: 'Audits & QA' },
  ];

  const getStatusBadge = () => {
    switch (botStatus) {
      case 'TRADING':
        return <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />TRADING</span>;
      case 'SCANNING':
        return <span className="inline-flex items-center gap-1.5 text-xs text-cyan-400 font-medium"><span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />SCANNING</span>;
      case 'READY':
        return <span className="inline-flex items-center gap-1.5 text-xs text-slate-300 font-medium"><span className="w-2 h-2 rounded-full bg-slate-400" />READY</span>;
      case 'RISK_PAUSED':
        return <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-medium"><span className="w-2 h-2 rounded-full bg-amber-400" />RISK PAUSED</span>;
      case 'EMERGENCY_STOP':
        return <span className="inline-flex items-center gap-1.5 text-xs text-rose-400 font-medium"><span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />EMERGENCY STOP</span>;
      case 'WAITING_FOR_GAS':
        return <span className="inline-flex items-center gap-1.5 text-xs text-amber-300 font-medium"><span className="w-2 h-2 rounded-full bg-amber-300" />GAS REQUIRED</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-medium"><span className="w-2 h-2 rounded-full bg-slate-600" />{botStatus}</span>;
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Zone 1: Single text element wordmark with domain crest */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/20 via-slate-800 to-slate-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <a
                href="#overview"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('overview');
                }}
                className="text-lg font-bold tracking-tight text-white hover:text-emerald-400 transition-colors"
              >
                ZevraBot
              </a>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-mono">Institutional Futures Engine</span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-2">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Actions & Controls */}
          <div className="flex items-center gap-2.5">
            {/* Status & Gas */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
              {getStatusBadge()}
              <span className="text-slate-700">|</span>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-slate-400">Gas:</span>
                <span
                  className={`font-mono tabular-nums ${
                    gasBalance >= dynamicGasReq ? 'text-emerald-400 font-semibold' : 'text-amber-400'
                  }`}
                >
                  ${gasBalance.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Bot Start / Pause Toggle */}
            <button
              onClick={onToggleBot}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                botStatus === 'TRADING' || botStatus === 'SCANNING'
                  ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm shadow-emerald-950'
              }`}
            >
              {botStatus === 'TRADING' || botStatus === 'SCANNING' ? (
                <>
                  <Pause className="w-3.5 h-3.5" /> Pause Bot
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" /> Activate Bot
                </>
              )}
            </button>

            {/* Emergency Kill Switch */}
            <button
              onClick={onEmergencyStop}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                killSwitchActive
                  ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-sm'
                  : 'bg-rose-500/10 text-rose-300 border border-rose-500/30 hover:bg-rose-500/20'
              }`}
              title="Immediately halts all automated trading and closes open positions safely"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{killSwitchActive ? 'Reset Stop' : 'Kill Switch'}</span>
            </button>

            {/* Role Switcher */}
            <select
              value={userRole}
              onChange={(e) => onSwitchRole(e.target.value as UserRole)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-slate-700"
            >
              <option value="OWNER">Role: Owner</option>
              <option value="TRADING_ADMIN">Role: Trading Admin</option>
              <option value="FINANCE_ADMIN">Role: Finance Admin</option>
              <option value="SUPPORT_ADMIN">Role: Support Admin</option>
              <option value="SECURITY_ADMIN">Role: Security Admin</option>
              <option value="USER">Role: Standard User</option>
            </select>
          </div>
        </div>

        {/* Mobile Nav sub-row */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-900">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded whitespace-nowrap ${
                activeTab === item.id ? 'bg-slate-800 text-white' : 'text-slate-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
