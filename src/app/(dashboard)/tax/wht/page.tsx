'use client';
import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, Search, Plus } from 'lucide-react';

export default function WHTPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <FileText className="w-8 h-8 text-teal-600" />{_t('Withholding Tax (WHT)', 'Withholding Tax (WHT)')}</h1>
                    <p className="text-gray-500 mt-1">{_t('Manage and track withholding tax payments to non-resident parties.', 'Manage and track withholding tax payments to non-resident parties.')}</p>
                </div>
                <div className="flex gap-2">
                    <Button className="bg-teal-600 hover:bg-teal-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />{_t('New WHT Form', 'New WHT Form')}</Button>
                </div>
            </div>

            <Card className="overflow-hidden border-gray-200 shadow-sm bg-white">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search WHT records..." 
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        />
                    </div>
                </div>
                <div className="p-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">{_t('No WHT records found', 'No WHT records found')}</h3>
                    <p className="mt-1">{_t('Create a new WHT form to begin tracking withholding taxes.', 'Create a new WHT form to begin tracking withholding taxes.')}</p>
                </div>
            </Card>
        </div>
    );
}
