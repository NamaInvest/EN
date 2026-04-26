/**
 * Formats a Date object or ISO string into a localized date string.
 */
export function formatDateAR(dateInput: string | Date, useArabicNumerals = false): string {
    if (!dateInput) return '-';
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return '-';
        const str = date.toLocaleDateString('en-GB');
        return useArabicNumerals ? toArabicDigits(str) : str;
    } catch (e) {
        return '-';
    }
}

/**
 * Formats a Date object or ISO string into a localized date & time string.
 */
export function formatDateTimeAR(dateInput: string | Date, useArabicNumerals = false): string {
    if (!dateInput) return '-';
    try {
        const date = new Date(dateInput);
        if (isNaN(date.getTime())) return '-';
        const str = date.toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        return useArabicNumerals ? toArabicDigits(str) : str;
    } catch (e) {
        return '-';
    }
}

/**
 * Formats a number as SAR currency.
 */
export function formatCurrencyAR(amount: number, useArabicNumerals = false): string {
    if (amount === undefined || amount === null || isNaN(amount)) return '-';
    try {
        const str = new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'SAR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
        return useArabicNumerals ? toArabicDigits(str) : str;
    } catch (e) {
        return amount.toString();
    }
}

/**
 * Formats a number with optional Arabic numerals.
 */
export function formatNumberAR(num: number, useArabicNumerals = false): string {
    if (num === undefined || num === null || isNaN(num)) return '-';
    try {
        const str = new Intl.NumberFormat('en-GB').format(num);
        return useArabicNumerals ? toArabicDigits(str) : str;
    } catch (e) {
        return num.toString();
    }
}

/**
 * Convert Western digits (0-9) to Arabic-Indic digits (٠-٩)
 */
export function toArabicDigits(input: string): string {
    return input.replace(/[0-9]/g, d => '٠١٢٣٤٥٦٧٨٩'[parseInt(d)]);
}

