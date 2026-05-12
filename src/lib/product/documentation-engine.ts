/**
 * Documentation Engine (Phase 52 - Product SaaS)
 * ──────────────────────────────────────────────────────────
 * Generates and serves context-aware, in-app API documentation
 * and user guides for tenants.
 */
import { logger } from '@/lib/logger';

export class DocumentationEngine {
    static getApiDocsUrl(tenantId: string): string {
        return `https://docs.namasoft.local/${tenantId}/v1`;
    }
}
