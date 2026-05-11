'use client';
import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card } from '@/components/ui/card';
import { ShieldCheck, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function ComplianceMatrixDashboard() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [data, setData] = useState({ logs: [], concerns: [] });

    useEffect(() => {
        fetch('/api/admin/compliance')
            .then(res => res.json())
            .then(res => {
                if (res.success) setData(res);
            });
    }, []);

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <ShieldCheck className="w-8 h-8 text-green-600" />{_t('مصفوفة الامتثال الشامل V2', 'V2 Cross-Cutting Compliance Matrix')}</h1>
            <p className="text-gray-500">{_t('مراقبة الاهتمامات العشرة الأساسية الشاملة (الأمن، والتدقيق، ومبادئ المحاسبة المقبولة عموماً المتعددة، وZATCA).', 'Monitoring the 10 core cross-cutting concerns (Security, Auditing, Multi-GAAP, ZATCA).')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {data.concerns.map((concern: string, idx: number) => (
                    <Card key={idx} className="p-4 flex items-start gap-3 border-l-4 border-l-green-500">
                        <ShieldCheck className="text-green-500 mt-1" />
                        <div>
                            <h3 className="font-semibold text-sm">{concern}</h3>
                            <p className="text-xs text-gray-500 mt-1">Status: Enforced System-wide</p>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><AlertTriangle className="text-orange-500" />{_t('سجلات حوادث الامتثال', 'Compliance Incident Logs')}</h2>
                <div className="space-y-3">
                    {data.logs.map((log: any) => (
                        <div key={log.id} className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 flex justify-between items-center">
                            <div>
                                <div className="font-bold flex items-center gap-2">
                                    {log.severity === 'CRITICAL' ? <ShieldAlert className="w-4 h-4 text-red-500" /> : <AlertTriangle className="w-4 h-4 text-orange-500" />}
                                    {log.concernArea}
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{log.description}</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-xs px-2 py-1 rounded font-bold ${log.isResolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {log.isResolved ? 'RESOLVED' : 'OPEN'}
                                </span>
                                <p className="text-xs text-gray-500 mt-2">{new Date(log.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    ))}
                    {data.logs.length === 0 && (
                        <div className="text-center text-gray-500 py-6">
                            <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                            <p>No compliance violations logged. Enterprise is 100% compliant.</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
