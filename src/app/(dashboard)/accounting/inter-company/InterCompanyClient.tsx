'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export function InterCompanyClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [summary, setSummary] = useState<any>({ receivable: 0, payable: 0 });
  const [lines, setLines] = useState<any[]>([]);

  const fetchInterCompanyData = async () => {
    setLoading(true);
    setError(null);
    try {
      // API endpoints usually support ?view=summary or ?view=lines for this route based on its implementation
      const resSummary = await fetch(`/api/accounting/inter-company?view=summary`);
      const resLines = await fetch(`/api/accounting/inter-company?view=lines`);
      
      if (!resSummary.ok || !resLines.ok) {
        if (resSummary.status === 403 || resLines.status === 403 || resSummary.status === 401) {
          throw new Error('Permission denied');
        }
        throw new Error('فشل في جلب بيانات الحسابات المشتركة');
      }
      
      const summaryData = await resSummary.json();
      const linesData = await resLines.json();
      
      setSummary(summaryData);
      setLines(linesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterCompanyData();
  }, []);

  // Compute Dashboard Metrics based on lines
  const totalReceivable = summary.receivable || 0;
  const totalPayable = summary.payable || 0;
  
  // Calculate directly from lines if summary is not detailed enough
  const totalDebtors = lines.reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const unsettledLines = lines.filter(l => l.status === 'PENDING').length;
  
  const netSettlement = totalReceivable - totalPayable;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">محاسبة الشركات الشقيقة (Inter-Company)</h1>
        <div className="space-x-2 space-x-reverse">
          <Button variant="outline" onClick={fetchInterCompanyData} disabled={loading}>
            {loading ? 'جاري التحديث...' : 'تحديث'}
          </Button>
          <Button variant="default" disabled>إنشاء دورة تسوية (Netting)</Button>
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الذمم (Receivables)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{Number(totalReceivable).toLocaleString()} ر.س</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الدائن (Payables)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{Number(totalPayable).toLocaleString()} ر.س</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">صافي التسوية (Net)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${netSettlement < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {Number(netSettlement).toLocaleString()} ر.س
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">حركات غير مسواة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{unsettledLines}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">آخر دورة Netting</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-600">-</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>الحركات البينية (Inter-Company Lines)</CardTitle>
              <CardDescription>تفاصيل قيود وحركات الذمم بين الفروع والشركات</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-10 text-center text-slate-500">جاري تحميل البيانات...</div>
              ) : lines.length === 0 ? (
                <div className="py-10 text-center text-slate-500">لا توجد حركات مسجلة.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الشركة المدينة</TableHead>
                      <TableHead>الشركة الدائنة</TableHead>
                      <TableHead>المرجع</TableHead>
                      <TableHead>الوصف</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>رقم القيد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lines.map((l, i) => (
                      <TableRow key={l.id || i}>
                        <TableCell>{new Date(l.createdAt).toLocaleDateString('ar-SA')}</TableCell>
                        <TableCell className="font-semibold text-blue-700">{l.debtorTenantId}</TableCell>
                        <TableCell className="font-semibold text-blue-700">{l.creditorTenantId}</TableCell>
                        <TableCell>{l.reference || '-'}</TableCell>
                        <TableCell>{l.description || '-'}</TableCell>
                        <TableCell className="font-medium">{Number(l.amount || 0).toLocaleString()} ر.س</TableCell>
                        <TableCell>
                          <Badge variant={l.status === 'NETTED' ? 'default' : 'outline'}>
                            {l.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{l.journalEntryId ? `#${l.journalEntryId}` : '-'}</TableCell>
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
