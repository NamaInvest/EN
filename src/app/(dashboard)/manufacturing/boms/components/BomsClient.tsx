'use client';
import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data/DataTable';
import { Button } from '@/components/ui/button';
import { Layers, FileText } from 'lucide-react';
import { _t } from '@/lib/server-t'; // Or client translator if available

// We assume the recipe data type roughly matches what Prisma returns.
export type RecipeDTO = {
  id: number;
  name: string;
  finishedProductId: number | null;
  totalCost: any; // Prisma Decimal
  expectedYieldQty: any; // Prisma Decimal
  scrapPercentage: any; // Prisma Decimal
  isActive: boolean;
};

interface BomsClientProps {
  data: RecipeDTO[];
}

export function BomsClient({ data }: BomsClientProps) {
  const columns: ColumnDef<RecipeDTO>[] = [
    {
      accessorKey: 'name',
      header: _t('اسم الوصفة', 'Recipe Name'),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2 font-medium text-gray-900">
            <Layers className="w-4 h-4 text-indigo-400" />
            {row.original.name}
          </div>
        );
      },
    },
    {
      accessorKey: 'finishedProductId',
      header: _t('معرف المنتج النهائي', 'Finished Product ID'),
      cell: ({ row }) => {
        return (
          <span className="text-gray-700">
            PROD-{row.original.finishedProductId}
          </span>
        );
      },
    },
    {
      accessorKey: 'totalCost',
      header: _t('التكلفة الإجمالية', 'Total Cost (Standard)'),
      cell: ({ row }) => {
        const val = Number(row.original.totalCost);
        return <span className="font-medium text-gray-900">{val.toLocaleString()} SAR</span>;
      },
    },
    {
      accessorKey: 'expectedYieldQty',
      header: _t('الكمية المتوقعة', 'Expected Yield Qty'),
      cell: ({ row }) => {
        const val = row.original.expectedYieldQty;
        return <span className="text-gray-700">{val !== null ? Number(val) : '-'}</span>;
      },
    },
    {
      accessorKey: 'scrapPercentage',
      header: _t('نسبة الهدر', 'Scrap %'),
      cell: ({ row }) => {
        return <span className="text-red-600">{Number(row.original.scrapPercentage)}%</span>;
      },
    },
    {
      accessorKey: 'isActive',
      header: _t('الحالة', 'Status'),
      cell: ({ row }) => {
        const active = row.original.isActive;
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
              {active ? _t('نشط', 'Active') : _t('غير نشط', 'Inactive')}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: _t('إجراءات', 'Actions'),
      cell: ({ row }) => {
        return (
          <div className="text-right">
             <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
                <FileText className="w-4 h-4 mr-1" /> {_t('التفاصيل', 'Details')}
             </Button>
          </div>
        );
      },
    },
  ];

  return (
    <DataTable 
      columns={columns} 
      data={data} 
      pageSize={15} 
      emptyMessage={_t('لا توجد وصفات', 'No BOMs Defined')}
    />
  );
}
