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
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
        {props.required && <span className="text-red-500 mr-1" aria-hidden="true">*</span>}
      </label>
      <textarea
        id={name}
        {...register(name)}
        className={[
          'w-full rounded-md border px-3 py-2 text-sm transition-colors outline-none resize-y min-h-[80px]',
          'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100',
          'placeholder:text-gray-400 dark:placeholder:text-gray-600',
          'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          error
            ? 'border-red-400 dark:border-red-700'
            : 'border-gray-300 dark:border-gray-700',
        ].join(' ')}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${name}-error` : hint ? `${name}-hint` : undefined}
        {...props}
      />
      {hint && !error && (
        <p id={`${name}-hint`} className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      )}
      {error && (
        <p id={`${name}-error`} className="text-xs text-red-600 dark:text-red-400 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
