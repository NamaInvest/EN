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
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {props.required && <span className="text-red-500 mr-1" aria-hidden="true">*</span>}
      </label>
      <input
        id={name}
        type={type}
        {...register(name, { valueAsNumber: type === 'number' })}
        className={[
          'w-full rounded-md border px-3 py-2 text-sm transition-colors outline-none',
          'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
          'placeholder:text-gray-400 dark:placeholder:text-gray-600',
          'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          error
            ? 'border-red-400 dark:border-red-700 focus:ring-red-300'
            : 'border-gray-300 dark:border-gray-700',
        ].join(' ')}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        {...props}
      />
      {hint && !error && (
        <p id={`${name}-hint`} className="text-xs text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${name}-error`} className="text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1" role="alert">
          <svg className="h-3 w-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
