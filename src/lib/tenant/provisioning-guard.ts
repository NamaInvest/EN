// Process-local in-memory lock registry to prevent concurrent provisioning requests for the same subdomain.
export const provisioningLocks = new Set<string>();

/**
 * Tries to acquire a lock for the given subdomain.
 * @param subdomain The subdomain candidate to lock.
 * @returns true if lock was acquired successfully, false if already locked.
 */
export function acquireProvisioningLock(subdomain: string): boolean {
  if (!subdomain) return false;
  const normalized = subdomain.toLowerCase().trim();
  if (provisioningLocks.has(normalized)) {
    return false;
  }
  provisioningLocks.add(normalized);
  return true;
}

/**
 * Releases the lock for the given subdomain.
 * @param subdomain The subdomain to unlock.
 */
export function releaseProvisioningLock(subdomain: string): void {
  if (!subdomain) return;
  const normalized = subdomain.toLowerCase().trim();
  provisioningLocks.delete(normalized);
}
