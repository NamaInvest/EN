'use client';
import React, { useState, useEffect } from 'react';
import { Settings, Plus, Layers } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useToast } from '@/components/Toast';
import { DataTable } from '@/components/data/DataTable';
import { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';
import { FormWrapper, FormField } from '@/components/forms/FormWrapper';
import { Button } from '@/components/ui/button';

// --- Zod Schema ---
const workCenterSchema = z.object({
  name: z.string().min(2, 'اسم المركز مطلوب ويجب أن يكون حرفين على الأقل'),
  code: z.string().min(1, 'الكود مطلوب'),
  costPerHour: z.coerce.number().min(0, 'يجب أن تكون التكلفة موجبة'),
  capacity: z.coerce.number().min(0.1, 'السعة يجب أن تكون 0.1 على الأقل'),
});

type WorkCenterFormValues = z.infer<typeof workCenterSchema>;

// --- Table Type ---
export type WorkCenterDTO = {
  id: number;
  name: string;
  code: string;
  costPerHour: number;
  capacity: number;
  isActive: boolean;
};

export default function WorkCentersPage() {
  const { lang } = useTranslation();
  const { success, error } = useToast();
  
  const [centers, setCenters] = useState<WorkCenterDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchCenters(); }, []);

  const fetchCenters = async () => {
    try {
      const res = await fetch('/api/manufacturing/work-centers');
      if (res.ok) {
        const data = await res.json();
        setCenters(data);
      }
    } catch (err) {
      error('حدث خطأ أثناء جلب مراكز العمل');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: WorkCenterFormValues) => {
    try {
      const res = await fetch('/api/manufacturing/work-centers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        success('تم حفظ مركز العمل بنجاح');
        setShowForm(false);
        fetchCenters();
      } else {
        error('فشل حفظ مركز العمل');
      }
    } catch (err) {
      error('حدث خطأ غير متوقع');
    }
  };

  const columns: ColumnDef<WorkCenterDTO>[] = [
    {
      accessorKey: 'name',
      header: 'اسم المركز',
      cell: ({ row }) => (
        <div className="font-medium text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          {row.original.name}
        </div>
      ),
    },
    {
      accessorKey: 'code',
      header: 'الكود',
      cell: ({ row }) => <span className="text-slate-600">{row.original.code}</span>,
    },
    {
      accessorKey: 'costPerHour',
      header: 'تكلفة الساعة',
      cell: ({ row }) => <span className="text-indigo-600 font-bold">{row.original.costPerHour} SAR</span>,
    },
    {
      accessorKey: 'capacity',
      header: 'السعة',
      cell: ({ row }) => <span>{row.original.capacity}</span>,
    },
    {
      accessorKey: 'isActive',
      header: 'الحالة',
      cell: ({ row }) => (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">نشط</span>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Settings className="w-6 h-6 text-indigo-600" />
          مراكز العمل والمسارات (Work Centers)
        </h1>
        <Button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-5 h-5 mr-2" /> إضافة مركز عمل
        </Button>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded shadow border border-gray-100">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">مركز عمل جديد</h2>
          <FormWrapper<WorkCenterFormValues>
            schema={workCenterSchema}
            defaultValues={{ name: '', code: '', costPerHour: 0, capacity: 1 }}
            onSubmit={onSubmit}
          >
            {(form) => (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField form={form} name="name" label="اسم المركز" placeholder="مثال: محطة التجميع" required />
                  <FormField form={form} name="code" label="الكود" placeholder="مثال: WC-01" required />
                  <FormField form={form} name="costPerHour" label="تكلفة التشغيل للساعة (ريال)" type="number" required />
                  <FormField form={form} name="capacity" label="السعة (Capacity)" type="number" required />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'جاري الحفظ...' : 'حفظ المركز'}
                  </Button>
                </div>
              </div>
            )}
          </FormWrapper>
        </div>
      )}

      <DataTable 
        columns={columns} 
        data={centers} 
        loading={loading}
        pageSize={10}
        emptyMessage="لا توجد مراكز عمل"
      />
    </div>
  );
}
