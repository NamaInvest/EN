import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.privacy-filt' });

/**
 * Privacy Filter for AI integrations.
 * Prevents Personally Identifiable Information (PIH/PII) from leaking to external LLM providers.
 */

// Simple regex rules to identify potential sensitive data
const PATTERNS = {
    EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    PHONE_SA: /(?:\+?966|0)?5[0-9]{8}/g,
    IBAN_SA: /SA\d{2}[a-zA-Z0-9]{18}/g,
    NATIONAL_ID: /(?:1|2)[0-9]{9}/g // Saudi National ID or Iqama
};

export function redactPII(text: string): string {
    if (!text) return text;
    let redacted = text;
    redacted = redacted.replace(PATTERNS.EMAIL, '[EMAIL REDACTED]');
    redacted = redacted.replace(PATTERNS.PHONE_SA, '[PHONE REDACTED]');
    redacted = redacted.replace(PATTERNS.IBAN_SA, '[IBAN REDACTED]');
    redacted = redacted.replace(PATTERNS.NATIONAL_ID, '[ID REDACTED]');
    return redacted;
}

export function maskEntityNames(entities: any[], nameField = 'name'): any[] {
    return entities.map((entity, index) => {
        const masked = { ...entity };
        if (masked[nameField]) {
            masked[nameField] = `Entity_${index + 1}`;
        }
        return masked;
    });
}
