'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, CheckCircle, Search, Clock, FileSpreadsheet } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function RevenueRecognitionDashboard() {
    const { lang } = useTranslation();
    const { success, info } = useToast();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/accounting/revenue-recognition', {
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
    }, []);

    const runMonthlyRecognition = async () => {
        try {
            const res = await fetch('/api/accounting/revenue-recognition', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
                const result = await res.json();
                success(_t(`تم احتساب الإيرادات للشهر. (${result.recognizedCount} جدول)`, `Monthly revenue recognized successfully. (${result.recognizedCount} schedules updated)`));
                fetchData();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const schedules = data?.schedules || [];
    const summary = data?.summary || { activeCount: 0, totalRecognized: 0, totalDeferred: 0 };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Revenue Recognition (IFRS 15)</h1>
                    <p className="text-gray-500 mt-1 text-sm">Deferred Revenue Schedules & Performance Obligations</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={runMonthlyRecognition} className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Run Monthly Recognition
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Active Schedules</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{summary.activeCount}</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Recognized Revenue (YTD)</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{Number(summary.totalRecognized).toLocaleString()} SAR</h3>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex items-center">
                    <div className="p-3 rounded-full bg-orange-100 text-orange-600 mr-4">
                        <Clock className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Deferred Revenue Balance</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{Number(summary.totalDeferred).toLocaleString()} SAR</h3>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 rounded-t-lg">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                        <FileSpreadsheet className="w-5 h-5 mr-2 text-gray-500" />
                        Amortization Schedules
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search invoice or customer..."
                            className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white w-64"
                        />
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-white dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice / Contract</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Recognized</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining (Deferred)</th>
                                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Loading schedules...</td></tr>
                            ) : schedules.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-10 text-gray-500">No schedules found</td></tr>
                            ) : schedules.map((schedule: any) => {
                                const progress = schedule.totalAmount > 0 ? (schedule.recognizedAmount / schedule.totalAmount) * 100 : 0;
                                return (
                                    <tr key={schedule.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-blue-600">INV-{schedule.invoiceId}</div>
                                            <div className="text-xs text-gray-500">ID: {schedule.id}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">{new Date(schedule.startDate).toLocaleDateString()} - {new Date(schedule.endDate).toLocaleDateString()}</div>
                                            <div className="text-xs text-gray-500">{schedule.recognitionMethod}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300 text-right">
                                            {Number(schedule.totalAmount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium text-right">
                                            {Number(schedule.recognizedAmount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-medium text-right">
                                            {Number(schedule.remainingAmount).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {schedule.status === 'COMPLETED' ? (
                                                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    COMPLETED
                                                </span>
                                            ) : (
                                                <>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 max-w-[100px] mx-auto">
                                                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                                    </div>
                                                    <span className="text-xs text-gray-500 mt-1 inline-block">{Math.round(progress)}%</span>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
