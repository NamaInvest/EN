import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

interface FormProps<T extends z.ZodType<any, any>> {
    schema: T;
    defaultValues?: any;
    onSubmit: (data: z.infer<T>) => Promise<void> | void;
    children: React.ReactNode;
    className?: string;
}

export function Form<T extends z.ZodType<any, any>>({ schema, defaultValues, onSubmit, children, className = "space-y-4" }: FormProps<T>) {
    const methods = useForm({
        resolver: zodResolver(schema),
        defaultValues: defaultValues,
    });

    return (
        <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit as any)} className={className}>
                {children}
            </form>
        </FormProvider>
    );
}
