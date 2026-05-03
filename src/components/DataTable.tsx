import React, { useState, useMemo } from 'react';
import { Search, Download, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

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
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const filteredData = useMemo(() => {
        return data.filter(item => 
            columns.some(col => {
                const val = item[col.key];
                return val && String(val).toLowerCase().includes(search.toLowerCase());
            })
        );
    }, [data, search, columns]);

    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(start, start + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    const handleExportCSV = () => {
        const headers = columns.map(c => c.label).join(',');
        const rows = filteredData.map(item => 
            columns.map(c => {
                let val = item[c.key];
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
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
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
                <table className="w-full text-sm text-right text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-900 dark:text-gray-400">
                        <tr>
                            {columns.map((col, i) => (
                                <th key={i} className="px-6 py-3 font-semibold">{col.label}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-8 text-center text-gray-500">
                                    {_t('لا توجد بيانات', 'No data available')}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((item, i) => (
                                <tr key={i} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    {columns.map((col, j) => (
                                        <td key={j} className="px-6 py-4">
                                            {col.render ? col.render(item) : item[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 print:hidden">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        {_t('صفحة', 'Page')} <span className="font-bold">{currentPage}</span> {_t('من', 'of')} <span className="font-bold">{totalPages}</span>
                    </span>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:hover:bg-gray-700 dark:text-white"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-gray-700 dark:hover:bg-gray-700 dark:text-white"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
