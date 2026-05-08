import React from 'react';
import { useFormContext } from 'react-hook-form';

interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  hint?: string;
  type?: string;
  className?: string;
}

export function FormField({ name, label, hint, type = 'text', className = '', ...props }: FormFieldProps) {
  const { register, formState: { errors } } = useFormContext();
  const error = errors[name]?.message as string | undefined;

  return (
    <div className={`space-y-1.5 ${className}`}>
      <label
        htmlFor={name}
        className="block text-sm font-medium"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
        {props.required && <span style={{ color: 'var(--danger)' }} className="mr-1" aria-hidden="true">*</span>}
      </label>
      <input
        id={name}
        type={type}
        {...register(name, { valueAsNumber: type === 'number' })}
        className="input"
        style={{
          borderColor: error ? 'var(--danger)' : undefined,
          boxShadow: error ? '0 0 0 3px rgba(225,29,72,0.1)' : undefined,
        }}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        {...props}
      />
      {hint && !error && (
        <p id={`${name}-hint`} className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--danger)' }} role="alert">
          <svg className="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
