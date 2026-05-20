export interface LicensePayload {
  licenseKey?: string;
  companyName?: string;
  crNumber?: string;
  vatNumber?: string;
  email?: string;
  phone?: string;
  deviceFingerprint?: string;
  os?: string;
  app?: string;
  version?: string;
}

export interface LicenseVerifyResponse {
  status: 'existing_company' | 'new_company' | 'invalid_license' | 'ACTIVE' | 'EXPIRED' | 'INVALID' | 'OFFLINE_GRACE' | 'LOCKED';
  valid: boolean;
  tenantId?: string;
  companyId?: string;
  companyName?: string;
  subdomain?: string;
  licenseExpiresAt?: string;
  suggestedSubdomain?: string;
  message?: string;
  workspaceUrl?: string;
  daysRemaining?: number;
  trialEndsAt?: string;
  serverTime?: string;
}

export interface ProvisionTenantPayload {
  licenseKey: string;
  companyName: string;
  adminName?: string;
  password?: string;
  crNumber?: string;
  vatNumber?: string;
  email?: string;
  phone?: string;
  subdomain: string;
  deviceFingerprint: string;
  version: string;
}

export interface ProvisionTenantResponse {
  success: boolean;
  message?: string;
  tenantId?: string;
  subdomain?: string;
  workspaceUrl?: string;
  trialToken?: string;
  trialStartsAt?: string;
  trialEndsAt?: string;
  serverTime?: string;
}

export interface SyncEvent {
  id: string;
  eventType: string;
  tenantId: string;
  companyId: string;
  deviceId: string;
  localSequence: number;
  idempotencyKey: string;
  payload: string;
  status: SyncStatus;
  retryCount: number;
  createdAt: string;
  lastAttemptAt?: string | null;
}

export type SyncStatus = 'PENDING' | 'SYNCED' | 'FAILED' | 'DEAD_LETTER';

export interface SyncStatusReport {
  pendingCount: number;
  failedCount: number;
  lastSyncAt: string | null;
  deadLetterCount: number;
  recentEvents: Array<{
    eventType: string;
    status: string;
    retryCount: number;
    createdAt: string;
    lastAttemptAt: string | null;
  }>;
}

export interface AppUpdateInfo {
  latestVersion: string;
  updateAvailable: boolean;
  mandatory: boolean;
  downloadUrl: string;
  sha256: string;
  changelog: string[];
}

export interface QzTrayStatus {
  installed: boolean;
  running: boolean;
  version?: string;
}
