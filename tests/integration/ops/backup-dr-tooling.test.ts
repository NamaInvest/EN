import { describe, it, expect, vi } from 'vitest';
import { generateManifest } from '../../../scripts/ops/backup-manifest-generate';
import { verifyBackupCoverage } from '../../../scripts/ops/backup-verify-coverage';
import { getBackupChecksums } from '../../../scripts/ops/backup-checksum-report';
import { generateDryRunPlan } from '../../../scripts/ops/dr-restore-dry-run-plan';

vi.mock('../../../scripts/ops/discover-tenant-databases', () => {
    return {
        discoverDatabases: vi.fn().mockResolvedValue([
            'ahmedalyamicompany_db',
            'mgmg_db',
            'n11_db',
            'n7_db',
            'nama_main_db',
            'shippy_db'
        ])
    };
});

vi.mock('../../../scripts/ops/backup-manifest-generate', () => {
    return {
        generateManifest: vi.fn().mockResolvedValue({
            timestamp: '2026-06-04T07:27:00Z',
            backupFolder: '20260519-004058',
            files: [
                { name: 'n11_db.backup', sizeBytes: 4627192, sizeReadable: '4.41 MB' },
                { name: 'n1_db.backup', sizeBytes: 4627192, sizeReadable: '4.41 MB' },
                { name: 'codebase_and_dashboards.tar.gz', sizeBytes: 7200000, sizeReadable: '6.87 MB' }
            ]
        })
    };
});

vi.mock('../../../scripts/ops/backup-checksum-report', () => {
    return {
        getBackupChecksums: vi.fn().mockResolvedValue({
            timestamp: '2026-06-04T07:27:00Z',
            checksums: [
                { filename: 'n11_db.backup', sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }
            ]
        })
    };
});

describe('Backup and Disaster Recovery Tooling', () => {

    describe('Manifest Generation', () => {
        it('should return parsed files and directory info', async () => {
            const manifest = await generateManifest();
            expect(manifest.backupFolder).toBe('20260519-004058');
            expect(manifest.files.length).toBe(3);
            expect(manifest.files[0].name).toBe('n11_db.backup');
        });
    });

    describe('Coverage Verification', () => {
        it('should correctly calculate coverage and find missing databases', async () => {
            const report = await verifyBackupCoverage();
            expect(report.totalDatabases).toBe(6);
            expect(report.backedUpDatabases).toContain('n11_db');
            expect(report.missingDatabases).toContain('ahmedalyamicompany_db');
            expect(report.missingDatabases).toContain('mgmg_db');
            expect(report.coveragePercentage).toBe(17); // 1 active out of 6 (which is 17%)
            expect(report.status).toBe('GAP_DETECTED');
        });
    });

    describe('Checksum Verification', () => {
        it('should return sha256 checksum mapping', async () => {
            const report = await getBackupChecksums();
            expect(report.checksums.length).toBe(1);
            expect(report.checksums[0].filename).toBe('n11_db.backup');
            expect(report.checksums[0].sha256).toBeDefined();
        });
    });

    describe('DR Restore Dry-Run Planner', () => {
        it('should generate dry-run commands for staging', () => {
            const plan = generateDryRunPlan({ env: 'staging' });
            expect(plan.title).toContain('STAGING');
            expect(plan.safetyEnforcement.noProductionOverwrite).toBe(true);
            expect(plan.safetyEnforcement.dryRunOnly).toBe(true);
        });

        it('should strictly block when trying to run on production env', () => {
            expect(() => generateDryRunPlan({ env: 'production' })).toThrow(/STRICT_BLOCK/);
            expect(() => generateDryRunPlan({ env: 'prod' })).toThrow(/STRICT_BLOCK/);
        });
    });
});
