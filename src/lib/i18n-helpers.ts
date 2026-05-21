/**
 * i18n Helpers for Pluralization, Currency, and Dates
 */

// Format currency using SAR standard
export function formatCurrency(amount: number, locale: string = 'ar-SA'): string {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'SAR',
        minimumFractionDigits: 2
    }).format(amount);
}

// Format date (Hijri for Arabic, Gregorian for others)
export function formatDate(date: Date | string, locale: string = 'ar-SA'): string {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    // For Saudi Arabic, we might use the standard or umalqura calendar
    if (locale.startsWith('ar')) {
        return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', options).format(d);
    }
    
    return new Intl.DateTimeFormat(locale, options).format(d);
}

// Format numbers (Arabic numerals option)
export function formatNumber(n: number, locale: string = 'ar-SA'): string {
    return new Intl.NumberFormat(locale).format(n);
}

// Pluralization handler for Arabic dual/plural forms
export function plural(word: string, count: number, lang: string = 'ar'): string {
    if (lang !== 'ar') {
        // English simple plural logic (add 's')
        if (count === 1) return word;
        if (word.endsWith('y')) return word.slice(0, -1) + 'ies';
        return word + 's';
    }

    // Advanced Arabic pluralization would depend on the word,
    // For a real system, you'd look up the exact forms in the translation file:
    // "item_zero", "item_one", "item_two", "item_few", "item_many"
    
    // This is a placeholder for the logic that interfaces with i18next
    return `${count} ${word}`;
}
