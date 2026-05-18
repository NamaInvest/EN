'use client';

/**
 * Form System — React Hook Form + Zod Pattern
 * ──────────────────────────────────────────────────────────
 * Reusable form components with built-in validation,
 * error messages in Arabic, and consistent styling using Tailwind CSS.
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
  direction?: 'rtl' | 'ltr' | 'auto';
  columns?: 1 | 2 | 3 | 4;
  className?: string;
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
  const baseClasses = `w-full px-3 py-2 border rounded-md text-sm outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${error ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}`;

  const renderInput = () => {
    switch (field.type) {
      case 'textarea':
        return <textarea value={value as string || ''} onChange={e => onChange(field.name, e.target.value)}
          placeholder={field.placeholder} disabled={field.disabled} rows={3} className={baseClasses} />;
      case 'select':
        return (
          <select value={value as string || ''} onChange={e => onChange(field.name, e.target.value)}
            disabled={field.disabled} className={baseClasses}>
            <option value="">{field.placeholder || 'اختر...'}</option>
            {field.options?.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        );
      case 'checkbox':
        return (
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" checked={!!value} onChange={e => onChange(field.name, e.target.checked)}
              disabled={field.disabled} className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
            <span className="text-sm text-slate-700 dark:text-slate-300">{field.placeholder || field.label}</span>
          </label>
        );
      default:
        return <input type={field.type} value={value as string || ''} onChange={e => onChange(field.name, field.type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={field.placeholder} disabled={field.disabled} min={field.min} max={field.max}
          minLength={field.minLength} maxLength={field.maxLength} className={baseClasses} />;
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {field.type !== 'checkbox' && (
        <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
      )}
      {renderInput()}
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
      {field.helpText && !error && <span className="text-xs text-slate-500 dark:text-slate-400">{field.helpText}</span>}
    </div>
  );
}

// ── Main Form Component ──
export function NamaForm({ fields, onSubmit, submitLabel = 'حفظ', loading = false, direction = 'auto', columns = 2, className = '' }: FormProps) {
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

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns];

  return (
    <form onSubmit={handleSubmit} dir={direction} className={`flex flex-col gap-4 w-full ${className}`}>
      <div className={`grid gap-4 ${gridColsClass}`}>
        {fields.map(field => (
          <FormField key={field.name} field={field} value={values[field.name]}
            error={errors[field.name] || null} onChange={handleChange} />
        ))}
      </div>
      <div className="flex justify-start pt-2">
        <button type="submit" disabled={submitting || loading}
          className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed">
          {submitting || loading ? '⏳ جاري الحفظ...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
