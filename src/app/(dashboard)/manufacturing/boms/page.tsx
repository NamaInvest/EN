import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, ClipboardList, Plus, FileText, Settings, Layers } from 'lucide-react';
import Link from 'next/link';
import { BomsClient } from './components/BomsClient';
import prisma from '@/lib/prisma';
import { _t } from '@/lib/server-t';
export default async function BomsPage() {
    const recipes = await prisma.recipe.findMany({
            take: 100,
        orderBy: { name: 'asc' }
    });

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <ClipboardList className="w-8 h-8 text-indigo-600" />
                        {_t('وصفات التصنيع (BOM)', 'Bill of Materials (BOM) & Recipes')}
                    </h1>
                    <p className="text-gray-500 mt-1">{_t('إدارة مكونات الإنتاج، التوقعات، والتكاليف المعيارية.', 'Manage product formulas, yield expectations, and standard costs.')}</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/manufacturing">
                        <Button variant="outline" className="bg-white">{_t('العودة للرئيسية', 'Back to Dashboard')}</Button>
                    </Link>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
                        <Plus className="w-4 h-4 mr-2" />
                        {_t('إنشاء وصفة', 'Create BOM')}
                    </Button>
                </div>
            </div>

            {/* Data Grid via DataTable v2 */}
            <BomsClient data={recipes} />
        </div>
    );
}
