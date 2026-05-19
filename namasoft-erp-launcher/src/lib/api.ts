import { LicensePayload, LicenseVerifyResponse, ProvisionTenantPayload, AppUpdateInfo, QzTrayStatus, SyncStatusReport } from '../../electron/types';

declare global {
  interface Window {
    electronAPI: {
      getFingerprint: () => Promise<string>;
      checkLicense: (data: LicensePayload) => Promise<LicenseVerifyResponse>;
      checkSubdomain: (subdomain: string) => Promise<{ available: boolean }>;
      provisionTenant: (data: ProvisionTenantPayload) => Promise<{ success: boolean; message?: string }>;
      checkUpdates: () => Promise<AppUpdateInfo>;
      getQzStatus: () => Promise<QzTrayStatus>;
      runSync: () => Promise<{ success: number, failed: number }>;
      getSyncStatus: () => Promise<SyncStatusReport>;
    }
  }
}

export const api = {
  getFingerprint: () => window.electronAPI.getFingerprint(),
  checkLicense: (data: LicensePayload) => window.electronAPI.checkLicense(data),
  checkSubdomain: (subdomain: string) => window.electronAPI.checkSubdomain(subdomain),
  provisionTenant: (data: ProvisionTenantPayload) => window.electronAPI.provisionTenant(data),
  checkUpdates: () => window.electronAPI.checkUpdates(),
  getQzStatus: () => window.electronAPI.getQzStatus(),
  runSync: () => window.electronAPI.runSync(),
  getSyncStatus: () => window.electronAPI.getSyncStatus()
};
