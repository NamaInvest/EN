'use client';
import React from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card } from '@/components/ui/card';
import { Mail, Search } from 'lucide-react';

export default function DunningLettersPage() {
  const { lang } = useTranslation();
  const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <h1 className="text-3xl font-bold flex items-center gap-2"><Mail /> Dunning Letters</h1>
            <Card className="p-12 text-center text-gray-500">
                <Search className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No letters generated yet</h3>
                <p>Run the dunning engine to generate collection letters.</p>
            </Card>
        </div>
    );
}
