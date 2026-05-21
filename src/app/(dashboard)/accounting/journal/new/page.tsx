'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Plus, Trash2, Save, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Form, FormField } from '@/components/forms';

// 1. Define the Zod Schema for the Journal Entry
const journalLineSchema = z.object({
  accountCode: z.string().min(1, 'رقم الحساب مطلوب'),
  debit: z.number().min(0, 'يجب أن يكون المدين 0 أو أكثر'),
  credit: z.number().min(0, 'يجب أن يكون الدائن 0 أو أكثر'),
  description: z.string().optional(),
}).refine(data => data.debit > 0 || data.credit > 0, {
  message: 'يجب إدخال قيمة في المدين أو الدائن',
  path: ['debit'] // Attach error to debit
}).refine(data => !(data.debit > 0 && data.credit > 0), {
  message: 'لا يمكن إدخال مدين ودائن في نفس السطر',
  path: ['debit']
});

const journalSchema = z.object({
  date: z.string().min(1, 'التاريخ مطلوب'),
  reference: z.string().optional(),
  description: z.string().min(3, 'البيان مطلوب ويجب أن يكون 3 أحرف على الأقل'),
  lines: z.array(journalLineSchema).min(2, 'يجب إدخال سطرين على الأقل للقيد'),
}).refine(data => {
  const totalDebit = data.lines.reduce((sum, line) => sum + (line.debit || 0), 0);
  const totalCredit = data.lines.reduce((sum, line) => sum + (line.credit || 0), 0);
  return Math.abs(totalDebit - totalCredit) < 0.01;
}, {
  message: 'القيد المحاسبي غير متزن (مجموع المدين لا يساوي مجموع الدائن)',
  path: ['lines'] // Display error at the root of lines
});

type JournalFormValues = z.infer<typeof journalSchema>;

// 2. Component for the dynamic lines
function JournalLines() {
  const { control, register, formState: { errors }, watch } = useFormContext<JournalFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'lines'
  });

  const lines = watch('lines');
  const totalDebit = lines?.reduce((sum, line) => sum + (line.debit || 0), 0) || 0;
  const totalCredit = lines?.reduce((sum, line) => sum + (line.credit || 0), 0) || 0;
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  // Global lines error from refine
  const linesError = errors.lines?.root?.message || errors.lines?.message;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">تفاصيل القيد</h3>
        <button
          type="button"
          onClick={() => append({ accountCode: '', debit: 0, credit: 0, description: '' })}
          className="btn btn-secondary flex items-center gap-2"
        >
          <Plus size={16} /> إضافة سطر
        </button>
      </div>

      {linesError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md border border-red-200">
          {linesError}
        </div>
      )}

      <div className="bg-white rounded-md border overflow-hidden">
        <table className="w-full text-right border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-3 font-medium">رقم الحساب</th>
              <th className="p-3 font-medium">البيان</th>
              <th className="p-3 font-medium w-32">مدين</th>
              <th className="p-3 font-medium w-32">دائن</th>
              <th className="p-3 font-medium w-16"></th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field, index) => (
              <tr key={field.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="p-2">
                  <input
                    {...register(`lines.${index}.accountCode`)}
                    className="w-full rounded-md border px-3 py-2"
                    placeholder="مثال: 1110"
                  />
                  {errors.lines?.[index]?.accountCode && (
                    <span className="text-xs text-red-500">{errors.lines[index]?.accountCode?.message}</span>
                  )}
                </td>
                <td className="p-2">
                  <input
                    {...register(`lines.${index}.description`)}
                    className="w-full rounded-md border px-3 py-2"
                    placeholder="بيان السطر"
                  />
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    step="0.01"
                    {...register(`lines.${index}.debit`, { valueAsNumber: true })}
                    className="w-full rounded-md border px-3 py-2 text-left"
                    dir="ltr"
                  />
                   {errors.lines?.[index]?.debit && (
                    <span className="text-xs text-red-500 block">{errors.lines[index]?.debit?.message}</span>
                  )}
                </td>
                <td className="p-2">
                  <input
                    type="number"
                    step="0.01"
                    {...register(`lines.${index}.credit`, { valueAsNumber: true })}
                    className="w-full rounded-md border px-3 py-2 text-left"
                    dir="ltr"
                  />
                </td>
                <td className="p-2 text-center">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-red-500 hover:text-red-700 p-2"
                    disabled={fields.length <= 2}
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 border-t">
            <tr>
              <td colSpan={2} className="p-3 font-bold text-left">الإجمالي</td>
              <td className={`p-3 font-bold text-left font-mono ${!isBalanced && totalDebit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {totalDebit.toLocaleString('en-SA', { minimumFractionDigits: 2 })}
              </td>
              <td className={`p-3 font-bold text-left font-mono ${!isBalanced && totalCredit > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {totalCredit.toLocaleString('en-SA', { minimumFractionDigits: 2 })}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// 3. Main Page Component
export default function NewJournalEntryPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const defaultValues: Partial<JournalFormValues> = {
    date: new Date().toISOString().split('T')[0],
    description: '',
    reference: '',
    lines: [
      { accountCode: '', debit: 0, credit: 0, description: '' },
      { accountCode: '', debit: 0, credit: 0, description: '' },
    ]
  };

  const onSubmit = async (data: JournalFormValues) => {
    setIsSubmitting(true);
    setGlobalError(null);
    try {
      const response = await fetch('/api/accounting/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'حدث خطأ غير متوقع');
      }

      // Success - redirect to journal list
      router.push('/accounting/journal');
    } catch (err: any) {
      setGlobalError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-content" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/accounting/journal" className="text-gray-500 hover:text-gray-900 flex items-center gap-2">
          <ArrowRight size={20} /> العودة
        </Link>
        <h1 className="text-2xl font-bold m-0 text-(--)">إضافة قيد يومية جديد</h1>
      </div>

      {globalError && (
        <div className="bg-red-50 border-r-4 border-red-500 p-4 mb-6 rounded">
          <h3 className="text-red-800 font-bold">فشل الحفظ</h3>
          <p className="text-red-700">{globalError}</p>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <Form schema={journalSchema} defaultValues={defaultValues} onSubmit={onSubmit} className="space-y-8">
          
          {/* Header Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50 p-4 rounded-md border">
            <FormField 
              name="date" 
              label="تاريخ القيد" 
              type="date" 
            />
            <FormField 
              name="reference" 
              label="المرجع (رقم مستند خارجي)" 
              placeholder="مثال: INV-2023-001" 
            />
            <div className="md:col-span-3">
              <FormField 
                name="description" 
                label="بيان القيد العام" 
                placeholder="اكتب وصفاً مختصراً لسبب القيد المحاسبي..." 
              />
            </div>
          </div>

          {/* Lines */}
          <JournalLines />

          {/* Submit */}
          <div className="flex justify-end pt-4 border-t">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn btn-primary flex items-center gap-2 px-8 py-3 text-lg"
            >
              <Save size={20} /> {isSubmitting ? 'جاري الحفظ...' : 'حفظ القيد المحاسبي'}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
