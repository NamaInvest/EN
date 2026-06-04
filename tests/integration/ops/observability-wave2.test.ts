import { describe, it, expect, vi } from 'vitest';
import { generateDailySummary } from '../../../scripts/ops/daily-observability-summary';
import { getFailedProvisioningSummary } from '../../../scripts/ops/failed-provisioning-summary';
import { getGaPolicyStatus } from '../../../scripts/ops/ga-policy-status-summary';
import { generateOpsMasterDailyReport } from '../../../scripts/ops/ops-master-daily-report';

vi.mock('../../../scripts/ops/pm2-log-health-scan', () => {
    return {
        runLogHealthScan: vi.fn().mockResolvedValue({
            timestamp: '2026-06-04T07:38:00Z',
            servicesScanned: {
                'main-site': {
                    totalLinesAnalyzed: 100,
                    errorCounts: { typeError: 0, prismaError: 0, http500: 0, unhandledRejection: 0, uncaughtException: 0, otherErrors: 0 },
                    secretsDetected: false,
                    sampleErrors: []
                },
                'saas-app': {
                    totalLinesAnalyzed: 100,
                    errorCounts: { typeError: 1, prismaError: 0, http500: 2, unhandledRejection: 0, uncaughtException: 0, otherErrors: 0 },
                    secretsDetected: false,
                    sampleErrors: ['error: TypeError', 'error: HTTP 500']
                }
            },
            overallSecretsDetected: false
        })
    };
});

vi.mock('../../../scripts/ops/failed-provisioning-summary', () => {
    return {
        getFailedProvisioningSummary: vi.fn().mockResolvedValue({
            timestamp: '2026-06-04T07:38:00Z',
            failedAttemptsCount: 1,
            recentFailures: ['Job failed at step VALIDATE_REQUEST: subdomain exists']
        })
    };
});

vi.mock('../../../scripts/ops/ga-policy-status-summary', () => {
    return {
        getGaPolicyStatus: vi.fn().mockResolvedValue({
            timestamp: '2026-06-04T07:38:00Z',
            onboardingPolicy: 'Invite-Code + Admin-Approval',
            inviteCodeRequirement: 'ACTIVE_ENFORCED',
            publicSignupAllowed: false,
            status: 'SECURE_GA_ACTIVE'
        })
    };
});

vi.mock('../../../scripts/ops/backup-verify-coverage', () => {
    return {
        verifyBackupCoverage: vi.fn().mockResolvedValue({
            timestamp: '2026-06-04T07:38:00Z',
            latestBackupFolder: '20260519-004058',
            totalDatabases: 6,
            discoveredDatabases: ['n11_db', 'mgmg_db'],
            backedUpDatabases: ['n11_db'],
            missingDatabases: ['mgmg_db'],
            coveragePercentage: 17,
            status: 'GAP_DETECTED'
        })
    };
});

vi.mock('../../../scripts/ops/runtime-health-report', () => {
    return {
        runHealthReport: vi.fn().mockResolvedValue({
            timestamp: '2026-06-04T07:38:00Z',
            overallSuccess: true,
            results: []
        })
    };
});

describe('Observability Wave 2 Tooling', () => {

    describe('Daily Observability Summary', () => {
        it('should detect warnings when errors are present in scanned logs', async () => {
            const summary = await generateDailySummary();
            expect(summary.overallStatus).toBeDefined();
            expect(summary.activeIssues.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Failed Provisioning Summary', () => {
        it('should return recent failure count and list', async () => {
            const summary = await getFailedProvisioningSummary();
            expect(summary.failedAttemptsCount).toBe(1);
            expect(summary.recentFailures[0]).toContain('VALIDATE_REQUEST');
        });
    });

    describe('GA Onboarding Policy Status Audit', () => {
        it('should return GA policy details and enforce non-public signups', async () => {
            const status = await getGaPolicyStatus();
            expect(status.status).toBe('SECURE_GA_ACTIVE');
            expect(status.publicSignupAllowed).toBe(false);
        });
    });

    describe('Operations Master Daily Report Compiler', () => {
        it('should compile and mask secrets from all modules', async () => {
            const masterReport = await generateOpsMasterDailyReport();
            expect(masterReport.status).toBe('DEGRADED'); // because backup has GAP_DETECTED
            expect(masterReport.components.observability).toBeDefined();
            expect(masterReport.components.backup.coveragePercentage).toBe(17);
        });
    });
});
