'use client';

import React, { useState, useEffect, useMemo } from 'react';

/**
 * DimensionPicker — Reusable dropdown for selecting Universal Journal dimensions.
 * Supports: profitCenter, segment, costCenter (extendable).
 *
 * Usage:
 *   <DimensionPicker dimension="profitCenter" value={profitCenterId} onChange={setProfitCenterId} />
 */

interface DimensionItem {
  id: number;
  code: string;
  name: string;
}

interface DimensionPickerProps {
  dimension: 'profitCenter' | 'segment' | 'costCenter';
  value: number | null | undefined;
  onChange: (id: number | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

const DIM_CONFIG = {
  profitCenter: { endpoint: '/api/accounting/profit-centers', label: 'مركز الربحية', placeholder: 'اختر مركز ربحية...' },
  segment: { endpoint: '/api/accounting/segments', label: 'القطاع', placeholder: 'اختر قطاع...' },
  costCenter: { endpoint: '/api/cost-centers', label: 'مركز التكلفة', placeholder: 'اختر مركز تكلفة...' },
};

export default function DimensionPicker({
  dimension,
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
  style,
}: DimensionPickerProps) {
  const [items, setItems] = useState<DimensionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const config = DIM_CONFIG[dimension];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(config.endpoint);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setItems(Array.isArray(data) ? data : []);
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [dimension]);

  const displayLabel = label || config.label;
  const displayPlaceholder = placeholder || config.placeholder;

  return (
    <div style={{ ...style }}>
      {displayLabel && (
        <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          {displayLabel}
        </label>
      )}
      <select
        className="input"
        value={value || ''}
        onChange={e => onChange(e.target.value ? parseInt(e.target.value, 10) : null)}
        disabled={disabled || loading}
        style={{ width: '100%' }}
      >
        <option value="">{loading ? 'جاري التحميل...' : displayPlaceholder}</option>
        {items
          .filter((i: any) => i.isActive !== false)
          .map(item => (
            <option key={item.id} value={item.id}>
              {item.code} — {item.name}
            </option>
          ))}
      </select>
    </div>
  );
}
