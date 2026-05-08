'use client';

/**
 * Form System — React Hook Form + Zod Pattern
 * ──────────────────────────────────────────────────────────
 * Reusable form components with built-in validation,
 * error messages in Arabic, and consistent styling.
 */

import React, { useState, useCallback } from 'react';

// ── Types ──
interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'tel' | 'password' | 'date' | 'textarea' | 'select' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  options?: { value: string; label: string }[];
  defaultValue?: string | number | boolean;
  disabled?: boolean;
  helpText?: string;
}

interface FormProps {
  fields: FieldConfig[];
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  submitLabel?: string;
  loading?: boolean;
  direction?: 'rtl' | 'ltr';
  columns?: 1 | 2 | 3;
}

// ── Arabic Error Messages ──
const ERRORS = {
  required: (label: string) => `${label} مطلوب`,
  minLength: (label: string, min: number) => `${label} يجب أن يكون ${min} أحرف على الأقل`,
  maxLength: (label: string, max: number) => `${label} يجب أن لا يتجاوز ${max} حرف`,
  min: (label: string, min: number) => `${label} يجب أن يكون ${min} على الأقل`,
  max: (label: string, max: number) => `${label} يجب أن لا يتجاوز ${max}`,
  pattern: (label: string) => `${label} غير صالح`,
  email: (label: string) => `${label} يجب أن يكون بريد إلكتروني صالح`,
};

function validate(field: FieldConfig, value: unknown): string | null {
  const val = value as string;
  if (field.required && (!val || val.toString().trim() === '')) return ERRORS.required(field.label);
  if (val && field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return ERRORS.email(field.label);
  if (val && field.minLength && val.length < field.minLength) return ERRORS.minLength(field.label, field.minLength);
  if (val && field.maxLength && val.length > field.maxLength) return ERRORS.maxLength(field.label, field.maxLength);
  if (val && field.min != null && Number(val) < field.min) return ERRORS.min(field.label, field.min);
  if (val && field.max != null && Number(val) > field.max) return ERRORS.max(field.label, field.max);
  if (val && field.pattern && !field.pattern.test(val)) return ERRORS.pattern(field.label);
  return null;
}

// ── Form Field Component ──
function FormField({ field, value, error, onChange }: {
  field: FieldConfig; value: unknown; error: string | null;
  onChange: (name: string, value: unknown) => void;
}) {
  const baseStyle: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.75rem', border: `1px solid ${error ? '#ef4444' : 'var(--border-color, #e5e7eb)'}`,
    borderRadius: '6px', fontSize: '0.875rem', outline: 'none', background: 'var(--bg-primary, #fff)',
    color: 'var(--text-primary, #111827)', transition: 'border-color 0.2s',
  };

  const renderInput = () => {
    switch (field.type) {
      case 'textarea':
        return <textarea value={value as string || ''} onChange={e => onChange(field.name, e.target.value)}
          placeholder={field.placeholder} disabled={field.disabled} rows={3} style={baseStyle} />;
      case 'select':
        return (
          <select value={value as string || ''} onChange={e => onChange(field.name, e.target.value)}
            disabled={field.disabled} style={baseStyle}>
            <option value="">{field.placeholder || 'اختر...'}</option>
            {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        );
      case 'checkbox':
        return (
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!value} onChange={e => onChange(field.name, e.target.checked)}
              disabled={field.disabled} style={{ width: '18px', height: '18px' }} />
            <span style={{ fontSize: '0.875rem' }}>{field.placeholder}</span>
          </label>
        );
      default:
        return <input type={field.type} value={value as string || ''} onChange={e => onChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={field.placeholder} disabled={field.disabled} min={field.min} max={field.max}
          minLength={field.minLength} maxLength={field.maxLength} style={baseStyle} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
      {field.type !== 'checkbox' && (
        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary, #111827)' }}>
          {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
        </label>
      )}
      {renderInput()}
      {error && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{error}</span>}
      {field.helpText && !error && <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary, #9ca3af)' }}>{field.helpText}</span>}
    </div>
  );
}

// ── Main Form Component ──
export function NamaForm({ fields, onSubmit, submitLabel = 'حفظ', loading = false, direction = 'rtl', columns = 2 }: FormProps) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const defaults: Record<string, unknown> = {};
    fields.forEach(f => { if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue; });
    return defaults;
  });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((name: string, value: unknown) => {
    setValues(v => ({ ...v, [name]: value }));
    setErrors(e => ({ ...e, [name]: null }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string | null> = {};
    let hasError = false;
    fields.forEach(f => {
      const err = validate(f, values[f.name]);
      if (err) { newErrors[f.name] = err; hasError = true; }
    });
    setErrors(newErrors);
    if (hasError) return;

    setSubmitting(true);
    try { await onSubmit(values); }
    finally { setSubmitting(false); }
  }, [fields, values, onSubmit]);

  return (
    <form onSubmit={handleSubmit} dir={direction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: '1rem' }}>
        {fields.map(field => (
          <FormField key={field.name} field={field} value={values[field.name]}
            error={errors[field.name] || null} onChange={handleChange} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '0.5rem' }}>
        <button type="submit" disabled={submitting || loading}
          style={{
            padding: '0.6rem 2rem', background: submitting ? '#9ca3af' : '#6366f1', color: '#fff',
            border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s', opacity: submitting ? 0.7 : 1,
          }}>
          {submitting ? '⏳ جاري الحفظ...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
