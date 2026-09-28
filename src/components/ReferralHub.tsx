import React, { useState } from 'react';
import { ReferralMember, ReferralProfile, ReferralRewardDistribution } from '../types/referral';
import { Users, Copy, CheckCircle2, Lock, Unlock, Share2, ArrowUpRight, ShieldCheck } from 'lucide-react';

interface ReferralHubProps {
  profile: ReferralProfile;
  members: ReferralMember[];
  distributions: ReferralRewardDistribution[];
}

export const ReferralHub: React.FC<ReferralHubProps> = ({
  profile,
  members,
  distributions,
}) => {
  const [copied, setCopied] = useState(false);
  const referralUrl = `https://zevrabot.io/register?ref=${profile.referralCode}`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const isUnlocked = profile.directMembersCount >= profile.requiredDirectMembersToUnlock;

  return (
    <div className="space-y-6">
      {/* Top Banner: Referral Qualification Status (3 Direct Members Required!) */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
              isUnlocked
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
            }`}
          >
            {isUnlocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white">3-Tier Affiliate Referral Network</h2>
              <span
                className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${
                  isUnlocked
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}
              >
                Status: {profile.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict Qualification Rule: You must have at least 3 active direct members to unlock rewards. Unqualified levels are safely routed to Company Reserve.
            </p>
          </div>
        </div>

        {/* Direct Member Gauge */}
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[10px]">Direct Members</span>
            <span className={`text-base font-bold tabular-nums ${isUnlocked ? 'text-emerald-400' : 'text-amber-400'}`}>
              {profile.directMembersCount} / {profile.requiredDirectMembersToUnlock}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-slate-800" />
          <div>
            <span className="text-slate-500 block text-[10px]">Network Total</span>
            <span className="text-base font-bold text-white tabular-nums">{profile.totalTeamCount} Members</span>
          </div>
        </div>
      </div>

      {/* Referral Link & Earning Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Referral Link & Tiers Explanation */}
        <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-semibold text-white">Your Institutional Referral Link</h3>
          <p className="text-xs text-slate-400">
            Share this link with quant traders and fund managers. Earn perpetual 3-tier commission on trading profits and subscription renewals.
          </p>

          <div className="space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs">
              <input
                type="text"
                readOnly
                value={referralUrl}
                className="bg-transparent text-slate-300 w-full focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs flex items-center gap-1 transition-colors shrink-0"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="text-[11px] text-slate-500 flex justify-between font-mono">
              <span>Code: {profile.referralCode}</span>
              <span>Referred by: {profile.referredBy || 'None (Direct)'}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 space-y-2.5 text-xs">
            <span className="font-semibold text-white block">Commission Structure:</span>
            <div className="flex items-center justify-between text-slate-400">
              <span>Level 1 (Direct Referrals):</span>
              <span className="text-emerald-400 font-mono font-semibold">10% Trading / 23.33% Sub ($7)</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Level 2 (Secondary Tier):</span>
              <span className="text-cyan-400 font-mono font-semibold">5% Trading / 11.67% Sub ($3.50)</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Level 3 (Tertiary Tier):</span>
              <span className="text-cyan-400 font-mono font-semibold">5% Trading / 11.67% Sub ($3.50)</span>
            </div>
          </div>
        </div>

        {/* Earnings Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Trading Profit Rewards</span>
            <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
              ${profile.totalEarningsTradingUsdt.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-500 font-mono mt-2 block">Accumulated 30% fee share</span>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Subscription Rewards</span>
            <div className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
              ${profile.totalEarningsSubscriptionUsdt.toFixed(2)}
            </div>
            <span className="text-[11px] text-slate-500 font-mono mt-2 block">Quarterly renewals ($7/$3.50)</span>
          </div>

          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-xs text-slate-400 block mb-1">Available for Payout</span>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
              ${profile.availableEarningsUsdt.toFixed(2)}
            </div>
            <span className="text-[11px] text-emerald-400 font-mono mt-2 block">Ready for withdrawal to USDT</span>
          </div>

          {/* Network Tier Breakdown */}
          <div className="sm:col-span-3 p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-around text-center text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[11px]">Level 1 Members</span>
              <span className="text-lg font-bold text-slate-200">{profile.level1Count}</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-800" />
            <div>
              <span className="text-slate-500 block text-[11px]">Level 2 Members</span>
              <span className="text-lg font-bold text-slate-200">{profile.level2Count}</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-800" />
            <div>
              <span className="text-slate-500 block text-[11px]">Level 3 Members</span>
              <span className="text-lg font-bold text-slate-200">{profile.level3Count}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Direct Members Table */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-white">Your Direct Level 1 Members ({members.length})</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 border-b border-slate-800 font-mono text-[11px]">
              <tr>
                <th className="pb-2">Trader Account</th>
                <th className="pb-2">Tier Level</th>
                <th className="pb-2">Joined Date</th>
                <th className="pb-2 text-right">30d Futures Volume</th>
                <th className="pb-2 text-right">Trading Status</th>
                <th className="pb-2 text-right">Rewards Generated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {members.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 font-sans font-medium text-white">{m.emailMasked}</td>
                  <td className="py-2.5 text-cyan-400">Level {m.level}</td>
                  <td className="py-2.5 text-slate-400">{new Date(m.joinedAt).toLocaleDateString()}</td>
                  <td className="py-2.5 text-right text-slate-300 tabular-nums">
                    ${m.tradingVolume30d.toLocaleString()}
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="text-emerald-400 font-semibold">ACTIVE</span>
                  </td>
                  <td className="py-2.5 text-right text-emerald-400 font-bold tabular-nums">
                    +${m.generatedRewardsUsdt.toFixed(2)} USDT
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
