'use client';

import React from 'react';
import { useUserPermissions, Permission } from '@/hooks/useUserPermissions';
import { ShieldAlert } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface SensitiveValueProps {
  value: React.ReactNode;
  module: string;
  action?: keyof Permission;
  mask?: string;
  currency?: string;
  showBadge?: boolean;
}

export default function SensitiveValue({
  value,
  module,
  action = 'canView',
  mask = '••••••',
  currency,
  showBadge = false
}: SensitiveValueProps) {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
  const { loading, hasPermission } = useUserPermissions();

  if (loading) {
    return <span style={{ opacity: 0.5, fontFamily: 'monospace' }}>...</span>;
  }

  const allowed = hasPermission(module, action);

  if (!allowed) {
    if (showBadge) {
      return (
        <span 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '4px', 
            padding: '3px 8px', 
            background: 'var(--bg-secondary, #FEF2F2)', 
            border: '1px solid rgba(239, 68, 68, 0.2)', 
            color: '#ef4444', 
            fontSize: '12px', 
            borderRadius: '4px',
            fontWeight: 'bold'
          }}
        >
          <ShieldAlert size={14} /> {_t('غير مصرح', 'Unauthorized')}
        </span>
      );
    }
    return (
      <span style={{ fontFamily: 'monospace', letterSpacing: '2px', opacity: 0.7, color: 'var(--text-muted)' }}>
        {mask} {currency && ` ${currency}`}
      </span>
    );
  }

  return (
    <>
      {value}
      {currency && ` ${currency}`}
    </>
  );
}
