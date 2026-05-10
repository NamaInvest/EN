import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.pii-mask.ts' });

/**
 * PII Masking Engine (AI-06)
 * Scans text for sensitive Saudi data patterns and masks them before sending to AI providers.
 */

const PATTERNS = {
    // Saudi National ID (10 digits starting with 1 or 2)
    nationalId: /\b[12]\d{9}\b/g,
    // IBAN Saudi (SA + 2 check digits + 20 BBAN = 24 chars total)
    iban: /\bSA\d{2}[A-Z0-9]{20}\b/gi,
    // Phone Saudi (+966 or 05x)
    phone: /(?:\+966|00966|05)\d{8}/g,
    // Email
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    // Credit Card (basic 16 digits)
    creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
    // Salary amounts — the keyword may be followed by other words before the number.
    // We capture "keyword ... number" and only mask the number portion (not the keyword).
    salary: /(?:راتب|salary|أجر|wage)[^\d\n]{0,40}([\d,]+(?:\.\d{1,2})?)/gi,
};

export interface MaskResult {
    masked: string;
    maskedCount: number;
    maskedTypes: string[];
}

/**
 * Mask all PII patterns in text. Returns masked text and metadata.
 */
export function maskPII(text: string): MaskResult {
    let masked = text;
    let maskedCount = 0;
    const maskedTypes: string[] = [];

    // National ID → [***هوية***]
    masked = masked.replace(PATTERNS.nationalId, (match) => {
        maskedCount++;
        if (!maskedTypes.includes('nationalId')) maskedTypes.push('nationalId');
        return `[***${match.slice(0, 2)}****${match.slice(-2)}***]`;
    });

    // IBAN → [***IBAN***]
    masked = masked.replace(PATTERNS.iban, (match) => {
        maskedCount++;
        if (!maskedTypes.includes('iban')) maskedTypes.push('iban');
        return `[***SA****${match.slice(-4)}***]`;
    });

    // Phone → [***هاتف***]
    masked = masked.replace(PATTERNS.phone, () => {
        maskedCount++;
        if (!maskedTypes.includes('phone')) maskedTypes.push('phone');
        return '[***هاتف***]';
    });

    // Email → [***بريد***]
    masked = masked.replace(PATTERNS.email, (match) => {
        maskedCount++;
        if (!maskedTypes.includes('email')) maskedTypes.push('email');
        const [user, domain] = match.split('@');
        return `[${user[0]}***@${domain}]`;
    });

    // Credit Card → [***بطاقة***]
    masked = masked.replace(PATTERNS.creditCard, (match) => {
        maskedCount++;
        if (!maskedTypes.includes('creditCard')) maskedTypes.push('creditCard');
        return `[****${match.replace(/\D/g, '').slice(-4)}]`;
    });

    // Salary → keep keyword/intermediate text, mask only the number
    masked = masked.replace(PATTERNS.salary, (match, amount) => {
        maskedCount++;
        if (!maskedTypes.includes('salary')) maskedTypes.push('salary');
        // Replace just the captured numeric amount inside the match.
        return match.replace(amount, '[***مبلغ مالي***]');
    });

    return { masked, maskedCount, maskedTypes };
}

/**
 * Check if output from AI contains PII that leaked through.
 * Returns true if PII detected.
 */
export function detectPII(text: string): boolean {
    return Object.values(PATTERNS).some(pattern => {
        pattern.lastIndex = 0; // Reset regex state
        return pattern.test(text);
    });
}
