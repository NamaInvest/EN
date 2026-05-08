import React from 'react';
import { useFormContext } from 'react-hook-form';

interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
  label: string;
  hint?: string;
  className?: string;
}

export function FormTextarea({ name, label, hint, className = '', ...props }: FormTextareaProps) {
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
      <textarea
        id={name}
        {...register(name)}
        className="input resize-y"
        style={{
          minHeight: '80px',
          borderColor: error ? 'var(--danger)' : undefined,
        }}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        {...props}
      />
      {hint && !error && (
        <p id={`${name}-hint`} className="text-xs" style={{ color: 'var(--text-muted)' }}>{hint}</p>
      )}
      {error && (
        <p id={`${name}-error`} className="text-xs font-medium" style={{ color: 'var(--danger)' }} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
