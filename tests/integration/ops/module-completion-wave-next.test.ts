import { describe, it, expect, vi } from 'vitest';
import { sendTelegramAlert } from '../../../src/lib/observability/telegram-alerter';
import { planBackupCoverageUpgrade } from '../../../scripts/ops/backup-coverage-upgrade.js';

vi.mock('../../../scripts/ops/discover-tenant-databases', () => {
    return {
        discoverDatabases: vi.fn().mockResolvedValue([
            'ahmedalyamicompany_db',
            'mgmg_db',
            'n11_db'
        ])
    };
});

describe('Module Completion Next Wave Tooling', () => {

    describe('Telegram Alerter', () => {
        it('should log and mask secrets in alert messages', async () => {
            const message = 'DATABASE_URL=postgresql://root:secret_pass_123@46.4.188.170:5432/n11_db has crashed';
            const logSpy = vi.spyOn(console, 'log');
            const result = await sendTelegramAlert(message);
            
            expect(result).toBe(true);
            expect(logSpy).toHaveBeenCalled();
            
            const loggedMessage = logSpy.mock.calls.find((c: unknown[]) => typeof c[0] === 'string' && (c[0] as string).includes('postgresql:'))?.[0] as string | undefined;
            if (loggedMessage) {
                expect(loggedMessage).toContain('postgresql://***:***@***.***.***.***:5432/n11_db');
                expect(loggedMessage).not.toContain('secret_pass_123');
            }
            logSpy.mockRestore();
        });
    });

    describe('Backup Coverage Upgrade Planner', () => {
        it('should plan pg_dump commands for all discovered databases', async () => {
            const plan = await planBackupCoverageUpgrade() as {
                databasesToCoverage: Array<{ databaseName: string }>;
                commandsToExecuteOnServer: string[];
            };
            expect(plan.databasesToCoverage.length).toBeGreaterThanOrEqual(3);
            expect(plan.databasesToCoverage[0].databaseName).toBeDefined();
            expect(plan.commandsToExecuteOnServer.some((c: string) => c.includes('codebase_and_dashboards'))).toBe(true);
        });
    });
});
