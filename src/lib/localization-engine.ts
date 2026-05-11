import { logger } from '@/lib/logger';

const log = logger.child({ service: 'localization-engine' });

/**
 * P-15: Multi-Country Localization Engine
 * Currency formatting, number formats, date formats, RTL/LTR per locale
 */

interface LocaleConfig {
  locale: string;
  currency: string;
  currencySymbol: string;
  direction: 'rtl' | 'ltr';
  dateFormat: string;
  numberGroupSeparator: string;
  numberDecimalSeparator: string;
  timezone: string;
  vatLabel: string;
}

export const LOCALES: Record<string, LocaleConfig> = {
  'ar-SA': { locale: 'ar-SA', currency: 'SAR', currencySymbol: '﷼', direction: 'rtl', dateFormat: 'DD/MM/YYYY', numberGroupSeparator: ',', numberDecimalSeparator: '.', timezone: 'Asia/Riyadh', vatLabel: 'ضريبة القيمة المضافة' },
  'ar-AE': { locale: 'ar-AE', currency: 'AED', currencySymbol: 'د.إ', direction: 'rtl', dateFormat: 'DD/MM/YYYY', numberGroupSeparator: ',', numberDecimalSeparator: '.', timezone: 'Asia/Dubai', vatLabel: 'ضريبة القيمة المضافة' },
  'ar-KW': { locale: 'ar-KW', currency: 'KWD', currencySymbol: 'د.ك', direction: 'rtl', dateFormat: 'DD/MM/YYYY', numberGroupSeparator: ',', numberDecimalSeparator: '.', timezone: 'Asia/Kuwait', vatLabel: 'ضريبة القيمة المضافة' },
  'en-US': { locale: 'en-US', currency: 'USD', currencySymbol: '$', direction: 'ltr', dateFormat: 'MM/DD/YYYY', numberGroupSeparator: ',', numberDecimalSeparator: '.', timezone: 'America/New_York', vatLabel: 'Sales Tax' },
  'en-GB': { locale: 'en-GB', currency: 'GBP', currencySymbol: '£', direction: 'ltr', dateFormat: 'DD/MM/YYYY', numberGroupSeparator: ',', numberDecimalSeparator: '.', timezone: 'Europe/London', vatLabel: 'VAT' },
};

export class LocalizationEngine {
  static getConfig(locale: string): LocaleConfig {
    return LOCALES[locale] ?? LOCALES['ar-SA'];
  }

  static formatCurrency(amount: number, locale: string): string {
    const cfg = this.getConfig(locale);
    return new Intl.NumberFormat(cfg.locale, { style: 'currency', currency: cfg.currency }).format(amount);
  }

  static formatDate(date: Date, locale: string): string {
    const cfg = this.getConfig(locale);
    return new Intl.DateTimeFormat(cfg.locale, { timeZone: cfg.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  }

  static formatNumber(value: number, locale: string, decimals = 2): string {
    const cfg = this.getConfig(locale);
    return new Intl.NumberFormat(cfg.locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
  }

  static getSupportedLocales(): string[] {
    return Object.keys(LOCALES);
  }
}
