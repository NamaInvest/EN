'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function PosAccountantClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pos/accountant`);
      if (!res.ok) {
        if (res.status === 403 || res.status === 401) {
          throw new Error('Permission denied');
        }
        throw new Error('فشل في جلب البيانات');
      }
      const data = await res.json();
      setSessions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Compute Dashboard Metrics
  const today = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter(s => s.openedAt && s.openedAt.startsWith(today));
  
  const totalSalesToday = todaySessions.reduce((sum, s) => sum + Number(s.expectedClosing || 0) - Number(s.openingFloat || 0), 0);
  const totalCashToday = todaySessions.reduce((sum, s) => sum + Number(s.closingFloat || 0), 0);
  const totalNetworkToday = 0; // Not explicitly tracked in this model layer, default 0
  const cashDiscrepancy = todaySessions.reduce((sum, s) => sum + Number(s.variance || 0), 0);
  
  const openSessionsCount = sessions.filter(s => s.status === 'OPEN').length;
  const closedSessionsCount = sessions.filter(s => s.status === 'CLOSED').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">محاسبة نقاط البيع (POS Accountant)</h1>
        <div className="space-x-2 space-x-reverse">
          <Button variant="outline" onClick={fetchSessions} disabled={loading}>
            {loading ? 'جاري التحديث...' : 'تحديث'}
          </Button>
          <Button variant="default" disabled>تصدير التقرير</Button>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">مبيعات اليوم</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSalesToday.toLocaleString()} ر.س</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">إجمالي النقد</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{totalCashToday.toLocaleString()} ر.س</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الشبكة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{totalNetworkToday.toLocaleString()} ر.س</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">الفروقات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${cashDiscrepancy < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                  {cashDiscrepancy.toLocaleString()} ر.س
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">جلسات مفتوحة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{openSessionsCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">جلسات مغلقة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-600">{closedSessionsCount}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>جلسات نقاط البيع (POS Sessions)</CardTitle>
              <CardDescription>عرض حالة ومطابقة جلسات نقاط البيع</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 text-center text-slate-500">جاري تحميل البيانات...</div>
              ) : sessions.length === 0 ? (
                <div className="py-10 text-center text-slate-500">لا توجد بيانات متاحة لعرضها.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>رقم الجلسة</TableHead>
                      <TableHead>الكاشير</TableHead>
                      <TableHead>الفرع</TableHead>
                      <TableHead>وقت الفتح</TableHead>
                      <TableHead>وقت الإغلاق</TableHead>
                      <TableHead>النقد المتوقع</TableHead>
                      <TableHead>النقد المصرّح</TableHead>
                      <TableHead>الفرق</TableHead>
                      <TableHead>الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((s, i) => (
                      <TableRow key={s.id || i}>
                        <TableCell>#{s.id}</TableCell>
                        <TableCell>{s.user?.name || `المستخدم ${s.userId}`}</TableCell>
                        <TableCell>{s.branchId ? `فرع ${s.branchId}` : '-'}</TableCell>
                        <TableCell>{new Date(s.openedAt).toLocaleString('ar-SA')}</TableCell>
                        <TableCell>{s.closedAt ? new Date(s.closedAt).toLocaleString('ar-SA') : '-'}</TableCell>
                        <TableCell>{Number(s.expectedClosing || 0).toLocaleString()} ر.س</TableCell>
                        <TableCell>{Number(s.closingFloat || 0).toLocaleString()} ر.س</TableCell>
                        <TableCell className={Number(s.variance || 0) < 0 ? 'text-red-500 font-bold' : ''}>
                          {Number(s.variance || 0).toLocaleString()} ر.س
                        </TableCell>
                        <TableCell>
                          <Badge variant={s.status === 'CLOSED' ? 'default' : 'outline'}>
                            {s.status}
                          </Badge>
                        </TableCell>
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
