/**
 * Tenant Onboarding Engine (Phase 51 - Customer Success)
 * ──────────────────────────────────────────────────────────
 * Orchestrates the multi-step setup wizard, data seeding, and onboarding checklist.
 */
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'TenantOnboardingEngine' });

export type OnboardingStep = 
    | 'COMPANY_PROFILE'
    | 'CHART_OF_ACCOUNTS'
    | 'ZATCA_ONBOARDING'
    | 'FIRST_INVOICE'
    | 'BANK_SETUP';

export class TenantOnboardingEngine {

    /**
     * Marks a specific onboarding step as completed for a tenant.
     */
    static async completeStep(tenantId: string, step: OnboardingStep): Promise<void> {
        try {
            log.info(`Completing onboarding step ${step} for tenant ${tenantId}`);

            const p = prisma as any;
            if (p.setting) {
                // Fetch current progress
                const setting = await p.setting.findUnique({
                    where: { tenantId_key: { tenantId, key: 'onboarding_progress' } }
                });

                let progress: OnboardingStep[] = [];
                if (setting && setting.value) {
                    progress = JSON.parse(setting.value);
                }

                if (!progress.includes(step)) {
                    progress.push(step);
                    
                    await p.setting.upsert({
                        where: { tenantId_key: { tenantId, key: 'onboarding_progress' } },
                        update: { value: JSON.stringify(progress) },
                        create: { tenantId, key: 'onboarding_progress', value: JSON.stringify(progress) }
                    });
                }
                
                log.info(`Step ${step} completed.`);
            } else {
                log.warn('Setting schema not available for onboarding tracking.');
            }
        } catch (error: any) {
            log.error('Failed to update onboarding step', { error: error.message });
        }
    }

    /**
     * Retrieves the current onboarding progress percentage (0 - 100).
     */
    static async getProgress(tenantId: string): Promise<number> {
        try {
            const p = prisma as any;
            if (!p.setting) return 0;

            const setting = await p.setting.findUnique({
                where: { tenantId_key: { tenantId, key: 'onboarding_progress' } }
            });

            if (!setting || !setting.value) return 0;

            const progress: OnboardingStep[] = JSON.parse(setting.value);
            const totalSteps = 5; // COMPANY_PROFILE, CHART_OF_ACCOUNTS, ZATCA_ONBOARDING, FIRST_INVOICE, BANK_SETUP
            
            return Math.min(100, Math.round((progress.length / totalSteps) * 100));
        } catch (error: any) {
            log.error('Failed to get onboarding progress', { error: error.message });
            return 0;
        }
    }
}
