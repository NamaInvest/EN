/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  acquireProvisioningLock,
  releaseProvisioningLock,
  provisioningLocks,
} from '../tenant/provisioning-guard';

describe('Provisioning Guard In-Memory Lock', () => {
  beforeEach(() => {
    // Clear locks before each test
    provisioningLocks.clear();
  });

  it('acquires lock successfully for a new subdomain', () => {
    const success = acquireProvisioningLock('new-tenant');
    expect(success).toBe(true);
    expect(provisioningLocks.has('new-tenant')).toBe(true);
  });

  it('fails to acquire lock if already locked', () => {
    const first = acquireProvisioningLock('busy-tenant');
    expect(first).toBe(true);

    const second = acquireProvisioningLock('busy-tenant');
    expect(second).toBe(false);
  });

  it('handles subdomain check case-insensitively', () => {
    const first = acquireProvisioningLock('Case-Tenant');
    expect(first).toBe(true);

    const second = acquireProvisioningLock('case-tenant');
    expect(second).toBe(false);
  });

  it('releases lock successfully and allows re-acquiring', () => {
    const lock1 = acquireProvisioningLock('reusable-tenant');
    expect(lock1).toBe(true);

    // Release the lock
    releaseProvisioningLock('reusable-tenant');
    expect(provisioningLocks.has('reusable-tenant')).toBe(false);

    // Lock again
    const lock2 = acquireProvisioningLock('reusable-tenant');
    expect(lock2).toBe(true);
  });

  it('handles empty or invalid inputs gracefully', () => {
    expect(acquireProvisioningLock('')).toBe(false);
    expect(acquireProvisioningLock(null as any)).toBe(false);
    
    // Release with empty should not throw
    expect(() => releaseProvisioningLock('')).not.toThrow();
    expect(() => releaseProvisioningLock(null as any)).not.toThrow();
  });
});
