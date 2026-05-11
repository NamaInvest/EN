'use client';
import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Key, FileBadge, CheckCircle, RefreshCw, UploadCloud } from 'lucide-react';

export default function ZatcaOnboardingPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    return (
        <div className="max-w-4xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Shield className="w-8 h-8 text-emerald-600" />{_t('ZATCA المرحلة الثانية من الإعداد', 'ZATCA Phase 2 Onboarding')}</h1>
                    <p className="text-gray-500 mt-1">{_t('إنشاء معرف ختم التشفير (CSID) للفوترة الإلكترونية.', 'Generate Cryptographic Stamp Identifier (CSID) for E-Invoicing.')}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="bg-white">
                        <RefreshCw className="w-4 h-4 mr-2" />{_t('التحقق من الحالة', 'Check Status')}</Button>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Step 1: CSR Generation */}
                <Card className="border-emerald-200 shadow-sm">
                    <CardHeader className="bg-emerald-50/50 pb-4 border-b border-emerald-100">
                        <CardTitle className="text-lg flex items-center gap-2 text-emerald-800">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-200 text-emerald-800 text-sm font-bold">1</span>{_t('إنشاء المسؤولية الاجتماعية للشركات (طلب توقيع الشهادة)', 'Generate CSR (Certificate Signing Request)')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <p className="text-sm text-gray-600">{_t('تقوم هذه الخطوة بإنشاء مفتاح RSA خاص 2048 بت وCSR محليًا على الخادم. يتم تشفير المفتاح الخاص بشكل آمن ولا يغادر بيئتك أبدًا.', 'This step generates a 2048-bit RSA Private Key and a CSR locally on the server. The Private Key is securely encrypted and never leaves your environment.')}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{_t('رقم التسجيل في ضريبة القيمة المضافة', 'VAT Registration Number')}</label>
                                <input type="text" className="w-full p-2 border rounded-md" defaultValue="310122393500003" disabled />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Branch / Environment</label>
                                <select className="w-full p-2 border rounded-md">
                                    <option>{_t('الفرع الرئيسي - الإنتاج', 'Main Branch - Production')}</option>
                                    <option>Main Branch - Sandbox / Simulation</option>
                                </select>
                            </div>
                        </div>
                        <Button className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto mt-4">
                            <Key className="w-4 h-4 mr-2" />{_t('توليد المفاتيح والمسؤولية الاجتماعية للشركات', 'Generate Keys & CSR')}</Button>
                    </CardContent>
                </Card>

                {/* Step 2: Request Sandbox CSID */}
                <Card className="border-gray-200 shadow-sm opacity-60">
                    <CardHeader className="bg-gray-50 pb-4 border-b border-gray-100">
                        <CardTitle className="text-lg flex items-center gap-2 text-gray-600">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-sm font-bold">2</span>{_t('الحصول على الامتثال CSID (وضع الحماية)', 'Obtain Compliance CSID (Sandbox)')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <p className="text-sm text-gray-600">{_t('أرسل CSR الذي تم إنشاؤه وكلمة المرور لمرة واحدة (OTP) من بوابة فاتورة للحصول على Sandbox CSID.', 'Submit the generated CSR and a One-Time Password (OTP) from the Fatoora Portal to get a Sandbox CSID.')}</p>
                        <div className="space-y-2 max-w-xs">
                            <label className="text-sm font-medium text-gray-700">{_t('بوابة فاتورة OTP', 'Fatoora Portal OTP')}</label>
                            <input type="text" className="w-full p-2 border rounded-md" placeholder="123456" disabled />
                        </div>
                        <Button variant="outline" disabled>
                            <UploadCloud className="w-4 h-4 mr-2" />{_t('طلب وضع الحماية CSID', 'Request Sandbox CSID')}</Button>
                    </CardContent>
                </Card>

                {/* Step 3: Production CSID */}
                <Card className="border-gray-200 shadow-sm opacity-60">
                    <CardHeader className="bg-gray-50 pb-4 border-b border-gray-100">
                        <CardTitle className="text-lg flex items-center gap-2 text-gray-600">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-600 text-sm font-bold">3</span>{_t('CSID للإنتاج (PCSID)', 'Production CSID (PCSID)')}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <p className="text-sm text-gray-600">{_t('بعد إكمال عمليات التحقق من الامتثال باستخدام Sandbox CSID، يمكنك طلب معرف CSID للإنتاج الذي يُستخدم لتوقيع الفواتير المباشرة.', 'After completing compliance checks using the Sandbox CSID, you can request the Production CSID which is used for signing live invoices.')}</p>
                        <Button variant="outline" disabled>
                            <FileBadge className="w-4 h-4 mr-2" />{_t('طلب CSID الإنتاج', 'Request Production CSID')}</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
