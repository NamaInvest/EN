'use client';
import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card } from '@/components/ui/card';
import { ClipboardList, Search } from 'lucide-react';

export default function AuditLogPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <h1 className="text-3xl font-bold flex items-center gap-2"><ClipboardList />{_t('سجل تدقيق النظام', 'System Audit Log')}</h1>
            <Card className="p-12 text-center text-gray-500">
                <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900">{_t('مسار التدقيق نشط', 'Audit Trail Active')}</h3>
                <p>{_t('يتم الآن تسجيل أنشطة النظام. تصفية لعرض أحداث محددة.', 'System activities are being logged. Filter to view specific events.')}</p>
            </Card>
        </div>
    );
}
