'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const formSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    warehouseId: z.string().min(1, 'Warehouse ID is required'),
    qty: z.number().min(1, 'Quantity must be at least 1'),
    requestedDate: z.string().min(1, 'Requested Date is required')
});

type FormValues = z.infer<typeof formSchema>;

export default function ATPSimulatorPage() {
    const { t } = useTranslation();
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            productId: 'PROD-1001',
            warehouseId: 'WH-MAIN',
            qty: 200,
            requestedDate: new Date().toISOString().split('T')[0]
        }
    });

    async function onSubmit(data: FormValues) {
        setLoading(true);
        try {
            const res = await fetch('/api/sales/atp/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (res.ok) {
                const resData = await res.json();
                setResult(resData.result);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-6 space-y-6" dir="rtl">
            <h1 className="text-2xl font-bold">{t('sales.atp_title')}</h1>
            <p className="text-gray-500 text-sm">أداة المبيعات للتحقق الفوري من إمكانية تلبية طلبات العملاء بناءً على المخزون والمشتريات والإنتاج.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>بيانات الطلب</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <label className="block text-sm mb-1">رمز المنتج</label>
                                <Input className={errors.productId ? 'border-red-500' : ''} {...register('productId')} />
                                {errors.productId && <span className="text-red-500 text-xs mt-1 block">{errors.productId.message}</span>}
                            </div>
                            <div>
                                <label className="block text-sm mb-1">المستودع</label>
                                <Input className={errors.warehouseId ? 'border-red-500' : ''} {...register('warehouseId')} />
                                {errors.warehouseId && <span className="text-red-500 text-xs mt-1 block">{errors.warehouseId.message}</span>}
                            </div>
                            <div>
                                <label className="block text-sm mb-1">الكمية المطلوبة</label>
                                <Input type="number" className={errors.qty ? 'border-red-500' : ''} {...register('qty', { valueAsNumber: true })} />
                                {errors.qty && <span className="text-red-500 text-xs mt-1 block">{errors.qty.message}</span>}
                            </div>
                            <div>
                                <label className="block text-sm mb-1">تاريخ التسليم المطلوب</label>
                                <Input type="date" className={errors.requestedDate ? 'border-red-500' : ''} {...register('requestedDate')} />
                                {errors.requestedDate && <span className="text-red-500 text-xs mt-1 block">{errors.requestedDate.message}</span>}
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'جاري الفحص...' : 'فحص توفر الكمية (Check ATP)'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>نتيجة الفحص (ATP Result)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!result ? (
                            <div className="text-center p-12 text-gray-500 bg-gray-50 rounded-lg">
                                أدخل بيانات الطلب واضغط على "فحص توفر الكمية" لمعرفة النتيجة.
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className={`p-4 rounded-lg border flex items-center justify-between ${result.canPromise ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <div>
                                        <h2 className={`text-xl font-bold ${result.canPromise ? 'text-green-800' : 'text-red-800'}`}>
                                            {result.canPromise ? 'الكمية متوفرة! يمكن الالتزام.' : 'الكمية غير متوفرة بالكامل!'}
                                        </h2>
                                        <p className={`text-sm ${result.canPromise ? 'text-green-600' : 'text-red-600'}`}>
                                            الكمية المتاحة كلياً: {result.availableQty} / المطلوبة: {result.requestedQty}
                                        </p>
                                    </div>
                                    {!result.canPromise && result.suggestedDate && (
                                        <div className="text-left">
                                            <p className="text-xs text-red-600 mb-1">أقرب تاريخ مقترح للتسليم:</p>
                                            <p className="font-bold text-red-800" dir="ltr">{new Date(result.suggestedDate).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h3 className="font-bold mb-3">تفاصيل التوفر الزمني (Breakdown)</h3>
                                    <div className="overflow-x-auto border rounded-lg">
                                        <table className="w-full text-sm text-right">
                                            <thead className="bg-gray-50 text-gray-700">
                                                <tr>
                                                    <th className="px-4 py-2 border-b">التاريخ</th>
                                                    <th className="px-4 py-2 border-b">المصدر</th>
                                                    <th className="px-4 py-2 border-b">الكمية الواردة</th>
                                                    <th className="px-4 py-2 border-b">التراكمي (متاح)</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {result.breakdown.map((row: any, idx: number) => (
                                                    <tr key={idx} className="hover:bg-gray-50">
                                                        <td className="px-4 py-2 border-b text-gray-600" dir="ltr">{new Date(row.date).toLocaleDateString()}</td>
                                                        <td className="px-4 py-2 border-b font-medium">{row.source}</td>
                                                        <td className="px-4 py-2 border-b text-blue-600 font-mono" dir="ltr">+{row.qty}</td>
                                                        <td className="px-4 py-2 border-b font-bold font-mono" dir="ltr">{row.cumulative}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {!result.canPromise && (
                                    <div className="flex gap-2 justify-end mt-4">
                                        <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50">إنشاء طلب شراء طارئ (PR)</Button>
                                        <Button variant="outline">تقسيم الشحنة (Split)</Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
