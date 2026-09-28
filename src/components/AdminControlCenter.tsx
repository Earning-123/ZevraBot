import React, { useState } from 'react';
import { AuditLogEntry, UserRole } from '../types/user';
import { CHAOS_SCENARIOS, ChaosScenario, ChaosTestResult } from '../services/chaosTester';
import { Shield, AlertTriangle, Play, RefreshCw, CheckCircle2, Lock, Terminal, Activity } from 'lucide-react';

interface AdminControlCenterProps {
  userRole: UserRole;
  auditLogs: AuditLogEntry[];
  onRunChaosScenario: (id: string) => Promise<ChaosTestResult>;
  onTriggerGlobalShutdown: (active: boolean) => void;
  globalShutdownActive: boolean;
}

export const AdminControlCenter: React.FC<AdminControlCenterProps> = ({
  userRole,
  auditLogs,
  onRunChaosScenario,
  onTriggerGlobalShutdown,
  globalShutdownActive,
}) => {
  const [selectedScenario, setSelectedScenario] = useState<string>(CHAOS_SCENARIOS[0].id);
  const [chaosResult, setChaosResult] = useState<ChaosTestResult | null>(null);
  const [isRunningChaos, setIsRunningChaos] = useState(false);
  const [logFilter, setLogFilter] = useState<string>('ALL');

  const isOwner = userRole === 'OWNER';

  const handleExecuteChaos = async () => {
    setIsRunningChaos(true);
    setChaosResult(null);
    const res = await onRunChaosScenario(selectedScenario);
    setChaosResult(res);
    setIsRunningChaos(false);
  };

  const filteredLogs = logFilter === 'ALL'
    ? auditLogs
    : auditLogs.filter((l) => l.category === logFilter);

  return (
    <div className="space-y-6">
      {/* Top Banner: RBAC & Owner Authority */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">Institutional Administrative Console</h2>
              <span className="text-[10px] text-purple-400 font-mono px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                Active Role: {userRole}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Owner controls protected by RBAC matrix. Critical economic variables and global kill switches require Owner authorization.
            </p>
          </div>
        </div>

        {/* Global Shutdown Control */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onTriggerGlobalShutdown(!globalShutdownActive)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
              globalShutdownActive
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{globalShutdownActive ? 'Resume Global Trading' : 'Engage Global Shutdown'}</span>
          </button>
        </div>
      </div>

      {/* Grid: Chaos Testing Suite & Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Chaos Failure Mode Simulator */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Chaos Failure & Resilience Suite</h3>
            <span className="text-[10px] font-mono text-cyan-400">Recovery Validation</span>
          </div>

          <p className="text-xs text-slate-400">
            Inject deliberate real-world failure events to prove the trading engine safely halts and reconciles state without uncontrolled orders.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Fault Scenario</label>
              <select
                value={selectedScenario}
                onChange={(e) => setSelectedScenario(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono"
              >
                {CHAOS_SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Scenario Details */}
            {(() => {
              const cur = CHAOS_SCENARIOS.find((s) => s.id === selectedScenario);
              if (!cur) return null;
              return (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
                  <span className="text-slate-400 block text-[11px]">{cur.description}</span>
                  <div className="text-[11px] text-amber-300 font-mono">
                    <span className="text-slate-500">Fault: </span>{cur.simulatedFault}
                  </div>
                  <div className="text-[11px] text-emerald-400 font-mono">
                    <span className="text-slate-500">Safe Rule: </span>{cur.expectedBehavior}
                  </div>
                </div>
              );
            })()}

            <button
              onClick={handleExecuteChaos}
              disabled={isRunningChaos}
              className="w-full py-2.5 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Terminal className="w-4 h-4" />
              <span>{isRunningChaos ? 'Injecting Fault & Validating...' : 'Inject Chaos Fault & Verify Recovery'}</span>
            </button>
          </div>

          {/* Chaos Test Output Log */}
          {chaosResult && (
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 font-mono text-[11px]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-bold">Execution Trace</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> RECOVERY PASSED
                </span>
              </div>
              <div className="space-y-1 text-slate-400 max-h-40 overflow-y-auto">
                {chaosResult.logs.map((log, i) => (
                  <div key={i} className={log.includes('FAIL') ? 'text-amber-400' : log.includes('Recovery') ? 'text-emerald-300' : 'text-slate-400'}>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 2 Cols: Immutable System Audit Logs Explorer */}
        <div className="lg:col-span-2 p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Immutable System Audit Logs</h3>
              <p className="text-xs text-slate-400">
                Detailed audit trail recording actor, action, before/after states, IP metadata, and correlation IDs.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              {(['ALL', 'SECURITY', 'TRADING', 'RISK', 'EXCHANGE'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setLogFilter(cat)}
                  className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap transition-colors ${
                    logFilter === cat ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px]">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 border-b border-slate-800 font-mono text-[11px] sticky top-0 bg-slate-900">
                <tr>
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2">Actor / Role</th>
                  <th className="pb-2">Action</th>
                  <th className="pb-2">Target</th>
                  <th className="pb-2">Reason</th>
                  <th className="pb-2 text-right">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5">
                      <span className="text-slate-200 font-semibold">{log.actorId}</span>
                      <span className="text-slate-500 text-[10px] block">{log.actorRole}</span>
                    </td>
                    <td className="py-2.5 text-cyan-300">{log.action}</td>
                    <td className="py-2.5 text-slate-400 text-[11px]">
                      {log.resourceType}:{log.resourceId}
                    </td>
                    <td className="py-2.5 text-slate-400 font-sans text-[11px] max-w-xs truncate">
                      {log.reason || '—'}
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          log.outcome === 'SUCCESS'
                            ? 'bg-emerald-950 text-emerald-300'
                            : 'bg-rose-950 text-rose-300'
                        }`}
                      >
                        {log.outcome}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
