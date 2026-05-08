'use client';
import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/data/DataTable';
import { Button } from '@/components/ui/button';
import { PlayCircle, CheckCircle, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { _t } from '@/lib/server-t';

export type ManufacturingOrderDTO = {
  id: number;
  orderNumber: string;
  recipeId: number;
  quantityToProduce: any;
  startDate: Date;
  totalCost: any;
  status: string;
};

interface OrdersClientProps {
  data: ManufacturingOrderDTO[];
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800'; // draft / planned
  }
};

export function OrdersClient({ data }: OrdersClientProps) {
  const columns: ColumnDef<ManufacturingOrderDTO>[] = [
    {
      accessorKey: 'orderNumber',
      header: 'Order #',
      cell: ({ row }) => <span className="font-medium text-gray-900">{row.original.orderNumber}</span>,
    },
    {
      accessorKey: 'recipeId',
      header: 'Recipe / Product ID',
      cell: ({ row }) => <span className="text-gray-700">Recipe #{row.original.recipeId}</span>,
    },
    {
      accessorKey: 'quantityToProduce',
      header: _t('الكمية', 'Qty to Produce'),
      cell: ({ row }) => <span className="font-medium text-gray-900">{Number(row.original.quantityToProduce)}</span>,
    },
    {
      accessorKey: 'startDate',
      header: _t('تاريخ البداية', 'Start Date'),
      cell: ({ row }) => (
        <div className="text-gray-500 flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {format(new Date(row.original.startDate), 'MMM dd, yyyy')}
        </div>
      ),
    },
    {
      accessorKey: 'totalCost',
      header: _t('التكلفة الإجمالية', 'Total Cost'),
      cell: ({ row }) => {
        const cost = Number(row.original.totalCost);
        return <span className="font-medium">{cost > 0 ? `${cost.toLocaleString()} SAR` : '-'}</span>;
      },
    },
    {
      accessorKey: 'status',
      header: _t('الحالة', 'Status'),
      cell: ({ row }) => {
        const st = row.original.status;
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusColor(st)}`}>
            {st.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: _t('إجراءات', 'Actions'),
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <div className="text-right">
            {status === 'draft' && (
                <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                    <PlayCircle className="w-4 h-4 mr-1" />{_t('Start', 'Start')}</Button>
            )}
            {status === 'in_progress' && (
                <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                    <CheckCircle className="w-4 h-4 mr-1" />{_t('مكتمل', 'Complete')}</Button>
            )}
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
      emptyMessage={_t('No Work Orders', 'No Work Orders')}
    />
  );
}
