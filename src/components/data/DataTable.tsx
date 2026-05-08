'use client';

import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { TableSkeleton } from '../states/Skeleton';
import { EmptyState } from '../states/Empty';
import { ChevronUp, ChevronDown, ChevronsUpDown, Download, Search } from 'lucide-react';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageSize?: number;
  loading?: boolean;
  emptyMessage?: string;
  emptyDescription?: string;
  onRowClick?: (row: TData) => void;
  enableExport?: boolean;
  exportFilename?: string;
  searchColumn?: string;
  searchPlaceholder?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 10,
  loading = false,
  emptyMessage = 'لا توجد بيانات',
  emptyDescription,
  onRowClick,
  enableExport = false,
  exportFilename = 'export',
  searchColumn,
  searchPlaceholder = 'بحث...',
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, columnFilters, globalFilter },
    initialState: { pagination: { pageSize } },
  });

  const handleExport = () => {
    const rows = table.getFilteredRowModel().rows;
    const headers = columns
      .filter((c): c is ColumnDef<TData, TValue> & { accessorKey: string } => 'accessorKey' in c)
      .map((c) => c.accessorKey as string);
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        headers.map((h) => `"${(row.getValue(h) as string) ?? ''}"`).join(',')
      ),
    ].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportFilename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <TableSkeleton rows={pageSize} />;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--text-muted)' }} />
          <input
            placeholder={searchPlaceholder}
            value={searchColumn
              ? ((table.getColumn(searchColumn)?.getFilterValue() as string) ?? '')
              : globalFilter
            }
            onChange={(e) =>
              searchColumn
                ? table.getColumn(searchColumn)?.setFilterValue(e.target.value)
                : setGlobalFilter(e.target.value)
            }
            className="input w-full pr-9"
            aria-label={searchPlaceholder}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {table.getFilteredRowModel().rows.length} سجل
          </span>
          {enableExport && (
            <button
              onClick={handleExport}
              className="btn btn-ghost btn-sm flex items-center gap-1.5"
              aria-label="تصدير CSV"
            >
              <Download className="h-3.5 w-3.5" />
              تصدير
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <div className="overflow-x-auto">
          <table className="table" role="grid">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const isSortable = header.column.getCanSort();
                    const sortDir = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        className={isSortable ? 'cursor-pointer select-none' : ''}
                        onClick={header.column.getToggleSortingHandler()}
                        aria-sort={sortDir === 'asc' ? 'ascending' : sortDir === 'desc' ? 'descending' : 'none'}
                      >
                        <div className="flex items-center gap-1">
                          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                          {isSortable && (
                            <span style={{ opacity: 0.5 }} aria-hidden="true">
                              {sortDir === 'asc' ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : sortDir === 'desc' ? (
                                <ChevronDown className="h-3 w-3" />
                              ) : (
                                <ChevronsUpDown className="h-3 w-3" />
                              )}
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
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className={onRowClick ? 'cursor-pointer' : ''}
                    role={onRowClick ? 'button' : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={onRowClick ? (e) => e.key === 'Enter' && onRowClick(row.original) : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length}>
                    <EmptyState title={emptyMessage} description={emptyDescription} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span>
            صفحة{' '}
            <strong style={{ color: 'var(--text)' }}>
              {table.getState().pagination.pageIndex + 1}
            </strong>
            {' '}من{' '}
            <strong style={{ color: 'var(--text)' }}>
              {table.getPageCount()}
            </strong>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="btn btn-ghost btn-sm"
              aria-label="الصفحة السابقة"
            >
              السابق
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="btn btn-ghost btn-sm"
              aria-label="الصفحة التالية"
            >
              التالي
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
