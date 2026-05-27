import { detectPatterns } from '../../app/api/admin/siem/route';

type SiemSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type SiemSource = 'audit' | 'mfa' | 'field_audit' | 'compliance' | 'safety';
type SiemEventType =
  | 'AUDIT_CREATE' | 'AUDIT_UPDATE' | 'AUDIT_DELETE' | 'AUDIT_EXECUTE'
  | 'AUTH_FAIL' | 'RBAC_DENIED' | 'ADMIN_BYPASS'
  | 'MFA_SUCCESS' | 'MFA_FAIL'
  | 'LOGIN_SUCCESS' | 'LOGIN_FAIL'
  | 'FIELD_CHANGE' | 'COMPLIANCE_VIOLATION' | 'SAFETY_INCIDENT';

interface SiemEvent {
  id: string;
  ts: string;
  type: SiemEventType;
  severity: SiemSeverity;
  source: SiemSource;
  actorId: number | null;
  actorUsername: string | null;
  ipAddress: string | null;
  action: string;
  entityType: string | null;
  entityId: string | null;
  summary: string;
  metadata: Record<string, unknown>;
}

// Helper to generate a base template event
function createMockEvent(overrides: Partial<SiemEvent>): SiemEvent {
  return {
    id: `evt-${Math.random().toString(36).substr(2, 9)}`,
    ts: new Date().toISOString(),
    type: 'AUDIT_EXECUTE',
    severity: 'INFO',
    source: 'audit',
    actorId: 1,
    actorUsername: 'testuser',
    ipAddress: '127.0.0.1',
    action: 'TEST',
    entityType: 'TestEntity',
    entityId: '100',
    summary: 'Test summary',
    metadata: {},
    ...overrides,
  };
}

