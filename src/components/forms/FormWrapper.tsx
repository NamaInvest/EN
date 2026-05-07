/**
 * AI-20 — React Hook Form Wrapper with Zod Validation
 * Reusable form component replacing 99+ useState patterns.
 */
'use client';

import { useForm, UseFormReturn, FieldValues, DefaultValues, Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface FormWrapperProps<T extends FieldValues> {
    schema: z.ZodType<T>;
    defaultValues: DefaultValues<T>;
    onSubmit: (data: T) => Promise<void> | void;
    children: (form: UseFormReturn<T>) => React.ReactNode;
    className?: string;
}

/**
 * Generic Form wrapper with Zod validation.
 */
export function FormWrapper<T extends FieldValues>({ schema, defaultValues, onSubmit, children, className }: FormWrapperProps<T>) {
    const form = useForm({
        resolver: zodResolver(schema as any) as any,
        defaultValues: defaultValues as any,
    });

    return (
        <form onSubmit={form.handleSubmit(onSubmit as any)} className={className} noValidate>
            {children(form as any)}
        </form>
    );
}

/**
 * Generic Form Field with bilingual error messages.
 */
interface FormFieldProps<T extends FieldValues> {
    form: UseFormReturn<T>;
    name: Path<T>;
    label: string;
    labelEn?: string;
    type?: string;
    placeholder?: string;
    required?: boolean;
}

export function FormField<T extends FieldValues>({ form, name, label, labelEn, type = 'text', placeholder, required }: FormFieldProps<T>) {
    const error = form.formState.errors[name];

    return (
        <div className="space-y-1">
            <label htmlFor={name} className="block text-sm font-medium">
                {label}
                {labelEn && <span className="text-gray-400 text-xs mr-2">({labelEn})</span>}
                {required && <span className="text-red-500 mr-1">*</span>}
            </label>
            <input
                id={name}
                type={type}
                placeholder={placeholder}
                className={`w-full border rounded-md px-3 py-2 text-sm ${error ? 'border-red-500' : 'border-gray-300'}`}
                aria-invalid={!!error}
                aria-describedby={error ? `${name}-error` : undefined}
                {...form.register(name)}
            />
            {error && (
                <p id={`${name}-error`} className="text-xs text-red-500" role="alert">
                    {error.message as string}
                </p>
            )}
        </div>
    );
}

// === Common Zod Schemas ===
export const customerSchema = z.object({
    name: z.string().min(2, 'اسم العميل مطلوب'),
    taxId: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
    address: z.string().optional(),
});

export const invoiceLineSchema = z.object({
    productId: z.string().min(1, 'المنتج مطلوب'),
    quantity: z.number().min(0.01, 'الكمية يجب أن تكون أكبر من صفر'),
    unitPrice: z.number().min(0, 'السعر يجب أن يكون موجباً'),
    discount: z.number().min(0).max(100).default(0),
    taxRate: z.number().default(15),
});

export const salesInvoiceSchema = z.object({
    customerId: z.string().min(1, 'العميل مطلوب'),
    date: z.string().min(1, 'التاريخ مطلوب'),
    dueDate: z.string().optional(),
    notes: z.string().optional(),
    lines: z.array(invoiceLineSchema).min(1, 'يجب إضافة بند واحد على الأقل'),
});

export type CustomerForm = z.infer<typeof customerSchema>;
export type SalesInvoiceForm = z.infer<typeof salesInvoiceSchema>;
