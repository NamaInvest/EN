import { useTranslation } from '@/lib/i18n';

export default function TestI18n() {
    const { t } = useTranslation();
    return (
        <div style={{ padding: 50, color: 'white', backgroundColor: 'black' }}>
            <h1>TEST I18N PAGE</h1>
            <h2 id="test-key-1">{t('dashboard.title')}</h2>
            <h2 id="test-key-2">{t('common.sar')}</h2>
        </div>
    );
}
