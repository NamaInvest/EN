'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useTranslation } from "@/lib/i18n";

export function CashForecastClient() {
  const { t } = useTranslation();
  const _t = t as any;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [forecasts, setForecasts] = useState<any[]>([]);

  const fetchForecasts = async () => {
    setLoading(true);
    setError(null);
    try {
      const tenantId = typeof window !== 'undefined' ? localStorage.getItem('nama_tenant_id') || 'default' : 'default';
      const res = await fetch(`/api/treasury/cash-forecast`, {
        headers: {
          'x-tenant-id': tenantId
        }
      });
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          throw new Error('Permission denied');
        }
        throw new Error('فشل في جلب البيانات');
      }
      const data = await res.json();
      setForecasts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecasts();
  }, []);

  // Compute Dashboard Metrics
  const totalInflows = forecasts.filter(f => f.category === 'AR_INFLOW').reduce((sum, f) => sum + Number(f.expectedAmount), 0);
  const totalOutflows = forecasts.filter(f => f.category !== 'AR_INFLOW').reduce((sum, f) => sum + Number(f.expectedAmount), 0);
  const netLiquidity = totalInflows - totalOutflows;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{_t('توقعات السيولة النقدية (نقد التوقع)', 'توقعات السيولة النقدية (Cash Forecast)')}</h1>
        <div className="space-x-2 space-x-reverse">
          <Button variant="outline" onClick={fetchForecasts} disabled={loading}>
            {loading ? 'جاري التحديث...' : 'تحديث'}
          </Button>
          <Button variant="default">توليد التوقعات</Button>
        </div>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400 font-medium">خطأ: {error}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">التدفقات الداخلة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{totalInflows.toLocaleString()} ر.س</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">التدفقات الخارجة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{totalOutflows.toLocaleString()} ر.س</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">صافي السيولة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netLiquidity < 0 ? 'text-red-600' : 'text-blue-600'}`}>
                  {netLiquidity.toLocaleString()} ر.س
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">تنبيهات المخاطر</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {netLiquidity < 0 ? 'عجز متوقع' : 'سيولة آمنة'}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>تفاصيل التوقعات (Forecast Lines)</CardTitle>
              <CardDescription>جدول تفصيلي لحركات السيولة المتوقعة</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 text-center text-slate-500">جاري تحميل البيانات...</div>
              ) : forecasts.length === 0 ? (
                <div className="py-10 text-center text-slate-500">لا توجد بيانات متاحة لعرضها.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>رقم الأسبوع</TableHead>
                      <TableHead>النوع (المصدر)</TableHead>
                      <TableHead>المبلغ المتوقع</TableHead>
                      <TableHead>الملاحظات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecasts.map((f, i) => (
                      <TableRow key={f.id || i}>
                        <TableCell>{new Date(f.forecastDate).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell>الأسبوع {f.weekNumber}</TableCell>
                        <TableCell>
                          <Badge variant={f.category === 'AR_INFLOW' ? 'default' : 'destructive'}>
                            {f.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {Number(f.expectedAmount).toLocaleString()}
                        </TableCell>
                        <TableCell>{f.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
