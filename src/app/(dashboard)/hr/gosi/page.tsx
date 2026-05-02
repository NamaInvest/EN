'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Calculator, Download, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function GOSIDashboard() {
    const { lang } = useTranslation();
    const { success, info } = useToast();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [data, setData] = useState<any>(null);
    const [year, setYear] = useState('2026');
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/hr/gosi?year=${year}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                setData(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [year]);

    const calculateCurrentMonth = async () => {
        try {
            const res = await fetch('/api/hr/gosi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
                body: JSON.stringify({ month: new Date().getMonth() + 1, year: new Date().getFullYear() })
            });
            if (res.ok) {
                success(_t('تم تحديث اشتراكات التأمينات بنجاح', 'GOSI contributions updated successfully'));
                fetchData();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const summary = data?.totals || { totalGosi: 0, totalEmployeeDeductions: 0, totalEmployerContributions: 0, saudiCount: 0, expatCount: 0 };
    const employees = data?.employees || [];

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center">
                        <Shield className="w-8 h-8 mr-3 text-green-600" />
                        {_t('اشتراكات التأمينات (GOSI)', 'GOSI Contributions')}
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">{_t('إدارة المؤسسة العامة للتأمينات الاجتماعية (المعاشات، الأخطار، ساند)', 'General Organization for Social Insurance Management (Annuities, Hazards, SANED)')}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={calculateCurrentMonth} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 flex items-center">
                        <Calculator className="w-4 h-4 mr-2" />
                        {_t('احتساب اشتراكات الشهر الحالي', 'Calculate Current Month')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-sm font-medium text-gray-500 mb-1">{_t('عدد الموظفين', 'Employees Count')}</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{employees.length}</h3>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-sm font-medium text-gray-500 mb-1">{_t('حصة الموظف (مستقطعة)', 'Employee Share (Deducted)')}</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{Number(summary.totalEmployeeDeductions).toLocaleString()}</h3>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-sm font-medium text-gray-500 mb-1">{_t('حصة المنشأة (مصروف)', 'Employer Share (Expense)')}</p>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white font-mono">{Number(summary.totalEmployerContributions).toLocaleString()}</h3>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-200 dark:border-blue-800 shadow-sm">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-400 mb-1">{_t('إجمالي المستحق للتأمينات', 'Total Payable to GOSI')}</p>
                    <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-300 font-mono">{Number(summary.totalGosi).toLocaleString()}</h3>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">{_t('ملخص الاشتراكات الشهرية', 'Monthly Summary')}</h2>
                    <select className="px-3 py-1 border border-gray-300 rounded-md text-sm dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                        <option>2026</option>
                        <option>2025</option>
                    </select>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-white dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('الموظف', 'Employee')}</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('الراتب الأساسي', 'Base Salary')}</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('حصة الموظف', 'Employee Share')}</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('حصة المنشأة', 'Employer Share')}</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{_t('الإجمالي', 'Total')}</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={5} className="text-center py-10 text-gray-500">{_t('جاري التحميل...', 'Loading...')}</td></tr>
                            ) : employees.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-10 text-gray-500">{_t('لا توجد بيانات حالياً', 'No data available')}</td></tr>
                            ) : employees.map((emp: any) => (
                                <tr key={emp.employeeId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{emp.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500 font-mono">{Number(emp.baseSalary).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-mono text-gray-500">{Number(emp.employeeDeduction).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-mono text-gray-500">{Number(emp.employerContribution).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-blue-600 font-mono">{Number(emp.totalGosi).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
