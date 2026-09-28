import { AuditLogEntry, UserRole } from '../types/user';

export class AuditLogger {
  private static logs: AuditLogEntry[] = [];

  static {
    // Seed initial security audit entries
    const now = Date.now();
    this.logs = [
      {
        id: 'aud_sys_01',
        correlationId: 'corr_sec_boot_01',
        actorId: 'usr_admin_owner',
        actorRole: 'OWNER',
        action: 'PLATFORM_BOOTSTRAP_INTEGRITY_CHECK',
        category: 'SECURITY',
        resourceType: 'SYSTEM_CORE',
        resourceId: 'zevrabot_core',
        beforeState: null,
        afterState: { platformLeverageHardCap: 10, withdrawalBanned: true, hwmEnabled: true },
        reason: 'Initial security baseline verification.',
        ipAddress: '192.168.1.1',
        outcome: 'SUCCESS',
        timestamp: now - 3600000 * 24,
      },
      {
        id: 'aud_sys_02',
        correlationId: 'corr_api_connect_88',
        actorId: 'usr_default_01',
        actorRole: 'USER',
        action: 'EXCHANGE_API_PERMISSIONS_VALIDATION',
        category: 'EXCHANGE',
        resourceType: 'API_KEY',
        resourceId: 'key_binance_futures',
        beforeState: { permissions: 'UNVERIFIED' },
        afterState: { canRead: true, canTradeFutures: true, hasWithdrawal: false },
        reason: 'Connected Binance Futures account with minimum privileges.',
        ipAddress: '84.17.42.19',
        outcome: 'SUCCESS',
        timestamp: now - 3600000 * 12,
      },
      {
        id: 'aud_sys_03',
        correlationId: 'corr_risk_eval_77',
        actorId: 'risk_governor_engine',
        actorRole: 'OWNER',
        action: 'TRADE_INTENT_RISK_EVALUATION',
        category: 'RISK',
        resourceType: 'ORDER_INTENT',
        resourceId: 'intent_btc_long_77',
        beforeState: { requestedLeverage: 10 },
        afterState: { approvedLeverage: 5, status: 'APPROVED' },
        reason: 'Adjusted leverage to 5x based on ATR volatility dampener.',
        ipAddress: '127.0.0.1',
        outcome: 'SUCCESS',
        timestamp: now - 3600000 * 4,
      },
    ];
  }

  public static log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const fullEntry: AuditLogEntry = {
      ...entry,
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    };
    this.logs.unshift(fullEntry);
    return fullEntry;
  }

  public static getLogs(category?: string, limit: number = 50): AuditLogEntry[] {
    if (!category || category === 'ALL') {
      return this.logs.slice(0, limit);
    }
    return this.logs.filter((l) => l.category === category).slice(0, limit);
  }

  public static getRecentAlerts(): AuditLogEntry[] {
    return this.logs.filter((l) => l.outcome === 'BLOCKED' || l.outcome === 'FAILED');
  }
}
