import { AppUpdateInfo } from './types';

export function compareVersions(v1: string, v2: string): number {
  const p1 = v1.split('.').map(Number);
  const p2 = v2.split('.').map(Number);
  for (let i = 0; i < Math.max(p1.length, p2.length); i++) {
    const n1 = p1[i] || 0;
    const n2 = p2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

export async function checkForUpdates(currentVersion: string): Promise<AppUpdateInfo> {
  const mockLatest = "2.4.8";
  return {
    latestVersion: mockLatest,
    updateAvailable: compareVersions(mockLatest, currentVersion) > 0,
    mandatory: false,
    downloadUrl: "https://example.com/download.exe",
    sha256: "safe_placeholder_sha256",
    changelog: ["Bug fixes"]
  };
}
