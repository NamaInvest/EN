'use client';

/**
 * DataTable v2 — TanStack-inspired
 * ──────────────────────────────────────────────────────────
 * Unified data table with sorting, filtering, pagination,
 * column visibility, and row selection.
 */

import React, { useState, useMemo, useCallback } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  hidden?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchable?: boolean;
  selectable?: boolean;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selected: T[]) => void;
  loading?: boolean;
  emptyMessage?: string;
  stickyHeader?: boolean;
}

type SortDir = 'asc' | 'desc' | null;

export function DataTable<T extends Record<string, any>>({
  data, columns, pageSize = 20, searchable = true, selectable = false,
  onRowClick, onSelectionChange, loading = false, emptyMessage = 'لا توجد بيانات',
  stickyHeader = true,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(new Set(columns.filter(c => c.hidden).map(c => c.key)));

  const visibleColumns = useMemo(() => columns.filter(c => !hiddenCols.has(c.key)), [columns, hiddenCols]);

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      visibleColumns.some(col => {
        const val = col.accessor(row);
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, visibleColumns]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    const col = columns.find(c => c.key === sortKey);
    if (!col) return filtered;
    return [...filtered].sort((a, b) => {
      const va = String(col.accessor(a) || '');
      const vb = String(col.accessor(b) || '');
      const numA = parseFloat(va), numB = parseFloat(vb);
      if (!isNaN(numA) && !isNaN(numB)) return sortDir === 'asc' ? numA - numB : numB - numA;
      return sortDir === 'asc' ? va.localeCompare(vb, 'ar') : vb.localeCompare(va, 'ar');
    });
  }, [filtered, sortKey, sortDir, columns]);

  // Paginate
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paged = useMemo(() => sorted.slice(page * pageSize, (page + 1) * pageSize), [sorted, page, pageSize]);

  const handleSort = useCallback((key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }, [sortKey]);

  const toggleSelect = useCallback((idx: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      onSelectionChange?.(sorted.filter((_, i) => next.has(i)));
      return next;
    });
  }, [sorted, onSelectionChange]);

  const toggleAll = useCallback(() => {
    if (selected.size === paged.length) { setSelected(new Set()); onSelectionChange?.([]); }
    else { const all = new Set(paged.map((_, i) => page * pageSize + i)); setSelected(all); onSelectionChange?.(paged); }
  }, [paged, selected, page, pageSize, onSelectionChange]);

  const sortIcon = (key: string) => {
    if (sortKey !== key) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : sortDir === 'desc' ? ' ↓' : ' ↕';
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary, #6b7280)' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #e5e7eb', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
        جاري التحميل...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ border: '1px solid var(--border-color, #e5e7eb)', borderRadius: 'var(--border-radius, 8px)', overflow: 'hidden', background: 'var(--bg-white dark:bg-slate-900, #fff)' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', borderBottom: '1px solid var(--border-color, #e5e7eb)', alignItems: 'center', flexWrap: 'wrap' }}>
        {searchable && (
          <input
            type="search" placeholder="🔍 بحث..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }}
            style={{ flex: 1, minWidth: '200px', padding: '0.5rem 0.75rem', border: '1px solid var(--border-color, #e5e7eb)', borderRadius: '6px', fontSize: '0.875rem', outline: 'none' }}
          />
        )}
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #6b7280)' }}>
          {sorted.length} نتيجة
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-secondary, #f9fafb)', position: stickyHeader ? 'sticky' : undefined, top: 0, zIndex: 1 }}>
              {selectable && (
                <th style={{ padding: '0.6rem 0.75rem', width: '40px', textAlign: 'center' }}>
                  <input type="checkbox" checked={selected.size === paged.length && paged.length > 0} onChange={toggleAll} />
                </th>
              )}
              {visibleColumns.map(col => (
                <th key={col.key} onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={{
                    padding: '0.6rem 0.75rem', textAlign: col.align || 'right', fontWeight: 600,
                    cursor: col.sortable !== false ? 'pointer' : 'default', userSelect: 'none',
                    color: 'var(--text-primary, #111827)', borderBottom: '2px solid var(--border-color, #e5e7eb)',
                    width: col.width, whiteSpace: 'nowrap',
                  }}>
                  {col.header}{col.sortable !== false && sortIcon(col.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr><td colSpan={visibleColumns.length + (selectable ? 1 : 0)} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary, #6b7280)' }}>{emptyMessage}</td></tr>
            ) : paged.map((row, i) => {
              const globalIdx = page * pageSize + i;
              return (
                <tr key={globalIdx} onClick={() => onRowClick?.(row)}
                  style={{ borderBottom: '1px solid var(--border-color, #e5e7eb)', cursor: onRowClick ? 'pointer' : 'default', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover, #f3f4f6)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  {selectable && (
                    <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }} onClick={e => { e.stopPropagation(); toggleSelect(globalIdx); }}>
                      <input type="checkbox" checked={selected.has(globalIdx)} readOnly />
                    </td>
                  )}
                  {visibleColumns.map(col => (
                    <td key={col.key} style={{ padding: '0.5rem 0.75rem', textAlign: col.align || 'right', color: 'var(--text-primary, #111827)' }}>
                      {col.accessor(row)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', borderTop: '1px solid var(--border-color, #e5e7eb)', fontSize: '0.8rem', color: 'var(--text-secondary, #6b7280)' }}>
          <span>صفحة {page + 1} من {totalPages}</span>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button onClick={() => setPage(0)} disabled={page === 0} style={paginationBtnStyle}>⏮</button>
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} style={paginationBtnStyle}>◀</button>
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={paginationBtnStyle}>▶</button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} style={paginationBtnStyle}>⏭</button>
          </div>
        </div>
      )}
    </div>
  );
}

const paginationBtnStyle: React.CSSProperties = {
  padding: '0.25rem 0.5rem', border: '1px solid var(--border-color, #e5e7eb)',
  borderRadius: '4px', background: 'var(--bg-primary, #fff)', cursor: 'pointer', fontSize: '0.75rem',
};
