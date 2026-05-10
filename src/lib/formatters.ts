import { logger } from '@/lib/logger';

const log = logger.child({ service: 'D:.namasoft9-3-main.src.lib.formatters.t' });

/**
 * Formats a Date object or ISO string into a localized date string.
 * Example: 26/04/2026
 */
export function formatDateAR(dateInput: string | Date): string {
    if (!dateInput) return '-';
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleDateString('en-GB');
    } catch (e: any) {
        return '-';
    }
}

/**
 * Formats a Date object or ISO string into a localized date & time string.
 * Example: 26/04/2026, 10:30 am
 */
export function formatDateTimeAR(dateInput: string | Date): string {
    if (!dateInput) return '-';
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return '-';
        return date.toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch (e: any) {
        return '-';
    }
}

/**
 * Formats a number as SAR currency.
 * Example: SAR 1,250.50
 */
export function formatCurrencyAR(amount: number): string {
    if (amount === undefined || amount === null || isNaN(amount)) return '-';
    try {
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'SAR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    } catch (e: any) {
        return amount.toString();
    }
}

/**
 * Formats a number with commas.
 * Example: 1,250
 */
export function formatNumberAR(num: number): string {
    if (num === undefined || num === null || isNaN(num)) return '-';
    try {
        return new Intl.NumberFormat('en-GB').format(num);
    } catch (e: any) {
        return num.toString();
    }
}
