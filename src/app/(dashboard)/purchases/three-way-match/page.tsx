'use client';

import React from 'react';
import { ShieldCheck, Search, Filter, AlertTriangle, Check, X, Eye } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function ThreeWayMatchDashboard() {
    const { lang } = useTranslation();
    const { success, info } = useToast();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

    return (
        <div className="p-6 h-[calc(100vh-64px)] flex flex-col bg-gray-50 dark:bg-gray-900">
            <div className="flex justify-between items-center pb-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
                        <ShieldCheck className="w-8 h-8 mr-3 text-purple-600" />
                        {_t('المطابقة الثلاثية (Three-Way Matching)', 'Three-Way Matching')}
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">{_t('مطابقة آلية للفواتير مع أوامر الشراء ومحاضر الاستلام (أمر الشراء ↔ محضر الاستلام ↔ الفاتورة)', 'Automated invoice validation against PO and GRN (Purchase Order ↔ Receipt ↔ Invoice)')}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => info(_t('جاري تصفية الاستثناءات...', 'Filtering exceptions...'))} className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center dark:bg-gray-800 dark:text-white dark:border-gray-700">
                        <Filter className="w-4 h-4 mr-2" />
                        {_t('تصفية الاستثناءات', 'Filter Exceptions')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 shrink-0">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-sm font-medium text-gray-500">{_t('فواتير معالجة (30 يوم)', 'Invoices Processed (30d)')}</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-mono mt-1">458</h3>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">{_t('تطابق آلي (بدون فروقات)', 'Auto-Matched (No Variance)')}</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-mono mt-1">412 <span className="text-sm text-gray-400 font-sans ml-1">(90%)</span></h3>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">{_t('ضمن نسبة التسامح', 'Within Tolerance')}</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-mono mt-1">24 <span className="text-sm text-gray-400 font-sans ml-1">(5%)</span></h3>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-lg border border-red-200 dark:border-red-800 shadow-sm">
                    <p className="text-sm font-medium text-red-800 dark:text-red-400">{_t('استثناءات (مُعلقة)', 'Exceptions (On Hold)')}</p>
                    <h3 className="text-2xl font-bold text-red-900 dark:text-red-300 font-mono mt-1">22</h3>
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm flex flex-col min-h-0">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{_t('طابور الاستثناءات المعلقة', 'Matching Exceptions queue')}</h3>
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-2 top-2 text-gray-400" />
                        <input type="text" placeholder={_t('بحث عن مورد أو فاتورة...', 'Search Supplier or Invoice...')} className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white" />
                    </div>
                </div>
                
                <div className="overflow-y-auto flex-1 p-0">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 sticky top-0 shadow-sm">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('الفاتورة / المورد', 'Invoice / Supplier')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('إجمالي طلب الشراء (PO)', 'PO Total')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('إجمالي الاستلام (GRN)', 'GRN Total')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('إجمالي الفاتورة', 'Invoice Total')}</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('سبب التعليق', 'Hold Reason')}</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('إجراءات', 'Actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-blue-600">INV-99021</div>
                                    <div className="text-xs text-gray-500">Global Suppliers LLC</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-gray-500">
                                    10,000.00
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-gray-500">
                                    10,000.00
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono font-bold text-red-600">
                                    11,500.00
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                                        {_t('اختلاف سعر (+15%)', 'PRICE_HOLD (+15%)')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex justify-center space-x-2">
                                        <button onClick={() => success(_t('تم اعتماد الفاتورة وتجاوز نسبة التسامح', 'Invoice approved (tolerance overridden)'))} className="p-1 rounded text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 tooltip" title="Force Approve (Override Tolerance)">
                                            <Check className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => success(_t('تم رفض الفاتورة وطلب إشعار دائن', 'Invoice rejected, credit note requested'))} className="p-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 tooltip" title="Reject / Request Credit Note">
                                            <X className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => info(_t('عرض التفاصيل...', 'Viewing details...'))} className="p-1 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 tooltip" title="View Details">
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-blue-600">INV-8834</div>
                                    <div className="text-xs text-gray-500">National Paper Co</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-gray-500">
                                    5,000.00
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-red-600 font-bold">
                                    2,500.00
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-mono text-gray-900 dark:text-gray-300">
                                    5,000.00
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">
                                        {_t('اختلاف كمية (نقص بالاستلام)', 'QTY_HOLD (Short Receipt)')}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                    <div className="flex justify-center space-x-2">
                                        <button onClick={() => success(_t('تم اعتماد الفاتورة وتجاوز نسبة التسامح', 'Invoice approved (tolerance overridden)'))} className="p-1 rounded text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30">
                                            <Check className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => success(_t('تم رفض الفاتورة وطلب إشعار دائن', 'Invoice rejected, credit note requested'))} className="p-1 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30">
                                            <X className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => info(_t('عرض التفاصيل...', 'Viewing details...'))} className="p-1 rounded text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
