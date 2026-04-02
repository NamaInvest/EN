'use client';

import { Printer } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function PrintButton() {
    const { t } = useTranslation();
    return (
        <button 
            onClick={() => window.print()} 
            className="lang-switcher-btn" 
            title={t('common.print') || t('sys.str_97')}
            style={{ 
                padding: '6px 8px', 
                borderRadius: 'var(--radius-sm)', 
                background: 'var(--bg-card)', 
                border: '1px solid var(--border)', 
                cursor: 'pointer', 
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '36px'
            }}
        >
            <Printer size={18} />
        </button>
    );
}
