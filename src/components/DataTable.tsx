import React, { useState, useMemo } from 'react';
import { Search, Download, Printer, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState
} from '@tanstack/react-table';

interface Column {
    key: string;
    label: string;
    render?: (item: any) => React.ReactNode;
}

interface DataTableProps {
    columns: Column[];
    data: any[];
    searchPlaceholder?: string;
    itemsPerPage?: number;
    title?: string;
}

export function DataTable({ columns, data, searchPlaceholder = 'Search...', itemsPerPage = 10, title }: DataTableProps) {
    const { lang } = useTranslation();
    const _t = (ar: string, en: string) => lang === 'ar' ? ar : en;
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<SortingState>([]);

    const tableColumns = useMemo<ColumnDef<any, any>[]>(() => {
        return columns.map(c => ({
            accessorKey: c.key,
            header: c.label,
            cell: info => c.render ? c.render(info.row.original) : info.getValue(),
        }));
    }, [columns]);

    const table = useReactTable({
        data,
        columns: tableColumns,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: 'includesString',
        state: {
            sorting,
            globalFilter,
        },
        initialState: {
            pagination: { pageSize: itemsPerPage }
        }
    });

    const handleExportCSV = () => {
        const headers = columns.map(c => c.label).join(',');
        const rows = table.getFilteredRowModel().rows.map(row => 
            columns.map(c => {
                let val = row.original[c.key];
                if (typeof val === 'string') val = val.replace(/"/g, '""');
                return `"${val || ''}"`;
            }).join(',')
        ).join('\n');
        
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + headers + '\n' + rows;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${title || 'export'}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col w-full">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between gap-4 items-center bg-gray-50 dark:bg-gray-800/50">
                <div className="relative w-full md:w-96">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        value={globalFilter ?? ''}
                        onChange={(e) => setGlobalFilter(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full pl-4 pr-10 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:bg-gray-900 dark:border-gray-700 dark:text-white"
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button onClick={handleExportCSV} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors">
                        <Download className="w-4 h-4 text-green-600" /> {_t('تصدير', 'Export')}
                    </button>
                    <button onClick={handlePrint} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 transition-colors">
                        <Printer className="w-4 h-4 text-blue-600" /> {_t('طباعة', 'Print')}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto w-full print:overflow-visible">
                <table className="w-full text-sm text-start text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900 dark:text-gray-400">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => {
                                    const canSort = header.column.getCanSort();
                                    return (
                                        <th 
                                            key={header.id} 
                                            className={`px-6 py-3 font-semibold ${canSort ? 'cursor-pointer select-none group' : ''}`}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <div className="flex items-center gap-2">
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                                {canSort && (
                                                    <span className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                                                        {{
                                                            asc: <ArrowUp className="w-3 h-3" />,
                                                            desc: <ArrowDown className="w-3 h-3" />
                                                        }[header.column.getIsSorted() as string] ?? <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                                    {_t('لا توجد بيانات', 'No data available')}
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr key={row.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="px-6 py-4">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {table.getPageCount() > 1 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 print:hidden">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {_t('صفحة', 'Page')} <span className="font-bold">{table.getState().pagination.pageIndex + 1}</span> {_t('من', 'of')} <span className="font-bold">{table.getPageCount()}</span>
                    </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:hover:bg-gray-700 dark:text-white"
                        >
                            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                        </button>
                        <button 
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:hover:bg-gray-700 dark:text-white"
                        >
                            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
