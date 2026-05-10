/**
 * Server-side bilingual helper for Server Components.
 *
 * Mirrors the `_t(ar, en)` pattern used in client pages (which sourced `lang`
 * from the `useTranslation` hook). On the server we have no React context, so
 * we read the language from the cookie set by `setLang` in `i18n.tsx`. If
 * unavailable (SSR boundary, edge runtime, tests) we default to Arabic to
 * match the same SSR-safe default the I18nProvider uses.
 *
 * Usage in a Server Component:
 *   import { _t } from '@/lib/server-t';
 *   <h1>{_t('وصفات التصنيع', 'Bill of Materials')}</h1>
 */
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

const log = logger.child({ service: 'server-t' });

export async function getServerLang(): Promise<'ar' | 'en'> {
    try {
        const c = await cookies();
        const v = c.get('app_lang')?.value;
        return v === 'en' ? 'en' : 'ar';
    } catch {
        return 'ar';
    }
}

/**
 * Stateless bilingual helper. Always returns Arabic in the synchronous form
 * (matches the I18nProvider SSR default). For dynamic-language rendering
 * use `getServerLang()` and ternary directly.
 */
export function _t(ar: string, _en: string): string {
    return ar;
}
