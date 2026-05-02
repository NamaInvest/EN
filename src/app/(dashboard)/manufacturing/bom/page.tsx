'use client';

import React, { useState } from 'react';
import { Layers, ChevronRight, ChevronDown, Wrench, Package, Search, Plus } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';

export default function BOMExplosionPage() {
    const { lang } = useTranslation();
    const { success, info } = useToast();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;

    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        'P-100': true,
        'P-200': true
    });

    const toggleExpand = (id: string) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Multi-Level BOM</h1>
                    <p className="text-gray-500 mt-1 text-sm">Bill of Materials Explosion & Where-Used Analysis</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center">
                        <Wrench className="w-4 h-4 mr-2" />
                        ECO Approvals
                    </button>
                    <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 flex items-center">
                        <Plus className="w-4 h-4 mr-2" />
                        New BOM Version
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-between items-center rounded-t-lg">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search finished product..."
                                defaultValue="Office Desk Pro (SKU-8821)"
                                className="pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white w-80 font-medium"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500">Target Qty:</span>
                            <input type="number" defaultValue={50} className="w-20 border border-gray-300 dark:border-gray-600 rounded-md py-1.5 px-3 text-sm dark:bg-gray-700 dark:text-white" />
                        </div>
                        <button onClick={() => info(_t('ميزة تحت التطوير', 'Feature in development'))}  className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium rounded hover:bg-gray-300">
                            Explode
                        </button>
                    </div>
                </div>

                <div className="p-6">
                    <div className="mb-6 flex justify-between items-end border-b border-gray-100 pb-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                                <Package className="w-5 h-5 mr-2 text-blue-600" />
                                Office Desk Pro (SKU-8821)
                            </h2>
                            <p className="text-sm text-gray-500 ml-7">Target Production: 50 Units • BOM Version: V2.1.0 (Active)</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500">Total Standard Cost</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">12,500.00 SAR</p>
                        </div>
                    </div>

                    {/* BOM Tree */}
                    <div className="space-y-1 font-mono text-sm">
                        {/* Level 0 */}
                        <div className="flex items-center p-2 hover:bg-gray-50 rounded group">
                            <div className="w-8 flex justify-center cursor-pointer" onClick={() => toggleExpand('P-100')}>
                                {expanded['P-100'] ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                            </div>
                            <div className="flex-1 flex items-center font-bold text-gray-900">
                                <Layers className="w-4 h-4 mr-2 text-blue-600" /> Office Desk Pro (Finished Good)
                            </div>
                            <div className="w-24 text-right">50 pcs</div>
                            <div className="w-32 text-right">12,500.00 SAR</div>
                        </div>

                        {/* Level 1 - Top Component */}
                        {expanded['P-100'] && (
                            <>
                                <div className="flex items-center p-2 hover:bg-gray-50 rounded">
                                    <div className="w-8"></div>
                                    <div className="w-8 flex justify-center cursor-pointer" onClick={() => toggleExpand('P-200')}>
                                        {expanded['P-200'] ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                    </div>
                                    <div className="flex-1 flex items-center text-gray-700 font-semibold">
                                        <Layers className="w-4 h-4 mr-2 text-orange-500" /> Wooden Table Top Assembly (Sub-Assembly)
                                    </div>
                                    <div className="w-24 text-right text-gray-600">50 pcs</div>
                                    <div className="w-32 text-right text-gray-600">8,000.00 SAR</div>
                                </div>

                                {/* Level 2 - Raw Materials for Table Top */}
                                {expanded['P-200'] && (
                                    <>
                                        <div className="flex items-center p-2 hover:bg-gray-50 rounded bg-gray-50/50">
                                            <div className="w-16"></div>
                                            <div className="w-8 flex justify-center"><div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div></div>
                                            <div className="flex-1 flex items-center text-gray-600">
                                                Oak Wood Panel (2m x 1m)
                                            </div>
                                            <div className="w-24 text-right text-gray-500">50 pcs</div>
                                            <div className="w-32 text-right text-gray-500">5,000.00 SAR</div>
                                        </div>
                                        <div className="flex items-center p-2 hover:bg-gray-50 rounded bg-gray-50/50">
                                            <div className="w-16"></div>
                                            <div className="w-8 flex justify-center"><div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div></div>
                                            <div className="flex-1 flex items-center text-gray-600">
                                                Varnish Coating (Liters)
                                            </div>
                                            <div className="w-24 text-right text-gray-500">25 L</div>
                                            <div className="w-32 text-right text-gray-500">3,000.00 SAR</div>
                                        </div>
                                    </>
                                )}

                                {/* Level 1 - Legs Component */}
                                <div className="flex items-center p-2 hover:bg-gray-50 rounded">
                                    <div className="w-8"></div>
                                    <div className="w-8 flex justify-center cursor-pointer" onClick={() => toggleExpand('P-300')}>
                                        {expanded['P-300'] ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                                    </div>
                                    <div className="flex-1 flex items-center text-gray-700 font-semibold">
                                        <Layers className="w-4 h-4 mr-2 text-orange-500" /> Metal Leg Assembly (Sub-Assembly)
                                    </div>
                                    <div className="w-24 text-right text-gray-600">100 pcs</div>
                                    <div className="w-32 text-right text-gray-600">4,500.00 SAR</div>
                                </div>

                                {/* Level 2 - Raw Materials for Legs */}
                                {expanded['P-300'] && (
                                    <>
                                        <div className="flex items-center p-2 hover:bg-gray-50 rounded bg-gray-50/50">
                                            <div className="w-16"></div>
                                            <div className="w-8 flex justify-center"><div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div></div>
                                            <div className="flex-1 flex items-center text-gray-600">
                                                Steel Tube (1m)
                                            </div>
                                            <div className="w-24 text-right text-gray-500">100 pcs</div>
                                            <div className="w-32 text-right text-gray-500">3,500.00 SAR</div>
                                        </div>
                                        <div className="flex items-center p-2 hover:bg-gray-50 rounded bg-gray-50/50">
                                            <div className="w-16"></div>
                                            <div className="w-8 flex justify-center"><div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div></div>
                                            <div className="flex-1 flex items-center text-gray-600">
                                                Screws (Pack of 10)
                                            </div>
                                            <div className="w-24 text-right text-gray-500">40 packs</div>
                                            <div className="w-32 text-right text-gray-500">1,000.00 SAR</div>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
