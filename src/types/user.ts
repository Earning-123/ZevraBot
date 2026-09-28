export type UserRole =
  | 'OWNER'
  | 'TRADING_ADMIN'
  | 'FINANCE_ADMIN'
  | 'SUPPORT_ADMIN'
  | 'SECURITY_ADMIN'
  | 'USER';

export type BotLifecycleStatus =
  | 'OFFLINE'
  | 'SETUP_REQUIRED'
  | 'WAITING_FOR_GAS'
  | 'READY'
  | 'SCANNING'
  | 'TRADING'
  | 'RISK_PAUSED'
  | 'EXCHANGE_ERROR'
  | 'EMERGENCY_STOP'
  | 'SUBSCRIPTION_EXPIRED'
  | 'MANUAL_PAUSE';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  twoFactorEnabled: boolean;
  botStatus: BotLifecycleStatus;
  tradingCapitalUsdt: number;
  availableBalanceUsdt: number;
  marginUsedUsdt: number;
  registeredAt: number;
  lastLoginAt: number;
  ipAddressMasked: string;
  referralCode: string;
  referredBy?: string;
}

export interface AuditLogEntry {
  id: string;
  correlationId: string;
  actorId: string;
  actorRole: UserRole;
  action: string;
  category: 'SECURITY' | 'TRADING' | 'RISK' | 'FINANCE' | 'SYSTEM' | 'SUBSCRIPTION' | 'EXCHANGE';
  resourceType: string;
  resourceId: string;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  reason?: string;
  ipAddress: string;
  outcome: 'SUCCESS' | 'BLOCKED' | 'FAILED';
  timestamp: number;
}
