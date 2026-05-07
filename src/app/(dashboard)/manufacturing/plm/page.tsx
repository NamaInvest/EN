import { _t } from '@/lib/server-t';
'use client';
import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card } from '@/components/ui/card';
import { Layers, GitCommit, FileText } from 'lucide-react';

export default function PLMDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <Layers className="w-8 h-8 text-blue-600" />{_t('Product Lifecycle إدارةment (PLM)', 'Product Lifecycle Management (PLM)')}</h1>
            <p className="text-gray-500">{_t('Manage engineering change orders, product revisions, and technical documentation.', 'Manage engineering change orders, product revisions, and technical documentation.')}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2"><GitCommit className="text-orange-500"/>{_t('Active ECOs', 'Active ECOs')}</h2>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-sm text-gray-500 mt-2">{_t('Engineering Change Orders pending review.', 'Engineering Change Orders pending review.')}</p>
                </Card>
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2"><Layers className="text-blue-500"/>{_t('Product Revisions', 'Product Revisions')}</h2>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-sm text-gray-500 mt-2">{_t('New revisions published this month.', 'New revisions published this month.')}</p>
                </Card>
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-2 flex items-center gap-2"><FileText className="text-green-500"/> CAD/Specs</h2>
                    <p className="text-3xl font-bold">0</p>
                    <p className="text-sm text-gray-500 mt-2">{_t('Technical documents attached to BOMs.', 'Technical documents attached to BOMs.')}</p>
                </Card>
            </div>
            
            <Card className="p-12 text-center text-gray-500 border-dashed">
                <Layers className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-medium">{_t('PLM Module Initialized', 'PLM Module Initialized')}</h3>
                <p>{_t('The core PLM schemas are ready. Start adding Projects and ECOs to see them here.', 'The core PLM schemas are ready. Start adding Projects and ECOs to see them here.')}</p>
            </Card>
        </div>
    );
}
