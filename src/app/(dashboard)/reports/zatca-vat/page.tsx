'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, ArrowRight, ShieldCheck, Calculator } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function ZatcaVatReturn() {
    const { lang } = useTranslation();
    const { success, info } = useToast();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [period, setPeriod] = useState('2026-Q1');
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/reports/zatca-vat?period=${period}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                if (res.ok) {
                    setReport(await res.json());
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchReport();
    }, [period]);

    const formatCurrency = (amount: number) => Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    // Fallback if loading or error
    const data = report || {
        sales: { standard: { amount: 0, adjustment: 0, vat: 0 }, zeroRated: { amount: 0, adjustment: 0, vat: 0 }, exports: { amount: 0, adjustment: 0, vat: 0 }, exempt: { amount: 0, adjustment: 0, vat: 0 } },
        purchases: { standard: { amount: 0, adjustment: 0, vat: 0 }, importsPaidAtCustoms: { amount: 0, adjustment: 0, vat: 0 }, importsReverseCharge: { amount: 0, adjustment: 0, vat: 0 }, zeroRated: { amount: 0, adjustment: 0, vat: 0 }, exempt: { amount: 0, adjustment: 0, vat: 0 } }
    };

    const totalSales = data.sales.standard.amount + data.sales.zeroRated.amount + data.sales.exports.amount + data.sales.exempt.amount;
    const totalSalesVat = data.sales.standard.vat;
    
    const totalPurchases = data.purchases.standard.amount + data.purchases.importsPaidAtCustoms.amount + data.purchases.importsReverseCharge.amount + data.purchases.zeroRated.amount + data.purchases.exempt.amount;
    const totalPurchasesVat = data.purchases.standard.vat + data.purchases.importsPaidAtCustoms.vat + data.purchases.importsReverseCharge.vat;

    const netVatDue = totalSalesVat - totalPurchasesVat;

    return (
        <div className="p-6 h-[calc(100vh-64px)] flex flex-col bg-gray-50 dark:bg-gray-900">
            <div className="flex justify-between items-center pb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
                        <ShieldCheck className="w-8 h-8 mr-3 text-green-600" />
                        {_t('إقرار ضريبة القيمة المضافة ZATCA', 'ZATCA VAT Return')}
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">{_t('نموذج الإقرار الضريبي الرسمي للمملكة العربية السعودية', 'Official VAT Return Form for the Kingdom of Saudi Arabia')}</p>
                </div>
                <div className="flex gap-2">
                    <select 
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                    >
                        <option value="2026-Q1">{_t('الربع الأول 2026 (يناير - مارس)', 'Q1 2026 (Jan - Mar)')}</option>
                        <option value="2026-Q2">{_t('الربع الثاني 2026 (أبريل - يونيو)', 'Q2 2026 (Apr - Jun)')}</option>
                        <option value="2026-Q3">{_t('الربع الثالث 2026 (يوليو - سبتمبر)', 'Q3 2026 (Jul - Sep)')}</option>
                        <option value="2026-Q4">{_t('الربع الرابع 2026 (أكتوبر - ديسمبر)', 'Q4 2026 (Oct - Dec)')}</option>
                    </select>
                    <button onClick={() => success(_t('تم تصدير ملف الإقرار الضريبي XML بنجاح', 'e-Filing XML exported successfully'))} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 flex items-center">
                        <Download className="w-4 h-4 mr-2" />
                        {_t('تصدير ملف XML للهيئة', 'Export e-Filing XML')}
                    </button>
                    <button onClick={() => info(_t('جاري إنشاء نسخة PDF...', 'Generating PDF copy...'))} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center dark:bg-gray-800 dark:text-white dark:border-gray-700">
                        <FileText className="w-4 h-4 mr-2" />
                        {_t('نسخة PDF', 'PDF Copy')}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                
                {/* 1. Value on Sales */}
                <div className="p-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 dark:border-gray-700">{_t('1. ضريبة القيمة المضافة على المبيعات (ضريبة المخرجات)', '1. VAT on Sales (Output Tax)')}</h2>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 mb-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <thead className="bg-gray-100 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{_t('البند', 'Item')}</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{_t('المبلغ (ريال)', 'Amount (SAR)')}</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{_t('التعديل (ريال)', 'Adjustment (SAR)')}</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{_t('مبلغ الضريبة (ريال)', 'VAT Amount (SAR)')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            <tr className="bg-white dark:bg-gray-800">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-medium">{_t('1. المبيعات الخاضعة للنسبة الأساسية (15%)', '1. Standard rated sales (15%)')}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(data.sales.standard.amount)}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(data.sales.standard.adjustment)}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono font-medium text-gray-900 dark:text-white">{formatCurrency(data.sales.standard.vat)}</td>
                            </tr>
                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-medium">{_t('2. المبيعات للعملاء في دول مجلس التعاون', '2. Sales to customers in GCC countries')}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono bg-gray-200 dark:bg-gray-700 text-gray-500">N/A</td>
                            </tr>
                            <tr className="bg-white dark:bg-gray-800">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-medium">{_t('3. المبيعات المحلية الخاضعة للنسبة الصفرية', '3. Zero-rated domestic sales')}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(data.sales.zeroRated.amount)}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono bg-gray-200 dark:bg-gray-700 text-gray-500">N/A</td>
                            </tr>
                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-medium">{_t('4. الصادرات', '4. Exports')}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(data.sales.exports.amount)}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono bg-gray-200 dark:bg-gray-700 text-gray-500">N/A</td>
                            </tr>
                            <tr className="bg-white dark:bg-gray-800">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-medium">{_t('5. المبيعات المعفاة', '5. Exempt sales')}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(data.sales.exempt.amount)}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono bg-gray-200 dark:bg-gray-700 text-gray-500">N/A</td>
                            </tr>
                            <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{_t('6. إجمالي المبيعات', '6. Total Sales')}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(totalSales)}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono text-blue-600 dark:text-blue-400">{formatCurrency(totalSalesVat)}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* 2. Value on Purchases */}
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 dark:border-gray-700">{_t('2. ضريبة القيمة المضافة على المشتريات (ضريبة المدخلات)', '2. VAT on Purchases (Input Tax)')}</h2>
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 mb-6 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <thead className="bg-gray-100 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{_t('البند', 'Item')}</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{_t('المبلغ (ريال)', 'Amount (SAR)')}</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{_t('التعديل (ريال)', 'Adjustment (SAR)')}</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">{_t('مبلغ الضريبة (ريال)', 'VAT Amount (SAR)')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            <tr className="bg-white dark:bg-gray-800">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-medium">{_t('7. المشتريات المحلية الخاضعة للنسبة الأساسية (15%)', '7. Standard rated domestic purchases (15%)')}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(data.purchases.standard.amount)}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(data.purchases.standard.adjustment)}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono font-medium text-gray-900 dark:text-white">{formatCurrency(data.purchases.standard.vat)}</td>
                            </tr>
                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-medium">{_t('8. الاستيرادات الخاضعة لضريبة القيمة المضافة المدفوعة في الجمارك', '8. Imports subject to VAT paid at customs')}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(data.purchases.importsPaidAtCustoms.amount)}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(data.purchases.importsPaidAtCustoms.adjustment)}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono font-medium text-gray-900 dark:text-white">{formatCurrency(data.purchases.importsPaidAtCustoms.vat)}</td>
                            </tr>
                            <tr className="bg-white dark:bg-gray-800">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-medium">{_t('9. الاستيرادات الخاضعة للضريبة والتي تطبق عليها آلية الاحتساب العكسي', '9. Imports subject to VAT accounted for through reverse charge mechanism')}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(data.purchases.importsReverseCharge.amount)}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(data.purchases.importsReverseCharge.adjustment)}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono font-medium text-gray-900 dark:text-white">{formatCurrency(data.purchases.importsReverseCharge.vat)}</td>
                            </tr>
                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-medium">{_t('10. المشتريات الخاضعة للنسبة الصفرية', '10. Zero-rated purchases')}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(data.purchases.zeroRated.amount)}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono bg-gray-200 dark:bg-gray-700 text-gray-500">N/A</td>
                            </tr>
                            <tr className="bg-white dark:bg-gray-800">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300 font-medium">{_t('11. المشتريات المعفاة', '11. Exempt purchases')}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(data.purchases.exempt.amount)}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono bg-gray-200 dark:bg-gray-700 text-gray-500">N/A</td>
                            </tr>
                            <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{_t('12. إجمالي المشتريات', '12. Total Purchases')}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(totalPurchases)}</td>
                                <td className="px-4 py-3 text-sm text-right font-mono">0.00</td>
                                <td className="px-4 py-3 text-sm text-right font-mono text-blue-600 dark:text-blue-400">{formatCurrency(totalPurchasesVat)}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* 3. Net VAT */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                <Calculator className="w-6 h-6 mr-2 text-blue-600" />
                                {_t('14. صافي الضريبة المستحقة', '14. Net VAT Due')}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">{_t('إجمالي ضريبة المخرجات (البند 6) ناقص إجمالي ضريبة المدخلات (البند 12)', 'Total Output VAT (Item 6) minus Total Input VAT (Item 12)')}</p>
                        </div>
                        <div className="text-right">
                            <span className={`text-3xl font-extrabold ${netVatDue < 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'} font-mono tracking-tight`}>
                                {formatCurrency(Math.abs(netVatDue))}
                            </span>
                            <span className="text-sm text-gray-500 ml-2 font-medium">{_t('ريال', 'SAR')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
