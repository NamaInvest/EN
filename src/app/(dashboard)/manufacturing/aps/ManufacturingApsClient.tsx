'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Loader2, AlertCircle, PlayCircle, Clock, Calendar, CheckCircle2, Factory } from 'lucide-react';

export default function ManufacturingApsClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/manufacturing/aps?action=dashboard');
      if (!res.ok) {
         if (res.status === 403) throw new Error('لا تملك الصلاحية للوصول إلى الجدولة (Permission Denied).');
         throw new Error(`Failed to fetch APS dashboard (${res.status})`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] w-full flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">جاري تحميل بيانات الجدولة...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[400px] w-full flex-col items-center justify-center space-y-4 rounded-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h3 className="text-lg font-semibold">تعذر تحميل بيانات الجدولة</h3>
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={fetchDashboard}>
          إعادة المحاولة
        </Button>
      </div>
    );
  }

  const { stats, recentOperations, recentRuns } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Advanced Planning & Scheduling (APS)</h2>
          <p className="text-muted-foreground">عرض وجدولة عمليات التصنيع المتقدمة (نسخة للعرض فقط)</p>
        </div>
        <div className="flex space-x-2 rtl:space-x-reverse">
          <Button disabled variant="default">
            <PlayCircle className="mr-2 h-4 w-4 rtl:ml-2 rtl:mr-0" />
            Run Schedule
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الأوامر المفتوحة</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openOrdersCount || 0}</div>
            <p className="text-xs text-muted-foreground">أوامر تصنيع قيد الانتظار أو التنفيذ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">مراكز العمل</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.workCentersCount || 0}</div>
            <p className="text-xs text-muted-foreground">مراكز عمل نشطة في المصنع</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">العمليات المجدولة</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.scheduledOpsCount || 0}</div>
            <p className="text-xs text-muted-foreground">عملية بانتظار التنفيذ</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">حالة التعارضات</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.conflictsCount || 0}</div>
            <p className="text-xs text-muted-foreground">تعارضات مجدولة حالية</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>العمليات المجدولة (Scheduled Operations)</CardTitle>
            <CardDescription>آخر العمليات التي تم جدولتها على مراكز العمل</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] w-full overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>العملية / الأمر</TableHead>
                    <TableHead>البداية المخططة</TableHead>
                    <TableHead>النهاية المخططة</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentOperations?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        لا توجد عمليات مجدولة حالياً.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentOperations?.map((op: any) => (
                      <TableRow key={op.id}>
                        <TableCell>
                          <div className="font-medium">أمر #{op.manufacturingOrderId}</div>
                          <div className="text-xs text-muted-foreground">مركز #{op.workCenterId} (عملية #{op.operationId})</div>
                        </TableCell>
                        <TableCell className="text-sm">{new Date(op.plannedStart).toLocaleString('ar-SA')}</TableCell>
                        <TableCell className="text-sm">{new Date(op.plannedEnd).toLocaleString('ar-SA')}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{op.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>سجل التشغيل (Schedule Runs)</CardTitle>
            <CardDescription>آخر عمليات الجدولة المجمعة التي تمت</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] overflow-auto pr-4">
              <div className="space-y-4">
                {recentRuns?.length === 0 ? (
                  <div className="text-center text-sm text-muted-foreground py-8">
                    لم يتم تشغيل محرك الجدولة بعد.
                  </div>
                ) : (
                  recentRuns?.map((run: any) => (
                    <div key={run.id} className="flex items-start space-x-4 space-x-reverse rounded-lg border p-3">
                      <div className="mt-1 bg-primary/10 p-2 rounded-full">
                        {run.status === 'COMPLETED' ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <PlayCircle className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">Run #{run.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(run.runDate).toLocaleString('ar-SA')}
                        </p>
                      </div>
                      <div className="text-xs font-medium">
                        <Badge variant={run.status === 'COMPLETED' ? 'default' : 'secondary'}>{run.status}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
