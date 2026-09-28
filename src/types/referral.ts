export type ReferralQualificationStatus = 'LOCKED' | 'ACTIVE';

export interface ReferralMember {
  id: string;
  emailMasked: string;
  joinedAt: number;
  level: 1 | 2 | 3;
  tradingVolume30d: number;
  isActiveTrading: boolean;
  generatedRewardsUsdt: number;
}

export interface ReferralProfile {
  userId: string;
  referralCode: string;
  referredBy?: string;
  directMembersCount: number; // Count of direct Level 1 referrals
  requiredDirectMembersToUnlock: 3; // Rule: Must have 3 direct members!
  status: ReferralQualificationStatus;
  totalTeamCount: number;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  totalEarningsTradingUsdt: number;
  totalEarningsSubscriptionUsdt: number;
  pendingEarningsUsdt: number;
  availableEarningsUsdt: number;
  paidEarningsUsdt: number;
}

export interface ReferralRewardDistribution {
  id: string;
  sourceUserId: string;
  sourceUserName: string;
  type: 'TRADING_PROFIT_FEE' | 'SUBSCRIPTION_FEE';
  tradeId?: string;
  subscriptionPaymentId?: string;
  eligibleBaseProfitOrFee: number;
  level1Reward: {
    recipientId: string;
    amount: number;
    qualified: boolean;
    status: 'PAID' | 'FALLBACK_TO_COMPANY';
  };
  level2Reward: {
    recipientId: string;
    amount: number;
    qualified: boolean;
    status: 'PAID' | 'FALLBACK_TO_COMPANY';
  };
  level3Reward: {
    recipientId: string;
    amount: number;
    qualified: boolean;
    status: 'PAID' | 'FALLBACK_TO_COMPANY';
  };
  companyRetention: number;
  timestamp: number;
}
