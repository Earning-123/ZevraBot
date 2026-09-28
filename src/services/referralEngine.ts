import { ReferralMember, ReferralProfile, ReferralRewardDistribution } from '../types/referral';

export class ReferralEngine {
  // Mock tree database
  private profiles: Map<string, ReferralProfile> = new Map();
  private members: Map<string, ReferralMember[]> = new Map();
  private rewardDistributions: ReferralRewardDistribution[] = [];

  constructor() {
    // Seed initial demo profile
    this.profiles.set('usr_default_01', {
      userId: 'usr_default_01',
      referralCode: 'ZEVRA-ALPHA-77',
      referredBy: 'usr_upline_l1',
      directMembersCount: 3, // Meets rule >= 3
      requiredDirectMembersToUnlock: 3,
      status: 'ACTIVE',
      totalTeamCount: 12,
      level1Count: 3,
      level2Count: 5,
      level3Count: 4,
      totalEarningsTradingUsdt: 845.50,
      totalEarningsSubscriptionUsdt: 245.00,
      pendingEarningsUsdt: 35.00,
      availableEarningsUsdt: 1055.50,
      paidEarningsUsdt: 0,
    });

    this.members.set('usr_default_01', [
      {
        id: 'usr_l1_01',
        emailMasked: 'mar***@quant.trade',
        joinedAt: Date.now() - 25 * 86400000,
        level: 1,
        tradingVolume30d: 485000,
        isActiveTrading: true,
        generatedRewardsUsdt: 412.50,
      },
      {
        id: 'usr_l1_02',
        emailMasked: 'jul***@crypto.capital',
        joinedAt: Date.now() - 18 * 86400000,
        level: 1,
        tradingVolume30d: 310000,
        isActiveTrading: true,
        generatedRewardsUsdt: 280.00,
      },
      {
        id: 'usr_l1_03',
        emailMasked: 'ale***@defi.fund',
        joinedAt: Date.now() - 8 * 86400000,
        level: 1,
        tradingVolume30d: 195000,
        isActiveTrading: true,
        generatedRewardsUsdt: 153.00,
      },
    ]);
  }

  public getProfile(userId: string): ReferralProfile {
    let p = this.profiles.get(userId);
    if (!p) {
      p = {
        userId,
        referralCode: `ZEVRA-${userId.slice(-4).toUpperCase()}`,
        directMembersCount: 0,
        requiredDirectMembersToUnlock: 3,
        status: 'LOCKED',
        totalTeamCount: 0,
        level1Count: 0,
        level2Count: 0,
        level3Count: 0,
        totalEarningsTradingUsdt: 0,
        totalEarningsSubscriptionUsdt: 0,
        pendingEarningsUsdt: 0,
        availableEarningsUsdt: 0,
        paidEarningsUsdt: 0,
      };
      this.profiles.set(userId, p);
    }
    return { ...p };
  }

  public getTeamMembers(userId: string): ReferralMember[] {
    return this.members.get(userId) || [];
  }

  public getDistributions(): ReferralRewardDistribution[] {
    return [...this.rewardDistributions];
  }

  /**
   * Validates referral association to prevent:
   * 1. Self referral
   * 2. Circular referral
   * 3. Duplicate referral
   */
  public validateReferralLinkage(userId: string, referrerCode: string): { valid: boolean; reason?: string } {
    if (!referrerCode || referrerCode.trim() === '') {
      return { valid: false, reason: 'Referral code cannot be blank.' };
    }

    const current = this.getProfile(userId);
    if (current.referralCode === referrerCode) {
      return { valid: false, reason: 'SECURITY VIOLATION: Self-referral is strictly prohibited.' };
    }

    // Check if referrer exists and verify no circular reference
    for (const [id, prof] of this.profiles.entries()) {
      if (prof.referralCode === referrerCode) {
        if (prof.referredBy === userId) {
          return { valid: false, reason: 'SECURITY VIOLATION: Circular referral loop detected.' };
        }
        return { valid: true };
      }
    }

    return { valid: true }; // New referral valid
  }

  /**
   * Distributes trading profit referral fee:
   * L1 = 10%, L2 = 5%, L3 = 5%, Company = 10%
   * If any level has < 3 direct members or is absent, routed to Company Reserve!
   */
  public distributeTradingRewards(params: {
    sourceUserId: string;
    sourceUserName: string;
    tradeId: string;
    eligibleProfit: number;
    uplineChain: { l1Id?: string; l2Id?: string; l3Id?: string };
  }): ReferralRewardDistribution {
    const { sourceUserId, sourceUserName, tradeId, eligibleProfit, uplineChain } = params;

    const l1Amount = Number((eligibleProfit * 0.10).toFixed(2));
    const l2Amount = Number((eligibleProfit * 0.05).toFixed(2));
    const l3Amount = Number((eligibleProfit * 0.05).toFixed(2));
    let companyRetention = Number((eligibleProfit * 0.10).toFixed(2));

    // Check L1 qualification (must have >= 3 direct members)
    const l1Prof = uplineChain.l1Id ? this.getProfile(uplineChain.l1Id) : null;
    const l1Qualified = !!l1Prof && l1Prof.directMembersCount >= 3;
    if (!l1Qualified) companyRetention += l1Amount;

    // Check L2 qualification
    const l2Prof = uplineChain.l2Id ? this.getProfile(uplineChain.l2Id) : null;
    const l2Qualified = !!l2Prof && l2Prof.directMembersCount >= 3;
    if (!l2Qualified) companyRetention += l2Amount;

    // Check L3 qualification
    const l3Prof = uplineChain.l3Id ? this.getProfile(uplineChain.l3Id) : null;
    const l3Qualified = !!l3Prof && l3Prof.directMembersCount >= 3;
    if (!l3Qualified) companyRetention += l3Amount;

    const distribution: ReferralRewardDistribution = {
      id: `ref_dist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sourceUserId,
      sourceUserName,
      type: 'TRADING_PROFIT_FEE',
      tradeId,
      eligibleBaseProfitOrFee: eligibleProfit,
      level1Reward: {
        recipientId: uplineChain.l1Id || 'NONE',
        amount: l1Amount,
        qualified: l1Qualified,
        status: l1Qualified ? 'PAID' : 'FALLBACK_TO_COMPANY',
      },
      level2Reward: {
        recipientId: uplineChain.l2Id || 'NONE',
        amount: l2Amount,
        qualified: l2Qualified,
        status: l2Qualified ? 'PAID' : 'FALLBACK_TO_COMPANY',
      },
      level3Reward: {
        recipientId: uplineChain.l3Id || 'NONE',
        amount: l3Amount,
        qualified: l3Qualified,
        status: l3Qualified ? 'PAID' : 'FALLBACK_TO_COMPANY',
      },
      companyRetention: Number(companyRetention.toFixed(2)),
      timestamp: Date.now(),
    };

    this.rewardDistributions.unshift(distribution);
    return distribution;
  }
}
