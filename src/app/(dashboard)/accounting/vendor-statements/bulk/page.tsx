import { _t } from '@/lib/server-t';
'use client';
import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Send, ArrowLeft, Mail, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function BulkVendorStatementsPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    return (
        <div className="max-w-5xl mx-auto space-y-6 p-6">
            <div className="flex items-center gap-4">
                <Link href="/accounting/vendor-statements">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">{_t('Bulk Send Statements', 'Bulk Send Statements')}</h1>
                    <p className="text-gray-500">{_t('Dispatch vendor balance statements en masse via Email.', 'Dispatch vendor balance statements en masse via Email.')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>{_t('Delivery Configuration', 'Delivery Configuration')}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">{_t('Statement Template', 'Statement Template')}</label>
                                    <select className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                        <option>{_t('Standard Supplier Statement', 'Standard Supplier Statement')}</option>
                                        <option>{_t('Detailed Activity Statement', 'Detailed Activity Statement')}</option>
                                        <option>{_t('Outstanding Invoices Only', 'Outstanding Invoices Only')}</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">{_t('Statement Period', 'Statement Period')}</label>
                                    <select className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                        <option>{_t('Previous Calendar Month', 'Previous Calendar Month')}</option>
                                        <option>{_t('Year-To-Date', 'Year-To-Date')}</option>
                                        <option>{_t('Custom Range', 'Custom Range')}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2 pt-4">
                                <label className="text-sm font-medium text-gray-700">{_t('Email Subject', 'Email Subject')}</label>
                                <input 
                                    type="text" 
                                    defaultValue="Account Statement from [Company Name]"
                                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">{_t('Email Body Message', 'Email Body Message')}</label>
                                <textarea 
                                    rows={4}
                                    defaultValue="Dear Supplier,\n\nPlease find attached your account statement for the requested period. Please review and contact our AP department if you find any discrepancies."
                                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <p className="text-xs text-gray-500">Variables available: [Vendor_Name], [Total_Outstanding], [Statement_Date]</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{_t('Filter Vendors', 'Filter Vendors')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                                        <span className="text-sm text-gray-700">{_t('Only vendors with outstanding balance', 'Only vendors with outstanding balance')}</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" defaultChecked className="rounded text-blue-600 focus:ring-blue-500" />
                                        <span className="text-sm text-gray-700">{_t('Only vendors with valid email address', 'Only vendors with valid email address')}</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" />
                                        <span className="text-sm text-gray-700">{_t('Include zero-balance vendors', 'Include zero-balance vendors')}</span>
                                    </label>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">{_t('Minimum Balance (SAR)', 'Minimum Balance (SAR)')}</label>
                                    <input 
                                        type="number" 
                                        defaultValue="0"
                                        className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-gray-50">
                        <CardHeader>
                            <CardTitle className="text-lg">{_t('Summary Preview', 'Summary Preview')}</CardTitle>
                            <CardDescription>{_t('Based on your current filters', 'Based on your current filters')}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span className="text-sm text-gray-600">Eligible Vendors:</span>
                                <span className="font-bold text-gray-900">45</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                <span className="text-sm text-gray-600">Total Balance:</span>
                                <span className="font-bold text-gray-900">1.2M SAR</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-gray-600">Missing Emails:</span>
                                <span className="font-medium text-orange-600">3 Vendors</span>
                            </div>

                            <div className="pt-6">
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-md shadow-md flex justify-center items-center">
                                    <Send className="w-5 h-5 mr-2" />{_t('Send 45 Statements', 'Send 45 Statements')}</Button>
                            </div>
                            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 mt-2">
                                <ShieldCheck className="w-4 h-4 text-green-500" />
                                <span>{_t('SSL Encrypted Transmission', 'SSL Encrypted Transmission')}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Automate this process?</h4>
                            <p className="text-xs text-gray-500 mb-4">{_t('You can set up a recurring schedule to send vendor statements automatically on the 1st of every month.', 'You can set up a recurring schedule to send vendor statements automatically on the 1st of every month.')}</p>
                            <Button variant="outline" className="w-full text-sm h-8">
                                <Clock className="w-3 h-3 mr-2" />{_t('Configure Schedule', 'Configure Schedule')}</Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
