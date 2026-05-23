import React from 'react';
import { useTranslation } from "@/lib/i18n";

export default function LearningDashboardPage() {
    const { lang } = useTranslation();
        const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Namasoft Learning Hub</h1>
                <span className="bg-teal-100 text-teal-800 text-sm font-semibold px-3 py-1 rounded-full">
                    Your Role: Cashier
                </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Mandatory Courses */}
                <div className="md:col-span-2">
                    <h2 className="text-lg font-semibold mb-4">Mandatory Compliance Training</h2>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-4 flex items-center justify-between border-b border-gray-100">
                            <div>
                                <h3 className="font-bold text-gray-800">PDPL Data Privacy Awareness (2026)</h3>
                                <p className="text-sm text-gray-500">Required for all employees handling customer data.</p>
                            </div>
                            <button className="bg-teal-700 text-white px-4 py-2 rounded-md hover:bg-teal-800 text-sm font-medium">
                                Start Course (20m)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Progress Summary */}
                <div>
                    <h2 className="text-lg font-semibold mb-4">Your Progress</h2>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex justify-between mb-2">
                            <span className="text-gray-600">Completed Courses</span>
                            <span className="font-bold">1 / 4</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-teal-600 h-2.5 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                    </div>
                </div>
            </div>

            <h2 className="text-lg font-semibold mb-4">Role-Specific Training</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="h-40 bg-gray-200 flex items-center justify-center relative">
                        <span className="text-4xl">🛒</span>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">10:00</div>
                    </div>
                    <div className="p-4 flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">Cashier Basics</h3>
                        <p className="text-sm text-gray-500 mb-4">Learn how to checkout customers, apply discounts, and issue ZATCA receipts.</p>
                        <div className="flex justify-between items-center mt-auto">
                            <span className="text-green-600 text-sm font-semibold flex items-center">
                                {_t('✓ مكتمل', '✓ Completed')}</span>
                            <a href="#" className="text-teal-700 text-sm font-medium hover:underline">View Certificate</a>
                        </div>
                    </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="h-40 bg-gray-200 flex items-center justify-center relative">
                        <span className="text-4xl">🔙</span>
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">05:30</div>
                    </div>
                    <div className="p-4 flex-1">
                        <h3 className="font-bold text-gray-900 mb-1">Handling Returns</h3>
                        <p className="text-sm text-gray-500 mb-4">Process refunds and credit notes properly following SOCPA standards.</p>
                        <div className="mt-auto">
                            <button className="w-full border border-teal-700 text-teal-700 py-2 rounded-md hover:bg-teal-50 text-sm font-medium transition-colors">
                                Start Course
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
