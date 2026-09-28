import React, { useState } from 'react';
import { ExchangeAccountStatus } from '../types/trading';
import { Shield, ShieldAlert, CheckCircle2, Key, Lock, AlertTriangle, RefreshCw } from 'lucide-react';

interface ExchangeManagerProps {
  exchanges: ExchangeAccountStatus[];
  onValidateAndSaveKey: (params: {
    exchange: string;
    apiKey: string;
    apiSecret: string;
    passphrase?: string;
  }) => Promise<{ success: boolean; message: string }>;
}

export const ExchangeManager: React.FC<ExchangeManagerProps> = ({
  exchanges,
  onValidateAndSaveKey,
}) => {
  const [selectedExchange, setSelectedExchange] = useState<string>('binance');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleConnect = async (isMaliciousTest = false) => {
    setIsValidating(true);
    setFeedback(null);

    const keyToSubmit = isMaliciousTest
      ? 'binance_test_with_draw_permission_enabled_key_99182'
      : apiKey || 'binance_real_compliant_futures_read_only_88291';
    const secretToSubmit = apiSecret || 'sec_super_confidential_sha256_mock_hash';

    try {
      const res = await onValidateAndSaveKey({
        exchange: selectedExchange,
        apiKey: keyToSubmit,
        apiSecret: secretToSubmit,
        passphrase,
      });

      if (res.success) {
        setFeedback({ message: res.message, type: 'success' });
        setApiKey('');
        setApiSecret('');
        setPassphrase('');
      } else {
        setFeedback({ message: res.message, type: 'error' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Validation failed';
      setFeedback({ message: msg, type: 'error' });
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Strict Non-Negotiable API Security Rule */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              Exchange API Security Governance
              <span className="text-[10px] text-emerald-400 font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                Non-Negotiable
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              ZevraBot strictly NEVER requires withdrawal access. Any API key with withdrawal permissions enabled is automatically rejected with a high-priority security alarm.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>Storage: </span>
          <span className="text-emerald-400 font-semibold">AES-256-GCM Encrypted at Rest</span>
        </div>
      </div>

      {/* Grid: Connected Exchanges & Connect Key Modal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 6 Supported Exchange Adapters */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-semibold text-white">Supported Exchange Adapters</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exchanges.map((ex) => {
              const isConnected = ex.connected;
              return (
                <div
                  key={ex.exchange}
                  className={`p-4 rounded-xl border transition-all ${
                    isConnected ? 'bg-slate-900 border-slate-700/80' : 'bg-slate-950/60 border-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-white">{ex.name}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">Adapter: {ex.exchange.toUpperCase()}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                        isConnected
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isConnected ? 'CONNECTED' : 'NOT CONNECTED'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 font-mono">
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Read Account Info:</span>
                      <span className={ex.permissions.canRead ? 'text-emerald-400' : 'text-slate-600'}>
                        {ex.permissions.canRead ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Futures Trading:</span>
                      <span className={ex.permissions.canTradeFutures ? 'text-emerald-400' : 'text-slate-600'}>
                        {ex.permissions.canTradeFutures ? 'ENABLED' : 'DISABLED'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Withdrawals:</span>
                      <span className="text-emerald-400 font-bold">
                        BANNED (Zero Access)
                      </span>
                    </div>
                    {ex.apiKeyMasked && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/80">
                        <span>Masked Key:</span>
                        <span className="text-slate-200">{ex.apiKeyMasked}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 italic truncate max-w-[200px]">
                      {ex.validationMessage}
                    </span>
                    <button
                      onClick={() => setSelectedExchange(ex.exchange)}
                      className="text-xs text-emerald-400 hover:text-emerald-300 font-medium font-sans"
                    >
                      Configure →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Connect API Form & Malicious Test Demonstrator */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Connect Exchange Credentials</h3>
            <span className="text-xs font-mono text-emerald-400 uppercase">{selectedExchange}</span>
          </div>

          <p className="text-xs text-slate-400">
            Submit API credentials with Read and Futures Trading privileges ONLY.
          </p>

          {feedback && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/60 border border-rose-800 text-rose-300'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span className="leading-relaxed">{feedback.message}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Exchange</label>
              <select
                value={selectedExchange}
                onChange={(e) => setSelectedExchange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono"
              >
                <option value="binance">Binance USDⓈ-M Futures</option>
                <option value="bybit">Bybit USDT Perpetual</option>
                <option value="okx">OKX USDT Swap</option>
                <option value="bitget">Bitget USDT-M Futures</option>
                <option value="deribit">Deribit Perpetual</option>
                <option value="kraken">Kraken Derivatives</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">API Key</label>
              <input
                type="text"
                placeholder="e.g. vmx9k1849... (minimum permissions)"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono placeholder-slate-600 focus:outline-none focus:border-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">API Secret (Never logged or exposed)</label>
              <input
                type="password"
                placeholder="••••••••••••••••••••"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono placeholder-slate-600 focus:outline-none focus:border-slate-700"
              />
            </div>

            {selectedExchange === 'okx' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Passphrase (OKX required)</label>
                <input
                  type="password"
                  placeholder="OKX API Passphrase"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-2 font-mono placeholder-slate-600"
                />
              </div>
            )}

            <div className="pt-2 space-y-2">
              <button
                disabled={isValidating}
                onClick={() => handleConnect(false)}
                className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                {isValidating ? 'Validating API Permissions...' : 'Validate & Connect API Key'}
              </button>

              {/* Malicious Key Security Test Button */}
              <button
                disabled={isValidating}
                onClick={() => handleConnect(true)}
                className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                title="Injects a simulated key that has withdrawal permission to prove the security engine instantly blocks it"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Test Security Guard (Submit With-Draw Key)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
