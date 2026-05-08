import React from 'react';
import { useFormContext } from 'react-hook-form';

interface FormSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    name: string;
    label: string;
    options: { value: string | number; label: string }[];
    className?: string;
}

export function FormSelect({ name, label, options, className = '', ...props }: FormSelectProps) {
    const { register, formState: { errors } } = useFormContext();
    const error = errors[name]?.message as string | undefined;

    return (
        <div className={`space-y-1 ${className}`}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
            </label>
            <select
                id={name}
                {...register(name)}
                className={`w-full rounded-md border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-colors focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none
                    ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? `${name}-error` : undefined}
                {...props}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && (
                <p id={`${name}-error`} className="text-sm text-red-600 font-medium" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
}