describe('SIEM Detection Rules Heuristics', () => {
  describe('RBAC_CRAWL Rule', () => {
    it('should detect RBAC_CRAWL when a single user has 3 or more RBAC_DENIED events within 5 minutes', () => {
      const now = Date.now();
      const events: SiemEvent[] = [
        createMockEvent({ type: 'RBAC_DENIED', actorId: 42, ts: new Date(now - 1000).toISOString() }),
        createMockEvent({ type: 'RBAC_DENIED', actorId: 42, ts: new Date(now - 5000).toISOString() }),
        createMockEvent({ type: 'RBAC_DENIED', actorId: 42, ts: new Date(now - 10000).toISOString() }),
      ];

      const patterns = detectPatterns(events);
      const crawlPattern = patterns.find(p => p.patternType === 'RBAC_CRAWL');

      expect(crawlPattern).toBeDefined();
      expect(crawlPattern?.severity).toBe('HIGH');
      expect(crawlPattern?.count).toBe(3);
      expect(crawlPattern?.description).toContain('محاولات دخول مرفوضة');
    });

    it('should NOT trigger RBAC_CRAWL if RBAC_DENIED events are below the threshold of 3', () => {
      const now = Date.now();
      const events: SiemEvent[] = [
        createMockEvent({ type: 'RBAC_DENIED', actorId: 42, ts: new Date(now - 1000).toISOString() }),
        createMockEvent({ type: 'RBAC_DENIED', actorId: 42, ts: new Date(now - 5000).toISOString() }),
      ];

      const patterns = detectPatterns(events);
      const crawlPattern = patterns.find(p => p.patternType === 'RBAC_CRAWL');

      expect(crawlPattern).toBeUndefined();
    });

    it('should NOT trigger RBAC_CRAWL if RBAC_DENIED events occur outside the 5-minute window', () => {
      const now = Date.now();
      const events: SiemEvent[] = [
        createMockEvent({ type: 'RBAC_DENIED', actorId: 42, ts: new Date(now - 1000).toISOString() }),
        createMockEvent({ type: 'RBAC_DENIED', actorId: 42, ts: new Date(now - 2000).toISOString() }),
        // 6 minutes ago
        createMockEvent({ type: 'RBAC_DENIED', actorId: 42, ts: new Date(now - 6 * 60 * 1000).toISOString() }),
      ];

      const patterns = detectPatterns(events);
      const crawlPattern = patterns.find(p => p.patternType === 'RBAC_CRAWL');

      expect(crawlPattern).toBeUndefined();
    });

    it('should NOT group RBAC_DENIED events from different users together', () => {
      const now = Date.now();
      const events: SiemEvent[] = [
        createMockEvent({ type: 'RBAC_DENIED', actorId: 101, ts: new Date(now - 1000).toISOString() }),
        createMockEvent({ type: 'RBAC_DENIED', actorId: 102, ts: new Date(now - 2000).toISOString() }),
        createMockEvent({ type: 'RBAC_DENIED', actorId: 103, ts: new Date(now - 3000).toISOString() }),
      ];

      const patterns = detectPatterns(events);
      const crawlPattern = patterns.find(p => p.patternType === 'RBAC_CRAWL');

      expect(crawlPattern).toBeUndefined();
    });
  });

  describe('API_BRUTE_FORCE Rule', () => {
    it('should detect API_BRUTE_FORCE when a single IP has 5 or more AUTH_FAIL events within 10 minutes', () => {
      const now = Date.now();
      const events: SiemEvent[] = [
        createMockEvent({ type: 'AUTH_FAIL', ipAddress: '10.0.0.5', ts: new Date(now - 1000).toISOString() }),
        createMockEvent({ type: 'AUTH_FAIL', ipAddress: '10.0.0.5', ts: new Date(now - 2000).toISOString() }),
        createMockEvent({ type: 'AUTH_FAIL', ipAddress: '10.0.0.5', ts: new Date(now - 3000).toISOString() }),
        createMockEvent({ type: 'AUTH_FAIL', ipAddress: '10.0.0.5', ts: new Date(now - 4000).toISOString() }),
        createMockEvent({ type: 'AUTH_FAIL', ipAddress: '10.0.0.5', ts: new Date(now - 5000).toISOString() }),
      ];

      const patterns = detectPatterns(events);
      const brutePattern = patterns.find(p => p.patternType === 'API_BRUTE_FORCE');

      expect(brutePattern).toBeDefined();
      expect(brutePattern?.severity).toBe('HIGH');
      expect(brutePattern?.count).toBe(5);
      expect(brutePattern?.description).toContain('AUTH_FAIL');
    });

    it('should NOT trigger API_BRUTE_FORCE if AUTH_FAIL events are below the threshold of 5', () => {
      const now = Date.now();
      const events: SiemEvent[] = [
        createMockEvent({ type: 'AUTH_FAIL', ipAddress: '10.0.0.5', ts: new Date(now - 1000).toISOString() }),
        createMockEvent({ type: 'AUTH_FAIL', ipAddress: '10.0.0.5', ts: new Date(now - 2000).toISOString() }),
        createMockEvent({ type: 'AUTH_FAIL', ipAddress: '10.0.0.5', ts: new Date(now - 3000).toISOString() }),
        createMockEvent({ type: 'AUTH_FAIL', ipAddress: '10.0.0.5', ts: new Date(now - 4000).toISOString() }),
      ];

      const patterns = detectPatterns(events);
      const brutePattern = patterns.find(p => p.patternType === 'API_BRUTE_FORCE');

      expect(brutePattern).toBeUndefined();
    });

    it('should NOT trigger API_BRUTE_FORCE if AUTH_FAIL events occur outside the 10-minute window', () => {
      const now = Date.now();
      const events: SiemEvent[] = [
        createMockEvent({ type: 'AUTH_FAIL', ipAddress: '10.0.0.5', ts: new Date(now - 1000).toISOString() }),
        createMockEvent({ type: 'AUTH_FAIL', ipAddress: '10.0.0.5', ts: new Date(now - 2000).toISOString() }),
        createMockEvent({ type: 'AUTH_FAIL', ipAddress: '10.0.0.5', ts: new Date(now - 3000).toISOString() }),
        createMockEvent({ type: 'AUTH_FAIL', ipAddress: '10.0.0.5', ts: new Date(now - 4000).toISOString() }),
        // 11 minutes ago
        createMockEvent({ type: 'AUTH_FAIL', ipAddress: '10.0.0.5', ts: new Date(now - 11 * 60 * 1000).toISOString() }),
      ];

      const patterns = detectPatterns(events);
      const brutePattern = patterns.find(p => p.patternType === 'API_BRUTE_FORCE');

      expect(brutePattern).toBeUndefined();
    });

    it('should NOT group AUTH_FAIL events from different IP addresses together', () => {
      const now = Date.now();
      const events: SiemEvent[] = [
        createMockEvent({ type: 'AUTH_FAIL', ipAddress: '10.0.0.1', ts: new Date(now - 1000).toISOString() }),
        createMockEvent({ type: 'AUTH_FAIL', ipAddress: '10.0.0.2', ts: new Date(now - 2000).toISOString() }),
        createMockEvent({ type: 'AUTH_FAIL', ipAddress: '10.0.0.3', ts: new Date(now - 3000).toISOString() }),
        createMockEvent({ type: 'AUTH_FAIL', ipAddress: '10.0.0.4', ts: new Date(now - 4000).toISOString() }),
        createMockEvent({ type: 'AUTH_FAIL', ipAddress: '10.0.0.5', ts: new Date(now - 5000).toISOString() }),
      ];

      const patterns = detectPatterns(events);
      const brutePattern = patterns.find(p => p.patternType === 'API_BRUTE_FORCE');

      expect(brutePattern).toBeUndefined();
    });
  });

  describe('OFF_HOURS_BYPASS Rule', () => {
    it('should detect OFF_HOURS_BYPASS when ADMIN_BYPASS event occurs during off hours (22:00 - 06:00 Riyadh)', () => {
      // 23:00 Riyadh is 20:00 UTC (23 - 3)
      const offHourUtc = new Date();
      offHourUtc.setUTCHours(20, 0, 0, 0); // 20:00 UTC is 23:00 Riyadh (off-hours)

      const events: SiemEvent[] = [
        createMockEvent({ type: 'ADMIN_BYPASS', ts: offHourUtc.toISOString() }),
      ];

      const patterns = detectPatterns(events);
      const bypassPattern = patterns.find(p => p.patternType === 'OFF_HOURS_BYPASS');

      expect(bypassPattern).toBeDefined();
      expect(bypassPattern?.severity).toBe('MEDIUM');
      expect(bypassPattern?.count).toBe(1);
      expect(bypassPattern?.description).toContain('ADMIN_BYPASS');
    });

    it('should NOT trigger OFF_HOURS_BYPASS when ADMIN_BYPASS occurs during normal working hours', () => {
      // 12:00 Riyadh is 09:00 UTC (12 - 3)
      const normalHourUtc = new Date();
      normalHourUtc.setUTCHours(9, 0, 0, 0); // 09:00 UTC is 12:00 Riyadh (normal-hours)

      const events: SiemEvent[] = [
        createMockEvent({ type: 'ADMIN_BYPASS', ts: normalHourUtc.toISOString() }),
      ];

      const patterns = detectPatterns(events);
      const bypassPattern = patterns.find(p => p.patternType === 'OFF_HOURS_BYPASS');

      expect(bypassPattern).toBeUndefined();
    });
  });
});
